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
    setupTrixEditor();
    loadPosts();
    setupNavigation();
    setupForms();
    setupLogout();
});

// Trix Editor Setup
function setupTrixEditor() {
    const trixEditor = document.querySelector('trix-editor');
    
    if (trixEditor) {
        // Trix automatically syncs with the hidden input field
        // No additional setup needed for basic functionality
        
        // Optional: Customize Trix behavior
        trixEditor.addEventListener('trix-file-accept', function(e) {
            // Accept image files for upload
            const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!acceptedTypes.includes(e.file.type)) {
                e.preventDefault();
                alert('Only image files (JPEG, PNG, GIF, WebP) are supported.');
            }
        });
        
        // Handle image attachments
        trixEditor.addEventListener('trix-attachment-add', function(e) {
            const attachment = e.attachment;
            if (attachment.file) {
                uploadImage(attachment.file, attachment);
            }
        });
    }
}

// Upload image and attach to Trix
function uploadImage(file, attachment) {
    const reader = new FileReader();
    reader.onload = function(e) {
        // Convert to base64 data URL
        const url = e.target.result;
        attachment.setAttributes({
            url: url,
            href: url
        });
    };
    reader.readAsDataURL(file);
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            const view = this.getAttribute('data-view');
            if (view) {
                // Only prevent default if it's an internal view switch
                e.preventDefault();
                switchView(view);
            }
            // If no data-view, let the link work normally (e.g., external links)
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
        
        // Get content directly from textarea (no Quill)
        const content = document.getElementById('post-content').value;
        
        const formData = {
            title: document.getElementById('post-title').value,
            slug: document.getElementById('post-slug').value,
            author: document.getElementById('post-author').value,
            excerpt: document.getElementById('post-excerpt').value,
            featured_image: document.getElementById('post-featured-image').value,
            content: content,
            meta_title: document.getElementById('post-meta-title').value,
            meta_description: document.getElementById('post-meta-description').value,
            meta_keywords: document.getElementById('post-meta-keywords').value,
            og_image: document.getElementById('post-og-image').value,
            status: document.getElementById('post-status').value
        };
        
        console.log('Form data to submit:', formData);
        console.log('Content length:', formData.content.length);
        
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
                console.error('Save error details:', data);
                alert('Error: ' + data.error + (data.details ? '\n' + data.details : ''));
            }
        } catch (error) {
            console.error('Error saving post:', error);
            console.error('Error details:', error.message, error.stack);
            alert('Failed to save post: ' + error.message);
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
    
    // Set content in Trix editor
    const trixEditor = document.querySelector('trix-editor');
    if (trixEditor) {
        trixEditor.editor.loadHTML(post.content);
    } else {
        document.getElementById('post-content').value = post.content;
    }
    
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
    
    // Clear Trix editor
    const trixEditor = document.querySelector('trix-editor');
    if (trixEditor) {
        trixEditor.editor.loadHTML('');
    }
    
    // Hide AI status box
    document.getElementById('ai-status-box').style.display = 'none';
    document.getElementById('ai-result-box').style.display = 'none';
}

