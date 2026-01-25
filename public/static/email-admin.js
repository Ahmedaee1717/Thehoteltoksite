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
  const [sharedMailboxes, setSharedMailboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateMailboxModal, setShowCreateMailboxModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' or 'mailboxes'
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [mailboxMembers, setMailboxMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
    loadSharedMailboxes();
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
  
  const handleResetPassword = async (id, email) => {
    const newPassword = prompt(`Enter new password for ${email}:\n\n(Minimum 8 characters)`);
    
    if (!newPassword) {
      return; // User cancelled
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      const response = await fetch(`/api/email/accounts/${id}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Password for ${email} updated successfully!`);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Failed to reset password: ' + err.message);
    }
  };
  
  // ============================================
  // SHARED MAILBOX FUNCTIONS
  // ============================================
  
  const loadSharedMailboxes = async () => {
    try {
      const response = await fetch('/api/email/shared-mailboxes/list');
      const data = await response.json();
      
      if (data.success) {
        setSharedMailboxes(data.mailboxes || []);
      } else {
        setError(data.error || 'Failed to load shared mailboxes');
      }
    } catch (err) {
      console.error('Load shared mailboxes error:', err);
      setError('Failed to load shared mailboxes: ' + err.message);
    }
  };
  
  const handleCreateMailbox = async (email, displayName, description, type) => {
    try {
      const response = await fetch('/api/email/shared-mailboxes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_address: email,
          display_name: displayName,
          description,
          mailbox_type: type
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Shared mailbox ${email} created successfully!`);
        setShowCreateMailboxModal(false);
        loadSharedMailboxes();
      } else {
        setError(data.error || 'Failed to create shared mailbox');
      }
    } catch (err) {
      console.error('Create mailbox error:', err);
      setError('Failed to create shared mailbox: ' + err.message);
    }
  };
  
  const handleDeleteMailbox = async (id, email) => {
    if (!confirm(`Are you sure you want to delete shared mailbox ${email}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/email/shared-mailboxes/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Shared mailbox ${email} deleted successfully!`);
        loadSharedMailboxes();
        if (selectedMailbox?.id === id) {
          setSelectedMailbox(null);
          setMailboxMembers([]);
        }
      } else {
        setError(data.error || 'Failed to delete shared mailbox');
      }
    } catch (err) {
      console.error('Delete mailbox error:', err);
      setError('Failed to delete shared mailbox: ' + err.message);
    }
  };
  
  const handleToggleMailbox = async (id, email, currentStatus) => {
    try {
      const response = await fetch(`/api/email/shared-mailboxes/${id}/toggle`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newStatus = !currentStatus;
        setSuccess(`✅ ${email} ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        loadSharedMailboxes();
      } else {
        setError(data.error || 'Failed to toggle mailbox status');
      }
    } catch (err) {
      console.error('Toggle mailbox error:', err);
      setError('Failed to toggle mailbox status: ' + err.message);
    }
  };
  
  const loadMailboxMembers = async (mailboxId) => {
    try {
      const response = await fetch(`/api/email/shared-mailboxes/${mailboxId}/members`);
      const data = await response.json();
      
      if (data.success) {
        setMailboxMembers(data.members || []);
      } else {
        setError(data.error || 'Failed to load members');
      }
    } catch (err) {
      console.error('Load members error:', err);
      setError('Failed to load members: ' + err.message);
    }
  };
  
  const handleAddMember = async (mailboxId, userEmail, role, permissions) => {
    try {
      const response = await fetch(`/api/email/shared-mailboxes/${mailboxId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          role: role,
          permissions: permissions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Member ${userEmail} added successfully!`);
        loadMailboxMembers(mailboxId);
      } else {
        setError(data.error || 'Failed to add member');
      }
    } catch (err) {
      console.error('Add member error:', err);
      setError('Failed to add member: ' + err.message);
    }
  };
  
  const handleRemoveMember = async (mailboxId, memberId, userEmail) => {
    if (!confirm(`Remove ${userEmail} from this mailbox?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/email/shared-mailboxes/${mailboxId}/members/${memberId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Member ${userEmail} removed successfully!`);
        loadMailboxMembers(mailboxId);
      } else {
        setError(data.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error('Remove member error:', err);
      setError('Failed to remove member: ' + err.message);
    }
  };
  
  const handleUpdateMemberRole = async (mailboxId, memberId, newRole, permissions) => {
    try {
      const response = await fetch(`/api/email/shared-mailboxes/${mailboxId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          permissions: permissions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Member role updated successfully!`);
        loadMailboxMembers(mailboxId);
      } else {
        setError(data.error || 'Failed to update member role');
      }
    } catch (err) {
      console.error('Update role error:', err);
      setError('Failed to update member role: ' + err.message);
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
        <!-- Tab Navigation -->
        <div style=${{
          padding: '0 32px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick=${() => setActiveTab('accounts')}
            style=${{
              padding: '16px 24px',
              background: activeTab === 'accounts' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'accounts' ? '#3b82f6' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'accounts' ? '2px solid #3b82f6' : '2px solid transparent',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
          >
            📧 Email Accounts (${accounts.length})
          </button>
          <button
            onClick=${() => setActiveTab('mailboxes')}
            style=${{
              padding: '16px 24px',
              background: activeTab === 'mailboxes' ? 'rgba(201, 169, 98, 0.15)' : 'transparent',
              color: activeTab === 'mailboxes' ? '#C9A962' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'mailboxes' ? '2px solid #C9A962' : '2px solid transparent',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
          >
            📬 Shared Mailboxes (${sharedMailboxes.length})
          </button>
        </div>
        
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
              ${activeTab === 'accounts' ? 'Email Accounts' : 'Shared Mailboxes'}
            </h2>
            <p style=${{
              fontSize: '14px',
              color: '#94a3b8',
              margin: '0'
            }}>
              ${loading ? 'Loading...' : activeTab === 'accounts' 
                ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`
                : `${sharedMailboxes.length} shared mailbox${sharedMailboxes.length !== 1 ? 'es' : ''}`
              }
            </p>
          </div>
          
          <button
            onClick=${() => activeTab === 'accounts' ? setShowCreateModal(true) : setShowCreateMailboxModal(true)}
            style=${{
              padding: '12px 24px',
              background: activeTab === 'accounts' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: activeTab === 'accounts' 
                ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                : '0 4px 12px rgba(201, 169, 98, 0.3)'
            }}
            onMouseEnter=${(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = activeTab === 'accounts'
                ? '0 6px 20px rgba(59, 130, 246, 0.4)'
                : '0 6px 20px rgba(201, 169, 98, 0.4)';
            }}
            onMouseLeave=${(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = activeTab === 'accounts'
                ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                : '0 4px 12px rgba(201, 169, 98, 0.3)';
            }}
          >
            ${activeTab === 'accounts' ? '➕ Create New Account' : '📬 Create Shared Mailbox'}
          </button>
        </div>
        
        <!-- Content Area -->
        <div style=${{ padding: '32px' }}>
          ${activeTab === 'accounts' ? html`
            <!-- Email Accounts Content -->
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
                    onResetPassword=${handleResetPassword}
                  />
                `)}
              </div>
            `}
          ` : html`
            <!-- Shared Mailboxes Content -->
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
                Loading shared mailboxes...
              </div>
            ` : sharedMailboxes.length === 0 ? html`
              <div style=${{
                textAlign: 'center',
                padding: '60px 0',
                color: '#94a3b8',
                fontSize: '16px'
              }}>
                <div style=${{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>📬</div>
                No shared mailboxes yet. Create your first one!
              </div>
            ` : html`
              <div style=${{
                display: 'grid',
                gap: '16px'
              }}>
                ${sharedMailboxes.map(mailbox => html`
                  <${SharedMailboxCard}
                    key=${mailbox.id}
                    mailbox=${mailbox}
                    onDelete=${handleDeleteMailbox}
                    onToggle=${handleToggleMailbox}
                    onViewMembers=${(mb) => {
                      setSelectedMailbox(mb);
                      loadMailboxMembers(mb.id);
                    }}
                  />
                `)}
              </div>
            `}
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
      
      <!-- Create Shared Mailbox Modal -->
      ${showCreateMailboxModal && html`
        <${CreateMailboxModal}
          onClose=${() => setShowCreateMailboxModal(false)}
          onCreate=${handleCreateMailbox}
        />
      `}
      
      <!-- Members Management Modal -->
      ${selectedMailbox && html`
        <${MembersModal}
          mailbox=${selectedMailbox}
          members=${mailboxMembers}
          onClose=${() => {
            setSelectedMailbox(null);
            setMailboxMembers([]);
          }}
          onAddMember=${handleAddMember}
          onRemoveMember=${handleRemoveMember}
          onUpdateRole=${handleUpdateMemberRole}
        />
      `}
    </div>
  `;
}

// ============================================
// ACCOUNT CARD COMPONENT
// ============================================
function AccountCard({ account, onDelete, onToggle, onResetPassword }) {
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
          onClick=${() => onResetPassword(account.id, account.email)}
          style=${{
            padding: '8px 16px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🔑 Reset Password
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
    if (!email.endsWith('@investaycapital.com')) {
      alert('Email must end with @investaycapital.com');
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
              placeholder="example@investaycapital.com"
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
// SHARED MAILBOX CARD COMPONENT
// ============================================
function SharedMailboxCard({ mailbox, onDelete, onToggle, onViewMembers }) {
  const isActive = mailbox.is_active === 1;
  const createdDate = new Date(mailbox.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const typeIcons = {
    'general': '📬',
    'support': '🎧',
    'team': '👥',
    'department': '🏢',
    'project': '📁'
  };
  
  const icon = typeIcons[mailbox.mailbox_type] || '📬';
  
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
          <span style=${{ fontSize: '24px' }}>${icon}</span>
          <h3 style=${{
            fontSize: '18px',
            color: '#fff',
            margin: '0',
            fontWeight: '600'
          }}>
            ${mailbox.display_name}
          </h3>
          <span style=${{
            padding: '4px 12px',
            background: isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: isActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: isActive ? '#86efac' : '#fca5a5',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            ${isActive ? '✓ Active' : '✕ Inactive'}
          </span>
          <span style=${{
            padding: '4px 12px',
            background: 'rgba(201, 169, 98, 0.15)',
            border: '1px solid rgba(201, 169, 98, 0.3)',
            borderRadius: '6px',
            color: '#C9A962',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            ${mailbox.mailbox_type}
          </span>
        </div>
        <p style=${{
          fontSize: '14px',
          color: '#C9A962',
          margin: '0 0 4px',
          fontWeight: '500'
        }}>
          ${mailbox.email_address}
        </p>
        ${mailbox.description && html`
          <p style=${{
            fontSize: '13px',
            color: '#94a3b8',
            margin: '8px 0 0',
            lineHeight: '1.5'
          }}>
            ${mailbox.description}
          </p>
        `}
        <div style=${{
          fontSize: '12px',
          color: '#64748b',
          marginTop: '8px',
          display: 'flex',
          gap: '16px'
        }}>
          <span>👥 ${mailbox.member_count || 0} members</span>
          <span>📅 Created ${createdDate}</span>
        </div>
      </div>
      
      <div style=${{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <button
          onClick=${() => onViewMembers(mailbox)}
          style=${{
            padding: '10px 16px',
            background: 'rgba(201, 169, 98, 0.15)',
            border: '1px solid rgba(201, 169, 98, 0.3)',
            borderRadius: '10px',
            color: '#C9A962',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter=${(e) => {
            e.target.style.background = 'rgba(201, 169, 98, 0.25)';
          }}
          onMouseLeave=${(e) => {
            e.target.style.background = 'rgba(201, 169, 98, 0.15)';
          }}
        >
          👥 Manage Members
        </button>
        
        <button
          onClick=${() => onToggle(mailbox.id, mailbox.email_address, isActive)}
          style=${{
            padding: '10px 16px',
            background: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: isActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            color: isActive ? '#fca5a5' : '#86efac',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ${isActive ? '⏸ Deactivate' : '▶️ Activate'}
        </button>
        
        <button
          onClick=${() => onDelete(mailbox.id, mailbox.email_address)}
          style=${{
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter=${(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave=${(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  `;
}

// ============================================
// CREATE MAILBOX MODAL
// ============================================
function CreateMailboxModal({ onClose, onCreate }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('general');
  
  const handleSubmit = async () => {
    if (!email || !displayName) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    await onCreate(email, displayName, description, type);
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
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style=${{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(201, 169, 98, 0.3)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <!-- Header -->
        <div style=${{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style=${{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style=${{
              fontSize: '22px',
              color: '#fff',
              margin: '0',
              fontWeight: '600'
            }}>
              📬 Create Shared Mailbox
            </h2>
            <button
              onClick=${onClose}
              style=${{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >×</button>
          </div>
        </div>
        
        <!-- Form -->
        <div style=${{
          padding: '32px'
        }}>
          <div style=${{ marginBottom: '20px' }}>
            <label style=${{
              display: 'block',
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: '600'
            }}>Email Address *</label>
            <input
              type="email"
              value=${email}
              onChange=${(e) => setEmail(e.target.value)}
              placeholder="support@investaycapital.com"
              disabled=${loading}
              style=${{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>
          
          <div style=${{ marginBottom: '20px' }}>
            <label style=${{
              display: 'block',
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: '600'
            }}>Display Name *</label>
            <input
              type="text"
              value=${displayName}
              onChange=${(e) => setDisplayName(e.target.value)}
              placeholder="Customer Support"
              disabled=${loading}
              style=${{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>
          
          <div style=${{ marginBottom: '20px' }}>
            <label style=${{
              display: 'block',
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: '600'
            }}>Mailbox Type *</label>
            <select
              value=${type}
              onChange=${(e) => setType(e.target.value)}
              disabled=${loading}
              style=${{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="general">📬 General</option>
              <option value="support">🎧 Support</option>
              <option value="team">👥 Team</option>
              <option value="department">🏢 Department</option>
              <option value="project">📁 Project</option>
            </select>
          </div>
          
          <div style=${{ marginBottom: '24px' }}>
            <label style=${{
              display: 'block',
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: '600'
            }}>Description</label>
            <textarea
              value=${description}
              onChange=${(e) => setDescription(e.target.value)}
              placeholder="Brief description of this mailbox..."
              disabled=${loading}
              rows="3"
              style=${{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          
          <!-- Actions -->
          <div style=${{
            display: 'flex',
            gap: '12px'
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
                  : 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(201, 169, 98, 0.3)'
              }}
            >
              ${loading ? '⏳ Creating...' : '✓ Create Mailbox'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// MEMBERS MODAL
// ============================================
function MembersModal({ mailbox, members, onClose, onAddMember, onRemoveMember, onUpdateRole }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('member');
  const [permissions, setPermissions] = useState('read,send');
  const [loading, setLoading] = useState(false);
  
  const handleAdd = async () => {
    if (!userEmail) {
      alert('Please enter user email');
      return;
    }
    
    setLoading(true);
    await onAddMember(mailbox.id, userEmail, role, permissions);
    setUserEmail('');
    setRole('member');
    setPermissions('read,send');
    setShowAddForm(false);
    setLoading(false);
  };
  
  const roleColors = {
    'owner': '#C9A962',
    'admin': '#3b82f6',
    'member': '#94a3b8',
    'viewer': '#64748b'
  };
  
  return html`
    <div style=${{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style=${{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(201, 169, 98, 0.3)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <!-- Header -->
        <div style=${{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style=${{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h2 style=${{
              fontSize: '22px',
              color: '#fff',
              margin: '0',
              fontWeight: '600'
            }}>
              👥 Manage Members
            </h2>
            <button
              onClick=${onClose}
              style=${{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >×</button>
          </div>
          <p style=${{
            fontSize: '14px',
            color: '#C9A962',
            margin: '0'
          }}>${mailbox.display_name} (${mailbox.email_address})</p>
        </div>
        
        <!-- Add Member Button -->
        <div style=${{
          padding: '20px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          ${!showAddForm ? html`
            <button
              onClick=${() => setShowAddForm(true)}
              style=${{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(201, 169, 98, 0.3)'
              }}
            >
              ➕ Add Member
            </button>
          ` : html`
            <div style=${{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style=${{ marginBottom: '12px' }}>
                <input
                  type="email"
                  value=${userEmail}
                  onChange=${(e) => setUserEmail(e.target.value)}
                  placeholder="user@investaycapital.com"
                  disabled=${loading}
                  style=${{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style=${{ 
                display: 'flex',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <select
                  value=${role}
                  onChange=${(e) => setRole(e.target.value)}
                  disabled=${loading}
                  style=${{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <select
                  value=${permissions}
                  onChange=${(e) => setPermissions(e.target.value)}
                  disabled=${loading}
                  style=${{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="read">Read Only</option>
                  <option value="read,send">Read & Send</option>
                  <option value="read,send,delete">Full Access</option>
                </select>
              </div>
              <div style=${{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick=${() => {
                    setShowAddForm(false);
                    setUserEmail('');
                  }}
                  disabled=${loading}
                  style=${{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick=${handleAdd}
                  disabled=${loading}
                  style=${{
                    flex: 1,
                    padding: '10px',
                    background: loading 
                      ? 'rgba(100, 116, 139, 0.3)'
                      : 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  ${loading ? '⏳ Adding...' : '✓ Add'}
                </button>
              </div>
            </div>
          `}
        </div>
        
        <!-- Members List -->
        <div style=${{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 32px'
        }}>
          ${members.length === 0 ? html`
            <div style=${{
              textAlign: 'center',
              padding: '40px 0',
              color: '#94a3b8'
            }}>
              <div style=${{ fontSize: '48px', marginBottom: '8px' }}>👥</div>
              <p>No members yet. Add your first member!</p>
            </div>
          ` : html`
            <div style=${{
              display: 'grid',
              gap: '12px'
            }}>
              ${members.map(member => html`
                <div key=${member.id} style=${{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style=${{ flex: 1 }}>
                    <div style=${{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '4px'
                    }}>
                      <div style=${{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${roleColors[member.role]} 0%, ${roleColors[member.role]}80 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        ${member.role === 'owner' ? '👑' : member.role === 'admin' ? '⚡' : member.role === 'member' ? '👤' : '👁️'}
                      </div>
                      <div>
                        <p style=${{
                          fontSize: '15px',
                          color: '#fff',
                          margin: '0',
                          fontWeight: '600'
                        }}>
                          ${member.user_email}
                        </p>
                        <p style=${{
                          fontSize: '12px',
                          color: '#94a3b8',
                          margin: '0',
                          textTransform: 'capitalize'
                        }}>
                          ${member.role} • ${member.permissions}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  ${member.role !== 'owner' && html`
                    <div style=${{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <select
                        value=${member.role}
                        onChange=${(e) => onUpdateRole(mailbox.id, member.id, e.target.value, member.permissions)}
                        style=${{
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick=${() => onRemoveMember(mailbox.id, member.id, member.user_email)}
                        style=${{
                          padding: '6px 12px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#fca5a5',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  `}
                </div>
              `)}
            </div>
          `}
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
