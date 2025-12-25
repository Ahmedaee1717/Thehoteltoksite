/**
 * InvestMail - Ultra-Modern Internal Email System
 * Complete Frontend with All Features
 */

(function() {
  'use strict';
  
  // Wait for React to load
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('React not loaded, retrying...');
    setTimeout(arguments.callee, 50);
    return;
  }

  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const { createElement: h } = React;

  // ============================================
  // API Service
  // ============================================
  const EmailAPI = {
    async getInbox(user, folder = 'inbox', limit = 50) {
      const params = new URLSearchParams({ user, folder, limit });
      const response = await fetch(`/api/email/inbox?${params}`);
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

    async composeAssist(action, content) {
      const response = await fetch('/api/email/compose-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content })
      });
      return response.json();
    },

    async search(query, user) {
      const response = await fetch('/api/email/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user })
      });
      return response.json();
    },

    async getAnalytics(user) {
      const response = await fetch(`/api/email/analytics/summary?user=${user}`);
      return response.json();
    },

    async starEmail(emailId, starred) {
      const response = await fetch(`/api/email/${emailId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred })
      });
      return response.json();
    }
  };

  // ============================================
  // Utilities
  // ============================================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (hours < 48) return 'Yesterday';
    if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      urgent: '#ff4444',
      action_required: '#ff9500',
      important: '#d4af37',
      financial: '#10b981',
      legal: '#3b82f6',
      update: '#6366f1',
      social: '#ec4899',
      marketing: '#8b5cf6',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      urgent: '🚨',
      action_required: '⚡',
      important: '⭐',
      financial: '💰',
      legal: '⚖️',
      update: '📢',
      social: '👥',
      marketing: '📈',
      other: '📧'
    };
    return icons[category] || icons.other;
  };

  // ============================================
  // Components
  // ============================================

  // Sidebar
  function Sidebar({ currentView, onViewChange, currentUser, unreadCount }) {
    const menuItems = [
      { id: 'inbox', icon: '📥', label: 'Inbox', badge: unreadCount },
      { id: 'starred', icon: '⭐', label: 'Starred' },
      { id: 'sent', icon: '📤', label: 'Sent' },
      { id: 'drafts', icon: '📝', label: 'Drafts' },
      { id: 'archived', icon: '📦', label: 'Archived' },
      { id: 'search', icon: '🔍', label: 'Search' },
      { id: 'analytics', icon: '📊', label: 'Analytics' },
      { id: 'settings', icon: '⚙️', label: 'Settings' }
    ];

    return h('div', { className: 'email-sidebar' },
      h('div', { className: 'sidebar-header' },
        h('div', { className: 'logo-section' },
          h('span', { className: 'logo-icon' }, '✉️'),
          h('span', { className: 'logo-text' }, 'InvestMail')
        ),
        h('div', { className: 'user-info' },
          h('div', { className: 'user-avatar' }, currentUser.charAt(0).toUpperCase()),
          h('div', { className: 'user-email' }, currentUser)
        )
      ),
      h('nav', { className: 'sidebar-nav' },
        menuItems.map(item => 
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
        h('div', { className: 'storage-info' },
          h('div', { className: 'storage-label' }, 'Storage'),
          h('div', { className: 'storage-bar' },
            h('div', { className: 'storage-used', style: { width: '23%' } })
          ),
          h('div', { className: 'storage-text' }, '2.3 GB of 10 GB used')
        )
      )
    );
  }

  // Email List Item
  function EmailListItem({ email, isSelected, onSelect, onClick }) {
    return h('div', {
      className: `email-item ${email.is_read === 0 ? 'unread' : ''} ${isSelected ? 'selected' : ''}`,
      onClick: onClick
    },
      h('div', { className: 'email-checkbox' },
        h('input', {
          type: 'checkbox',
          checked: isSelected,
          onChange: (e) => { e.stopPropagation(); onSelect(email.id); }
        })
      ),
      h('button', {
        className: `email-star ${email.is_starred ? 'starred' : ''}`,
        onClick: (e) => {
          e.stopPropagation();
          EmailAPI.starEmail(email.id, !email.is_starred);
        }
      }, email.is_starred ? '⭐' : '☆'),
      h('div', { className: 'email-from' },
        h('div', { className: 'email-avatar' }, 
          (email.from_email || email.from_address || 'U').charAt(0).toUpperCase()
        ),
        h('span', { className: 'email-sender' }, email.from_email || email.from_address || 'Unknown')
      ),
      h('div', { className: 'email-content' },
        h('div', { className: 'email-subject-line' },
          h('span', { className: 'email-subject' }, email.subject),
          email.category && h('span', {
            className: 'email-category-badge',
            style: { backgroundColor: getCategoryColor(email.category) }
          }, `${getCategoryIcon(email.category)} ${email.category.replace('_', ' ')}`)
        ),
        h('div', { className: 'email-snippet' }, email.snippet)
      ),
      h('div', { className: 'email-meta' },
        email.has_attachments === 1 && h('span', { className: 'attachment-icon' }, '📎'),
        h('span', { className: 'email-time' }, formatDate(email.sent_at || email.created_at))
      )
    );
  }

  // Inbox View
  function InboxView({ currentUser, onEmailSelect }) {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
      loadEmails();
    }, [currentUser]);

    const loadEmails = async () => {
      setLoading(true);
      try {
        const result = await EmailAPI.getInbox(currentUser);
        if (result.success) {
          setEmails(result.emails || []);
        }
      } catch (error) {
        console.error('Failed to load emails:', error);
      } finally {
        setLoading(false);
      }
    };

    const filteredEmails = useMemo(() => {
      let filtered = emails;
      
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(e => e.category === categoryFilter);
      }

      if (sortBy === 'date') {
        filtered.sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at));
      } else if (sortBy === 'sender') {
        filtered.sort((a, b) => (a.from_email || '').localeCompare(b.from_email || ''));
      }

      return filtered;
    }, [emails, categoryFilter, sortBy]);

    const categories = useMemo(() => {
      const counts = {};
      emails.forEach(email => {
        const cat = email.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return counts;
    }, [emails]);

    if (loading) {
      return h('div', { className: 'loading-spinner' }, 'Loading inbox...');
    }

    return h('div', { className: 'inbox-view' },
      h('div', { className: 'inbox-header' },
        h('div', { className: 'inbox-title' },
          h('h1', null, 'Inbox'),
          h('span', { className: 'email-count' }, `${emails.length} emails`)
        ),
        h('div', { className: 'inbox-actions' },
          h('button', { className: 'btn-icon', onClick: loadEmails, title: 'Refresh' }, '🔄'),
          h('select', {
            className: 'inbox-sort',
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value)
          },
            h('option', { value: 'date' }, 'Sort by Date'),
            h('option', { value: 'sender' }, 'Sort by Sender')
          )
        )
      ),
      h('div', { className: 'inbox-filters' },
        h('button', {
          className: `filter-chip ${categoryFilter === 'all' ? 'active' : ''}`,
          onClick: () => setCategoryFilter('all')
        }, `All (${emails.length})`),
        Object.entries(categories).map(([cat, count]) =>
          h('button', {
            key: cat,
            className: `filter-chip ${categoryFilter === cat ? 'active' : ''}`,
            onClick: () => setCategoryFilter(cat),
            style: { borderColor: getCategoryColor(cat) }
          }, `${getCategoryIcon(cat)} ${cat.replace('_', ' ')} (${count})`)
        )
      ),
      filteredEmails.length === 0 ? h('div', { className: 'empty-state' },
        h('div', { className: 'empty-icon' }, '📭'),
        h('h3', null, 'No emails found'),
        h('p', null, 'Your inbox is empty or no emails match the filter.')
      ) : h('div', { className: 'email-list' },
        filteredEmails.map(email =>
          h(EmailListItem, {
            key: email.id,
            email: email,
            isSelected: selectedEmails.has(email.id),
            onSelect: (id) => {
              const newSelected = new Set(selectedEmails);
              if (newSelected.has(id)) {
                newSelected.delete(id);
              } else {
                newSelected.add(id);
              }
              setSelectedEmails(newSelected);
            },
            onClick: () => onEmailSelect(email)
          })
        )
      )
    );
  }

  // Email Detail View
  function EmailDetailView({ email, onBack }) {
    if (!email) {
      return h('div', { className: 'email-detail-empty' },
        h('div', { className: 'empty-icon' }, '✉️'),
        h('h3', null, 'Select an email to read'),
        h('p', null, 'Choose an email from the list to view its contents')
      );
    }

    return h('div', { className: 'email-detail-view' },
      h('div', { className: 'email-detail-header' },
        h('button', { className: 'btn-back', onClick: onBack }, '← Back to inbox'),
        h('div', { className: 'email-detail-actions' },
          h('button', { className: 'btn-icon', title: 'Reply' }, '↩️ Reply'),
          h('button', { className: 'btn-icon', title: 'Forward' }, '➡️ Forward'),
          h('button', { className: 'btn-icon', title: 'Archive' }, '📦 Archive'),
          h('button', { className: 'btn-icon', title: 'Delete' }, '🗑️ Delete')
        )
      ),
      email.ai_summary && h('div', { className: 'ai-summary-card' },
        h('div', { className: 'ai-summary-header' },
          h('span', { className: 'ai-badge' }, '🤖 AI Summary')
        ),
        h('p', { className: 'ai-summary-text' }, email.ai_summary),
        email.ai_action_items && email.ai_action_items.length > 0 && h('div', { className: 'ai-action-items' },
          h('h4', null, 'Action Items:'),
          h('ul', null,
            email.ai_action_items.map((item, idx) =>
              h('li', { key: idx },
                h('input', { type: 'checkbox', id: `action-${idx}` }),
                h('label', { htmlFor: `action-${idx}` }, item)
              )
            )
          )
        )
      ),
      h('div', { className: 'email-detail-content' },
        h('div', { className: 'email-subject' },
          h('h2', null, email.subject),
          email.category && h('span', {
            className: 'email-category-badge large',
            style: { backgroundColor: getCategoryColor(email.category) }
          }, `${getCategoryIcon(email.category)} ${email.category.replace('_', ' ')}`)
        ),
        h('div', { className: 'email-sender-info' },
          h('div', { className: 'sender-avatar large' },
            (email.from_email || 'U').charAt(0).toUpperCase()
          ),
          h('div', { className: 'sender-details' },
            h('div', { className: 'sender-name' }, email.from_email || 'Unknown'),
            h('div', { className: 'sender-meta' },
              `To: ${email.to_email || 'Unknown'} • ${new Date(email.sent_at || email.created_at).toLocaleString()}`
            )
          )
        ),
        h('div', { 
          className: 'email-body',
          dangerouslySetInnerHTML: { __html: email.body || email.html_body || 'No content' }
        })
      )
    );
  }

  // Compose Modal
  function ComposeModal({ isOpen, onClose, onSend, currentUser }) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [useAI, setUseAI] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);

    const handleAIAssist = async (action) => {
      if (!body) return;
      
      setAiLoading(true);
      try {
        const result = await EmailAPI.composeAssist(action, body);
        if (result.success) {
          setBody(result.enhanced_content);
        }
      } catch (error) {
        console.error('AI assist failed:', error);
      } finally {
        setAiLoading(false);
        setShowAIMenu(false);
      }
    };

    const handleSend = async () => {
      if (!to || !subject || !body) {
        alert('Please fill in all fields');
        return;
      }

      try {
        const result = await EmailAPI.sendEmail({
          from: currentUser,
          to,
          subject,
          body,
          useAI
        });

        if (result.success) {
          onSend();
          onClose();
          setTo('');
          setSubject('');
          setBody('');
        }
      } catch (error) {
        console.error('Failed to send email:', error);
        alert('Failed to send email');
      }
    };

    if (!isOpen) return null;

    return h('div', { className: 'modal-overlay', onClick: onClose },
      h('div', { className: 'compose-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'compose-header' },
          h('h3', null, 'New Message'),
          h('button', { className: 'btn-close', onClick: onClose }, '✕')
        ),
        h('div', { className: 'compose-body' },
          h('div', { className: 'compose-field' },
            h('label', null, 'To:'),
            h('input', {
              type: 'email',
              value: to,
              onChange: (e) => setTo(e.target.value),
              placeholder: 'recipient@investaycapital.com'
            })
          ),
          h('div', { className: 'compose-field' },
            h('label', null, 'Subject:'),
            h('input', {
              type: 'text',
              value: subject,
              onChange: (e) => setSubject(e.target.value),
              placeholder: 'Email subject'
            })
          ),
          h('div', { className: 'compose-field' },
            h('label', null, 'Message:'),
            h('textarea', {
              value: body,
              onChange: (e) => setBody(e.target.value),
              placeholder: 'Write your message...',
              rows: 12
            })
          ),
          h('div', { className: 'compose-options' },
            h('label', { className: 'ai-toggle' },
              h('input', {
                type: 'checkbox',
                checked: useAI,
                onChange: (e) => setUseAI(e.target.checked)
              }),
              h('span', null, '🤖 Enable AI features')
            ),
            useAI && h('div', { className: 'ai-assist-menu' },
              h('button', {
                className: 'btn-ai-assist',
                onClick: () => setShowAIMenu(!showAIMenu),
                disabled: aiLoading || !body
              }, `✨ AI Assistant ${showAIMenu ? '▼' : '▶'}`),
              showAIMenu && h('div', { className: 'ai-actions' },
                h('button', { onClick: () => handleAIAssist('improve'), disabled: aiLoading }, '✍️ Improve Writing'),
                h('button', { onClick: () => handleAIAssist('expand'), disabled: aiLoading }, '📝 Expand Content'),
                h('button', { onClick: () => handleAIAssist('shorten'), disabled: aiLoading }, '✂️ Make Shorter'),
                h('button', { onClick: () => handleAIAssist('professional'), disabled: aiLoading }, '💼 Make Professional'),
                h('button', { onClick: () => handleAIAssist('friendly'), disabled: aiLoading }, '😊 Make Friendly')
              )
            )
          )
        ),
        h('div', { className: 'compose-footer' },
          h('button', { className: 'btn-secondary', onClick: onClose }, 'Cancel'),
          h('button', { className: 'btn-primary', onClick: handleSend }, '📤 Send Email')
        ),
        aiLoading && h('div', { className: 'ai-loading-overlay' },
          h('div', { className: 'ai-loading-spinner' }, '🤖 AI is enhancing your message...')
        )
      )
    );
  }

  // Search View
  function SearchView({ currentUser }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
      e.preventDefault();
      if (!query.trim()) return;

      setLoading(true);
      setSearched(true);
      try {
        const result = await EmailAPI.search(query, currentUser);
        if (result.success) {
          setResults(result.emails || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    return h('div', { className: 'search-view' },
      h('div', { className: 'search-header' },
        h('h1', null, 'Search Emails'),
        h('p', null, 'Use semantic search powered by AI to find emails by meaning, not just keywords')
      ),
      h('form', { className: 'search-form', onSubmit: handleSearch },
        h('div', { className: 'search-input-wrapper' },
          h('input', {
            type: 'text',
            className: 'search-input',
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: 'Search by topic, sender, keywords, or natural language...'
          }),
          h('button', { type: 'submit', className: 'search-button', disabled: loading },
            `${loading ? '⏳' : '🔍'} Search`
          )
        )
      ),
      h('div', { className: 'search-examples' },
        h('span', { className: 'example-label' }, 'Try:'),
        h('button', { className: 'example-chip', onClick: () => setQuery('urgent financial matters') }, '"urgent financial matters"'),
        h('button', { className: 'example-chip', onClick: () => setQuery('emails about legal compliance') }, '"emails about legal compliance"'),
        h('button', { className: 'example-chip', onClick: () => setQuery('meeting requests from last week') }, '"meeting requests from last week"')
      ),
      loading && h('div', { className: 'search-loading' },
        h('div', { className: 'loading-spinner' }, '🤖 AI is searching through your emails...')
      ),
      !loading && searched && h('div', { className: 'search-results' },
        h('div', { className: 'results-header' },
          h('h3', null, `Found ${results.length} results`)
        ),
        results.length === 0 ? h('div', { className: 'empty-state' },
          h('div', { className: 'empty-icon' }, '🔍'),
          h('h3', null, 'No results found'),
          h('p', null, 'Try different keywords or a broader search query')
        ) : h('div', { className: 'email-list' },
          results.map(email =>
            h('div', { key: email.id, className: 'search-result-item' },
              h('div', { className: 'result-header' },
                h('span', { className: 'result-from' }, email.from_email || email.from_address),
                h('span', { className: 'result-date' }, formatDate(email.sent_at || email.created_at))
              ),
              h('div', { className: 'result-subject' }, email.subject),
              h('div', { className: 'result-snippet' }, email.snippet),
              email.category && h('span', {
                className: 'email-category-badge',
                style: { backgroundColor: getCategoryColor(email.category) }
              }, `${getCategoryIcon(email.category)} ${email.category.replace('_', ' ')}`)
            )
          )
        )
      )
    );
  }

  // Analytics View
  function AnalyticsView({ currentUser }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadAnalytics();
    }, [currentUser]);

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const result = await EmailAPI.getAnalytics(currentUser);
        if (result.success) {
          setAnalytics(result.analytics);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return h('div', { className: 'loading-spinner' }, 'Loading analytics...');
    }

    if (!analytics) {
      return h('div', { className: 'error-message' }, 'Failed to load analytics');
    }

    return h('div', { className: 'analytics-view' },
      h('div', { className: 'analytics-header' },
        h('h1', null, '📊 Email Analytics'),
        h('button', { className: 'btn-refresh', onClick: loadAnalytics }, '🔄 Refresh')
      ),
      h('div', { className: 'analytics-grid' },
        h('div', { className: 'analytics-card' },
          h('div', { className: 'card-icon' }, '📥'),
          h('div', { className: 'card-value' }, analytics.total_emails),
          h('div', { className: 'card-label' }, 'Total Emails')
        ),
        h('div', { className: 'analytics-card' },
          h('div', { className: 'card-icon' }, '📬'),
          h('div', { className: 'card-value' }, analytics.unread_count),
          h('div', { className: 'card-label' }, 'Unread Emails')
        ),
        h('div', { className: 'analytics-card' },
          h('div', { className: 'card-icon' }, '📤'),
          h('div', { className: 'card-value' }, analytics.sent_today),
          h('div', { className: 'card-label' }, 'Sent Today')
        ),
        h('div', { className: 'analytics-card' },
          h('div', { className: 'card-icon' }, '⭐'),
          h('div', { className: 'card-value' }, analytics.starred_count || 0),
          h('div', { className: 'card-label' }, 'Starred')
        )
      ),
      analytics.top_senders && analytics.top_senders.length > 0 && h('div', { className: 'analytics-section' },
        h('h3', null, 'Top Senders'),
        h('div', { className: 'top-senders-list' },
          analytics.top_senders.map((sender, idx) =>
            h('div', { key: idx, className: 'sender-item' },
              h('div', { className: 'sender-avatar' }, sender.sender.charAt(0).toUpperCase()),
              h('div', { className: 'sender-info' },
                h('div', { className: 'sender-email' }, sender.sender),
                h('div', { className: 'sender-count' }, `${sender.count} emails`)
              ),
              h('div', { className: 'sender-bar' },
                h('div', {
                  className: 'sender-bar-fill',
                  style: { width: `${(sender.count / analytics.top_senders[0].count) * 100}%` }
                })
              )
            )
          )
        )
      )
    );
  }

  // Settings View
  function SettingsView() {
    const [settings, setSettings] = useState({
      aiEnabled: true,
      autoSummarize: true,
      autoCategorize: true,
      smartReplies: true,
      notifications: true,
      theme: 'light'
    });

    const handleSave = () => {
      localStorage.setItem('emailSettings', JSON.stringify(settings));
      alert('Settings saved successfully!');
    };

    return h('div', { className: 'settings-view' },
      h('div', { className: 'settings-header' },
        h('h1', null, '⚙️ Settings')
      ),
      h('div', { className: 'settings-section' },
        h('h3', null, 'AI Features'),
        h('div', { className: 'setting-item' },
          h('label', null,
            h('input', {
              type: 'checkbox',
              checked: settings.aiEnabled,
              onChange: (e) => setSettings({...settings, aiEnabled: e.target.checked})
            }),
            h('span', null, 'Enable AI features')
          ),
          h('p', { className: 'setting-description' }, 'Use AI for email categorization, summarization, and smart replies')
        ),
        h('div', { className: 'setting-item' },
          h('label', null,
            h('input', {
              type: 'checkbox',
              checked: settings.autoSummarize,
              onChange: (e) => setSettings({...settings, autoSummarize: e.target.checked})
            }),
            h('span', null, 'Auto-summarize emails')
          ),
          h('p', { className: 'setting-description' }, 'Automatically generate AI summaries for incoming emails')
        )
      ),
      h('div', { className: 'settings-footer' },
        h('button', { className: 'btn-primary', onClick: handleSave }, '💾 Save Settings')
      )
    );
  }

  // Main App
  function EmailApp() {
    const [currentView, setCurrentView] = useState('inbox');
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [currentUser] = useState('admin@investaycapital.com');
    const [showCompose, setShowCompose] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      EmailAPI.getInbox(currentUser).then(result => {
        if (result.success && result.emails) {
          const unread = result.emails.filter(e => e.is_read === 0).length;
          setUnreadCount(unread);
        }
      });
    }, [currentUser]);

    const handleEmailSelect = (email) => {
      setSelectedEmail(email);
      setCurrentView('detail');
    };

    const handleBackToInbox = () => {
      setSelectedEmail(null);
      setCurrentView('inbox');
    };

    const renderView = () => {
      switch (currentView) {
        case 'inbox':
          return h(InboxView, { currentUser, onEmailSelect: handleEmailSelect });
        case 'detail':
          return h(EmailDetailView, { email: selectedEmail, onBack: handleBackToInbox });
        case 'search':
          return h(SearchView, { currentUser });
        case 'analytics':
          return h(AnalyticsView, { currentUser });
        case 'settings':
          return h(SettingsView);
        default:
          return h('div', { className: 'empty-state' },
            h('div', { className: 'empty-icon' }, '🚧'),
            h('h3', null, 'Coming Soon'),
            h('p', null, `${currentView} view is under construction`)
          );
      }
    };

    return h('div', { className: 'email-app' },
      h(Sidebar, {
        currentView: currentView,
        onViewChange: setCurrentView,
        currentUser: currentUser,
        unreadCount: unreadCount
      }),
      h('main', { className: 'email-main' },
        h('div', { className: 'email-content' }, renderView()),
        h('button', {
          className: 'fab-compose',
          onClick: () => setShowCompose(true),
          title: 'Compose new email'
        }, '✏️')
      ),
      h(ComposeModal, {
        isOpen: showCompose,
        onClose: () => setShowCompose(false),
        onSend: () => {
          setShowCompose(false);
          if (currentView === 'inbox') {
            window.location.reload();
          }
        },
        currentUser: currentUser
      })
    );
  }

  // Initialize
  function initApp() {
    const rootElement = document.getElementById('email-root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }

    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(h(EmailApp));
      console.log('✅ InvestMail initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
