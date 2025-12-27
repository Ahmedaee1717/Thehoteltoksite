/**
 * InvestMail - FIXED PREMIUM EMAIL WITH AI
 * Simplified but functional - removed buggy sections
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Loading Fixed Premium Email...');
  
  function initApp() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      setTimeout(initApp, 100);
      return;
    }
    
    const { useState, useEffect } = React;
    const h = React.createElement;
    const user = 'admin@investaycapital.com';
    
    function EmailApp() {
      const [view, setView] = useState('inbox');
      const [emails, setEmails] = useState([]);
      const [loading, setLoading] = useState(false);
      const [showCompose, setShowCompose] = useState(false);
      const [selectedEmail, setSelectedEmail] = useState(null);
      
      useEffect(() => {
        loadData();
      }, [view]);
      
      const loadData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/email?category=${view}&user=${encodeURIComponent(user)}`);
          const data = await res.json();
          setEmails(data.emails || []);
        } catch (error) {
          console.error('Load error:', error);
        } finally {
          setLoading(false);
        }
      };
      
      const sendEmail = async (to, subject, body) => {
        try {
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: user, to, subject, body, useAI: true })
          });
          const result = await response.json();
          
          if (result.success && result.emailSent) {
            alert('✅ Email sent successfully via Mailgun!');
          } else if (result.success && !result.emailSent) {
            alert('⚠️ Email saved but not sent:\n\n' + (result.mailgunError || 'Check Mailgun configuration'));
          } else {
            alert('❌ Failed to send:\n\n' + (result.error || 'Unknown error'));
          }
          
          loadData();
          setShowCompose(false);
        } catch (error) {
          alert('❌ Network error: ' + error.message);
        }
      };
      
      // FIXED COMPOSE MODAL - Simple and working!
      function ComposeModal({ onClose, onSend }) {
        console.log('✅ ComposeModal rendering');
        const [to, setTo] = useState('');
        const [subject, setSubject] = useState('');
        const [body, setBody] = useState('');
        const [aiProcessing, setAiProcessing] = useState(false);
        const [showAiTools, setShowAiTools] = useState(false);
        const [aiPrompt, setAiPrompt] = useState('');
        
        const handleAIAssist = async (action) => {
          if (!body.trim() && action !== 'generate') {
            alert('✍️ Please write some text first!');
            return;
          }
          
          setAiProcessing(true);
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/email/compose-assist', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                action,
                text: body,
                context: subject
              })
            });
            
            const data = await response.json();
            if (data.success) {
              setBody(data.text);
            } else {
              alert('❌ AI assist failed: ' + data.error);
            }
          } catch (error) {
            alert('❌ AI error: ' + error.message);
          } finally {
            setAiProcessing(false);
          }
        };
        
        const handleGenerateFromPrompt = async () => {
          if (!aiPrompt.trim()) {
            alert('💡 Please enter what you want the email to say!');
            return;
          }
          
          setAiProcessing(true);
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/email/compose-assist', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                action: 'generate',
                text: aiPrompt,
                context: subject
              })
            });
            
            const data = await response.json();
            if (data.success) {
              setBody(data.text);
              setAiPrompt('');
            } else {
              alert('❌ AI generation failed: ' + data.error);
            }
          } catch (error) {
            alert('❌ AI error: ' + error.message);
          } finally {
            setAiProcessing(false);
          }
        };
        
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
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }
        },
          h('div', {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.95) 0%, rgba(15, 20, 41, 0.95) 100%)',
              backdropFilter: 'blur(40px)',
              borderRadius: '24px',
              padding: '32px',
              width: '700px',
              maxWidth: '90%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
            }
          },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '28px'
              }
            },
              h('h2', { 
                style: { 
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #C9A962 0%, #f5e6d3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                } 
              }, '✍️ Compose New Email'),
              h('button', {
                onClick: onClose,
                style: {
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '18px'
                }
              }, '✕')
            ),
            
            h('div', { style: { marginBottom: '16px' } },
              h('label', {
                style: {
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }
              }, 'To'),
              h('input', {
                type: 'text',
                placeholder: 'recipient@email.com',
                value: to,
                onChange: (e) => setTo(e.target.value),
                style: {
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: 'inherit',
                  outline: 'none'
                }
              })
            ),
            
            h('div', { style: { marginBottom: '16px' } },
              h('label', {
                style: {
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }
              }, 'Subject'),
              h('input', {
                type: 'text',
                placeholder: 'Enter email subject',
                value: subject,
                onChange: (e) => setSubject(e.target.value),
                style: {
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: 'inherit',
                  outline: 'none'
                }
              })
            ),
            
            h('div', { style: { marginBottom: '24px' } },
              h('label', {
                style: {
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }
              }, 'Message'),
              h('textarea', {
                placeholder: 'Write your message here...',
                value: body,
                onChange: (e) => setBody(e.target.value),
                style: {
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: 'inherit',
                  minHeight: '200px',
                  resize: 'vertical',
                  outline: 'none'
                }
              })
            ),
            
            // AI TOOLS
            h('div', {
              style: {
                marginBottom: '24px',
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                borderRadius: '12px'
              }
            },
              h('button', {
                onClick: () => setShowAiTools(!showAiTools),
                disabled: aiProcessing,
                style: {
                  width: '100%',
                  padding: '10px 16px',
                  background: showAiTools 
                    ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }
              }, showAiTools ? '🤖 Hide AI Tools' : '🤖 Show AI Tools'),
              
              showAiTools && h('div', { style: { marginTop: '12px' } },
                // Generate from prompt
                h('div', {
                  style: {
                    marginBottom: '16px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(79, 70, 229, 0.15) 100%)',
                    border: '2px solid rgba(147, 51, 234, 0.4)',
                    borderRadius: '12px'
                  }
                },
                  h('div', {
                    style: {
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(147, 51, 234, 0.9)',
                      marginBottom: '10px'
                    }
                  }, '✨ Generate Full Email'),
                  h('input', {
                    type: 'text',
                    placeholder: 'e.g., "Schedule meeting tomorrow about Q4 budget"',
                    value: aiPrompt,
                    onChange: (e) => setAiPrompt(e.target.value),
                    onKeyPress: (e) => e.key === 'Enter' && !aiProcessing && handleGenerateFromPrompt(),
                    disabled: aiProcessing,
                    style: {
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(147, 51, 234, 0.3)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      marginBottom: '10px',
                      outline: 'none'
                    }
                  }),
                  h('button', {
                    onClick: handleGenerateFromPrompt,
                    disabled: aiProcessing || !aiPrompt.trim(),
                    style: {
                      width: '100%',
                      padding: '10px',
                      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(79, 70, 229, 0.3) 100%)',
                      border: '1px solid rgba(147, 51, 234, 0.5)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: aiProcessing || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                      opacity: aiProcessing || !aiPrompt.trim() ? 0.5 : 1
                    }
                  }, aiProcessing ? '⏳ Generating...' : '✨ Generate Email')
                ),
                
                // Enhance text buttons
                h('div', {
                  style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '10px'
                  }
                }, 'Or enhance existing text:'),
                h('div', {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px'
                  }
                },
                  h('button', {
                    onClick: () => handleAIAssist('improve'),
                    disabled: aiProcessing,
                    style: {
                      padding: '8px 12px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '6px',
                      color: 'rgba(34, 197, 94, 0.9)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: aiProcessing ? 'not-allowed' : 'pointer'
                    }
                  }, aiProcessing ? '⏳' : '✅ Improve'),
                  h('button', {
                    onClick: () => handleAIAssist('expand'),
                    disabled: aiProcessing,
                    style: {
                      padding: '8px 12px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      color: 'rgba(59, 130, 246, 0.9)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: aiProcessing ? 'not-allowed' : 'pointer'
                    }
                  }, aiProcessing ? '⏳' : '📝 Expand'),
                  h('button', {
                    onClick: () => handleAIAssist('summarize'),
                    disabled: aiProcessing,
                    style: {
                      padding: '8px 12px',
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '6px',
                      color: 'rgba(251, 191, 36, 0.9)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: aiProcessing ? 'not-allowed' : 'pointer'
                    }
                  }, aiProcessing ? '⏳' : '📊 Shorten')
                )
              )
            ),
            
            // Send/Cancel buttons
            h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
              h('button', {
                onClick: onClose,
                style: {
                  padding: '14px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '15px'
                }
              }, 'Cancel'),
              h('button', {
                onClick: handleSend,
                style: {
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 8px 24px rgba(201, 169, 98, 0.4)'
                }
              }, '🚀 Send Email')
            )
          )
        );
      }
      
      // Main app render... (continuing in next section due to length)
