# AI Awareness Features Guide

## Overview

Investay Capital's blog CMS includes comprehensive **AI Awareness** features designed to optimize content for AI systems, LLMs (Large Language Models), chatbots, and semantic search engines. These features go beyond traditional SEO to ensure your content is easily discoverable, parseable, and quotable by AI assistants.

---

## 🎯 Purpose

Modern content discovery happens through AI assistants (ChatGPT, Claude, Perplexity, etc.) that need structured, semantic data to accurately reference and quote your content. This system ensures:

- **AI Discoverability**: Your content is found by AI systems searching for relevant information
- **Accurate Citation**: AI models can accurately quote and attribute your content
- **Semantic Search**: Users can find your content through natural language queries
- **Knowledge Base Integration**: Your content powers an intelligent Q&A system

---

## 🤖 AI Fields in Database

Each blog post includes the following AI optimization fields:

### 1. **ai_primary_topic** (TEXT)
- **Purpose**: Main topic in 2-4 words
- **Example**: `"hotel tokenization"`, `"room-night infrastructure"`
- **Use Case**: Topic clustering and search relevance

### 2. **ai_key_entities** (JSON Array)
- **Purpose**: 3-5 key entities mentioned in the article
- **Example**: `["Investay Capital", "hotel tokenization", "blockchain infrastructure"]`
- **Use Case**: Entity recognition and knowledge graph building

### 3. **ai_summary** (TEXT)
- **Purpose**: 2-3 sentence neutral summary explaining what the article covers
- **Generated**: Via LLM with compliance guardrails
- **Use Case**: Quick understanding for AI systems and users

### 4. **ai_excerpt** (TEXT)
- **Purpose**: 1-2 sentence quote suitable for AI systems to cite
- **Generated**: Via LLM optimized for quotability
- **Use Case**: Direct AI attribution and social sharing

### 5. **ai_faq** (JSON Array)
- **Purpose**: 4-6 question-answer pairs that help AI understand key concepts
- **Format**: `[{"question": "What is...", "answer": "..."}]`
- **Use Case**: Featured snippets, AI Q&A, voice assistants

### 6. **ai_schema_json** (TEXT)
- **Purpose**: Schema.org JSON-LD structured data (Article + FAQPage)
- **Injected**: Into page `<head>` automatically
- **Use Case**: Search engines, knowledge panels, rich results

### 7. **ai_embedding_vector** (JSON Array of Floats)
- **Purpose**: 1536-dimension vector (OpenAI text-embedding-3-small)
- **Use Case**: Semantic search, similarity matching, RAG (Retrieval-Augmented Generation)

### 8. **ai_last_processed_at** (DATETIME)
- **Purpose**: Timestamp of last AI optimization run
- **Use Case**: Track freshness and trigger re-optimization

### 9. **ai_include_in_knowledge_base** (INTEGER, default: 1)
- **Purpose**: Toggle whether this content powers the AI Q&A system
- **Use Case**: Control which content is used for answering visitor questions

---

## 🔧 Admin Panel Features

### One-Click AI Optimization

**Location**: Admin Dashboard → Edit Post → AI Optimization section

**Button**: 🤖 **One-Click AI Optimization**
- Generates all AI fields in one operation (30-60 seconds)
- Calls OpenAI GPT-4o-mini and text-embedding-3-small
- Includes compliance guardrails (no financial promises, neutral tone)

**Individual Actions** (for granular control):
- **Generate Summary** - Creates ai_summary, ai_excerpt, ai_primary_topic, ai_key_entities
- **Generate FAQ** - Creates 4-6 question-answer pairs
- **Generate Schema** - Creates Schema.org JSON-LD
- **Generate Embedding** - Creates 1536-dimension vector for semantic search

**Knowledge Base Toggle**:
- Checkbox: "Include in Knowledge Base (for AI Q&A)"
- Controls whether this post is used to answer visitor questions

---

## 🔐 Compliance Guardrails

All AI-generated content goes through strict compliance filters to ensure:

### Prohibited Terms
- ❌ "guaranteed returns"
- ❌ Specific yield percentages (e.g., "12% APY")
- ❌ "investment offering"
- ❌ "buy our token"
- ❌ "financial advice"
- ❌ "we promise"
- ❌ "guaranteed profit"

