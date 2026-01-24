/**
 * 🤖 AI ASSISTANT - Clippy-style draggable helper
 * 
 * Features:
 * - Draggable anywhere on screen
 * - Access to: Tasks, Emails, Meetings, Files
 * - AI-powered suggestions
 * - Creates tasks, drafts emails, finds info
 * - Minimizable and expandable
 */

(function() {
  'use strict';

  const API_BASE = '/api';
  let assistantData = {
    tasks: [],
    emails: [],
    meetings: [],
    recentFiles: [],
    contacts: []
  };

  // Create assistant UI
  function createAssistant() {
    const assistant = document.createElement('div');
    assistant.id = 'ai-assistant';
    assistant.className = 'ai-assistant minimized';
    assistant.innerHTML = `
      <div class="ai-assistant-header" id="ai-drag-handle">
        <div class="ai-avatar">🤖</div>
        <div class="ai-title">
          <span class="ai-name">Investay Assistant</span>
          <span class="ai-status">Ready to help!</span>
        </div>
        <div class="ai-controls">
          <button class="ai-control-btn" id="ai-minimize">−</button>
          <button class="ai-control-btn" id="ai-close">×</button>
        </div>
      </div>
      
      <div class="ai-assistant-body">
        <div class="ai-suggestions" id="ai-suggestions">
          <div class="ai-loading">
            <div class="ai-loading-spinner"></div>
            <p>Analyzing your workspace...</p>
          </div>
        </div>
        
        <div class="ai-chat" id="ai-chat">
          <div class="ai-messages" id="ai-messages"></div>
          <div class="ai-input-wrapper">
            <input type="text" 
                   id="ai-input" 
                   placeholder="Ask me anything... (tasks, emails, meetings)"
                   autocomplete="off">
            <button id="ai-send-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div class="ai-assistant-footer">
        <button class="ai-action-btn" id="ai-refresh">
          <span>🔄</span> Refresh
        </button>
        <button class="ai-action-btn" id="ai-create-task">
          <span>✅</span> New Task
        </button>
        <button class="ai-action-btn" id="ai-draft-email">
          <span>✉️</span> Draft Email
        </button>
      </div>
    `;
    
    document.body.appendChild(assistant);
    
    // Make draggable
    makeDraggable(assistant);
    
    // Setup event listeners
    setupEventListeners(assistant);
    
    // Load initial data
    loadAssistantData();
    
    return assistant;
  }

  // Make assistant draggable
  function makeDraggable(element) {
    const handle = element.querySelector('#ai-drag-handle');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    handle.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      if (e.target === handle || handle.contains(e.target)) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
        element.style.cursor = 'grabbing';
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, element);
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      element.style.cursor = 'grab';
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
  }

  // Setup event listeners
  function setupEventListeners(assistant) {
    const minimizeBtn = assistant.querySelector('#ai-minimize');
    const closeBtn = assistant.querySelector('#ai-close');
    const refreshBtn = assistant.querySelector('#ai-refresh');
    const createTaskBtn = assistant.querySelector('#ai-create-task');
    const draftEmailBtn = assistant.querySelector('#ai-draft-email');
    const input = assistant.querySelector('#ai-input');
    const sendBtn = assistant.querySelector('#ai-send-btn');

    minimizeBtn.addEventListener('click', () => {
      assistant.classList.toggle('minimized');
      minimizeBtn.textContent = assistant.classList.contains('minimized') ? '+' : '−';
    });

    closeBtn.addEventListener('click', () => {
      assistant.style.display = 'none';
    });

    refreshBtn.addEventListener('click', () => {
      loadAssistantData();
    });

    createTaskBtn.addEventListener('click', () => {
      showTaskCreator();
    });

    draftEmailBtn.addEventListener('click', () => {
      showEmailDrafter();
    });

    sendBtn.addEventListener('click', () => {
      handleUserMessage();
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleUserMessage();
      }
    });
  }

  // Load assistant data
  async function loadAssistantData() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      showMessage('Please log in to use the assistant', 'error');
      return;
    }

    showLoading();

    try {
      // Load tasks
      const tasksRes = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        assistantData.tasks = tasksData.tasks || [];
        console.log('✅ Tasks loaded:', assistantData.tasks.length);
      } else {
        console.error('❌ Tasks error:', tasksRes.status);
        assistantData.tasks = [];
      }

      // Load recent emails - try /api/email/list first
      try {
        const emailsRes = await fetch(`${API_BASE}/email/list?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (emailsRes.ok) {
          const emailsData = await emailsRes.json();
          assistantData.emails = emailsData.emails || [];
          console.log('✅ Emails loaded:', assistantData.emails.length);
        } else {
          console.error('❌ Emails error:', emailsRes.status);
          assistantData.emails = [];
        }
      } catch (emailError) {
        console.error('❌ Email fetch failed:', emailError);
        assistantData.emails = [];
      }

      // Load meetings
      const meetingsRes = await fetch(`${API_BASE}/meetings/otter/transcripts?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        assistantData.meetings = meetingsData.transcripts || [];
        console.log('✅ Meetings loaded:', assistantData.meetings.length);
      } else {
        console.error('❌ Meetings error:', meetingsRes.status);
        assistantData.meetings = [];
      }

      // Generate AI suggestions
      await generateSuggestions();

    } catch (error) {
      console.error('Error loading assistant data:', error);
      showMessage('Failed to load some data. Features may be limited.', 'warning');
      // Still try to generate suggestions with whatever data we have
      await generateSuggestions();
    }
  }

  // Generate AI suggestions
  async function generateSuggestions() {
    const suggestions = [];

    // Analyze tasks
    const overdueTasks = assistantData.tasks.filter(t => 
      t.status !== 'completed' && new Date(t.due_date) < new Date()
    );
    if (overdueTasks.length > 0) {
      suggestions.push({
        icon: '⚠️',
        title: `${overdueTasks.length} Overdue Tasks`,
        description: `You have ${overdueTasks.length} tasks past their due date`,
        action: 'view-overdue-tasks',
        priority: 'high'
      });
    }

    // Analyze pending tasks
    const pendingTasks = assistantData.tasks.filter(t => 
      t.status === 'pending' || t.status === 'in_progress'
    );
    if (pendingTasks.length > 0) {
      suggestions.push({
        icon: '✅',
        title: `${pendingTasks.length} Active Tasks`,
        description: 'You have tasks in progress',
        action: 'view-pending-tasks',
        priority: 'medium'
      });
    }

    // Analyze unread emails
    const unreadEmails = assistantData.emails.filter(e => !e.read);
    if (unreadEmails.length > 0) {
      suggestions.push({
        icon: '📧',
        title: `${unreadEmails.length} Unread Emails`,
        description: 'You have new messages to review',
        action: 'view-unread-emails',
        priority: 'medium'
      });
    }

    // Analyze recent meetings
    if (assistantData.meetings.length > 0) {
      const recentMeeting = assistantData.meetings[0];
      suggestions.push({
        icon: '🎙️',
        title: 'Recent Meeting',
        description: `"${recentMeeting.title}" - Review summary`,
        action: 'view-recent-meeting',
        priority: 'low'
      });
    }

    // AI-powered suggestion
    if (assistantData.tasks.length > 0 && assistantData.emails.length > 0) {
      suggestions.push({
        icon: '🤖',
        title: 'AI Suggestion',
        description: 'Create a task from your recent emails?',
        action: 'ai-suggest-task',
        priority: 'low'
      });
    }

    displaySuggestions(suggestions);
  }

  // Display suggestions
  function displaySuggestions(suggestions) {
    const container = document.getElementById('ai-suggestions');
    
    if (suggestions.length === 0) {
      container.innerHTML = `
        <div class="ai-no-suggestions">
          <p>✨ All caught up!</p>
          <p class="ai-subtitle">No urgent items right now</p>
          <p class="ai-subtitle" style="margin-top: 12px; font-size: 12px;">
            📊 ${assistantData.tasks.length} tasks • 
            📧 ${assistantData.emails.length} emails • 
            🎙️ ${assistantData.meetings.length} meetings
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = suggestions.map(s => `
      <div class="ai-suggestion ai-priority-${s.priority}" data-action="${s.action}">
        <div class="ai-suggestion-icon">${s.icon}</div>
        <div class="ai-suggestion-content">
          <div class="ai-suggestion-title">${s.title}</div>
          <div class="ai-suggestion-desc">${s.description}</div>
        </div>
        <div class="ai-suggestion-arrow">→</div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.ai-suggestion').forEach(el => {
      el.addEventListener('click', () => {
        handleSuggestionClick(el.dataset.action);
      });
    });
  }

  // Handle suggestion clicks
  function handleSuggestionClick(action) {
    switch(action) {
      case 'view-overdue-tasks':
        window.location.href = '/tasks?filter=overdue';
        break;
      case 'view-pending-tasks':
        window.location.href = '/tasks?filter=active';
        break;
      case 'view-unread-emails':
        window.location.href = '/emails?filter=unread';
        break;
      case 'view-recent-meeting':
        window.location.href = '/collaborate?tab=meetings';
        break;
      case 'ai-suggest-task':
        aiSuggestTask();
        break;
    }
  }

  // AI suggest task
  async function aiSuggestTask() {
    addMessage('bot', 'Let me analyze your emails and create a task suggestion...');
    
    const recentEmail = assistantData.emails[0];
    if (!recentEmail) {
      addMessage('bot', 'No recent emails found to analyze.');
      return;
    }

    const taskSuggestion = {
      title: `Follow up: ${recentEmail.subject}`,
      description: `Reply to email from ${recentEmail.from_email}`,
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium'
    };

    addMessage('bot', `Suggested task: "${taskSuggestion.title}". Would you like me to create it?`);
    
    // TODO: Add confirmation UI
  }

  // Handle user messages
  async function handleUserMessage() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage('user', message);
    input.value = '';
    
    // Process message
    await processAIQuery(message);
  }

  // Process AI queries
  async function processAIQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Task queries
    if (lowerQuery.includes('task')) {
      if (lowerQuery.includes('overdue')) {
        const overdue = assistantData.tasks.filter(t => 
          t.status !== 'completed' && new Date(t.due_date) < new Date()
        );
        addMessage('bot', `You have ${overdue.length} overdue tasks: ${overdue.map(t => t.title).join(', ')}`);
      } else if (lowerQuery.includes('create') || lowerQuery.includes('new')) {
        showTaskCreator();
      } else {
        addMessage('bot', `You have ${assistantData.tasks.length} total tasks. ${assistantData.tasks.filter(t => t.status !== 'completed').length} are still pending.`);
      }
    }
    // Email queries
    else if (lowerQuery.includes('email')) {
      if (lowerQuery.includes('unread')) {
        const unread = assistantData.emails.filter(e => !e.read);
        addMessage('bot', `You have ${unread.length} unread emails.`);
      } else if (lowerQuery.includes('draft')) {
        showEmailDrafter();
      } else {
        addMessage('bot', `You have ${assistantData.emails.length} recent emails.`);
      }
    }
    // Meeting queries
    else if (lowerQuery.includes('meeting')) {
      const recent = assistantData.meetings[0];
      if (recent) {
        addMessage('bot', `Your most recent meeting: "${recent.title}". Summary: ${recent.summary}`);
      } else {
        addMessage('bot', 'No recent meetings found.');
      }
    }
    // General help
    else {
      addMessage('bot', 'I can help you with:\n• Tasks (view, create, update)\n• Emails (check unread, draft)\n• Meetings (view summaries)\n• Files (search, organize)\n\nWhat would you like to do?');
    }
  }

  // Add message to chat
  function addMessage(sender, text) {
    const messagesContainer = document.getElementById('ai-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ai-message-${sender}`;
    messageEl.innerHTML = `
      <div class="ai-message-avatar">${sender === 'bot' ? '🤖' : '👤'}</div>
      <div class="ai-message-bubble">${text.replace(/\n/g, '<br>')}</div>
    `;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show loading state
  function showLoading() {
    const container = document.getElementById('ai-suggestions');
    container.innerHTML = `
      <div class="ai-loading">
        <div class="ai-loading-spinner"></div>
        <p>Analyzing your workspace...</p>
      </div>
    `;
  }

  // Show message
  function showMessage(text, type = 'info') {
    addMessage('bot', text);
  }

  // Show task creator
  function showTaskCreator() {
    addMessage('bot', 'Opening task creator...');
    window.location.href = '/tasks?action=create';
  }

  // Show email drafter
  function showEmailDrafter() {
    addMessage('bot', 'Opening email composer...');
    window.location.href = '/emails?action=compose';
  }

  // Initialize assistant on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createAssistant);
  } else {
    createAssistant();
  }

  // Global toggle function
  window.toggleAIAssistant = function() {
    const assistant = document.getElementById('ai-assistant');
    if (assistant) {
      assistant.style.display = assistant.style.display === 'none' ? 'block' : 'none';
    } else {
      createAssistant();
    }
  };

})();
