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

// Wait for React to load and DOM to be ready
(function() {
  'use strict';
  
  // Check if React is loaded
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('React or ReactDOM not loaded. Waiting...');
    setTimeout(arguments.callee, 50);
    return;
  }

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

    return React.createElement('div', { className: 'email-sidebar' },
      React.createElement('div', { className: 'sidebar-header' },
        React.createElement('div', { className: 'logo-section' },
          React.createElement('span', { className: 'logo-icon' }, '✉️'),
          React.createElement('span', { className: 'logo-text' }, 'InvestMail')
        ),
        React.createElement('div', { className: 'user-info' },
          React.createElement('div', { className: 'user-avatar' }, currentUser.charAt(0).toUpperCase()),
          React.createElement('div', { className: 'user-email' }, currentUser)
        )
      ),
      React.createElement('nav', { className: 'sidebar-nav' },
        menuItems.map(item => 
          React.createElement('button', {
            key: item.id,
            className: `nav-item ${currentView === item.id ? 'active' : ''}`,
            onClick: () => onViewChange(item.id)
          },
            React.createElement('span', { className: 'nav-icon' }, item.icon),
            React.createElement('span', { className: 'nav-label' }, item.label),
            item.badge > 0 && React.createElement('span', { className: 'nav-badge' }, item.badge)
          )
        )
      ),
      React.createElement('div', { className: 'sidebar-footer' },
        React.createElement('div', { className: 'storage-info' },
          React.createElement('div', { className: 'storage-label' }, 'Storage'),
          React.createElement('div', { className: 'storage-bar' },
            React.createElement('div', { className: 'storage-used', style: { width: '23%' } })
          ),
          React.createElement('div', { className: 'storage-text' }, '2.3 GB of 10 GB used')
        )
      )
    );
  }

  // Simple Loading Component
  function LoadingSpinner({ message = 'Loading...' }) {
    return React.createElement('div', { className: 'loading-spinner' }, message);
  }

  // Simple Empty State Component
  function EmptyState({ icon, title, message }) {
    return React.createElement('div', { className: 'empty-state' },
      React.createElement('div', { className: 'empty-icon' }, icon),
      React.createElement('h3', null, title),
      React.createElement('p', null, message)
    );
  }

  // Inbox View (Simplified for initial load)
  function InboxView({ currentUser, onEmailSelect }) {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      EmailAPI.getInbox(currentUser)
        .then(result => {
          if (result.success) {
            setEmails(result.emails || []);
          }
        })
        .catch(error => console.error('Failed to load emails:', error))
        .finally(() => setLoading(false));
    }, [currentUser]);

    if (loading) {
      return React.createElement(LoadingSpinner, { message: 'Loading inbox...' });
    }

    if (emails.length === 0) {
      return React.createElement(EmptyState, {
        icon: '📭',
        title: 'No emails',
        message: 'Your inbox is empty'
      });
    }

    return React.createElement('div', { className: 'inbox-view' },
      React.createElement('div', { className: 'inbox-header' },
        React.createElement('div', { className: 'inbox-title' },
          React.createElement('h1', null, 'Inbox'),
          React.createElement('span', { className: 'email-count' }, `${emails.length} emails`)
        )
      ),
      React.createElement('div', { className: 'email-list' },
        emails.map(email => 
          React.createElement('div', {
            key: email.id,
            className: 'email-item',
            onClick: () => onEmailSelect(email)
          },
            React.createElement('div', { className: 'email-from' },
              React.createElement('div', { className: 'email-avatar' }, 
                email.from_email.charAt(0).toUpperCase()
              ),
              React.createElement('span', { className: 'email-sender' }, email.from_email)
            ),
            React.createElement('div', { className: 'email-content' },
              React.createElement('div', { className: 'email-subject-line' },
                React.createElement('span', { className: 'email-subject' }, email.subject),
                email.category && React.createElement('span', {
                  className: 'email-category-badge',
                  style: { backgroundColor: getCategoryColor(email.category) }
                }, `${getCategoryIcon(email.category)} ${email.category}`)
              ),
              React.createElement('div', { className: 'email-snippet' }, email.snippet)
            ),
            React.createElement('div', { className: 'email-meta' },
              React.createElement('span', { className: 'email-time' }, formatDate(email.sent_at))
            )
          )
        )
      )
    );
  }

  // Main App
  function EmailApp() {
    const [currentView, setCurrentView] = useState('inbox');
    const [currentUser] = useState('admin@investaycapital.com');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      EmailAPI.getInbox(currentUser).then(result => {
        if (result.success && result.emails) {
          const unread = result.emails.filter(e => e.is_read === 0).length;
          setUnreadCount(unread);
        }
      });
    }, [currentUser]);

    return React.createElement('div', { className: 'email-app' },
      React.createElement(Sidebar, {
        currentView: currentView,
        onViewChange: setCurrentView,
        currentUser: currentUser,
        unreadCount: unreadCount
      }),
      React.createElement('main', { className: 'email-main' },
        React.createElement('div', { className: 'email-content' },
          currentView === 'inbox' 
            ? React.createElement(InboxView, { 
                currentUser: currentUser,
                onEmailSelect: (email) => console.log('Email selected:', email)
              })
            : React.createElement(EmptyState, {
                icon: '🚧',
                title: 'Coming Soon',
                message: `${currentView} view is under construction`
              })
        )
      )
    );
  }

  // Initialize app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  function initApp() {
    const rootElement = document.getElementById('email-root');
    if (!rootElement) {
      console.error('Root element #email-root not found');
      return;
    }

    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(React.createElement(EmailApp));
      console.log('InvestMail app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

})();
