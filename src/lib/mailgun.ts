/**
 * Mailgun Email Service
 * Handles sending emails via Mailgun API using native fetch
 */

export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
}

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  region?: 'US' | 'EU';
  fromEmail: string;
  fromName: string;
}

export class MailgunService {
  private apiKey: string;
  private domain: string;
  private fromEmail: string;
  private fromName: string;
  private apiUrl: string;

  constructor(config: MailgunConfig) {
    this.apiKey = config.apiKey;
    this.domain = config.domain;
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.apiUrl = config.region === 'EU' 
      ? 'https://api.eu.mailgun.net/v3' 
      : 'https://api.mailgun.net/v3';
    
    console.log('✅ Mailgun client initialized:', { 
      domain: this.domain, 
      region: config.region || 'US',
      from: `${this.fromName} <${this.fromEmail}>`,
      apiUrl: this.apiUrl
    });
  }

  /**
   * Send an email via Mailgun REST API
   */
  async sendEmail(data: EmailData): Promise<any> {
    try {
      const fromAddress = data.from || `${this.fromName} <${this.fromEmail}>`;
      
      // Create form data
      const formData = new FormData();
      formData.append('from', fromAddress);
      formData.append('to', data.to);
      formData.append('subject', data.subject);
      
      if (data.html) {
        formData.append('html', data.html);
      }
      
      if (data.text) {
        formData.append('text', data.text);
      }

      if (data.replyTo) {
        formData.append('h:Reply-To', data.replyTo);
      }

      if (data.cc) {
        formData.append('cc', data.cc);
      }

      if (data.bcc) {
        formData.append('bcc', data.bcc);
      }

      // Send via Mailgun API
      const response = await fetch(`${this.apiUrl}/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${this.apiKey}`)
        },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Email sent successfully:', result);
        return {
          success: true,
          messageId: result.id,
          message: result.message || 'Queued. Thank you.',
          data: result
        };
      } else {
        console.error('❌ Mailgun API error:', result);
        return {
          success: false,
          error: result.message || 'Failed to send email',
          details: result
        };
      }
    } catch (error: any) {
      console.error('❌ Mailgun send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
        details: error
      };
    }
  }

  /**
   * Send a plain text email
   */
  async sendTextEmail(to: string, subject: string, text: string): Promise<any> {
    return this.sendEmail({ to, subject, text });
  }

  /**
   * Send an HTML email
   */
  async sendHtmlEmail(to: string, subject: string, html: string): Promise<any> {
    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send an email with both plain text and HTML
   */
  async sendMultipartEmail(to: string, subject: string, text: string, html: string): Promise<any> {
    return this.sendEmail({ to, subject, text, html });
  }

  /**
   * Verify domain configuration
   */
  async verifyDomain(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/domains/${this.domain}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${this.apiKey}`)
        }
      });

      const domain = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          domain: domain,
          verified: domain.domain?.state === 'active' || domain.state === 'active'
        };
      } else {
        return {
          success: false,
          error: domain.message || 'Failed to verify domain'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify domain'
      };
    }
  }
}

/**
 * Initialize Mailgun service from environment variables
 */
export function createMailgunService(config: MailgunConfig): MailgunService {
  return new MailgunService(config);
}
