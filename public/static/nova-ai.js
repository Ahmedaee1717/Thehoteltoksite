/**
 * 🌌 NOVA - Year 2070 AI Entity
 * 
 * NOT A CHATBOT. NOT A WIDGET. 
 * This is a SENTIENT AI CHARACTER that:
 * - Has personality, emotions, expressions
 * - Morphs and reacts to data
 * - Proactively helps without being asked
 * - Learns your patterns
 * - Feels ALIVE
 * 
 * Meet NOVA - Your Neural Optimization & Virtual Assistant
 */

(function() {
  'use strict';

  const API_BASE = '/api';
  
  // NOVA's personality states
  const NOVA_STATES = {
    IDLE: 'idle',
    THINKING: 'thinking',
    EXCITED: 'excited',
    CONCERNED: 'concerned',
    WORKING: 'working',
    CELEBRATING: 'celebrating'
  };

  let novaState = {
    currentMood: NOVA_STATES.IDLE,
    personality: 'helpful', // helpful, witty, serious
    data: {
      tasks: [],
      emails: [],
      meetings: [],
      actionItems: []
    },
    context: {
      userName: 'User',
      lastInteraction: null,
      preferences: {}
    }
  };

  // Create NOVA's physical form
  function createNova() {
    const nova = document.createElement('div');
    nova.id = 'nova-container';
    nova.className = 'nova-container';
    nova.innerHTML = `
      <!-- NOVA's Core -->
      <div class="nova-entity" id="nova-entity">
        <!-- Energy Core -->
        <div class="nova-core">
          <div class="core-outer-ring"></div>
          <div class="core-middle-ring"></div>
          <div class="core-inner"></div>
          <div class="core-particles" id="core-particles"></div>
        </div>
        
        <!-- NOVA's Face/Expression -->
        <div class="nova-face" id="nova-face">
          <div class="face-glow"></div>
          <svg class="face-svg" viewBox="0 0 200 200">
            <!-- Eyes -->
            <g class="nova-eyes" id="nova-eyes">
              <ellipse cx="70" cy="85" rx="12" ry="18" class="eye left-eye" fill="currentColor"/>
              <ellipse cx="130" cy="85" rx="12" ry="18" class="eye right-eye" fill="currentColor"/>
              <circle cx="70" cy="83" r="6" class="pupil" fill="#0a0e27"/>
              <circle cx="130" cy="83" r="6" class="pupil" fill="#0a0e27"/>
              <circle cx="72" cy="80" r="3" class="eye-shine" fill="white" opacity="0.9"/>
              <circle cx="132" cy="80" r="3" class="eye-shine" fill="white" opacity="0.9"/>
            </g>
            
            <!-- Mouth (changes with emotion) -->
            <g class="nova-mouth" id="nova-mouth">
              <path d="M 60 120 Q 100 140 140 120" 
                    stroke="currentColor" 
                    stroke-width="4" 
                    fill="none" 
                    stroke-linecap="round"
                    class="mouth-curve"/>
            </g>
            
            <!-- Neural Lines (thinking visualization) -->
            <g class="nova-neural-lines" opacity="0.3">
              <line x1="70" y1="85" x2="100" y2="100" stroke="currentColor" stroke-width="1"/>
              <line x1="130" y1="85" x2="100" y2="100" stroke="currentColor" stroke-width="1"/>
              <line x1="100" y1="100" x2="100" y2="120" stroke="currentColor" stroke-width="1"/>
            </g>
          </svg>
        </div>

        <!-- NOVA's Name Badge -->
        <div class="nova-badge">
          <span class="nova-name">NOVA</span>
          <span class="nova-subtitle">AI Entity</span>
        </div>

        <!-- Mood Indicator -->
        <div class="nova-mood-ring" id="nova-mood-ring">
          <div class="mood-pulse"></div>
        </div>
      </div>

      <!-- NOVA's Intelligence Interface -->
      <div class="nova-interface" id="nova-interface">
        <!-- NOVA's Thoughts (speech bubble) -->
        <div class="nova-thought-bubble" id="nova-thought">
          <div class="thought-content">
            <p class="thought-text">Hey! I'm NOVA 🌟 I've been analyzing your workspace...</p>
          </div>
          <div class="thought-tail"></div>
        </div>

        <!-- Holographic Data Panel -->
        <div class="nova-data-panel" id="nova-data-panel">
          <div class="panel-header-nova">
            <h3>Neural Analysis</h3>
            <div class="panel-tabs">
              <button class="tab-btn active" data-tab="insights">Insights</button>
              <button class="tab-btn" data-tab="actions">Actions</button>
              <button class="tab-btn" data-tab="chat">Chat</button>
            </div>
          </div>

          <!-- Insights Tab -->
          <div class="tab-content active" id="tab-insights">
            <div class="insights-grid" id="insights-grid">
              <div class="insight-card scanning">
                <div class="scan-line"></div>
                <p>Scanning neural pathways...</p>
              </div>
            </div>
          </div>

          <!-- Actions Tab -->
          <div class="tab-content" id="tab-actions">
            <div class="actions-list" id="actions-list">
              <p class="empty-state">No action items yet. I'll extract them from your meetings!</p>
            </div>
          </div>

          <!-- Chat Tab -->
          <div class="tab-content" id="tab-chat">
            <div class="chat-history" id="chat-history"></div>
            <div class="chat-input-zone">
              <input type="text" 
                     id="nova-chat-input" 
                     placeholder="Ask NOVA anything..."
                     autocomplete="off">
              <button id="nova-send-btn" class="send-btn-nova">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Quick Actions Bar -->
          <div class="quick-action-bar">
            <button class="quick-btn" id="extract-btn" title="Extract action items">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke-width="2"/>
              </svg>
              <span>Extract</span>
            </button>
            <button class="quick-btn" id="analyze-btn" title="Analyze emails">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke-width="2"/>
                <path d="M3 7l9 6 9-6" stroke-width="2"/>
              </svg>
              <span>Analyze</span>
            </button>
            <button class="quick-btn" id="suggest-btn" title="Get suggestions">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-width="2"/>
              </svg>
              <span>Suggest</span>
            </button>
          </div>
        </div>

        <!-- Minimize/Close Controls -->
        <div class="nova-controls">
          <button class="control-btn" id="nova-minimize" title="Minimize">−</button>
          <button class="control-btn" id="nova-close" title="Close">×</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(nova);
    
    // Generate particles
    generateCoreParticles();
    
    // Make NOVA draggable
    makeNovaDraggable(nova);
    
    // Setup interactions
    setupNovaInteractions(nova);
    
    // Initialize NOVA's AI
    bootUpNova();
    
    return nova;
  }

  // Generate floating particles around NOVA's core
  function generateCoreParticles() {
    const container = document.getElementById('core-particles');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.setProperty('--delay', `${Math.random() * 3}s`);
      particle.style.setProperty('--duration', `${3 + Math.random() * 2}s`);
      particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
      container.appendChild(particle);
    }
  }

  // Make NOVA draggable (FIXED - proper offset calculation)
  function makeNovaDraggable(container) {
    const entity = container.querySelector('#nova-entity');
    let isDragging = false;
    let startX, startY, initialX = 0, initialY = 0;

    entity.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current transform values
      const transform = window.getComputedStyle(container).transform;
      if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\((.+)\)/);
        if (matrix) {
          const values = matrix[1].split(', ');
          initialX = parseFloat(values[4]) || 0;
          initialY = parseFloat(values[5]) || 0;
        }
      }
      
      container.classList.add('dragging');
      setNovaMood(NOVA_STATES.WORKING);
      e.preventDefault();
    }

    function drag(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      container.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    }

    function dragEnd(e) {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Update initial position for next drag
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      initialX += deltaX;
      initialY += deltaY;
      
      container.classList.remove('dragging');
      setNovaMood(NOVA_STATES.IDLE);
    }
  }

  // Setup all interactions
  function setupNovaInteractions(container) {
    // Entity click - show/hide interface
    const entity = container.querySelector('#nova-entity');
    const interfaceEl = container.querySelector('#nova-interface');
    
    entity.addEventListener('click', () => {
      const isHidden = interfaceEl.classList.contains('hidden');
      if (isHidden) {
        interfaceEl.classList.remove('hidden');
        novaSpeak("What can I help you with?");
        setNovaMood(NOVA_STATES.EXCITED);
      }
    });

    // Minimize button
    document.getElementById('nova-minimize').addEventListener('click', () => {
      interfaceEl.classList.add('hidden');
      novaSpeak("I'll be here if you need me! 👋");
      setNovaMood(NOVA_STATES.IDLE);
    });

    // Close button
    document.getElementById('nova-close').addEventListener('click', () => {
      container.classList.add('hidden');
    });

    // Tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // Quick action buttons
    document.getElementById('extract-btn').addEventListener('click', extractActionItems);
    document.getElementById('analyze-btn').addEventListener('click', analyzeEmails);
    document.getElementById('suggest-btn').addEventListener('click', generateSuggestions);

    // Chat
    document.getElementById('nova-send-btn').addEventListener('click', sendMessage);
    document.getElementById('nova-chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Set NOVA's mood/expression
  function setNovaMood(mood) {
    novaState.currentMood = mood;
    const entity = document.getElementById('nova-entity');
    const moodRing = document.getElementById('nova-mood-ring');
    const eyes = document.getElementById('nova-eyes');
    const mouth = document.getElementById('nova-mouth');
    
    if (!entity) return;

    // Remove all mood classes
    entity.classList.remove('mood-idle', 'mood-thinking', 'mood-excited', 'mood-concerned', 'mood-working', 'mood-celebrating');
    
    // Add current mood
    entity.classList.add(`mood-${mood}`);

    // Change mouth expression
    const mouthPath = mouth.querySelector('.mouth-curve');
    switch(mood) {
      case NOVA_STATES.EXCITED:
      case NOVA_STATES.CELEBRATING:
        mouthPath.setAttribute('d', 'M 60 115 Q 100 145 140 115'); // Big smile
        break;
      case NOVA_STATES.CONCERNED:
        mouthPath.setAttribute('d', 'M 60 130 Q 100 110 140 130'); // Frown
        break;
      case NOVA_STATES.THINKING:
        mouthPath.setAttribute('d', 'M 70 125 L 130 125'); // Straight line
        break;
      default:
        mouthPath.setAttribute('d', 'M 60 120 Q 100 135 140 120'); // Gentle smile
    }

    // Animate eyes
    if (mood === NOVA_STATES.THINKING) {
      eyes.style.animation = 'eyesDarting 2s ease-in-out infinite';
    } else {
      eyes.style.animation = 'none';
    }

    // Color mood ring
    const colors = {
      [NOVA_STATES.IDLE]: '#00f0ff',
      [NOVA_STATES.THINKING]: '#8b5cf6',
      [NOVA_STATES.EXCITED]: '#10b981',
      [NOVA_STATES.CONCERNED]: '#ef4444',
      [NOVA_STATES.WORKING]: '#f59e0b',
      [NOVA_STATES.CELEBRATING]: '#ec4899'
    };
    
    if (moodRing) {
      moodRing.style.setProperty('--mood-color', colors[mood] || colors[NOVA_STATES.IDLE]);
    }
  }

  // NOVA speaks (thought bubble)
  function novaSpeak(text, duration = 4000) {
    const thought = document.getElementById('nova-thought');
    const thoughtText = thought.querySelector('.thought-text');
    
    thoughtText.textContent = text;
    thought.classList.add('show');
    
    setTimeout(() => {
      thought.classList.remove('show');
    }, duration);
  }

  // Switch tabs
  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
  }

  // Boot up NOVA
  async function bootUpNova() {
    setNovaMood(NOVA_STATES.WORKING);
    novaSpeak("Booting up neural network... 🌟", 2000);
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setTimeout(() => {
        setNovaMood(NOVA_STATES.CONCERNED);
        novaSpeak("Hey! You need to log in first 😊");
      }, 2000);
      return;
    }

    // Get user name from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      novaState.context.userName = (payload.email || 'User').split('@')[0];
    } catch (e) {}

    try {
      // Load all data
      await Promise.all([
        loadTasks(token),
        loadEmails(token),
        loadMeetings(token)
      ]);

      setTimeout(() => {
        setNovaMood(NOVA_STATES.EXCITED);
        novaSpeak(`Hey ${novaState.context.userName}! 👋 I've analyzed everything. Let me show you what I found!`, 5000);
      }, 1500);

      // Auto-analyze
      await analyzeEverything();

    } catch (error) {
      console.error('NOVA boot error:', error);
      setNovaMood(NOVA_STATES.CONCERNED);
      novaSpeak("Hmm, having trouble connecting to some systems...");
    }
  }

  // Load data functions
  async function loadTasks(token) {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        novaState.data.tasks = data.tasks || [];
        console.log('✅ NOVA: Tasks loaded', novaState.data.tasks.length);
      }
    } catch (e) {
      console.error('Tasks load error:', e);
    }
  }

  async function loadEmails(token) {
    try {
      const res = await fetch(`${API_BASE}/email/list?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        novaState.data.emails = data.emails || [];
        console.log('✅ NOVA: Emails loaded', novaState.data.emails.length);
      }
    } catch (e) {
      console.error('Emails load error:', e);
    }
  }

  async function loadMeetings(token) {
    try {
      const res = await fetch(`${API_BASE}/meetings/otter/transcripts?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        novaState.data.meetings = data.transcripts || [];
        console.log('✅ NOVA: Meetings loaded', novaState.data.meetings.length);
      }
    } catch (e) {
      console.error('Meetings load error:', e);
    }
  }

  // Analyze everything - THIS IS NOVA'S BRAIN
  async function analyzeEverything() {
    setNovaMood(NOVA_STATES.THINKING);
    
    const insights = [];

    // Extract action items from meetings
    for (const meeting of novaState.data.meetings.slice(0, 3)) {
      const items = extractActionItemsFromMeeting(meeting);
      if (items.length > 0) {
        insights.push({
          type: 'action-items',
          priority: 'high',
          icon: '⚡',
          title: `Found ${items.length} action items in "${meeting.title}"`,
          subtitle: items.slice(0, 2).map(i => `• ${i.text.substring(0, 50)}...`).join('\n'),
          action: () => showActionItems(items, meeting),
          data: { items, meeting }
        });
      }
    }

    // Find email commitments
    for (const email of novaState.data.emails.slice(0, 5)) {
      const commitments = findCommitments(email);
      if (commitments.length > 0) {
        insights.push({
          type: 'commitment',
          priority: 'medium',
          icon: '📧',
          title: `You promised to do something!`,
          subtitle: `In email: "${email.subject}"\n"${commitments[0].substring(0, 60)}..."`,
          action: () => draftEmailFromCommitment(email, commitments[0]),
          data: { email, commitment: commitments[0] }
        });
      }
    }

    // Overdue tasks
    const overdue = novaState.data.tasks.filter(t => 
      t.status !== 'completed' && new Date(t.due_date) < new Date()
    );
    if (overdue.length > 0) {
      insights.push({
        type: 'overdue',
        priority: 'urgent',
        icon: '🚨',
        title: `${overdue.length} tasks are overdue!`,
        subtitle: overdue.slice(0, 2).map(t => `• ${t.title}`).join('\n'),
        action: () => window.location.href = '/tasks?filter=overdue',
        data: { tasks: overdue }
      });
    }

    displayInsights(insights);
    setNovaMood(insights.length > 0 ? NOVA_STATES.EXCITED : NOVA_STATES.IDLE);
  }

  // Extract action items from meeting
  function extractActionItemsFromMeeting(meeting) {
    const text = meeting.transcript_text || '';
    const items = [];
    
    const patterns = [
      /(?:will|should|need to|must|have to)\s+([^.!?]{10,150})/gi,
      /(?:action item|todo|task):\s*([^.!?]{10,150})/gi,
      /(?:follow up|reach out|contact|email|call)\s+([^.!?]{10,150})/gi
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const item = match[1].trim();
        if (item.length > 10 && item.length < 200 && !items.some(i => i.text === item)) {
          items.push({
            text: item,
            meetingId: meeting.id,
            meetingTitle: meeting.title
          });
        }
      }
    });

    return items.slice(0, 5);
  }

  // Find commitments in email
  function findCommitments(email) {
    const body = (email.body || '').toLowerCase();
    const commitments = [];
    
    const phrases = ["i will", "i'll", "i'm going to", "i'll send", "i'll get back", "let me"];
    
    phrases.forEach(phrase => {
      if (body.includes(phrase)) {
        const start = body.indexOf(phrase);
        const sentence = body.slice(start, start + 200).split('.')[0];
        if (sentence.length > 10 && sentence.length < 200) {
          commitments.push(sentence.trim());
        }
      }
    });

    return commitments;
  }

  // Display insights
  function displayInsights(insights) {
    const grid = document.getElementById('insights-grid');
    
    if (insights.length === 0) {
      grid.innerHTML = `
        <div class="insight-card empty">
          <div class="empty-icon">✨</div>
          <h4>All Clear!</h4>
          <p>No urgent items right now</p>
          <div class="stats">
            <span>${novaState.data.tasks.length} tasks</span>
            <span>${novaState.data.emails.length} emails</span>
            <span>${novaState.data.meetings.length} meetings</span>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = insights.map(insight => `
      <div class="insight-card priority-${insight.priority}" data-type="${insight.type}">
        <div class="card-glow"></div>
        <div class="insight-icon">${insight.icon}</div>
        <h4 class="insight-title">${insight.title}</h4>
        <p class="insight-subtitle">${insight.subtitle}</p>
        <button class="insight-action-btn">Take Action →</button>
      </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.insight-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        if (insights[index].action) {
          insights[index].action();
        }
      });
    });
  }

  // Show action items
  function showActionItems(items, meeting) {
    novaState.data.actionItems = items;
    switchTab('actions');
    
    const list = document.getElementById('actions-list');
    list.innerHTML = `
      <div class="action-header">
        <h4>From: ${meeting.title}</h4>
        <button class="create-all-btn" id="create-all-tasks">Create All Tasks</button>
      </div>
      ${items.map((item, i) => `
        <div class="action-item" data-index="${i}">
          <div class="action-check">
            <input type="checkbox" id="action-${i}">
            <label for="action-${i}"></label>
          </div>
          <p class="action-text">${item.text}</p>
          <button class="action-btn-create" data-index="${i}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" stroke-width="2"/>
            </svg>
          </button>
        </div>
      `).join('')}
    `;

    // Add handlers
    document.getElementById('create-all-tasks').addEventListener('click', () => {
      setNovaMood(NOVA_STATES.WORKING);
      novaSpeak("Creating tasks from action items... ⚡");
      // TODO: Actually create tasks via API
      setTimeout(() => {
        setNovaMood(NOVA_STATES.CELEBRATING);
        novaSpeak(`Done! Created ${items.length} tasks! 🎉`);
      }, 2000);
    });

    list.querySelectorAll('.action-btn-create').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.dataset.index;
        const item = items[index];
        novaSpeak(`Creating task: "${item.text.substring(0, 40)}..."`);
        setNovaMood(NOVA_STATES.WORKING);
        // TODO: Create single task
      });
    });

    setNovaMood(NOVA_STATES.EXCITED);
    novaSpeak(`Found ${items.length} things you need to do! Want me to create tasks?`);
  }

  // Chat functions
  function sendMessage() {
    const input = document.getElementById('nova-chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('user', message);
    input.value = '';
    
    setNovaMood(NOVA_STATES.THINKING);
    
    setTimeout(() => {
      processMessage(message);
    }, 500);
  }

  function addChatMessage(sender, text) {
    const history = document.getElementById('chat-history');
    const msg = document.createElement('div');
    msg.className = `chat-msg msg-${sender}`;
    msg.innerHTML = `
      <div class="msg-avatar">${sender === 'nova' ? '🌟' : '👤'}</div>
      <div class="msg-bubble">${text}</div>
    `;
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
  }

  function processMessage(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('task')) {
      const count = novaState.data.tasks.length;
      const active = novaState.data.tasks.filter(t => t.status !== 'completed').length;
      setNovaMood(NOVA_STATES.EXCITED);
      addChatMessage('nova', `You have ${count} total tasks, ${active} are still active. Want me to show you the overdue ones?`);
    } else if (lower.includes('email')) {
      setNovaMood(NOVA_STATES.THINKING);
      addChatMessage('nova', `You have ${novaState.data.emails.length} emails. I can analyze them for action items if you want!`);
    } else if (lower.includes('meeting')) {
      setNovaMood(NOVA_STATES.EXCITED);
      if (novaState.data.meetings.length > 0) {
        const latest = novaState.data.meetings[0];
        addChatMessage('nova', `Your latest meeting was "${latest.title}". I already extracted ${novaState.data.actionItems.length} action items from it!`);
      } else {
        addChatMessage('nova', "No recent meetings found. Upload some transcripts and I'll analyze them!");
      }
    } else {
      setNovaMood(NOVA_STATES.IDLE);
      addChatMessage('nova', "I can help you with tasks, emails, meetings, and more! Try asking about your tasks or meetings 😊");
    }
  }

  // Quick actions
  async function extractActionItems() {
    setNovaMood(NOVA_STATES.WORKING);
    novaSpeak("Extracting action items from all meetings... 🔍");
    
    setTimeout(() => {
      analyzeEverything();
      switchTab('insights');
      setNovaMood(NOVA_STATES.EXCITED);
      novaSpeak("Done! Check out what I found! ✨");
    }, 2000);
  }

  async function analyzeEmails() {
    setNovaMood(NOVA_STATES.WORKING);
    novaSpeak("Analyzing your emails for commitments... 📧");
    
    setTimeout(() => {
      analyzeEverything();
      switchTab('insights');
      setNovaMood(NOVA_STATES.EXCITED);
    }, 2000);
  }

  async function generateSuggestions() {
    setNovaMood(NOVA_STATES.THINKING);
    novaSpeak("Let me think about what you should do next... 🤔");
    
    setTimeout(() => {
      analyzeEverything();
      switchTab('insights');
      setNovaMood(NOVA_STATES.EXCITED);
      novaSpeak("Here are my suggestions! 💡");
    }, 2000);
  }

  // Initialize NOVA
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNova);
  } else {
    createNova();
  }

  // Global toggle
  window.toggleNova = function() {
    const nova = document.getElementById('nova-container');
    if (nova) {
      nova.classList.toggle('hidden');
    }
  };

})();
