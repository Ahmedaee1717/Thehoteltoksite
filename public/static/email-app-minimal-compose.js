/**
 * Minimal Compose Modal - Testing
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Minimal Compose Test Loading...');
  
  function initApp() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      setTimeout(initApp, 100);
      return;
    }
    
    const { useState } = React;
    const h = React.createElement;
    
    function MinimalEmailApp() {
      const [showCompose, setShowCompose] = useState(false);
      
      function ComposeModal({ onClose, onSend }) {
        console.log('✅ ComposeModal rendering');
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
        
        console.log('✅ ComposeModal returning JSX');
        return h('div', {
          onClick: onClose,
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }
        },
          h('div', {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1429 100%)',
              borderRadius: '24px',
              padding: '32px',
              width: '600px',
              maxWidth: '90%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
            }
          },
            h('h2', { 
              style: { 
                margin: '0 0 24px 0',
                color: '#C9A962',
                fontSize: '24px'
              } 
            }, '✍️ Compose Email'),
            
            h('div', { style: { marginBottom: '16px' } },
              h('label', {
                style: {
                  display: 'block',
                  marginBottom: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: '600'
                }
              }, 'TO'),
              h('input', {
                type: 'text',
                placeholder: 'recipient@email.com',
                value: to,
                onChange: (e) => setTo(e.target.value),
                style: {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none'
                }
              })
            ),
            
            h('div', { style: { marginBottom: '16px' } },
              h('label', {
                style: {
                  display: 'block',
                  marginBottom: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: '600'
                }
              }, 'SUBJECT'),
              h('input', {
                type: 'text',
                placeholder: 'Email subject',
                value: subject,
                onChange: (e) => setSubject(e.target.value),
                style: {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none'
                }
              })
            ),
            
            h('div', { style: { marginBottom: '24px' } },
              h('label', {
                style: {
                  display: 'block',
                  marginBottom: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: '600'
                }
              }, 'MESSAGE'),
              h('textarea', {
                placeholder: 'Write your message here...',
                value: body,
                onChange: (e) => setBody(e.target.value),
                style: {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px',
                  minHeight: '150px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none'
                }
              })
            ),
            
            h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
              h('button', {
                onClick: onClose,
                style: {
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '15px'
                }
              }, 'Cancel'),
              h('button', {
                onClick: handleSend,
                style: {
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 4px 16px rgba(201, 169, 98, 0.4)'
                }
              }, '🚀 Send')
            )
          )
        );
      }
      
      const sendEmail = async (to, subject, body) => {
        alert(`Sending email to: ${to}\nSubject: ${subject}`);
        setShowCompose(false);
      };
      
      return h('div', {
        style: {
          background: 'linear-gradient(180deg, #0f1429 0%, #1a1f3a 100%)',
          minHeight: '100vh',
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }
      },
        h('h1', { style: { color: '#C9A962', marginBottom: '24px' } }, 'Minimal Compose Test'),
        h('button', {
          onClick: () => setShowCompose(true),
          style: {
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(201, 169, 98, 0.4)'
          }
        }, '✍️ Compose New Email'),
        
        showCompose && h(ComposeModal, {
          onClose: () => setShowCompose(false),
          onSend: sendEmail
        })
      );
    }
    
    console.log('🎨 Rendering app...');
    ReactDOM.render(h(MinimalEmailApp), document.getElementById('root'));
    console.log('✅ App rendered!');
  }
  
  initApp();
});
