export const loginPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Investay Capital</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }

        /* Advanced holographic grid */
        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background-image: 
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212, 175, 55, 0.02) 2px, rgba(212, 175, 55, 0.02) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(212, 175, 55, 0.02) 2px, rgba(212, 175, 55, 0.02) 4px),
                repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 175, 55, 0.01) 10px, rgba(212, 175, 55, 0.01) 20px);
            transform: perspective(800px) rotateX(65deg) translateZ(-100px);
            pointer-events: none;
            z-index: 0;
        }

        /* Ambient glow effect with scanning beam */
        body::after {
            content: '';
            position: fixed;
            top: -100%;
            left: 0;
            width: 100%;
            height: 200%;
            background: linear-gradient(180deg, 
                transparent 0%, 
                rgba(212, 175, 55, 0.03) 48%, 
                rgba(212, 175, 55, 0.1) 50%, 
                rgba(212, 175, 55, 0.03) 52%, 
                transparent 100%);
            pointer-events: none;
            z-index: 0;
            animation: scanBeam 8s ease-in-out infinite;
        }

        @keyframes scanBeam {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(50%); }
        }

        .container {
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 48px;
        }

        .logo-icon {
            width: 180px;
            height: auto;
            margin: 0 auto 32px;
            position: relative;
            padding: 24px;
            background: #1a1a1a;
            border: 3px solid #D4AF37;
            box-shadow: 
                0 0 40px rgba(212, 175, 55, 0.25),
                inset 0 0 40px rgba(212, 175, 55, 0.08),
                0 0 80px rgba(212, 175, 55, 0.15);
        }

        .logo-icon::before {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            bottom: 8px;
            border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .logo-icon::after {
            content: '';
            position: absolute;
            top: -12px;
            left: -12px;
            right: -12px;
            bottom: -12px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%);
            z-index: -1;
        }

        .logo-icon img {
            width: 100%;
            height: auto;
            display: block;
            position: relative;
            z-index: 1;
            filter: brightness(1.05) contrast(1.05);
        }

        .brand-name {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #ffffff 0%, #D4AF37 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .brand-tagline {
            font-size: 13px;
            color: #666;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }

        .card {
            background: rgba(10, 10, 10, 0.8);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(212, 175, 55, 0.15);
            border-radius: 1px;
            padding: 40px;
            position: relative;
        }

        /* Corner accents */
        .card::before,
        .card::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            border: 1px solid rgba(212, 175, 55, 0.4);
        }

        .card::before {
            top: -1px;
            left: -1px;
            border-right: none;
            border-bottom: none;
        }

        .card::after {
            bottom: -1px;
            right: -1px;
            border-left: none;
            border-top: none;
        }

        .title {
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.3px;
            margin-bottom: 8px;
            color: #ffffff;
        }

        .subtitle {
            font-size: 13px;
            color: #666;
            margin-bottom: 32px;
            letter-spacing: 0.3px;
        }

        .form-group {
            margin-bottom: 20px;
            position: relative;
        }

        .form-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #999;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
        }

        .form-input {
            width: 100%;
            padding: 14px 16px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1px;
            color: #ffffff;
            font-size: 15px;
            transition: all 0.2s ease;
            font-family: inherit;
            letter-spacing: 0.3px;
        }

        .form-input:focus {
            outline: none;
            border-color: rgba(212, 175, 55, 0.5);
            background: rgba(0, 0, 0, 0.8);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
        }

        .form-input::placeholder {
            color: #444;
        }

        .form-group.valid::after {
            content: '';
            position: absolute;
            right: 16px;
            top: 40px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(107, 255, 107, 0.8);
        }

        .btn-primary {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #D4AF37 0%, #F4E5B0 100%);
            border: none;
            border-radius: 1px;
            color: #000000;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 12px;
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(212, 175, 55, 0.25);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .btn-primary:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
        }

        .divider {
            display: flex;
            align-items: center;
            margin: 24px 0;
            color: #555;
            font-size: 12px;
            letter-spacing: 0.5px;
        }

        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.08);
        }

        .divider::before {
            margin-right: 12px;
        }

        .divider::after {
            margin-left: 12px;
        }

        .link {
            color: #D4AF37;
            text-decoration: none;
            font-size: 12px;
            letter-spacing: 0.5px;
            transition: color 0.2s ease;
        }

        .link:hover {
            color: #F4E5B0;
        }

        .footer {
            text-align: center;
            margin-top: 32px;
            font-size: 12px;
            color: #555;
            letter-spacing: 0.5px;
        }

        .error-message {
            background: rgba(255, 107, 107, 0.08);
            border: 1px solid rgba(255, 107, 107, 0.2);
            border-radius: 1px;
            padding: 12px 16px;
            margin-bottom: 20px;
            color: #ff6b6b;
            font-size: 12px;
            display: none;
            letter-spacing: 0.3px;
        }

        .error-message.active {
            display: block;
        }

        .loading {
            display: none;
        }

        .loading.active {
            display: block;
        }

        .spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(212, 175, 55, 0.2);
            border-top-color: #D4AF37;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
            .card {
                padding: 32px 24px;
            }
            
            .logo-icon {
                width: 60px;
                height: 60px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <div class="logo-icon">
                <img src="https://www.investaycapital.com/static/investay-logo-clean.png" alt="Investay Capital">
            </div>
            <div class="brand-name">INVESTAY CAPITAL</div>
            <div class="brand-tagline">Enterprise Email Platform</div>
        </div>

        <div class="card">
            <h1 class="title">Welcome Back</h1>
            <p class="subtitle">Sign in to your account</p>

            <div class="error-message" id="errorMessage"></div>

            <form id="loginForm">
                <div class="form-group" id="emailGroup">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-input" id="email" placeholder="your.name@investaycapital.com" required autocomplete="email">
                </div>

                <div class="form-group" id="passwordGroup">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" id="password" placeholder="Enter your password" required autocomplete="current-password">
                </div>

                <div class="loading" id="loading">
                    <div style="text-align: center; padding: 12px; color: #666; font-size: 13px;">
                        <div class="spinner"></div>
                        Signing in
                    </div>
                </div>

                <button type="submit" class="btn-primary" id="submitBtn">
                    Sign In
                </button>
            </form>

            <div class="divider">OR</div>

            <div style="text-align: center;">
                <a href="/signup" class="link">Create new account</a>
            </div>
        </div>

        <div class="footer">
            © 2026 Investay Capital. All rights reserved.
        </div>
    </div>

    <script>
        // Smart input validation
        const validateInput = (input, validator) => {
            const group = input.closest('.form-group');
            if (validator(input.value)) {
                group.classList.add('valid');
            } else {
                group.classList.remove('valid');
            }
        };

        document.getElementById('email').addEventListener('input', (e) => {
            validateInput(e.target, (v) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v));
        });

        document.getElementById('password').addEventListener('input', (e) => {
            validateInput(e.target, (v) => v.length >= 6);
        });

        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showError('Please fill in all fields');
                return;
            }

            document.getElementById('loading').classList.add('active');
            document.getElementById('submitBtn').disabled = true;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Redirect to mail on success
                window.location.href = '/mail';

            } catch (error) {
                showError(error.message);
            } finally {
                document.getElementById('loading').classList.remove('active');
                document.getElementById('submitBtn').disabled = false;
            }
        });

        function showError(message) {
            const errorEl = document.getElementById('errorMessage');
            errorEl.textContent = message;
            errorEl.classList.add('active');
            setTimeout(() => {
                errorEl.classList.remove('active');
            }, 5000);
        }
    </script>
</body>
</html>
`
