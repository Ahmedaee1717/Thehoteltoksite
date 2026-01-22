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
    case 'activity':
      loadActivity();
      break;
    case 'settings':
      loadSettings();
      break;
  }
}

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
  
  return `
    <div class="post-card" onclick="openPost('${post.slug}')">
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <div class="post-meta">
        <span>📅 ${date}</span>
        <span>👤 ${escapeHtml(post.author)}</span>
      </div>
      <p class="post-excerpt">${escapeHtml(post.excerpt || 'No excerpt available')}</p>
      <span class="post-status ${statusClass}">${post.status}</span>
    </div>
  `;
}

// 🔗 OPEN POST
function openPost(slug) {
  // Check if user has edit permission
  if (userRole === 'admin' || userRole === 'editor' || userRole === 'publisher') {
    window.location.href = `/admin/dashboard?edit=${slug}`;
  } else {
    window.location.href = `/blog/${slug}`;
  }
}

// ✨ CHECK NEW POST PERMISSION
async function checkNewPostPermission() {
  const container = document.getElementById('new-post-view').querySelector('.permission-check-box');
  container.innerHTML = '<p>Checking permissions...</p>';
  
  const canCreate = ['admin', 'editor', 'publisher'].includes(userRole);
  
  if (canCreate) {
    container.innerHTML = `
      <div style="text-align: center;">
        <h3 style="font-size: 24px; margin-bottom: 20px; color: var(--quantum-text);">
          ✨ You have permission to create posts!
        </h3>
        <p style="margin-bottom: 30px; color: var(--quantum-text-dim);">
          Your role: <strong style="color: var(--quantum-primary);">${userRole}</strong>
        </p>
        <button class="quantum-btn" onclick="window.location.href='/admin/dashboard'">
          <span class="btn-icon">✏️</span>
          <span class="btn-text">Go to Admin Dashboard</span>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="text-align: center;">
        <h3 style="font-size: 24px; margin-bottom: 20px; color: var(--quantum-text);">
          🔒 Permission Required
        </h3>
        <p style="margin-bottom: 30px; color: var(--quantum-text-dim);">
          Your current role (<strong>${userRole}</strong>) does not allow creating posts.<br>
          Please contact an administrator to request access.
        </p>
        <p style="color: var(--quantum-text-dim); font-size: 14px;">
          Required roles: <strong style="color: var(--quantum-primary);">Admin, Editor, or Publisher</strong>
        </p>
      </div>
    `;
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
  const initials = user.user_email.split('@')[0].substring(0, 2).toUpperCase();
  const roleColor = {
    admin: '#667eea',
    publisher: '#4facfe',
    editor: '#00f2fe',
    viewer: '#8892b0'
  }[user.role] || '#8892b0';
  
  return `
    <div class="team-card">
      <div class="team-avatar" style="background: ${roleColor}">
        ${initials}
      </div>
      <div class="team-email">${escapeHtml(user.user_email)}</div>
      <span class="team-role" style="border-color: ${roleColor}; color: ${roleColor}">
        ${user.role}
      </span>
    </div>
  `;
}

// 📊 LOAD ACTIVITY
async function loadActivity() {
  const container = document.getElementById('activity-list');
  container.innerHTML = '<div class="loading-quantum"><div class="loading-spinner"></div><p>Loading activity...</p></div>';
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/activity`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.activity.length > 0) {
      container.innerHTML = data.activity.map(activity => createActivityItem(activity)).join('');
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
  const icon = {
    created: '✨',
    updated: '✏️',
    published: '🚀',
    deleted: '🗑️',
    commented: '💬'
  }[activity.action] || '📝';
  
  const timeAgo = getTimeAgo(activity.created_at);
  
  return `
    <div class="activity-item">
      <div class="activity-icon">${icon}</div>
      <div class="activity-content">
        <strong>${escapeHtml(activity.user_email)}</strong> ${activity.action} 
        ${activity.post_title ? `<strong>"${escapeHtml(activity.post_title)}"</strong>` : 'a post'}
      </div>
      <div class="activity-time">${timeAgo}</div>
    </div>
  `;
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
  
  return JSON.stringify(permissions[role] || []);
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
