// ✨ COLLABORATION CENTER - Year 2070 JavaScript ✨

const API_BASE = '/api/collaboration';
let currentView = 'live-board'; // Default to Live Board
let currentUser = null;
let userRole = null;

// 🚀 INITIALIZE
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌌 Collaboration Center initializing...');
  
  // NO MORE LOCALSTORAGE! Check auth via API call with cookies
  console.log('🔑 Checking authentication via /api/auth/me...');
  
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await response.json();
    
    if (!data.success || !data.user) {
      console.log('❌ Not authenticated, redirecting to login...');
      window.location.href = '/login';
      return;
    }
    
    console.log('✅ Authenticated as:', data.user.email);
    currentUser = data.user.email;
    document.getElementById('user-email').textContent = currentUser;
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    window.location.href = '/login';
    return;
  }
  
  console.log('✅ Auth verified, loading collaboration center...');
  await loadMyRole();
  setupNavigation();
  setupBackButton();
  await loadInitialData();
  
  // Set initial view to live-board if no hash
  if (!window.location.hash) {
    console.log('🚀 Setting initial view to live-board');
    switchView('live-board');
  }
  
  // Handle hash navigation (e.g., /collaborate#tasks)
  if (window.location.hash) {
    const view = window.location.hash.replace('#', '');
    if (view) {
      console.log(`🔗 Switching to view from hash: ${view}`);
      switchView(view);
      
      // Update active nav item
      document.querySelectorAll('.collab-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
          item.classList.add('active');
        }
      });
    }
  }
});

// 🎭 LOAD USER ROLE
async function loadMyRole() {
  try {console.log('🎭 Fetching user role...');
    const response = await fetch(`${API_BASE}/my-role`, { credentials: 'include' });
    
    const data = await response.json();
    console.log('📊 Role response:', data);
    
    if (data.success) {
      userRole = data.role;
      console.log('✅ User role:', userRole);
      
      // Show Settings nav for admins only
      if (userRole.role === 'admin') {
        document.getElementById('settings-nav-btn').style.display = 'flex';
      }
    } else {
      userRole = 'viewer'; // Default role
      console.log('⚠️ No role found, defaulting to viewer');
    }
  } catch (error) {
    console.error('❌ Error loading role:', error);
    userRole = 'viewer';
  }
}

