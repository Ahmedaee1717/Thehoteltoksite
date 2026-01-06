export interface CloudflareBindings {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  OPENAI_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_REGION?: string;
  MAILGUN_FROM_EMAIL?: string;
  MAILGUN_FROM_NAME?: string;
  JWT_SECRET?: string;
}
