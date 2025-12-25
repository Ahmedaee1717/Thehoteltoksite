/**
 * InvestMail - Complete Email Client with All Folders
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking for React...');
  
  function initApp() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      console.log('React not loaded yet, waiting...');
      setTimeout(initApp, 100);
      return;
    }
    
    console.log('React loaded! Initializing app...');
    
    const { useState, useEffect } = React;
    const h = React.createElement;
    
    const user = 'admin@investaycapital.com';
    
    function EmailApp() {
      const [view, setView] = useState('inbox');
      const [emails, setEmails] = useState([]);
      const [loading, setLoading] = useState(false);
      const [showCompose, setShowCompose] = useState(false);
      
      useEffect(() => {
        loadData();
      }, [view]);
      
      const loadData = async () => {
        setLoading(true);
        try {
          let url = '';
          if (view === 'inbox') url = `/api/email/inbox?user=${user}`;
          else if (view === 'sent') url = `/api/email/sent?user=${user}`;
          else if (view === 'spam') url = `/api/email/spam?user=${user}`;
          else if (view === 'trash') url = `/api/email/trash?user=${user}`;
          else if (view === 'drafts') url = `/api/email/drafts?user=${user}`;
          else if (view === 'archived') url = `/api/email/archived?user=${user}`;
          
          if (url) {
            const response = await fetch(url);
            const data = await response.json();
            setEmails(data.emails || data.drafts || []);
          }
        } catch (error) {
          console.error('Load error:', error);
        }
        setLoading(false);
      };
      
      const sendEmail = async (to, subject, body) => {
        try {
          console.log('Sending email:', { from: user, to, subject, body });
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: user, to, subject, body, useAI: true })
          });
          const result = await response.json();
          console.log('Send result:', result);
          
          if (result.success && result.emailSent) {
            alert('✅ Email sent successfully via Mailgun!\\n\\nMessage ID: ' + result.messageId);
          } else if (result.success && !result.emailSent) {
            alert('⚠️ Email saved but not sent:\\n\\n' + (result.mailgunError || 'Check Mailgun configuration'));
          } else {
            alert('❌ Failed to send:\\n\\n' + (result.error || 'Unknown error'));
          }
          
          loadData();
          setShowCompose(false);
        } catch (error) {
          console.error('Send error:', error);
          alert('❌ Network error: ' + error.message);
        }
      };
      
      return h('div', { style: { display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' } },
        // Sidebar
        h('div', { 
          style: { 
            width: '260px', 
            background: 'linear-gradient(180deg, #1a1d29 0%, #252938 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
          }
        },
          h('div', { style: { padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' } },
            h('div', { style: { fontSize: '18px', fontWeight: '700' } }, '◆ InvestMail')
          ),
          
          h('nav', { style: { flex: 1, padding: '20px 12px', overflowY: 'auto' } },
            [
              { id: 'inbox', icon: '📧', label: 'Inbox' },
              { id: 'sent', icon: '📤', label: 'Sent' },
              { id: 'drafts', icon: '📝', label: 'Drafts' },
              { id: 'spam', icon: '🚫', label: 'Spam' },
              { id: 'trash', icon: '🗑️', label: 'Trash' },
              { id: 'archived', icon: '📦', label: 'Archive' }
            ].map(item =>
              h('button', {
                key: item.id,
                onClick: () => setView(item.id),
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  marginBottom: '4px',
                  background: view === item.id ? 'rgba(201,169,98,0.2)' : 'none',
                  border: 'none',
                  color: view === item.id ? '#C9A962' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }
              },
                h('span', { style: { fontSize: '18px' } }, item.icon),
                h('span', null, item.label)
              )
            )
          )
        ),
        
        // Main Content
        h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', background: 'white' } },
          // Top Bar
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb'
            }
          },
            h('h1', { style: { fontSize: '24px', fontWeight: '700', margin: 0 } },
              view === 'inbox' ? 'Inbox' :
              view === 'sent' ? 'Sent Mail' :
              view === 'drafts' ? 'Drafts' :
              view === 'spam' ? 'Spam' :
              view === 'trash' ? 'Trash' :
              view === 'archived' ? 'Archive' :
              'InvestMail'
            ),
            h('button', {
              onClick: () => setShowCompose(true),
              style: {
                padding: '10px 20px',
                background: '#C9A962',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }
            }, '✉ Compose')
          ),
          
          // Email List
          h('div', { style: { flex: 1, overflow: 'auto', padding: '24px' } },
            loading ? h('div', { style: { textAlign: 'center', padding: '40px', color: '#6b7280' } }, 'Loading...') :
            emails.length === 0 ? h('div', { style: { textAlign: 'center', padding: '40px' } },
              h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📭'),
              h('h3', { style: { marginBottom: '8px', color: '#1f2937' } }, 'No emails'),
              h('p', { style: { color: '#6b7280' } }, 
                view === 'sent' ? 'You haven\'t sent any emails yet' : 'This folder is empty'
              )
            ) : h('div', { style: { display: 'grid', gap: '12px' } },
              emails.map((email, i) =>
                h('div', {
                  key: email.id || i,
                  style: {
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'white'
                  }
                },
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
                    h('div', { style: { fontWeight: '600', color: '#1f2937' } },
                      view === 'sent' ? `To: ${email.to_email}` : `From: ${email.from_email || email.from_name || 'Unknown'}`
                    ),
                    h('div', { style: { fontSize: '12px', color: '#6b7280' } },
                      new Date(email.sent_at || email.received_at || email.created_at).toLocaleString()
                    )
                  ),
                  h('div', { style: { fontWeight: '600', marginBottom: '4px', color: '#374151' } }, email.subject),
                  h('div', { style: { fontSize: '14px', color: '#6b7280' } }, email.snippet || email.body_text || '')
                )
              )
            )
          )
        ),
        
        // Compose Modal
        showCompose && h(ComposeModal, {
          onClose: () => setShowCompose(false),
          onSend: sendEmail
        })
      );
    }
    
    function ComposeModal({ onClose, onSend }) {
      const [to, setTo] = useState('');
      const [subject, setSubject] = useState('');
      const [body, setBody] = useState('');
      
      const handleSend = () => {
        if (!to || !subject) {
          alert('Please fill recipient and subject');
          return;
        }
        onSend(to, subject, body);
      };
      
      return h('div', {
        onClick: onClose,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }
      },
        h('div', {
          onClick: (e) => e.stopPropagation(),
          style: {
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '600px',
            maxWidth: '90%'
          }
        },
          h('h2', { style: { margin: '0 0 20px 0' } }, 'Compose Email'),
          h('input', {
            type: 'text',
            placeholder: 'To: ahmed.enin@virgingates.com',
            value: to,
            onChange: (e) => setTo(e.target.value),
            style: {
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }
          }),
          h('input', {
            type: 'text',
            placeholder: 'Subject',
            value: subject,
            onChange: (e) => setSubject(e.target.value),
            style: {
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }
          }),
          h('textarea', {
            placeholder: 'Message',
            value: body,
            onChange: (e) => setBody(e.target.value),
            style: {
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              minHeight: '200px',
              fontFamily: 'Inter, sans-serif',
              resize: 'vertical'
            }
          }),
          h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
            h('button', {
              onClick: onClose,
              style: {
                padding: '10px 20px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }
            }, 'Cancel'),
            h('button', {
              onClick: handleSend,
              style: {
                padding: '10px 20px',
                background: '#C9A962',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }
            }, 'Send')
          )
        )
      );
    }
    
    console.log('Rendering EmailApp...');
    const root = ReactDOM.createRoot(document.getElementById('email-root'));
    root.render(h(EmailApp));
    console.log('App rendered successfully!');
  }
  
  initApp();
});
