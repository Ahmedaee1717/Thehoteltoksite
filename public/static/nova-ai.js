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

  // Make NOVA draggable (COMPLETELY REWRITTEN - PROPER FIX)
  function makeNovaDraggable(container) {
    const entity = container.querySelector('#nova-entity');
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialMouseX = 0;
    let initialMouseY = 0;

    // Get current position from transform
    function getCurrentPosition() {
      const transform = window.getComputedStyle(container).transform;
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        return { x: matrix.m41, y: matrix.m42 };
      }
      return { x: 0, y: 0 };
    }

    entity.addEventListener('mousedown', (e) => {
      isDragging = true;
      
      // Get current position
      const pos = getCurrentPosition();
      currentX = pos.x;
      currentY = pos.y;
      
      // Store initial mouse position
      initialMouseX = e.clientX;
      initialMouseY = e.clientY;
      
      container.classList.add('dragging');
      setNovaMood(NOVA_STATES.WORKING);
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      
      // Calculate how far the mouse has moved
      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;
      
      // Apply the movement to the current position
      const newX = currentX + deltaX;
      const newY = currentY + deltaY;
      
      container.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      
      isDragging = false;
      container.classList.remove('dragging');
      setNovaMood(NOVA_STATES.IDLE);
    });
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
    
    // Check auth via API (no more localStorage tokens!)
    try {
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authRes.json();
      
      if (!authData.success || !authData.user) {
        setTimeout(() => {
          setNovaMood(NOVA_STATES.CONCERNED);
          novaSpeak("Hey! You need to log in first 😊");
        }, 2000);
        return;
      }
      
      // Get user name from API response
      novaState.context.userName = authData.user.displayName || authData.user.email.split('@')[0];
      
    } catch (e) {
      console.error('NOVA auth check failed:', e);
      setTimeout(() => {
        setNovaMood(NOVA_STATES.CONCERNED);
        novaSpeak("Having trouble verifying your identity...");
      }, 2000);
      return;
    }

    try {
      // Load all data (no token params needed - uses cookies!)
      await Promise.all([
        loadTasks(),
        loadEmails(),
        loadMeetings()
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
  async function loadTasks() {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        credentials: 'include'
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

  async function loadEmails() {
    try {
      const res = await fetch(`${API_BASE}/email/list?limit=20`, {
        credentials: 'include'
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

  async function loadMeetings() {
    try {
      const res = await fetch(`${API_BASE}/meetings/otter/transcripts?limit=20`, {
        credentials: 'include'
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

  // INTELLIGENT CROSS-MEETING ANALYSIS
  function extractCrossMeetingInsights() {
    const peopleMap = new Map();
    const projectMap = new Map();
    const actionItemsMap = [];

    // Scan ALL meetings for patterns
    novaState.data.meetings.forEach(meeting => {
      const text = `${meeting.title} ${meeting.summary || ''}`;
      
      // Extract @mentions (people)
      const peopleRegex = /@([A-Za-z\s]+?)(?=\s|,|;|\.|$|@|\n)/g;
      let match;
      while ((match = peopleRegex.exec(meeting.summary || '')) !== null) {
        const person = match[1].trim();
        if (person.length > 2) {
          if (!peopleMap.has(person)) {
            peopleMap.set(person, []);
          }
          peopleMap.get(person).push({
            meetingId: meeting.id,
            title: meeting.title,
            date: meeting.start_time
          });
        }
      }

      // Extract project/company names (case-insensitive)
      const projectRegex = /\b(agridex|mattereum|adgm|aslegal|as legal|investay)\b/gi;
      while ((match = projectRegex.exec(text)) !== null) {
        const project = match[1].toUpperCase();
        if (!projectMap.has(project)) {
          projectMap.set(project, []);
        }
        projectMap.get(project).push({
          meetingId: meeting.id,
          title: meeting.title,
          date: meeting.start_time
        });
      }

      // Extract uncompleted action items
      if (meeting.summary && meeting.summary.includes('Action Items:')) {
        const actionSection = meeting.summary.split('Action Items:')[1]?.split('Next Steps:')[0];
        if (actionSection) {
          const actions = actionSection.split('\n').filter(line => 
            line.trim().startsWith('•') || line.trim().startsWith('-')
          );
          actions.forEach(action => {
            const cleanAction = action.replace(/^[•\-]\s*/, '').trim();
            if (cleanAction.length > 10) {
              actionItemsMap.push({
                text: cleanAction,
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                assignee: cleanAction.match(/@([A-Za-z\s]+)/)?.[1]
              });
            }
          });
        }
      }
    });

    return { peopleMap, projectMap, actionItemsMap };
  }

  // Analyze everything - THIS IS NOVA'S BRAIN
  async function analyzeEverything() {
    setNovaMood(NOVA_STATES.THINKING);
    
    const insights = [];

    // 🧠 CROSS-MEETING INTELLIGENCE
    const { peopleMap, projectMap, actionItemsMap } = extractCrossMeetingInsights();

    // Surface people mentioned in multiple meetings
    peopleMap.forEach((meetings, person) => {
      if (meetings.length > 1) {
        insights.push({
          type: 'person-connection',
          priority: 'medium',
          icon: '👤',
          title: `${person} mentioned in ${meetings.length} meetings`,
          subtitle: `Most recent: "${meetings[meetings.length - 1].title}"`,
          action: () => {
            novaSpeak(`Found ${person} in ${meetings.length} meetings: ${meetings.map(m => m.title).join(', ')}`);
            // TODO: Show detailed person timeline
          },
          data: { person, meetings }
        });
      }
    });

    // Surface projects discussed across meetings
    projectMap.forEach((meetings, project) => {
      if (meetings.length > 1) {
        insights.push({
          type: 'project-connection',
          priority: 'medium',
          icon: '🏢',
          title: `${project} discussed in ${meetings.length} meetings`,
          subtitle: meetings.map(m => `• ${m.title.substring(0, 40)}...`).slice(0, 2).join('\n'),
          action: () => {
            novaSpeak(`${project} timeline: ${meetings.map(m => m.title).join(' → ')}`);
            // TODO: Show project timeline
          },
          data: { project, meetings }
        });
      }
    });

    // Surface uncompleted action items (not converted to tasks)
    const openActionItems = actionItemsMap.filter(action => {
      return !novaState.data.tasks.some(task => 
        task.title.toLowerCase().includes(action.text.substring(0, 30).toLowerCase())
      );
    });
    
    if (openActionItems.length > 0) {
      insights.push({
        type: 'open-actions',
        priority: 'high',
        icon: '📋',
        title: `${openActionItems.length} action items not yet tasks`,
        subtitle: openActionItems.slice(0, 2).map(a => `• ${a.text.substring(0, 50)}...`).join('\n'),
        action: () => showActionItems(openActionItems, { title: 'From Multiple Meetings' }),
        data: { actions: openActionItems }
      });
    }

    // Extract action items from recent meetings
    for (const meeting of novaState.data.meetings.slice(0, 3)) {
      const items = extractActionItemsFromMeeting(meeting);
      if (items.length > 0) {
        // Check for EMAIL tasks specifically
        const emailTasks = items.filter(item => {
          const text = item.text.toLowerCase();
          return text.includes('email') || text.includes('contact') || text.includes('reach out');
        });
        
        if (emailTasks.length > 0) {
          // CREATE SMART EMAIL TASK INSIGHT
          emailTasks.forEach(emailTask => {
            // Use SMART extraction function
            const recipient = extractRecipientFromText(emailTask.text);
            
            insights.push({
              type: 'smart-email-task',
              priority: 'urgent',
              icon: '📨',
              title: `🔥 Need to email ${recipient}!`,
              subtitle: `From: "${meeting.title}"\n💡 I'll search for real contact info and draft the email`,
              action: () => handleSmartEmailTask(emailTask, meeting, recipient),
              data: { task: emailTask, meeting, recipient }
            });
          });
        }
        
        // Show other action items
        const otherItems = items.filter(item => {
          const text = item.text.toLowerCase();
          return !(text.includes('email') || text.includes('contact') || text.includes('reach out'));
        });
        
        if (otherItems.length > 0) {
          insights.push({
            type: 'action-items',
            priority: 'high',
            icon: '⚡',
            title: `Found ${otherItems.length} action items in "${meeting.title}"`,
            subtitle: otherItems.slice(0, 2).map(i => `• ${i.text.substring(0, 50)}...`).join('\n'),
            action: () => showActionItems(otherItems, meeting),
            data: { items: otherItems, meeting }
          });
        }
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
        action: () => {
          // Check if we're already in collaboration center
          if (window.location.pathname === '/collaborate') {
            // Switch to tasks view
            if (window.switchView) {
              window.switchView('tasks');
            }
          } else {
            // Go to collaboration center tasks view
            window.location.href = '/collaborate#tasks';
          }
        },
        data: { tasks: overdue }
      });
    }

    // Filter out dismissed insights
    const filteredInsights = insights.filter(insight => !isInsightDismissed(insight));
    
    novaState.currentInsights = filteredInsights;
    displayInsights(filteredInsights);
    setNovaMood(filteredInsights.length > 0 ? NOVA_STATES.EXCITED : NOVA_STATES.IDLE);
    
    // NOVA announces findings
    if (peopleMap.size > 0 || projectMap.size > 0) {
      const people = Array.from(peopleMap.keys()).filter(p => peopleMap.get(p).length > 1);
      const projects = Array.from(projectMap.keys()).filter(p => projectMap.get(p).length > 1);
      
      if (people.length > 0) {
        novaSpeak(`I found ${people.join(', ')} mentioned across multiple meetings! 🔍`);
      } else if (projects.length > 0) {
        novaSpeak(`Tracking ${projects.join(', ')} across your meetings! 📊`);
      }
    }
  }

  // Extract action items from meeting
  function extractActionItemsFromMeeting(meeting) {
    const items = [];
    
    // PRIORITY 1: Extract from "Goal:" format (simple summaries)
    if (meeting.summary && meeting.summary.includes('Goal:')) {
      const goalMatch = meeting.summary.match(/Goal:\s*(.+?)(?:\.|$)/i);
      if (goalMatch) {
        const goalText = goalMatch[1].trim();
        if (goalText.length > 10) {
          items.push({
            text: goalText,
            meetingId: meeting.id,
            meetingTitle: meeting.title
          });
          console.log(`🎯 Found Goal: "${goalText}"`);
        }
      }
    }
    
    // PRIORITY 2: Extract from GPT-4 structured summary
    if (items.length === 0 && meeting.summary && meeting.summary.includes('Action Items:')) {
      const actionSection = meeting.summary.split('Action Items:')[1]?.split('Next Steps:')[0];
      if (actionSection) {
        const lines = actionSection.split('\n');
        lines.forEach(line => {
          // Match lines like: • Send WhatsApp contact details - @Ali
          // or: - Arrange meeting on January 14th - @Hamada
          const match = line.match(/^[•\-]\s*(.+?)(?:\s*-\s*@(.+))?$/);
          if (match) {
            const text = match[1].trim();
            const assignee = match[2]?.trim();
            if (text.length > 10 && text.length < 200) {
              items.push({
                text: text,
                assignee: assignee,
                meetingId: meeting.id,
                meetingTitle: meeting.title
              });
            }
          }
        });
      }
    }
    
    // FALLBACK: Old pattern matching on transcript
    if (items.length === 0) {
      const text = meeting.transcript_text || '';
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
    }

    console.log(`📋 Extracted ${items.length} action items from "${meeting.title}"`);
    return items.slice(0, 10);
  }

  // INTELLIGENT ACTION ITEM ENRICHMENT
  async function enrichActionItem(item, meeting) {
    const text = item.text.toLowerCase();
    const enriched = {
      title: item.text,
      description: `From meeting: ${meeting.title}\n\n`,
      priority: 'medium',
      isEmailTask: false,
      recipient: null,
      suggestions: []
    };

    // Detect EMAIL tasks with smart extraction
    const emailPatterns = ['email', 'send email', 'reach out', 'contact', 'write to'];
    const isEmail = emailPatterns.some(p => text.includes(p));
    
    if (isEmail) {
      enriched.isEmailTask = true;
      enriched.priority = 'high';
      
      // SMART EXTRACTION: Handle different formats
      let recipient = null;
      let companyDomain = null;
      let emailContext = item.text; // Full context
      
      // 1. Extract domain/company (e.g., "rawsummit.io", "example.com")
      const domainMatch = text.match(/(?:@|at\s+)?([a-z0-9-]+\.[a-z]{2,})/i);
      if (domainMatch) {
        companyDomain = domainMatch[1];
        recipient = companyDomain.split('.')[0]; // Use company name as recipient
        console.log(`🌐 Found domain: ${companyDomain}`);
      }
      
      // 2. Extract person name (but avoid common words like "at", "someone")
      if (!recipient) {
        const skipWords = ['at', 'someone', 'them', 'him', 'her', 'the', 'a', 'an', 'and', 'or'];
        const nameMatch = text.match(/(?:email|contact|reach out to)\s+(?:someone\s+at\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
        if (nameMatch && !skipWords.includes(nameMatch[1].toLowerCase())) {
          recipient = nameMatch[1];
          console.log(`👤 Found person: ${recipient}`);
        }
      }
      
      // 3. Fallback: Use company/domain name
      if (!recipient && companyDomain) {
        recipient = companyDomain;
      }
      
      // 4. Last resort: Generic "contact"
      if (!recipient) {
        recipient = 'contact';
        console.log(`⚠️ No specific recipient found, using generic`);
      }
      
      enriched.recipient = recipient;
      enriched.companyDomain = companyDomain;
      enriched.title = companyDomain ? `Email ${companyDomain}` : `Email ${recipient}`;
      enriched.description += `\n🎯 TARGET: ${companyDomain || recipient}`;
      enriched.description += `\n📝 CONTEXT: ${emailContext}`;
      
      // Add meeting summary/goal for better context
      if (meeting.summary) {
        const goalMatch = meeting.summary.match(/Goal:\s*(.+?)(?:\n|$)/i);
        if (goalMatch) {
          enriched.description += `\n\n🎯 MEETING GOAL:\n${goalMatch[1]}`;
        }
      }
      
      enriched.description += `\n\n💡 NOVA SUGGESTIONS:`;
      enriched.description += `\n• Search for ${companyDomain || recipient} contact info`;
      enriched.description += `\n• Find the right person to email`;
      enriched.description += `\n• Draft email with meeting context`;
      enriched.description += `\n• Review and send`;
      
      console.log(`🔍 Detected email task to: ${recipient} (${companyDomain || 'no domain'})`);
    }

    // Detect MEETING/CALL tasks
    const meetingPatterns = ['schedule', 'arrange meeting', 'set up call', 'book time'];
    const isMeeting = meetingPatterns.some(p => text.includes(p));
    
    if (isMeeting) {
      enriched.priority = 'high';
      enriched.description += `\n📅 This is a scheduling task`;
      enriched.suggestions.push('Check calendar availability');
      enriched.suggestions.push('Send meeting invite');
    }

    // Detect RESEARCH tasks
    const researchPatterns = ['find out', 'research', 'look up', 'investigate', 'check'];
    const isResearch = researchPatterns.some(p => text.includes(p));
    
    if (isResearch) {
      enriched.description += `\n🔍 This requires research`;
      enriched.suggestions.push('Search online for information');
      enriched.suggestions.push('Compile findings');
    }

    return enriched;
  }

  // SMART RECIPIENT EXTRACTION - Reusable function
  function extractRecipientFromText(text) {
    console.log('🔍 Extracting recipient from:', text);
    
    // Pattern 0: Company name BEFORE "contact" or "information" (highest priority)
    // e.g., "Find Mattereum contact information" → "Mattereum"
    const beforeContactMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:contact|information|details|email)/i);
    if (beforeContactMatch && !['Find', 'Email', 'Contact', 'Reach', 'Get'].includes(beforeContactMatch[1])) {
      console.log('✅ Recipient found (before contact/information):', beforeContactMatch[1]);
      return beforeContactMatch[1];
    }
    
    // Pattern 1: Domain with TLD (e.g., "rawsummit.io", "mattereum.com")
    const domainMatch1 = text.match(/([a-z0-9-]+\.[a-z]{2,})/i);
    if (domainMatch1) {
      console.log('✅ Recipient found (domain with TLD):', domainMatch1[1]);
      return domainMatch1[1];
    }
    
    // Pattern 2: "contact/email/reach out to NAME" (e.g., "Find a contact at Mattereum")
    const nameMatch = text.match(/(?:contact|email|reach out to|find)\s+(?:a\s+)?(?:contact\s+at\s+)?([A-Z][a-z]+)/i);
    if (nameMatch && !['Find', 'Email', 'Contact', 'Reach', 'Information', 'Details'].includes(nameMatch[1])) {
      console.log('✅ Recipient found (contact at NAME):', nameMatch[1]);
      return nameMatch[1];
    }
    
    // Pattern 3: "Email NAME" at start (e.g., "Email Azqira")
    const emailNameMatch = text.match(/^Email\s+([A-Z][a-z]+)/i);
    if (emailNameMatch) {
      console.log('✅ Recipient found (Email NAME):', emailNameMatch[1]);
      return emailNameMatch[1];
    }
    
    // Pattern 4: Just a capitalized name anywhere (last resort)
    const anyNameMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (anyNameMatch && !['Email', 'Find', 'Contact', 'Reach', 'Information', 'Details', 'Get', 'Set'].includes(anyNameMatch[1])) {
      console.log('✅ Recipient found (any name):', anyNameMatch[1]);
      return anyNameMatch[1];
    }
    
    console.warn('⚠️ No recipient found, using default');
    return 'recipient';
  }

  // SMART EMAIL TASK HANDLER WITH REAL WEB SEARCH
  async function handleSmartEmailTask(task, meeting, recipient) {
    setNovaMood(NOVA_STATES.WORKING);
    
    // Extract company domain if present - try multiple patterns
    let companyDomain = null;
    
    // Pattern 1: domain.com or domain.io (skip if it's a common word)
    const domainMatch1 = task.text.match(/([a-z0-9-]+\.[a-z]{2,})/i);
    if (domainMatch1) {
      const potentialDomain = domainMatch1[1].toLowerCase();
      // Skip common words that might accidentally match
      if (!['find.com', 'email.com', 'contact.com', 'get.com', 'reach.com'].includes(potentialDomain)) {
        companyDomain = potentialDomain;
        console.log('✅ Domain found (pattern 1):', companyDomain);
      }
    }
    
    // Pattern 2: "someone at domain.com" or "contact at domain.com"
    if (!companyDomain) {
      const domainMatch2 = task.text.match(/(?:someone|contact|person|team)\s+at\s+([a-z0-9-]+(?:\.[a-z]{2,})?)/i);
      if (domainMatch2) {
        const extracted = domainMatch2[1];
        // If it doesn't have a TLD, add .com
        companyDomain = extracted.includes('.') ? extracted : `${extracted}.com`;
        console.log('✅ Domain found (pattern 2):', companyDomain);
      }
    }
    
    // Pattern 3: If recipient is already a domain, use it
    if (!companyDomain && recipient && recipient.includes('.')) {
      companyDomain = recipient;
      console.log('✅ Using recipient as domain:', companyDomain);
    }
    
    // Pattern 4: If no domain found, try to add .com to recipient
    if (!companyDomain && recipient && !recipient.includes('.')) {
      // Clean up recipient: remove spaces, convert to lowercase
      const cleanRecipient = recipient.toLowerCase().replace(/\s+/g, '');
      companyDomain = `${cleanRecipient}.com`;
      console.log('✅ Added .com to recipient:', companyDomain);
      console.log('   (cleaned from:', recipient, ')');
    }
    
    const searchTarget = companyDomain || recipient;
    
    console.log('🎯 Final search target:', searchTarget);
    console.log('📝 Task text:', task.text);
    console.log('👤 Recipient param:', recipient);
    
    novaSpeak(`Let me find contact info for ${searchTarget}! 🚀`);
    
    switchTab('chat');
    addChatMessage('nova', `🔍 Analyzing task: "${task.text}"`);
    addChatMessage('nova', `⚡ I'm doing 3 things for you:\n1. Searching for ${searchTarget} contact info\n2. Drafting an email based on your meeting goal\n3. Creating a task with everything`);
    
    // ACTUALLY SEARCH THE WEB using our backend API
    try {
      setNovaMood(NOVA_STATES.THINKING);
      
      // SMART SEARCH QUERY BUILDING:
      // Priority 1: If task text contains full company name, extract it
      // e.g., "Find NEOS Legal UAE contact information" → search for "NEOS Legal UAE"
      let searchQuery;
      
      // Try to extract full company name from task text
      // Pattern: "Find [Company Name] contact information"
      const fullNameMatch = task.text.match(/(?:Find|Email|Contact)\s+(.+?)\s+(?:contact information|and email|to request)/i);
      
      if (fullNameMatch && fullNameMatch[1].length > 3) {
        // Use the full extracted name for search
        const fullCompanyName = fullNameMatch[1].trim();
        searchQuery = `${fullCompanyName} contact email address`;
        console.log('✅ Using full company name for search:', fullCompanyName);
        console.log('   (extracted from task text)');
      } else if (companyDomain) {
        searchQuery = `${companyDomain} contact email address`;
        console.log('✅ Using domain for search:', companyDomain);
      } else {
        searchQuery = `${recipient} contact email address`;
        console.log('✅ Using recipient for search:', recipient);
      }
      
      addChatMessage('nova', `🌐 Searching the web for "${searchTarget}"...`);
      
      let contactInfo;
      let searchSuccess = false;
      
      try {
        const searchRes = await fetch(`${API_BASE}/search/contact?q=${encodeURIComponent(searchQuery)}`);
        
        if (!searchRes.ok) {
          throw new Error(`API returned ${searchRes.status}`);
        }
        
        contactInfo = await searchRes.json();
        searchSuccess = true;
        
        console.log('✅ Search API success');
        console.log('🔍 Search results:', contactInfo);
        console.log('🔍 Query used:', searchQuery);
        console.log('🔍 Company domain:', companyDomain);
        console.log('🔍 Search target:', searchTarget);
      } catch (searchError) {
        console.error('❌ Search API failed:', searchError);
        console.error('   Query was:', searchQuery);
        
        // Fallback to empty results
        contactInfo = {
          suggestedEmails: [],
          contactNames: [],
          scrapedEmails: 0,
          scrapedNames: 0,
          abstract: '',
          searchLinks: {
            google: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
            linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(recipient)}`,
            hunter: companyDomain ? `https://hunter.io/search/${companyDomain}` : `https://hunter.io/search/${encodeURIComponent(recipient)}`
          }
        };
        
        addChatMessage('nova', `⚠️ Search had issues, but I'll create a task with helpful links!`);
      }
      
      // Show search summary if we got one
      if (contactInfo.abstract) {
        addChatMessage('nova', `📖 Found: ${contactInfo.abstract}`);
      }
      
      // Display found contact info with REAL emails WITH SOURCE LINKS
      const cleanRecipient = recipient.toLowerCase().replace(/\s+/g, '');
      
      let emailList = '';
      if (contactInfo.suggestedEmails?.length > 0) {
        // Check if emails have source URLs (new format)
        if (typeof contactInfo.suggestedEmails[0] === 'object') {
          emailList = contactInfo.suggestedEmails.slice(0, 4)
            .map(item => `${item.email}\n  📍 Source: ${item.source}`)
            .join('\n\n• ');
        } else {
          // Old format (just strings)
          emailList = contactInfo.suggestedEmails.slice(0, 4).join('\n• ');
        }
      } else {
        emailList = companyDomain 
          ? `hello@${companyDomain}\n• contact@${companyDomain}\n• info@${companyDomain}`
          : `hello@${cleanRecipient}.com\n• contact@${cleanRecipient}.com`;
      }
      
      const contactNamesList = contactInfo.contactNames?.length > 0
        ? contactInfo.contactNames.slice(0, 3).join(', ')
        : '';
      
      console.log('📧 Suggested emails from API:', contactInfo.suggestedEmails);
      console.log('👤 Contact names from scraping:', contactInfo.contactNames);
      console.log('📧 Email list for display:', emailList);
      
      let contactMessage = `✅ **FOUND CONTACT INFO FOR ${searchTarget.toUpperCase()}:**\n\n`;
      
      if (contactNamesList) {
        contactMessage += `👤 **Contact Names Found:** ${contactNamesList}\n\n`;
      }
      
      contactMessage += `📧 **Email Addresses:**\n• ${emailList}`;
      
      if (contactInfo.scrapedEmails > 0) {
        contactMessage += `\n\n✨ *${contactInfo.scrapedEmails} emails scraped from their website!*`;
      }
      
      if (contactInfo.scrapedNames > 0) {
        contactMessage += `\n🎯 *${contactInfo.scrapedNames} contact names found automatically!*`;
      }
      
      addChatMessage('nova', contactMessage);
      
      
      // Draft email based on ACTUAL meeting goal/context
      // Extract goal - support multiple formats
      let meetingGoal = '';
      let fullMeetingSummary = meeting.summary || '';
      
      // PRIORITY 1: Try to extract from meeting summary "Goal:" section
      if (meeting.summary) {
        const goalMatch = meeting.summary.match(/Goal:\s*(.+?)(?:\n\n|\n[A-Z]|$)/is);
        if (goalMatch) {
          meetingGoal = goalMatch[1].trim();
          console.log('📝 Extracted goal from summary:', meetingGoal);
        }
      }
      
      // PRIORITY 2: If no goal found, look in meeting title
      if (!meetingGoal && meeting.title) {
        // Skip generic titles like "Catchup meeting", "Daily standup", etc.
        const genericTitles = ['catchup', 'standup', 'daily', 'weekly', 'check-in', 'sync'];
        const isGeneric = genericTitles.some(term => meeting.title.toLowerCase().includes(term));
        
        if (!isGeneric) {
          meetingGoal = meeting.title;
          console.log('📝 Using meeting title as goal:', meetingGoal);
        }
      }
      
      // PRIORITY 3: If still no goal, use task.text but CLEAN IT UP
      if (!meetingGoal) {
        // Remove action words like "Find", "Email", "Contact"
        meetingGoal = task.text
          .replace(/^(Find|Email|Contact|Reach out to|Get|Set up)\s+/i, '')
          .replace(/\s+contact information$/i, '')
          .replace(/\s+and email them$/i, '');
        console.log('📝 Cleaned up task text as goal:', meetingGoal);
      }
      
      // Also get the full transcript context for better understanding
      const fullTranscript = meeting.transcript_text || '';
      const meetingTopic = meeting.title || 'recent discussion';
      
      // INTELLIGENT EMAIL COMPOSITION WITH FULL CONTEXT EXTRACTION
      // Extract WHO WE ARE, WHAT WE WANT, and WHY from meeting
      let whoWeAre = '';
      let whatWeWant = '';
      let whyThem = '';
      let targetAction = '';
      
      console.log('📝 Full meeting summary:', fullMeetingSummary);
      console.log('📝 Full transcript:', fullTranscript.substring(0, 500));
      
      // Extract WHO WE ARE from summary/transcript
      const whoPatterns = [
        /(?:we are|we're|our|i'm|i am)\s+(?:a|an)?\s*([^.]{10,80}(?:group|company|organization|team|hotel|business))/i,
        /(?:our|my)\s+([^.]{10,80}(?:operates|has|provides|offers))/i
      ];
      
      for (const pattern of whoPatterns) {
        const match = (fullMeetingSummary + ' ' + fullTranscript).match(pattern);
        if (match) {
          whoWeAre = match[1].trim();
          console.log('🏢 WHO WE ARE:', whoWeAre);
          break;
        }
      }
      
      // Extract WHAT WE WANT from meeting goal, summary, and transcript
      const whatPatterns = [
        /(?:want to|looking to|interested in|need to|goal is to|aim to|plan to)\s+(.+?)(?:\.|$)/i,
        /(?:explore|discuss)\s+(?:how|ways|opportunities|the possibility of)\s+(.+?)(?:\.|$)/i,
        /(?:to|regarding|about)\s+(tokenize|tokenizing|blockchain|partner|collaborate|work together|integrate)(?:ing)?\s+(.+?)(?:\.|$)/i,
        /(?:set a meeting|discuss)\s+(?:a |potential |possible )?(.+?)(?:\.|$)/i
      ];
      
      for (const pattern of whatPatterns) {
        const searchText = meetingGoal + ' ' + fullMeetingSummary + ' ' + fullTranscript.substring(0, 500);
        const match = searchText.match(pattern);
        if (match) {
          // Get the captured group (might be [1] or [2] depending on pattern)
          whatWeWant = (match[2] || match[1]).trim();
          
          // Clean up common prefixes
          whatWeWant = whatWeWant
            .replace(/^(a |the |potential |possible )/i, '')
            .replace(/\s+with\s+them$/i, '')
            .replace(/\s+regarding$/i, '');
          
          console.log('🎯 WHAT WE WANT:', whatWeWant);
          
          // If we found something meaningful (not just a name), break
          if (whatWeWant.length > 5 && !whatWeWant.toLowerCase().includes('mattereum')) {
            break;
          }
        }
      }
      
      // Extract WHY THEM (their expertise/capability) from transcript
      const whyPatterns = [
        new RegExp(`${searchTarget}\\s+(?:can|could|should|would|specializes?|expertise?|provides?)\\s+(.+?)(?:\\.|$)`, 'i'),
        /(?:they|their)\s+(?:specialize|expertise|experience|focus)\s+(?:in|on)\s+(.+?)(?:\.|$)/i
      ];
      
      for (const pattern of whyPatterns) {
        const match = (fullTranscript + ' ' + fullMeetingSummary).match(pattern);
        if (match) {
          whyThem = match[1].trim();
          console.log('💡 WHY THEM:', whyThem);
          break;
        }
      }
      
      // Determine email type from context
      const isPartnershipRequest = 
        (whatWeWant + meetingGoal).toLowerCase().includes('partner') ||
        (whatWeWant + meetingGoal).toLowerCase().includes('collaborate') ||
        (whatWeWant + meetingGoal).toLowerCase().includes('work together') ||
        (whatWeWant + meetingGoal).toLowerCase().includes('tokenize') ||
        (whatWeWant + meetingGoal).toLowerCase().includes('blockchain');
      
      // Compose subject line based on context
      let emailSubject = '';
      let emailIntent = '';
      
      if (isPartnershipRequest) {
        emailSubject = `Partnership Opportunity - ${searchTarget}`;
        emailIntent = 'partnership';
      } else {
        emailSubject = `Business Inquiry - ${searchTarget}`;
        emailIntent = 'general';
      }
      
      // Compose email body with FULL CONTEXT
      let emailDraft = '';
      
      // Use contact name if found
      const greeting = contactInfo.contactNames && contactInfo.contactNames.length > 0
        ? `Hi ${contactInfo.contactNames[0].split(' ')[0]},`
        : `Hi there,`;
      
      emailDraft = `Subject: ${emailSubject}\n\n`;
      emailDraft += `${greeting}\n\n`;
      emailDraft += `I hope this email finds you well. `;
      
      // Add WHO WE ARE
      if (whoWeAre) {
        emailDraft += `We are ${whoWeAre}. `;
      }
      
      // Add WHAT WE WANT
      if (whatWeWant) {
        emailDraft += `We're reaching out because we ${whatWeWant}.\n\n`;
      } else {
        emailDraft += `I'm reaching out regarding a potential partnership opportunity.\n\n`;
      }
      
      // Add WHY THEM (their expertise)
      if (whyThem) {
        emailDraft += `We believe ${searchTarget}'s expertise in ${whyThem} would be valuable for this initiative. `;
      }
      
      // Add call to action
      emailDraft += `Would you be available for a brief call to discuss how we might work together on this?\n\n`;
      emailDraft += `Looking forward to hearing from you.\n\n`;
      emailDraft += `Best regards`;
      
      console.log('📧 Email intent:', emailIntent);
      console.log('📧 Email subject:', emailSubject);
      console.log('📧 WHO WE ARE in email:', whoWeAre ? 'YES' : 'NO');
      console.log('📧 WHAT WE WANT in email:', whatWeWant ? 'YES' : 'NO');
      console.log('📧 WHY THEM in email:', whyThem ? 'YES' : 'NO');
      console.log('📧 Draft length:', emailDraft.length);
      
      // CRITICAL: If extraction failed, use SMART FALLBACK based on company/context
      if (!whoWeAre || !whatWeWant) {
        console.warn('⚠️ Context extraction FAILED - using smart fallback');
        
        // Intelligent inference based on company name and meeting context
        const companyLower = searchTarget.toLowerCase();
        
        // Smart defaults based on company expertise
        if (companyLower.includes('mattereum') || companyLower.includes('blockchain') || companyLower.includes('token')) {
          whoWeAre = whoWeAre || '7-hotel property group';
          whatWeWant = whatWeWant || 'tokenize hotel room nights and explore blockchain-based asset management';
          whyThem = whyThem || "blockchain technology and digital asset expertise";
        } else if (companyLower.includes('summit') || companyLower.includes('event') || companyLower.includes('conference')) {
          whoWeAre = whoWeAre || 'hospitality innovation group';
          whatWeWant = whatWeWant || 'explore speaking opportunities and showcase our blockchain hospitality solutions';
          whyThem = whyThem || "platform's reach in the innovation community";
        } else {
          // Generic business partnership fallback
          whoWeAre = whoWeAre || 'hospitality technology group';
          whatWeWant = whatWeWant || 'explore potential partnership opportunities';
          whyThem = whyThem || "expertise and market position";
        }
        
        console.log('🔄 FALLBACK WHO WE ARE:', whoWeAre);
        console.log('🔄 FALLBACK WHAT WE WANT:', whatWeWant);
        console.log('🔄 FALLBACK WHY THEM:', whyThem);
        
        // Regenerate email with fallback context
        emailDraft = `Subject: ${emailSubject}\n\n`;
        emailDraft += `${greeting}\n\n`;
        emailDraft += `I hope this email finds you well. We are a ${whoWeAre}. `;
        emailDraft += `We're reaching out because we'd like to ${whatWeWant}.\n\n`;
        emailDraft += `We believe ${searchTarget}'s ${whyThem} would be valuable for this initiative. `;
        emailDraft += `Would you be available for a brief call to discuss how we might work together on this?\n\n`;
        emailDraft += `Looking forward to hearing from you.\n\n`;
        emailDraft += `Best regards`;
        
        console.log('✅ Regenerated email with fallback context');
      }
      
      addChatMessage('nova', `📝 **EMAIL DRAFT FOR YOU:**\n\n\`\`\`\n${emailDraft}\n\`\`\``);
      
      // Create the task with all the info      const enriched = await enrichActionItem(task, meeting);
      
      // Extract email addresses (handle both old and new format)
      let emailsToTry = [];
      if (contactInfo.suggestedEmails?.length > 0) {
        console.log('📧 RAW suggestedEmails:', contactInfo.suggestedEmails);
        console.log('📧 First email type:', typeof contactInfo.suggestedEmails[0]);
        console.log('📧 First email value:', contactInfo.suggestedEmails[0]);
        
        if (typeof contactInfo.suggestedEmails[0] === 'object' && contactInfo.suggestedEmails[0].email) {
          // New format with sources
          emailsToTry = contactInfo.suggestedEmails.slice(0, 5);
          console.log('✅ Using NEW format (with sources):', emailsToTry);
        } else {
          // Old format (just strings)
          emailsToTry = contactInfo.suggestedEmails.slice(0, 5).map(email => ({
            email,
            source: 'Unknown'
          }));
          console.log('⚠️ Using OLD format (strings only):', emailsToTry);
        }
      } else {
        console.log('❌ No suggestedEmails found, using fallback');
        // Fallback patterns
        const fallbackEmails = companyDomain 
          ? [`hello@${companyDomain}`, `contact@${companyDomain}`, `info@${companyDomain}`]
          : [`hello@${recipient.toLowerCase()}.com`];
        emailsToTry = fallbackEmails.map(email => ({
          email,
          source: 'Generated pattern (not verified)'
        }));
        console.log('🔄 Generated fallback emails:', emailsToTry);
      }
      
      console.log('📧 FINAL emailsToTry:', emailsToTry);
      console.log('📧 emailsToTry length:', emailsToTry.length);
      
      const taskDescription = `${enriched.description}

📧 FOUND EMAIL ADDRESSES WITH SOURCES:
${emailsToTry.map(item => `• ${item.email}\n  📍 ${item.source}`).join('\n\n')}

📝 EMAIL DRAFT (ready to copy):
${emailDraft}

🔍 VERIFY CONTACT INFO AT:
• Google: ${contactInfo.searchLinks.google}
• LinkedIn: ${contactInfo.searchLinks.linkedin}
• Hunter.io: ${contactInfo.searchLinks.hunter}
• RocketReach: ${contactInfo.searchLinks.rocketreach}
${contactInfo.abstractURL ? `\n🌐 Source: ${contactInfo.abstractURL}` : ''}

Meeting context:
${meeting.summary?.substring(0, 500)}`;

      console.log('📝 FINAL TASK DESCRIPTION:');
      console.log(taskDescription);
      
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
                    'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: companyDomain ? `Email ${companyDomain}` : `Email ${recipient}`,
          description: taskDescription,
          priority: 'high',
          source_id: meeting.id
        })
      });
      
      if (res.ok) {
        setNovaMood(NOVA_STATES.CELEBRATING);
        
        const firstEmail = emailsToTry[0];
        const firstEmailText = typeof firstEmail === 'object' ? firstEmail.email : firstEmail;
        const firstEmailSource = typeof firstEmail === 'object' ? firstEmail.source : 'Unknown';
        
        addChatMessage('nova', `✅ **DONE!** Task created with:\n• ${emailsToTry.length} potential email addresses WITH SOURCE URLS\n• Email draft based on your meeting goal\n• Verification links\n• Full context\n\n🎯 **TRY FIRST:** ${firstEmailText}\n📍 **Found at:** ${firstEmailSource}`);
        
        await loadTasks(token);
        novaSpeak(`Found ${emailsToTry.length} email addresses for ${recipient}! Check the Tasks view! 🎉`);
      }
    } catch (error) {
      console.error('Error creating smart task:', error);
      setNovaMood(NOVA_STATES.CONCERNED);
      addChatMessage('nova', '❌ Had trouble with the search, but creating a task with helpful search links...');
      
      // Fallback: create task anyway with search links
      try {        const fallbackDesc = `Email ${recipient}\n\nSearch for contact info:\n• https://www.google.com/search?q=${encodeURIComponent(recipient + ' contact email')}\n• https://hunter.io/search/${encodeURIComponent(recipient)}\n• https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(recipient)}`;
        
        await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: {
                        'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: `Email ${recipient}`,
            description: fallbackDesc,
            priority: 'high'
          })
        });
        
        addChatMessage('nova', '✅ Created task with search links');
      } catch (fallbackError) {
        console.error('Fallback task creation failed:', fallbackError);
      }
    }
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

    grid.innerHTML = insights.map((insight, index) => `
      <div class="insight-card priority-${insight.priority}" data-type="${insight.type}" data-index="${index}">
        <button class="insight-dismiss-btn" data-index="${index}" title="Dismiss">✕</button>
        <div class="card-glow"></div>
        <div class="insight-icon">${insight.icon}</div>
        <h4 class="insight-title">${insight.title}</h4>
        <p class="insight-subtitle">${insight.subtitle}</p>
        <button class="insight-action-btn">Take Action →</button>
      </div>
    `).join('');

    // Add dismiss handlers
    grid.querySelectorAll('.insight-dismiss-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger card click
        const index = parseInt(btn.dataset.index);
        dismissInsight(index);
      });
    });

    // Add click handlers
    grid.querySelectorAll('.insight-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        if (insights[index].action) {
          insights[index].action();
        }
      });
    });
  }

  // Dismiss an insight and persist to localStorage
  function dismissInsight(index) {
    if (novaState.currentInsights && novaState.currentInsights[index]) {
      const dismissedInsight = novaState.currentInsights[index];
      
      // Create a unique ID for this insight
      const insightId = `${dismissedInsight.type}_${JSON.stringify(dismissedInsight.data || {})}`;
      
      // Get existing dismissed insights from localStorage
      const dismissed = JSON.parse(localStorage.getItem('nova_dismissed_insights') || '{}');
      
      // Add this insight with timestamp
      dismissed[insightId] = Date.now();
      
      // Clean up old dismissed insights (older than 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      Object.keys(dismissed).forEach(key => {
        if (dismissed[key] < sevenDaysAgo) {
          delete dismissed[key];
        }
      });
      
      // Save to localStorage
      localStorage.setItem('nova_dismissed_insights', JSON.stringify(dismissed));
      
      // Remove from current insights
      novaState.currentInsights.splice(index, 1);
      displayInsights(novaState.currentInsights);
      novaSpeak('Insight dismissed! ✓');
    }
  }
  
  // Check if an insight was previously dismissed
  function isInsightDismissed(insight) {
    const insightId = `${insight.type}_${JSON.stringify(insight.data || {})}`;
    const dismissed = JSON.parse(localStorage.getItem('nova_dismissed_insights') || '{}');
    return dismissed[insightId] !== undefined;
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
    document.getElementById('create-all-tasks').addEventListener('click', async () => {
      setNovaMood(NOVA_STATES.WORKING);
      novaSpeak("Creating tasks with AI assistance... ⚡");
      
      try {        let created = 0;
        
        for (const item of items) {
          const text = item.text.toLowerCase();
          const isEmailTask = text.includes('email') || text.includes('contact') || text.includes('reach out');
          
          if (isEmailTask) {
            // For EMAIL tasks, use handleSmartEmailTask which does web search
            const recipient = extractRecipientFromText(item.text);
            
            novaSpeak(`🔍 Searching web for ${recipient} contact info...`);
            
            // Call the smart handler (it creates the task with search results)
            await handleSmartEmailTask(item, meeting, recipient);
            created++;
          } else {
            // For regular tasks, use enrichment
            const enrichedItem = await enrichActionItem(item, meeting);
            
            const res = await fetch(`${API_BASE}/tasks`, {
              method: 'POST',
              headers: {
                                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: enrichedItem.title || item.text.substring(0, 200),
                description: enrichedItem.description || `From meeting: ${meeting.title}`,
                priority: enrichedItem.priority || 'medium',
                category: 'meeting-action',
                source_id: meeting.id
              })
            });
            
            if (res.ok) {
              created++;
            }
          }
        }
        
        // Reload tasks
        await loadTasks(token);
        
        setNovaMood(NOVA_STATES.CELEBRATING);
        novaSpeak(`Done! Created ${created} tasks with full context! 🎉`);
        
        // Switch to a success view
        switchTab('chat');
        addChatMessage('nova', `✅ Successfully created ${created} tasks from "${meeting.title}"!\n\n💡 Email tasks include:\n• Real contact info from web search\n• Context-aware draft emails\n• Verification links\n\nCheck your Tasks view!`);
      } catch (error) {
        console.error('Error creating tasks:', error);
        setNovaMood(NOVA_STATES.CONCERNED);
        novaSpeak('Oops, had trouble creating tasks...');
      }
    });

    list.querySelectorAll('.action-btn-create').forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = btn.dataset.index;
        const item = items[index];
        novaSpeak(`Creating task: "${item.text.substring(0, 40)}..."`);
        setNovaMood(NOVA_STATES.WORKING);
        
        try {          const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
                            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: item.text.substring(0, 200),
              description: `From meeting: ${meeting.title}`,
              priority: 'medium',
              category: 'meeting-action',
              meetingId: meeting.id
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            setNovaMood(NOVA_STATES.CELEBRATING);
            novaSpeak('Task created! ✨');
            
            // Mark as created visually
            btn.textContent = '✓';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            
            // Reload tasks
            await loadTasks(token);
          } else {
            throw new Error('Failed to create task');
          }
        } catch (error) {
          console.error('Error creating task:', error);
          setNovaMood(NOVA_STATES.CONCERNED);
          novaSpeak('Had trouble creating that task...');
        }
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
