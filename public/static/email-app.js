/**
 * InvestMail - Ultra-Modern Internal Email System
 * Frontend React Application
 * 
 * Features:
 * - Inbox with AI categorization and filters
 * - Email detail view with AI summary
 * - Compose modal with AI assistant
 * - Semantic search
 * - Analytics dashboard
 * - Settings page
 * - Fully responsive design
 */

// ============================================
// React Email Application
// ============================================

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ============================================
// API Service
// ============================================
const EmailAPI = {
  async getInbox(user, folder = 'inbox', limit = 50) {
    const params = new URLSearchParams({ user, folder, limit });
    const response = await fetch(`/api/email/inbox?${params}`);
    return response.json();
  },

  async getEmail(emailId) {
    const response = await fetch(`/api/email/${emailId}`);
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
  },

  async archiveEmail(emailId) {
    const response = await fetch(`/api/email/${emailId}/archive`, {
      method: 'POST'
    });
    return response.json();
  },

  async deleteEmail(emailId) {
    const response = await fetch(`/api/email/${emailId}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};

// ============================================
// Utility Functions
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

// Sidebar Navigation
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

  return (
    <div className="email-sidebar">
      <div className="sidebar-header">
        <div className="logo-section">
          <span className="logo-icon">✉️</span>
          <span className="logo-text">InvestMail</span>
        </div>
        <div className="user-info">
          <div className="user-avatar">{currentUser.charAt(0).toUpperCase()}</div>
          <div className="user-email">{currentUser}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="storage-info">
          <div className="storage-label">Storage</div>
          <div className="storage-bar">
            <div className="storage-used" style={{ width: '23%' }}></div>
          </div>
          <div className="storage-text">2.3 GB of 10 GB used</div>
        </div>
      </div>
    </div>
  );
}

// Email List Item
function EmailListItem({ email, isSelected, onSelect, onClick }) {
  const isUnread = email.is_read === 0;
  
  return (
    <div 
      className={`email-item ${isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="email-checkbox">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(email.id);
          }}
        />
      </div>

      <button 
        className={`email-star ${email.is_starred ? 'starred' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          EmailAPI.starEmail(email.id, !email.is_starred);
        }}
      >
        {email.is_starred ? '⭐' : '☆'}
      </button>

      <div className="email-from">
        <div className="email-avatar">{email.from_address.charAt(0).toUpperCase()}</div>
        <span className="email-sender">{email.from_address}</span>
      </div>

      <div className="email-content">
        <div className="email-subject-line">
          <span className="email-subject">{email.subject}</span>
          {email.ai_category && (
            <span 
              className="email-category-badge"
              style={{ backgroundColor: getCategoryColor(email.ai_category) }}
            >
              {getCategoryIcon(email.ai_category)} {email.ai_category.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="email-snippet">{email.snippet}</div>
      </div>

      <div className="email-meta">
        {email.has_attachments === 1 && <span className="attachment-icon">📎</span>}
        <span className="email-time">{formatDate(email.created_at)}</span>
      </div>
    </div>
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
      filtered = filtered.filter(e => e.ai_category === categoryFilter);
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'sender') {
      filtered.sort((a, b) => a.from_address.localeCompare(b.from_address));
    }

    return filtered;
  }, [emails, categoryFilter, sortBy]);

  const categories = useMemo(() => {
    const counts = {};
    emails.forEach(email => {
      const cat = email.ai_category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [emails]);

  const handleSelectAll = () => {
    if (selectedEmails.size === filteredEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    }
  };

  const handleBulkAction = async (action) => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    try {
      if (action === 'archive') {
        await Promise.all(ids.map(id => EmailAPI.archiveEmail(id)));
      } else if (action === 'delete') {
        await Promise.all(ids.map(id => EmailAPI.deleteEmail(id)));
      }
      await loadEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading inbox...</div>;
  }

  return (
    <div className="inbox-view">
      <div className="inbox-header">
        <div className="inbox-title">
          <h1>Inbox</h1>
          <span className="email-count">{emails.length} emails</span>
        </div>

        <div className="inbox-actions">
          <button className="btn-icon" onClick={loadEmails} title="Refresh">
            🔄
          </button>
          <select 
            className="inbox-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="sender">Sort by Sender</option>
          </select>
        </div>
      </div>

      <div className="inbox-filters">
        <button
          className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All ({emails.length})
        </button>
        {Object.entries(categories).map(([cat, count]) => (
          <button
            key={cat}
            className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
            style={{ borderColor: getCategoryColor(cat) }}
          >
            {getCategoryIcon(cat)} {cat.replace('_', ' ')} ({count})
          </button>
        ))}
      </div>

      {selectedEmails.size > 0 && (
        <div className="inbox-bulk-actions">
          <span className="bulk-count">{selectedEmails.size} selected</span>
          <button className="btn-bulk" onClick={() => handleBulkAction('archive')}>
            📦 Archive
          </button>
          <button className="btn-bulk" onClick={() => handleBulkAction('delete')}>
            🗑️ Delete
          </button>
          <button className="btn-bulk" onClick={() => setSelectedEmails(new Set())}>
            ✕ Clear
          </button>
        </div>
      )}

      <div className="inbox-toolbar">
        <label className="checkbox-label">
          <input 
            type="checkbox"
            checked={selectedEmails.size === filteredEmails.length && filteredEmails.length > 0}
            onChange={handleSelectAll}
          />
          <span>Select all</span>
        </label>
      </div>

      <div className="email-list">
        {filteredEmails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No emails found</h3>
            <p>Your inbox is empty or no emails match the current filter.</p>
          </div>
        ) : (
          filteredEmails.map(email => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedEmails.has(email.id)}
              onSelect={(id) => {
                const newSelected = new Set(selectedEmails);
                if (newSelected.has(id)) {
                  newSelected.delete(id);
                } else {
                  newSelected.add(id);
                }
                setSelectedEmails(newSelected);
              }}
              onClick={() => onEmailSelect(email)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Email Detail View
function EmailDetailView({ email, onBack }) {
  const [showAISummary, setShowAISummary] = useState(true);

  if (!email) {
    return (
      <div className="email-detail-empty">
        <div className="empty-icon">✉️</div>
        <h3>Select an email to read</h3>
        <p>Choose an email from the list to view its contents</p>
      </div>
    );
  }

  return (
    <div className="email-detail-view">
      <div className="email-detail-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to inbox
        </button>
        <div className="email-detail-actions">
          <button className="btn-icon" title="Reply">↩️ Reply</button>
          <button className="btn-icon" title="Forward">➡️ Forward</button>
          <button className="btn-icon" title="Archive">📦 Archive</button>
          <button className="btn-icon" title="Delete">🗑️ Delete</button>
        </div>
      </div>

      {email.ai_summary && showAISummary && (
        <div className="ai-summary-card">
          <div className="ai-summary-header">
            <span className="ai-badge">🤖 AI Summary</span>
            <button 
              className="btn-close"
              onClick={() => setShowAISummary(false)}
            >
              ✕
            </button>
          </div>
          <p className="ai-summary-text">{email.ai_summary}</p>
          
          {email.ai_action_items && email.ai_action_items.length > 0 && (
            <div className="ai-action-items">
              <h4>Action Items:</h4>
              <ul>
                {email.ai_action_items.map((item, idx) => (
                  <li key={idx}>
                    <input type="checkbox" id={`action-${idx}`} />
                    <label htmlFor={`action-${idx}`}>{item}</label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {email.ai_sentiment && (
            <div className="ai-sentiment">
              <span className="sentiment-label">Tone:</span>
              <span className={`sentiment-badge sentiment-${email.ai_sentiment}`}>
                {email.ai_sentiment}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="email-detail-content">
        <div className="email-subject">
          <h2>{email.subject}</h2>
          {email.ai_category && (
            <span 
              className="email-category-badge large"
              style={{ backgroundColor: getCategoryColor(email.ai_category) }}
            >
              {getCategoryIcon(email.ai_category)} {email.ai_category.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="email-sender-info">
          <div className="sender-avatar large">
            {email.from_address.charAt(0).toUpperCase()}
          </div>
          <div className="sender-details">
            <div className="sender-name">{email.from_address}</div>
            <div className="sender-meta">
              To: {email.to_address} • {new Date(email.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="email-body" dangerouslySetInnerHTML={{ __html: email.body }} />

        {email.has_attachments === 1 && (
          <div className="email-attachments">
            <h4>Attachments</h4>
            <div className="attachment-list">
              <div className="attachment-item">
                <span className="attachment-icon">📎</span>
                <span className="attachment-name">document.pdf</span>
                <span className="attachment-size">2.4 MB</span>
                <button className="btn-download">Download</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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
        // Reset form
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="compose-modal" onClick={(e) => e.stopPropagation()}>
        <div className="compose-header">
          <h3>New Message</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="compose-body">
          <div className="compose-field">
            <label>To:</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@investaycapital.com"
            />
          </div>

          <div className="compose-field">
            <label>Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="compose-field">
            <label>Message:</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={12}
            />
          </div>

          <div className="compose-options">
            <label className="ai-toggle">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
              />
              <span>🤖 Enable AI features</span>
            </label>

            {useAI && (
              <div className="ai-assist-menu">
                <button 
                  className="btn-ai-assist"
                  onClick={() => setShowAIMenu(!showAIMenu)}
                  disabled={aiLoading || !body}
                >
                  ✨ AI Assistant {showAIMenu ? '▼' : '▶'}
                </button>

                {showAIMenu && (
                  <div className="ai-actions">
                    <button onClick={() => handleAIAssist('improve')} disabled={aiLoading}>
                      ✍️ Improve Writing
                    </button>
                    <button onClick={() => handleAIAssist('expand')} disabled={aiLoading}>
                      📝 Expand Content
                    </button>
                    <button onClick={() => handleAIAssist('shorten')} disabled={aiLoading}>
                      ✂️ Make Shorter
                    </button>
                    <button onClick={() => handleAIAssist('professional')} disabled={aiLoading}>
                      💼 Make Professional
                    </button>
                    <button onClick={() => handleAIAssist('friendly')} disabled={aiLoading}>
                      😊 Make Friendly
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="compose-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSend}>
            📤 Send Email
          </button>
        </div>

        {aiLoading && (
          <div className="ai-loading-overlay">
            <div className="ai-loading-spinner">🤖 AI is enhancing your message...</div>
          </div>
        )}
      </div>
    </div>
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

  return (
    <div className="search-view">
      <div className="search-header">
        <h1>Search Emails</h1>
        <p>Use semantic search powered by AI to find emails by meaning, not just keywords</p>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by topic, sender, keywords, or natural language..."
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? '⏳' : '🔍'} Search
          </button>
        </div>
      </form>

      <div className="search-examples">
        <span className="example-label">Try:</span>
        <button className="example-chip" onClick={() => setQuery('urgent financial matters')}>
          "urgent financial matters"
        </button>
        <button className="example-chip" onClick={() => setQuery('emails about legal compliance')}>
          "emails about legal compliance"
        </button>
        <button className="example-chip" onClick={() => setQuery('meeting requests from last week')}>
          "meeting requests from last week"
        </button>
      </div>

      {loading && (
        <div className="search-loading">
          <div className="loading-spinner">🤖 AI is searching through your emails...</div>
        </div>
      )}

      {!loading && searched && (
        <div className="search-results">
          <div className="results-header">
            <h3>Found {results.length} results</h3>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try different keywords or a broader search query</p>
            </div>
          ) : (
            <div className="email-list">
              {results.map(email => (
                <div key={email.id} className="search-result-item">
                  <div className="result-header">
                    <span className="result-from">{email.from_address}</span>
                    <span className="result-date">{formatDate(email.created_at)}</span>
                  </div>
                  <div className="result-subject">{email.subject}</div>
                  <div className="result-snippet">{email.snippet}</div>
                  {email.ai_category && (
                    <span 
                      className="email-category-badge"
                      style={{ backgroundColor: getCategoryColor(email.ai_category) }}
                    >
                      {getCategoryIcon(email.ai_category)} {email.ai_category.replace('_', ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Analytics Dashboard
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
    return <div className="loading-spinner">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="error-message">Failed to load analytics</div>;
  }

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h1>📊 Email Analytics</h1>
        <button className="btn-refresh" onClick={loadAnalytics}>
          🔄 Refresh
        </button>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-icon">📥</div>
          <div className="card-value">{analytics.total_emails}</div>
          <div className="card-label">Total Emails</div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📬</div>
          <div className="card-value">{analytics.unread_count}</div>
          <div className="card-label">Unread Emails</div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📤</div>
          <div className="card-value">{analytics.sent_today}</div>
          <div className="card-label">Sent Today</div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">⭐</div>
          <div className="card-value">{analytics.starred_count || 0}</div>
          <div className="card-label">Starred</div>
        </div>
      </div>

      {analytics.top_senders && analytics.top_senders.length > 0 && (
        <div className="analytics-section">
          <h3>Top Senders</h3>
          <div className="top-senders-list">
            {analytics.top_senders.map((sender, idx) => (
              <div key={idx} className="sender-item">
                <div className="sender-avatar">
                  {sender.sender.charAt(0).toUpperCase()}
                </div>
                <div className="sender-info">
                  <div className="sender-email">{sender.sender}</div>
                  <div className="sender-count">{sender.count} emails</div>
                </div>
                <div className="sender-bar">
                  <div 
                    className="sender-bar-fill"
                    style={{ 
                      width: `${(sender.count / analytics.top_senders[0].count) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="analytics-section">
        <h3>AI Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🤖</div>
            <div className="insight-title">AI Processing</div>
            <div className="insight-value">
              {analytics.ai_processed || 0} emails analyzed
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <div className="insight-title">Response Time</div>
            <div className="insight-value">~2 hours avg</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-title">Productivity</div>
            <div className="insight-value">+45% this week</div>
          </div>
        </div>
      </div>
    </div>
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

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
      </div>

      <div className="settings-section">
        <h3>AI Features</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.aiEnabled}
              onChange={(e) => setSettings({...settings, aiEnabled: e.target.checked})}
            />
            <span>Enable AI features</span>
          </label>
          <p className="setting-description">
            Use AI for email categorization, summarization, and smart replies
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoSummarize}
              onChange={(e) => setSettings({...settings, autoSummarize: e.target.checked})}
            />
            <span>Auto-summarize emails</span>
          </label>
          <p className="setting-description">
            Automatically generate AI summaries for incoming emails
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoCategorize}
              onChange={(e) => setSettings({...settings, autoCategorize: e.target.checked})}
            />
            <span>Auto-categorize emails</span>
          </label>
          <p className="setting-description">
            Automatically categorize emails by topic and priority
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.smartReplies}
              onChange={(e) => setSettings({...settings, smartReplies: e.target.checked})}
            />
            <span>Smart reply suggestions</span>
          </label>
          <p className="setting-description">
            Get AI-powered reply suggestions for your emails
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
            />
            <span>Enable notifications</span>
          </label>
          <p className="setting-description">
            Receive notifications for new emails and updates
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="setting-item">
          <label>Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({...settings, theme: e.target.value})}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn-primary" onClick={handleSave}>
          💾 Save Settings
        </button>
      </div>
    </div>
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
    // Load unread count
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
        return <InboxView currentUser={currentUser} onEmailSelect={handleEmailSelect} />;
      case 'detail':
        return <EmailDetailView email={selectedEmail} onBack={handleBackToInbox} />;
      case 'search':
        return <SearchView currentUser={currentUser} />;
      case 'analytics':
        return <AnalyticsView currentUser={currentUser} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <InboxView currentUser={currentUser} onEmailSelect={handleEmailSelect} />;
    }
  };

  return (
    <div className="email-app">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        unreadCount={unreadCount}
      />

      <main className="email-main">
        <div className="email-content">
          {renderView()}
        </div>

        <button 
          className="fab-compose"
          onClick={() => setShowCompose(true)}
          title="Compose new email"
        >
          ✏️
        </button>
      </main>

      <ComposeModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={() => {
          setShowCompose(false);
          if (currentView === 'inbox') {
            window.location.reload();
          }
        }}
        currentUser={currentUser}
      />
    </div>
  );
}

// Initialize app
const root = ReactDOM.createRoot(document.getElementById('email-root'));
root.render(<EmailApp />);
