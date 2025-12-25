/**
 * InvestMail - COMPLETE SYSTEM - ALL FEATURES
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing InvestMail with ALL features...');
  
  function initApp() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      setTimeout(initApp, 100);
      return;
    }
    
    const { useState, useEffect } = React;
    const h = React.createElement;
    
    // ============================================
    // COMPLETE API SERVICE - ALL ENDPOINTS
    // ============================================
    const API = {
      // Email
      async getInbox(user) {
        const res = await fetch(`/api/email/inbox?user=${user}`);
        return res.json();
      },
      async getSent(user) {
        const res = await fetch(`/api/email/sent?user=${user}`);
        return res.json();
      },
      async getSpam(user) {
        const res = await fetch(`/api/email/spam?user=${user}`);
        return res.json();
      },
      async getTrash(user) {
        const res = await fetch(`/api/email/trash?user=${user}`);
        return res.json();
      },
      async getDrafts(user) {
        const res = await fetch(`/api/email/drafts?user=${user}`);
        return res.json();
      },
      async getArchived(user) {
        const res = await fetch(`/api/email/archived?user=${user}`);
        return res.json();
      },
      async sendEmail(data) {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      
      // Tasks
      async getTasks(userEmail, status = 'all') {
        const res = await fetch(`/api/tasks?userEmail=${userEmail}&status=${status}`);
        return res.json();
      },
      async createTaskFromEmail(emailId, userEmail, taskData) {
        const res = await fetch('/api/tasks/from-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId, userEmail, ...taskData })
        });
        return res.json();
      },
      async updateTask(taskId, updates) {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        return res.json();
      },
      async getReminders(userEmail) {
        const res = await fetch(`/api/tasks/reminders?userEmail=${userEmail}`);
        return res.json();
      },
      async createReminder(data) {
        const res = await fetch('/api/tasks/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      
      // CRM
      async getContacts(userEmail) {
        const res = await fetch(`/api/crm/contacts?userEmail=${userEmail}`);
        return res.json();
      },
      async getContact(id) {
        const res = await fetch(`/api/crm/contacts/${id}`);
        return res.json();
      },
      async createContact(data) {
        const res = await fetch('/api/crm/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      async getDeals(userEmail) {
        const res = await fetch(`/api/crm/deals?userEmail=${userEmail}`);
        return res.json();
      },
      async createDeal(data) {
        const res = await fetch('/api/crm/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      async getPipelineStats(userEmail) {
        const res = await fetch(`/api/crm/deals/pipeline/stats?userEmail=${userEmail}`);
        return res.json();
      },
      
      // Analytics
      async getProductivity(userEmail, period = 'week') {
        const res = await fetch(`/api/analytics/productivity?userEmail=${userEmail}&period=${period}`);
        return res.json();
      },
      async getTimeline(userEmail, days = 7) {
        const res = await fetch(`/api/analytics/activity/timeline?userEmail=${userEmail}&days=${days}`);
        return res.json();
      },
      async getSentiment(userEmail, days = 7) {
        const res = await fetch(`/api/analytics/sentiment/trends?userEmail=${userEmail}&days=${days}`);
        return res.json();
      },
      
      // Meetings
      async getMeetings(userEmail) {
        const res = await fetch(`/api/meetings/proposals?userEmail=${userEmail}`);
        return res.json();
      },
      async createMeeting(data) {
        const res = await fetch('/api/meetings/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      async extractMeeting(emailId, userEmail) {
        const res = await fetch('/api/meetings/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId, userEmail })
        });
        return res.json();
      },
      
      // Collaboration
      async getNotes(emailId) {
        const res = await fetch(`/api/collaboration/notes/${emailId}`);
        return res.json();
      },
      async addNote(emailId, userEmail, content) {
        const res = await fetch('/api/collaboration/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId, userEmail, content, visibility: 'team' })
        });
        return res.json();
      },
      async getDelegations(userEmail) {
        const res = await fetch(`/api/collaboration/delegations?userEmail=${userEmail}`);
        return res.json();
      },
      
      // Blockchain
      async verifyEmail(emailId, userEmail) {
        const res = await fetch('/api/blockchain/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId, userEmail })
        });
        return res.json();
      },
      async getVerification(emailId) {
        const res = await fetch(`/api/blockchain/verify/${emailId}`);
        return res.json();
      },
      
      // Organization
      async getPriorityInbox(userEmail) {
        const res = await fetch(`/api/organization/priority-inbox?userEmail=${userEmail}`);
        return res.json();
      },
      async getSmartFolders(userEmail) {
        const res = await fetch(`/api/organization/folders?userEmail=${userEmail}`);
        return res.json();
      },
      async getProjects(userEmail) {
        const res = await fetch(`/api/organization/projects?userEmail=${userEmail}`);
        return res.json();
      }
    };
    
    // ============================================
    // MAIN APP - ALL FEATURES
    // ============================================
    function EmailApp() {
      const [view, setView] = useState('inbox');
      const [user] = useState('admin@investaycapital.com');
      const [emails, setEmails] = useState([]);
      const [selectedEmail, setSelectedEmail] = useState(null);
      const [tasks, setTasks] = useState([]);
      const [contacts, setContacts] = useState([]);
      const [deals, setDeals] = useState([]);
      const [meetings, setMeetings] = useState([]);
      const [metrics, setMetrics] = useState(null);
      const [showCompose, setShowCompose] = useState(false);
      const [showTaskForm, setShowTaskForm] = useState(false);
      const [showContactForm, setShowContactForm] = useState(false);
      const [showMeetingForm, setShowMeetingForm] = useState(false);
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        loadData();
      }, [view]);
      
      const loadData = async () => {
        setLoading(true);
        try {
          if (view === 'inbox' || view === 'priority') {
            const data = view === 'priority' 
              ? await API.getPriorityInbox(user)
              : await API.getInbox(user);
            setEmails(data.emails || []);
          } else if (view === 'sent') {
            const data = await API.getSent(user);
            setEmails(data.emails || []);
          } else if (view === 'spam') {
            const data = await API.getSpam(user);
            setEmails(data.emails || []);
          } else if (view === 'trash') {
            const data = await API.getTrash(user);
            setEmails(data.emails || []);
          } else if (view === 'drafts') {
            const data = await API.getDrafts(user);
            setEmails(data.drafts || []);
          } else if (view === 'archived') {
            const data = await API.getArchived(user);
            setEmails(data.emails || []);
          } else if (view === 'tasks') {
            const data = await API.getTasks(user);
            setTasks(data.tasks || []);
          } else if (view === 'crm') {
            const [contactData, dealData] = await Promise.all([
              API.getContacts(user),
              API.getDeals(user)
            ]);
            setContacts(contactData.contacts || []);
            setDeals(dealData.deals || []);
          } else if (view === 'analytics') {
            const data = await API.getProductivity(user, 'week');
            setMetrics(data);
          } else if (view === 'meetings') {
            const data = await API.getMeetings(user);
            setMeetings(data.proposals || []);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        }
        setLoading(false);
      };
      
      const createTask = async () => {
        if (!selectedEmail) {
          alert('Select an email first');
          return;
        }
        try {
          await API.createTaskFromEmail(selectedEmail.id, user, {
            title: `Follow up: ${selectedEmail.subject}`,
            priority: 'medium'
          });
          alert('Task created!');
          loadData();
        } catch (error) {
          alert('Failed to create task');
        }
      };
      
      const verifyEmail = async () => {
        if (!selectedEmail) return;
        try {
          await API.verifyEmail(selectedEmail.id, user);
          alert('Email verified on blockchain!');
        } catch (error) {
          alert('Verification failed');
        }
      };
      
      return h('div', { style: { display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' } },
        // ===== SIDEBAR =====
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
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: '700' } },
              h('span', { style: { fontSize: '24px', color: '#C9A962' } }, '◆'),
              'InvestMail'
            )
          ),
          
          h('nav', { style: { flex: 1, padding: '20px 12px', overflowY: 'auto' } },
            [
              { id: 'inbox', icon: '📧', label: 'Inbox', badge: emails.filter(e => !e.is_read).length },
              { id: 'priority', icon: '⭐', label: 'Priority' },
              { id: 'tasks', icon: '✓', label: 'Tasks', badge: tasks.length },
              { id: 'crm', icon: '👥', label: 'CRM' },
              { id: 'analytics', icon: '📊', label: 'Analytics' },
              { id: 'meetings', icon: '📅', label: 'Meetings' },
              { id: 'collaboration', icon: '🤝', label: 'Team' },
              { id: 'projects', icon: '📁', label: 'Projects' }
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
                },
                onMouseEnter: (e) => {
                  if (view !== item.id) e.target.style.background = 'rgba(255,255,255,0.05)';
                },
                onMouseLeave: (e) => {
                  if (view !== item.id) e.target.style.background = 'none';
                }
              },
                h('span', { style: { fontSize: '18px', width: '24px' } }, item.icon),
                h('span', { style: { flex: 1 } }, item.label),
                item.badge > 0 && h('span', {
                  style: {
                    background: '#C9A962',
                    color: '#1a1d29',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }
                }, item.badge)
              )
            })
            )
          ),
          
          h('div', { style: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
              h('div', {
                style: {
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#C9A962',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  color: '#1a1d29'
                }
              }, 'A'),
              h('div', { style: { flex: 1, minWidth: 0 } },
                h('div', { style: { fontSize: '14px', fontWeight: '600' } }, 'Admin'),
                h('div', { style: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis' } }, 
                  'admin@investay...'
                )
              )
            )
          )
        ),
        
        // ===== MAIN CONTENT =====
        h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', background: 'white', minWidth: 0 } },
          // TOP BAR
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb'
            }
          },
            h('h1', { style: { fontSize: '24px', fontWeight: '700', color: '#1a1d29', margin: 0 } },
              view === 'inbox' ? 'Inbox' :
              view === 'priority' ? 'Priority Inbox' :
              view === 'tasks' ? 'Task Management' :
              view === 'crm' ? 'CRM Dashboard' :
              view === 'analytics' ? 'Analytics' :
              view === 'meetings' ? 'Meetings' :
              view === 'collaboration' ? 'Team Collaboration' :
              view === 'projects' ? 'Projects' : 'InvestMail'
            ),
            h('div', { style: { display: 'flex', gap: '12px' } },
              selectedEmail && h('button', {
                onClick: createTask,
                style: btnStyle('#f3f4f6', '#374151')
              }, '✓ Create Task'),
              selectedEmail && h('button', {
                onClick: verifyEmail,
                style: btnStyle('#f3f4f6', '#374151')
              }, '🔒 Verify'),
              h('button', {
                onClick: () => setShowCompose(true),
                style: btnStyle('#C9A962', 'white')
              }, '✉ Compose')
            )
          ),
          
          // CONTENT AREA
          h('div', { style: { flex: 1, overflowY: 'auto', padding: '24px' } },
            loading ? h('div', { style: { textAlign: 'center', padding: '40px', color: '#6b7280' } }, 
              'Loading...'
            ) :
            
            // INBOX VIEW
            (view === 'inbox' || view === 'priority') ? h('div', null,
              emails.length === 0 ? h('div', { style: centerStyle },
                h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📭'),
                h('h3', { style: { marginBottom: '8px' } }, 'No emails'),
                h('p', { style: { color: '#6b7280' } }, 'Your inbox is empty')
              ) : h('div', { style: { display: 'grid', gap: '12px' } },
                emails.map(email =>
                  h('div', {
                    key: email.id,
                    onClick: () => setSelectedEmail(email),
                    style: {
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedEmail?.id === email.id ? '#fef3c7' : 'white',
                      transition: 'all 0.2s'
                    }
                  },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
                      h('span', { style: { fontWeight: '600', color: '#1f2937' } }, email.from_email),
                      h('span', { style: { fontSize: '12px', color: '#6b7280' } }, 
                        new Date(email.created_at).toLocaleDateString()
                      )
                    ),
                    h('div', { style: { fontWeight: '600', marginBottom: '4px' } }, email.subject),
                    h('div', { style: { fontSize: '14px', color: '#6b7280' } }, 
                      (email.body || '').substring(0, 100) + '...'
                    ),
                    email.category && h('span', {
                      style: {
                        display: 'inline-block',
                        marginTop: '8px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#dbeafe',
                        color: '#1e40af'
                      }
                    }, email.category)
                  )
                )
              )
            ) :
            
            // TASKS VIEW
            view === 'tasks' ? h('div', null,
              h('div', { style: { marginBottom: '20px', display: 'flex', gap: '12px' } },
                h('button', {
                  onClick: () => setShowTaskForm(true),
                  style: btnStyle('#C9A962', 'white')
                }, '+ New Task'),
                ['all', 'pending', 'in_progress', 'completed'].map(status =>
                  h('button', {
                    key: status,
                    onClick: () => loadData(),
                    style: btnStyle('#f3f4f6', '#374151')
                  }, status.replace('_', ' '))
                )
              ),
              tasks.length === 0 ? h('div', { style: centerStyle },
                h('p', { style: { color: '#6b7280' } }, 'No tasks yet. Create tasks from emails!')
              ) : h('div', { style: { display: 'grid', gap: '12px' } },
                tasks.map(task =>
                  h('div', {
                    key: task.id,
                    style: {
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white'
                    }
                  },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
                      h('h3', { style: { margin: 0, fontSize: '16px' } }, task.title),
                      h('select', {
                        value: task.status,
                        onChange: async (e) => {
                          await API.updateTask(task.id, { status: e.target.value });
                          loadData();
                        },
                        style: {
                          padding: '4px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '12px'
                        }
                      },
                        h('option', { value: 'pending' }, 'Pending'),
                        h('option', { value: 'in_progress' }, 'In Progress'),
                        h('option', { value: 'completed' }, 'Completed')
                      )
                    ),
                    task.description && h('p', { style: { color: '#6b7280', fontSize: '14px', margin: '8px 0' } }, 
                      task.description
                    ),
                    h('div', { style: { display: 'flex', gap: '12px', marginTop: '12px' } },
                      task.priority && h('span', {
                        style: {
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: task.priority === 'high' ? '#fee2e2' : '#dbeafe',
                          color: task.priority === 'high' ? '#991b1b' : '#1e40af'
                        }
                      }, task.priority),
                      task.due_date && h('span', { style: { fontSize: '12px', color: '#6b7280' } },
                        '📅 ' + new Date(task.due_date).toLocaleDateString()
                      )
                    )
                  )
                )
              )
            ) :
            
            // CRM VIEW
            view === 'crm' ? h('div', null,
              h('div', { style: { display: 'flex', gap: '24px', marginBottom: '20px' } },
                h('button', {
                  onClick: () => setShowContactForm(true),
                  style: btnStyle('#C9A962', 'white')
                }, '+ New Contact'),
                h('button', {
                  onClick: () => loadData(),
                  style: btnStyle('#f3f4f6', '#374151')
                }, '+ New Deal')
              ),
              h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' } },
                h('div', null,
                  h('h3', { style: { marginBottom: '16px' } }, `Contacts (${contacts.length})`),
                  contacts.length === 0 ? h('p', { style: { color: '#6b7280' } }, 'No contacts yet') :
                  h('div', { style: { display: 'grid', gap: '12px' } },
                    contacts.map(contact =>
                      h('div', {
                        key: contact.id,
                        style: {
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          background: 'white'
                        }
                      },
                        h('div', { style: { fontWeight: '600', marginBottom: '4px' } }, contact.name),
                        h('div', { style: { fontSize: '14px', color: '#6b7280' } }, contact.email),
                        contact.company && h('div', { style: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' } }, 
                          contact.company
                        )
                      )
                    )
                  )
                ),
                h('div', null,
                  h('h3', { style: { marginBottom: '16px' } }, `Deals (${deals.length})`),
                  deals.length === 0 ? h('p', { style: { color: '#6b7280' } }, 'No deals yet') :
                  h('div', { style: { display: 'grid', gap: '12px' } },
                    deals.map(deal =>
                      h('div', {
                        key: deal.id,
                        style: {
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          background: 'white'
                        }
                      },
                        h('div', { style: { fontWeight: '600', marginBottom: '4px' } }, deal.title),
                        h('div', { style: { fontSize: '14px', color: '#6b7280' } }, 
                          `$${deal.value || 0} • ${deal.stage || 'New'}`
                        )
                      )
                    )
                  )
                )
              )
            ) :
            
            // ANALYTICS VIEW
            view === 'analytics' ? h('div', null,
              metrics ? h('div', null,
                h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' } },
                  [
                    { icon: '📧', value: metrics.emails?.total_emails || 0, label: 'Total Emails', color: '#667eea' },
                    { icon: '✓', value: metrics.tasks?.completed_tasks || 0, label: 'Tasks Done', color: '#f093fb' },
                    { icon: '📅', value: metrics.meetings?.confirmed_meetings || 0, label: 'Meetings', color: '#4facfe' },
                    { icon: '👥', value: metrics.crm?.contacts_contacted || 0, label: 'Contacts', color: '#43e97b' }
                  ].map((metric, i) =>
                    h('div', {
                      key: i,
                      style: {
                        background: `linear-gradient(135deg, ${metric.color} 0%, ${metric.color}88 100%)`,
                        color: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        textAlign: 'center'
                      }
                    },
                      h('div', { style: { fontSize: '32px', marginBottom: '12px' } }, metric.icon),
                      h('div', { style: { fontSize: '36px', fontWeight: '700', marginBottom: '8px' } }, metric.value),
                      h('div', { style: { fontSize: '14px', opacity: 0.9 } }, metric.label)
                    )
                  )
                ),
                h('div', { style: { background: '#f9fafb', padding: '24px', borderRadius: '12px' } },
                  h('h3', { style: { marginBottom: '20px' } }, 'Weekly Activity'),
                  h('p', { style: { color: '#6b7280' } }, 'Email and task activity over the past 7 days')
                )
              ) : h('p', null, 'Loading analytics...')
            ) :
            
            // MEETINGS VIEW
            view === 'meetings' ? h('div', null,
              h('button', {
                onClick: () => setShowMeetingForm(true),
                style: { ...btnStyle('#C9A962', 'white'), marginBottom: '20px' }
              }, '+ New Meeting'),
              meetings.length === 0 ? h('div', { style: centerStyle },
                h('p', { style: { color: '#6b7280' } }, 'No meetings scheduled')
              ) : h('div', { style: { display: 'grid', gap: '12px' } },
                meetings.map(meeting =>
                  h('div', {
                    key: meeting.id,
                    style: {
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white'
                    }
                  },
                    h('h3', { style: { margin: '0 0 12px 0', fontSize: '16px' } }, meeting.title),
                    h('div', { style: { fontSize: '14px', color: '#6b7280', marginBottom: '8px' } },
                      '📅 ' + new Date(meeting.proposed_date).toLocaleString()
                    ),
                    meeting.location && h('div', { style: { fontSize: '14px', color: '#6b7280' } },
                      '📍 ' + meeting.location
                    ),
                    h('span', {
                      style: {
                        display: 'inline-block',
                        marginTop: '8px',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: meeting.status === 'confirmed' ? '#d1fae5' : '#fef3c7',
                        color: meeting.status === 'confirmed' ? '#065f46' : '#92400e'
                      }
                    }, meeting.status)
                  )
                )
              )
            ) :
            
            // COLLABORATION VIEW
            view === 'collaboration' ? h('div', { style: centerStyle },
              h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '🤝'),
              h('h3', { style: { marginBottom: '8px' } }, 'Team Collaboration'),
              h('p', { style: { color: '#6b7280' } }, 'Add notes, delegate emails, and manage approvals'),
              selectedEmail && h('button', {
                onClick: async () => {
                  const note = prompt('Add a note to this email:');
                  if (note) {
                    await API.addNote(selectedEmail.id, user, note);
                    alert('Note added!');
                  }
                },
                style: { ...btnStyle('#C9A962', 'white'), marginTop: '20px' }
              }, 'Add Note to Selected Email')
            ) :
            
            // PROJECTS VIEW
            view === 'projects' ? h('div', { style: centerStyle },
              h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📁'),
              h('h3', { style: { marginBottom: '8px' } }, 'Project Organization'),
              h('p', { style: { color: '#6b7280' } }, 'Organize emails by project')
            ) :
            
            h('div', { style: centerStyle },
              h('p', { style: { color: '#6b7280' } }, 'Feature coming soon')
            )
          )
        ),
        
        // COMPOSE MODAL
        showCompose && h(ComposeModal, { onClose: () => setShowCompose(false), user, API, onSent: loadData }),
        showTaskForm && h(TaskFormModal, { onClose: () => setShowTaskForm(false), user, API, onCreated: loadData }),
        showContactForm && h(ContactFormModal, { onClose: () => setShowContactForm(false), user, API, onCreated: loadData }),
        showMeetingForm && h(MeetingFormModal, { onClose: () => setShowMeetingForm(false), user, API, onCreated: loadData })
      );
    }
    
    // ============================================
    // MODALS
    // ============================================
    function ComposeModal({ onClose, user, API, onSent }) {
      const [to, setTo] = useState('');
      const [subject, setSubject] = useState('');
      const [body, setBody] = useState('');
      const h = React.createElement;
      
      const send = async () => {
        if (!to || !subject) {
          alert('Please fill recipient and subject');
          return;
        }
        try {
          console.log('Sending email:', { from: user, to, subject, body });
          const result = await API.sendEmail({ from: user, to, subject, body, useAI: true });
          console.log('Send result:', result);
          
          if (result.success && result.emailSent) {
            alert('✅ Email sent successfully via Mailgun!\n\nMessage ID: ' + result.messageId);
          } else if (result.success && !result.emailSent) {
            alert('⚠️ Email saved but not sent:\n\n' + (result.mailgunError || 'Check Mailgun configuration'));
          } else {
            alert('❌ Failed to send:\n\n' + (result.error || 'Unknown error'));
          }
          
          onSent();
          onClose();
        } catch (error) {
          console.error('Send error:', error);
          alert('❌ Network error: ' + error.message);
        }
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
            width: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }
        },
          h('div', {
            style: {
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          },
            h('h2', { style: { margin: 0, fontSize