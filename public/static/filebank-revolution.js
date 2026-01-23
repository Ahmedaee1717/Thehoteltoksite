// 🚀 REVOLUTIONARY FILE BANK - YEAR 2070 JAVASCRIPT 🚀
// The most intelligent, intuitive file management system ever created

const FileBankRevolution = {
  // State Management
  state: {
    files: [],
    folders: [],
    selectedFiles: [],
    currentFolder: null,
    currentView: 'grid', // grid, list, columns
    currentFilter: 'all', // all, recent, starred, shared
    searchQuery: '',
    draggedFile: null,
    dragStartX: 0,
    dragStartY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    filePositions: {}, // Store custom positions for desktop mode
    selectionBox: null,
    userEmail: null,
    collaborationMode: false
  },

  // Initialize the system
  async init() {
    console.log('🚀 Initializing Revolutionary File Bank...');
    
    // Get user email
    this.state.userEmail = localStorage.getItem('userEmail') || 'admin@investaycapital.com';
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial data
    await this.loadFiles();
    await this.loadFolders();
    
    // Render
    this.render();
    
    console.log('✅ File Bank Revolution Ready!');
  },

  // Setup all event listeners
  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('filebank-search');
    const searchClear = document.getElementById('filebank-search-clear');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        searchClear.classList.toggle('active', e.target.value.length > 0);
        this.filterAndRender();
      });
    }
    
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.state.searchQuery = '';
        searchClear.classList.remove('active');
        this.filterAndRender();
      });
    }

    // View toggle
    document.querySelectorAll('.filebank-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.changeView(view);
      });
    });

    // Upload button
    const uploadBtn = document.getElementById('filebank-upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this.openUploadModal());
    }

    // New folder button
    const newFolderBtn = document.getElementById('filebank-new-folder-btn');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => this.createFolder());
    }

    // Collaboration button
    const collabBtn = document.getElementById('filebank-collab-btn');
    if (collabBtn) {
      collabBtn.addEventListener('click', () => this.openCollaborationPanel());
    }

    // Back to email
    const backBtn = document.getElementById('filebank-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = '/mail';
      });
    }

    // Sidebar filters
    document.querySelectorAll('.filebank-sidebar-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        this.changeFilter(filter);
      });
    });

    // Drag and drop on canvas - SMART: Distinguish between file rearrangement and external file upload
    const canvas = document.getElementById('filebank-canvas');
    if (canvas) {
      canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        
        // Only show dropzone if dragging FROM OUTSIDE (external files)
        // NOT when dragging internal files for rearrangement
        if (!this.state.draggedFile) {
          document.getElementById('filebank-dropzone').classList.add('active');
        }
      });

      canvas.addEventListener('dragleave', (e) => {
        if (e.target === canvas) {
          document.getElementById('filebank-dropzone').classList.remove('active');
        }
      });

      canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        document.getElementById('filebank-dropzone').classList.remove('active');
        
        // If dragging internal file (rearrangement), do nothing
        if (this.state.draggedFile) {
          console.log('📍 File rearrangement - position saved');
          // TODO: Save new position to database
          return;
        }
        
        // If dragging external files, upload them
        if (e.dataTransfer.files.length > 0) {
          this.handleFileDrop(e.dataTransfer.files);
        }
      });
    }

    // Close context menu on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.filebank-context-menu')) {
        document.querySelectorAll('.filebank-context-menu').forEach(menu => {
          menu.classList.remove('active');
        });
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        this.selectAllFiles();
      }

      // Escape - Clear selection
      if (e.key === 'Escape') {
        this.clearSelection();
        this.closeModals();
      }

      // Delete - Delete selected
      if (e.key === 'Delete' && this.state.selectedFiles.length > 0) {
        this.deleteSelectedFiles();
      }

      // Ctrl/Cmd + F - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('filebank-search')?.focus();
      }
    });
  },

  // Load files from API
  async loadFiles() {
    console.log('📁 Loading files...');
    
    try {
      const url = `/api/filebank/files?userEmail=${encodeURIComponent(this.state.userEmail)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      this.state.files = data.files || [];
      console.log(`✅ Loaded ${this.state.files.length} files`);
      
      this.updateCounts();
    } catch (error) {
      console.error('❌ Error loading files:', error);
      this.showNotification('Failed to load files', 'error');
    }
  },

  // Load folders from API
  async loadFolders() {
    console.log('📂 Loading folders...');
    
    try {
      const url = `/api/filebank/folders?userEmail=${encodeURIComponent(this.state.userEmail)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      this.state.folders = data.folders || [];
      console.log(`✅ Loaded ${this.state.folders.length} folders`);
    } catch (error) {
      console.error('❌ Error loading folders:', error);
    }
  },

  // Render the file grid
  render() {
    const grid = document.getElementById('filebank-grid');
    if (!grid) return;

    const filteredFiles = this.getFilteredFiles();

    if (filteredFiles.length === 0) {
      this.renderEmptyState(grid);
      return;
    }

    grid.innerHTML = filteredFiles.map(file => this.createFileCard(file)).join('');

    // Setup file card event listeners
    this.setupFileCardListeners();
  },

  // Create file card HTML
  createFileCard(file) {
    const isSelected = this.state.selectedFiles.includes(file.id);
    const isImage = this.isImageFile(file);
    const fileIcon = this.getFileIcon(file);
    const fileSize = this.formatFileSize(file.file_size);
    const fileDate = this.formatDate(file.created_at);

    return `
      <div class="filebank-file-card ${isSelected ? 'selected' : ''}" 
           data-file-id="${file.id}"
           draggable="true">
        
        ${file.folder_is_shared ? '<div class="filebank-collab-badge" title="Folder is shared">👥 Folder</div>' : ''}
        ${file.is_shared ? '<div class="filebank-collab-badge" style="top: 12px; right: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);" title="File is shared with everyone">🌐 Shared</div>' : ''}
        
        <div class="filebank-file-actions">
          <button class="filebank-file-action-btn" 
                  onclick="event.stopPropagation(); FileBankRevolution.downloadFile('${file.id}')"
                  title="Download"
                  style="background: rgba(102, 126, 234, 0.2); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;">
            📥
          </button>
          <button class="filebank-file-action-btn ${file.is_starred ? 'starred' : ''}" 
                  onclick="event.stopPropagation(); FileBankRevolution.toggleStar('${file.id}')"
                  title="Star"
                  style="border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;">
            ⭐
          </button>
          <button class="filebank-file-action-btn" 
                  onclick="event.stopPropagation(); FileBankRevolution.showFileMenu(event, '${file.id}')"
                  title="More"
                  style="border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;">
            ⋯
          </button>
        </div>

        <div class="filebank-file-preview" style="position: relative; width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; background: rgba(102, 126, 234, 0.1); border-radius: 12px; overflow: hidden;">
          ${isImage && file.file_url ? 
            `<img src="/api/filebank${file.file_url}" 
                  alt="${this.escapeHtml(file.original_filename)}" 
                  loading="lazy"
                  style="width: 100%; height: 100%; object-fit: cover;">` :
            `<div class="filebank-file-icon" style="font-size: 64px;">${fileIcon}</div>`
          }
        </div>

        <div class="filebank-file-info">
          <div class="filebank-file-name" 
               title="${this.escapeHtml(file.original_filename)}"
               style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${this.escapeHtml(file.original_filename)}
          </div>
          
          <div class="filebank-file-meta" style="display: flex; gap: 12px; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
            <span class="filebank-file-size">
              📊 ${fileSize}
            </span>
            <span class="filebank-file-date">
              🕒 ${fileDate}
            </span>
          </div>

          ${file.tags && file.tags.length > 0 ? `
            <div class="filebank-file-tags" style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
              ${file.tags.map(tag => `<span class="filebank-file-tag" style="background: rgba(102, 126, 234, 0.2); color: rgba(255, 255, 255, 0.8); padding: 4px 8px; border-radius: 4px; font-size: 11px;">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Setup file card event listeners
  setupFileCardListeners() {
    document.querySelectorAll('.filebank-file-card').forEach(card => {
      const fileId = card.dataset.fileId;

      // Click to select
      card.addEventListener('click', (e) => {
        if (e.target.closest('.filebank-file-action-btn')) return;
        
        if (e.ctrlKey || e.metaKey) {
          this.toggleFileSelection(fileId);
        } else if (e.shiftKey && this.state.selectedFiles.length > 0) {
          this.selectFileRange(fileId);
        } else {
          this.selectFile(fileId, !e.detail || e.detail === 1);
        }
      });

      // Double click to open
      card.addEventListener('dblclick', (e) => {
        e.preventDefault();
        console.log('🖱️ Double-click detected on file:', fileId);
        this.openFile(fileId);
      });

      // Right click for context menu
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!this.state.selectedFiles.includes(fileId)) {
          this.selectFile(fileId, true);
        }
        this.showContextMenu(e, fileId);
      });

      // Drag start - Desktop-style reordering
      card.addEventListener('dragstart', (e) => {
        this.state.draggedFile = fileId;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        
        // Visual feedback: We're dragging INTERNAL file, not uploading
        document.getElementById('filebank-canvas')?.classList.add('dragging-internal');
      });

      // Drag over - Show insertion point
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.state.draggedFile && this.state.draggedFile !== fileId) {
          // Visual feedback: can drop here
          card.style.opacity = '0.5';
        }
      });

      card.addEventListener('dragleave', () => {
        card.style.opacity = '';
      });

      // Drop on another card - Reorder
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.style.opacity = '';
        
        if (this.state.draggedFile && this.state.draggedFile !== fileId) {
          console.log('🔄 Reordering files:', this.state.draggedFile, '→', fileId);
          this.reorderFiles(this.state.draggedFile, fileId);
        }
      });

      // Drag end
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.state.draggedFile = null;
        
        // Remove internal drag feedback
        document.getElementById('filebank-canvas')?.classList.remove('dragging-internal');
      });
    });
  },

  // Filter and render
  filterAndRender() {
    this.render();
  },

  // Get filtered files based on current filter and search
  getFilteredFiles() {
    let files = [...this.state.files];

    // Apply filter
    switch (this.state.currentFilter) {
      case 'recent':
        files = files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);
        break;
      case 'starred':
        files = files.filter(f => f.is_starred);
        break;
      case 'shared':
        files = files.filter(f => f.folder_is_shared);
        break;
      case 'images':
        files = files.filter(f => this.isImageFile(f));
        break;
      case 'documents':
        files = files.filter(f => this.isDocumentFile(f));
        break;
    }

    // Apply folder filter
    if (this.state.currentFolder) {
      files = files.filter(f => f.folder_id === this.state.currentFolder);
    }

    // Apply search
    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      files = files.filter(f => 
        f.original_filename.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query)) ||
        (f.tags && f.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    return files;
  },

  // Change view mode
  changeView(view) {
    this.state.currentView = view;
    
    // Update button states
    document.querySelectorAll('.filebank-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update grid class
    const grid = document.getElementById('filebank-grid');
    if (grid) {
      grid.className = 'filebank-grid';
      if (view === 'list') grid.classList.add('list-view');
      if (view === 'columns') grid.classList.add('columns-view');
    }
  },

  // Change filter
  changeFilter(filter) {
    this.state.currentFilter = filter;
    this.state.currentFolder = null;

    // Update sidebar states
    document.querySelectorAll('.filebank-sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.filter === filter);
    });

    // Update breadcrumb
    this.updateBreadcrumb();

    this.filterAndRender();
  },

  // Select file
  selectFile(fileId, clearOthers = false) {
    if (clearOthers) {
      this.state.selectedFiles = [fileId];
    } else {
      if (!this.state.selectedFiles.includes(fileId)) {
        this.state.selectedFiles.push(fileId);
      }
    }
    this.updateSelection();
  },

  // Toggle file selection
  toggleFileSelection(fileId) {
    const index = this.state.selectedFiles.indexOf(fileId);
    if (index > -1) {
      this.state.selectedFiles.splice(index, 1);
    } else {
      this.state.selectedFiles.push(fileId);
    }
    this.updateSelection();
  },

  // Select all files
  selectAllFiles() {
    const visibleFiles = this.getFilteredFiles();
    this.state.selectedFiles = visibleFiles.map(f => f.id);
    this.updateSelection();
  },

  // Clear selection
  clearSelection() {
    this.state.selectedFiles = [];
    this.updateSelection();
  },

  // Update selection UI
  updateSelection() {
    document.querySelectorAll('.filebank-file-card').forEach(card => {
      const fileId = card.dataset.fileId;
      card.classList.toggle('selected', this.state.selectedFiles.includes(fileId));
    });
  },

  // Open file
  async openFile(fileId) {
    console.log('📂 openFile called with fileId:', fileId, 'Type:', typeof fileId);
    
    // Convert to string if it's a number (file IDs can be either)
    const fileIdStr = String(fileId);
    
    const file = this.state.files.find(f => String(f.id) === fileIdStr);
    if (!file) {
      console.error('❌ File not found:', fileId);
      console.log('Available file IDs:', this.state.files.map(f => ({ id: f.id, type: typeof f.id, name: f.original_filename })));
      return;
    }

    console.log('📂 Opening file:', file.original_filename);

    // Use enhanced preview that supports more file types
    this.openFileEnhanced(fileIdStr);
  },
  
  // Get file type
  getFileType(file) {
    const ext = file.original_filename.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'log'].includes(ext)) return 'text';
    if (['csv', 'tsv'].includes(ext)) return 'csv';
    if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    
    return 'file';
  },
  
  // Download file
  async downloadFile(fileId) {
    const file = this.state.files.find(f => String(f.id) === String(fileId));
    if (!file) return;

    console.log('📥 Downloading:', file.original_filename);

    try {
      const response = await fetch(`/api/filebank${file.file_url}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.showNotification(`Downloaded ${file.original_filename}`, 'success');
    } catch (error) {
      console.error('Download error:', error);
      this.showNotification('Download failed', 'error');
    }
  },
  
  // Enhanced file preview
  async openFileEnhanced(fileId) {
    console.log('🔍 openFileEnhanced called with fileId:', fileId);
    const file = this.state.files.find(f => String(f.id) === String(fileId));
    if (!file) {
      console.error('❌ File not found in openFileEnhanced:', fileId);
      return;
    }

    const type = this.getFileType(file);
    console.log('📁 File type detected:', type, 'for file:', file.original_filename);
    
    if (type === 'image') {
      console.log('🖼️ Showing image preview');
      this.showEnhancedPreview(file, `
        <img src="/api/filebank${file.file_url}" 
             alt="${this.escapeHtml(file.original_filename)}" 
             style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;">
      `);
    } else if (type === 'pdf') {
      console.log('📕 Showing PDF preview');
      this.showEnhancedPreview(file, `
        <iframe src="/api/filebank${file.file_url}" 
                style="width: 100%; height: 70vh; border: none; border-radius: 8px; background: white;">
        </iframe>
      `);
    } else if (type === 'csv') {
      console.log('📊 Showing CSV preview');
      const csvPreview = await this.showCSVPreview(file);
      this.showEnhancedPreview(file, csvPreview);
    } else if (type === 'text') {
      console.log('📝 Showing text preview');
      this.showTextPreview(file);
    } else if (type === 'video') {
      console.log('🎬 Showing video preview');
      this.showEnhancedPreview(file, `
        <video controls style="max-width: 100%; max-height: 70vh; border-radius: 8px; background: black;">
          <source src="/api/filebank${file.file_url}" type="${file.file_type}">
        </video>
      `);
    } else if (type === 'audio') {
      console.log('🎵 Showing audio preview');
      this.showEnhancedPreview(file, `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 80px; margin-bottom: 20px;">🎵</div>
          <audio controls style="width: 100%; max-width: 500px;">
            <source src="/api/filebank${file.file_url}" type="${file.file_type}">
          </audio>
        </div>
      `);
    } else {
      console.log('📄 Opening in new tab');
      window.open(`/api/filebank${file.file_url}`, '_blank');
    }
  },
  
  // Show enhanced preview modal
  showEnhancedPreview(file, previewHTML) {
    console.log('🎭 showEnhancedPreview called for:', file.original_filename);
    const modal = document.getElementById('filebank-preview-modal');
    if (!modal) {
      console.error('❌ Modal element not found! ID: filebank-preview-modal');
      return;
    }
    console.log('✅ Modal element found:', modal);

    const content = modal.querySelector('.filebank-modal-body');
    const title = modal.querySelector('.filebank-modal-title');
    
    console.log('📦 Modal content element:', content);
    console.log('📝 Modal title element:', title);
    
    if (title) title.textContent = file.original_filename;
    
    if (content) {
      content.innerHTML = `
        <div class="filebank-preview-container">
          ${previewHTML}
          
          <div class="filebank-preview-actions" style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button onclick="FileBankRevolution.downloadFile('${file.id}')" 
                    class="filebank-btn filebank-btn-primary" 
                    style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
              📥 Download
            </button>
            <button onclick="FileBankRevolution.emailFile('${file.id}')" 
                    class="filebank-btn filebank-btn-secondary"
                    style="padding: 10px 20px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
              📧 Email
            </button>
            <button onclick="FileBankRevolution.closeModal()" 
                    class="filebank-btn filebank-btn-secondary"
                    style="padding: 10px 20px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; cursor: pointer; font-size: 14px;">
              ❌ Close
            </button>
          </div>
        </div>
      `;
      console.log('✅ Modal content updated');
    } else {
      console.error('❌ Modal content element not found!');
    }

    modal.classList.add('active');
    console.log('✅ Modal activated with class "active"');
  },
  
  // Close modal
  closeModal() {
    const modal = document.getElementById('filebank-preview-modal');
    if (modal) modal.classList.remove('active');
    
    const emailModal = document.getElementById('filebank-email-modal');
    if (emailModal) emailModal.classList.remove('active');
  },
  
  // Email single file
  emailFile(fileId) {
    this.state.selectedFiles = [String(fileId)];
    this.emailSelectedFiles();
  },
  
  // Email selected files
  async emailSelectedFiles() {
    if (this.state.selectedFiles.length === 0) {
      this.showNotification('No files selected', 'error');
      return;
    }

    const files = this.state.files.filter(f => this.state.selectedFiles.includes(String(f.id)));
    
    // Close any open modals
    this.closeModal();

    // Create email modal HTML
    const modalHTML = `
      <div id="filebank-email-modal" class="filebank-modal active" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
        <div class="filebank-modal-content" style="background: linear-gradient(135deg, #1a1d3e 0%, #2d3561 100%); border-radius: 16px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
          <div class="filebank-modal-header" style="margin-bottom: 20px;">
            <h3 class="filebank-modal-title" style="color: white; margin: 0; font-size: 24px;">Send ${files.length} File(s) by Email</h3>
          </div>
          <div class="filebank-modal-body">
            <div class="filebank-email-form">
              <div class="filebank-form-group" style="margin-bottom: 16px;">
                <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 8px; font-size: 14px;">To:</label>
                <input type="email" 
                       id="filebank-email-to" 
                       placeholder="recipient@example.com" 
                       style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-size: 14px;"
                       required>
              </div>

              <div class="filebank-form-group" style="margin-bottom: 16px;">
                <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 8px; font-size: 14px;">Subject:</label>
                <input type="text" 
                       id="filebank-email-subject" 
                       value="Files from FileBank" 
                       style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-size: 14px;"
                       required>
              </div>

              <div class="filebank-form-group" style="margin-bottom: 16px;">
                <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 8px; font-size: 14px;">Message:</label>
                <textarea id="filebank-email-body" 
                          style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-size: 14px; resize: vertical; font-family: inherit;"
                          rows="6"
                          placeholder="Add a message...">Hi,

I'm sharing ${files.length} file(s) with you.

Files:
${files.map(f => `- ${f.original_filename} (${this.formatFileSize(f.file_size)})`).join('\n')}

Best regards</textarea>
              </div>

              <div class="filebank-form-group" style="margin-bottom: 20px;">
                <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 8px; font-size: 14px;">Attachments:</label>
                <div class="filebank-email-attachments" style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
                  ${files.map(f => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                      <span style="font-size: 20px;">${this.getFileIcon(f)}</span>
                      <span style="color: white; flex: 1; font-size: 14px;">${this.escapeHtml(f.original_filename)}</span>
                      <span style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">${this.formatFileSize(f.file_size)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="FileBankRevolution.sendEmailWithFiles()" 
                        id="filebank-send-email-btn"
                        style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
                  📧 Send Email
                </button>
                <button onclick="FileBankRevolution.closeEmailModal()" 
                        style="padding: 12px 24px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; cursor: pointer; font-size: 14px;">
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing email modal
    const existing = document.getElementById('filebank-email-modal');
    if (existing) existing.remove();
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },
  
  // Send email with files
  async sendEmailWithFiles() {
    const to = document.getElementById('filebank-email-to')?.value;
    const subject = document.getElementById('filebank-email-subject')?.value;
    const body = document.getElementById('filebank-email-body')?.value;

    if (!to || !subject) {
      this.showNotification('Please fill in To and Subject', 'error');
      return;
    }

    const files = this.state.files.filter(f => this.state.selectedFiles.includes(String(f.id)));

    const sendBtn = document.getElementById('filebank-send-email-btn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '📤 Sending...';
    }

    try {
      const attachments = files.map(f => ({
        id: f.id,
        filename: f.original_filename,
        size: f.file_size,
        content_type: f.file_type,
        url: f.file_url,
        isLocalFile: false
      }));

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          from: localStorage.getItem('userEmail') || 'admin@investaycapital.com',
          to,
          subject,
          body,
          attachments,
          useAI: false
        })
      });

      if (response.ok) {
        this.showNotification(`Email sent to ${to} with ${files.length} file(s)!`, 'success');
        this.closeEmailModal();
        this.state.selectedFiles = [];
        this.render();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send');
      }
    } catch (error) {
      console.error('Email error:', error);
      this.showNotification(`Failed: ${error.message}`, 'error');
      
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = '📧 Send Email';
      }
    }
  },
  
  // Close email modal
  closeEmailModal() {
    const modal = document.getElementById('filebank-email-modal');
    if (modal) modal.remove();
  },

  // Show image preview modal
  showImagePreview(file) {
    const modal = document.getElementById('filebank-preview-modal');
    if (!modal) return;

    const img = modal.querySelector('.filebank-preview-image');
    const title = modal.querySelector('.filebank-modal-title');
    
    if (img) img.src = file.file_url;
    if (title) title.textContent = file.original_filename;

    modal.classList.add('active');
  },

  // Toggle star
  async toggleStar(fileId) {
    const file = this.state.files.find(f => String(f.id) === String(fileId));
    if (!file) return;

    try {
      const response = await fetch(`/api/filebank/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_starred: !file.is_starred,
          userEmail: this.state.userEmail
        })
      });

      if (response.ok) {
        file.is_starred = !file.is_starred;
        this.render();
        this.showNotification(file.is_starred ? 'Added to starred' : 'Removed from starred', 'success');
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      this.showNotification('Failed to update', 'error');
    }
  },

  // Show context menu
  // CSV Preview Function
  async showCSVPreview(file) {
    try {
      const response = await fetch(`/api/filebank${file.file_url}`);
      if (!response.ok) throw new Error('Failed to fetch CSV');
      
      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '<p style="color: #999; padding: 20px;">Empty CSV file</p>';
      
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 101); // Limit to 100 rows for performance
      
      // Build HTML table with 2070 styling
      let tableHTML = `
        <div style="overflow: auto; max-height: 500px; background: #0a0d1f; padding: 20px; border-radius: 8px;">
          <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 32px;">📊</span>
            <div>
              <h3 style="color: #fff; margin: 0 0 5px 0;">${this.escapeHtml(file.original_filename)}</h3>
              <p style="color: #999; margin: 0; font-size: 13px;">${this.formatFileSize(file.file_size)} • ${lines.length - 1} rows • ${headers.length} columns</p>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-family: 'Monaco', 'Courier New', monospace; font-size: 12px;">
            <thead>
              <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: sticky; top: 0; z-index: 10;">`;
      
      // Headers
      headers.forEach(header => {
        tableHTML += `<th style="padding: 12px 16px; text-align: left; color: #fff; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">${this.escapeHtml(header)}</th>`;
      });
      
      tableHTML += `</tr></thead><tbody>`;
      
      // Rows
      rows.forEach((row, idx) => {
        const cells = row.split(',').map(c => c.trim());
        const bgColor = idx % 2 === 0 ? 'rgba(102,126,234,0.05)' : 'rgba(102,126,234,0.02)';
        tableHTML += `<tr style="background: ${bgColor};" onmouseover="this.style.background='rgba(102,126,234,0.15)'" onmouseout="this.style.background='${bgColor}'">`;
        cells.forEach(cell => {
          tableHTML += `<td style="padding: 10px 16px; color: #e0e0e0; border: 1px solid rgba(255,255,255,0.05); white-space: nowrap;">${this.escapeHtml(cell)}</td>`;
        });
        tableHTML += `</tr>`;
      });
      
      tableHTML += `</tbody></table>`;
      
      if (lines.length > 101) {
        tableHTML += `<p style="color: #999; text-align: center; margin-top: 20px; font-size: 13px; background: rgba(102,126,234,0.1); padding: 10px; border-radius: 6px;">
          📊 Showing first 100 rows of ${lines.length - 1} total rows
        </p>`;
      }
      
      tableHTML += `</div>`;
      
      return tableHTML;
    } catch (error) {
      console.error('CSV preview error:', error);
      return `<p style="color: #ff6b6b; padding: 20px; background: rgba(255,107,107,0.1); border-radius: 8px;">❌ Failed to load CSV preview: ${error.message}</p>`;
    }
  },

  // Delete File Function (Owner Only)
  async deleteFile(fileId) {
    const file = this.state.files.find(f => String(f.id) === String(fileId));
    if (!file) {
      this.showNotification('File not found', 'error');
      return;
    }

    // Check if user is owner
    const isOwner = file.user_email === this.state.userEmail;
    if (!isOwner) {
      this.showNotification('❌ You can only delete your own files', 'error');
      return;
    }

    // Confirm deletion
    if (!confirm(`Delete "${file.original_filename}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/filebank/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userEmail: this.state.userEmail })
      });

      if (response.ok) {
        await this.loadFiles();
        this.render();
        this.showNotification(`🗑️ Deleted "${file.original_filename}"`, 'success');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      this.showNotification(`Failed to delete: ${error.message}`, 'error');
    }
  },

  // Share/Unshare File Function
  async toggleShareFile(fileId) {
    const file = this.state.files.find(f => String(f.id) === String(fileId));
    if (!file) {
      this.showNotification('File not found', 'error');
      return;
    }

    // Check if user is owner
    const isOwner = file.user_email === this.state.userEmail;
    if (!isOwner) {
      this.showNotification('❌ You can only share your own files', 'error');
      return;
    }

    const newSharedState = file.is_shared ? 0 : 1;
    const action = newSharedState ? 'share' : 'unshare';

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/filebank/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userEmail: this.state.userEmail,
          is_shared: newSharedState
        })
      });

      if (response.ok) {
        file.is_shared = newSharedState;
        this.render();
        this.showNotification(
          newSharedState 
            ? `🌐 "${file.original_filename}" is now shared with everyone`
            : `🔒 "${file.original_filename}" is now private`,
          'success'
        );
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action}`);
      }
    } catch (error) {
      console.error('Share toggle error:', error);
      this.showNotification(`Failed to ${action}: ${error.message}`, 'error');
    }
  },

  showContextMenu(event, fileId) {
    event.preventDefault();
    
    const menu = document.getElementById('filebank-context-menu');
    if (!menu) return;

    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('active');
    menu.dataset.fileId = fileId;
  },

  // Handle file drop
  async handleFileDrop(files) {
    console.log(`📤 Uploading ${files.length} file(s)...`);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('userEmail', this.state.userEmail);
    if (this.state.currentFolder) {
      formData.append('folderId', this.state.currentFolder);
    }

    try {
      const response = await fetch('/api/filebank/files/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await this.loadFiles();
        this.render();
        this.showNotification(`Uploaded ${files.length} file(s)`, 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.showNotification('Upload failed', 'error');
    }
  },

  // Open upload modal
  openUploadModal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => this.handleFileDrop(e.target.files);
    input.click();
  },

  // Create new folder
  async createFolder() {
    // Create beautiful modal
    const modalHTML = `
      <div id="filebank-folder-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px);">
        <div style="background: linear-gradient(135deg, #1a1d3e 0%, #2d3561 100%); border-radius: 16px; padding: 40px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid rgba(102, 126, 234, 0.3);">
          <h3 style="color: white; margin: 0 0 25px 0; font-size: 24px; font-weight: 600; text-align: center;">📁 Create New Folder</h3>
          
          <div style="margin-bottom: 25px;">
            <label style="color: rgba(255, 255, 255, 0.9); display: block; margin-bottom: 10px; font-size: 14px; font-weight: 500;">Folder Name:</label>
            <input type="text" 
                   id="folder-name-input" 
                   placeholder="Enter folder name..." 
                   style="width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.08); border: 2px solid rgba(102, 126, 234, 0.3); border-radius: 10px; color: white; font-size: 15px; outline: none; transition: all 0.3s;"
                   onkeypress="if(event.key==='Enter') document.getElementById('folder-create-btn').click()"
                   autofocus>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="document.getElementById('filebank-folder-modal').remove()" 
                    style="padding: 12px 24px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;">
              Cancel
            </button>
            <button id="folder-create-btn" 
                    onclick="FileBankRevolution.confirmCreateFolder()" 
                    style="padding: 12px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              ✨ Create Folder
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setTimeout(() => document.getElementById('folder-name-input').focus(), 100);
  },
  
  async confirmCreateFolder() {
    const input = document.getElementById('folder-name-input');
    const folderName = input.value.trim();
    
    if (!folderName) {
      this.showNotification('❌ Please enter a folder name', 'error');
      return;
    }

    try {
      const response = await fetch('/api/filebank/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_name: folderName,
          user_email: this.state.userEmail,
          parent_folder_id: this.state.currentFolder
        })
      });

      if (response.ok) {
        await this.loadFolders();
        this.showNotification(`✅ Folder "${folderName}" created`, 'success');
        document.getElementById('filebank-folder-modal').remove();
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      this.showNotification('Failed to create folder', 'error');
    }
  },

  // Open collaboration panel
  openCollaborationPanel() {
    window.location.href = '/collaborate';
  },

  // Delete selected files
  async deleteSelectedFiles() {
    if (this.state.selectedFiles.length === 0) return;

    const confirmed = confirm(`Delete ${this.state.selectedFiles.length} file(s)?`);
    if (!confirmed) return;

    try {
      await Promise.all(this.state.selectedFiles.map(fileId =>
        fetch(`/api/filebank/files/${fileId}?userEmail=${encodeURIComponent(this.state.userEmail)}`, {
          method: 'DELETE'
        })
      ));

      await this.loadFiles();
      this.clearSelection();
      this.render();
      this.showNotification('Files deleted', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      this.showNotification('Failed to delete files', 'error');
    }
  },

  // Update counts in sidebar
  updateCounts() {
    const counts = {
      all: this.state.files.length,
      recent: this.state.files.filter(f => {
        const date = new Date(f.created_at);
        const now = new Date();
        const diff = now - date;
        return diff < 7 * 24 * 60 * 60 * 1000; // Last 7 days
      }).length,
      starred: this.state.files.filter(f => f.is_starred).length,
      shared: this.state.files.filter(f => f.folder_is_shared).length
    };

    Object.keys(counts).forEach(key => {
      const el = document.querySelector(`[data-filter="${key}"] .filebank-sidebar-count`);
      if (el) el.textContent = counts[key];
    });
  },

  // Update breadcrumb
  updateBreadcrumb() {
    const breadcrumb = document.getElementById('filebank-breadcrumb');
    if (!breadcrumb) return;

    let html = `
      <div class="filebank-breadcrumb-item" onclick="FileBankRevolution.changeFilter('all')">
        🏠 All Files
      </div>
    `;

    if (this.state.currentFolder) {
      const folder = this.state.folders.find(f => f.id === this.state.currentFolder);
      if (folder) {
        html += `
          <span class="filebank-breadcrumb-separator">›</span>
          <div class="filebank-breadcrumb-item">
            📁 ${this.escapeHtml(folder.folder_name)}
          </div>
        `;
      }
    } else if (this.state.currentFilter !== 'all') {
      const filterNames = {
        recent: 'Recent',
        starred: 'Starred',
        shared: 'Shared',
        images: 'Images',
        documents: 'Documents'
      };
      html += `
        <span class="filebank-breadcrumb-separator">›</span>
        <div class="filebank-breadcrumb-item">
          ${filterNames[this.state.currentFilter] || this.state.currentFilter}
        </div>
      `;
    }

    breadcrumb.innerHTML = html;
  },

  // Render empty state
  renderEmptyState(container) {
    container.innerHTML = `
      <div class="filebank-empty-state">
        <div class="filebank-empty-icon">📂</div>
        <div class="filebank-empty-title">No files yet</div>
        <div class="filebank-empty-text">
          Drop files here or click upload to get started
        </div>
        <button class="filebank-action-btn primary" onclick="FileBankRevolution.openUploadModal()">
          <span>📤</span>
          <span>Upload Files</span>
        </button>
      </div>
    `;
  },

  // Close all modals
  closeModals() {
    document.querySelectorAll('.filebank-modal-overlay').forEach(overlay => {
      overlay.classList.remove('active');
    });
  },

  // Show notification
  showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // TODO: Implement beautiful toast notifications
    alert(message);
  },

  // Utility: Check if file is image
  isImageFile(file) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const ext = file.original_filename.split('.').pop().toLowerCase();
    return imageExtensions.includes(ext);
  },

  // Utility: Check if file is document
  isDocumentFile(file) {
    const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    const ext = file.original_filename.split('.').pop().toLowerCase();
    return docExtensions.includes(ext);
  },

  // Utility: Get file icon
  getFileIcon(file) {
    const ext = file.original_filename.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      ppt: '📊', pptx: '📊',
      zip: '🗜️', rar: '🗜️',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
      mp4: '🎬', mov: '🎬', avi: '🎬',
      mp3: '🎵', wav: '🎵',
      txt: '📃',
      default: '📄'
    };
    return iconMap[ext] || iconMap.default;
  },

  // Utility: Format file size
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Utility: Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours < 1) return 'Just now';
      return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  // Utility: Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // Reorder files when dragging
  reorderFiles(draggedId, targetId) {
    const draggedIndex = this.state.files.findIndex(f => f.id === draggedId);
    const targetIndex = this.state.files.findIndex(f => f.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged file
    const [draggedFile] = this.state.files.splice(draggedIndex, 1);
    
    // Insert at target position
    this.state.files.splice(targetIndex, 0, draggedFile);
    
    // Re-render
    this.render();
    
    this.showNotification('Files reordered', 'success');
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  FileBankRevolution.init();
});

// Export for global access
window.FileBankRevolution = FileBankRevolution;
