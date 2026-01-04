// Test Mailgun API - Send email directly through Mailgun
// This bypasses Gmail and tests the entire flow

export default {
  async fetch(request, env) {
    const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = env;
    
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return new Response(JSON.stringify({
        error: 'Missing Mailgun credentials',
        hasApiKey: !!MAILGUN_API_KEY,
        hasDomain: !!MAILGUN_DOMAIN
      }), { status: 500 });
    }

    try {
      // Send test email via Mailgun API
      const formData = new FormData();
      formData.append('from', `Test <test@${MAILGUN_DOMAIN}>`);
      formData.append('to', 'test1@investaycapital.com');
      formData.append('subject', `API Test ${new Date().toISOString()}`);
      formData.append('text', 'This email was sent directly via Mailgun API to test the entire flow.');
      formData.append('html', '<p>This email was sent directly via <strong>Mailgun API</strong> to test the entire flow.</p>');

      const region = env.MAILGUN_REGION === 'EU' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
      const url = `https://${region}/v3/${MAILGUN_DOMAIN}/messages`;
      
      console.log('🚀 Sending via Mailgun API:', {
        url,
        domain: MAILGUN_DOMAIN,
        to: 'test1@investaycapital.com'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${MAILGUN_API_KEY}`)
        },
        body: formData
      });

      const result = await response.text();
      
      console.log('📧 Mailgun Response:', {
        status: response.status,
        ok: response.ok,
        body: result
      });

      if (!response.ok) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Mailgun API error',
          status: response.status,
          body: result
        }), { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const mailgunResult = JSON.parse(result);

      return new Response(JSON.stringify({
        success: true,
        message: 'Email sent via Mailgun API',
        mailgun: mailgunResult,
        instructions: 'Check test1@investaycapital.com inbox at https://www.investaycapital.com/mail'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
