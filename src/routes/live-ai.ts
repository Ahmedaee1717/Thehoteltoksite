// Live Meeting AI Studio - Backend APIs
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const liveAI = new Hono<{ Bindings: CloudflareBindings }>()

// ===== LIVE TRANSCRIPT & AI INSIGHTS =====

// Get live updates for a meeting (polling endpoint)
liveAI.get('/live-updates', async (c) => {
  const { DB, AI } = c.env
  const meetingId = c.req.query('meeting')
  const since = parseInt(c.req.query('since') || '0')
  
  try {
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
    const { meeting_id, audio_data, timestamp_ms, speaker_id } = await c.req.json()
    
    // Step 1: Transcribe with Cloudflare Whisper
    const transcription = await AI.run('@cf/openai/whisper', {
      audio: audio_data
    }) as any
    
    const text = transcription.text || ''
    const speakerName = transcription.speaker || 'Unknown'
    
    // Step 2: Analyze sentiment with Cloudflare AI
    const sentimentResult = await AI.run('@cf/huggingface/distilbert-sst-2-english', {
      text: text
    }) as any
    
    const sentiment = sentimentResult[0]?.label?.toLowerCase() || 'neutral'
    const sentimentScore = sentimentResult[0]?.score || 0.5
    
    // Step 3: Store transcript chunk
    const chunkId = `chunk_${meeting_id}_${timestamp_ms}`
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
