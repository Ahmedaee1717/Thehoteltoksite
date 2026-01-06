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
  // Attachments support
  attachments?: Array<{
    filename: string;
    data: Buffer | string;
  }>;
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
      
      // 📎 ADD ATTACHMENTS SUPPORT
      if (data.attachments && data.attachments.length > 0) {
        console.log(`📎 [lib/mailgun] Adding ${data.attachments.length} attachments`);
        
        for (let i = 0; i < data.attachments.length; i++) {
          const att = data.attachments[i];
          const isBuffer = att.data instanceof Buffer;
          
          console.log(`📎 [lib/mailgun] Attachment ${i + 1}: ${att.filename}, isBuffer: ${isBuffer}, size: ${att.data?.length || 0}`);
          
          if (isBuffer && att.data.length > 0) {
            // Convert Buffer to Blob for FormData
            const blob = new Blob([att.data], { type: 'application/octet-stream' });
            formData.append('attachment', blob, att.filename);
            console.log(`✅ [lib/mailgun] Appended ${att.filename} (${blob.size} bytes)`);
          } else {
            console.error(`❌ [lib/mailgun] Invalid attachment: ${att.filename}`);
          }
        }
      }

      // Send via Mailgun API
      const response = await fetch(`${this.apiUrl}/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${this.apiKey}`)
        },
        body: formData
      });

      // Handle response - might not always be JSON
      let result: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Not JSON - likely an error message as text
        const text = await response.text();
        result = { message: text };
      }
      
      if (response.ok) {
        console.log('✅ Email sent successfully:', result);
        return {
          success: true,
          messageId: result.id,
          message: result.message || 'Queued. Thank you.',
          data: result
        };
      } else {
        console.error('❌ Mailgun API error:', response.status, result);
        
        // Provide helpful error messages
        let errorMessage = result.message || 'Failed to send email';
        
        if (response.status === 403 || response.status === 401) {
          errorMessage = `🔐 Mailgun Authentication Error (${response.status}):\n\n` +
            `Current Config:\n` +
            `- Domain: ${this.domain}\n` +
            `- From: ${this.fromEmail}\n` +
            `- API URL: ${this.apiUrl}\n\n` +
            `Possible causes:\n` +
            `1. API key is incorrect or expired\n` +
            `2. API key doesn't have 'Mail Send' permission\n` +
            `3. Wrong region (US vs EU)\n` +
            `4. Domain ownership not verified in Mailgun account\n\n` +
            `Please check:\n` +
            `- Mailgun dashboard: https://app.mailgun.com/app/sending/domains\n` +
            `- API keys: https://app.mailgun.com/app/account/security/api_keys\n` +
            `- Make sure domain shows as 'Active' with green checkmark`;
        } else if (response.status === 404) {
          errorMessage = `Domain "${this.domain}" not found in Mailgun account. Please add it first.`;
        }
        
        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
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
