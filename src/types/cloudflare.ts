export interface CloudflareBindings {
  DB: D1Database;
  AI: any;
  R2_BUCKET: R2Bucket;
  OPENAI_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_REGION?: string;
  MAILGUN_FROM_EMAIL?: string;
  MAILGUN_FROM_NAME?: string;
  JWT_SECRET?: string;
  RECALL_API_KEY?: string;
  RECALL_WEBHOOK_SECRET?: string;
  RECALL_API_REGION?: string;
}
