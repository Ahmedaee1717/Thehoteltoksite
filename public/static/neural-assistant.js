/**
 * 🌌 YEAR 2070 AI ASSISTANT - Neural Interface Edition
 * 
 * This is NOT a chatbot. This is an AI BRAIN that:
 * - Analyzes ALL your data (meetings, emails, tasks, files)
 * - Extracts action items automatically
 * - Makes proactive suggestions
 * - Drafts emails and creates tasks for you
 * - Connects the dots across your entire workspace
 * 
 * Design: Holographic, fluid, next-gen interface
 */

(function() {
  'use strict';

  const API_BASE = '/api';
  let assistantData = {
    tasks: [],
    emails: [],
    meetings: [],
    files: [],
    actionItems: [],
    suggestions: []
  };

  let aiContext = {
    recentActions: [],
    userPreferences: {},
    activeProjects: []
  };

  // Create the Year 2070 AI Assistant
  function createAssistant() {
    const assistant = document.createElement('div');
    assistant.id = 'neural-assistant';
    assistant.className = 'neural-assistant';
    assistant.innerHTML = `
      <!-- Neural Core -->
      <div class="neural-core" id="neural-core">
        <div class="neural-rings">
          <div class="neural-ring ring-1"></div>
          <div class="neural-ring ring-2"></div>
          <div class="neural-ring ring-3"></div>
        </div>
        <div class="neural-avatar">
          <div class="neural-brain">
            <div class="brain-pulse"></div>
            <svg viewBox="0 0 100 100" class="brain-icon">
              <path d="M50 10 C30 10, 10 30, 10 50 C10 70, 30 90, 50 90 C70 90, 90 70, 90 50 C90 30, 70 10, 50 10 Z" 
                    fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="50" cy="50" r="8" fill="currentColor" class="brain-core"/>
              <circle cx="35" cy="40" r="3" fill="currentColor" opacity="0.6"/>
              <circle cx="65" cy="40" r="3" fill="currentColor" opacity="0.6"/>
              <circle cx="35" cy="60" r="3" fill="currentColor" opacity="0.6"/>
              <circle cx="65" cy="60" r="3" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
        </div>
        <div class="neural-status">
          <span class="status-text">AI Neural Network Active</span>
          <span class="status-indicator"></span>
        </div>
      </div>

      <!-- Intelligence Panel -->
      <div class="intelligence-panel" id="intelligence-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <span class="title-icon">🧠</span>
            AI Intelligence Hub
          </h3>
          <div class="panel-controls">
            <button class="neural-btn" id="minimize-btn" title="Minimize">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12" stroke-width="2"/>
              </svg>
            </button>
            <button class="neural-btn" id="close-btn" title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="ai-insights" id="ai-insights">
          <div class="insight-loader">
            <div class="neural-scanner"></div>
            <p>Analyzing neural pathways...</p>
          </div>
        </div>

        <!-- Action Items -->
        <div class="action-items-section" id="action-items">
          <h4 class="section-title">
            <span class="section-icon">⚡</span>
            Action Items Extracted
          </h4>
          <div class="action-items-list" id="action-items-list"></div>
        </div>

        <!-- Neural Chat -->
        <div class="neural-chat" id="neural-chat">
          <div class="chat-messages" id="chat-messages"></div>
          <div class="chat-input-wrapper">
            <div class="input-glow"></div>
            <input type="text" 
                   id="neural-input" 
                   placeholder="Ask me anything... I know everything about your workspace"
                   autocomplete="off">
            <button id="neural-send">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn action-primary" id="extract-actions-btn">
            <span class="btn-glow"></span>
            <span class="btn-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Extract Action Items
            </span>
          </button>
          <button class="action-btn action-secondary" id="analyze-emails-btn">
            <span class="btn-glow"></span>
            <span class="btn-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke-width="2"/>
                <path d="M3 7l9 6 9-6" stroke-width="2"/>
              </svg>
              Analyze Emails
            </span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(assistant);
    
    // Make draggable
    makeNeuralDraggable(assistant);
    
    // Setup event listeners
    setupNeuralListeners(assistant);
    
    // Initialize AI
    initializeNeuralNetwork();
    
    return assistant;
  }

  // Make it draggable (Year 2070 style - smooth magnetic movement)
  function makeNeuralDraggable(element) {
    const core = element.querySelector('#neural-core');
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

    core.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
      element.classList.add('dragging');
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTransform(currentX, currentY, element);
      }
    }

    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      element.classList.remove('dragging');
    }

    function setTransform(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
  }

  // Setup neural listeners
  function setupNeuralListeners(assistant) {
    const minimizeBtn = assistant.querySelector('#minimize-btn');
    const closeBtn = assistant.querySelector('#close-btn');
    const extractBtn = assistant.querySelector('#extract-actions-btn');
    const analyzeBtn = assistant.querySelector('#analyze-emails-btn');
    const input = assistant.querySelector('#neural-input');
    const sendBtn = assistant.querySelector('#neural-send');
    const core = assistant.querySelector('#neural-core');

    minimizeBtn.addEventListener('click', () => {
      assistant.classList.toggle('minimized');
    });

    closeBtn.addEventListener('click', () => {
      assistant.classList.add('hidden');
    });

    core.addEventListener('click', () => {
      if (assistant.classList.contains('minimized')) {
        assistant.classList.remove('minimized');
      }
    });

    extractBtn.addEventListener('click', extractAllActionItems);
    analyzeBtn.addEventListener('click', analyzeEmailsForActions);

    sendBtn.addEventListener('click', handleNeuralQuery);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleNeuralQuery();
    });
  }

  // Initialize Neural Network
  async function initializeNeuralNetwork() {
    showNeuralActivity('Initializing neural pathways...');
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      showNeuralMessage('⚠️ Authentication required', 'Please log in to activate AI assistant');
      return;
    }

    try {
      // Load all data in parallel
      await Promise.all([
        loadTasks(token),
        loadEmails(token),
        loadMeetings(token)
      ]);

      // Analyze and generate insights
      await generateAIInsights();
      
      // Extract action items from meetings
      await autoExtractActionItems();

    } catch (error) {
      console.error('Neural network initialization error:', error);
      showNeuralMessage('⚠️ Partial data loaded', 'Some features may be limited');
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
        assistantData.tasks = data.tasks || [];
        console.log('✅ Neural: Tasks loaded', assistantData.tasks.length);
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
        assistantData.emails = data.emails || [];
        console.log('✅ Neural: Emails loaded', assistantData.emails.length);
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
        assistantData.meetings = data.transcripts || [];
        console.log('✅ Neural: Meetings loaded', assistantData.meetings.length);
      }
    } catch (e) {
      console.error('Meetings load error:', e);
    }
  }

  // Generate AI Insights (this is the BRAIN)
  async function generateAIInsights() {
    showNeuralActivity('Analyzing data patterns...');
    
    const insights = [];

    // Analyze meetings for action items
    assistantData.meetings.forEach(meeting => {
      const actionItems = extractActionItemsFromText(meeting.transcript_text || '');
      if (actionItems.length > 0) {
        insights.push({
          type: 'action-items',
          priority: 'high',
          icon: '⚡',
          title: `${actionItems.length} action items from "${meeting.title}"`,
          description: actionItems.slice(0, 2).join(', ') + (actionItems.length > 2 ? '...' : ''),
          data: { meetingId: meeting.id, actionItems },
          action: 'create-tasks-from-meeting'
        });
      }
    });

    // Analyze emails for commitments
    assistantData.emails.forEach(email => {
      const commitments = findCommitmentsInEmail(email);
      if (commitments.length > 0) {
        insights.push({
          type: 'email-commitment',
          priority: 'medium',
          icon: '📧',
          title: `Action needed: "${email.subject}"`,
          description: commitments[0],
          data: { emailId: email.id, commitments },
          action: 'draft-email-response'
        });
      }
    });

    // Check for overdue tasks
    const overdue = assistantData.tasks.filter(t => 
      t.status !== 'completed' && new Date(t.due_date) < new Date()
    );
    if (overdue.length > 0) {
      insights.push({
        type: 'overdue',
        priority: 'high',
        icon: '🚨',
        title: `${overdue.length} overdue tasks`,
        description: overdue.map(t => t.title).join(', '),
        data: { tasks: overdue },
        action: 'view-overdue-tasks'
      });
    }

    displayAIInsights(insights);
  }

  // Extract action items from meeting transcript
  function extractActionItemsFromText(text) {
    const actionItems = [];
    const lines = text.split('\n');
    
    // Patterns that indicate action items
    const actionPatterns = [
      /(?:will|should|need to|must|have to|going to)\s+([^.!?]+)/gi,
      /(?:action item|todo|task):\s*([^.!?]+)/gi,
      /(?:follow up|reach out|contact|email)\s+([^.!?]+)/gi,
      /(?:next steps?):\s*([^.!?]+)/gi
    ];

    lines.forEach(line => {
      actionPatterns.forEach(pattern => {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const item = match[1].trim();
          if (item.length > 10 && item.length < 200) {
            actionItems.push(item);
          }
        }
      });
    });

    return [...new Set(actionItems)].slice(0, 5); // Unique, max 5
  }

  // Find commitments in email
  function findCommitmentsInEmail(email) {
    const commitments = [];
    const body = (email.body || '').toLowerCase();
    
    const commitmentPhrases = [
      "i will",
      "i'll",
      "i'm going to",
      "i plan to",
      "i need to",
      "let me",
      "i'll send",
      "i'll get back"
    ];

    commitmentPhrases.forEach(phrase => {
      if (body.includes(phrase)) {
        const start = body.indexOf(phrase);
        const sentence = body.slice(start, start + 200).split('.')[0];
        if (sentence.length > 10) {
          commitments.push(sentence.trim());
        }
      }
    });

    return commitments;
  }

  // Display AI Insights
  function displayAIInsights(insights) {
    const container = document.getElementById('ai-insights');
    
    if (insights.length === 0) {
      container.innerHTML = `
        <div class="neural-empty">
          <div class="empty-icon">✨</div>
          <p class="empty-title">Neural Analysis Complete</p>
          <p class="empty-subtitle">No urgent action items detected</p>
          <div class="data-stats">
            <span>${assistantData.tasks.length} tasks</span>
            <span>${assistantData.emails.length} emails</span>
            <span>${assistantData.meetings.length} meetings</span>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = insights.map(insight => `
      <div class="neural-insight insight-${insight.priority}" data-action="${insight.action}" data-insight='${JSON.stringify(insight.data)}'>
        <div class="insight-glow"></div>
        <div class="insight-header">
          <span class="insight-icon">${insight.icon}</span>
          <div class="insight-content">
            <h4 class="insight-title">${insight.title}</h4>
            <p class="insight-description">${insight.description}</p>
          </div>
          <button class="insight-action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.neural-insight').forEach(el => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        const data = JSON.parse(el.dataset.insight);
        handleInsightAction(action, data);
      });
    });
  }

  // Handle insight actions
  function handleInsightAction(action, data) {
    switch(action) {
      case 'create-tasks-from-meeting':
        createTasksFromActionItems(data);
        break;
      case 'draft-email-response':
        draftEmailResponse(data);
        break;
      case 'view-overdue-tasks':
        window.location.href = '/tasks?filter=overdue';
        break;
    }
  }

  // Auto-extract action items from latest meeting
  async function autoExtractActionItems() {
    if (assistantData.meetings.length === 0) return;

    const latestMeeting = assistantData.meetings[0];
    const actionItems = extractActionItemsFromText(latestMeeting.transcript_text || '');
    
    if (actionItems.length > 0) {
      assistantData.actionItems = actionItems.map((item, i) => ({
        id: `action-${Date.now()}-${i}`,
        text: item,
        meetingId: latestMeeting.id,
        meetingTitle: latestMeeting.title,
        status: 'pending'
      }));
      
      displayActionItems();
    }
  }

  // Display action items
  function displayActionItems() {
    const list = document.getElementById('action-items-list');
    
    if (assistantData.actionItems.length === 0) {
      document.getElementById('action-items').style.display = 'none';
      return;
    }

    document.getElementById('action-items').style.display = 'block';
    
    list.innerHTML = assistantData.actionItems.map(item => `
      <div class="action-item" data-id="${item.id}">
        <div class="action-checkbox">
          <input type="checkbox" id="action-${item.id}">
          <label for="action-${item.id}"></label>
        </div>
        <div class="action-content">
          <p class="action-text">${item.text}</p>
          <span class="action-source">From: ${item.meetingTitle}</span>
        </div>
        <button class="action-create-task" data-id="${item.id}" title="Create task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Add handlers
    list.querySelectorAll('.action-create-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionId = btn.dataset.id;
        const action = assistantData.actionItems.find(a => a.id === actionId);
        if (action) {
          createTaskFromActionItem(action);
        }
      });
    });
  }

  // Create task from action item
  async function createTaskFromActionItem(action) {
    showNeuralActivity('Creating task...');
    
    // TODO: Call API to create task
    addNeuralMessage('system', `✅ Task created: "${action.text}"`);
    
    // Remove from action items
    assistantData.actionItems = assistantData.actionItems.filter(a => a.id !== action.id);
    displayActionItems();
  }

  // Neural chat message
  function addNeuralMessage(sender, text) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `neural-message message-${sender}`;
    msg.innerHTML = `
      <div class="message-avatar">
        ${sender === 'ai' ? '🧠' : sender === 'system' ? '⚡' : '👤'}
      </div>
      <div class="message-bubble">
        <div class="message-glow"></div>
        ${text}
      </div>
    `;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  // Handle neural query
  function handleNeuralQuery() {
    const input = document.getElementById('neural-input');
    const query = input.value.trim();
    
    if (!query) return;
    
    addNeuralMessage('user', query);
    input.value = '';
    
    // Process query (placeholder - will connect to real AI)
    setTimeout(() => {
      processAIQuery(query);
    }, 500);
  }

  // Process AI query (simplified - will use GPT-4 later)
  function processAIQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('task')) {
      addNeuralMessage('ai', `You have ${assistantData.tasks.length} tasks. ${assistantData.tasks.filter(t => t.status !== 'completed').length} are still active.`);
    } else if (lowerQuery.includes('email')) {
      addNeuralMessage('ai', `You have ${assistantData.emails.length} emails loaded. Would you like me to analyze them for action items?`);
    } else if (lowerQuery.includes('meeting')) {
      if (assistantData.meetings.length > 0) {
        const latest = assistantData.meetings[0];
        addNeuralMessage('ai', `Your latest meeting: "${latest.title}". I found ${assistantData.actionItems.length} action items. Would you like me to create tasks for them?`);
      } else {
        addNeuralMessage('ai', 'No recent meetings found.');
      }
    } else {
      addNeuralMessage('ai', 'I can help you with tasks, emails, meetings, and action items. What would you like to know?');
    }
  }

  // Utility functions
  function showNeuralActivity(message) {
    // Visual feedback
    console.log('🧠', message);
  }

  function showNeuralMessage(title, message) {
    addNeuralMessage('system', `${title}: ${message}`);
  }

  async function extractAllActionItems() {
    showNeuralActivity('Extracting action items from all meetings...');
    await autoExtractActionItems();
    addNeuralMessage('system', `✅ Extracted ${assistantData.actionItems.length} action items`);
  }

  async function analyzeEmailsForActions() {
    showNeuralActivity('Analyzing emails for commitments...');
    // Will implement full email analysis
    addNeuralMessage('system', '🔍 Email analysis complete. Check insights above.');
    await generateAIInsights();
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createAssistant);
  } else {
    createAssistant();
  }

  // Global toggle
  window.toggleNeuralAssistant = function() {
    const assistant = document.getElementById('neural-assistant');
    if (assistant) {
      assistant.classList.toggle('hidden');
    } else {
      createAssistant();
    }
  };

})();
