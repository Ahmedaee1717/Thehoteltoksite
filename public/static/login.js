/**
 * 🏢 INVESTAY - Professional Blockchain RWA Platform
 * Tokenizing Hospitality Assets
 * Features: Login, Register, First-Time Setup, Forgot Password
 */

const { useState, useEffect, useRef } = window.React;
const { createRoot } = window.ReactDOM;
const html = window.htm.bind(window.React.createElement);

// ============================================
// BLOCKCHAIN NETWORK ANIMATION
// ============================================
function BlockchainBackground() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const nodes = [];
    const nodeCount = 40;
    
    class Node {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 0.3 - 0.15;
        this.speedY = Math.random() * 0.3 - 0.15;
        this.opacity = Math.random() * 0.5 + 0.3;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      
      draw() {
        ctx.fillStyle = `rgba(251, 191, 36, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new Node());
    }
    
    function connectNodes() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(node => {
        node.update();
        node.draw();
      });
      connectNodes();
      requestAnimationFrame(animate);
    }
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return html`
    <canvas
      ref=${canvasRef}
      style=${{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  `;
}

// ============================================
// PROFESSIONAL LOGO
// ============================================
function InvestayLogo() {
  return html`
    <svg width="200" height="60" viewBox="0 0 200 60" style=${{ filter: 'drop-shadow(0 4px 20px rgba(251, 191, 36, 0.3))' }}>
      <!-- Building/Hotel Icon -->
      <rect x="10" y="15" width="30" height="35" fill="#3b82f6" rx="2"/>
      <rect x="15" y="20" width="5" height="5" fill="#1e40af"/>
      <rect x="25" y="20" width="5" height="5" fill="#1e40af"/>
      <rect x="15" y="28" width="5" height="5" fill="#1e40af"/>
      <rect x="25" y="28" width="5" height="5" fill="#1e40af"/>
      <rect x="15" y="36" width="5" height="5" fill="#1e40af"/>
      <rect x="25" y="36" width="5" height="5" fill="#1e40af"/>
      <rect x="18" y="43" width="9" height="7" fill="#1e40af"/>
      
      <!-- Chain Link -->
      <circle cx="52" cy="30" r="8" fill="none" stroke="#fbbf24" stroke-width="3"/>
      <circle cx="68" cy="30" r="8" fill="none" stroke="#fbbf24" stroke-width="3"/>
      
      <!-- INVESTAY Text -->
      <text x="85" y="38" font-family="Inter, sans-serif" font-size="24" font-weight="800" fill="url(#textGradient)">
        INVESTAY
      </text>
      
      <!-- Gradient Definition -->
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="50%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
    </svg>
  `;
}

// ============================================
// MAIN APP
// ============================================
function LoginApp() {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'reset', 'first-time'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  
  // Check URL for reset token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, []);
  
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
        setSuccess('✅ Welcome back! Redirecting...');
        setTimeout(() => window.location.href = '/mail', 1500);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/first-login-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Password set! You can now login.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        if (data.details) {
          setError(html`
            <div>
              <div style=${{ marginBottom: '8px', fontWeight: '600' }}>
                ${data.error}
              </div>
              <ul style=${{ paddingLeft: '20px', margin: 0 }}>
                ${data.details.map(detail => html`<li key=${detail}>${detail}</li>`)}
              </ul>
            </div>
          `);
        } else {
          setError(data.error || 'Setup failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // DEV: Show reset link
        if (data.resetLink) {
          setSuccess(html`
            <div>
              <div>✅ Password reset link generated!</div>
              <div style=${{ marginTop: '8px', fontSize: '13px' }}>
                <a href=${data.resetLink} style=${{ color: '#fbbf24', textDecoration: 'underline' }}>
                  Click here to reset password
                </a>
              </div>
            </div>
          `);
        } else {
          setSuccess('✅ If your email exists, you will receive a reset link.');
        }
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Password reset! You can now login.');
        setTimeout(() => {
          setMode('login');
          setResetToken(null);
          window.history.replaceState({}, '', '/login');
        }, 2000);
      } else {
        if (data.details) {
          setError(html`
            <div>
              <div>${data.error}</div>
              <ul style=${{ paddingLeft: '20px', margin: '8px 0 0' }}>
                ${data.details.map(d => html`<li key=${d}>${d}</li>`)}
              </ul>
            </div>
          `);
        } else {
          setError(data.error || 'Reset failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return html`
    <div style=${{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <${BlockchainBackground} />
      
      <div style=${{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '-300px',
        right: '-200px',
        filter: 'blur(80px)',
        animation: 'pulse 8s infinite ease-in-out',
        zIndex: 1
      }}></div>
      
      <div style=${{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '-250px',
        left: '-150px',
        filter: 'blur(80px)',
        animation: 'pulse 10s infinite ease-in-out reverse',
        zIndex: 1
      }}></div>
      
      <div style=${{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style=${{
          width: '100%',
          maxWidth: '480px'
        }}>
          <!-- Professional Logo -->
          <div style=${{
            textAlign: 'center',
            marginBottom: '40px',
            animation: 'fadeInDown 0.8s ease-out'
          }}>
            <div style=${{ marginBottom: '20px' }}>
              <${InvestayLogo} />
            </div>
            
            <p style=${{
              fontSize: '15px',
              color: 'rgba(251, 191, 36, 0.9)',
              margin: '0 0 6px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Tokenizing Hospitality Assets
            </p>
            
            <p style=${{
              fontSize: '13px',
              color: 'rgba(148, 163, 184, 0.7)',
              margin: 0,
              letterSpacing: '1px'
            }}>
              Blockchain RWA Platform
            </p>
          </div>
          
          <!-- Messages -->
          ${error && html`
            <div style=${{
              marginBottom: '20px',
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideInLeft 0.4s ease-out'
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
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideInLeft 0.4s ease-out'
            }}>
              <span style=${{ fontSize: '20px' }}>✅</span>
              <div style=${{ flex: 1 }}>${success}</div>
            </div>
          `}
          
          <!-- Card -->
          <div style=${{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(40px)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.2), 0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'fadeInUp 0.8s ease-out'
          }}>
            ${mode === 'login' && html`
              <h2 style=${{
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff',
                margin: '0 0 28px',
                textAlign: 'center'
              }}>
                Welcome Back
              </h2>
              
              <form onSubmit=${handleLogin}>
                <div style=${{ marginBottom: '20px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
                    marginBottom: '8px'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value=${email}
                    onChange=${(e) => setEmail(e.target.value)}
                    placeholder="your-email@investay.com"
                    required
                    disabled=${loading}
                    style=${{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style=${{ marginBottom: '24px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
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
                        padding: '14px 50px 14px 16px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '2px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
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
                        color: 'rgba(251, 191, 36, 0.7)',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      ${showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled=${loading}
                  style=${{
                    width: '100%',
                    padding: '16px',
                    background: loading 
                      ? 'rgba(100, 116, 139, 0.5)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    marginBottom: '16px'
                  }}
                >
                  ${loading ? '⏳ Logging in...' : '🔓 Login'}
                </button>
                
                <div style=${{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick=${() => setMode('forgot')}
                    style=${{
                      background: 'none',
                      border: 'none',
                      color: '#fbbf24',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginBottom: '12px'
                    }}
                  >
                    Forgot Password?
                  </button>
                  <div style=${{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.7)' }}>
                    First time? 
                    <button
                      type="button"
                      onClick=${() => setMode('register')}
                      style=${{
                        background: 'none',
                        border: 'none',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginLeft: '4px'
                      }}
                    >
                      Set your password
                    </button>
                  </div>
                </div>
              </form>
            `}
            
            ${mode === 'register' && html`
              <h2 style=${{
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff',
                margin: '0 0 8px',
                textAlign: 'center'
              }}>
                Set Your Password
              </h2>
              <p style=${{
                fontSize: '13px',
                color: 'rgba(148, 163, 184, 0.7)',
                margin: '0 0 24px',
                textAlign: 'center'
              }}>
                First-time setup for your account
              </p>
              
              <form onSubmit=${handleRegister}>
                <div style=${{ marginBottom: '20px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
                    marginBottom: '8px'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value=${email}
                    onChange=${(e) => setEmail(e.target.value)}
                    placeholder="your-email@investay.com"
                    required
                    disabled=${loading}
                    style=${{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style=${{ marginBottom: '20px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
                    marginBottom: '8px'
                  }}>
                    New Password
                  </label>
                  <input
                    type=${showPassword ? 'text' : 'password'}
                    value=${password}
                    onChange=${(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled=${loading}
                    style=${{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style=${{ marginBottom: '24px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
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
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled=${loading}
                  style=${{
                    width: '100%',
                    padding: '16px',
                    background: loading 
                      ? 'rgba(100, 116, 139, 0.5)'
                      : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  ${loading ? '⏳ Setting up...' : '✨ Set Password'}
                </button>
                
                <div style=${{ textAlign: 'center', fontSize: '13px', color: 'rgba(148, 163, 184, 0.7)' }}>
                  Already have a password? 
                  <button
                    type="button"
                    onClick=${() => setMode('login')}
                    style=${{
                      background: 'none',
                      border: 'none',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginLeft: '4px'
                    }}
                  >
                    Login
                  </button>
                </div>
              </form>
            `}
            
            ${mode === 'forgot' && html`
              <h2 style=${{
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff',
                margin: '0 0 8px',
                textAlign: 'center'
              }}>
                Forgot Password?
              </h2>
              <p style=${{
                fontSize: '13px',
                color: 'rgba(148, 163, 184, 0.7)',
                margin: '0 0 24px',
                textAlign: 'center'
              }}>
                Enter your email to receive a reset link
              </p>
              
              <form onSubmit=${handleForgotPassword}>
                <div style=${{ marginBottom: '24px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
                    marginBottom: '8px'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value=${email}
                    onChange=${(e) => setEmail(e.target.value)}
                    placeholder="your-email@investay.com"
                    required
                    disabled=${loading}
                    style=${{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled=${loading}
                  style=${{
                    width: '100%',
                    padding: '16px',
                    background: loading 
                      ? 'rgba(100, 116, 139, 0.5)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  ${loading ? '⏳ Sending...' : '📧 Send Reset Link'}
                </button>
                
                <div style=${{ textAlign: 'center', fontSize: '13px', color: 'rgba(148, 163, 184, 0.7)' }}>
                  Remember your password? 
                  <button
                    type="button"
                    onClick=${() => setMode('login')}
                    style=${{
                      background: 'none',
                      border: 'none',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginLeft: '4px'
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            `}
            
            ${mode === 'reset' && html`
              <h2 style=${{
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff',
                margin: '0 0 8px',
                textAlign: 'center'
              }}>
                Reset Password
              </h2>
              <p style=${{
                fontSize: '13px',
                color: 'rgba(148, 163, 184, 0.7)',
                margin: '0 0 24px',
                textAlign: 'center'
              }}>
                Enter your new password
              </p>
              
              <form onSubmit=${handleResetPassword}>
                <div style=${{ marginBottom: '20px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
                    marginBottom: '8px'
                  }}>
                    New Password
                  </label>
                  <input
                    type=${showPassword ? 'text' : 'password'}
                    value=${newPassword}
                    onChange=${(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled=${loading}
                    style=${{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style=${{ marginBottom: '24px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(251, 191, 36, 0.9)',
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
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled=${loading}
                  style=${{
                    width: '100%',
                    padding: '16px',
                    background: loading 
                      ? 'rgba(100, 116, 139, 0.5)'
                      : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  ${loading ? '⏳ Resetting...' : '🔐 Reset Password'}
                </button>
              </form>
            `}
          </div>
          
          <!-- Footer -->
          <div style=${{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(148, 163, 184, 0.6)'
          }}>
            <div style=${{ marginBottom: '6px', fontWeight: '600', color: 'rgba(251, 191, 36, 0.8)' }}>
              🛡️ Blockchain-Secured Platform
            </div>
            <div>Enterprise Security • Tokenized Assets • Decentralized Trust</div>
          </div>
        </div>
      </div>
      
      <style>${`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.1); opacity: 0.25; } }
        ::placeholder { color: rgba(255, 255, 255, 0.3); }
        input:-webkit-autofill { -webkit-text-fill-color: #fff; -webkit-box-shadow: 0 0 0 1000px rgba(15, 23, 42, 0.6) inset; }
      `}</style>
    </div>
  `;
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(html`<${LoginApp} />`);
