// ATLAS - Live Meeting Transcription Bot
// Powered by Recall.ai
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const atlasBot = new Hono<{ Bindings: CloudflareBindings }>()

// Recall.ai API Configuration
const RECALL_API_URL = 'https://eu-central-1.recall.ai/api/v1'

// ============================================
// START ATLAS BOT
// ============================================
atlasBot.post('/start', async (c) => {
  const { DB, RECALL_API_KEY } = c.env
  
  try {
    const { meeting_url, meeting_id, bot_name } = await c.req.json()
    
    if (!meeting_url && !meeting_id) {
      return c.json({
        success: false,
        error: 'Either meeting_url or meeting_id is required'
      }, 400)
    }
    
    // Construct Zoom URL if only ID provided
    let zoomUrl = meeting_url
    if (!zoomUrl && meeting_id) {
      zoomUrl = `https://zoom.us/j/${meeting_id}`
    }
    
    console.log('🤖 Starting ATLAS bot for meeting:', zoomUrl)
    
    // Create bot via Recall.ai API
    const recallResponse = await fetch(`${RECALL_API_URL}/bot`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meeting_url: zoomUrl,
        bot_name: bot_name || 'ATLAS',
        recording_config: {
          transcript: {
            provider: {
              recallai_streaming: {
                mode: 'prioritize_low_latency',
                language_code: 'en'
              }
            }
          }
        },
        chat: {
          on_bot_join: {
            send_to: 'everyone',
            message: '🤖 ATLAS has joined to provide live transcription and AI insights.'
          }
        },
        automatic_leave: {
          waiting_room_timeout: 600,
          noone_joined_timeout: 600
        }
      })
    })
    
    if (!recallResponse.ok) {
      const errorText = await recallResponse.text()
      console.error('❌ Recall.ai API error:', errorText)
      throw new Error(`Failed to start bot: ${errorText}`)
    }
    
    const botData = await recallResponse.json() as any
    console.log('✅ ATLAS bot created:', botData.id)
    
    // Store bot session in database
    const sessionId = meeting_id || `zoom_${Date.now()}`
    await DB.prepare(`
      INSERT OR REPLACE INTO zoom_meeting_sessions (
        id, zoom_meeting_id, topic, host_id, start_time, status, 
        recording_url, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'live', ?, CURRENT_TIMESTAMP)
    `).bind(
      sessionId,
      meeting_id || sessionId,
      'Live Meeting with ATLAS',
      'atlas_bot',
      JSON.stringify({ bot_id: botData.id, bot_status: 'joining' })
    ).run()
    
    return c.json({
      success: true,
      bot_id: botData.id,
      meeting_id: sessionId,
      status: 'joining',
      message: 'ATLAS is joining your meeting...',
      bot_data: botData
    })
    
  } catch (error: any) {
    console.error('❌ Error starting ATLAS bot:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================
// STOP ATLAS BOT
// ============================================
atlasBot.post('/stop', async (c) => {
  const { RECALL_API_KEY } = c.env
  
  try {
    const { bot_id } = await c.req.json()
    
    if (!bot_id) {
      return c.json({
        success: false,
        error: 'bot_id is required'
      }, 400)
    }
    
    console.log('🛑 Stopping ATLAS bot:', bot_id)
    
    // Stop bot via Recall.ai API
    const recallResponse = await fetch(`${RECALL_API_URL}/bot/${bot_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`
      }
    })
    
    if (!recallResponse.ok) {
      const errorText = await recallResponse.text()
      console.error('❌ Recall.ai API error:', errorText)
      throw new Error(`Failed to stop bot: ${errorText}`)
    }
    
    console.log('✅ ATLAS bot stopped:', bot_id)
    
    return c.json({
      success: true,
      message: 'ATLAS has left the meeting. Transcript saved.',
      bot_id: bot_id
    })
    
  } catch (error: any) {
    console.error('❌ Error stopping ATLAS bot:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================
// GET BOT STATUS
// ============================================
atlasBot.get('/status/:botId', async (c) => {
  const { RECALL_API_KEY } = c.env
  const botId = c.req.param('botId')
  
  try {
    console.log('📊 Getting ATLAS bot status:', botId)
    
    // Get bot status from Recall.ai API
    const recallResponse = await fetch(`${RECALL_API_URL}/bot/${botId}`, {
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`
      }
    })
    
    if (!recallResponse.ok) {
      const errorText = await recallResponse.text()
      console.error('❌ Recall.ai API error:', errorText)
      throw new Error(`Failed to get bot status: ${errorText}`)
    }
    
    const botData = await recallResponse.json() as any
    
    return c.json({
      success: true,
      bot_id: botData.id,
      status: botData.status_changes?.[botData.status_changes.length - 1]?.code || 'unknown',
      meeting_url: botData.meeting_url,
      created_at: botData.created_at,
      bot_data: botData
    })
    
  } catch (error: any) {
    console.error('❌ Error getting ATLAS bot status:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================
// GET REAL-TIME TRANSCRIPT - Poll Recall.ai for transcript data
// ============================================
atlasBot.get('/transcript/:botId', async (c) => {
  const { DB, AI, RECALL_API_KEY } = c.env
  const botId = c.req.param('botId')
  
  try {
    console.log('📝 Fetching transcript for bot:', botId)
    
    // Get transcript from Recall.ai API (updated endpoint)
    // First get the bot to find the transcript ID
    const botResponse = await fetch(`${RECALL_API_URL}/bot/${botId}`, {
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`
      }
    })
    
    if (!botResponse.ok) {
      throw new Error('Failed to get bot details')
    }
    
    const botData = await botResponse.json() as any
    
    // Get transcript ID from recordings
    const transcriptId = botData.recordings?.[0]?.transcript?.id
    
    if (!transcriptId) {
      return c.json({
        success: true,
        bot_id: botId,
        words: 0,
        message: 'No transcript available yet'
      })
    }
    
    // Fetch transcript using new endpoint
    const recallResponse = await fetch(`${RECALL_API_URL}/transcript/${transcriptId}`, {
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`
      }
    })
    
    if (!recallResponse.ok) {
      const errorText = await recallResponse.text()
      console.error('❌ Recall.ai transcript API error:', errorText)
      throw new Error(`Failed to get transcript: ${errorText}`)
    }
    
    const transcriptData = await recallResponse.json() as any
    console.log('✅ Transcript received:', transcriptData?.words?.length || 0, 'words')
    
    // Process transcript words into our database
    if (transcriptData?.words && Array.isArray(transcriptData.words)) {
      // Look up session_id from bot_id
      const meeting = await DB.prepare(`
        SELECT id FROM zoom_meeting_sessions
        WHERE recording_url LIKE ?
        LIMIT 1
      `).bind(`%"bot_id":"${botId}"%`).first() as any
      
      const sessionId = meeting?.id || `bot_${botId}`
      
      // Group words into sentences (every 10 words or at punctuation)
      let currentSentence: any[] = []
      let processedCount = 0
      
      for (const word of transcriptData.words) {
        currentSentence.push(word)
        
        // Create sentence chunk when we hit punctuation or 10 words
        const shouldFlush = word.text?.match(/[.!?]$/) || currentSentence.length >= 10
        
        if (shouldFlush && currentSentence.length > 0) {
          const text = currentSentence.map(w => w.text).join(' ')
          const speaker = currentSentence[0].speaker || 'Unknown'
          const timestamp = currentSentence[0].start_time || Date.now()
          const chunkId = `chunk_${sessionId}_${timestamp}_${Date.now()}`
          
          // Check if chunk already exists
          const existing = await DB.prepare(`
            SELECT id FROM zoom_transcript_chunks WHERE id = ?
          `).bind(chunkId).first()
          
          if (!existing) {
            // Store transcript chunk
            await DB.prepare(`
              INSERT INTO zoom_transcript_chunks (
                id, session_id, speaker_name, speaker_id, text, 
                timestamp_ms, confidence, language, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              chunkId,
              sessionId,
              speaker,
              speaker,
              text,
              timestamp,
              0.95,
              'en'
            ).run()
            
            // Analyze sentiment
            try {
              const sentimentResult = await AI.run('@cf/huggingface/distilbert-sst-2-english', {
                text: text
              }) as any
              
              const sentiment = sentimentResult[0]?.label?.toLowerCase() || 'neutral'
              const confidence = sentimentResult[0]?.score || 0.5
              
              await DB.prepare(`
                INSERT INTO meeting_sentiment_analysis (
                  id, session_id, chunk_id, timestamp_ms, sentiment, 
                  confidence, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `).bind(
                `sentiment_${chunkId}`,
                sessionId,
                chunkId,
                timestamp,
                sentiment,
                confidence
              ).run()
            } catch (sentimentError) {
              console.error('⚠️ Sentiment analysis failed:', sentimentError)
            }
            
            // Update speaker analytics
            const wordCount = currentSentence.length
            await DB.prepare(`
              INSERT INTO speaker_analytics (
                id, session_id, speaker_name, speaker_id, 
                total_talk_time_ms, word_count, sentiment_score, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                total_talk_time_ms = total_talk_time_ms + excluded.total_talk_time_ms,
                word_count = word_count + excluded.word_count,
                updated_at = CURRENT_TIMESTAMP
            `).bind(
              `speaker_${sessionId}_${speaker}`,
              sessionId,
              speaker,
              speaker,
              3000,
              wordCount,
              0.5
            ).run()
            
            processedCount++
          }
          
          currentSentence = []
        }
      }
      
      console.log('✅ Processed', processedCount, 'new transcript chunks')
    }
    
    return c.json({
      success: true,
      bot_id: botId,
      words: transcriptData?.words?.length || 0,
      processed: true
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching transcript:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================
// WEBHOOK - Receive real-time transcripts from Recall.ai
// ============================================
atlasBot.post('/webhook', async (c) => {
  const { DB, AI, RECALL_WEBHOOK_SECRET, PERPLEXITY_API_KEY } = c.env
  
  try {
    // Verify webhook signature
    const signature = c.req.header('x-recall-signature')
    
    // TODO: Implement signature verification
    // For now, we'll accept all webhooks
    
    const webhook = await c.req.json() as any
    console.log('📥 ATLAS webhook received:', webhook.event?.code)
    
    // Handle different webhook events
    switch (webhook.event?.code) {
      case 'bot.connected':
        console.log('🟢 ATLAS connected to meeting')
        break
        
      case 'bot.transcription.word':
        // Real-time word-by-word transcription
        const word = webhook.data?.word
        console.log('💬 Word:', word)
        break
        
      case 'bot.transcription.sentence':
        // Sentence-level transcription (more reliable)
        const sentence = webhook.data
        console.log('📝 Sentence:', sentence?.text)
        
        if (sentence?.text) {
          // Get meeting ID from bot
          const meetingId = webhook.data?.bot_id || 'unknown'
          
          // Look up session_id from bot_id
          const meeting = await DB.prepare(`
            SELECT id FROM zoom_meeting_sessions
            WHERE recording_url LIKE ?
            LIMIT 1
          `).bind(`%"bot_id":"${webhook.data?.bot_id}"%`).first() as any
          
          const sessionId = meeting?.id || meetingId
          
          // Process through existing pipeline
          const chunkId = `chunk_${sessionId}_${Date.now()}`
          const speakerName = sentence.speaker || 'Unknown'
          const text = sentence.text
          const timestamp = Date.now()
          
          // Store transcript chunk
          await DB.prepare(`
            INSERT INTO zoom_transcript_chunks (
              id, session_id, speaker_name, speaker_id, text, 
              timestamp_ms, confidence, language, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            chunkId,
            sessionId,
            speakerName,
            sentence.speaker || speakerName,
            text,
            timestamp,
            sentence.confidence || 0.95,
            'en'
          ).run()
          
          // Analyze sentiment with Cloudflare AI
          try {
            const sentimentResult = await AI.run('@cf/huggingface/distilbert-sst-2-english', {
              text: text
            }) as any
            
            const sentiment = sentimentResult[0]?.label?.toLowerCase() || 'neutral'
            const confidence = sentimentResult[0]?.score || 0.5
            
            // Store sentiment
            await DB.prepare(`
              INSERT INTO meeting_sentiment_analysis (
                id, session_id, chunk_id, timestamp_ms, sentiment, 
                confidence, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              `sentiment_${chunkId}`,
              sessionId,
              chunkId,
              timestamp,
              sentiment,
              confidence
            ).run()
          } catch (sentimentError) {
            console.error('⚠️ Sentiment analysis failed:', sentimentError)
          }
          
          // Update speaker analytics
          const wordCount = text.split(/\s+/).length
          await DB.prepare(`
            INSERT INTO speaker_analytics (
              id, session_id, speaker_name, speaker_id, 
              total_talk_time_ms, word_count, sentiment_score, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              total_talk_time_ms = total_talk_time_ms + excluded.total_talk_time_ms,
              word_count = word_count + excluded.word_count,
              updated_at = CURRENT_TIMESTAMP
          `).bind(
            `speaker_${sessionId}_${speakerName}`,
            sessionId,
            speakerName,
            sentence.speaker || speakerName,
            3000, // Estimate 3 seconds per sentence
            wordCount,
            0.5
          ).run()
          
          console.log('✅ Transcript processed:', chunkId)
        }
        break
        
      case 'bot.disconnected':
        console.log('🔴 ATLAS disconnected from meeting')
        break
        
      default:
        console.log('ℹ️ Unhandled webhook event:', webhook.event?.code)
    }
    
    return c.json({ success: true })
    
  } catch (error: any) {
    console.error('❌ Error processing ATLAS webhook:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default atlasBot
