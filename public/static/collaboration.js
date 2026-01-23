// ✨ COLLABORATION CENTER - Year 2070 JavaScript ✨

const API_BASE = '/api/collaboration';
let currentView = 'my-posts';
let currentUser = null;
let userRole = null;

// 🚀 INITIALIZE
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌌 Collaboration Center initializing...');
  
  // Check localStorage for token (same as email app)
  const token = localStorage.getItem('auth_token');
  console.log('🔑 Auth token found in localStorage:', token ? 'YES' : 'NO');
  
  if (!token) {
    console.log('❌ No auth token, redirecting to login...');
    window.location.href = '/login';
    return;
  }
  
  console.log('✅ Auth token found, loading user...');
  await loadUser();
  await loadMyRole();
  setupNavigation();
  setupBackButton();
  await loadInitialData();
});

// 👤 LOAD USER INFO
async function loadUser() {
  try {
    // Check for auth token in localStorage (same as email interface)
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('❌ No auth token in loadUser, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    console.log('🔍 Decoding JWT token...');
    // Extract email from token (simple JWT decode)
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUser = payload.email || 'user@investaycapital.com';
    
    console.log('✅ User loaded:', currentUser);
    document.getElementById('user-email').textContent = currentUser;
  } catch (error) {
    console.error('❌ Error loading user:', error);
    window.location.href = '/login';
  }
}

// 🎭 LOAD USER ROLE
async function loadMyRole() {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('❌ No auth token in loadMyRole');
      window.location.href = '/login';
      return;
    }
    
    console.log('🎭 Fetching user role...');
    const response = await fetch(`${API_BASE}/my-role`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
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
  currentView = view;
  
  // Hide all views
  document.querySelectorAll('.collab-view').forEach(v => {
    v.classList.remove('active');
  });
  
  // Show selected view
  const targetView = document.getElementById(`${view}-view`);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // Load data for the view
  switch (view) {
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
  await loadMyPosts();
  await loadCounts();
}

// 📈 LOAD COUNTS
async function loadCounts() {
  try {
    const token = localStorage.getItem('auth_token');
    
    // Load posts count
    const postsResponse = await fetch(`${API_BASE}/blog-posts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const postsData = await postsResponse.json();
    
    if (postsData.success) {
      const myPosts = postsData.posts.filter(p => p.author === currentUser);
      document.getElementById('my-posts-count').textContent = myPosts.length;
      document.getElementById('all-posts-count').textContent = postsData.posts.length;
    }
    
    // Load team count
    const teamResponse = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const teamData = await teamResponse.json();
    
    if (teamData.success) {
      document.getElementById('team-count').textContent = teamData.users.length;
    }
  } catch (error) {
    console.error('Error loading counts:', error);
  }
}

// 📝 LOAD MY POSTS
async function loadMyPosts() {
  const container = document.getElementById('my-posts-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Loading posts...</p></div>';
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blog-posts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blog-posts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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
    // Fetch the post data
    const token = localStorage.getItem('auth_token');
    console.log('🔧 Fetching post from API...');
    const response = await fetch(`/api/admin/posts/${slug}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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
    const token = localStorage.getItem('auth_token');
    
    // Determine if this is an update or create
    const isUpdate = !!editSlug;
    const url = isUpdate ? `/api/admin/posts/${editSlug}` : '/api/admin/posts';
    const method = isUpdate ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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
    const token = localStorage.getItem('auth_token');
    
    // Fetch recent posts as activity
    const postsResponse = await fetch(`${API_BASE}/blog-posts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const postsData = await postsResponse.json();
    
    // Fetch team members for online status
    const teamResponse = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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
    const token = localStorage.getItem('auth_token');
    
    // Fetch all users with their roles
    const response = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
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
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE}/users/${encodeURIComponent(userEmail)}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/ai/seo-optimize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    
    const token = localStorage.getItem('auth_token');
    
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/ai/generate-summary', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/ai/generate-faq', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/ai/generate-schema', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/ai/generate-embedding', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/meetings/otter/transcripts?limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.transcripts && data.transcripts.length > 0) {
      container.innerHTML = data.transcripts.map(meeting => createMeetingCard(meeting)).join('');
      
      // Update count
      document.getElementById('meetings-count').textContent = data.total || data.transcripts.length;
    } else {
      container.innerHTML = `
        <div class="permission-check-box">
          <h3>🎙️ No meetings found</h3>
          <p>Click "Sync from Otter.ai" to import your Zoom meeting transcripts</p>
          <button class="quantum-btn" onclick="showOtterSyncModal()">
            🔄 Sync Now
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
  const speakers = meeting.speakers ? JSON.parse(meeting.speakers) : [];
  const speakerCount = speakers.length;
  
  return `
    <div class="meeting-card" onclick="openMeetingTranscript('${meeting.id}')">
      <div class="meeting-header">
        <div class="meeting-icon">🎙️</div>
        <div class="meeting-info">
          <h3 class="meeting-title">${escapeHtml(meeting.title)}</h3>
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
  `;
}

window.openMeetingTranscript = async function(meetingId) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/meetings/otter/transcripts/${meetingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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
  const speakers = meeting.speakers ? JSON.parse(meeting.speakers) : [];
  
  const modalHtml = `
    <div id="meeting-transcript-modal" class="collab-email-modal" onclick="if(event.target === this) closeMeetingModal()">
      <div class="meeting-modal-content">
        <div class="meeting-modal-header">
          <div>
            <h2>🎙️ ${escapeHtml(meeting.title)}</h2>
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
              <h3>👥 Speakers</h3>
              <div class="speakers-list">
                ${speakers.map(s => `<span class="speaker-tag">${escapeHtml(s.name || s.speaker_name || 'Unknown')}</span>`).join('')}
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

window.showOtterSyncModal = function() {
  const modalHtml = `
    <div id="otter-sync-modal" class="collab-email-modal" onclick="if(event.target === this) closeOtterSyncModal()">
      <div class="collab-email-modal-content">
        <div class="collab-email-modal-header">
          <h3>🔄 Sync from Otter.ai</h3>
          <button class="collab-email-modal-close" onclick="closeOtterSyncModal()">×</button>
        </div>
        
        <div class="collab-email-modal-body">
          <div class="collab-email-form-group">
            <label>Otter.ai API Key:</label>
            <input type="password" id="otter-api-key" placeholder="Enter your Otter.ai API key...">
            <small>
              Get your API key from <a href="https://otter.ai/developers" target="_blank" style="color: #C9A962;">Otter.ai Developer Dashboard</a>
            </small>
          </div>
          
          <div class="info-box" style="margin-top: 16px; padding: 12px; background: rgba(201, 169, 98, 0.1); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 13px;">
            <p><strong>ℹ️ How to get your Otter.ai API key:</strong></p>
            <ol style="margin: 8px 0 0 20px; padding: 0;">
              <li>Go to <a href="https://otter.ai/developers" target="_blank" style="color: #C9A962;">otter.ai/developers</a></li>
              <li>Log in to your Otter account</li>
              <li>Create a new API key</li>
              <li>Copy and paste it above</li>
            </ol>
          </div>
        </div>
        
        <div class="collab-email-modal-footer">
          <button class="collab-email-btn-cancel" onclick="closeOtterSyncModal()">Cancel</button>
          <button class="collab-email-btn-send" onclick="syncFromOtter()">
            <span class="email-btn-icon">🔄</span>
            Sync Meetings
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  setTimeout(() => {
    document.getElementById('otter-api-key').focus();
  }, 100);
};

window.closeOtterSyncModal = function() {
  const modal = document.getElementById('otter-sync-modal');
  if (modal) {
    modal.remove();
  }
};

window.syncFromOtter = async function() {
  const apiKey = document.getElementById('otter-api-key').value.trim();
  
  if (!apiKey) {
    showNotification('❌ Please enter your Otter.ai API key', 'error');
    return;
  }
  
  try {
    showNotification('🔄 Syncing meetings from Otter.ai...', 'info');
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/meetings/otter/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ otterApiKey: apiKey })
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
    console.error('Error syncing Otter:', error);
    showNotification('❌ Error syncing meetings', 'error');
  }
};

// Setup sync button
document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('sync-otter-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', showOtterSyncModal);
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/meetings/otter/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
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
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
