// Live Meeting AI Studio - Backend APIs
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const liveAI = new Hono<{ Bindings: CloudflareBindings }>()

// ===== DEMO / TESTING ENDPOINTS =====

// Create demo meeting with sample transcript data
liveAI.post('/demo/create', async (c) => {
  const { DB } = c.env
  
  try {
    const meetingId = `demo_${Date.now()}`
    
    // Create demo meeting session
    await DB.prepare(`
      INSERT INTO zoom_meeting_sessions (
        id, zoom_meeting_id, topic, host_id, start_time, status, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'started', CURRENT_TIMESTAMP)
    `).bind(
      meetingId,
      meetingId,
      'Demo: AI-Powered Team Standup',
      'demo_host'
    ).run()
    
    // Sample speakers
    const speakers = [
      { name: 'Alice Chen', id: 'alice_123' },
      { name: 'Bob Martinez', id: 'bob_456' },
      { name: 'Carol Zhang', id: 'carol_789' }
    ]
    
    // Sample transcript chunks with variety
    const sampleChunks = [
      { speaker: speakers[0], text: "Good morning everyone! Let's start our daily standup.", sentiment: 'positive' },
      { speaker: speakers[1], text: "Yesterday I finished the user authentication module.", sentiment: 'positive' },
      { speaker: speakers[0], text: "That's great! Any blockers?", sentiment: 'positive' },
      { speaker: speakers[1], text: "No blockers. Today I'll work on the dashboard.", sentiment: 'neutral' },
      { speaker: speakers[2], text: "I'm struggling with the API integration. Getting timeout errors.", sentiment: 'negative' },
      { speaker: speakers[0], text: "Let me help you debug that after the standup.", sentiment: 'positive' },
      { speaker: speakers[2], text: "Thanks! According to the documentation, the timeout is 30 seconds.", sentiment: 'neutral' },
      { speaker: speakers[1], text: "We had 85% test coverage last sprint. Should we aim for 90% this sprint?", sentiment: 'positive' },
      { speaker: speakers[0], text: "Yes! Our goal is to reach 95% coverage by Q2.", sentiment: 'positive' },
      { speaker: speakers[2], text: "That sounds challenging but achievable.", sentiment: 'neutral' },
    ]
    
    let timestamp = Date.now()
    
    for (let i = 0; i < sampleChunks.length; i++) {
      const chunk = sampleChunks[i]
      const chunkId = `${meetingId}_chunk_${i}`
      
      timestamp += Math.floor(Math.random() * 5000) + 2000 // 2-7 seconds between chunks
      
      // Insert transcript chunk
      await DB.prepare(`
        INSERT INTO zoom_transcript_chunks (
          id, session_id, speaker_name, speaker_id, text, 
          timestamp_ms, confidence, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        chunkId,
        meetingId,
        chunk.speaker.name,
        chunk.speaker.id,
        chunk.text,
        timestamp,
        0.95
      ).run()
      
      // Insert sentiment
      await DB.prepare(`
        INSERT INTO meeting_sentiment_analysis (
          id, session_id, chunk_id, timestamp_ms, sentiment, confidence
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        `sentiment_${chunkId}`,
        meetingId,
        chunkId,
        timestamp,
        chunk.sentiment,
        0.92
      ).run()
      
      // Update speaker analytics
      const wordCount = chunk.text.split(/\s+/).length
      await DB.prepare(`
        INSERT INTO speaker_analytics (
          id, session_id, speaker_name, speaker_id, 
          total_talk_time_ms, word_count, sentiment_score, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          total_talk_time_ms = total_talk_time_ms + excluded.total_talk_time_ms,
          word_count = word_count + excluded.word_count,
          sentiment_score = (sentiment_score + excluded.sentiment_score) / 2,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        `speaker_${meetingId}_${chunk.speaker.name}`,
        meetingId,
        chunk.speaker.name,
        chunk.speaker.id,
        3500, // ~3.5 seconds per chunk
        wordCount,
        chunk.sentiment === 'positive' ? 0.8 : chunk.sentiment === 'negative' ? 0.2 : 0.5
      ).run()
    }
    
    // Add a fact-check example
    await DB.prepare(`
      INSERT INTO meeting_fact_checks (
        id, session_id, chunk_id, claim, verification_status, 
        sources, summary, confidence, checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      `fact_${meetingId}_1`,
      meetingId,
      `${meetingId}_chunk_7`,
      'We had 85% test coverage last sprint',
      'verified',
      JSON.stringify(['https://github.com/your-org/test-reports', 'https://codecov.io/reports']),
      'Verified: Test coverage reports confirm 85% code coverage for Sprint 23.',
      0.95
    ).run()
    
    return c.json({
      success: true,
      meeting_id: meetingId,
      message: 'Demo meeting created with 10 transcript chunks',
      url: `/static/live-meeting-studio.html?meeting=${meetingId}`
    })
  } catch (error: any) {
    console.error('Demo creation error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Simulate live transcript (add chunks gradually)
liveAI.post('/demo/simulate-live', async (c) => {
  const { DB } = c.env
  
  try {
    const { meeting_id } = await c.req.json()
    
    const speakers = [
      { name: 'Alice Chen', id: 'alice_123' },
      { name: 'Bob Martinez', id: 'bob_456' }
    ]
    
    const newChunks = [
      { speaker: speakers[0], text: "Moving on to sprint planning...", sentiment: 'neutral' },
      { speaker: speakers[1], text: "I think we should focus on performance optimization.", sentiment: 'positive' },
      { speaker: speakers[0], text: "Agreed. Let's make that a priority.", sentiment: 'positive' }
    ]
    
    let timestamp = Date.now()
    
    for (let i = 0; i < newChunks.length; i++) {
      const chunk = newChunks[i]
      const chunkId = `${meeting_id}_live_${timestamp}_${i}`
      
      await DB.prepare(`
        INSERT INTO zoom_transcript_chunks (
          id, session_id, speaker_name, speaker_id, text, 
          timestamp_ms, confidence, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        chunkId,
        meeting_id,
        chunk.speaker.name,
        chunk.speaker.id,
        chunk.text,
        timestamp,
        0.95
      ).run()
      
      await DB.prepare(`
        INSERT INTO meeting_sentiment_analysis (
          id, session_id, chunk_id, timestamp_ms, sentiment, confidence
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        `sentiment_${chunkId}`,
        meeting_id,
        chunkId,
        timestamp,
        chunk.sentiment,
        0.92
      ).run()
      
      timestamp += 3000
    }
    
    return c.json({
      success: true,
      chunks_added: newChunks.length
    })
  } catch (error: any) {
    console.error('Live simulation error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ===== LIVE TRANSCRIPT & AI INSIGHTS =====

// Get live updates for a meeting (polling endpoint)
liveAI.get('/live-updates', async (c) => {
  const { DB, AI } = c.env
  let meetingId = c.req.query('meeting')
  const since = parseInt(c.req.query('since') || '0')
  
  try {
    // If meetingId doesn't start with "zoom_" or "demo_", it's a Zoom meeting ID
    // Look up the actual session_id from the database
    if (meetingId && !meetingId.startsWith('zoom_') && !meetingId.startsWith('demo_')) {
      console.log('🔍 Looking up session_id for Zoom meeting ID:', meetingId)
      const meeting = await DB.prepare(`
        SELECT id FROM zoom_meeting_sessions
        WHERE zoom_meeting_id = ?
        LIMIT 1
      `).bind(meetingId).first() as any
      
      if (meeting) {
        meetingId = meeting.id
        console.log('✅ Found session_id:', meetingId)
      } else {
        console.log('❌ Meeting not found in database')
      }
    }
    
    // Get new transcript chunks since last poll
    const transcripts = await DB.prepare(`
      SELECT * FROM zoom_transcript_chunks
      WHERE session_id = ? AND timestamp_ms > ?
      ORDER BY timestamp_ms ASC
    `).bind(meetingId, since).all()
    
    // Get sentiment data
    const sentiment = await DB.prepare(`
      SELECT 
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative
      FROM meeting_sentiment_analysis
      WHERE session_id = ?
    `).bind(meetingId).first()
    
    // Get speaker stats
    const speakers = await DB.prepare(`
      SELECT * FROM speaker_analytics WHERE session_id = ?
    `).bind(meetingId).all()
    
    const speakerData: Record<string, any> = {}
    speakers.results?.forEach((speaker: any) => {
      speakerData[speaker.speaker_name] = {
        talk_time: speaker.total_talk_time_ms,
        word_count: speaker.word_count,
        sentiment: speaker.sentiment_score
      }
    })
    
    return c.json({
      transcripts: transcripts.results || [],
      sentiment: sentiment || { positive: 0, neutral: 0, negative: 0 },
      speakers: speakerData
    })
  } catch (error: any) {
    console.error('Live updates error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Process audio chunk and generate transcript
liveAI.post('/process-audio', async (c) => {
  const { DB, AI, PERPLEXITY_API_KEY } = c.env
  
  try {
    const { meeting_id, audio_data, text_override, timestamp_ms, speaker_id } = await c.req.json()
    
    let text = ''
    let speakerName = 'Unknown'
    
    // Check if we have pre-transcribed text (from Zoom)
    if (text_override) {
      text = text_override
      speakerName = speaker_id || 'Unknown'
      console.log('📝 Using pre-transcribed text from Zoom')
    } else if (audio_data) {
      // Step 1: Transcribe with Cloudflare Whisper
      const transcription = await AI.run('@cf/openai/whisper', {
        audio: audio_data
      }) as any
      
      text = transcription.text || ''
      speakerName = transcription.speaker || 'Unknown'
      console.log('🎤 Transcribed audio with Whisper')
    } else {
      throw new Error('Either audio_data or text_override is required')
    }
    
    // Step 2: Analyze sentiment with Cloudflare AI
    const sentimentResult = await AI.run('@cf/huggingface/distilbert-sst-2-english', {
      text: text
    }) as any
    
    const sentiment = sentimentResult[0]?.label?.toLowerCase() || 'neutral'
    const sentimentScore = sentimentResult[0]?.score || 0.5
    
    // Step 3: Store transcript chunk
    const chunkId = `chunk_${meeting_id}_${timestamp_ms}_${Date.now()}`
    await DB.prepare(`
      INSERT INTO zoom_transcript_chunks (
        id, session_id, speaker_name, speaker_id, text, 
        timestamp_ms, confidence, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      chunkId,
      meeting_id,
      speakerName,
      speaker_id || null,
      text,
      timestamp_ms,
      sentimentScore
    ).run()
    
    // Step 4: Store sentiment analysis
    await DB.prepare(`
      INSERT INTO meeting_sentiment_analysis (
        id, session_id, chunk_id, timestamp_ms, sentiment, 
        confidence, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      `sentiment_${chunkId}`,
      meeting_id,
      chunkId,
      timestamp_ms,
      sentiment,
      sentimentScore
    ).run()
    
    // Step 5: Update speaker analytics
    const wordCount = text.split(/\s+/).length
    await DB.prepare(`
      INSERT INTO speaker_analytics (
        id, session_id, speaker_name, speaker_id, 
        total_talk_time_ms, word_count, sentiment_score, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        total_talk_time_ms = total_talk_time_ms + excluded.total_talk_time_ms,
        word_count = word_count + excluded.word_count,
        sentiment_score = (sentiment_score + excluded.sentiment_score) / 2,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      `speaker_${meeting_id}_${speakerName}`,
      meeting_id,
      speakerName,
      speaker_id || null,
      3000, // Estimate 3 seconds per chunk
      wordCount,
      sentimentScore
    ).run()
    
    // Step 6: Check for factual claims and verify
    if (await containsFactualClaim(text)) {
      await verifyFactWithPerplexity(meeting_id, chunkId, text, PERPLEXITY_API_KEY)
    }
    
    return c.json({
      success: true,
      chunk_id: chunkId,
      text: text,
      sentiment: sentiment,
      speaker: speakerName
    })
  } catch (error: any) {
    console.error('Audio processing error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// AI Co-Pilot endpoint
liveAI.post('/copilot', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env
  
  try {
    const { meeting_id, question } = await c.req.json()
    
    // Get recent transcript for context
    const transcripts = await DB.prepare(`
      SELECT speaker_name, text, timestamp_ms
      FROM zoom_transcript_chunks
      WHERE session_id = ?
      ORDER BY timestamp_ms DESC
      LIMIT 20
    `).bind(meeting_id).all()
    
    const context = transcripts.results?.map((t: any) => 
      `${t.speaker_name}: ${t.text}`
    ).join('\n') || ''
    
    // Call Claude API (via OpenAI-compatible endpoint)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI meeting assistant. You have access to the live meeting transcript and can answer questions about what was said. Be concise and helpful.`
          },
          {
            role: 'user',
            content: `Context from meeting:\n${context}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })
    
    const data = await response.json() as any
    const answer = data.choices[0]?.message?.content || 'Sorry, I could not process that.'
    
    // Store chat history
    await DB.prepare(`
      INSERT INTO copilot_chat_history (
        id, session_id, user_email, message_type, message, 
        timestamp_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      `chat_${meeting_id}_${Date.now()}_q`,
      meeting_id,
      'user@example.com',
      'user',
      question,
      Date.now()
    ).run()
    
    await DB.prepare(`
      INSERT INTO copilot_chat_history (
        id, session_id, user_email, message_type, message, 
        timestamp_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      `chat_${meeting_id}_${Date.now()}_a`,
      meeting_id,
      'user@example.com',
      'assistant',
      answer,
      Date.now()
    ).run()
    
    return c.json({
      success: true,
      answer: answer
    })
  } catch (error: any) {
    console.error('Co-Pilot error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Generate Sparkpage from meeting
liveAI.post('/generate-sparkpage', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env
  
  try {
    const { meeting_id } = await c.req.json()
    
    // Get full transcript
    const transcripts = await DB.prepare(`
      SELECT speaker_name, text, timestamp_ms
      FROM zoom_transcript_chunks
      WHERE session_id = ?
      ORDER BY timestamp_ms ASC
    `).bind(meeting_id).all()
    
    const fullTranscript = transcripts.results?.map((t: any) => 
      `${t.speaker_name}: ${t.text}`
    ).join('\n') || ''
    
    // Generate structured summary with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional meeting summarizer. Create a rich, structured document from meeting transcripts.

Your output should be in Markdown format with:
# Meeting Title (create one based on content)

## Executive Summary
2-3 sentences summarizing the key outcomes

## Key Discussion Points
- Main topic 1 with details
- Main topic 2 with details
- etc.

## Decisions Made
- Decision 1 with rationale
- Decision 2 with rationale

## Action Items
- [ ] Action item 1 - @Owner - Due: Date
- [ ] Action item 2 - @Owner - Due: Date

## Next Steps
What happens next, follow-up meetings, etc.

Make it professional and well-structured.`
          },
          {
            role: 'user',
            content: `Create a Sparkpage from this meeting transcript:\n\n${fullTranscript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })
    
    const data = await response.json() as any
    const sparkpageContent = data.choices[0]?.message?.content || ''
    
    // Extract action items and decisions
    const actionItemsMatch = sparkpageContent.match(/## Action Items\n([\s\S]*?)(?=\n##|$)/)
    const decisionsMatch = sparkpageContent.match(/## Decisions Made\n([\s\S]*?)(?=\n##|$)/)
    
    // Store summary
    const summaryId = `summary_${meeting_id}_${Date.now()}`
    await DB.prepare(`
      INSERT INTO meeting_summaries (
        id, session_id, title, summary_type, content, 
        action_items, decisions, generated_by, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      summaryId,
      meeting_id,
      'Meeting Sparkpage',
      'sparkpage',
      sparkpageContent,
      actionItemsMatch ? actionItemsMatch[1] : null,
      decisionsMatch ? decisionsMatch[1] : null,
      'gpt-4'
    ).run()
    
    return c.json({
      success: true,
      summary_id: summaryId,
      content: sparkpageContent
    })
  } catch (error: any) {
    console.error('Sparkpage generation error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Translate transcript to target language
liveAI.post('/translate', async (c) => {
  const { DB, AI } = c.env
  
  try {
    const { meeting_id, target_language } = await c.req.json()
    
    // Get all transcript chunks
    const transcripts = await DB.prepare(`
      SELECT id, text FROM zoom_transcript_chunks
      WHERE session_id = ?
      ORDER BY timestamp_ms ASC
    `).bind(meeting_id).all()
    
    // Translate each chunk
    const translations = []
    for (const chunk of (transcripts.results || [])) {
      const translationResult = await AI.run('@cf/meta/m2m100-1.2b', {
        text: (chunk as any).text,
        source_lang: 'en',
        target_lang: target_language
      }) as any
      
      const translatedText = translationResult.translated_text || (chunk as any).text
      
      // Store translation
      await DB.prepare(`
        INSERT INTO zoom_transcript_translations (
          id, chunk_id, target_language, translated_text, created_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          translated_text = excluded.translated_text
      `).bind(
        `trans_${(chunk as any).id}_${target_language}`,
        (chunk as any).id,
        target_language,
        translatedText
      ).run()
      
      translations.push({
        chunk_id: (chunk as any).id,
        translated_text: translatedText
      })
    }
    
    return c.json({
      success: true,
      translations: translations
    })
  } catch (error: any) {
    console.error('Translation error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Helper: Check if text contains factual claim
async function containsFactualClaim(text: string): Promise<boolean> {
  // Simple heuristics - can be improved with AI
  const factualIndicators = [
    /\d+%/, // Percentages
    /\$[\d,]+/, // Money amounts
    /\d{4}/, // Years
    /according to/i,
    /studies show/i,
    /research indicates/i,
    /statistic/i,
    /data shows/i,
    /report/i
  ]
  
  return factualIndicators.some(pattern => pattern.test(text))
}

// Helper: Verify fact with Perplexity AI
async function verifyFactWithPerplexity(
  meetingId: string,
  chunkId: string,
  claim: string,
  apiKey?: string
) {
  if (!apiKey) return
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checker. Verify the following claim and provide sources.'
          },
          {
            role: 'user',
            content: `Verify this claim: "${claim}"`
          }
        ]
      })
    })
    
    const data = await response.json() as any
    const verification = data.choices[0]?.message?.content || ''
    
    // Determine verification status
    let status = 'unverified'
    if (verification.toLowerCase().includes('correct') || verification.toLowerCase().includes('true')) {
      status = 'verified'
    } else if (verification.toLowerCase().includes('false') || verification.toLowerCase().includes('incorrect')) {
      status = 'false'
    } else if (verification.toLowerCase().includes('context') || verification.toLowerCase().includes('misleading')) {
      status = 'needs_context'
    }
    
    // Note: We can't access DB here directly, would need to be passed in or refactored
    // For now, this is a placeholder for the architecture
    
    return {
      status,
      summary: verification,
      sources: data.citations || []
    }
  } catch (error) {
    console.error('Fact-check error:', error)
    return null
  }
}

export default liveAI
