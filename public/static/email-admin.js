/**
 * 📧 INVESTMAIL - EMAIL ACCOUNT MANAGEMENT
 * Admin dashboard for creating and managing email accounts
 * Domain: www.investaycapital.com
 */

const { useState, useEffect, Fragment } = window.React;
const { createRoot } = window.ReactDOM;
const html = window.htm.bind(window.React.createElement);

// ============================================
// MAIN APP COMPONENT
// ============================================
function EmailAdminApp() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);
  
  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);
  
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/accounts/list');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts || []);
      } else {
        setError(data.error || 'Failed to load accounts');
      }
    } catch (err) {
      console.error('Load accounts error:', err);
      setError('Failed to load accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateAccount = async (email, displayName, password) => {
    try {
      const response = await fetch('/api/email/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          display_name: displayName,
          password: password || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Email account ${email} created successfully!`);
        setShowCreateModal(false);
        loadAccounts();
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Create account error:', err);
      setError('Failed to create account: ' + err.message);
    }
  };
  
  const handleDeleteAccount = async (id, email) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/email/accounts/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Email account ${email} deleted successfully!`);
        loadAccounts();
      } else {
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Failed to delete account: ' + err.message);
    }
  };
  
  const handleToggleStatus = async (id, email, currentStatus) => {
    try {
      const response = await fetch(`/api/email/accounts/${id}/toggle`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newStatus = !currentStatus;
        setSuccess(`✅ ${email} ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        loadAccounts();
      } else {
        setError(data.error || 'Failed to toggle account status');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setError('Failed to toggle status: ' + err.message);
    }
  };
  
  return html`
    <div style=${{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <!-- Header -->
      <div style=${{
        maxWidth: '1200px',
        margin: '0 auto 40px',
        textAlign: 'center'
      }}>
        <h1 style=${{
          fontSize: '48px',
          color: '#fff',
          margin: '0 0 10px',
          fontWeight: '700'
        }}>
          📧 InvestMail Admin
        </h1>
        <p style=${{
          fontSize: '18px',
          color: '#94a3b8',
          margin: '0'
        }}>
          Email Account Management • www.investaycapital.com
        </p>
      </div>
      
      <!-- Messages -->
      ${error && html`
        <div style=${{
          maxWidth: '1200px',
          margin: '0 auto 20px',
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          color: '#fca5a5',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style=${{ fontSize: '20px' }}>⚠️</span>
          <span>${error}</span>
        </div>
      `}
      
      ${success && html`
        <div style=${{
          maxWidth: '1200px',
          margin: '0 auto 20px',
          padding: '16px 20px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '12px',
          color: '#86efac',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style=${{ fontSize: '20px' }}>✅</span>
          <span>${success}</span>
        </div>
      `}
      
      <!-- Main Container -->
      <div style=${{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        <!-- Toolbar -->
        <div style=${{
          padding: '24px 32px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style=${{
              fontSize: '24px',
              color: '#fff',
              margin: '0 0 4px',
              fontWeight: '600'
            }}>
              Email Accounts
            </h2>
            <p style=${{
              fontSize: '14px',
              color: '#94a3b8',
              margin: '0'
            }}>
              ${loading ? 'Loading...' : `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          
          <button
            onClick=${() => setShowCreateModal(true)}
            style=${{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter=${(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave=${(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            ➕ Create New Account
          </button>
        </div>
        
        <!-- Accounts Table -->
        <div style=${{ padding: '32px' }}>
          ${loading ? html`
            <div style=${{
              textAlign: 'center',
              padding: '60px 0',
              color: '#94a3b8',
              fontSize: '16px'
            }}>
              <div style=${{
                fontSize: '48px',
                marginBottom: '16px'
              }}>⏳</div>
              Loading accounts...
            </div>
          ` : accounts.length === 0 ? html`
            <div style=${{
              textAlign: 'center',
              padding: '60px 0',
              color: '#94a3b8',
              fontSize: '16px'
            }}>
              <div style=${{
                fontSize: '48px',
                marginBottom: '16px'
              }}>📭</div>
              No email accounts yet. Create your first one!
            </div>
          ` : html`
            <div style=${{
              display: 'grid',
              gap: '16px'
            }}>
              ${accounts.map(account => html`
                <${AccountCard}
                  key=${account.id}
                  account=${account}
                  onDelete=${handleDeleteAccount}
                  onToggle=${handleToggleStatus}
                />
              `)}
            </div>
          `}
        </div>
      </div>
      
      <!-- Create Account Modal -->
      ${showCreateModal && html`
        <${CreateAccountModal}
          onClose=${() => setShowCreateModal(false)}
          onCreate=${handleCreateAccount}
        />
      `}
    </div>
  `;
}

// ============================================
// ACCOUNT CARD COMPONENT
// ============================================
function AccountCard({ account, onDelete, onToggle }) {
  const isActive = account.is_active === 1;
  const createdDate = new Date(account.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return html`
    <div style=${{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s'
    }}>
      <div style=${{ flex: 1 }}>
        <div style=${{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <h3 style=${{
            fontSize: '18px',
            color: '#fff',
            margin: '0',
            fontWeight: '600'
          }}>
            ${account.email}
          </h3>
          <span style=${{
            padding: '4px 12px',
            background: isActive 
              ? 'rgba(34, 197, 94, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)',
            color: isActive ? '#86efac' : '#fca5a5',
            border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            ${isActive ? '✓ Active' : '✗ Inactive'}
          </span>
        </div>
        <p style=${{
          fontSize: '14px',
          color: '#94a3b8',
          margin: '0 0 4px'
        }}>
          ${account.display_name}
        </p>
        <p style=${{
          fontSize: '13px',
          color: '#64748b',
          margin: '0'
        }}>
          Created ${createdDate}
        </p>
      </div>
      
      <div style=${{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick=${() => onToggle(account.id, account.email, isActive)}
          style=${{
            padding: '8px 16px',
            background: isActive 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(34, 197, 94, 0.1)',
            color: isActive ? '#fca5a5' : '#86efac',
            border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ${isActive ? 'Deactivate' : 'Activate'}
        </button>
        
        <button
          onClick=${() => onDelete(account.id, account.email)}
          style=${{
            padding: '8px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  `;
}

// ============================================
// CREATE ACCOUNT MODAL
// ============================================
function CreateAccountModal({ onClose, onCreate }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!email || !displayName) {
      alert('Please fill in email and display name');
      return;
    }
    
    // Validate email format
    if (!email.endsWith('@www.investaycapital.com')) {
      alert('Email must end with @www.investaycapital.com');
      return;
    }
    
    setLoading(true);
    await onCreate(email, displayName, password);
    setLoading(false);
  };
  
  return html`
    <div style=${{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}
    onClick=${onClose}
    >
      <div 
        style=${{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick=${(e) => e.stopPropagation()}
      >
        <!-- Header -->
        <div style=${{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style=${{
            fontSize: '24px',
            color: '#fff',
            margin: '0',
            fontWeight: '600'
          }}>
            ➕ Create Email Account
          </h2>
          <button
            onClick=${onClose}
            style=${{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: '1'
            }}
          >
            ✕
          </button>
        </div>
        
        <!-- Form -->
        <div style=${{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <!-- Email Field -->
          <div>
            <label style=${{
              display: 'block',
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              value=${email}
              onChange=${(e) => setEmail(e.target.value)}
              placeholder="example@www.investaycapital.com"
              style=${{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus=${(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur=${(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>
          
          <!-- Display Name Field -->
          <div>
            <label style=${{
              display: 'block',
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              Display Name *
            </label>
            <input
              type="text"
              value=${displayName}
              onChange=${(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              style=${{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus=${(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur=${(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>
          
          <!-- Password Field (Optional) -->
          <div>
            <label style=${{
              display: 'block',
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              Password (Optional)
            </label>
            <input
              type="password"
              value=${password}
              onChange=${(e) => setPassword(e.target.value)}
              placeholder="Leave empty for no password"
              style=${{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus=${(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur=${(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
            <p style=${{
              fontSize: '12px',
              color: '#64748b',
              margin: '6px 0 0',
              fontStyle: 'italic'
            }}>
              Password is only needed for SMTP authentication
            </p>
          </div>
          
          <!-- Buttons -->
          <div style=${{
            display: 'flex',
            gap: '12px',
            marginTop: '8px'
          }}>
            <button
              onClick=${onClose}
              disabled=${loading}
              style=${{
                flex: 1,
                padding: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#94a3b8',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick=${handleSubmit}
              disabled=${loading}
              style=${{
                flex: 1,
                padding: '14px',
                background: loading 
                  ? 'rgba(100, 116, 139, 0.3)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              ${loading ? '⏳ Creating...' : '✓ Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// INITIALIZE APP
// ============================================
const container = document.getElementById('root');
const root = createRoot(container);
root.render(html`<${EmailAdminApp} />`);
