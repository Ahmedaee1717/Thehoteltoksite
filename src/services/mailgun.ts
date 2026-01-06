/**
 * Mailgun Email Service
 * Handles sending emails via Mailgun API
 */

import Mailgun from 'mailgun.js';
import formData from 'form-data';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    data: Buffer | string;
  }>;
}

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  fromEmail: string;
  fromName: string;
}

export class MailgunService {
  private config: MailgunConfig;

  constructor(config: MailgunConfig) {
    this.config = config;
  }

  /**
   * Send an email using Mailgun
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('🚀 Using Mailgun REST API directly (bypassing mailgun.js)');
      
      // Build FormData
      const form = new FormData();
      form.append('from', `${this.config.fromName} <${this.config.fromEmail}>`);
      form.append('to', Array.isArray(options.to) ? options.to.join(',') : options.to);
      form.append('subject', options.subject);
      
      if (options.text) form.append('text', options.text);
      if (options.html) form.append('html', options.html);
      if (options.cc) form.append('cc', Array.isArray(options.cc) ? options.cc.join(',') : options.cc);
      if (options.bcc) form.append('bcc', Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc);
      if (options.replyTo) form.append('h:Reply-To', options.replyTo);
      
      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        console.log(`📎 Adding ${options.attachments.length} attachments to FormData`);
        
        for (let i = 0; i < options.attachments.length; i++) {
          const att = options.attachments[i];
          const isBuffer = att.data instanceof Buffer;
          console.log(`📎 Attachment ${i + 1}: ${att.filename}, isBuffer: ${isBuffer}, size: ${att.data.length}`);
          
          if (isBuffer && att.data.length > 0) {
            // Convert Buffer to Blob
            const blob = new Blob([att.data], { type: 'application/octet-stream' });
            form.append('attachment', blob, att.filename);
            console.log(`✅ Appended ${att.filename} as Blob (${blob.size} bytes)`);
          } else {
            console.error(`❌ Invalid attachment: ${att.filename}`);
          }
        }
      }
      
      // Send via Mailgun REST API
      const url = `https://api.mailgun.net/v3/${this.config.domain}/messages`;
      console.log('📬 POST to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.config.apiKey}`)}`
        },
        body: form
      });
      
      const result = await response.json() as any;
      console.log('📬 Mailgun response:', response.status, JSON.stringify(result));
      
      if (response.ok) {
        console.log('✅ Email sent successfully via REST API!');
        return {
          success: true,
          messageId: result.id
        };
      } else {
        console.error('❌ Mailgun API error:', result);
        return {
          success: false,
          error: result.message || `HTTP ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('❌ Mailgun exception:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a simple text email
   */
  async sendTextEmail(to: string, subject: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({ to, subject, text });
  }

  /**
   * Send an HTML email
   */
  async sendHtmlEmail(to: string, subject: string, html: string, text?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({ to, subject, html, text: text || this.stripHtml(html) });
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Create Mailgun service from environment variables
 */
export function createMailgunService(env: any): MailgunService {
  const config: MailgunConfig = {
    apiKey: env.MAILGUN_API_KEY || '',
    domain: env.MAILGUN_DOMAIN || '',
    fromEmail: env.MAILGUN_FROM_EMAIL || '',
    fromName: env.MAILGUN_FROM_NAME || 'InvestMail',
  };

  // Validate configuration
  if (!config.apiKey || !config.domain || !config.fromEmail) {
    throw new Error('Mailgun configuration is incomplete. Please set MAILGUN_API_KEY, MAILGUN_DOMAIN, and MAILGUN_FROM_EMAIL.');
  }

  return new MailgunService(config);
}
