/**
 * 🔐 INVESTMAIL - ULTRA-SECURE LOGIN PAGE
 * Professional authentication with best security practices
 * Features: JWT, Bcrypt, Rate Limiting, Session Management
 */

const { useState, useEffect } = window.React;
const { createRoot } = window.ReactDOM;
const html = window.htm.bind(window.React.createElement);

// ============================================
// MAIN LOGIN APP
// ============================================
function LoginApp() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
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
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/mail';
        }, 1500);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Account registered! You can now login.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        if (data.details) {
          setError(
            html`
              <div>
                <div style=${{ marginBottom: '8px', fontWeight: '600' }}>
                  ${data.error}
                </div>
                <ul style=${{ paddingLeft: '20px', margin: 0 }}>
                  ${data.details.map(detail => html`
                    <li key=${detail}>${detail}</li>
                  `)}
                </ul>
              </div>
            `
          );
        } else {
          setError(data.error || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return html`
    <div style=${{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <!-- Animated Background -->
      <div style=${{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0
      }}>
        <div style=${{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          top: '-250px',
          right: '-250px',
          animation: 'float 20s infinite ease-in-out'
        }}></div>
        <div style=${{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          bottom: '-200px',
          left: '-200px',
          animation: 'float 15s infinite ease-in-out reverse'
        }}></div>
      </div>
      
      <!-- Login Card -->
      <div style=${{
        width: '100%',
        maxWidth: '450px',
        position: 'relative',
        zIndex: 1
      }}>
        <!-- Logo & Title -->
        <div style=${{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style=${{
            fontSize: '48px',
            marginBottom: '16px'
          }}>📧</div>
          <h1 style=${{
            fontSize: '32px',
            fontWeight: '700',
            color: '#fff',
            margin: '0 0 8px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            InvestMail
          </h1>
          <p style=${{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0
          }}>
            Ultra-secure email platform
          </p>
        </div>
        
        <!-- Messages -->
        ${error && html`
          <div style=${{
            marginBottom: '20px',
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            color: '#fff',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <span style=${{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div style=${{ flex: 1 }}>${error}</div>
          </div>
        `}
        
        ${success && html`
          <div style=${{
            marginBottom: '20px',
            padding: '16px 20px',
            background: 'rgba(34, 197, 94, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '16px',
            color: '#fff',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <span style=${{ fontSize: '20px' }}>✅</span>
            <span>${success}</span>
          </div>
        `}
        
        <!-- Card Container -->
        <div style=${{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <!-- Mode Tabs -->
          <div style=${{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '4px',
            borderRadius: '12px'
          }}>
            <button
              onClick=${() => setMode('login')}
              style=${{
                flex: 1,
                padding: '12px',
                background: mode === 'login' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: mode === 'login' ? 'blur(10px)' : 'none'
              }}
            >
              Login
            </button>
            <button
              onClick=${() => setMode('register')}
              style=${{
                flex: 1,
                padding: '12px',
                background: mode === 'register' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: mode === 'register' ? 'blur(10px)' : 'none'
              }}
            >
              Register
            </button>
          </div>
          
          <!-- Form -->
          <form onSubmit=${mode === 'login' ? handleLogin : handleRegister}>
            <!-- Email Field -->
            <div style=${{ marginBottom: '20px' }}>
              <label style=${{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value=${email}
                onChange=${(e) => setEmail(e.target.value)}
                placeholder="your-email@www.investaycapital.com"
                required
                disabled=${loading}
                style=${{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'text'
                }}
                onFocus=${(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur=${(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>
            
            <!-- Password Field -->
            <div style=${{ marginBottom: mode === 'register' ? '20px' : '24px' }}>
              <label style=${{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <div style=${{ position: 'relative' }}>
                <input
                  type=${showPassword ? 'text' : 'password'}
                  value=${password}
                  onChange=${(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled=${loading}
                  style=${{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                  onFocus=${(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur=${(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
                <button
                  type="button"
                  onClick=${() => setShowPassword(!showPassword)}
                  style=${{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    padding: '8px',
                    fontSize: '18px',
                    lineHeight: '1'
                  }}
                >
                  ${showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            
            <!-- Confirm Password Field (Register Only) -->
            ${mode === 'register' && html`
              <div style=${{ marginBottom: '24px' }}>
                <label style=${{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '8px'
                }}>
                  Confirm Password
                </label>
                <input
                  type=${showPassword ? 'text' : 'password'}
                  value=${confirmPassword}
                  onChange=${(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled=${loading}
                  style=${{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                  onFocus=${(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur=${(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>
            `}
            
            <!-- Security Info (Register Only) -->
            ${mode === 'register' && html`
              <div style=${{
                marginBottom: '24px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.6'
              }}>
                <div style=${{ fontWeight: '600', marginBottom: '4px' }}>🔒 Password Requirements:</div>
                <ul style=${{ margin: '4px 0 0', paddingLeft: '20px' }}>
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>
            `}
            
            <!-- Submit Button -->
            <button
              type="submit"
              disabled=${loading}
              style=${{
                width: '100%',
                padding: '16px',
                background: loading 
                  ? 'rgba(100, 116, 139, 0.5)'
                  : 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.9) 100%)',
                border: 'none',
                borderRadius: '12px',
                color: loading ? '#fff' : '#667eea',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(255, 255, 255, 0.3)',
                opacity: loading ? 0.8 : 1
              }}
              onMouseEnter=${(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.4)';
                }
              }}
              onMouseLeave=${(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.3)';
              }}
            >
              ${loading ? (mode === 'login' ? '⏳ Logging in...' : '⏳ Registering...') : 
                (mode === 'login' ? '🔓 Login' : '✨ Create Account')}
            </button>
          </form>
          
          <!-- Footer Links -->
          <div style=${{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            ${mode === 'login' ? html`
              <div>
                Don't have an account? Admin must create one at 
                <a href="/admin/email-accounts" style=${{
                  color: '#fff',
                  fontWeight: '600',
                  textDecoration: 'underline'
                }}>
                  /admin/email-accounts
                </a>
              </div>
            ` : html`
              <div>
                Note: Your email must already exist in the system.
                <br />
                Contact admin to create your account first.
              </div>
            `}
          </div>
        </div>
        
        <!-- Security Badge -->
        <div style=${{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <div style=${{ marginBottom: '8px' }}>
            🔒 Secured with enterprise-grade encryption
          </div>
          <div style=${{ fontSize: '11px', opacity: 0.8 }}>
            JWT • Bcrypt • Rate Limiting • Session Management
          </div>
        </div>
      </div>
      
      <!-- Animations -->
      <style>${`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, 30px);
          }
        }
        
        ::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.1) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  `;
}

// ============================================
// INITIALIZE APP
// ============================================
const container = document.getElementById('root');
const root = createRoot(container);
root.render(html`<${LoginApp} />`);
