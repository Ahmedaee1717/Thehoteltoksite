/**
 * InvestMail - Working Email Client
 */

// Wait for page load
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
    
    // Simple Email App Component
    function EmailApp() {
      const [view, setView] = useState('inbox');
      const [emails, setEmails] = useState([]);
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        loadInbox();
      }, []);
      
      const loadInbox = async () => {
        try {
          const response = await fetch('/api/email/inbox?user=admin@investaycapital.com');
          const data = await response.json();
          setEmails(data.emails || []);
          setLoading(false);
        } catch (error) {
          console.error('Error loading inbox:', error);
          setLoading(false);
        }
      };
      
      return h('div', { className: 'email-app', style: { display: 'flex', height: '100vh' } },
        // Sidebar
        h('div', { 
          className: 'sidebar',
          style: { 
            width: '260px', 
            background: 'linear-gradient(180deg, #1a1d29 0%, #252938 100%)',
            color: 'white',
            padding: '20px'
          }
        },
          h('h2', { style: { marginBottom: '30px' } }, '◆ InvestMail'),
          h('nav', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            h('button', {
              onClick: () => setView('inbox'),
              style: {
                padding: '12px 16px',
                background: view === 'inbox' ? 'rgba(201,169,98,0.2)' : 'transparent',
                color: view === 'inbox' ? '#C9A962' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }
            }, '📧 Inbox'),
            h('button', {
              onClick: () => setView('tasks'),
              style: {
                padding: '12px 16px',
                background: view === 'tasks' ? 'rgba(201,169,98,0.2)' : 'transparent',
                color: view === 'tasks' ? '#C9A962' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }
            }, '✓ Tasks'),
            h('button', {
              onClick: () => setView('crm'),
              style: {
                padding: '12px 16px',
                background: view === 'crm' ? 'rgba(201,169,98,0.2)' : 'transparent',
                color: view === 'crm' ? '#C9A962' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }
            }, '👥 CRM'),
            h('button', {
              onClick: () => setView('analytics'),
              style: {
                padding: '12px 16px',
                background: view === 'analytics' ? 'rgba(201,169,98,0.2)' : 'transparent',
                color: view === 'analytics' ? '#C9A962' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }
            }, '📊 Analytics')
          )
        ),
        
        // Main Content
        h('div', { 
          className: 'main-content',
          style: { 
            flex: 1, 
            background: 'white',
            display: 'flex',
            flexDirection: 'column'
          }
        },
          // Top Bar
          h('div', {
            style: {
              padding: '20px 30px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          },
            h('h1', { style: { margin: 0, fontSize: '24px' } }, 
              view === 'inbox' ? 'Inbox' :
              view === 'tasks' ? 'Tasks' :
              view === 'crm' ? 'CRM' : 'Analytics'
            ),
            h('button', {
              style: {
                background: '#C9A962',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }
            }, '✉ Compose')
          ),
          
          // Content Area
          h('div', {
            style: {
              flex: 1,
              padding: '30px',
              overflowY: 'auto'
            }
          },
            loading ? h('p', null, 'Loading...') :
            view === 'inbox' ? h('div', null,
              emails.length === 0 ? 
                h('div', { 
                  style: { 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    color: '#6b7280'
                  }
                },
                  h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📭'),
                  h('h3', { style: { marginBottom: '8px' } }, 'No emails'),
                  h('p', null, 'Your inbox is empty')
                ) :
                h('div', null,
                  emails.map((email, i) =>
                    h('div', {
                      key: i,
                      style: {
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }
                    },
                      h('div', { style: { fontWeight: '600', marginBottom: '4px' } }, email.subject),
                      h('div', { style: { fontSize: '14px', color: '#6b7280' } }, email.from_email)
                    )
                  )
                )
            ) :
            view === 'tasks' ? h('div', null,
              h('p', { style: { color: '#6b7280' } }, 'Tasks view - Create tasks from emails')
            ) :
            view === 'crm' ? h('div', null,
              h('p', { style: { color: '#6b7280' } }, 'CRM view - Manage contacts and deals')
            ) :
            h('div', null,
              h('p', { style: { color: '#6b7280' } }, 'Analytics view - View productivity metrics')
            )
          )
        )
      );
    }
    
    // Render the app
    const root = document.getElementById('email-root');
    if (root) {
      console.log('Rendering EmailApp...');
      ReactDOM.render(h(EmailApp), root);
      console.log('App rendered successfully!');
    } else {
      console.error('email-root element not found!');
    }
  }
  
  initApp();
});