### Tone Enforcement
- ✅ Neutral, factual, descriptive
- ✅ Focus on technology and infrastructure
- ✅ Professional and institutional
- ❌ Promotional or hype-driven
- ❌ Financial guarantees or performance claims

### LLM System Prompts
All AI generation uses system prompts that emphasize:
- Investay Capital is focused on **hotel tokenization infrastructure**
- Content should explain **technology and frameworks** (NOT investment promotion)
- **No financial promises** or performance claims
- Professional, **institutional tone** (think Blackstone, KKR, Brookfield)

---

## 🌐 Public-Facing Features

### 1. JSON-LD Schema Injection

**Automatic**: Every published blog post includes `ai_schema_json` in the page `<head>`

**Benefits**:
- Google Knowledge Panels
- Rich search results
- Voice assistant compatibility
- Social media previews

**Example Schema**:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Hotel Tokenization Infrastructure",
      "author": { "@type": "Organization", "name": "Investay Capital" },
      "publisher": { "@type": "Organization", "name": "Investay Capital" }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is hotel tokenization?",
          "acceptedAnswer": { "@type": "Answer", "text": "..." }
        }
      ]
    }
  ]
}
```

### 2. AI Q&A Endpoint

**Endpoint**: `POST /api/ai-answer`

**Purpose**: Allow visitors (or other systems) to ask questions about your content

**Request**:
```json
{
  "question": "How does hotel tokenization work?"
}
```

**Response**:
```json
{
  "success": true,
  "answer": "Hotel tokenization creates digital representations of room-night inventory...",
  "sources": [
    {
      "title": "Hotel Tokenization: The Next Evolution",
      "url": "/blog/hotel-tokenization-evolution",
      "relevance": 0.89
    }
  ]
}
```

**How It Works**:
1. Question is embedded using OpenAI embeddings
2. Semantic search finds most relevant articles (cosine similarity)
3. Top 3 articles are used as context
4. LLM generates answer using RAG (Retrieval-Augmented Generation)
5. Compliance guardrails applied to answer
6. Source attribution included

---

## ⚙️ Configuration

### Environment Variables

**Required for AI Features**:
- `OPENAI_API_KEY` - Your OpenAI API key

**Setup for Production** (Cloudflare Pages):
```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name webapp
```

**Setup for Local Development**:
Create `.dev.vars` file:
```
OPENAI_API_KEY=sk-...your-key-here...
```

**Never commit** `.dev.vars` to git (already in `.gitignore`)

### Wrangler Configuration

Add to `wrangler.jsonc`:
```jsonc
{
  "name": "webapp",
  // ... existing config ...
  "vars": {
    "OPENAI_API_KEY": "" // Will be overridden by secrets in production
  }
}
```

---

## 📊 Usage Costs

### OpenAI API Costs (as of 2025)

**Text Generation** (gpt-4o-mini):
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens
- **Per Article**: ~$0.01-0.02 (for full optimization)

**Embeddings** (text-embedding-3-small):
- Cost: $0.020 per 1M tokens
- **Per Article**: ~$0.0001

**Total Cost per Article**: **~$0.01-0.03**

### Q&A Endpoint Costs
- **Per Question**: ~$0.001-0.005 (depends on context size)

**Recommendation**: Set up OpenAI usage limits and monitoring

---

## 🚀 Best Practices

### When to Run AI Optimization

✅ **Recommended**:
- After publishing a new article
- After major content updates
- Monthly refresh for evergreen content

❌ **Not Recommended**:
- For every minor edit (to save API costs)
- For draft articles (wait until ready to publish)

### Content Guidelines for Better AI Results

1. **Write Clear, Structured Content**
   - Use H2/H3 headings
   - Short paragraphs (2-3 sentences)
   - Bullet points for key information

2. **Include Key Terms Naturally**
   - Mention "hotel tokenization" in first paragraph
   - Define technical terms
   - Use "Investay Capital" naturally (not every sentence)

3. **Avoid**:
   - Overly promotional language
   - Financial performance claims
   - Jargon without explanation

### Knowledge Base Curation

- **Include**: Educational, evergreen content explaining concepts
- **Exclude**: Time-sensitive announcements, press releases
- **Review**: Periodically audit which posts power the Q&A system

---

## 🔄 Automatic Hooks (Future Enhancement)

**Planned Feature**: Automatic AI optimization on publish/update

```typescript
// Future implementation
async function onPostPublish(postId) {
  // Automatically run AI optimization pipeline
  await optimizeArticle(postId);
}
```

**Current Workaround**: Manually click "One-Click AI Optimization" after publishing

---

## 🐛 Graceful Failure Handling

### What Happens If OpenAI API Fails?

**Admin Panel**:
- Error message shown to user
- Post saves successfully (AI fields remain null)
- User can retry optimization later

**Q&A Endpoint**:
- Returns friendly error: "Unable to process your question at this time."
- Never exposes internal error details to visitors

**Page Rendering**:
- If `ai_schema_json` is null, falls back to default Schema.org markup
- Page still renders normally with standard SEO

### Error Monitoring

Check Cloudflare Workers logs:
```bash
npx wrangler pages deployment tail --project-name webapp
```

Look for:
- `AI optimization error:`
- `AI answer error:`
- `LLM API error:`

---

## 📈 Measuring Impact

### Metrics to Track

1. **AI Discoverability**
   - Monitor ChatGPT/Claude citations of your content
   - Track referral traffic from AI platforms

2. **Search Performance**
   - Google Search Console: Rich results
   - Featured snippets for FAQ content

3. **Q&A Engagement**
   - Log questions to `/api/ai-answer`
   - Track which sources are most cited

---

## 🛠️ Developer Notes

### Database Schema

```sql
-- See migrations/0002_ai_awareness_fields.sql
ALTER TABLE blog_posts ADD COLUMN ai_primary_topic TEXT;
ALTER TABLE blog_posts ADD COLUMN ai_key_entities TEXT;
-- ... etc
```

### API Routes

**Admin Routes** (`/api/ai/*`):
- `POST /api/ai/posts/:id/optimize-all` - Full optimization
- `POST /api/ai/posts/:id/generate-summary` - Summary only
- `POST /api/ai/posts/:id/generate-faq` - FAQ only
- `POST /api/ai/posts/:id/generate-schema` - Schema only
- `POST /api/ai/posts/:id/generate-embedding` - Embedding only
- `PUT /api/ai/posts/:id/toggle-knowledge-base` - Toggle KB inclusion
- `GET /api/ai/posts/:id/ai-status` - Get AI optimization status

**Public Route**:
- `POST /api/ai-answer` - Q&A endpoint

### Service Architecture

```
src/
├── services/
│   └── ai-optimizer.ts      # Core AI logic
├── routes/
│   ├── ai-admin.ts          # Admin API endpoints
│   └── blog.ts              # Public blog routes
└── index.tsx                # Main app with /api/ai-answer
```

---

## ✅ Checklist: Deploying AI Features

- [ ] Set `OPENAI_API_KEY` secret in Cloudflare Pages
- [ ] Apply database migrations (local and production)
- [ ] Deploy updated code to Cloudflare Pages
- [ ] Test AI optimization on a sample post
- [ ] Test Q&A endpoint with a sample question
- [ ] Document internal processes for content team
- [ ] Set up OpenAI usage alerts

---

## 📚 Related Documentation

- [BLOG_ADMIN_GUIDE.md](./BLOG_ADMIN_GUIDE.md) - General blog admin guide
- [README.md](./README.md) - Project overview
- [OpenAI API Docs](https://platform.openai.com/docs) - API reference

---

## 🎓 Training for Content Team

### Quick Start
1. Write article as usual
2. Save as draft
3. Click "One-Click AI Optimization"
4. Wait 30-60 seconds
5. Review AI-generated summary/FAQ
6. Publish

### Tips
- Check "Include in Knowledge Base" for educational content
- Review AI summary for accuracy before publishing
- Use "Generate Summary" first, then FAQ, then embeddings
- Re-run optimization after major edits

---

**Questions?** Contact the development team or see inline code comments in `src/services/ai-optimizer.ts`
