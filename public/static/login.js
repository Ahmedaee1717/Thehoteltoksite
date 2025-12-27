/**
 * 🏨 INVESTAY - BLOCKCHAIN RWA HOSPITALITY LOGIN
 * Tokenizing Real Estate Assets
 * Theme: Blockchain + Hotels + Real Estate + Tokenization
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
    const nodeCount = 30;
    
    // Icons for hospitality/blockchain
    const icons = ['🏨', '🏢', '🏛️', '⛓️', '🔗', '💎', '🏦', '🏰'];
    
    class BlockchainNode {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 20 + 20;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.icon = icons[Math.floor(Math.random() * icons.length)];
        this.isHotel = ['🏨', '🏢', '🏛️', '🏰'].includes(this.icon);
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulsePhase += 0.02;
        
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      
      draw() {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        
        // Outer glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.isHotel ? 'rgba(251, 191, 36, 0.8)' : 'rgba(59, 130, 246, 0.8)';
        
        // Node circle
        ctx.fillStyle = this.isHotel 
          ? `rgba(251, 191, 36, ${0.3 * pulse})` 
          : `rgba(59, 130, 246, ${0.3 * pulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.shadowBlur = 0;
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
      }
    }
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new BlockchainNode());
    }
    
    function connectNodes() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            const opacity = 0.3 * (1 - distance / 200);
            
            // Blockchain connection (blue) or Hotel network (gold)
            const isHotelLink = nodes[i].isHotel && nodes[j].isHotel;
            ctx.strokeStyle = isHotelLink
              ? `rgba(251, 191, 36, ${opacity})`
              : `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.setLineDash(isHotelLink ? [] : [5, 5]);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
            ctx.setLineDash([]);
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
// MAIN LOGIN APP
// ============================================
function LoginApp() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
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
        setSuccess('🎉 Welcome to Investay! Redirecting to your inbox...');
        setTimeout(() => {
          window.location.href = '/mail';
        }, 1500);
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
        setSuccess('🎉 Account registered! You can now login.');
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
          setError(data.error || 'Registration failed');
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
      <!-- Blockchain Network Background -->
      <${BlockchainBackground} />
      
      <!-- Animated Gradient Orbs -->
      <div style=${{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
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
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '-250px',
        left: '-150px',
        filter: 'blur(80px)',
        animation: 'pulse 10s infinite ease-in-out reverse',
        zIndex: 1
      }}></div>
      
      <!-- Main Container -->
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
          maxWidth: '500px'
        }}>
          <!-- Logo & Title -->
          <div style=${{
            textAlign: 'center',
            marginBottom: '40px',
            animation: 'fadeInDown 0.8s ease-out'
          }}>
            <div style=${{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '24px 40px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
              borderRadius: '24px',
              border: '2px solid rgba(251, 191, 36, 0.3)',
              marginBottom: '28px',
              boxShadow: '0 0 60px rgba(251, 191, 36, 0.3), inset 0 0 30px rgba(59, 130, 246, 0.1)',
              animation: 'glow 3s infinite ease-in-out'
            }}>
              <div style=${{ fontSize: '56px' }}>🏨</div>
              <div style=${{ fontSize: '56px' }}>⛓️</div>
              <div style=${{ fontSize: '56px' }}>💎</div>
            </div>
            
            <h1 style=${{
              fontSize: '52px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #3b82f6 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 12px',
              animation: 'gradient 5s linear infinite'
            }}>
              INVESTAY
            </h1>
            
            <p style=${{
              fontSize: '16px',
              color: 'rgba(251, 191, 36, 0.9)',
              margin: '0 0 8px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontWeight: '700'
            }}>
              Tokenizing Hospitality Assets
            </p>
            
            <p style=${{
              fontSize: '14px',
              color: 'rgba(148, 163, 184, 0.8)',
              margin: 0,
              letterSpacing: '1px'
            }}>
              Blockchain RWA Platform
            </p>
          </div>
          
          <!-- Messages -->
          ${error && html`
            <div style=${{
              marginBottom: '24px',
              padding: '18px 24px',
              background: 'rgba(239, 68, 68, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideInLeft 0.4s ease-out',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
            }}>
              <span style=${{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
              <div style=${{ flex: 1 }}>${error}</div>
            </div>
          `}
          
          ${success && html`
            <div style=${{
              marginBottom: '24px',
              padding: '18px 24px',
              background: 'rgba(34, 197, 94, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideInLeft 0.4s ease-out',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)'
            }}>
              <span style=${{ fontSize: '24px' }}>🎉</span>
              <span>${success}</span>
            </div>
          `}
          
          <!-- Login Card -->
          <div style=${{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(40px)',
            borderRadius: '28px',
            padding: '48px',
            boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.2), 0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'fadeInUp 0.8s ease-out',
            position: 'relative'
          }}>
            <!-- Mode Tabs -->
            <div style=${{
              display: 'flex',
              gap: '12px',
              marginBottom: '36px',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '6px',
              borderRadius: '16px'
            }}>
              <button
                onClick=${() => setMode('login')}
                style=${{
                  flex: 1,
                  padding: '14px',
                  background: mode === 'login' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: mode === 'login' ? '0 8px 24px rgba(59, 130, 246, 0.4)' : 'none',
                  transform: mode === 'login' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                🔓 Login
              </button>
              <button
                onClick=${() => setMode('register')}
                style=${{
                  flex: 1,
                  padding: '14px',
                  background: mode === 'register' 
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: mode === 'register' ? '0 8px 24px rgba(251, 191, 36, 0.4)' : 'none',
                  transform: mode === 'register' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                ✨ Register
              </button>
            </div>
            
            <!-- Form -->
            <form onSubmit=${mode === 'login' ? handleLogin : handleRegister}>
              <!-- Email Field -->
              <div style=${{ marginBottom: '24px' }}>
                <label style=${{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'rgba(251, 191, 36, 0.9)',
                  marginBottom: '10px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  📧 Email Address
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
                    padding: '16px 20px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                    opacity: loading ? 0.6 : 1
                  }}
                  onFocus=${(e) => {
                    e.target.style.borderColor = 'rgba(251, 191, 36, 0.8)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(251, 191, 36, 0.1), inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                  }}
                  onBlur=${(e) => {
                    e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                    e.target.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                  }}
                />
              </div>
              
              <!-- Password Field -->
              <div style=${{ marginBottom: mode === 'register' ? '24px' : '32px' }}>
                <label style=${{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'rgba(251, 191, 36, 0.9)',
                  marginBottom: '10px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  🔒 Password
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
                      padding: '16px 56px 16px 20px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                      opacity: loading ? 0.6 : 1
                    }}
                    onFocus=${(e) => {
                      e.target.style.borderColor = 'rgba(251, 191, 36, 0.8)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(251, 191, 36, 0.1), inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                    onBlur=${(e) => {
                      e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                      e.target.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                  />
                  <button
                    type="button"
                    onClick=${() => setShowPassword(!showPassword)}
                    style=${{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '18px',
                      transition: 'all 0.2s'
                    }}
                  >
                    ${showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <!-- Confirm Password (Register Only) -->
              ${mode === 'register' && html`
                <div style=${{ marginBottom: '32px' }}>
                  <label style=${{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'rgba(251, 191, 36, 0.9)',
                    marginBottom: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    🔒 Confirm Password
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
                      padding: '16px 20px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                      opacity: loading ? 0.6 : 1
                    }}
                    onFocus=${(e) => {
                      e.target.style.borderColor = 'rgba(251, 191, 36, 0.8)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(251, 191, 36, 0.1), inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                    onBlur=${(e) => {
                      e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                      e.target.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                  />
                </div>
              `}
              
              <!-- Security Info (Register Only) -->
              ${mode === 'register' && html`
                <div style=${{
                  marginBottom: '32px',
                  padding: '16px 20px',
                  background: 'rgba(251, 191, 36, 0.05)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.7'
                }}>
                  <div style=${{ fontWeight: '700', marginBottom: '8px', color: 'rgba(251, 191, 36, 0.9)' }}>
                    🔒 Password Requirements:
                  </div>
                  <ul style=${{ margin: '0', paddingLeft: '20px' }}>
                    <li>At least 8 characters</li>
                    <li>One uppercase & lowercase letter</li>
                    <li>One number & special character</li>
                  </ul>
                </div>
              `}
              
              <!-- Submit Button -->
              <button
                type="submit"
                disabled=${loading}
                style=${{
                  width: '100%',
                  padding: '18px',
                  background: loading 
                    ? 'rgba(100, 116, 139, 0.5)'
                    : mode === 'login'
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#fff',
                  fontSize: '17px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: loading 
                    ? 'none' 
                    : mode === 'login'
                      ? '0 8px 32px rgba(59, 130, 246, 0.5)'
                      : '0 8px 32px rgba(251, 191, 36, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter=${(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave=${(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ${loading 
                  ? '⏳ Processing...' 
                  : mode === 'login' 
                    ? '🏨 Access Investay' 
                    : '💎 Tokenize Your Access'}
              </button>
            </form>
            
            <!-- Footer -->
            <div style=${{
              marginTop: '28px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'rgba(148, 163, 184, 0.7)',
              lineHeight: '1.6'
            }}>
              ${mode === 'login' ? html`
                <div>
                  Need an account? Contact admin at
                  <a href="/admin/email-accounts" style=${{
                    color: '#fbbf24',
                    fontWeight: '600',
                    textDecoration: 'none',
                    marginLeft: '4px'
                  }}>
                    Admin Panel →
                  </a>
                </div>
              ` : html`
                <div>
                  Your email must exist in our system.
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
            fontSize: '12px',
            color: 'rgba(148, 163, 184, 0.6)',
            animation: 'fadeIn 1s ease-out 0.5s both'
          }}>
            <div style=${{ marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'rgba(251, 191, 36, 0.8)' }}>
              🛡️ Blockchain-Secured Platform
            </div>
            <div style=${{ opacity: 0.7 }}>
              Enterprise Security • Tokenized Assets • Decentralized Trust
            </div>
          </div>
        </div>
      </div>
      
      <!-- Animations -->
      <style>${`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 60px rgba(251, 191, 36, 0.3), inset 0 0 30px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 80px rgba(251, 191, 36, 0.5), inset 0 0 40px rgba(59, 130, 246, 0.2);
          }
        }
        
        ::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        
        input:-webkit-autofill {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(15, 23, 42, 0.6) inset;
        }
      `}</style>
    </div>
  `;
}

// Initialize
const container = document.getElementById('root');
const root = createRoot(container);
root.render(html`<${LoginApp} />`);
