// Test script to debug attachment sending
const testAttachment = async () => {
  const apiUrl = 'https://www.investaycapital.com/api/email/send';
  
  // Create a simple test attachment (base64 encoded "Hello World" text)
  const testData = Buffer.from('Hello World from test attachment').toString('base64');
  
  const payload = {
    from: 'test1@investaycapital.com',
    to: 'ahmed.enin@virgingates.com',
    subject: 'Test Attachment Debug',
    body: 'This is a test email to debug attachments',
    useAI: false,
    attachments: [
      {
        filename: 'test.txt',
        content_type: 'text/plain',
        size: 33,
        data: testData,
        isLocalFile: true
      }
    ]
  };
  
  console.log('📤 Sending test email with attachment...');
  console.log('Attachment data length:', testData.length);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('✅ Response:', result);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testAttachment();