// 🎯 NAVIGATION
function setupNavigation() {
  const navItems = document.querySelectorAll('.collab-nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
      
      // Update active state
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function switchView(view) {
  console.log(`🔄 Switching view to: ${view}`);
  currentView = view;
  
  // Hide all views
  document.querySelectorAll('.collab-view').forEach(v => {
    v.classList.remove('active');
  });
  
  // Show selected view
  const targetView = document.getElementById(`${view}-view`);
  if (targetView) {
    targetView.classList.add('active');
    console.log(`✅ View activated: ${view}-view`);
  } else {
    console.error(`❌ View not found: ${view}-view`);
  }
  
  // Load data for the view
  switch (view) {
    case 'live-board':
      loadLiveBoard();
      break;
    case 'my-posts':
      loadMyPosts();
      break;
    case 'all-posts':
      loadAllPosts();
      break;
    case 'new-post':
      checkNewPostPermission();
      break;
    case 'team':
      loadTeam();
      break;
    case 'meetings':
      loadMeetings();
      break;
    case 'tasks':
      loadTasks();
      break;
    case 'activity':
      loadActivity();
      break;
    case 'settings':
      loadSettings();
      break;
  }
}

// Make switchView available globally
window.switchView = switchView;

// ↩ BACK BUTTON
function setupBackButton() {
  document.getElementById('back-to-mail-btn').addEventListener('click', () => {
    window.location.href = '/mail';
  });
}

// 📊 LOAD INITIAL DATA
async function loadInitialData() {
  await loadLiveBoard(); // Load Live Board first as it's the default view
  await loadCounts();
  setupLiveBoardComposer(); // Setup the post composer
}

// 📈 LOAD COUNTS
async function loadCounts() {
  try {    
    // Load live board posts count
    const liveBoardResponse = await fetch(`${API_BASE}/live-board/posts`, { credentials: 'include' });
    const liveBoardData = await liveBoardResponse.json();
    
    if (liveBoardData.success && liveBoardData.posts) {
      document.getElementById('live-board-count').textContent = liveBoardData.posts.length;
    }
    
    // Load posts count
    const postsResponse = await fetch(`${API_BASE}/blog-posts`, { credentials: 'include' });
    const postsData = await postsResponse.json();
    
    if (postsData.success) {
      const myPosts = postsData.posts.filter(p => p.author === currentUser);
      document.getElementById('my-posts-count').textContent = myPosts.length;
      document.getElementById('all-posts-count').textContent = postsData.posts.length;
    }
    
    // Load team count (if element exists)
    const teamCountElement = document.getElementById('team-count');
    if (teamCountElement) {
      const teamResponse = await fetch(`${API_BASE}/users`, { credentials: 'include' });
      const teamData = await teamResponse.json();
      
      if (teamData.success) {
        teamCountElement.textContent = teamData.users.length;
      }
    }
  } catch (error) {
    console.error('Error loading counts:', error);
  }
}

// 📝 LOAD MY POSTS
async function loadMyPosts() {
  const container = document.getElementById('my-posts-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Loading posts...</p></div>';
  
  try {    const response = await fetch(`${API_BASE}/blog-posts`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (data.success && data.posts.length > 0) {
      const myPosts = data.posts.filter(p => p.author === currentUser);
      
      if (myPosts.length === 0) {
        container.innerHTML = `
          <div class="permission-check-box">
            <p>You haven't created any posts yet.</p>
            <button class="quantum-btn" onclick="switchView('new-post')">Create Your First Post</button>
          </div>
        `;
        return;
      }
      
      container.innerHTML = myPosts.map(post => createPostCard(post)).join('');
      attachPostCardListeners();
    } else {
      container.innerHTML = `
        <div class="permission-check-box">
          <p>No posts found.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading my posts:', error);
    container.innerHTML = `
      <div class="permission-check-box">
        <p>Error loading posts. Please try again.</p>
      </div>
    `;
  }
}

// 📚 LOAD ALL POSTS
async function loadAllPosts() {
  const container = document.getElementById('all-posts-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Loading posts...</p></div>';
  
  try {    const response = await fetch(`${API_BASE}/blog-posts`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (data.success && data.posts.length > 0) {
      container.innerHTML = data.posts.map(post => createPostCard(post)).join('');
      attachPostCardListeners();
    } else {
      container.innerHTML = `
        <div class="permission-check-box">
          <p>No posts found.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading all posts:', error);
    container.innerHTML = `
      <div class="permission-check-box">
        <p>Error loading posts. Please try again.</p>
      </div>
    `;
  }
}

// 🎴 CREATE POST CARD
function createPostCard(post) {
  const statusClass = post.status === 'published' ? 'published' : 'draft';
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Check if user can edit this post
  const canEdit = userRole === 'admin' || 
                  userRole === 'editor' || 
                  userRole === 'publisher' || 
                  post.author === currentUser;
  
  // Store post data as data attributes - DON'T escape, use base64 to avoid quote issues
  const postDataStr = JSON.stringify({
    slug: post.slug,
    author: post.author,
    status: post.status
  });
  const postDataBase64 = btoa(postDataStr); // Convert to base64 to avoid any escaping issues
  
  return `
    <div class="post-card">
      <div class="post-card-content" data-post-base64="${postDataBase64}" style="cursor: pointer;">
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <div class="post-meta">
          <span>📅 ${date}</span>
          <span>👤 ${escapeHtml(post.author)}</span>
        </div>
        <p class="post-excerpt">${escapeHtml(post.excerpt || 'No excerpt available')}</p>
      </div>
      <div class="post-actions">
        <span class="post-status ${statusClass}">${post.status}</span>
        ${canEdit ? `<button class="post-edit-btn" data-slug="${post.slug}">✏️ Edit</button>` : ''}
      </div>
    </div>
  `;
}

// 🎯 ATTACH EVENT LISTENERS TO POST CARDS
function attachPostCardListeners() {
  console.log('📌 Attaching event listeners to post cards...');
  
  // Attach to .post-card (parent) instead of .post-card-content
  const postCards = document.querySelectorAll('.post-card');
  console.log('📌 Found .post-card elements:', postCards.length);
  
  postCards.forEach((card, index) => {
    console.log(`📌 Attaching listener to card ${index}:`, card);
    
    card.addEventListener('click', function(e) {
      console.log('🎯 CLICK on post card!', e.target);
      
      // Find the post-card-content inside this card
      const contentDiv = this.querySelector('.post-card-content');
      if (contentDiv) {
        const postDataBase64 = contentDiv.getAttribute('data-post-base64');
        if (postDataBase64) {
          try {
            const postDataStr = atob(postDataBase64);
            const postData = JSON.parse(postDataStr);
            
            // Show modal with options
            showPostActionModal(postData);
          } catch (error) {
            console.error('❌ Error:', error);
          }
        }
      }
    }, { capture: true });
  });
  
  console.log(`📌 Attached listeners to ${postCards.length} post cards`);
  
  // MANUAL TEST
  window.testCardClick = function() {
    console.log('🧪 MANUAL TEST: Calling openPost directly');
    const firstCard = document.querySelector('.post-card-content');
    if (firstCard) {
      const postDataBase64 = firstCard.getAttribute('data-post-base64');
      if (postDataBase64) {
        const postDataStr = atob(postDataBase64);
        const encodedData = encodeURIComponent(postDataStr);
        window.openPost(encodedData);
      }
    }
  };
  
  console.log('🧪 TEST: window.testCardClick() available');
}

// 📋 SHOW POST ACTION MODAL
function showPostActionModal(postData) {
  console.log('📋 Showing action modal for:', postData);
  
  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'post-action-modal';
  modal.innerHTML = `
    <div class="post-action-modal-overlay"></div>
    <div class="post-action-modal-content">
      <h3>What would you like to do?</h3>
      <p class="post-title-preview">${postData.slug}</p>
      <div class="post-action-buttons">
        <button class="post-action-btn view-btn" onclick="viewLivePost('${postData.slug}')">
          <span class="btn-icon">👁️</span>
          <span class="btn-text">View Live Post</span>
        </button>
        <button class="post-action-btn edit-btn" onclick="editPostFromModal('${postData.slug}')">
          <span class="btn-icon">✏️</span>
          <span class="btn-text">Edit Post</span>
        </button>
      </div>
      <button class="modal-close-btn" onclick="closePostActionModal()">✕</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on overlay click
  modal.querySelector('.post-action-modal-overlay').addEventListener('click', closePostActionModal);
}

// 👁️ VIEW LIVE POST
window.viewLivePost = function(slug) {
  console.log('👁️ Viewing live post:', slug);
  closePostActionModal();
  window.location.href = `/blog/${slug}`;
};

// ✏️ EDIT POST FROM MODAL
window.editPostFromModal = function(slug) {
  console.log('✏️ Editing post:', slug);
  closePostActionModal();
  window.editPost(slug);
};

// ✕ CLOSE MODAL
window.closePostActionModal = function() {
  const modal = document.querySelector('.post-action-modal');
  if (modal) {
    modal.remove();
  }
};

// ✏️ EDIT POST - Load into Collaboration Editor
async function editPost(slug) {
  console.log('🔧 editPost called with slug:', slug);
  try {
    // Fetch the post data    console.log('🔧 Fetching post from API...');
    const response = await fetch(`/api/admin/posts/${slug}`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (data.success && data.post) {
      const post = data.post;
      
      // Switch to new post view
      switchView('new-post');
      
      // Wait for the view to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Populate the form fields
      document.getElementById('collab-post-title').value = post.title || '';
      document.getElementById('collab-post-slug').value = post.slug || '';
      document.getElementById('collab-post-author').value = post.author || '';
      document.getElementById('collab-post-excerpt').value = post.excerpt || '';
      document.getElementById('collab-post-featured-image').value = post.featured_image || '';
      document.getElementById('collab-post-meta-title').value = post.meta_title || '';
      document.getElementById('collab-post-meta-description').value = post.meta_description || '';
      document.getElementById('collab-post-meta-keywords').value = post.meta_keywords || '';
      document.getElementById('collab-post-og-image').value = post.og_image || '';
      document.getElementById('collab-post-status').value = post.status || 'draft';
      
      // Set the Trix editor content
      const trixEditor = document.querySelector('trix-editor');
      if (trixEditor) {
        trixEditor.editor.loadHTML(post.content || '');
      }
      
      // Update the form to be in edit mode
      const form = document.getElementById('collab-post-form');
      form.dataset.editSlug = slug; // Store the slug for updating
      
      // Update the submit button text
      const submitBtn = form.querySelector('.ultra-btn-save .ultra-btn-text');
      if (submitBtn) {
        submitBtn.textContent = 'Update Post';
      }
      
      showNotification('📝 Editing post: ' + post.title, 'info');
    } else {
      showNotification('❌ Failed to load post', 'error');
    }
  } catch (error) {
    console.error('Error loading post for editing:', error);
    showNotification('❌ Error loading post', 'error');
  }
}

// Make editPost available globally
window.editPost = editPost;

// 🔗 OPEN POST
function openPost(postDataEncoded) {
  console.log('🔗 openPost called with:', postDataEncoded);
  try {
    const postData = JSON.parse(decodeURIComponent(postDataEncoded));
    const { slug, author, status } = postData;
    
    console.log('🔍 Opening post:', { slug, author, status, currentUser, userRole });
    console.log('🔍 Status check:', status, typeof status, status === 'published');
    
    // PUBLISHED posts: Always show live article
    if (status === 'published') {
      console.log('✅ Published post - redirecting to /blog/' + slug);
      window.location.href = `/blog/${slug}`;
      return;
    }
    
    // DRAFT posts: Only owners or editors can view/edit
    const canEdit = userRole === 'admin' || 
                    userRole === 'editor' || 
                    userRole === 'publisher' || 
                    author === currentUser;
    
    console.log('🔍 Draft post - canEdit:', canEdit);
    
    if (canEdit) {
      // Redirect to admin dashboard for editing drafts
      window.location.href = `/admin/dashboard?edit=${slug}`;
    } else {
      // Can't access this draft
      alert('This post is not yet published.');
    }
  } catch (error) {
    console.error('Error opening post:', error);
    // Fallback: treat as slug and view the post
    window.location.href = `/blog/${postDataEncoded}`;
  }
}

// Make openPost available globally
window.openPost = openPost;

// ✨ CHECK NEW POST PERMISSION
async function checkNewPostPermission() {
  const container = document.getElementById('new-post-view').querySelector('.permission-check-box');
  container.innerHTML = '<p>Checking permissions...</p>';
  
  console.log('🔍 Checking permissions for role:', userRole);
  console.log('🔍 Role type:', typeof userRole);
  console.log('🔍 Role object:', JSON.stringify(userRole));
  
  // Handle both object and string formats
  const roleString = typeof userRole === 'object' ? userRole.role : userRole;
  const canCreate = roleString && (roleString === 'admin' || roleString === 'editor' || roleString === 'publisher');
  
  console.log('🔍 Role string:', roleString);
  console.log('🔍 Can create:', canCreate);
  
  if (canCreate) {
    // Show ULTRA IMPRESSIVE AI-powered post editor
    container.innerHTML = `
      <div class="ultra-post-editor">
        <form id="collab-post-form" class="ultra-post-form">
          
          <!-- BASIC INFORMATION -->
          <div class="ultra-section">
            <div class="ultra-section-header">
              <span class="ultra-section-icon">📝</span>
              <h3 class="ultra-section-title">Basic Information</h3>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-title">Title *</label>
              <input type="text" id="collab-post-title" name="title" required placeholder="Enter your epic post title...">
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-slug">URL Slug *</label>
              <input type="text" id="collab-post-slug" name="slug" required placeholder="url-friendly-slug">
              <small>🤖 Auto-generated from title</small>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-author">Author *</label>
              <input type="text" id="collab-post-author" name="author" value="${currentUser}" required>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-excerpt">Excerpt</label>
              <textarea id="collab-post-excerpt" name="excerpt" rows="3" placeholder="Short summary for listings..."></textarea>
              <small>Brief description that appears in post listings</small>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-featured-image">Featured Image URL</label>
              <input type="url" id="collab-post-featured-image" name="featured_image" placeholder="https://example.com/image.jpg">
              <small>Main image for social sharing (1200x630 recommended)</small>
            </div>
          </div>
          
          <!-- CONTENT EDITOR -->
          <div class="ultra-section">
            <div class="ultra-section-header">
              <span class="ultra-section-icon">✍️</span>
              <h3 class="ultra-section-title">Content</h3>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-content">Post Content *</label>
              <input id="collab-post-content" type="hidden" name="content" required>
              <trix-editor input="collab-post-content" class="ultra-trix-editor" placeholder="Write your amazing content here..."></trix-editor>
              <small>✨ Rich text editor with full formatting support</small>
            </div>
          </div>
          
          <!-- 🤖 AI SEO SUPER BOOST -->
          <div class="ultra-section ultra-ai-section">
            <div class="ultra-section-header">
              <span class="ultra-section-icon">🤖</span>
              <h3 class="ultra-section-title">AI SEO Optimization</h3>
              <span class="ultra-badge ultra-badge-ai">NEURAL POWERED</span>
            </div>
            
            <div class="ultra-ai-mega-button-container">
              <button type="button" id="collab-ai-seo-optimize" class="ultra-ai-mega-button">
                <div class="ai-btn-content">
                  <div class="ai-btn-icon">⚡</div>
                  <div class="ai-btn-text-group">
                    <div class="ai-btn-title">AI Auto-Fill SEO</div>
                    <div class="ai-btn-subtitle">Neural optimization • Instant results</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-meta-title">Meta Title</label>
              <input type="text" id="collab-post-meta-title" name="meta_title" placeholder="SEO-optimized title...">
              <small>Leave empty to use post title</small>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-meta-description">Meta Description</label>
              <textarea id="collab-post-meta-description" name="meta_description" rows="2" placeholder="Compelling description for search results..."></textarea>
              <small>150-160 characters recommended for best SEO</small>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-meta-keywords">Meta Keywords</label>
              <input type="text" id="collab-post-meta-keywords" name="meta_keywords" placeholder="keyword1, keyword2, keyword3">
              <small>Comma-separated keywords for search engines</small>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-og-image">Open Graph Image</label>
              <input type="url" id="collab-post-og-image" name="og_image" placeholder="https://example.com/og-image.jpg">
              <small>Social media preview image (1200x630 px)</small>
            </div>
          </div>
          
          <!-- 🚀 ADVANCED AI OPTIMIZATION -->
          <div class="ultra-section ultra-ai-advanced-section">
            <div class="ultra-section-header">
              <span class="ultra-section-icon">🚀</span>
              <h3 class="ultra-section-title">Advanced AI Optimization</h3>
              <span class="ultra-badge ultra-badge-quantum">QUANTUM AI</span>
            </div>
            
            <p class="ultra-section-desc">
              Supercharge your content with cutting-edge AI: semantic embeddings, FAQ generation, 
              structured data, and neural summaries for maximum visibility across all platforms.
            </p>
            
            <!-- AI STATUS DISPLAY -->
            <div id="collab-ai-status-box" class="ultra-ai-status-box" style="display: none;">
              <div class="ultra-ai-status-item">
                <span class="ultra-ai-status-label">📊 AI Summary:</span>
                <span id="collab-ai-status-summary" class="ultra-ai-status-value">Not generated</span>
              </div>
              <div class="ultra-ai-status-item">
                <span class="ultra-ai-status-label">❓ FAQ Schema:</span>
                <span id="collab-ai-status-faq" class="ultra-ai-status-value">Not generated</span>
              </div>
              <div class="ultra-ai-status-item">
                <span class="ultra-ai-status-label">📋 Structured Data:</span>
                <span id="collab-ai-status-schema" class="ultra-ai-status-value">Not generated</span>
              </div>
              <div class="ultra-ai-status-item">
                <span class="ultra-ai-status-label">🧠 Neural Embedding:</span>
                <span id="collab-ai-status-embedding" class="ultra-ai-status-value">Not generated</span>
              </div>
            </div>
            
            <!-- MEGA AI OPTIMIZATION BUTTON -->
            <div class="ultra-ai-quantum-action">
              <button type="button" id="collab-ai-optimize-all" class="ultra-ai-quantum-button">
                <div class="ai-btn-content">
                  <div class="ai-btn-icon">🚀</div>
                  <div class="ai-btn-text-group">
                    <div class="ai-btn-title">One-Click AI Optimization</div>
                    <div class="ai-btn-subtitle">Generate everything • Neural networks</div>
                  </div>
                </div>
              </button>
            </div>
            
            <!-- INDIVIDUAL AI ACTIONS -->
            <div class="ultra-ai-individual-actions">
              <button type="button" id="collab-ai-generate-summary" class="ultra-ai-action-btn">
                <div class="ai-small-btn-content">
                  <span class="ai-small-icon">📝</span>
                  <span class="ai-small-text">AI Summary</span>
                </div>
              </button>
              <button type="button" id="collab-ai-generate-faq" class="ultra-ai-action-btn">
                <div class="ai-small-btn-content">
                  <span class="ai-small-icon">❓</span>
                  <span class="ai-small-text">FAQ Schema</span>
                </div>
              </button>
              <button type="button" id="collab-ai-generate-schema" class="ultra-ai-action-btn">
                <div class="ai-small-btn-content">
                  <span class="ai-small-icon">📋</span>
                  <span class="ai-small-text">Structured Data</span>
                </div>
              </button>
              <button type="button" id="collab-ai-generate-embedding" class="ultra-ai-action-btn">
                <div class="ai-small-btn-content">
                  <span class="ai-small-icon">🧠</span>
                  <span class="ai-small-text">Neural Embed</span>
                </div>
              </button>
            </div>
            
            <!-- KNOWLEDGE BASE TOGGLE -->
            <div class="ultra-form-group ultra-checkbox-group">
              <label class="ultra-checkbox-label">
                <input type="checkbox" id="collab-ai-include-kb" name="ai_include_in_knowledge_base">
                <span class="ultra-checkbox-custom"></span>
                <span class="ultra-checkbox-text">
                  <strong>Include in AI Knowledge Base</strong>
                  <small>Enable AI-powered Q&A for visitors using this content</small>
                </span>
              </label>
            </div>
            
            <!-- AI RESULT BOX -->
            <div id="collab-ai-result-box" class="ultra-ai-result-box" style="display: none;">
              <div class="ultra-ai-result-header">
                <span class="ultra-ai-result-icon">✨</span>
                <h4>AI Optimization Result</h4>
              </div>
              <pre id="collab-ai-result-text"></pre>
            </div>
          </div>
          
          <!-- PUBLISHING OPTIONS -->
          <div class="ultra-section">
            <div class="ultra-section-header">
              <span class="ultra-section-icon">🚀</span>
              <h3 class="ultra-section-title">Publishing</h3>
            </div>
            
            <div class="ultra-form-group">
              <label for="collab-post-status">Status *</label>
              <select id="collab-post-status" name="status" required>
                <option value="draft">📝 Draft (Save for later)</option>
                <option value="published">✅ Published (Go live now)</option>
                <option value="archived">📦 Archived (Hide from public)</option>
              </select>
            </div>
          </div>
          
          <!-- ULTRA ACTIONS -->
          <div class="ultra-form-actions">
            <button type="button" class="ultra-btn ultra-btn-cancel" onclick="switchView('my-posts')">
              <span class="ultra-btn-icon">←</span>
              <span class="ultra-btn-text">Cancel</span>
            </button>
            <button type="submit" class="ultra-btn ultra-btn-save">
              <span class="ultra-btn-glow"></span>
              <span class="ultra-btn-icon">✨</span>
              <span class="ultra-btn-text">Create Post</span>
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Setup form submission
    document.getElementById('collab-post-form').addEventListener('submit', handlePostSubmit);
    
    // Auto-generate slug from title
    document.getElementById('collab-post-title').addEventListener('input', (e) => {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      document.getElementById('collab-post-slug').value = slug;
    });
    
    // Setup AI SEO Auto-Fill
    document.getElementById('collab-ai-seo-optimize')?.addEventListener('click', collabAIAutoFillSEO);
    
    // Setup Advanced AI Optimization buttons
    document.getElementById('collab-ai-optimize-all')?.addEventListener('click', collabAIOptimizeAll);
    document.getElementById('collab-ai-generate-summary')?.addEventListener('click', () => collabAIGenerateSummary());
    document.getElementById('collab-ai-generate-faq')?.addEventListener('click', () => collabAIGenerateFAQ());
    document.getElementById('collab-ai-generate-schema')?.addEventListener('click', () => collabAIGenerateSchema());
    document.getElementById('collab-ai-generate-embedding')?.addEventListener('click', () => collabAIGenerateEmbedding());
  } else {
    container.innerHTML = `
      <div style="text-align: center;">
        <h3 style="font-size: 24px; margin-bottom: 20px; color: var(--quantum-text);">
          🔒 Permission Required
        </h3>
        <p style="margin-bottom: 30px; color: var(--quantum-text-dim);">
          Your current role (<strong>${roleString || 'viewer'}</strong>) does not allow creating posts.<br>
          Please contact an administrator to request access.
        </p>
        <p style="color: var(--quantum-text-dim); font-size: 14px;">
          Required roles: <strong style="color: var(--quantum-primary);">Admin, Editor, or Publisher</strong>
        </p>
      </div>
    `;
  }
}

// 📝 HANDLE POST SUBMISSION
async function handlePostSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const editSlug = form.dataset.editSlug; // Check if we're editing
  
  const formData = {
    title: document.getElementById('collab-post-title').value,
    slug: document.getElementById('collab-post-slug').value,
    author: document.getElementById('collab-post-author').value,
    excerpt: document.getElementById('collab-post-excerpt').value,
    content: document.getElementById('collab-post-content').value,
    featured_image: document.getElementById('collab-post-featured-image').value,
    meta_title: document.getElementById('collab-post-meta-title').value,
    meta_description: document.getElementById('collab-post-meta-description').value,
    meta_keywords: document.getElementById('collab-post-meta-keywords').value,
    og_image: document.getElementById('collab-post-og-image').value,
    status: document.getElementById('collab-post-status').value,
    ai_include_in_knowledge_base: document.getElementById('collab-ai-include-kb').checked ? 1 : 0
  };
  
  try {    
    // Determine if this is an update or create
    const isUpdate = !!editSlug;
    const url = isUpdate ? `/api/admin/posts/${editSlug}` : '/api/admin/posts';
    const method = isUpdate ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(`✅ Post ${isUpdate ? 'updated' : 'created'} successfully! 🚀`, 'success');
      // Reset form
      document.getElementById('collab-post-form').reset();
      delete form.dataset.editSlug; // Clear edit mode
      // Switch to my posts view
      setTimeout(() => switchView('my-posts'), 1500);
    } else {
      showNotification(`❌ Failed to ${isUpdate ? 'update' : 'create'} post: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error(`Error ${editSlug ? 'updating' : 'creating'} post:`, error);
    showNotification(`❌ Error ${editSlug ? 'updating' : 'creating'} post`, 'error');
  }
}

// 👥 LOAD TEAM
async function loadTeam() {
  const container = document.getElementById('team-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Loading team...</p></div>';
  
  try {    const response = await fetch(`${API_BASE}/users`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (data.success && data.users.length > 0) {
      container.innerHTML = data.users.map(user => createTeamCard(user)).join('');
    } else {
      container.innerHTML = `
        <div class="permission-check-box">
          <p>No team members found.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading team:', error);
    container.innerHTML = `
      <div class="permission-check-box">
        <p>Error loading team. Please try again.</p>
      </div>
    `;
  }
}

// 🎴 CREATE TEAM CARD
function createTeamCard(user) {
  const email = user.email || user.email_address || user.user_email || 'Unknown';
  const displayName = user.display_name || email.split('@')[0];
  const initials = displayName.substring(0, 2).toUpperCase();
  
  const roleColors = {
    admin: { bg: '#667eea', text: '#667eea' },
    publisher: { bg: '#4facfe', text: '#4facfe' },
    editor: { bg: '#43e97b', text: '#43e97b' },
    viewer: { bg: '#8892b0', text: '#8892b0' }
  };
  
  const colors = roleColors[user.role?.toLowerCase()] || roleColors.viewer;
  
  // Simulate online status (in production, this would come from a real-time service)
  const isOnline = Math.random() > 0.5;
  
  return `
    <div class="team-member-card">
      <div class="team-member-header">
        <div class="team-member-avatar-wrapper">
          <div class="team-member-avatar" style="background: ${colors.bg}">
            ${initials}
          </div>
          <span class="team-member-status ${isOnline ? 'online' : 'offline'}"></span>
        </div>
        <div class="team-member-info">
          <div class="team-member-name">${escapeHtml(displayName)}</div>
          <div class="team-member-email">${escapeHtml(email)}</div>
        </div>
      </div>
      
      <div class="team-member-meta">
        <span class="team-member-role" style="border-color: ${colors.text}; color: ${colors.text}">
          ${user.role || 'viewer'}
        </span>
        <span class="team-member-online-status">
          ${isOnline ? '🟢 Online' : '⚫ Offline'}
        </span>
      </div>
      
      <div class="team-member-actions">
        <button class="team-action-btn team-email-btn" onclick="window.openComposeEmailModal('${email}', '${escapeHtml(displayName)}')" title="Send Email">
          <span class="team-action-icon">📧</span>
          <span class="team-action-text">Email</span>
        </button>
        <button class="team-action-btn team-message-btn" onclick="openMessage('${email}')" title="Direct Message">
          <span class="team-action-icon">💬</span>
          <span class="team-action-text">Message</span>
        </button>
      </div>
    </div>
  `;
}

// 📊 LOAD ACTIVITY
async function loadActivity() {
  const container = document.getElementById('activity-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Loading activity...</p></div>';
  
  try {    
    // Fetch recent posts as activity
    const postsResponse = await fetch(`${API_BASE}/blog-posts`, { credentials: 'include' });
    
    const postsData = await postsResponse.json();
    
    // Fetch team members for online status
    const teamResponse = await fetch(`${API_BASE}/users`, { credentials: 'include' });
    
    const teamData = await teamResponse.json();
    
    const activities = [];
    
    // Add team online status
    if (teamData.success && teamData.users) {
      teamData.users.forEach(user => {
        const isOnline = Math.random() > 0.5; // In production, this would be real-time
        if (isOnline) {
          activities.push({
            type: 'user_online',
            user: user.email || user.email_address,
            display_name: user.display_name || user.email?.split('@')[0],
            role: user.role,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    
    // Add recent posts
    if (postsData.success && postsData.posts) {
      postsData.posts.slice(0, 10).forEach(post => {
        activities.push({
          type: 'post_created',
          user: post.author,
          post_title: post.title,
          post_id: post.id,
          status: post.status,
          timestamp: post.created_at || post.published_at
        });
      });
    }
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (activities.length > 0) {
      container.innerHTML = activities.map(activity => createActivityItem(activity)).join('');
    } else {
      container.innerHTML = `
        <div class="permission-check-box">
          <p>No recent activity.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading activity:', error);
    container.innerHTML = `
      <div class="permission-check-box">
        <p>Error loading activity. Please try again.</p>
      </div>
    `;
  }
}

// 📝 CREATE ACTIVITY ITEM
function createActivityItem(activity) {
  if (activity.type === 'user_online') {
    const roleColors = {
      admin: '#667eea',
      publisher: '#4facfe',
      editor: '#43e97b',
      viewer: '#8892b0'
    };
    const roleColor = roleColors[activity.role?.toLowerCase()] || '#8892b0';
    
    return `
      <div class="activity-item activity-online">
        <div class="activity-icon">🟢</div>
        <div class="activity-content">
          <div class="activity-title">
            <strong>${escapeHtml(activity.display_name || activity.user)}</strong> is online
          </div>
          <div class="activity-meta">
            <span class="activity-role" style="color: ${roleColor}">${activity.role || 'viewer'}</span>
            <span class="activity-time">Now</span>
          </div>
        </div>
      </div>
    `;
  }
  
  if (activity.type === 'post_created') {
    const statusIcons = {
      published: '🚀',
      draft: '📝',
      archived: '📦'
    };
    const statusColors = {
      published: '#43e97b',
      draft: '#ffa500',
      archived: '#8892b0'
    };
    
    const icon = statusIcons[activity.status] || '📝';
    const color = statusColors[activity.status] || '#8892b0';
    const timeAgo = getTimeAgo(activity.timestamp);
    
    return `
      <div class="activity-item activity-post">
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-title">
            <strong>${escapeHtml(activity.user)}</strong> ${activity.status === 'published' ? 'published' : 'created'} a post
          </div>
          <div class="activity-post-title">${escapeHtml(activity.post_title)}</div>
          <div class="activity-meta">
            <span class="activity-status" style="color: ${color}">${activity.status}</span>
            <span class="activity-time">${timeAgo}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  return '';
}

// ⏰ GET TIME AGO
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
}

// 🛡️ ESCAPE HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 💬 OPEN MESSAGE (Direct Message to Team Member)
function openMessage(email) {
  showNotification(`Opening message to ${email}...`, 'info');
  // In production, this would open a messaging modal or redirect to email
  window.location.href = `/mail?compose=${encodeURIComponent(email)}`;
}

// ⚙️ LOAD SETTINGS (Admin Only)
async function loadSettings() {
  const container = document.getElementById('user-permissions-list');
  
  try {    
    // Fetch all users with their roles
    const response = await fetch(`${API_BASE}/users`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (!data.success) {
      container.innerHTML = '<div class="error-message">Failed to load users</div>';
      return;
    }
    
    // Render user permission cards
    container.innerHTML = data.users.map(user => `
      <div class="user-permission-card">
        <div class="user-permission-info">
          <div class="user-permission-email">${escapeHtml(user.email)}</div>
          <div class="user-permission-name">${escapeHtml(user.display_name || user.email)}</div>
        </div>
        <div class="user-permission-controls">
          <select class="role-select" data-user="${escapeHtml(user.email)}" data-original-role="${user.role}">
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="publisher" ${user.role === 'publisher' ? 'selected' : ''}>Publisher</option>
            <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
          </select>
          <button class="save-role-btn" data-user="${escapeHtml(user.email)}" disabled>
            Save
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners to role selects
    document.querySelectorAll('.role-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const userEmail = e.target.dataset.user;
        const originalRole = e.target.dataset.originalRole;
        const newRole = e.target.value;
        const saveBtn = document.querySelector(`.save-role-btn[data-user="${userEmail}"]`);
        
        // Enable save button if role changed
        if (newRole !== originalRole) {
          saveBtn.disabled = false;
          saveBtn.classList.add('changed');
        } else {
          saveBtn.disabled = true;
          saveBtn.classList.remove('changed');
        }
      });
    });
    
    // Add event listeners to save buttons
    document.querySelectorAll('.save-role-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userEmail = e.target.dataset.user;
        const select = document.querySelector(`.role-select[data-user="${userEmail}"]`);
        const newRole = select.value;
        
        await updateUserRole(userEmail, newRole);
        
        // Update original role
        select.dataset.originalRole = newRole;
        e.target.disabled = true;
        e.target.classList.remove('changed');
      });
    });
    
  } catch (error) {
    console.error('❌ Error loading settings:', error);
    container.innerHTML = '<div class="error-message">Error loading users</div>';
  }
}

// 💾 UPDATE USER ROLE
async function updateUserRole(userEmail, newRole) {
  try {    
    const response = await fetch(`${API_BASE}/users/${encodeURIComponent(userEmail)}/role`, {
      method: 'PUT',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: newRole,
        permissions: getRolePermissions(newRole)
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(`✅ Role updated: ${userEmail} is now ${newRole}`, 'success');
      
      // Refresh team count
      loadCounts();
    } else {
      showNotification(`❌ Failed to update role: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('❌ Error updating role:', error);
    showNotification('❌ Error updating role', 'error');
  }
}

// 🔑 GET ROLE PERMISSIONS
function getRolePermissions(role) {
  const permissions = {
    admin: ['create', 'edit', 'delete', 'publish', 'manage_users'],
    publisher: ['create', 'edit', 'publish'],
    editor: ['edit'],
    viewer: []
  };
  
  return permissions[role] || [];
}

// 🔔 SHOW NOTIFICATION
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    padding: 16px 24px;
    border-radius: 12px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #43e97b, #38f9d7)' : 'linear-gradient(135deg, #f5576c, #f093fb)'};
    color: ${type === 'success' ? '#1a1b36' : 'white'};
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// 🤖 AI SEO AUTO-FILL FUNCTION
async function collabAIAutoFillSEO() {
  const btn = document.getElementById('collab-ai-seo-optimize');
  const title = document.getElementById('collab-post-title').value;
  const content = document.getElementById('collab-post-content').value;
  
  if (!title || !content) {
    showNotification('⚠️ Please enter title and content first!', 'error');
    return;
  }
  
  // Visual feedback
  btn.disabled = true;
  btn.style.opacity = '0.6';
  const originalText = btn.querySelector('.ultra-ai-mega-text').textContent;
  btn.querySelector('.ultra-ai-mega-text').textContent = '🤖 AI ANALYZING...';
  
  try {    const response = await fetch('/api/ai/seo-optimize', {
      method: 'POST',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Fill in the fields
      if (data.meta_title) document.getElementById('collab-post-meta-title').value = data.meta_title;
      if (data.meta_description) document.getElementById('collab-post-meta-description').value = data.meta_description;
      if (data.meta_keywords) document.getElementById('collab-post-meta-keywords').value = data.meta_keywords;
      
      showNotification('✅ AI SEO fields auto-filled successfully!', 'success');
    } else {
      showNotification(`❌ AI optimization failed: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('AI SEO error:', error);
    showNotification('❌ AI optimization error', 'error');
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.querySelector('.ultra-ai-mega-text').textContent = originalText;
  }
}

// 🚀 ONE-CLICK AI OPTIMIZE ALL
async function collabAIOptimizeAll() {
  const btn = document.getElementById('collab-ai-optimize-all');
  const content = document.getElementById('collab-post-content').value;
  const title = document.getElementById('collab-post-title').value;
  
  if (!content || !title) {
    showNotification('⚠️ Please enter title and content first!', 'error');
    return;
  }
  
  btn.disabled = true;
  const originalText = btn.querySelector('.ultra-ai-quantum-text').textContent;
  btn.querySelector('.ultra-ai-quantum-text').textContent = '🤖 QUANTUM AI PROCESSING...';
  
  try {
    // Show status box
    document.getElementById('collab-ai-status-box').style.display = 'block';    
    // Generate all AI features
    await Promise.all([
      collabAIGenerateSummary(true),
      collabAIGenerateFAQ(true),
      collabAIGenerateSchema(true),
      collabAIGenerateEmbedding(true)
    ]);
    
    showNotification('✅ Quantum AI optimization complete! All features generated!', 'success');
  } catch (error) {
    console.error('AI optimize all error:', error);
    showNotification('❌ AI optimization error', 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('.ultra-ai-quantum-text').textContent = originalText;
  }
}

// 📝 AI GENERATE SUMMARY
async function collabAIGenerateSummary(silent = false) {
  const content = document.getElementById('collab-post-content').value;
  const title = document.getElementById('collab-post-title').value;
  
  if (!content) {
    if (!silent) showNotification('⚠️ Please enter content first!', 'error');
    return;
  }
  
  try {    const response = await fetch('/api/ai/generate-summary', {
      method: 'POST',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('collab-ai-status-summary').textContent = '✅ Generated';
      document.getElementById('collab-ai-status-summary').style.color = '#43e97b';
      if (!silent) {
        document.getElementById('collab-ai-result-box').style.display = 'block';
        document.getElementById('collab-ai-result-text').textContent = JSON.stringify(data.summary, null, 2);
        showNotification('✅ AI Summary generated!', 'success');
      }
    }
  } catch (error) {
    console.error('AI summary error:', error);
    if (!silent) showNotification('❌ AI summary generation failed', 'error');
  }
}

// ❓ AI GENERATE FAQ
async function collabAIGenerateFAQ(silent = false) {
  const content = document.getElementById('collab-post-content').value;
  const title = document.getElementById('collab-post-title').value;
  
  if (!content) {
    if (!silent) showNotification('⚠️ Please enter content first!', 'error');
    return;
  }
  
  try {    const response = await fetch('/api/ai/generate-faq', {
      method: 'POST',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('collab-ai-status-faq').textContent = '✅ Generated';
      document.getElementById('collab-ai-status-faq').style.color = '#43e97b';
      if (!silent) {
        document.getElementById('collab-ai-result-box').style.display = 'block';
        document.getElementById('collab-ai-result-text').textContent = JSON.stringify(data.faq, null, 2);
        showNotification('✅ FAQ Schema generated!', 'success');
      }
    }
  } catch (error) {
    console.error('AI FAQ error:', error);
    if (!silent) showNotification('❌ FAQ generation failed', 'error');
  }
}

// 📋 AI GENERATE SCHEMA
async function collabAIGenerateSchema(silent = false) {
  const content = document.getElementById('collab-post-content').value;
  const title = document.getElementById('collab-post-title').value;
  
  if (!content) {
    if (!silent) showNotification('⚠️ Please enter content first!', 'error');
    return;
  }
  
  try {    const response = await fetch('/api/ai/generate-schema', {
      method: 'POST',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('collab-ai-status-schema').textContent = '✅ Generated';
      document.getElementById('collab-ai-status-schema').style.color = '#43e97b';
      if (!silent) {
        document.getElementById('collab-ai-result-box').style.display = 'block';
        document.getElementById('collab-ai-result-text').textContent = JSON.stringify(data.schema, null, 2);
        showNotification('✅ Structured Data generated!', 'success');
      }
    }
  } catch (error) {
    console.error('AI schema error:', error);
    if (!silent) showNotification('❌ Schema generation failed', 'error');
  }
}

// 🧠 AI GENERATE EMBEDDING
async function collabAIGenerateEmbedding(silent = false) {
  const content = document.getElementById('collab-post-content').value;
  const title = document.getElementById('collab-post-title').value;
  
  if (!content) {
    if (!silent) showNotification('⚠️ Please enter content first!', 'error');
    return;
  }
  
  try {    const response = await fetch('/api/ai/generate-embedding', {
      method: 'POST',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('collab-ai-status-embedding').textContent = '✅ Generated';
      document.getElementById('collab-ai-status-embedding').style.color = '#43e97b';
      if (!silent) {
        document.getElementById('collab-ai-result-box').style.display = 'block';
        document.getElementById('collab-ai-result-text').textContent = `Embedding vector generated (${data.embedding?.length || 0} dimensions)`;
        showNotification('✅ Neural Embedding generated!', 'success');
      }
    }
  } catch (error) {
    console.error('AI embedding error:', error);
    if (!silent) showNotification('❌ Embedding generation failed', 'error');
  }
}

// 🎙️ OTTER.AI MEETINGS INTEGRATION

async function loadMeetings() {
  const container = document.getElementById('meetings-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Loading meetings...</p></div>';
  
  try {    const response = await fetch(`/api/meetings/otter/transcripts?limit=50`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (data.transcripts && data.transcripts.length > 0) {
      container.innerHTML = data.transcripts.map(meeting => createMeetingCard(meeting)).join('');
      
      // Update count
      document.getElementById('meetings-count').textContent = data.total || data.transcripts.length;
    } else {
      container.innerHTML = `
        <div class="permission-check-box">
          <h3>🎙️ No meetings yet</h3>
          <p><strong>Your Zapier webhook is ready!</strong></p>
          <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 12px; line-height: 1.6;">
            New meetings automatically appear here when:<br>
            1. You record a Zoom meeting with Otter.ai<br>
            2. Otter.ai transcribes it<br>
            3. Zapier sends it to this webhook (Zap ID: 345249969)<br>
            4. It appears here instantly!
          </p>
          <div style="margin-top: 16px; padding: 12px; background: rgba(201,169,98,0.1); border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.7);">
            <strong>📡 Webhook URL:</strong><br>
            <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">
              https://www.investaycapital.com/api/meetings/webhook/zapier
            </code>
          </div>
          <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 12px;">
            Or use manual sync if needed:
          </p>
          <button class="quantum-btn" onclick="showOtterSyncModal()" style="opacity: 0.7;">
            🔄 Manual Sync
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading meetings:', error);
    container.innerHTML = `
      <div class="permission-check-box">
        <p>❌ Error loading meetings. Please try again.</p>
      </div>
    `;
  }
}

function createMeetingCard(meeting) {
  const startDate = new Date(meeting.start_time);
  const duration = Math.round(meeting.duration_seconds / 60);
  
  // Handle speakers - can be JSON array or plain string
  let speakers = [];
  if (meeting.speakers) {
    try {
      // Try to parse as JSON first
      speakers = JSON.parse(meeting.speakers);
      if (!Array.isArray(speakers)) {
        // If it's a parsed string, split by comma
        speakers = [meeting.speakers];
      }
    } catch (e) {
      // Not JSON, treat as comma-separated string
      speakers = meeting.speakers.split(',').map(s => s.trim()).filter(s => s);
    }
  }
  const speakerCount = speakers.length;
  
  // Sanitize title to remove any corrupt characters
  let safeTitle = meeting.title || 'Untitled Meeting';
  // Remove non-printable characters and control characters
  safeTitle = safeTitle.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // If title is empty or only has special chars, use fallback
  if (safeTitle.trim().length === 0) {
    safeTitle = 'Corrupted Meeting Title';
  }
  
  // Create a safe version for onclick attribute (escape quotes and encode)
  const safeTitleForAttr = escapeHtml(safeTitle).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  
  return `
    <div class="meeting-card">
      <div class="meeting-card-content" onclick="openMeetingTranscript(${meeting.id})">
        <div class="meeting-header">
          <div class="meeting-icon">🎙️</div>
          <div class="meeting-info">
            <h3 class="meeting-title">${escapeHtml(safeTitle)}</h3>
            <div class="meeting-meta">
              <span>📅 ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>⏱️ ${duration} min</span>
              <span>👥 ${speakerCount} speaker${speakerCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        
        ${meeting.summary ? `
          <div class="meeting-summary">
            <p>${escapeHtml(meeting.summary.substring(0, 200))}${meeting.summary.length > 200 ? '...' : ''}</p>
          </div>
        ` : ''}
        
        <div class="meeting-footer">
          <span class="meeting-length">${(meeting.transcript_length / 1000).toFixed(1)}k characters</span>
          ${meeting.meeting_url ? `
            <a href="${meeting.meeting_url}" target="_blank" class="meeting-link" onclick="event.stopPropagation()">
              View in Otter.ai →
            </a>
          ` : ''}
        </div>
      </div>
      
      <div class="meeting-card-actions">
        <button class="meeting-delete-btn" onclick="event.stopPropagation(); deleteMeeting(${meeting.id}, '${safeTitleForAttr}');" title="Delete meeting">
          <span class="delete-icon">🗑️</span>
        </button>
      </div>
    </div>
  `;
}

window.openMeetingTranscript = async function(meetingId) {
  try {    const response = await fetch(`/api/meetings/otter/transcripts/${meetingId}`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (data.transcript) {
      showMeetingModal(data.transcript);
    }
  } catch (error) {
    console.error('Error loading transcript:', error);
    showNotification('❌ Failed to load transcript', 'error');
  }
};

function showMeetingModal(meeting) {
  const startDate = new Date(meeting.start_time);
  
  // Handle speakers - can be JSON array or plain string
  let speakers = [];
  if (meeting.speakers) {
    try {
      // Try to parse as JSON first
      speakers = JSON.parse(meeting.speakers);
      if (!Array.isArray(speakers)) {
        // If it's a parsed string, split by comma
        speakers = [meeting.speakers];
      }
    } catch (e) {
      // Not JSON, treat as comma-separated string
      speakers = meeting.speakers.split(',').map(s => s.trim()).filter(s => s);
    }
  }
  
  // Sanitize title to remove any corrupt characters
  let safeTitle = meeting.title || 'Untitled Meeting';
  safeTitle = safeTitle.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  if (safeTitle.trim().length === 0) {
    safeTitle = 'Corrupted Meeting Title';
  }
  const safeTitleForAttr = escapeHtml(safeTitle).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  
  const modalHtml = `
    <div id="meeting-transcript-modal" class="collab-email-modal" onclick="if(event.target === this) closeMeetingModal()">
      <div class="meeting-modal-content">
        <div class="meeting-modal-header">
          <div>
            <h2>🎙️ ${escapeHtml(safeTitle)}</h2>
            <div class="meeting-meta">
              <span>📅 ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>⏱️ ${Math.round(meeting.duration_seconds / 60)} minutes</span>
              <span>👥 ${speakers.length} speakers</span>
            </div>
          </div>
          <button class="collab-email-modal-close" onclick="closeMeetingModal()">×</button>
        </div>
        
        <div class="meeting-modal-body">
          ${meeting.summary ? `
            <div class="meeting-summary-section">
              <h3>📝 Summary</h3>
              <p>${escapeHtml(meeting.summary)}</p>
            </div>
          ` : ''}
          
          ${speakers.length > 0 ? `
            <div class="meeting-speakers-section">
              <h3>👥 Speakers <button onclick="editSpeakers(${meeting.id})" class="edit-speakers-btn" title="Edit speaker names">✏️ Edit</button></h3>
              <div class="speakers-list" id="speakers-list-${meeting.id}">
                ${speakers.map((s, idx) => {
                  const speakerName = escapeHtml(s.name || s.speaker_name || 'Unknown');
                  return `
                    <span class="speaker-tag" data-speaker-index="${idx}">
                      <span class="speaker-name">${speakerName}</span>
                      ${(s.name || s.speaker_name || 'Unknown') === 'Unknown' ? '<span class="unknown-badge" title="Unknown speaker - click Edit to identify">❓</span>' : ''}
                    </span>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="meeting-transcript-section">
            <h3>📄 Full Transcript</h3>
            <div class="transcript-text">
              ${escapeHtml(meeting.transcript_text || 'No transcript available')}
            </div>
          </div>
        </div>
        
        <div class="meeting-modal-footer">
          ${meeting.meeting_url ? `
            <a href="${meeting.meeting_url}" target="_blank" class="collab-email-btn-send">
              <span class="email-btn-icon">🔗</span>
              Open in Otter.ai
            </a>
          ` : ''}
          <button class="collab-email-btn-cancel" onclick="closeMeetingModal()">Close</button>
          <button class="meeting-delete-btn-modal" onclick="deleteMeeting(${meeting.id}, '${safeTitleForAttr}');" title="Delete meeting">
            <span class="delete-icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.closeMeetingModal = function() {
  const modal = document.getElementById('meeting-transcript-modal');
  if (modal) {
    modal.remove();
  }
};

// 🔍 EXTRACT SPEAKERS FROM TRANSCRIPT
function extractSpeakersFromTranscript(transcript) {
  if (!transcript) return [];
  
  const speakers = new Set();
  
  // Pattern 1: "Speaker Name  0:00  " (with double space before AND after timestamp)
  // This matches Otter.ai format: "Vinay Gupta  1:10  \r\n"
  // CRITICAL: Must have full timestamp (X:XX) not just a number
  const timestampPattern = /^(.+?)\s{2,}(\d+:\d+(?::\d+)?)\s+/gm;
  let match;
  
  while ((match = timestampPattern.exec(transcript)) !== null) {
    let name = match[1].trim();
    const timestamp = match[2]; // captured for validation
    
    // Only extract if timestamp is valid (has colon)
    if (!timestamp.includes(':')) continue;
    
    // Clean up: remove any newlines, carriage returns, or extra text
    name = name.split(/[\r\n]+/)[0].trim();
    
    // Only process if it looks like a real name (not too short, not all caps section headers)
    if (name && name.length >= 2 && name.length < 100 && !name.match(/^(SPEAKERS?|TRANSCRIPT|SUMMARY|NOTE|MEETING)$/i)) {
      // Remove role/title in parentheses if present
      const cleanName = name.replace(/\s*\([^)]+\)\s*:?$/, '').trim();
      
      // Further validation: must not contain special chars or numbers at the end
      if (cleanName.length >= 2 && !cleanName.match(/[<>{}[\]]/) && !cleanName.match(/\s+\d+$/)) {
        speakers.add(cleanName);
      }
    }
  }
  
  // Pattern 2: "Speaker Name (Role):" or "Speaker Name:"
  const colonPattern = /^([A-Z][^\n:]+?)(?:\s*\([^)]+\))?\s*:/gm;
  
  while ((match = colonPattern.exec(transcript)) !== null) {
    let name = match[1].trim();
    
    // Clean up: remove any newlines or extra text
    name = name.split(/[\r\n]+/)[0].trim();
    
    if (name && name.length >= 2 && name.length < 100) {
      // Remove role/title in parentheses if present
      const cleanName = name.replace(/\s*\([^)]+\)\s*$/, '').trim();
      if (cleanName.length >= 2 && !cleanName.match(/^(SPEAKERS?|TRANSCRIPT|SUMMARY|NOTE|MEETING)/i) && !cleanName.match(/[<>{}[\]]/) && !cleanName.match(/\s+\d+$/)) {
        speakers.add(cleanName);
      }
    }
  }
  
  return Array.from(speakers).map(name => ({ name }));
}

// ✏️ EDIT SPEAKERS
window.editSpeakers = async function(meetingId) {
  try {
    // Fetch the full meeting data
    const response = await fetch(`/api/meetings/otter/transcripts/${meetingId}`);
    const meeting = await response.json();
    
    if (!meeting) {
      showNotification('❌ Failed to load meeting data', 'error');
      return;
    }
    
    // Parse speakers
    let speakers = [];
    if (meeting.speakers) {
      try {
        speakers = JSON.parse(meeting.speakers);
        if (!Array.isArray(speakers)) {
          speakers = [{ name: meeting.speakers }];
        }
      } catch (e) {
        speakers = meeting.speakers.split(',').map(s => ({ name: s.trim() })).filter(s => s.name);
      }
    }
    
    // If no speakers or empty, extract from transcript
    if (speakers.length === 0 || speakers.every(s => !s.name || s.name === 'Unknown')) {
      const extractedSpeakers = extractSpeakersFromTranscript(meeting.transcript_text);
      if (extractedSpeakers.length > 0) {
        speakers = extractedSpeakers;
      }
    }
    
    // Build editing UI
    const editModalHtml = `
      <div id="edit-speakers-modal" class="collab-email-modal" onclick="if(event.target === this) closeEditSpeakersModal()">
        <div class="collab-email-modal-content" style="max-width: 600px;">
          <div class="collab-email-modal-header">
            <h3>✏️ Edit Unknown Speakers Only</h3>
            <button class="collab-email-modal-close" onclick="closeEditSpeakersModal()">×</button>
          </div>
          
          <div class="collab-email-modal-body">
            <p style="margin-bottom: 20px; color: #666;">
              💡 <strong>Tip:</strong> Identified speakers are locked. You can only edit "Unknown" speakers. 
              The system auto-detects speakers from the transcript.
            </p>
            
            <div id="speakers-edit-list">
              ${speakers.map((speaker, idx) => {
                const speakerName = speaker.name || speaker.speaker_name || 'Unknown';
                const isUnknown = speakerName === 'Unknown' || speakerName.includes('Unknown');
                return `
                  <div class="speaker-edit-row" data-speaker-index="${idx}">
                    <span class="speaker-number">Speaker ${idx + 1}:</span>
                    ${isUnknown ? `
                      <input 
                        type="text" 
                        class="speaker-name-input unknown-speaker" 
                        value="${escapeHtml(speakerName)}"
                        placeholder="Enter speaker name..."
                        data-original="${escapeHtml(speakerName)}"
                      />
                      <span class="unknown-indicator">❓ Unknown - Please Identify</span>
                    ` : `
                      <input 
                        type="text" 
                        class="speaker-name-input locked-speaker" 
                        value="${escapeHtml(speakerName)}"
                        readonly
                        disabled
                        title="This speaker was auto-detected and is locked"
                      />
                      <span class="locked-indicator">🔒 Auto-Detected</span>
                    `}
                  </div>
                `;
              }).join('')}
            </div>
            
            ${speakers.filter(s => (s.name || 'Unknown') === 'Unknown').length > 0 ? '' : `
              <div style="margin-top: 15px; padding: 12px; background: rgba(67, 233, 123, 0.1); border-radius: 8px; color: #43e97b;">
                ✅ All speakers identified! No unknown speakers to edit.
              </div>
            `}
          </div>
          
          <div class="collab-email-modal-footer">
            <button class="collab-email-btn-cancel" onclick="closeEditSpeakersModal()">Close</button>
            ${speakers.filter(s => (s.name || 'Unknown') === 'Unknown' || (s.name || '').includes('Unknown')).length > 0 ? `
              <button class="collab-email-btn-send" onclick="saveSpeakers(${meetingId})">
                <span class="email-btn-icon">💾</span>
                Save Changes
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', editModalHtml);
  } catch (error) {
    console.error('Error opening speaker editor:', error);
    showNotification('❌ Failed to open speaker editor', 'error');
  }
};

window.closeEditSpeakersModal = function() {
  const modal = document.getElementById('edit-speakers-modal');
  if (modal) {
    modal.remove();
  }
};

window.saveSpeakers = async function(meetingId) {
  try {
    // Collect all speaker names (only non-disabled inputs)
    const inputs = document.querySelectorAll('#speakers-edit-list .speaker-name-input:not([disabled])');
    const allRows = document.querySelectorAll('#speakers-edit-list .speaker-edit-row');
    
    const speakers = Array.from(allRows).map((row, idx) => {
      const input = row.querySelector('.speaker-name-input');
      const name = input.value.trim();
      return { name: name || 'Unknown' };
    }).filter(s => s.name);
    
    if (speakers.length === 0) {
      showNotification('⚠️ No speakers found', 'warning');
      return;
    }
    
    showNotification('💾 Saving speaker changes...', 'info');
    
    // Update the meeting with new speakers
    const response = await fetch(`/api/meetings/otter/transcripts/${meetingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        speakers: JSON.stringify(speakers)
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('✅ Speakers updated successfully!', 'success');
      closeEditSpeakersModal();
      closeMeetingModal();
      loadMeetings(); // Refresh the meetings list
    } else {
      showNotification(`❌ ${data.error || 'Failed to update speakers'}`, 'error');
    }
  } catch (error) {
    console.error('Error saving speakers:', error);
    showNotification('❌ Error saving speaker changes', 'error');
  }
};

// 🗑️ DELETE MEETING
window.deleteMeeting = async function(meetingId, meetingTitle) {
  // Decode HTML entities if present
  const titleText = meetingTitle ? meetingTitle.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : 'this meeting';
  
  // Confirm deletion
  const confirmed = confirm(`Are you sure you want to delete this meeting?\n\n"${titleText}"\n\nThis action cannot be undone.`);
  
  if (!confirmed) {
    return;
  }
  
  try {
    showNotification('🗑️ Deleting meeting...', 'info');    const response = await fetch(`/api/meetings/otter/transcripts/${meetingId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(`✅ Meeting deleted successfully!`, 'success');
      
      // Close modal if open
      closeMeetingModal();
      
      // Reload meetings list
      loadMeetings();
    } else {
      showNotification(`❌ ${data.error || 'Failed to delete meeting'}`, 'error');
    }
  } catch (error) {
    console.error('Error deleting meeting:', error);
    showNotification('❌ Error deleting meeting', 'error');
  }
};

window.showOtterSyncModal = function() {
  const modalHtml = `
    <div id="otter-sync-modal" class="collab-email-modal" onclick="if(event.target === this) closeOtterSyncModal()">
      <div class="collab-email-modal-content">
        <div class="collab-email-modal-header">
          <h3>🔄 Sync from Zapier Tables</h3>
          <button class="collab-email-modal-close" onclick="closeOtterSyncModal()">×</button>
        </div>
        
        <div class="collab-email-modal-body">
          <div class="collab-email-form-group">
            <label>Zapier API Key:</label>
            <input type="password" id="zapier-api-key" placeholder="Enter your Zapier API key...">
            <small>
              Get your API key from <a href="https://zapier.com/app/settings/api" target="_blank" style="color: #C9A962;">Zapier Settings → API</a>
            </small>
          </div>
          
          <div class="info-box" style="margin-top: 16px; padding: 12px; background: rgba(201, 169, 98, 0.1); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 13px;">
            <p><strong>ℹ️ How it works:</strong></p>
            <ol style="margin: 8px 0 0 20px; padding: 0;">
              <li>Your Zap automatically sends Otter.ai meetings to Zapier Tables</li>
              <li>Table ID: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">01KFP9A1JMZYREQSMBWGGQ726Q</code></li>
              <li>This sync pulls all meetings from your Zapier Table</li>
              <li>Run sync anytime to get latest meetings!</li>
            </ol>
          </div>
        </div>
        
        <div class="collab-email-modal-footer">
          <button class="collab-email-btn-cancel" onclick="closeOtterSyncModal()">Cancel</button>
          <button class="collab-email-btn-send" onclick="syncFromZapier()">
            <span class="email-btn-icon">🔄</span>
            Sync Meetings
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  setTimeout(() => {
    document.getElementById('zapier-api-key').focus();
  }, 100);
};

window.closeOtterSyncModal = function() {
  const modal = document.getElementById('otter-sync-modal');
  if (modal) {
    modal.remove();
  }
};

// 📤 MANUAL MEETING UPLOAD MODAL
window.showManualUploadModal = function() {
  const modalHtml = `
    <div id="manual-upload-modal" class="collab-email-modal" onclick="if(event.target === this) closeManualUploadModal()">
      <div class="manual-upload-modal-content">
        <div class="collab-email-modal-header">
          <h3>📤 Upload Historical Meeting</h3>
          <button class="collab-email-modal-close" onclick="closeManualUploadModal()">×</button>
        </div>
        
        <div class="collab-email-modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div class="info-box" style="margin-bottom: 20px; padding: 12px; background: rgba(201, 169, 98, 0.1); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 13px;">
            <p><strong>ℹ️ Three Ways to Upload:</strong></p>
            <ol style="margin: 8px 0 0 20px; padding: 0;">
              <li><strong>Upload TXT/DOCX</strong> - Drag & drop or select your transcript file (✅ Recommended - easiest)</li>
              <li><strong>Upload PDF</strong> - PDF support (may have formatting issues)</li>
              <li><strong>Manual Entry</strong> - Copy/paste text manually into the form below</li>
            </ol>
          </div>
          
          <!-- File Upload Section -->
          <div class="file-upload-section" style="margin-bottom: 24px;">
            <div class="file-dropzone" id="file-dropzone">
              <div class="file-dropzone-content">
                <span style="font-size: 48px; margin-bottom: 12px;">📄</span>
                <h3 style="margin: 0 0 8px 0; color: #fff;">Drop File Here</h3>
                <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                  Supports: TXT, DOCX, PDF
                </p>
                <p style="margin: 0 0 12px 0; color: #C9A962; font-size: 13px; font-weight: 600;">
                  📦 Bulk Upload: Select up to 50 files at once!
                </p>
                <input type="file" id="file-input" accept=".txt,.docx,.pdf" multiple style="display: none;">
                <button type="button" class="quantum-btn" onclick="document.getElementById('file-input').click()">
                  Choose File
                </button>
              </div>
            </div>
            <div id="file-upload-status" style="margin-top: 12px; display: none;"></div>
          </div>
          
          <div style="text-align: center; margin: 20px 0; color: rgba(255,255,255,0.4); font-size: 13px;">
            — OR ENTER MANUALLY —
          </div>
          
          <div class="collab-email-form-group">
            <label>Meeting Title: *</label>
            <input type="text" id="manual-title" placeholder="e.g., AS Legal __ Mattereum" required>
          </div>
          
          <div class="collab-email-form-group">
            <label>Full Transcript: *</label>
            <textarea id="manual-transcript" rows="8" placeholder="Paste the full transcript text here..." required></textarea>
            <small>Copy the entire transcript from your PDF</small>
          </div>
          
          <div class="collab-email-form-group">
            <label>Summary:</label>
            <textarea id="manual-summary" rows="4" placeholder="Meeting summary (optional)"></textarea>
            <small>If available, paste the summary from the transcript</small>
          </div>
          
          <div class="collab-email-form-group">
            <label>Meeting URL:</label>
            <input type="url" id="manual-url" placeholder="https://otter.ai/note/...">
            <small>Otter.ai meeting URL (if available)</small>
          </div>
          
          <div class="collab-email-form-group">
            <label>Owner Name:</label>
            <input type="text" id="manual-owner" placeholder="e.g., Ahmed Abou El-Enin">
            <small>Person who recorded/owns the meeting</small>
          </div>
          
          <div class="collab-email-form-group">
            <label>Date Created:</label>
            <input type="datetime-local" id="manual-date">
            <small>Meeting date and time</small>
          </div>
        </div>
        
        <div class="collab-email-modal-footer">
          <button class="collab-email-btn-cancel" onclick="closeManualUploadModal()">Cancel</button>
          <button class="collab-email-btn-send" onclick="uploadManualMeeting()">
            <span class="email-btn-icon">📤</span>
            Upload Meeting
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Set default date to now
  const dateInput = document.getElementById('manual-date');
  if (dateInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
  }
  
  // Setup PDF upload handlers
  setupFileUpload();
  
  setTimeout(() => {
    document.getElementById('manual-title').focus();
  }, 100);
};

function setupFileUpload() {
  const dropzone = document.getElementById('file-dropzone');
  const fileInput = document.getElementById('file-input');
  
  if (!dropzone || !fileInput) return;
  
  // Drag & Drop handlers
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#C9A962';
    dropzone.style.background = 'rgba(201, 169, 98, 0.1)';
  });
  
  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    dropzone.style.background = 'rgba(255, 255, 255, 0.03)';
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    dropzone.style.background = 'rgba(255, 255, 255, 0.03)';
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleBulkFileUpload(files);
    }
  });
  
  // File input handler
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleBulkFileUpload(files);
    }
  });
  
  // Click to open file picker
  dropzone.addEventListener('click', (e) => {
    if (e.target === dropzone || e.target.closest('.file-dropzone-content')) {
      fileInput.click();
    }
  });
}

async function handleFileUpload(file) {
  const allowedTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ];
  
  const allowedExtensions = ['.txt', '.docx', '.pdf'];
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    showNotification('❌ Please upload a TXT, DOCX, or PDF file', 'error');
    return;
  }
  
  const statusDiv = document.getElementById('file-upload-status');
  statusDiv.style.display = 'block';
  
  const fileType = fileExtension === '.txt' ? 'TXT' : 
                   fileExtension === '.docx' ? 'DOCX' : 'PDF';
  
  statusDiv.innerHTML = `
    <div style="padding: 12px; background: rgba(201, 169, 98, 0.1); border-radius: 8px; color: #fff;">
      <strong>📄 ${file.name}</strong> (${(file.size / 1024).toFixed(0)} KB)<br>
      <small style="color: rgba(255,255,255,0.7);">🔄 Extracting text from ${fileType}...</small>
    </div>
  `;
  
  try {
    // Handle TXT files directly in browser
    if (fileExtension === '.txt') {
      const text = await file.text();
      
      // Auto-fill form
      const title = file.name.replace('.txt', '');
      document.getElementById('manual-title').value = title;
      document.getElementById('manual-transcript').value = text;
      
      // Try to extract summary if present
      const summaryMatch = text.match(/SUMMARY\s*[:\n]+(.*?)(?=\n\n|SPEAKERS|$)/is);
      if (summaryMatch) {
        document.getElementById('manual-summary').value = summaryMatch[1].trim();
      }
      
      // Try to extract date
      const dateMatch = text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(\w+\s+\d+,\s+\d{4}\s+\d+:\d+\s*[AP]M)/i);
      if (dateMatch) {
        const dateStr = new Date(dateMatch[0]).toISOString().slice(0, 16);
        document.getElementById('manual-date').value = dateStr;
      }
      
      // Try to extract owner/speakers
      const speakersMatch = text.match(/SPEAKERS\s*[:\n]+(.*?)(?=\n\n|TRANSCRIPT|$)/is);
      if (speakersMatch) {
        const speakers = speakersMatch[1].trim().split(/,\s*/);
        if (speakers.length > 0) {
          document.getElementById('manual-owner').value = speakers[0].trim();
        }
      }
      
      statusDiv.innerHTML = `
        <div style="padding: 12px; background: rgba(67, 233, 123, 0.1); border-radius: 8px; color: #43e97b;">
          <strong>✅ TXT File Loaded Successfully!</strong><br>
          <small style="color: rgba(255,255,255,0.7);">
            Fields auto-filled. Review and upload!
          </small>
        </div>
      `;
      
      return;
    }
    
    // For DOCX and PDF, send to backend
    const formData = new FormData();
    formData.append('file', file);    const response = await fetch('/api/meetings/parse-file', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Auto-fill form with extracted data
      document.getElementById('manual-title').value = data.title || file.name.replace(/\.(docx|pdf)$/, '');
      document.getElementById('manual-transcript').value = data.transcript || '';
      document.getElementById('manual-summary').value = data.summary || '';
      
      if (data.date) {
        document.getElementById('manual-date').value = data.date;
      }
      
      if (data.owner) {
        document.getElementById('manual-owner').value = data.owner;
      }
      
      statusDiv.innerHTML = `
        <div style="padding: 12px; background: rgba(67, 233, 123, 0.1); border-radius: 8px; color: #43e97b;">
          <strong>✅ ${fileType} Extracted Successfully!</strong><br>
          <small style="color: rgba(255,255,255,0.7);">
            Title, transcript, and other fields have been auto-filled. Review and upload!
          </small>
        </div>
      `;
      
      showNotification('✅ PDF extracted successfully!', 'success');
    } else {
      statusDiv.innerHTML = `
        <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; color: #ef4444;">
          <strong>❌ Failed to extract PDF</strong><br>
          <small style="color: rgba(255,255,255,0.7);">${data.error || 'Unknown error'}</small>
        </div>
      `;
      showNotification('❌ Failed to extract PDF. Try manual entry.', 'error');
    }
  } catch (error) {
    console.error('PDF upload error:', error);
    statusDiv.innerHTML = `
      <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; color: #ef4444;">
        <strong>❌ Upload Error</strong><br>
        <small style="color: rgba(255,255,255,0.7);">Please try manual entry instead.</small>
      </div>
    `;
    showNotification('❌ PDF upload failed. Try manual entry.', 'error');
  }
}

async function handleBulkFileUpload(files) {
  const filesArray = Array.from(files);
  const MAX_FILES = 50;
  
  if (filesArray.length > MAX_FILES) {
    showNotification(`❌ Maximum ${MAX_FILES} files allowed. You selected ${filesArray.length} files.`, 'error');
    return;
  }
  
  const allowedTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ];
  
  const allowedExtensions = ['.txt', '.docx', '.pdf'];
  
  // Filter valid files
  const validFiles = filesArray.filter(file => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
  });
  
  if (validFiles.length === 0) {
    showNotification('❌ No valid files found. Please upload TXT, DOCX, or PDF files.', 'error');
    return;
  }
  
  if (validFiles.length < filesArray.length) {
    showNotification(`⚠️ ${filesArray.length - validFiles.length} invalid file(s) skipped. Processing ${validFiles.length} valid files.`, 'warning');
  }
  
  const statusDiv = document.getElementById('file-upload-status');
  statusDiv.style.display = 'block';
  
  // Single file upload - use existing logic
  if (validFiles.length === 1) {
    await handleFileUpload(validFiles[0]);
    return;
  }
  
  // Bulk upload
  statusDiv.innerHTML = `
    <div style="padding: 12px; background: rgba(201, 169, 98, 0.1); border-radius: 8px; color: #fff;">
      <strong>📦 Bulk Upload: ${validFiles.length} files</strong><br>
      <small style="color: rgba(255,255,255,0.7);">🔄 Processing files...</small>
      <div id="bulk-progress" style="margin-top: 8px;"></div>
    </div>
  `;
  
  const progressDiv = document.getElementById('bulk-progress');
  let successCount = 0;
  let failCount = 0;
  
  // Close the modal and show progress notification
  closeManualUploadModal();
  showNotification(`📦 Bulk upload started: ${validFiles.length} files`, 'info');
  
  // Process files sequentially to avoid overwhelming the server
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    try {
      let title, transcript, summary, dateCreated, ownerName;
      
      // Handle TXT files directly
      if (fileExtension === '.txt') {
        const text = await file.text();
        title = file.name.replace('.txt', '');
        transcript = text;
        
        // Try to extract summary
        const summaryMatch = text.match(/SUMMARY\s*[:\n]+(.*?)(?=\n\n|SPEAKERS|TRANSCRIPT|$)/is);
        if (summaryMatch) {
          summary = summaryMatch[1].trim();
        }
        
        // Try to extract date
        const dateMatch = text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(\w+\s+\d+,\s+\d{4}\s+\d+:\d+\s*[AP]M)/i);
        if (dateMatch) {
          dateCreated = new Date(dateMatch[0]).toISOString();
        }
        
        // Try to extract speakers from SPEAKERS section OR transcript
        let speakers = [];
        const speakersMatch = text.match(/SPEAKERS\s*[:\n]+(.*?)(?=\n\n|TRANSCRIPT|$)/is);
        if (speakersMatch) {
          speakers = speakersMatch[1].trim().split(/,\s*/).map(s => ({ name: s.trim() })).filter(s => s.name);
        }
        
        // If no speakers found, auto-extract from transcript
        if (speakers.length === 0) {
          speakers = extractSpeakersFromTranscript(transcript);
        }
        
        // Set owner to first speaker
        if (speakers.length > 0) {
          ownerName = speakers[0].name;
        }
        
        // Upload to backend with extracted speakers
        const response = await fetch('/api/meetings/otter/transcripts', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            transcript_text: transcript,
            summary: summary || '',
            meeting_url: '',
            owner_name: ownerName || 'Unknown',
            date_created: dateCreated,
            speakers: speakers.length > 0 ? JSON.stringify(speakers) : undefined
          })
        });
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        successCount++;
        progressDiv.innerHTML = `✅ ${successCount}/${validFiles.length} uploaded: ${file.name}`;
        
      } else {
        // Handle DOCX/PDF via backend
        const formData = new FormData();
        formData.append('file', file);
        
        const parseResponse = await fetch('/api/meetings/parse-file', {
          method: 'POST',
          body: formData
        });
        
        const parseData = await parseResponse.json();
        
        if (!parseData.success) {
          throw new Error(parseData.error || 'Extraction failed');
        }
        
        title = parseData.title || file.name.replace(/\.(docx|pdf)$/, '');
        transcript = parseData.transcript || '';
        summary = parseData.summary || '';
        dateCreated = parseData.date;
        ownerName = parseData.owner;
        
        // Extract speakers from transcript
        const speakers = extractSpeakersFromTranscript(transcript);
        
        // Upload to backend
        const response = await fetch('/api/meetings/otter/transcripts', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || `Meeting ${i + 1}`,
            transcript_text: transcript,
            summary: summary || '',
            meeting_url: '',
            owner_name: ownerName || (speakers.length > 0 ? speakers[0].name : 'Unknown'),
            date_created: dateCreated || new Date().toISOString(),
            speakers: speakers.length > 0 ? JSON.stringify(speakers) : undefined
          })
        });
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        successCount++;
        progressDiv.innerHTML = `✅ ${successCount}/${validFiles.length} uploaded: ${file.name}`;
      }
    } catch (error) {
      failCount++;
      console.error(`❌ Error processing ${file.name}:`, error);
    }
    
    // Update progress
    showNotification(`📦 Progress: ${i + 1}/${validFiles.length} (✅${successCount} ❌${failCount})`, 'info');
  }
  
  // Show final result
  if (failCount === 0) {
    showNotification(`🎉 Bulk upload complete! Successfully uploaded ${successCount} meetings!`, 'success');
  } else {
    showNotification(`⚠️ Bulk upload finished: ${successCount} succeeded, ${failCount} failed`, 'warning');
  }
  
  // Refresh the meetings list
  setTimeout(() => {
    location.reload();
  }, 2000);
}

window.closeManualUploadModal = function() {
  const modal = document.getElementById('manual-upload-modal');
  if (modal) {
    modal.remove();
  }
};

window.uploadManualMeeting = async function() {
  const title = document.getElementById('manual-title').value.trim();
  const transcript = document.getElementById('manual-transcript').value.trim();
  const summary = document.getElementById('manual-summary').value.trim();
  const meetingUrl = document.getElementById('manual-url').value.trim();
  const ownerName = document.getElementById('manual-owner').value.trim() || 'Unknown';
  const dateCreated = document.getElementById('manual-date').value;
  
  if (!title) {
    showNotification('❌ Please enter a meeting title', 'error');
    return;
  }
  
  if (!transcript) {
    showNotification('❌ Please enter the meeting transcript', 'error');
    return;
  }
  
  try {
    showNotification('📤 Uploading meeting...', 'info');
    
    // Format date to ISO 8601
    const isoDate = dateCreated ? new Date(dateCreated).toISOString() : new Date().toISOString();
    
    // Post directly to webhook endpoint (same as Zapier would)
    const response = await fetch('/api/meetings/webhook/zapier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        transcript: transcript,
        summary: summary,
        meeting_url: meetingUrl,
        owner_name: ownerName,
        date_created: isoDate
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(`✅ Meeting "${title}" uploaded successfully!`, 'success');
      closeManualUploadModal();
      loadMeetings(); // Reload meetings list
    } else {
      showNotification(`❌ ${data.error || 'Failed to upload meeting'}`, 'error');
    }
  } catch (error) {
    console.error('Error uploading meeting:', error);
    showNotification('❌ Error uploading meeting', 'error');
  }
};

window.closeOtterSyncModal = function() {
  const modal = document.getElementById('otter-sync-modal');
  if (modal) {
    modal.remove();
  }
};

window.syncFromZapier = async function() {
  const apiKey = document.getElementById('zapier-api-key').value.trim();
  
  if (!apiKey) {
    showNotification('❌ Please enter your Zapier API key', 'error');
    return;
  }
  
  try {
    showNotification('🔄 Syncing meetings from Zapier Tables...', 'info');    const response = await fetch(`/api/meetings/zapier/sync`, {
      method: 'POST',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({ zapierApiKey: apiKey })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(`✅ ${data.message}`, 'success');
      closeOtterSyncModal();
      loadMeetings(); // Reload meetings list
    } else {
      showNotification(`❌ ${data.error || 'Failed to sync meetings'}`, 'error');
    }
  } catch (error) {
    console.error('Error syncing Zapier:', error);
    showNotification('❌ Error syncing meetings', 'error');
  }
};

// Setup sync button
document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('sync-otter-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', showOtterSyncModal);
  }
  
  const manualUploadBtn = document.getElementById('manual-upload-btn');
  if (manualUploadBtn) {
    manualUploadBtn.addEventListener('click', showManualUploadModal);
  }
  
  // Setup search
  const searchInput = document.getElementById('meetings-search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchMeetings(e.target.value);
      }, 500);
    });
  }
});

async function searchMeetings(query) {
  if (!query) {
    loadMeetings();
    return;
  }
  
  const container = document.getElementById('meetings-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Searching...</p></div>';
  
  try {    const response = await fetch(`/api/meetings/otter/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      container.innerHTML = data.results.map(meeting => createMeetingCard(meeting)).join('');
    } else {
      container.innerHTML = `
        <div class="permission-check-box">
          <p>No meetings found for "${escapeHtml(query)}"</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error searching meetings:', error);
    container.innerHTML = `
      <div class="permission-check-box">
        <p>❌ Error searching meetings</p>
      </div>
    `;
  }
}

// 📧 COMPOSE EMAIL MODAL
window.openComposeEmailModal = function(toEmail, toName) {
  console.log('📧 Opening compose email modal for:', toEmail);
  
  // Create modal HTML
  const modalHtml = `
    <div id="compose-email-modal" class="collab-email-modal" onclick="if(event.target === this) closeComposeEmailModal()">
      <div class="collab-email-modal-content">
        <div class="collab-email-modal-header">
          <h3>📧 Compose Email</h3>
          <button class="collab-email-modal-close" onclick="closeComposeEmailModal()">×</button>
        </div>
        
        <div class="collab-email-modal-body">
          <div class="collab-email-form-group">
            <label>To:</label>
            <input type="email" id="email-to" value="${toEmail}" readonly>
            <small>${toName}</small>
          </div>
          
          <div class="collab-email-form-group">
            <label>Subject:</label>
            <input type="text" id="email-subject" placeholder="Enter email subject..." autofocus>
          </div>
          
          <div class="collab-email-form-group">
            <label>Message:</label>
            <textarea id="email-body" rows="10" placeholder="Write your message..."></textarea>
          </div>
        </div>
        
        <div class="collab-email-modal-footer">
          <button class="collab-email-btn-cancel" onclick="closeComposeEmailModal()">Cancel</button>
          <button class="collab-email-btn-send" onclick="sendTeamEmail()">
            <span class="email-btn-icon">📤</span>
            Send Email
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Focus subject field
  setTimeout(() => {
    document.getElementById('email-subject').focus();
  }, 100);
};

window.closeComposeEmailModal = function() {
  const modal = document.getElementById('compose-email-modal');
  if (modal) {
    modal.remove();
  }
};

// 🎯 SMART COMPOSE MODAL - Pre-filled with AI draft
window.openSmartComposeModal = function(toEmail, toName, emailDraft) {
  console.log('✨ Opening smart compose modal for:', toEmail);
  
  // Parse subject and body from draft
  const subjectMatch = emailDraft.match(/Subject:\s*(.+?)(?:\n|$)/);
  const subject = subjectMatch ? subjectMatch[1].trim() : '';
  
  // Get body (everything after subject line)
  const bodyMatch = emailDraft.match(/Subject:.*?\n\n([\s\S]+)/);
  const body = bodyMatch ? bodyMatch[1].trim() : emailDraft;
  
  // Create modal HTML with AI tools
  const modalHtml = `
    <div id="compose-email-modal" class="collab-email-modal smart-modal" onclick="if(event.target === this) closeComposeEmailModal()">
      <div class="collab-email-modal-content">
        <div class="collab-email-modal-header">
          <h3>✨ AI-Assisted Email</h3>
          <span class="ai-badge-modal">NOVA Generated</span>
          <button class="collab-email-modal-close" onclick="closeComposeEmailModal()">×</button>
        </div>
        
        <div class="collab-email-modal-body">
          <div class="collab-email-form-group">
            <label>To:</label>
            <input type="email" id="email-to" value="${escapeHtml(toEmail)}" readonly>
            <small>${escapeHtml(toName)}</small>
          </div>
          
          <div class="collab-email-form-group">
            <label>Subject:</label>
            <input type="text" id="email-subject" value="${escapeHtml(subject)}" placeholder="Enter email subject...">
          </div>
          
          <div class="collab-email-form-group">
            <label>Message:</label>
            <div class="email-toolbar">
              <button class="tool-btn" onclick="aiImproveEmail(); event.stopPropagation();" title="AI Improve">✨ Improve</button>
              <button class="tool-btn" onclick="aiShorten(); event.stopPropagation();" title="Shorten">📝 Shorten</button>
              <button class="tool-btn" onclick="aiExpand(); event.stopPropagation();" title="Expand">📋 Expand</button>
              <button class="tool-btn" onclick="aiFormal(); event.stopPropagation();" title="Make Formal">👔 Formal</button>
            </div>
            <textarea id="email-body" rows="12" placeholder="Write your message...">${escapeHtml(body)}</textarea>
          </div>
          
          <div class="collab-email-form-group">
            <label>Attachments:</label>
            <div class="attachment-buttons">
              <button class="attach-btn" onclick="openFileBankModal(); event.stopPropagation();">📁 From FileBank</button>
              <button class="attach-btn" onclick="openComputerUpload(); event.stopPropagation();">💻 From Computer</button>
            </div>
            <div id="attachments-list" class="attachments-list"></div>
          </div>
        </div>
        
        <div class="collab-email-modal-footer">
          <button class="collab-email-btn-cancel" onclick="closeComposeEmailModal()">Cancel</button>
          <button class="collab-email-btn-send" onclick="sendTeamEmail()">
            <span class="email-btn-icon">📤</span>
            Send Email
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Focus subject field
  setTimeout(() => {
    document.getElementById('email-subject').focus();
  }, 100);
};

// AI Email Enhancement Functions (placeholder - will integrate with AI API later)
window.aiImproveEmail = function() {
  showNotification('✨ AI improving your email...', 'info');
  // TODO: Call AI API to improve email
  setTimeout(() => {
    showNotification('✅ Email improved!', 'success');
  }, 1000);
};

window.aiShorten = function() {
  const body = document.getElementById('email-body');
  if (body && body.value.length > 100) {
    // Simple shortening for now
    const text = body.value;
    const sentences = text.split('. ');
    body.value = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
    showNotification('📝 Email shortened!', 'success');
  }
};

window.aiExpand = function() {
  showNotification('📋 AI expanding your email...', 'info');
  // TODO: Call AI API to expand email
};

window.aiFormal = function() {
  const body = document.getElementById('email-body');
  if (body) {
    let text = body.value;
    // Simple formalization
    text = text.replace(/\bhi\b/gi, 'Hello');
    text = text.replace(/\bthanks\b/gi, 'Thank you');
    text = text.replace(/\bbye\b/gi, 'Best regards');
    body.value = text;
    showNotification('👔 Email formalized!', 'success');
  }
};

window.openFileBankModal = function() {
  showNotification('📁 FileBank integration coming soon!', 'info');
  // TODO: Implement FileBank modal
};

window.openComputerUpload = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.onchange = (e) => {
    const files = Array.from(e.target.files);
    const list = document.getElementById('attachments-list');
    files.forEach(file => {
      list.innerHTML += `<div class="attachment-item">📎 ${file.name} <button onclick="this.parentElement.remove()">×</button></div>`;
    });
    showNotification(`✅ Added ${files.length} file(s)`, 'success');
  };
  input.click();
};

window.sendTeamEmail = async function() {
  const to = document.getElementById('email-to').value;
  const subject = document.getElementById('email-subject').value.trim();
  const body = document.getElementById('email-body').value.trim();
  
  if (!subject) {
    showNotification('❌ Please enter a subject', 'error');
    return;
  }
  
  if (!body) {
    showNotification('❌ Please enter a message', 'error');
    return;
  }
  
  try {    const response = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        body
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('✅ Email sent successfully!', 'success');
      closeComposeEmailModal();
    } else {
      showNotification(`❌ ${data.error || 'Failed to send email'}`, 'error');
    }
  } catch (error) {
    console.error('Send email error:', error);
    showNotification('❌ Error sending email', 'error');
  }
};

// ===== TASKS FUNCTIONALITY =====
let allTasks = [];
let currentTaskFilter = 'all';

async function loadTasks() {
  console.log('📋 Loading tasks...');
  try {
    
    const res = await fetch('/api/tasks', { credentials: 'include' });
    
    console.log('📊 Tasks API response:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Tasks loaded:', data.tasks?.length || 0);
      allTasks = data.tasks || [];
      const tasksCountEl = document.getElementById('tasks-count');
      if (tasksCountEl) {
        tasksCountEl.textContent = allTasks.filter(t => t.status !== 'completed').length;
      }
      renderTasks();
    } else {
      const error = await res.text();
      console.error('❌ Tasks API error:', res.status, error);
    }
  } catch (error) {
    console.error('❌ Error loading tasks:', error);
  }
}

// 🎨 SMART TASK CARD RENDERER - Beautiful, organized display
function renderSmartTaskCard(task) {
  const desc = task.description || '';
  
  // Check if this is a NOVA-generated smart task with structured data
  const isSmartTask = desc.includes('📧 FOUND EMAIL ADDRESSES') || 
                      desc.includes('📝 EMAIL DRAFT') ||
                      desc.includes('🔍 VERIFY CONTACT INFO');
  
  if (isSmartTask) {
    return renderSmartEmailTask(task);
  }
  
  // Regular task rendering
  return `
    <div class="task-card ${task.status}" data-id="${task.id}">
      <div class="task-header">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.status === 'completed' ? 'checked' : ''}
          onchange="toggleTask(${task.id}, this.checked)"
        />
        <h3 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.title)}</h3>
      </div>
      <p class="task-description">${escapeHtml(desc)}</p>
      <div class="task-meta">
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        ${task.due_date ? `<span class="due-date">📅 ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
        ${task.source_type === 'meeting' ? '<span class="source-badge">🎙️ From Meeting</span>' : ''}
      </div>
      <div class="task-actions">
        <button class="task-btn-edit" onclick="editTask(${task.id})">Edit</button>
        <button class="task-btn-delete" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `;
}

// 🎯 SIMPLE ORGANIZED SMART EMAIL TASK CARD
function renderSmartEmailTask(task) {
  const desc = task.description || '';
  
  // Parse structured data
  const recipient = task.title.replace('Email ', '').trim();
  
  // Extract meeting context
  const meetingContextMatch = desc.match(/From meeting: ([^\n]+)/);
  const meetingTitle = meetingContextMatch ? meetingContextMatch[1] : 'Unknown Meeting';
  
  // Extract email addresses (support both old and new format)
  const emailsMatch = desc.match(/📧 FOUND EMAIL ADDRESSES (?:TO TRY|WITH SOURCES)?:([\s\S]*?)(?=\n\n|📝|🌐|🔍|$)/);
  
  let emails = [];
  if (emailsMatch) {
    const emailSection = emailsMatch[1].trim();
    // Parse emails with source URLs (new format)
    // Format: • email\n  📍 source
    const lines = emailSection.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('•')) {
        const email = line.replace('• ', '').trim();
        // Check if next line has source
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('📍')) {
          const source = nextLine.replace('📍 ', '').replace('Source: ', '').trim();
          emails.push({ email, source });
          i++; // Skip the source line
        } else {
          emails.push({ email, source: null });
        }
      }
    }
  }
  
  // Extract email draft
  const draftMatch = desc.match(/📝 EMAIL DRAFT \(ready to copy\):([\s\S]*?)(?=\n\n🔍|$)/);
  const emailDraft = draftMatch ? draftMatch[1].trim() : '';
  
  // Extract verification links
  const linksMatch = desc.match(/🔍 VERIFY CONTACT INFO AT:([\s\S]*?)(?=\n\n|Meeting context|$)/);
  const links = linksMatch ? linksMatch[1].trim().split('\n').map(l => {
    const match = l.match(/• ([^:]+): (.+)/);
    return match ? { name: match[1], url: match[2] } : null;
  }).filter(l => l) : [];
  
  // Build clean organized description
  let organizedDesc = '';
  
  // Task context section
  organizedDesc += `<div class="info-section task-context">
    <strong>📍 Task Context:</strong><br>
    <span class="context-line">Action: Follow up with ${escapeHtml(recipient)}</span><br>
    <span class="context-line">Source: ${escapeHtml(meetingTitle)}</span>
    ${task.source_id ? `<br><a href="/collaborate#meetings" class="meeting-link" onclick="event.stopPropagation();">🎙️ View Meeting</a>` : ''}
  </div>`;
  
  if (emails.length > 0) {
    organizedDesc += '<div class="info-section"><strong>📧 Email Addresses:</strong><br>';
    emails.forEach((item, i) => {
      const email = typeof item === 'object' ? item.email : item;
      const source = typeof item === 'object' ? item.source : null;
      
      const escapedEmail = escapeHtml(email);
      const escapedDraft = emailDraft.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      
      organizedDesc += `<span class="email-line">
        ${i === 0 ? '⭐' : '•'} <strong>${escapedEmail}</strong> 
        <button class="copy-mini" onclick="copyToClipboard('${escapedEmail}'); event.stopPropagation();" title="Copy">📋</button>
        <button class="compose-mini" onclick="openSmartComposeModal('${escapedEmail}', '${escapeHtml(recipient)}', \`${escapedDraft}\`); event.stopPropagation();" title="Compose email">✉️ Compose</button>
      </span>`;
      
      if (source) {
        organizedDesc += `<br><span class="email-source" style="margin-left: 20px; font-size: 0.9em; color: #888;">📍 <a href="${source}" target="_blank" rel="noopener" onclick="event.stopPropagation();" style="color: #4a9eff;">${escapeHtml(source)}</a></span>`;
      }
      
      organizedDesc += '<br>';
    });
    organizedDesc += '</div>';
  }
  
  if (emailDraft) {
    organizedDesc += '<div class="info-section"><strong>📝 Email Draft:</strong> <button class="copy-mini" onclick="copyToClipboard(\`' + emailDraft.replace(/`/g, '\\`').replace(/\$/g, '\\$') + '\`); event.stopPropagation();" title="Copy draft">📋 Copy All</button><br><pre class="draft-preview">' + escapeHtml(emailDraft) + '</pre></div>';
  }
  
  if (links.length > 0) {
    organizedDesc += '<div class="info-section"><strong>🔍 Verify Contact:</strong><br>';
    links.forEach(link => {
      organizedDesc += `<a href="${link.url}" target="_blank" rel="noopener" class="verify-mini" onclick="event.stopPropagation();">🔗 ${escapeHtml(link.name)}</a> `;
    });
    organizedDesc += '</div>';
  }
  
  // Use SAME card design as regular tasks
  return `
    <div class="task-card ${task.status}" data-id="${task.id}">
      <div class="task-header">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.status === 'completed' ? 'checked' : ''}
          onchange="toggleTask(${task.id}, this.checked)"
        />
        <h3 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.title)} <span class="ai-badge">✨ AI</span></h3>
      </div>
      <div class="task-description organized-info">
        ${organizedDesc}
      </div>
      <div class="task-meta">
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        ${task.due_date ? `<span class="due-date">📅 ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
        ${task.source_type === 'meeting' ? '<span class="source-badge">🎙️ From Meeting</span>' : ''}
      </div>
      <div class="task-actions">
        <button class="task-btn-delete" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `;
}

// Copy to clipboard helper
window.copyToClipboard = async function(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('✅ Copied to clipboard!', 'success');
  } catch (err) {
    console.error('Copy failed:', err);
    showNotification('❌ Copy failed', 'error');
  }
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  const filtered = currentTaskFilter === 'all' 
    ? allTasks 
    : allTasks.filter(t => t.status === currentTaskFilter);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No tasks yet</h3>
        <p>Create tasks from meetings or add them manually</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(task => renderSmartTaskCard(task)).join('');
}

async function toggleTask(id, completed) {
  try {    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
                'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: completed ? 'completed' : 'pending'
      })
    });
    
    if (res.ok) {
      await loadTasks();
      showNotification(completed ? '✅ Task completed!' : '📋 Task reopened', 'success');
    }
  } catch (error) {
    console.error('Error toggling task:', error);
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  
  try {    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (res.ok) {
      await loadTasks();
      showNotification('✅ Task deleted', 'success');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

// Filter buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTaskFilter = btn.dataset.filter;
      renderTasks();
    });
  });
});

// Make functions global
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

// ========================================
// 🔴 LIVE BOARD FUNCTIONALITY
// ========================================

// Live Board State
let liveBoardPosts = [];
let currentFilter = 'all';
let liveBoardInitialized = false;

// Load Live Board (wrapper for switchView)
async function loadLiveBoard() {
  if (!liveBoardInitialized) {
    await initLiveBoard();
    liveBoardInitialized = true;
  } else {
    // Just reload posts if already initialized
    await loadLiveBoardPosts();
  }
}

// Setup Live Board Composer (wrapper for loadInitialData)
function setupLiveBoardComposer() {
  // This is handled by initLiveBoard, so just a placeholder
  if (!liveBoardInitialized) {
    initLiveBoard();
    liveBoardInitialized = true;
  }
}

// Initialize Live Board
async function initLiveBoard() {
  console.log('📡 Initializing Live Board...');
  
  // Set user avatar
  const userEmail = document.getElementById('user-email').textContent;
  const avatarText = userEmail.charAt(0).toUpperCase();
  document.getElementById('composer-avatar-text').textContent = avatarText;
  
  // Add event listeners
  const input = document.getElementById('live-board-input');
  const submitBtn = document.getElementById('submit-post-btn');
  const cancelBtn = document.getElementById('cancel-post-btn');
  const composerFooter = document.getElementById('composer-footer');
  
  // Show/hide composer footer
  input.addEventListener('focus', () => {
    composerFooter.style.display = 'flex';
    input.style.minHeight = '80px';
  });
  
  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  });
  
  // Cancel post
  cancelBtn.addEventListener('click', () => {
    input.value = '';
    input.style.height = 'auto';
    composerFooter.style.display = 'none';
  });
  
  // Submit post
  submitBtn.addEventListener('click', () => submitPost());
  
  // Submit on Ctrl+Enter
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      submitPost();
    }
  });
  
  // Filter buttons
  document.querySelectorAll('.feed-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderLiveBoardFeed();
    });
  });
  
  // Load posts
  await loadLiveBoardPosts();
}

// Submit Post
async function submitPost() {
  const input = document.getElementById('live-board-input');
  const text = input.value.trim();
  
  if (!text) {
    showNotification('Please enter some text', 'error');
    return;
  }
  
  try {
    const submitBtn = document.getElementById('submit-post-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span><span>Posting...</span>';
    
    const response = await fetch(`${API_BASE}/live-board/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('✅ Posted successfully!', 'success');
      input.value = '';
      input.style.height = 'auto';
      document.getElementById('composer-footer').style.display = 'none';
      await loadLiveBoardPosts();
    } else {
      showNotification(data.error || 'Failed to post', 'error');
    }
  } catch (error) {
    console.error('Error submitting post:', error);
    showNotification('Failed to post', 'error');
  } finally {
    const submitBtn = document.getElementById('submit-post-btn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>📤</span><span>Post</span>';
  }
}

// Load Live Board Posts
async function loadLiveBoardPosts() {
  console.log('📡 Loading live board posts...');
  try {
    const response = await fetch(`${API_BASE}/live-board/posts`, { credentials: 'include' });
    console.log('📊 Live board API response status:', response.status);
    
    const data = await response.json();
    console.log('📊 Live board API data:', data);
    
    if (data.success) {
      liveBoardPosts = data.posts || [];
      console.log(`✅ Live board posts loaded: ${liveBoardPosts.length}`);
      document.getElementById('live-board-count').textContent = liveBoardPosts.length;
      renderLiveBoardFeed();
    } else {
      console.warn('⚠️ Live board API returned success:false:', data.error);
      renderLiveBoardEmpty('Unable to load posts. ' + (data.error || ''));
    }
  } catch (error) {
    console.error('❌ Error loading live board posts:', error);
    renderLiveBoardEmpty('Failed to load posts');
  }
}

// Render Live Board Feed
function renderLiveBoardFeed() {
  console.log('🎨 Rendering live board feed...');
  const feedContainer = document.getElementById('live-board-feed');
  
  if (!feedContainer) {
    console.error('❌ Feed container not found!');
    return;
  }
  
  // Filter posts
  let filteredPosts = liveBoardPosts;
  const userEmail = document.getElementById('user-email').textContent;
  
  console.log(`📊 Total posts: ${liveBoardPosts.length}, Filter: ${currentFilter}`);
  
  switch (currentFilter) {
    case 'my':
      filteredPosts = liveBoardPosts.filter(p => p.user_email === userEmail);
      break;
    case 'mentions':
      filteredPosts = liveBoardPosts.filter(p => p.text && p.text.includes(`@${userEmail}`));
      break;
    case 'links':
      filteredPosts = liveBoardPosts.filter(p => p.link_url);
      break;
  }
  
  console.log(`📊 Filtered posts: ${filteredPosts.length}`);
  
  if (filteredPosts.length === 0) {
    console.log('📭 Showing empty state');
    renderLiveBoardEmpty('No posts yet');
    return;
  }
  
  // Render posts
  console.log('✅ Rendering posts...');
  feedContainer.innerHTML = filteredPosts.map(post => `
    <div class="feed-post" data-post-id="${escapeHtml(post.id)}">
      <div class="feed-post-header">
        <div class="feed-post-author">
          <div class="feed-post-avatar">
            ${(post.user_name || post.user_email || 'U').charAt(0).toUpperCase()}
          </div>
          <div class="feed-post-author-info">
            <div class="feed-post-author-name">${escapeHtml(post.user_name || post.user_email)}</div>
            <div class="feed-post-timestamp">${formatTimeAgo(post.created_at)}</div>
          </div>
        </div>
        <div class="feed-post-menu">
          <button class="feed-post-menu-btn" onclick="togglePostMenu('${escapeHtml(post.id)}')">⋮</button>
        </div>
      </div>
      <div class="feed-post-content">
        <div class="feed-post-text">${escapeHtml(post.text)}</div>
        ${post.link_url ? `
          <a href="${escapeHtml(post.link_url)}" target="_blank" class="feed-post-link">
            <span class="feed-post-link-icon">🔗</span>
            <span class="feed-post-link-text">${escapeHtml(post.link_url)}</span>
          </a>
        ` : ''}
      </div>
      <div class="feed-post-actions">
        <button class="feed-post-action-btn ${post.is_liked ? 'liked' : ''}" onclick="likePost('${escapeHtml(post.id)}')">
          <span>${post.is_liked ? '❤️' : '🤍'}</span>
          <span id="like-count-${escapeHtml(post.id)}">${post.likes || 0}</span>
        </button>
        <button class="feed-post-action-btn" onclick="commentOnPost('${escapeHtml(post.id)}')">
          <span>💬</span>
          <span>Comment</span>
        </button>
        <button class="feed-post-action-btn" onclick="sharePost('${escapeHtml(post.id)}')">
          <span>📤</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  `).join('');
}

// Render Empty State
function renderLiveBoardEmpty(message) {
  console.log(`📭 Rendering empty state: ${message}`);
  const feedContainer = document.getElementById('live-board-feed');
  if (!feedContainer) {
    console.error('❌ Feed container not found for empty state!');
    return;
  }
  feedContainer.innerHTML = `
    <div class="live-board-empty">
      <div class="live-board-empty-icon">📭</div>
      <div class="live-board-empty-title">${message}</div>
      <div class="live-board-empty-text">Be the first to share an update with your team!</div>
    </div>
  `;
  console.log('✅ Empty state rendered');
}

// Format Time Ago
function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Like Post
async function likePost(postId) {
  try {
    const response = await fetch(`${API_BASE}/live-board/posts/${postId}/like`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    if (data.success) {
      document.getElementById(`like-count-${postId}`).textContent = data.likes;
    }
  } catch (error) {
    console.error('Error liking post:', error);
  }
}

// Comment on Post
function commentOnPost(postId) {
  showNotification('💬 Comments coming soon!', 'info');
}

// Share Post
function sharePost(postId) {
  const post = liveBoardPosts.find(p => p.id === postId);
  if (post) {
    navigator.clipboard.writeText(post.text);
    showNotification('✅ Post text copied to clipboard!', 'success');
  }
}

// Toggle Post Menu
function togglePostMenu(postId) {
  showNotification('⋮ Post options coming soon!', 'info');
}

// Update view switching to include live-board
const originalSwitchView = window.switchView;
window.switchView = function(viewName) {
  if (viewName === 'live-board') {
    // Hide all views
    document.querySelectorAll('.collab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.collab-nav-item').forEach(n => n.classList.remove('active'));
    
    // Show live board
    document.getElementById('live-board-view').classList.add('active');
    document.querySelector('[data-view="live-board"]').classList.add('active');
    
    // Load if not loaded
    if (liveBoardPosts.length === 0) {
      initLiveBoard();
    }
  } else {
    originalSwitchView(viewName);
  }
};

// Auto-initialize when page loads
if (document.getElementById('live-board-view')) {
  setTimeout(() => {
    if (document.getElementById('live-board-view').classList.contains('active')) {
      initLiveBoard();
    }
  }, 500);
}

