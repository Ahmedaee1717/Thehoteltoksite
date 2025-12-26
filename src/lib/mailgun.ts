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
  // Anti-spam features
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
  customVariables?: Record<string, string>;
  // Authentication
  requireTLS?: boolean;
  testMode?: boolean;
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
   * Send an email via Mailgun REST API with anti-spam features
   */
  async sendEmail(data: EmailData): Promise<any> {
    try {
      const fromAddress = data.from || `${this.fromName} <${this.fromEmail}>`;
      
      // Create form data
      const formData = new FormData();
      formData.append('from', fromAddress);
      formData.append('to', data.to);
      formData.append('subject', data.subject);
      
      // Add unsubscribe link automatically (CAN-SPAM compliance)
      let htmlContent = data.html;
      let textContent = data.text;
      
      // Generate unsubscribe link
      const unsubscribeLink = `https://investaycapital.pages.dev/unsubscribe?email=${encodeURIComponent(data.to)}`;
      
      if (htmlContent) {
        // Add unsubscribe footer to HTML
        if (!htmlContent.includes('unsubscribe')) {
          htmlContent += `
            <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
              <p>InvestMail - Professional Email Management</p>
              <p>
                <a href="${unsubscribeLink}" style="color: #4CAF50; text-decoration: none;">Unsubscribe</a> | 
                <a href="mailto:support@investaycapital.com" style="color: #4CAF50; text-decoration: none;">Contact Support</a>
              </p>
              <p style="margin-top: 10px; font-size: 11px;">
                InvestMail LLC, 123 Business St, San Francisco, CA 94105
              </p>
            </div>
          `;
        }
        formData.append('html', htmlContent);
      }
      
      if (textContent) {
        // Add unsubscribe footer to plain text
        if (!textContent.includes('unsubscribe')) {
          textContent += `\n\n---\nInvestMail - Professional Email Management\n`;
          textContent += `Unsubscribe: ${unsubscribeLink}\n`;
          textContent += `Contact: support@investaycapital.com\n`;
          textContent += `InvestMail LLC, 123 Business St, San Francisco, CA 94105\n`;
        }
        formData.append('text', textContent);
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

      // Add anti-spam headers
      formData.append('h:X-Mailer', 'InvestMail v1.0');
      formData.append('h:List-Unsubscribe', `<${unsubscribeLink}>`);
      formData.append('h:Precedence', 'bulk');
      
      // Enable DKIM signing (Mailgun handles this automatically)
      formData.append('o:dkim', 'yes');
      
      // Enable tracking
      if (data.trackOpens !== false) {
        formData.append('o:tracking-opens', 'yes');
      }
      
      if (data.trackClicks !== false) {
        formData.append('o:tracking-clicks', 'yes');
      }
      
      // Require TLS (encrypted transport)
      if (data.requireTLS !== false) {
        formData.append('o:require-tls', 'true');
      }
      
      // Add tags for tracking
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => formData.append('o:tag', tag));
      } else {
        formData.append('o:tag', 'investmail-system');
      }
      
      // Add custom variables
      if (data.customVariables) {
        Object.entries(data.customVariables).forEach(([key, value]) => {
          formData.append(`v:${key}`, value);
        });
      }
      
      // Test mode (sandbox mode - emails won't be delivered)
      if (data.testMode) {
        formData.append('o:testmode', 'yes');
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
