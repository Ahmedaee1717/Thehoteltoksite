/**
 * InvestMail - ULTRA PREMIUM DARK MODE EMAIL SYSTEM
 * The most impressive email client you've ever seen
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Premium InvestMail...');
  
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
      const [tasks, setTasks] = useState([]);
      const [contacts, setContacts] = useState([]);
      const [deals, setDeals] = useState([]);
      const [loading, setLoading] = useState(false);
      const [showCompose, setShowCompose] = useState(false);
      const [selectedEmail, setSelectedEmail] = useState(null);
      const [hoveredNav, setHoveredNav] = useState(null);
      const [showCollabPanel, setShowCollabPanel] = useState(false);
      const [comments, setComments] = useState([]);
      const [collabStats, setCollabStats] = useState(null);
      const [newComment, setNewComment] = useState('');
      const [readStatuses, setReadStatuses] = useState({});
      
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
            const fetchedEmails = data.emails || data.drafts || [];
            setEmails(fetchedEmails);
            
            // Load read statuses for sent emails
            if (view === 'sent' && fetchedEmails.length > 0) {
              const emailIds = fetchedEmails.map(e => e.id);
              loadReadStatuses(emailIds);
            }
          }
          
          // Load CRM data
          if (view === 'crm') {
            const [contactsRes, dealsRes] = await Promise.all([
              fetch(`/api/crm/contacts?user=${user}`),
              fetch(`/api/crm/deals?user=${user}`)
            ]);
            const contactsData = await contactsRes.json();
            const dealsData = await dealsRes.json();
            setContacts(contactsData.contacts || []);
            setDeals(dealsData.deals || []);
          }
          
          // Load Tasks data
          if (view === 'tasks') {
            const tasksRes = await fetch(`/api/tasks?user=${user}`);
            const tasksData = await tasksRes.json();
            setTasks(tasksData.tasks || []);
          }
        } catch (error) {
          console.error('Load error:', error);
        }
        setLoading(false);
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
            alert('✅ Email sent successfully via Mailgun!\n\nMessage ID: ' + result.messageId);
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
      
      const loadCollabData = async (emailId) => {
        try {
          const [commentsRes, statsRes] = await Promise.all([
            fetch(`/api/collaboration/comments/${emailId}`),
            fetch(`/api/collaboration/stats/${emailId}`)
          ]);
          const commentsData = await commentsRes.json();
          const statsData = await statsRes.json();
          setComments(commentsData.comments || []);
          setCollabStats(statsData.stats || {});
        } catch (error) {
          console.error('Load collab error:', error);
        }
      };
      
      const loadReadStatuses = async (emailIds) => {
        try {
          const statuses = {};
          await Promise.all(
            emailIds.map(async (id) => {
              const res = await fetch(`/api/email/${id}/read-status`);
              const data = await res.json();
              if (data.success) {
                statuses[id] = data;
              }
            })
          );
          setReadStatuses(statuses);
        } catch (error) {
          console.error('Load read statuses error:', error);
        }
      };
      
      const addComment = async () => {
        if (!newComment.trim() || !selectedEmail) return;
        try {
          const res = await fetch('/api/collaboration/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email_id: selectedEmail.id,
              author_email: user,
              author_name: 'Admin',
              comment_text: newComment
            })
          });
          const result = await res.json();
          if (result.success) {
            setNewComment('');
            loadCollabData(selectedEmail.id);
          }
        } catch (error) {
          console.error('Add comment error:', error);
        }
      };
      
      const navItems = [
        { id: 'inbox', icon: '📧', label: 'Inbox', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { id: 'sent', icon: '📤', label: 'Sent', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { id: 'drafts', icon: '📝', label: 'Drafts', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { id: 'spam', icon: '🚫', label: 'Spam', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
        { id: 'trash', icon: '🗑️', label: 'Trash', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
        { id: 'archived', icon: '📦', label: 'Archive', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
        { id: 'tasks', icon: '✅', label: 'Tasks', gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
        { id: 'crm', icon: '👥', label: 'CRM', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
        { id: 'analytics', icon: '📊', label: 'Analytics', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
        { id: 'team', icon: '👔', label: 'Team', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
      ];
      
      return h('div', { 
        style: { 
          display: 'flex', 
          height: '100vh', 
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: '#0a0e27',
          overflow: 'hidden'
        } 
      },
        // Ultra Premium Sidebar
        h('div', { 
          style: { 
            width: '300px',
            background: 'linear-gradient(180deg, #0f1429 0%, #1a1f3a 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
          }
        },
          // Animated Background Glow
          h('div', {
            style: {
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle at 50% 50%, rgba(201, 169, 98, 0.03) 0%, transparent 50%)',
              animation: 'pulse 4s ease-in-out infinite',
              pointerEvents: 'none'
            }
          }),
          
          // Premium Header
          h('div', { 
            style: { 
              padding: '32px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative',
              zIndex: 1
            } 
          },
            h('div', { 
              style: { 
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }
            },
              // Premium Logo
              h('div', {
                style: {
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 8px 24px rgba(201, 169, 98, 0.3)',
                  position: 'relative'
                }
              },
                h('div', {
                  style: {
                    position: 'absolute',
                    inset: '-2px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.3), rgba(139, 115, 85, 0.3))',
                    filter: 'blur(8px)',
                    zIndex: -1
                  }
                }),
                '◆'
              ),
              h('div', null,
                h('div', { 
                  style: { 
                    fontSize: '20px', 
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #C9A962 0%, #f5e6d3 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  } 
                }, 'InvestMail'),
                h('div', { 
                  style: { 
                    fontSize: '12px', 
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontWeight: '500',
                    letterSpacing: '0.5px'
                  } 
                }, 'PREMIUM EDITION')
              )
            ),
            
            // Compose Button - Ultra Premium
            h('button', {
              onClick: () => setShowCompose(true),
              style: {
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(201, 169, 98, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              },
              onMouseEnter: (e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(201, 169, 98, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              },
              onMouseLeave: (e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(201, 169, 98, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }
            },
              h('span', { style: { fontSize: '20px' } }, '✍️'),
              'Compose New Email'
            )
          ),
          
          // Ultra Premium Navigation
          h('nav', { 
            style: { 
              flex: 1, 
              padding: '24px 16px', 
              overflowY: 'auto',
              position: 'relative',
              zIndex: 1
            } 
          },
            navItems.map(item =>
              h('button', {
                key: item.id,
                onClick: () => setView(item.id),
                onMouseEnter: () => setHoveredNav(item.id),
                onMouseLeave: () => setHoveredNav(null),
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  marginBottom: '8px',
                  background: view === item.id 
                    ? 'rgba(201, 169, 98, 0.15)' 
                    : hoveredNav === item.id 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : 'transparent',
                  border: view === item.id 
                    ? '1px solid rgba(201, 169, 98, 0.3)' 
                    : '1px solid transparent',
                  color: view === item.id ? '#C9A962' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: view === item.id ? '0 4px 16px rgba(201, 169, 98, 0.2)' : 'none',
                  transform: hoveredNav === item.id ? 'translateX(4px)' : 'translateX(0)'
                }
              },
                // Icon with gradient background
                h('div', {
                  style: {
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: view === item.id ? item.gradient : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: view === item.id ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
                  }
                }, item.icon),
                h('span', { style: { flex: 1, letterSpacing: '0.2px' } }, item.label),
                view === item.id && h('div', {
                  style: {
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#C9A962',
                    boxShadow: '0 0 8px rgba(201, 169, 98, 0.6)'
                  }
                })
              )
            )
          ),
          
          // User Profile - Premium
          h('div', {
            style: {
              padding: '20px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              position: 'relative',
              zIndex: 1
            }
          },
            h('div', {
              style: {
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '16px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }
            }, 'A'),
            h('div', { style: { flex: 1, minWidth: 0 } },
              h('div', { 
                style: { 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '2px'
                } 
              }, 'Admin'),
              h('div', { 
                style: { 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.4)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                } 
              }, 'admin@investay...')
            )
          )
        ),
        
        // Ultra Premium Main Content
        h('div', { 
          style: { 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            background: '#0a0e27',
            position: 'relative',
            overflow: 'hidden'
          } 
        },
          // Animated Background Pattern
          h('div', {
            style: {
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(201, 169, 98, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(102, 126, 234, 0.03) 0%, transparent 50%)',
              pointerEvents: 'none'
            }
          }),
          
          // Premium Top Bar
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 20, 41, 0.8)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              zIndex: 10
            }
          },
            h('div', null,
              h('h1', { 
                style: { 
                  fontSize: '28px', 
                  fontWeight: '700',
                  margin: '0 0 4px 0',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                } 
              },
                view === 'inbox' ? '📧 Inbox' :
                view === 'sent' ? '📤 Sent Mail' :
                view === 'drafts' ? '📝 Drafts' :
                view === 'spam' ? '🚫 Spam' :
                view === 'trash' ? '🗑️ Trash' :
                view === 'archived' ? '📦 Archive' :
                'InvestMail'
              ),
              h('p', {
                style: {
                  margin: 0,
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '500'
                }
              }, `${emails.length} ${emails.length === 1 ? 'email' : 'emails'}`)
            ),
            h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
              h('button', {
                onClick: loadData,
                style: {
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                },
                onMouseEnter: (e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                },
                onMouseLeave: (e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
              }, '🔄 Refresh')
            )
          ),
          
          // Premium Email List
          h('div', { 
            style: { 
              flex: 1, 
              overflow: 'auto', 
              padding: '24px 32px',
              position: 'relative',
              zIndex: 1
            } 
          },
            loading ? h('div', { 
              style: { 
                textAlign: 'center', 
                padding: '60px',
                color: 'rgba(255, 255, 255, 0.4)'
              } 
            },
              h('div', {
                style: {
                  width: '48px',
                  height: '48px',
                  border: '3px solid rgba(201, 169, 98, 0.2)',
                  borderTopColor: '#C9A962',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite'
                }
              }),
              `Loading your ${view}...`
            ) :
            // CRM View
            view === 'crm' ? h('div', { style: { display: 'flex', gap: '24px' } },
              // Contacts
              h('div', { style: { flex: 1 } },
                h('h3', { style: { color: '#C9A962', marginBottom: '16px', fontSize: '18px' } }, '👥 Contacts'),
                h('div', { style: { display: 'grid', gap: '12px' } },
                  contacts.map((contact, i) =>
                    h('div', {
                      key: contact.id || i,
                      style: {
                        padding: '16px',
                        background: 'rgba(26, 31, 58, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    },
                      h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' } }, contact.name),
                      h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' } }, contact.email),
                      contact.company && h('div', { style: { fontSize: '12px', color: '#C9A962', marginTop: '4px' } }, contact.company)
                    )
                  )
                )
              ),
              // Deals
              h('div', { style: { flex: 1 } },
                h('h3', { style: { color: '#C9A962', marginBottom: '16px', fontSize: '18px' } }, '💼 Deals'),
                h('div', { style: { display: 'grid', gap: '12px' } },
                  deals.map((deal, i) =>
                    h('div', {
                      key: deal.id || i,
                      style: {
                        padding: '16px',
                        background: 'rgba(26, 31, 58, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px'
                      }
                    },
                      h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' } }, deal.title),
                      h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' } }, 
                        deal.value ? `$${deal.value.toLocaleString()}` : 'No value'
                      ),
                      h('div', { style: { fontSize: '12px', color: '#C9A962', marginTop: '4px' } }, deal.stage || 'New')
                    )
                  )
                )
              )
            ) :
            // Tasks View
            view === 'tasks' ? h('div', {},
              h('h3', { style: { color: '#C9A962', marginBottom: '16px', fontSize: '18px' } }, '✅ Your Tasks'),
              h('div', { style: { display: 'grid', gap: '12px' } },
                tasks.map((task, i) =>
                  h('div', {
                    key: task.id || i,
                    style: {
                      padding: '20px',
                      background: 'rgba(26, 31, 58, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } },
                      h('span', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' } }, task.title),
                      h('span', { 
                        style: { 
                          fontSize: '11px', 
                          padding: '4px 12px', 
                          borderRadius: '12px',
                          background: task.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                          color: task.status === 'completed' ? '#22c55e' : '#eab308'
                        } 
                      }, task.status || 'pending')
                    ),
                    task.description && h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' } }, task.description),
                    task.due_date && h('div', { style: { fontSize: '12px', color: '#C9A962', marginTop: '8px' } }, 
                      `⏰ Due: ${new Date(task.due_date).toLocaleDateString()}`
                    )
                  )
                )
              )
            ) :
            // Analytics View
            view === 'analytics' ? h('div', {},
              h('h3', { style: { color: '#C9A962', marginBottom: '24px', fontSize: '24px', fontWeight: '700' } }, '📊 Analytics Dashboard'),
              h('div', { style: { textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.5)' } },
                'Analytics dashboard coming soon...'
              )
            ) :
            // Team View
            view === 'team' ? h('div', {},
              h('h3', { style: { color: '#C9A962', marginBottom: '24px', fontSize: '24px', fontWeight: '700' } }, '👔 Team Collaboration'),
              h('div', { style: { textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.5)' } },
                'Team collaboration features coming soon...'
              )
            ) :
            // Email views
            emails.length === 0 ? h('div', { 
              style: { 
                textAlign: 'center', 
                padding: '80px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              } 
            },
              h('div', {
                style: {
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, rgba(201, 169, 98, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  marginBottom: '8px'
                }
              }, '📭'),
              h('h3', { 
                style: { 
                  marginBottom: '8px', 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '24px',
                  fontWeight: '600'
                } 
              }, 'No emails here'),
              h('p', { 
                style: { 
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '15px',
                  maxWidth: '400px'
                } 
              }, 
                view === 'sent' ? 'You haven\'t sent any emails yet. Click "Compose New Email" to get started.' : 'This folder is empty.'
              )
            ) : h('div', { 
              style: { 
                display: 'grid', 
                gap: '16px'
              } 
            },
              emails.map((email, i) =>
                h('div', {
                  key: email.id || i,
                  onClick: () => {
                    setSelectedEmail(email);
                    setShowCollabPanel(true);
                    loadCollabData(email.id);
                  },
                  style: {
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.6) 0%, rgba(15, 20, 41, 0.6) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                    e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(201, 169, 98, 0.2)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(15, 20, 41, 0.8) 100%)';
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(26, 31, 58, 0.6) 0%, rgba(15, 20, 41, 0.6) 100%)';
                  }
                },
                  // Gradient shine effect
                  h('div', {
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)',
                      transition: 'left 0.5s'
                    }
                  }),
                  
                  h('div', { 
                    style: { 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px' 
                    } 
                  },
                    h('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }
                    },
                      h('div', {
                        style: {
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }
                      }, (view === 'sent' ? email.to_email : email.from_email || 'U')[0].toUpperCase()),
                      h('div', null,
                        h('div', { 
                          style: { 
                            fontWeight: '600', 
                            color: 'rgba(255, 255, 255, 0.95)',
                            fontSize: '15px',
                            marginBottom: '4px'
                          } 
                        },
                          view === 'sent' ? `To: ${email.to_email}` : `From: ${email.from_email || email.from_name || 'Unknown'}`
                        ),
                        h('div', { 
                          style: { 
                            fontSize: '12px', 
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontWeight: '500'
                          } 
                        },
                          new Date(email.sent_at || email.received_at || email.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        )
                      )
                    )
                  ),
                  h('div', { 
                    style: { 
                      fontWeight: '600', 
                      marginBottom: '8px', 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      letterSpacing: '-0.2px'
                    } 
                  }, email.subject || '(No Subject)'),
                  // Read status indicator for sent emails
                  view === 'sent' && readStatuses[email.id] && h('div', {
                    style: {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: readStatuses[email.id].is_read ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                      color: readStatuses[email.id].is_read ? '#22c55e' : 'rgba(255, 255, 255, 0.5)',
                      border: `1px solid ${readStatuses[email.id].is_read ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`
                    }
                  },
                    readStatuses[email.id].is_read ? '✓ Read' : '○ Unread',
                    readStatuses[email.id].is_read && readStatuses[email.id].receipts?.[0]?.opened_at && 
                      h('span', { style: { fontSize: '11px', opacity: 0.7 } }, 
                        ` • ${new Date(readStatuses[email.id].receipts[0].opened_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      )
                  ),
                  h('div', { 
                    style: { 
                      fontSize: '14px', 
                      color: 'rgba(255, 255, 255, 0.5)',
                      lineHeight: '1.6',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical'
                    } 
                  }, email.snippet || email.body_text || '')
                )
              )
            )
          )
        ),
        
        // Ultra Premium Compose Modal
        showCompose && h(ComposeModal, {
          onClose: () => setShowCompose(false),
          onSend: sendEmail
        }),
        
        // Team Collaboration Panel
        showCollabPanel && selectedEmail && h('div', {
          style: {
            position: 'fixed',
            right: 0,
            top: 0,
            width: '400px',
            height: '100vh',
            background: 'linear-gradient(180deg, #0f1429 0%, #1a1f3a 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.4)',
            animation: 'slideInRight 0.3s ease-out'
          }
        },
          h('div', { style: { padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            h('h3', { style: { margin: 0, color: '#C9A962', fontSize: '18px' } }, '👥 Team Collaboration'),
            h('button', {
              onClick: () => setShowCollabPanel(false),
              style: { background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)', fontSize: '24px', cursor: 'pointer' }
            }, '✕')
          ),
          h('div', { style: { padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
            h('div', { style: { textAlign: 'center', padding: '12px', background: 'rgba(201, 169, 98, 0.1)', borderRadius: '8px' } },
              h('div', { style: { fontSize: '20px', fontWeight: '700', color: '#C9A962' } }, collabStats?.total_views || 0),
              h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, 'Views')
            ),
            h('div', { style: { textAlign: 'center', padding: '12px', background: 'rgba(201, 169, 98, 0.1)', borderRadius: '8px' } },
              h('div', { style: { fontSize: '20px', fontWeight: '700', color: '#C9A962' } }, collabStats?.total_comments || 0),
              h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, 'Comments')
            )
          ),
          h('div', { style: { flex: 1, overflow: 'auto', padding: '20px' } },
            h('div', { style: { fontSize: '13px', color: '#C9A962', marginBottom: '16px', fontWeight: '600' } }, '💬 Team Comments'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' } },
              comments.length === 0 ? 
                h('div', { style: { textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' } }, 'No comments yet') :
                comments.map((comment, i) =>
                  h('div', {
                    key: i,
                    style: { padding: '12px', background: 'rgba(26, 31, 58, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }
                  },
                    h('div', { style: { fontSize: '12px', fontWeight: '600', color: '#C9A962', marginBottom: '8px' } }, comment.author_name || comment.author_email),
                    h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' } }, comment.comment_text),
                    h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' } }, new Date(comment.created_at).toLocaleString())
                  )
                )
            ),
            h('div', {},
              h('textarea', {
                value: newComment,
                onChange: (e) => setNewComment(e.target.value),
                placeholder: 'Add internal team comment (private)...',
                style: {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(26, 31, 58, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '80px',
                  marginBottom: '12px'
                }
              }),
              h('button', {
                onClick: addComment,
                disabled: !newComment.trim(),
                style: {
                  width: '100%',
                  padding: '12px',
                  background: newComment.trim() ? 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)' : 'rgba(100, 100, 100, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed'
                }
              }, '💬 Add Comment')
            )
          )
        )
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
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
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
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 169, 98, 0.1)',
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
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
              placeholder: 'ahmed.enin@virgingates.com',
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
                transition: 'all 0.2s',
                outline: 'none'
              },
              onFocus: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)';
              },
              onBlur: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
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
                transition: 'all 0.2s',
                outline: 'none'
              },
              onFocus: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)';
              },
              onBlur: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
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
                transition: 'all 0.2s',
                outline: 'none',
                lineHeight: '1.6'
              },
              onFocus: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)';
              },
              onBlur: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }
            })
          ),
          
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
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
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
                boxShadow: '0 8px 24px rgba(201, 169, 98, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              },
              onMouseEnter: (e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(201, 169, 98, 0.5)';
              },
              onMouseLeave: (e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(201, 169, 98, 0.4)';
              }
            }, '🚀 Send Email')
          )
        )
      );
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideInRight {
        from { 
          opacity: 0;
          transform: translateX(100%);
        }
        to { 
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(201, 169, 98, 0.3);
        borderRadius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(201, 169, 98, 0.5);
      }
      ::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
    `;
    document.head.appendChild(style);
    
    console.log('🎨 Rendering Ultra Premium EmailApp...');
    const root = ReactDOM.createRoot(document.getElementById('email-root'));
    root.render(h(EmailApp));
    console.log('✨ Premium Email System Loaded!');
  }
  
  initApp();
});
