/**
 * 🔐 INVESTMAIL - ULTRA PREMIUM LOGIN PAGE
 * Jaw-dropping, stunning design with advanced animations
 * Features: 3D effects, particles, neon glow, premium aesthetic
 */

const { useState, useEffect, useRef } = window.React;
const { createRoot } = window.ReactDOM;
const html = window.htm.bind(window.React.createElement);

// ============================================
// PARTICLE ANIMATION CANVAS
// ============================================
function ParticleBackground() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 100;
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
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
        ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      connectParticles();
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
        setSuccess('✨ Login successful! Redirecting to your inbox...');
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
        setSuccess('✨ Account registered! You can now login.');
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
  
  const parallaxX = (mousePos.x - window.innerWidth / 2) / 50;
  const parallaxY = (mousePos.y - window.innerHeight / 2) / 50;
  
  return html`
    <div style=${{
      minHeight: '100vh',
      background: '#0a0118',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <!-- Particle Background -->
      <${ParticleBackground} />
      
      <!-- Gradient Orbs -->
      <div style=${{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
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
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
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
          maxWidth: '480px',
          transform: `perspective(1000px) rotateX(${parallaxY * 0.5}deg) rotateY(${parallaxX * 0.5}deg)`,
          transition: 'transform 0.1s ease-out'
        }}>
          <!-- Logo & Title -->
          <div style=${{
            textAlign: 'center',
            marginBottom: '40px',
            animation: 'fadeInDown 0.8s ease-out'
          }}>
            <div style=${{
              display: 'inline-block',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '24px',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.1)',
              animation: 'glow 3s infinite ease-in-out'
            }}>
              <div style=${{
                fontSize: '64px',
                filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))'
              }}>📧</div>
            </div>
            
            <h1 style=${{
              fontSize: '48px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #8b5cf6 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 12px',
              textShadow: '0 0 40px rgba(139, 92, 246, 0.5)',
              animation: 'gradient 5s linear infinite, textGlow 2s ease-in-out infinite'
            }}>
              InvestMail
            </h1>
            
            <p style=${{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Ultra-Secure Email Platform
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
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.1)'
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
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2), inset 0 0 20px rgba(34, 197, 94, 0.1)'
            }}>
              <span style=${{ fontSize: '24px' }}>✨</span>
              <span>${success}</span>
            </div>
          `}
          
          <!-- Login Card -->
          <div style=${{
            background: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(40px)',
            borderRadius: '28px',
            padding: '48px',
            boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.2), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(139, 92, 246, 0.05)',
            animation: 'fadeInUp 0.8s ease-out',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <!-- Animated Border Glow -->
            <div style=${{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: 'linear-gradient(45deg, #8b5cf6, #3b82f6, #8b5cf6, #3b82f6)',
              backgroundSize: '400% 400%',
              borderRadius: '28px',
              opacity: 0.3,
              zIndex: -1,
              animation: 'gradient 15s ease infinite',
              filter: 'blur(10px)'
            }}></div>
            
            <!-- Mode Tabs -->
            <div style=${{
              display: 'flex',
              gap: '12px',
              marginBottom: '36px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px',
              borderRadius: '16px',
              position: 'relative'
            }}>
              <button
                onClick=${() => setMode('login')}
                style=${{
                  flex: 1,
                  padding: '14px',
                  background: mode === 'login' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: mode === 'login' ? '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)' : 'none',
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
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: mode === 'register' ? '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)' : 'none',
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
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '10px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  📧 Email Address
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
                    padding: '16px 20px',
                    background: 'rgba(17, 24, 39, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                  onFocus=${(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.8)';
                    e.target.style.background = 'rgba(17, 24, 39, 0.8)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1), inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                  }}
                  onBlur=${(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.target.style.background = 'rgba(17, 24, 39, 0.6)';
                    e.target.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                  }}
                />
              </div>
              
              <!-- Password Field -->
              <div style=${{ marginBottom: mode === 'register' ? '24px' : '32px' }}>
                <label style=${{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '10px',
                  letterSpacing: '0.5px',
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
                      background: 'rgba(17, 24, 39, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'text'
                    }}
                    onFocus=${(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.8)';
                      e.target.style.background = 'rgba(17, 24, 39, 0.8)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1), inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                    onBlur=${(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.background = 'rgba(17, 24, 39, 0.6)';
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
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: '1',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
                    }}
                    onMouseEnter=${(e) => {
                      e.target.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    }}
                    onMouseLeave=${(e) => {
                      e.target.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
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
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '10px',
                    letterSpacing: '0.5px',
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
                      background: 'rgba(17, 24, 39, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'text'
                    }}
                    onFocus=${(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.8)';
                      e.target.style.background = 'rgba(17, 24, 39, 0.8)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1), inset 0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                    onBlur=${(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.background = 'rgba(17, 24, 39, 0.6)';
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
                  background: 'rgba(139, 92, 246, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.7',
                  boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.1)'
                }}>
                  <div style=${{ fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>
                    🔒 Password Requirements:
                  </div>
                  <ul style=${{ margin: '0', paddingLeft: '20px' }}>
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
                  padding: '18px',
                  background: loading 
                    ? 'rgba(100, 116, 139, 0.5)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: loading 
                    ? 'none' 
                    : '0 8px 32px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                  opacity: loading ? 0.8 : 1,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter=${(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-3px) scale(1.02)';
                    e.target.style.boxShadow = '0 12px 48px rgba(139, 92, 246, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave=${(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style=${{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  animation: loading ? 'shimmer 1.5s infinite' : 'none'
                }}></div>
                ${loading 
                  ? (mode === 'login' ? '⏳ Authenticating...' : '⏳ Creating Account...') 
                  : (mode === 'login' ? '🚀 Login to InvestMail' : '✨ Create Account')}
              </button>
            </form>
            
            <!-- Footer -->
            <div style=${{
              marginTop: '28px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: '1.6'
            }}>
              ${mode === 'login' ? html`
                <div>
                  Need an account? Contact admin at
                  <a href="/admin/email-accounts" style=${{
                    color: '#8b5cf6',
                    fontWeight: '700',
                    textDecoration: 'none',
                    marginLeft: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter=${(e) => {
                    e.target.style.color = '#a78bfa';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave=${(e) => {
                    e.target.style.color = '#8b5cf6';
                    e.target.style.textDecoration = 'none';
                  }}
                  >
                    Admin Panel →
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
            marginTop: '36px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            animation: 'fadeIn 1s ease-out 0.5s both'
          }}>
            <div style=${{ 
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              🛡️ Enterprise-Grade Security
            </div>
            <div style=${{ 
              fontSize: '12px',
              opacity: 0.7,
              letterSpacing: '0.5px'
            }}>
              SHA-256 • JWT • Rate Limiting • Session Management
            </div>
          </div>
        </div>
      </div>
      
      <!-- Keyframes -->
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
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 60px rgba(139, 92, 246, 0.5), inset 0 0 30px rgba(139, 92, 246, 0.2);
          }
        }
        
        @keyframes textGlow {
          0%, 100% {
            text-shadow: 0 0 40px rgba(139, 92, 246, 0.5);
          }
          50% {
            text-shadow: 0 0 60px rgba(139, 92, 246, 0.8), 0 0 80px rgba(59, 130, 246, 0.5);
          }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        
        ::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(17, 24, 39, 0.6) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
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
