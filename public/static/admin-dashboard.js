// Check authentication
const token = localStorage.getItem('admin_token');
if (!token) {
    window.location.href = '/admin';
}

// State management
let currentView = 'posts';
let currentPost = null;
let allPosts = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    setupNavigation();
    setupForms();
    setupLogout();
});

// Navigation
function setupNavigation() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            if (view) {
                switchView(view);
            }
        });
    });
    
    document.getElementById('new-post-btn').addEventListener('click', function() {
        switchView('new-post');
        resetPostForm();
    });
    
    document.getElementById('cancel-post-btn').addEventListener('click', function() {
        switchView('posts');
        resetPostForm();
    });
}

function switchView(view) {
    // Update navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === view) {
            item.classList.add('active');
        }
    });
    
    // Update views
    document.querySelectorAll('.admin-view').forEach(v => {
        v.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');
    
    currentView = view;
}

// Logout
function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin';
    });
}

// Load posts
async function loadPosts() {
    const postsList = document.getElementById('posts-list');
    
    try {
        const response = await fetch('/api/admin/posts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allPosts = data.posts;
            renderPosts(data.posts);
        } else {
            postsList.innerHTML = '<p class="loading">Failed to load posts</p>';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = '<p class="loading">Error loading posts</p>';
    }
}

function renderPosts(posts) {
    const postsList = document.getElementById('posts-list');
    
    if (posts.length === 0) {
        postsList.innerHTML = '<p class="loading">No posts yet. Create your first post!</p>';
        return;
    }
    
    postsList.innerHTML = posts.map(post => `
        <div class="post-item">
            <div class="post-item-info">
                <div class="post-item-title">${post.title}</div>
                <div class="post-item-meta">
                    <span>${post.author}</span>
                    <span>${new Date(post.created_at).toLocaleDateString()}</span>
                    <span class="post-item-status ${post.status}">${post.status}</span>
                </div>
            </div>
            <div class="post-item-actions">
                <button class="btn-icon" onclick="editPost(${post.id})">Edit</button>
                <button class="btn-icon" onclick="deletePost(${post.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Edit post
window.editPost = async function(id) {
    try {
        const response = await fetch(`/api/admin/posts/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentPost = data.post;
            fillPostForm(data.post);
            switchView('new-post');
            document.getElementById('post-form-title').textContent = 'Edit Post';
            document.getElementById('delete-post-btn').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Failed to load post');
    }
}

// Delete post
window.deletePost = async function(id) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/posts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Post deleted successfully');
            loadPosts();
        } else {
            alert('Failed to delete post: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
    }
}

// Form handling
function setupForms() {
    const postForm = document.getElementById('post-form');
    const titleInput = document.getElementById('post-title');
    const slugInput = document.getElementById('post-slug');
    
    // Auto-generate slug from title
    titleInput.addEventListener('input', function() {
        if (!currentPost) {
            const slug = this.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            slugInput.value = slug;
        }
    });
    
    // Post form submission
    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('post-title').value,
            slug: document.getElementById('post-slug').value,
            author: document.getElementById('post-author').value,
            excerpt: document.getElementById('post-excerpt').value,
            featured_image: document.getElementById('post-featured-image').value,
            content: document.getElementById('post-content').value,
            meta_title: document.getElementById('post-meta-title').value,
            meta_description: document.getElementById('post-meta-description').value,
            meta_keywords: document.getElementById('post-meta-keywords').value,
            og_image: document.getElementById('post-og-image').value,
            status: document.getElementById('post-status').value
        };
        
        try {
            let response;
            
            if (currentPost) {
                // Update existing post
                response = await fetch(`/api/admin/posts/${currentPost.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new post
                response = await fetch('/api/admin/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            }
            
            const data = await response.json();
            
            if (data.success) {
                alert(data.message);
                resetPostForm();
                switchView('posts');
                loadPosts();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Failed to save post');
        }
    });
    
    // Delete button
    document.getElementById('delete-post-btn').addEventListener('click', function() {
        if (currentPost) {
            deletePost(currentPost.id);
            resetPostForm();
            switchView('posts');
        }
    });
}

function fillPostForm(post) {
    document.getElementById('post-id').value = post.id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-slug').value = post.slug;
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-excerpt').value = post.excerpt || '';
    document.getElementById('post-featured-image').value = post.featured_image || '';
    document.getElementById('post-content').value = post.content;
    document.getElementById('post-meta-title').value = post.meta_title || '';
    document.getElementById('post-meta-description').value = post.meta_description || '';
    document.getElementById('post-meta-keywords').value = post.meta_keywords || '';
    document.getElementById('post-og-image').value = post.og_image || '';
    document.getElementById('post-status').value = post.status;
}

function resetPostForm() {
    currentPost = null;
    document.getElementById('post-form').reset();
    document.getElementById('post-form-title').textContent = 'Create New Post';
    document.getElementById('delete-post-btn').style.display = 'none';
    document.getElementById('post-author').value = 'Investay Capital';
}
