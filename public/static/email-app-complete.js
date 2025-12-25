/**
 * InvestMail - Complete Advanced Email System
 * Full Frontend Integration with All Features
 */

(function() {
  'use strict';
  
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('React not loaded, retrying...');
    setTimeout(arguments.callee, 50);
    return;
  }

  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const { createElement: h } = React;

  // ============================================
  // Complete API Service with All Endpoints
  // ============================================
  const API = {
    // Email APIs
    async getInbox(user, folder = 'inbox', limit = 50) {
      const params = new URLSearchParams({ user, folder, limit });
      const response = await fetch(`/api/email/inbox?${params}`);
      return response.json();
    },
    
    async getEmail(id) {
      const response = await fetch(`/api/email/${id}`);
      return response.json();
    },

    async sendEmail(data) {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },

    // Task APIs
    async getTasks(userEmail, status = 'all') {
      const params = new URLSearchParams({ userEmail, status });
      const response = await fetch(`/api/tasks?${params}`);
      return response.json();
    },

    async createTaskFromEmail(emailId, userEmail, taskData) {
      const response = await fetch('/api/tasks/from-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, userEmail, ...taskData })
      });
      return response.json();
    },

    async updateTask(taskId, updates) {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },

    async getReminders(userEmail) {
      const params = new URLSearchParams({ userEmail });
      const response = await fetch(`/api/tasks/reminders?${params}`);
      return response.json();
    },

    // CRM APIs
    async getContacts(userEmail, search = '') {
      const params = new URLSearchParams({ userEmail, search });
      const response = await fetch(`/api/crm/contacts?${params}`);
      return response.json();
    },

    async getContact(id) {
      const response = await fetch(`/api/crm/contacts/${id}`);
      return response.json();
    },

    async createContact(data) {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },

    async getDeals(userEmail) {
      const params = new URLSearchParams({ userEmail });
      const response = await fetch(`/api/crm/deals?${params}`);
      return response.json();
    },

    async getPipelineStats(userEmail) {
      const params = new URLSearchParams({ userEmail });
      const response = await fetch(`/api/crm/deals/pipeline/stats?${params}`);
      return response.json();
    },

    // Analytics APIs
    async getProductivityMetrics(userEmail, period = 'week') {
      const params = new URLSearchParams({ userEmail, period });
      const response = await fetch(`/api/analytics/productivity?${params}`);
      return response.json();
    },

    async getActivityTimeline(userEmail, days = 30) {
      const params = new URLSearchParams({ userEmail, days });
      const response = await fetch(`/api/analytics/activity/timeline?${params}`);
      return response.json();
    },

    async getSentimentTrends(userEmail, days = 30) {
      const params = new URLSearchParams({ userEmail, days });
      const response = await fetch(`/api/analytics/sentiment/trends?${params}`);
      return response.json();
    },

    // Meeting APIs
    async getMeetings(userEmail, status = '') {
      const params = new URLSearchParams({ userEmail, status });
      const response = await fetch(`/api/meetings/proposals?${params}`);
      return response.json();
    },

    async extractMeetingInfo(emailId, userEmail) {
      const response = await fetch('/api/meetings/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, userEmail })
      });
      return response.json();
    },

    async createMeeting(data) {
      const response = await fetch('/api/meetings/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },

    // Organization APIs
    async getSmartFolders(userEmail) {
      const params = new URLSearchParams({ userEmail });
      const response = await fetch(`/api/organization/folders?${params}`);
      return response.json();
    },

    async getPriorityInbox(userEmail, limit = 50) {
      const params = new URLSearchParams({ userEmail, limit });
      const response = await fetch(`/api/organization/priority-inbox?${params}`);
      return response.json();
    },

    async getProjects(userEmail) {
      const params = new URLSearchParams({ userEmail });
      const response = await fetch(`/api/organization/projects?${params}`);
      return response.json();
    },

    // Collaboration APIs
    async getNotes(emailId) {
      const response = await fetch(`/api/collaboration/notes/${emailId}`);
      return response.json();
    },

    async addNote(emailId, userEmail, content) {
      const response = await fetch('/api/collaboration/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, userEmail, content, visibility: 'team' })
      });
      return response.json();
    },

    async getDelegations(userEmail, type = 'all') {
      const params = new URLSearchParams({ userEmail, type });
      const response = await fetch(`/api/collaboration/delegations?${params}`);
      return response.json();
    },

    // Blockchain APIs
    async verifyEmail(emailId, userEmail) {
      const response = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, userEmail })
      });
      return response.json();
    },

    async getVerificationStatus(emailId) {
      const response = await fetch(`/api/blockchain/verify/${emailId}`);
      return response.json();
    },

    // Voice APIs
    async startVoiceSession(userEmail) {
      const response = await fetch('/api/voice/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail })
      });
      return response.json();
    }
  };

  // ============================================
  // Main App Component
  // ============================================
  function EmailApp() {
    const [currentView, setCurrentView] = useState('inbox');
    const [currentUser] = useState('admin@investaycapital.com');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [showTaskPanel, setShowTaskPanel] = useState(false);
    const [showCRMPanel, setShowCRMPanel] = useState(false);
    const [showComposeModal, setShowComposeModal] = useState(false);

    // Load initial data
    useEffect(() => {
      loadInbox();
      loadTasks();
      loadContacts();
    }, []);

    const loadInbox = async () => {
      setLoading(true);
      try {
        const data = await API.getInbox(currentUser);
        setEmails(data.emails || []);
      } catch (error) {
        console.error('Error loading inbox:', error);
      }
      setLoading(false);
    };

    const loadTasks = async () => {
      try {
        const data = await API.getTasks(currentUser);
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };

    const loadContacts = async () => {
      try {
        const data = await API.getContacts(currentUser);
        setContacts(data.contacts || []);
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };

    const handleViewChange = (view) => {
      setCurrentView(view);
      setSelectedEmail(null);
      
      if (view === 'inbox') {
        loadInbox();
      } else if (view === 'priority') {
        loadPriorityInbox();
      } else if (view === 'analytics') {
        // Analytics view will load its own data
      }
    };

    const loadPriorityInbox = async () => {
      setLoading(true);
      try {
        const data = await API.getPriorityInbox(currentUser);
        setEmails(data.emails || []);
      } catch (error) {
        console.error('Error loading priority inbox:', error);
      }
      setLoading(false);
    };

    const handleEmailSelect = (email) => {
      setSelectedEmail(email);
    };

    const handleCreateTask = async (emailId) => {
      const taskData = {
        title: `Follow up on: ${selectedEmail?.subject || 'Email'}`,
        priority: 'medium',
        description: 'Created from email'
      };
      
      try {
        await API.createTaskFromEmail(emailId, currentUser, taskData);
        loadTasks();
        alert('Task created successfully!');
      } catch (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task');
      }
    };

    return h('div', { className: 'email-app' },
      // Sidebar
      h(Sidebar, {
        currentView,
        onViewChange: handleViewChange,
        taskCount: tasks.length,
        unreadCount: emails.filter(e => !e.is_read).length
      }),
      
      // Main content area
      h('div', { className: 'email-main' },
        // Top bar
        h(TopBar, {
          currentView,
          onToggleTask: () => setShowTaskPanel(!showTaskPanel),
          onToggleCRM: () => setShowCRMPanel(!showCRMPanel),
          onCompose: () => setShowComposeModal(true)
        }),
        
        // Content based on view
        h('div', { className: 'email-content-wrapper' },
          currentView === 'inbox' && h(InboxView, {
            emails,
            selectedEmail,
            onSelectEmail: handleEmailSelect,
            onCreateTask: handleCreateTask,
            loading
          }),
          
          currentView === 'priority' && h(InboxView, {
            emails,
            selectedEmail,
            onSelectEmail: handleEmailSelect,
            onCreateTask: handleCreateTask,
            loading,
            title: 'Priority Inbox'
          }),
          
          currentView === 'tasks' && h(TasksView, {
            tasks,
            currentUser,
            onRefresh: loadTasks
          }),
          
          currentView === 'crm' && h(CRMView, {
            contacts,
            currentUser,
            onRefresh: loadContacts
          }),
          
          currentView === 'analytics' && h(AnalyticsView, {
            currentUser
          }),
          
          currentView === 'meetings' && h(MeetingsView, {
            currentUser
          })
        )
      ),
      
      // Side panels
      showTaskPanel && h(TaskPanel, {
        tasks,
        onClose: () => setShowTaskPanel(false),
        onRefresh: loadTasks,
        currentUser
      }),
      
      showCRMPanel && h(CRMPanel, {
        contacts,
        selectedEmail,
        onClose: () => setShowCRMPanel(false),
        currentUser
      }),
      
      // Modals
      showComposeModal && h(ComposeModal, {
        onClose: () => setShowComposeModal(false),
        onSend: () => {
          setShowComposeModal(false);
          loadInbox();
        },
        currentUser
      })
    );
  }

  // ============================================
  // Sidebar Component
  // ============================================
  function Sidebar({ currentView, onViewChange, taskCount, unreadCount }) {
    const navItems = [
      { id: 'inbox', icon: '📧', label: 'Inbox', badge: unreadCount },
      { id: 'priority', icon: '⭐', label: 'Priority', badge: null },
      { id: 'tasks', icon: '✓', label: 'Tasks', badge: taskCount },
      { id: 'crm', icon: '👥', label: 'CRM', badge: null },
      { id: 'analytics', icon: '📊', label: 'Analytics', badge: null },
      { id: 'meetings', icon: '📅', label: 'Meetings', badge: null }
    ];

    return h('div', { className: 'email-sidebar' },
      h('div', { className: 'sidebar-header' },
        h('div', { className: 'sidebar-logo' },
          h('span', { className: 'logo-icon' }, '◆'),
          h('span', { className: 'logo-text' }, 'InvestMail')
        )
      ),
      
      h('nav', { className: 'sidebar-nav' },
        navItems.map(item =>
          h('button', {
            key: item.id,
            className: `nav-item ${currentView === item.id ? 'active' : ''}`,
            onClick: () => onViewChange(item.id)
          },
            h('span', { className: 'nav-icon' }, item.icon),
            h('span', { className: 'nav-label' }, item.label),
            item.badge > 0 && h('span', { className: 'nav-badge' }, item.badge)
          )
        )
      ),
      
      h('div', { className: 'sidebar-footer' },
        h('div', { className: 'user-info' },
          h('div', { className: 'user-avatar' }, 'A'),
          h('div', { className: 'user-details' },
            h('div', { className: 'user-name' }, 'Admin'),
            h('div', { className: 'user-email' }, 'admin@investay...')
          )
        )
      )
    );
  }

  // ============================================
  // Top Bar Component
  // ============================================
  function TopBar({ currentView, onToggleTask, onToggleCRM, onCompose }) {
    const viewTitles = {
      inbox: 'Inbox',
      priority: 'Priority Inbox',
      tasks: 'Task Management',
      crm: 'CRM Dashboard',
      analytics: 'Analytics',
      meetings: 'Meeting Scheduler'
    };

    return h('div', { className: 'email-top-bar' },
      h('div', { className: 'top-bar-left' },
        h('h1', { className: 'view-title' }, viewTitles[currentView] || 'InvestMail')
      ),
      
      h('div', { className: 'top-bar-actions' },
        h('button', {
          className: 'btn-icon',
          onClick: onToggleTask,
          title: 'Toggle Tasks'
        }, '✓'),
        
        h('button', {
          className: 'btn-icon',
          onClick: onToggleCRM,
          title: 'Toggle CRM'
        }, '👥'),
        
        h('button', {
          className: 'btn-primary btn-compose',
          onClick: onCompose
        },
          h('span', null, '✉'),
          ' Compose'
        )
      )
    );
  }

  // ============================================
  // Inbox View Component
  // ============================================
  function InboxView({ emails, selectedEmail, onSelectEmail, onCreateTask, loading, title = 'Inbox' }) {
    if (loading) {
      return h('div', { className: 'loading-state' },
        h('div', { className: 'spinner' }),
        h('p', null, 'Loading emails...')
      );
    }

    if (!emails || emails.length === 0) {
      return h('div', { className: 'empty-state' },
        h('div', { className: 'empty-icon' }, '📭'),
        h('h3', null, 'No emails'),
        h('p', null, 'Your inbox is empty')
      );
    }

    return h('div', { className: 'inbox-view' },
      h('div', { className: 'email-list' },
        emails.map(email =>
          h('div', {
            key: email.id,
            className: `email-item ${selectedEmail?.id === email.id ? 'selected' : ''} ${email.is_read ? 'read' : 'unread'}`,
            onClick: () => onSelectEmail(email)
          },
            h('div', { className: 'email-item-header' },
              h('span', { className: 'email-from' }, email.from_email),
              h('span', { className: 'email-time' }, new Date(email.created_at).toLocaleDateString())
            ),
            h('div', { className: 'email-subject' }, email.subject),
            h('div', { className: 'email-preview' }, 
              (email.body || '').substring(0, 100) + '...'
            ),
            email.category && h('span', {
              className: `email-category category-${email.category}`
            }, email.category)
          )
        )
      ),
      
      selectedEmail && h(EmailDetail, {
        email: selectedEmail,
        onCreateTask,
        onClose: () => onSelectEmail(null)
      })
    );
  }

  // ============================================
  // Email Detail Component
  // ============================================
  function EmailDetail({ email, onCreateTask, onClose }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [verification, setVerification] = useState(null);

    useEffect(() => {
      loadNotes();
      checkVerification();
    }, [email.id]);

    const loadNotes = async () => {
      try {
        const data = await API.getNotes(email.id);
        setNotes(data.notes || []);
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    const checkVerification = async () => {
      try {
        const data = await API.getVerificationStatus(email.id);
        setVerification(data);
      } catch (error) {
        console.error('Error checking verification:', error);
      }
    };

    const handleAddNote = async () => {
      if (!newNote.trim()) return;
      
      try {
        await API.addNote(email.id, 'admin@investaycapital.com', newNote);
        setNewNote('');
        loadNotes();
      } catch (error) {
        console.error('Error adding note:', error);
      }
    };

    const handleVerify = async () => {
      try {
        const data = await API.verifyEmail(email.id, 'admin@investaycapital.com');
        setVerification(data);
        alert('Email verified successfully!');
      } catch (error) {
        console.error('Error verifying email:', error);
        alert('Failed to verify email');
      }
    };

    return h('div', { className: 'email-detail' },
      h('div', { className: 'email-detail-header' },
        h('button', { className: 'btn-close', onClick: onClose }, '✕'),
        h('h2', null, email.subject)
      ),
      
      h('div', { className: 'email-meta' },
        h('div', { className: 'meta-row' },
          h('strong', null, 'From: '),
          h('span', null, email.from_email)
        ),
        h('div', { className: 'meta-row' },
          h('strong', null, 'To: '),
          h('span', null, email.to_email)
        ),
        h('div', { className: 'meta-row' },
          h('strong', null, 'Date: '),
          h('span', null, new Date(email.created_at).toLocaleString())
        ),
        verification?.verified && h('div', { className: 'verification-badge' },
          '🔒 Verified'
        )
      ),
      
      h('div', { className: 'email-actions' },
        h('button', {
          className: 'btn-action',
          onClick: () => onCreateTask(email.id)
        }, '✓ Create Task'),
        
        !verification?.verified && h('button', {
          className: 'btn-action',
          onClick: handleVerify
        }, '🔒 Verify Email')
      ),
      
      h('div', { className: 'email-body' },
        email.body || 'No content'
      ),
      
      email.ai_summary && h('div', { className: 'ai-summary' },
        h('h4', null, '🤖 AI Summary'),
        h('p', null, email.ai_summary)
      ),
      
      h('div', { className: 'email-notes-section' },
        h('h4', null, '📝 Team Notes'),
        
        notes.length > 0 && h('div', { className: 'notes-list' },
          notes.map((note, idx) =>
            h('div', { key: idx, className: 'note-item' },
              h('div', { className: 'note-author' }, note.user_email),
              h('div', { className: 'note-content' }, note.content),
              h('div', { className: 'note-time' }, 
                new Date(note.created_at).toLocaleString()
              )
            )
          )
        ),
        
        h('div', { className: 'note-input' },
          h('textarea', {
            value: newNote,
            onChange: (e) => setNewNote(e.target.value),
            placeholder: 'Add a note...',
            rows: 2
          }),
          h('button', {
            className: 'btn-primary',
            onClick: handleAddNote
          }, 'Add Note')
        )
      )
    );
  }

  // ============================================
  // Tasks View Component
  // ============================================
  function TasksView({ tasks, currentUser, onRefresh }) {
    const [filter, setFilter] = useState('all');
    
    const filteredTasks = useMemo(() => {
      if (filter === 'all') return tasks;
      return tasks.filter(t => t.status === filter);
    }, [tasks, filter]);

    const handleStatusChange = async (taskId, newStatus) {
      try {
        await API.updateTask(taskId, { status: newStatus });
        onRefresh();
      } catch (error) {
        console.error('Error updating task:', error);
      }
    };

    return h('div', { className: 'tasks-view' },
      h('div', { className: 'tasks-header' },
        h('div', { className: 'filter-buttons' },
          ['all', 'pending', 'in_progress', 'completed'].map(status =>
            h('button', {
              key: status,
              className: `filter-btn ${filter === status ? 'active' : ''}`,
              onClick: () => setFilter(status)
            }, status.replace('_', ' '))
          )
        )
      ),
      
      h('div', { className: 'tasks-list' },
        filteredTasks.length === 0 ? h('div', { className: 'empty-state' },
          h('p', null, 'No tasks found')
        ) : filteredTasks.map(task =>
          h('div', { key: task.id, className: 'task-item' },
            h('div', { className: 'task-header' },
              h('h3', null, task.title),
              h('select', {
                value: task.status,
                onChange: (e) => handleStatusChange(task.id, e.target.value),
                className: `task-status status-${task.status}`
              },
                h('option', { value: 'pending' }, 'Pending'),
                h('option', { value: 'in_progress' }, 'In Progress'),
                h('option', { value: 'completed' }, 'Completed')
              )
            ),
            h('p', { className: 'task-description' }, task.description),
            h('div', { className: 'task-meta' },
              task.priority && h('span', {
                className: `priority-badge priority-${task.priority}`
              }, task.priority),
              task.due_date && h('span', { className: 'task-due' },
                '📅 ' + new Date(task.due_date).toLocaleDateString()
              )
            ),
            task.email_subject && h('div', { className: 'task-email-link' },
              '📧 From: ', task.email_subject
            )
          )
        )
      )
    );
  }

  // ============================================
  // CRM View Component
  // ============================================
  function CRMView({ contacts, currentUser, onRefresh }) {
    const [selectedContact, setSelectedContact] = useState(null);

    return h('div', { className: 'crm-view' },
      h('div', { className: 'crm-sidebar' },
        h('h3', null, 'Contacts'),
        contacts.length === 0 ? h('p', null, 'No contacts yet') :
        contacts.map(contact =>
          h('div', {
            key: contact.id,
            className: `contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`,
            onClick: () => setSelectedContact(contact)
          },
            h('div', { className: 'contact-avatar' }, contact.name[0]),
            h('div', { className: 'contact-info' },
              h('div', { className: 'contact-name' }, contact.name),
              h('div', { className: 'contact-email' }, contact.email),
              contact.company && h('div', { className: 'contact-company' }, contact.company)
            )
          )
        )
      ),
      
      h('div', { className: 'crm-detail' },
        selectedContact ? h(ContactDetail, { contact: selectedContact }) :
        h('div', { className: 'empty-state' },
          h('p', null, 'Select a contact to view details')
        )
      )
    );
  }

  function ContactDetail({ contact }) {
    return h('div', { className: 'contact-detail' },
      h('h2', null, contact.name),
      h('div', { className: 'contact-details' },
        h('div', { className: 'detail-row' },
          h('strong', null, 'Email:'),
          h('span', null, contact.email)
        ),
        contact.phone && h('div', { className: 'detail-row' },
          h('strong', null, 'Phone:'),
          h('span', null, contact.phone)
        ),
        contact.company && h('div', { className: 'detail-row' },
          h('strong', null, 'Company:'),
          h('span', null, contact.company)
        ),
        contact.position && h('div', { className: 'detail-row' },
          h('strong', null, 'Position:'),
          h('span', null, contact.position)
        )
      )
    );
  }

  // ============================================
  // Analytics View Component
  // ============================================
  function AnalyticsView({ currentUser }) {
    const [metrics, setMetrics] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [period, setPeriod] = useState('week');

    useEffect(() => {
      loadMetrics();
      loadTimeline();
    }, [period]);

    const loadMetrics = async () => {
      try {
        const data = await API.getProductivityMetrics(currentUser, period);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading metrics:', error);
      }
    };

    const loadTimeline = async () => {
      try {
        const data = await API.getActivityTimeline(currentUser, period === 'week' ? 7 : 30);
        setTimeline(data.timeline || []);
      } catch (error) {
        console.error('Error loading timeline:', error);
      }
    };

    if (!metrics) {
      return h('div', { className: 'loading-state' }, 'Loading analytics...');
    }

    return h('div', { className: 'analytics-view' },
      h('div', { className: 'analytics-header' },
        h('div', { className: 'period-selector' },
          ['today', 'week', 'month'].map(p =>
            h('button', {
              key: p,
              className: `period-btn ${period === p ? 'active' : ''}`,
              onClick: () => setPeriod(p)
            }, p)
          )
        )
      ),
      
      h('div', { className: 'metrics-grid' },
        h('div', { className: 'metric-card' },
          h('div', { className: 'metric-icon' }, '📧'),
          h('div', { className: 'metric-value' }, metrics.emails?.total_emails || 0),
          h('div', { className: 'metric-label' }, 'Total Emails')
        ),
        
        h('div', { className: 'metric-card' },
          h('div', { className: 'metric-icon' }, '✓'),
          h('div', { className: 'metric-value' }, metrics.tasks?.completed_tasks || 0),
          h('div', { className: 'metric-label' }, 'Tasks Completed')
        ),
        
        h('div', { className: 'metric-card' },
          h('div', { className: 'metric-icon' }, '📅'),
          h('div', { className: 'metric-value' }, metrics.meetings?.confirmed_meetings || 0),
          h('div', { className: 'metric-label' }, 'Meetings')
        ),
        
        h('div', { className: 'metric-card' },
          h('div', { className: 'metric-icon' }, '👥'),
          h('div', { className: 'metric-value' }, metrics.crm?.contacts_contacted || 0),
          h('div', { className: 'metric-label' }, 'Contacts Reached')
        )
      ),
      
      h('div', { className: 'timeline-chart' },
        h('h3', null, 'Email Activity'),
        timeline.length === 0 ? h('p', null, 'No activity data') :
        h('div', { className: 'chart-bars' },
          timeline.slice(0, 7).reverse().map((day, idx) =>
            h('div', { key: idx, className: 'chart-bar-container' },
              h('div', {
                className: 'chart-bar',
                style: { height: `${Math.min((day.email_count / 20) * 100, 100)}%` }
              }),
              h('div', { className: 'chart-label' },
                new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
              )
            )
          )
        )
      )
    );
  }

  // ============================================
  // Meetings View Component
  // ============================================
  function MeetingsView({ currentUser }) {
    const [meetings, setMeetings] = useState([]);

    useEffect(() => {
      loadMeetings();
    }, []);

    const loadMeetings = async () => {
      try {
        const data = await API.getMeetings(currentUser);
        setMeetings(data.proposals || []);
      } catch (error) {
        console.error('Error loading meetings:', error);
      }
    };

    return h('div', { className: 'meetings-view' },
      h('h2', null, 'Upcoming Meetings'),
      
      meetings.length === 0 ? h('div', { className: 'empty-state' },
        h('p', null, 'No meetings scheduled')
      ) : h('div', { className: 'meetings-list' },
        meetings.map(meeting =>
          h('div', { key: meeting.id, className: 'meeting-item' },
            h('h3', null, meeting.title),
            h('div', { className: 'meeting-time' },
              '📅 ', new Date(meeting.proposed_date).toLocaleString()
            ),
            meeting.location && h('div', { className: 'meeting-location' },
              '📍 ', meeting.location
            ),
            h('div', {
              className: `meeting-status status-${meeting.status}`
            }, meeting.status)
          )
        )
      )
    );
  }

  // ============================================
  // Task Panel Component  
  // ============================================
  function TaskPanel({ tasks, onClose, onRefresh, currentUser }) {
    return h('div', { className: 'side-panel task-panel' },
      h('div', { className: 'panel-header' },
        h('h3', null, 'Quick Tasks'),
        h('button', { className: 'btn-close', onClick: onClose }, '✕')
      ),
      
      h('div', { className: 'panel-content' },
        tasks.slice(0, 5).map(task =>
          h('div', { key: task.id, className: 'task-quick-item' },
            h('div', { className: 'task-title' }, task.title),
            h('span', {
              className: `priority-badge priority-${task.priority}`
            }, task.priority)
          )
        ),
        
        tasks.length === 0 && h('p', null, 'No pending tasks')
      )
    );
  }

  // ============================================
  // CRM Panel Component
  // ============================================
  function CRMPanel({ contacts, selectedEmail, onClose, currentUser }) {
    const relatedContact = selectedEmail ? 
      contacts.find(c => c.email === selectedEmail.from_email) : null;

    return h('div', { className: 'side-panel crm-panel' },
      h('div', { className: 'panel-header' },
        h('h3', null, 'Contact Info'),
        h('button', { className: 'btn-close', onClick: onClose }, '✕')
      ),
      
      h('div', { className: 'panel-content' },
        relatedContact ? h('div', null,
          h('h4', null, relatedContact.name),
          h('p', null, relatedContact.email),
          relatedContact.company && h('p', null, relatedContact.company)
        ) : h('p', null, 'Select an email to see contact info')
      )
    );
  }

  // ============================================
  // Compose Modal Component
  // ============================================
  function ComposeModal({ onClose, onSend, currentUser }) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const handleSend = async () => {
      if (!to || !subject) {
        alert('Please fill in recipient and subject');
        return;
      }

      try {
        await API.sendEmail({
          from: currentUser,
          to,
          subject,
          body,
          useAI: true
        });
        onSend();
      } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to send email');
      }
    };

    return h('div', { className: 'modal-overlay', onClick: onClose },
      h('div', {
        className: 'modal-content compose-modal',
        onClick: (e) => e.stopPropagation()
      },
        h('div', { className: 'modal-header' },
          h('h2', null, 'Compose Email'),
          h('button', { className: 'btn-close', onClick: onClose }, '✕')
        ),
        
        h('div', { className: 'compose-form' },
          h('input', {
            type: 'email',
            placeholder: 'To',
            value: to,
            onChange: (e) => setTo(e.target.value)
          }),
          
          h('input', {
            type: 'text',
            placeholder: 'Subject',
            value: subject,
            onChange: (e) => setSubject(e.target.value)
          }),
          
          h('textarea', {
            placeholder: 'Write your message...',
            value: body,
            onChange: (e) => setBody(e.target.value),
            rows: 10
          }),
          
          h('div', { className: 'compose-actions' },
            h('button', {
              className: 'btn-primary',
              onClick: handleSend
            }, 'Send'),
            h('button', {
              className: 'btn-secondary',
              onClick: onClose
            }, 'Cancel')
          )
        )
      )
    );
  }

  // ============================================
  // Initialize App
  // ============================================
  const root = document.getElementById('email-root');
  if (root) {
    ReactDOM.render(h(EmailApp), root);
  }
})();
