export const signupPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Investay Capital</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
            background: #000000;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
        }

        /* Subtle grid overlay - shows precision, not chaos */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
            background-size: 40px 40px;
            pointer-events: none;
            z-index: 0;
        }

        .container {
            width: 100%;
            max-width: 440px;
            position: relative;
            z-index: 1;
        }

        .logo {
            text-align: center;
            margin-bottom: 60px;
        }

        .logo img {
            height: 80px;
            width: auto;
            display: inline-block;
        }

        .card {
            background: rgba(10, 10, 10, 0.8);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(212, 175, 55, 0.15);
            border-radius: 1px;
            padding: 48px;
            position: relative;
        }

        /* Smart corner accents - shows craftsmanship */
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
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            color: #ffffff;
        }

        .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 40px;
            font-weight: 400;
            letter-spacing: 0.5px;
        }

        .form-group {
            margin-bottom: 24px;
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

        /* Smart input state indicator */
        .form-group::after {
            content: '';
            position: absolute;
            right: 16px;
            top: 40px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: transparent;
            transition: background 0.2s ease;
        }

        .form-group.valid::after {
            background: rgba(107, 255, 107, 0.8);
        }

        .input-group {
            position: relative;
        }

        .input-suffix {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
            font-size: 14px;
            pointer-events: none;
            letter-spacing: 0.3px;
        }

        .input-helper {
            margin-top: 8px;
            font-size: 11px;
            color: #555;
            letter-spacing: 0.3px;
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
            position: relative;
            overflow: hidden;
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

        .error-message {
            background: rgba(255, 107, 107, 0.08);
            border: 1px solid rgba(255, 107, 107, 0.2);
            border-radius: 1px;
            padding: 12px 16px;
            margin-bottom: 24px;
            color: #ff6b6b;
            font-size: 12px;
            display: none;
            letter-spacing: 0.3px;
        }

        .error-message.active {
            display: block;
        }

        .success-message {
            background: rgba(107, 255, 107, 0.08);
            border: 1px solid rgba(107, 255, 107, 0.2);
            border-radius: 1px;
            padding: 12px 16px;
            margin-bottom: 24px;
            color: #6bff6b;
            font-size: 12px;
            display: none;
            letter-spacing: 0.3px;
        }

        .success-message.active {
            display: block;
        }

        .step {
            display: none;
        }

        .step.active {
            display: block;
        }

        .code-inputs {
            display: flex;
            gap: 12px;
            margin: 32px 0;
            justify-content: center;
        }

        .code-digit {
            width: 52px;
            height: 64px;
            text-align: center;
            font-size: 28px;
            font-weight: 600;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1px;
            color: #ffffff;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            letter-spacing: 2px;
            transition: all 0.2s ease;
        }

        .code-digit:focus {
            outline: none;
            border-color: rgba(212, 175, 55, 0.5);
            background: rgba(0, 0, 0, 0.8);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
        }

        .timer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-bottom: 32px;
            font-family: 'SF Mono', 'Monaco', monospace;
            letter-spacing: 1px;
        }

        .timer.warning {
            color: #ff6b6b;
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

        .text-center {
            text-align: center;
        }

        .mt-24 {
            margin-top: 24px;
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

        .success-icon {
            text-align: center;
            font-size: 64px;
            margin-bottom: 24px;
            line-height: 1;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #555;
            letter-spacing: 0.5px;
        }

        /* Smart password strength indicator */
        .password-strength {
            height: 3px;
            background: rgba(255, 255, 255, 0.05);
            margin-top: 8px;
            border-radius: 2px;
            overflow: hidden;
        }

        .password-strength-bar {
            height: 100%;
            width: 0%;
            background: #666;
            transition: all 0.3s ease;
        }

        .password-strength-bar.weak {
            width: 33%;
            background: #ff6b6b;
        }

        .password-strength-bar.medium {
            width: 66%;
            background: #D4AF37;
        }

        .password-strength-bar.strong {
            width: 100%;
            background: #6bff6b;
        }

        /* Smart character counter */
        .char-counter {
            position: absolute;
            right: 16px;
            top: 8px;
            font-size: 10px;
            color: #555;
            font-family: 'SF Mono', monospace;
        }

        @media (max-width: 480px) {
            .card {
                padding: 32px 24px;
            }
            
            .code-digit {
                width: 44px;
                height: 56px;
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://www.investaycapital.com/static/investay-logo-white.png" alt="Investay Capital">
        </div>

        <div class="card">
            <!-- Step 1: Request Verification -->
            <div id="step1" class="step active">
                <h1 class="title">Create Account</h1>
                <p class="subtitle">Enterprise email platform</p>

                <div class="error-message" id="error1"></div>

                <form id="signupForm">
                    <div class="form-group" id="nameGroup">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input" id="fullName" placeholder="John Smith" required autocomplete="name">
                    </div>

                    <div class="form-group" id="emailGroup">
                        <label class="form-label">Company Email</label>
                        <input type="email" class="form-input" id="companyEmail" placeholder="john@virgingates.com" required autocomplete="email">
                        <div class="input-helper">
                            Must be @mattereum.com, @sharmdreamsgroup.com, or @virgingates.com
                        </div>
                    </div>

                    <div class="form-group" id="usernameGroup">
                        <label class="form-label">Choose Username</label>
                        <div class="input-group">
                            <input type="text" class="form-input" id="username" placeholder="john.smith" required style="padding-right: 160px;" autocomplete="username">
                            <span class="input-suffix">@investaycapital.com</span>
                        </div>
                    </div>

                    <div class="loading" id="loading1">
                        <div style="text-align: center; padding: 12px; color: #666; font-size: 13px;">
                            <div class="spinner"></div>
                            Sending verification code
                        </div>
                    </div>

                    <button type="submit" class="btn-primary" id="submitBtn1">
                        Continue
                    </button>
                </form>
            </div>

            <!-- Step 2: Verify Code -->
            <div id="step2" class="step">
                <h1 class="title">Verify Email</h1>
                <p class="subtitle" id="verificationEmailText">Enter the code sent to your email</p>

                <div class="error-message" id="error2"></div>
                <div class="success-message" id="success2"></div>

                <form id="verifyForm">
                    <div class="code-inputs">
                        <input type="text" class="code-digit" maxlength="1" id="digit1" data-index="0" inputmode="numeric" pattern="[0-9]">
                        <input type="text" class="code-digit" maxlength="1" id="digit2" data-index="1" inputmode="numeric" pattern="[0-9]">
                        <input type="text" class="code-digit" maxlength="1" id="digit3" data-index="2" inputmode="numeric" pattern="[0-9]">
                        <input type="text" class="code-digit" maxlength="1" id="digit4" data-index="3" inputmode="numeric" pattern="[0-9]">
                        <input type="text" class="code-digit" maxlength="1" id="digit5" data-index="4" inputmode="numeric" pattern="[0-9]">
                        <input type="text" class="code-digit" maxlength="1" id="digit6" data-index="5" inputmode="numeric" pattern="[0-9]">
                    </div>

                    <div class="timer" id="timer">
                        Code expires in <span id="countdown">10:00</span>
                    </div>

                    <div class="form-group" style="position: relative;">
                        <label class="form-label">Create Password</label>
                        <span class="char-counter" id="passCounter">0/8</span>
                        <input type="password" class="form-input" id="password" placeholder="Minimum 8 characters" required minlength="8" autocomplete="new-password">
                        <div class="password-strength">
                            <div class="password-strength-bar" id="strengthBar"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" class="form-input" id="confirmPassword" placeholder="Re-enter password" required autocomplete="new-password">
                    </div>

                    <div class="loading" id="loading2">
                        <div style="text-align: center; padding: 12px; color: #666; font-size: 13px;">
                            <div class="spinner"></div>
                            Creating account
                        </div>
                    </div>

                    <button type="submit" class="btn-primary" id="submitBtn2">
                        Create Account
                    </button>

                    <div class="text-center mt-24">
                        <a href="#" class="link" id="resendCode">Resend code</a>
                    </div>
                </form>
            </div>

            <!-- Step 3: Success -->
            <div id="step3" class="step">
                <div class="success-icon">✓</div>
                <h1 class="title text-center">Account Created</h1>
                <p class="subtitle text-center">Welcome to Investay Capital</p>
                
                <a href="/mail" class="btn-primary" style="display: block; text-align: center; text-decoration: none; margin-top: 32px;">
                    Go to Inbox
                </a>
            </div>
        </div>

        <div class="footer">
            Already have an account? <a href="/login" class="link">Sign in</a>
        </div>
    </div>

    <script>
        const ALLOWED_DOMAINS = ['mattereum.com', 'sharmdreamsgroup.com', 'virgingates.com'];
        let signupData = {};
        let countdownInterval;

        // Smart input validation with visual feedback
        const validateInput = (input, validator) => {
            const group = input.closest('.form-group');
            if (validator(input.value)) {
                group.classList.add('valid');
            } else {
                group.classList.remove('valid');
            }
        };

        document.getElementById('fullName').addEventListener('input', (e) => {
            validateInput(e.target, (v) => v.trim().length > 2);
        });

        document.getElementById('companyEmail').addEventListener('input', (e) => {
            const domain = e.target.value.split('@')[1];
            validateInput(e.target, (v) => domain && ALLOWED_DOMAINS.includes(domain));
        });

        document.getElementById('username').addEventListener('input', (e) => {
            validateInput(e.target, (v) => /^[a-z0-9._-]+$/.test(v) && v.length >= 3);
        });

        // Smart password strength indicator
        document.getElementById('password').addEventListener('input', (e) => {
            const pass = e.target.value;
            const counter = document.getElementById('passCounter');
            const strengthBar = document.getElementById('strengthBar');
            
            counter.textContent = \`\${pass.length}/8\`;
            
            if (pass.length < 8) {
                strengthBar.className = 'password-strength-bar weak';
            } else if (pass.length < 12 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
                strengthBar.className = 'password-strength-bar medium';
            } else {
                strengthBar.className = 'password-strength-bar strong';
            }
        });

        // Step 1: Request verification
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const companyEmail = document.getElementById('companyEmail').value.trim().toLowerCase();
            const username = document.getElementById('username').value.trim().toLowerCase();

            if (!fullName || !companyEmail || !username) {
                showError('error1', 'Please fill in all fields');
                return;
            }

            const emailDomain = companyEmail.split('@')[1];
            if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
                showError('error1', 'Email must be from mattereum.com, sharmdreamsgroup.com, or virgingates.com');
                return;
            }

            if (!/^[a-z0-9._-]+$/.test(username)) {
                showError('error1', 'Username can only contain lowercase letters, numbers, dots, and hyphens');
                return;
            }

            signupData = {
                fullName,
                username,
                company: emailDomain,
                verificationEmail: companyEmail
            };

            document.getElementById('loading1').classList.add('active');
            document.getElementById('submitBtn1').disabled = true;

            try {
                const response = await fetch('/api/signup/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(signupData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Signup failed');
                }

                document.getElementById('verificationEmailText').textContent = \`Code sent to \${companyEmail}\`;
                document.getElementById('step1').classList.remove('active');
                document.getElementById('step2').classList.add('active');
                
                startCountdown(data.expiresIn || 600);
                document.getElementById('digit1').focus();

            } catch (error) {
                showError('error1', error.message);
            } finally {
                document.getElementById('loading1').classList.remove('active');
                document.getElementById('submitBtn1').disabled = false;
            }
        });

        // Code input auto-advance
        const codeDigits = document.querySelectorAll('.code-digit');
        codeDigits.forEach((digit, index) => {
            digit.addEventListener('input', (e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = value;
                if (value && index < 5) {
                    codeDigits[index + 1].focus();
                }
            });

            digit.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    codeDigits[index - 1].focus();
                }
            });

            digit.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\\D/g, '').slice(0, 6);
                pastedData.split('').forEach((char, i) => {
                    if (codeDigits[i]) {
                        codeDigits[i].value = char;
                    }
                });
                if (pastedData.length === 6) {
                    codeDigits[5].focus();
                }
            });
        });

        // Step 2: Verify and complete signup
        document.getElementById('verifyForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const code = Array.from(codeDigits).map(d => d.value).join('');
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (code.length !== 6) {
                showError('error2', 'Please enter the 6-digit code');
                return;
            }

            if (password.length < 8) {
                showError('error2', 'Password must be at least 8 characters');
                return;
            }

            if (password !== confirmPassword) {
                showError('error2', 'Passwords do not match');
                return;
            }

            document.getElementById('loading2').classList.add('active');
            document.getElementById('submitBtn2').disabled = true;

            try {
                const response = await fetch('/api/signup/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...signupData,
                        code,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Verification failed');
                }

                clearInterval(countdownInterval);
                document.getElementById('step2').classList.remove('active');
                document.getElementById('step3').classList.add('active');

            } catch (error) {
                showError('error2', error.message);
            } finally {
                document.getElementById('loading2').classList.remove('active');
                document.getElementById('submitBtn2').disabled = false;
            }
        });

        // Resend code
        document.getElementById('resendCode').addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/signup/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(signupData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to resend code');
                }

                clearInterval(countdownInterval);
                startCountdown(data.expiresIn || 600);
                
                codeDigits.forEach(d => d.value = '');
                document.getElementById('digit1').focus();

                showSuccess('success2', 'New code sent to your email');
                setTimeout(() => {
                    document.getElementById('success2').classList.remove('active');
                }, 3000);

            } catch (error) {
                showError('error2', error.message);
            }
        });

        function startCountdown(seconds) {
            const timerEl = document.getElementById('timer');
            const countdownEl = document.getElementById('countdown');
            let timeLeft = seconds;

            countdownInterval = setInterval(() => {
                timeLeft--;

                const minutes = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;
                countdownEl.textContent = \`\${minutes}:\${secs.toString().padStart(2, '0')}\`;

                if (timeLeft <= 60) {
                    timerEl.classList.add('warning');
                }

                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    showError('error2', 'Code expired. Please request a new one.');
                }
            }, 1000);
        }

        function showError(elementId, message) {
            const errorEl = document.getElementById(elementId);
            errorEl.textContent = message;
            errorEl.classList.add('active');
            setTimeout(() => {
                errorEl.classList.remove('active');
            }, 5000);
        }

        function showSuccess(elementId, message) {
            const successEl = document.getElementById(elementId);
            successEl.textContent = message;
            successEl.classList.add('active');
        }
    </script>
</body>
</html>
`