// AI Optimization Functions
async function loadAIStatus(postId) {
    try {
        const response = await fetch(`/api/ai/posts/${postId}/ai-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const statusBox = document.getElementById('ai-status-box');
            statusBox.style.display = 'block';
            
            document.getElementById('ai-status-summary').textContent = data.data.has_summary ? '✅ Generated' : '❌ Not generated';
            document.getElementById('ai-status-faq').textContent = data.data.has_faq ? `✅ Generated (${data.data.faq?.length || 0} items)` : '❌ Not generated';
            document.getElementById('ai-status-schema').textContent = data.data.has_schema ? '✅ Generated' : '❌ Not generated';
            document.getElementById('ai-status-embedding').textContent = data.data.has_embedding ? '✅ Generated' : '❌ Not generated';
            document.getElementById('ai-status-processed').textContent = data.data.last_processed ? new Date(data.data.last_processed).toLocaleString() : 'Never';
            
            document.getElementById('ai-include-kb').checked = data.data.in_knowledge_base;
        }
    } catch (error) {
        console.error('Error loading AI status:', error);
    }
}

async function aiOptimizeAll() {
    if (!currentPost) {
        alert('Please save the post first before running AI optimization');
        return;
    }
    
    const btn = document.getElementById('ai-optimize-all-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Processing... (this may take 30-60 seconds)';
    
    try {
        const response = await fetch(`/api/ai/posts/${currentPost.id}/optimize-all`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ AI Optimization Complete!\n\nGenerated:\n- Summary & Excerpt\n- FAQ (' + data.data.faq_count + ' items)\n- Schema.org JSON-LD\n- Embedding Vector (' + data.data.embedding_dimension + ' dimensions)');
            
            // Show result
            document.getElementById('ai-result-box').style.display = 'block';
            document.getElementById('ai-result-text').textContent = JSON.stringify(data.data, null, 2);
            
            // Reload AI status
            loadAIStatus(currentPost.id);
        } else {
            alert('❌ AI Optimization Failed:\n' + data.error);
        }
    } catch (error) {
        console.error('Error in AI optimization:', error);
        alert('❌ AI Optimization Error:\n' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function aiGenerateSummary() {
    if (!currentPost) {
        alert('Please save the post first');
        return;
    }
    
    const btn = document.getElementById('ai-generate-summary-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    try {
        const response = await fetch(`/api/ai/posts/${currentPost.id}/generate-summary`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Summary & Excerpt Generated!\n\nSummary: ' + data.data.summary);
            loadAIStatus(currentPost.id);
        } else {
            alert('❌ Failed: ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Summary';
    }
}

async function aiGenerateFAQ() {
    if (!currentPost) {
        alert('Please save the post first');
        return;
    }
    
    const btn = document.getElementById('ai-generate-faq-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    try {
        const response = await fetch(`/api/ai/posts/${currentPost.id}/generate-faq`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ FAQ Generated (' + data.data.faq.length + ' items)');
            loadAIStatus(currentPost.id);
        } else {
            alert('❌ Failed: ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate FAQ';
    }
}

async function aiGenerateSchema() {
    if (!currentPost) {
        alert('Please save the post first');
        return;
    }
    
    const btn = document.getElementById('ai-generate-schema-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    try {
        const response = await fetch(`/api/ai/posts/${currentPost.id}/generate-schema`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Schema JSON-LD Generated!');
            loadAIStatus(currentPost.id);
        } else {
            alert('❌ Failed: ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Schema';
    }
}

async function aiGenerateEmbedding() {
    if (!currentPost) {
        alert('Please save the post first');
        return;
    }
    
    const btn = document.getElementById('ai-generate-embedding-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    try {
        const response = await fetch(`/api/ai/posts/${currentPost.id}/generate-embedding`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Embedding Generated (' + data.data.dimension + ' dimensions)');
            loadAIStatus(currentPost.id);
        } else {
            alert('❌ Failed: ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Embedding';
    }
}

async function toggleKnowledgeBase() {
    if (!currentPost) return;
    
    const checkbox = document.getElementById('ai-include-kb');
    
    try {
        const response = await fetch(`/api/ai/posts/${currentPost.id}/toggle-knowledge-base`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ include: checkbox.checked })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Knowledge base setting updated');
        }
    } catch (error) {
        console.error('Error updating knowledge base setting:', error);
    }
}

// AI Auto-Fill SEO Fields
async function aiAutoFillSEO() {
    const btn = document.getElementById('ai-seo-optimize-btn');
    const btnText = btn.querySelector('.ai-seo-text');
    const btnSubtext = btn.querySelector('.ai-seo-subtext');
    const originalText = btnText.textContent;
    const originalSubtext = btnSubtext.textContent;
    
    try {
        // Get current content
        const title = document.getElementById('post-title').value;
        const trixEditor = document.querySelector('trix-editor');
        const content = trixEditor ? trixEditor.editor.getDocument().toString() : '';
        
        if (!title || !content || content.length < 50) {
            alert('Please write a title and content first (at least 50 characters)');
            return;
        }
        
        // Add loading state
        btn.classList.add('loading');
        btn.disabled = true;
        btnText.textContent = 'NEURAL PROCESSING';
        btnSubtext.textContent = 'Quantum AI analyzing your content...';
        
        // Call AI endpoint to generate SEO fields
        const response = await fetch('/api/ai/seo-optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                content: content.substring(0, 5000)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Auto-fill all SEO fields
            document.getElementById('post-excerpt').value = data.excerpt || '';
            document.getElementById('post-meta-title').value = data.meta_title || '';
            document.getElementById('post-meta-description').value = data.meta_description || '';
            document.getElementById('post-meta-keywords').value = data.meta_keywords || '';
            
            // Success animation
            btnText.textContent = 'OPTIMIZATION COMPLETE';
            btnSubtext.textContent = '✓ All SEO fields generated successfully';
            
            setTimeout(() => {
                btn.classList.remove('loading');
                btnText.textContent = originalText;
                btnSubtext.textContent = originalSubtext;
                btn.disabled = false;
            }, 3000);
            
            alert('✅ SEO fields have been auto-filled by AI!\n\nReview and edit as needed before publishing.');
        } else {
            btn.classList.remove('loading');
            btnText.textContent = 'ERROR OCCURRED';
            btnSubtext.textContent = data.error || 'Failed to optimize';
            
            setTimeout(() => {
                btnText.textContent = originalText;
                btnSubtext.textContent = originalSubtext;
                btn.disabled = false;
            }, 3000);
            
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('SEO optimization error:', error);
        btn.classList.remove('loading');
        btnText.textContent = 'CONNECTION ERROR';
        btnSubtext.textContent = 'Failed to reach AI server';
        
        setTimeout(() => {
            btnText.textContent = originalText;
            btnSubtext.textContent = originalSubtext;
            btn.disabled = false;
        }, 3000);
        
        alert('Failed to optimize SEO fields: ' + error.message);
    }
}

// Setup AI optimization buttons
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('ai-optimize-all-btn').addEventListener('click', aiOptimizeAll);
    document.getElementById('ai-generate-summary-btn').addEventListener('click', aiGenerateSummary);
    document.getElementById('ai-generate-faq-btn').addEventListener('click', aiGenerateFAQ);
    document.getElementById('ai-generate-schema-btn').addEventListener('click', aiGenerateSchema);
    document.getElementById('ai-generate-embedding-btn').addEventListener('click', aiGenerateEmbedding);
    document.getElementById('ai-include-kb').addEventListener('change', toggleKnowledgeBase);
    
    // SEO Auto-Fill button
    const seoBtn = document.getElementById('ai-seo-optimize-btn');
    if (seoBtn) {
        seoBtn.addEventListener('click', aiAutoFillSEO);
    }
});

// Modified fillPostForm to load AI status
const originalFillPostForm = fillPostForm;
fillPostForm = function(post) {
    originalFillPostForm(post);
    if (post.id) {
        loadAIStatus(post.id);
        document.getElementById('ai-include-kb').checked = post.ai_include_in_knowledge_base === 1;
    }
}
