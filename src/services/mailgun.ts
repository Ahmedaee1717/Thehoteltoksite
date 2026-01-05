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
      const mailgun = new Mailgun(formData);
      const client = mailgun.client({
        username: 'api',
        key: this.config.apiKey,
      });

      // Prepare email data
      const emailData: any = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
      };

      // Add optional fields
      if (options.text) emailData.text = options.text;
      if (options.html) emailData.html = options.html;
      if (options.cc) emailData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      if (options.bcc) emailData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      if (options.replyTo) emailData['h:Reply-To'] = options.replyTo;

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        console.log(`📎 Mailgun: Adding ${options.attachments.length} attachments`);
        emailData.attachment = options.attachments.map((att, idx) => {
          console.log(`📎 Mailgun attachment ${idx + 1}: ${att.filename} (${att.data instanceof Buffer ? att.data.length : att.data?.length} bytes)`);
          return {
            filename: att.filename,
            data: att.data,
          };
        });
        console.log('📎 Mailgun: Attachments prepared for send');
      } else {
        console.log('📎 Mailgun: No attachments to add');
      }

      // Send email
      const response = await client.messages.create(this.config.domain, emailData);

      return {
        success: true,
        messageId: response.id,
      };
    } catch (error: any) {
      console.error('Mailgun send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
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
