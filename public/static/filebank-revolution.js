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
    
    // Load saved file positions
    this.loadFilePositions();
    
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

    // Apply saved positions in desktop mode
    setTimeout(() => this.applyFilePositions(), 0);
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
        
        ${file.folder_is_shared ? '<div class="filebank-collab-badge">👥</div>' : ''}
        
        <div class="filebank-file-actions">
          <button class="filebank-file-action-btn ${file.is_starred ? 'starred' : ''}" 
                  onclick="FileBankRevolution.toggleStar('${file.id}')"
                  title="Star">
            ⭐
          </button>
          <button class="filebank-file-action-btn" 
                  onclick="FileBankRevolution.showFileMenu(event, '${file.id}')"
                  title="More">
            ⋯
          </button>
        </div>

        <div class="filebank-file-preview">
          ${isImage && file.file_url ? 
            `<img src="${file.file_url}" alt="${this.escapeHtml(file.original_filename)}" loading="lazy">` :
            `<div class="filebank-file-icon">${fileIcon}</div>`
          }
        </div>

        <div class="filebank-file-info">
          <div class="filebank-file-name" title="${this.escapeHtml(file.original_filename)}">
            ${this.escapeHtml(file.original_filename)}
          </div>
          
          <div class="filebank-file-meta">
            <span class="filebank-file-size">
              📊 ${fileSize}
            </span>
            <span class="filebank-file-date">
              🕒 ${fileDate}
            </span>
          </div>

          ${file.tags && file.tags.length > 0 ? `
            <div class="filebank-file-tags">
              ${file.tags.map(tag => `<span class="filebank-file-tag">${this.escapeHtml(tag)}</span>`).join('')}
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

      // Drag start - Desktop-style positioning
      card.addEventListener('dragstart', (e) => {
        this.state.draggedFile = fileId;
        card.classList.add('dragging');
        
        // Store initial mouse position relative to card
        const rect = card.getBoundingClientRect();
        this.state.dragStartX = e.clientX;
        this.state.dragStartY = e.clientY;
        this.state.dragOffsetX = e.clientX - rect.left;
        this.state.dragOffsetY = e.clientY - rect.top;
        
        // Set drag image to the card itself
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(card, this.state.dragOffsetX, this.state.dragOffsetY);
        
        // Visual feedback: We're dragging INTERNAL file, not uploading
        document.getElementById('filebank-canvas').classList.add('dragging-internal');
      });

      // Drag over - Show where file will be placed
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.state.draggedFile && this.state.draggedFile !== fileId) {
          card.style.opacity = '0.5';
        }
      });

      card.addEventListener('dragleave', () => {
        card.style.opacity = '';
      });

      // Drop on another card - Swap positions
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.style.opacity = '';
        
        if (this.state.draggedFile && this.state.draggedFile !== fileId) {
          console.log('🔄 Swapping file positions:', this.state.draggedFile, '↔', fileId);
          // TODO: Implement position swap logic
        }
      });

      // Drag end - Save new position
      card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
        
        // In desktop mode, save absolute position
        if (this.state.currentView === 'grid') {
          const canvas = document.getElementById('filebank-canvas');
          const canvasRect = canvas.getBoundingClientRect();
          
          // Calculate position relative to canvas
          const x = e.clientX - canvasRect.left - this.state.dragOffsetX;
          const y = e.clientY - canvasRect.top - this.state.dragOffsetY;
          
          // Snap to grid (optional - 20px grid)
          const snapSize = 20;
          const snappedX = Math.round(x / snapSize) * snapSize;
          const snappedY = Math.round(y / snapSize) * snapSize;
          
          // Save position
          this.state.filePositions[fileId] = {
            x: Math.max(0, snappedX),
            y: Math.max(0, snappedY)
          };
          
          // Apply position immediately
          card.style.left = this.state.filePositions[fileId].x + 'px';
          card.style.top = this.state.filePositions[fileId].y + 'px';
          
          console.log(`📍 File ${fileId} positioned at (${this.state.filePositions[fileId].x}, ${this.state.filePositions[fileId].y})`);
          
          // Save to localStorage for persistence
          this.saveFilePositions();
        }
        
        this.state.draggedFile = null;
        
        // Remove internal drag feedback
        document.getElementById('filebank-canvas').classList.remove('dragging-internal');
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
    const file = this.state.files.find(f => f.id === fileId);
    if (!file) return;

    console.log('📂 Opening file:', file.original_filename);

    // If it's an image, show in preview modal
    if (this.isImageFile(file)) {
      this.showImagePreview(file);
    } else {
      // Download or open in new tab
      if (file.file_url) {
        window.open(file.file_url, '_blank');
      } else {
        this.showNotification('File URL not available', 'error');
      }
    }
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
    const file = this.state.files.find(f => f.id === fileId);
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
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

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
        this.showNotification('Folder created', 'success');
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

  // Save file positions to localStorage
  saveFilePositions() {
    try {
      const key = `filebank_positions_${this.state.userEmail}`;
      localStorage.setItem(key, JSON.stringify(this.state.filePositions));
      console.log('💾 File positions saved');
    } catch (error) {
      console.error('Error saving positions:', error);
    }
  },

  // Load file positions from localStorage
  loadFilePositions() {
    try {
      const key = `filebank_positions_${this.state.userEmail}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        this.state.filePositions = JSON.parse(saved);
        console.log(`📍 Loaded ${Object.keys(this.state.filePositions).length} file positions`);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      this.state.filePositions = {};
    }
  },

  // Apply saved positions to rendered cards
  applyFilePositions() {
    if (this.state.currentView !== 'grid') return;

    Object.keys(this.state.filePositions).forEach(fileId => {
      const card = document.querySelector(`[data-file-id="${fileId}"]`);
      if (card) {
        const pos = this.state.filePositions[fileId];
        card.style.left = pos.x + 'px';
        card.style.top = pos.y + 'px';
      }
    });
  },

  // Reset all positions (organize automatically)
  resetFilePositions() {
    this.state.filePositions = {};
    this.saveFilePositions();
    this.render();
    this.showNotification('File positions reset', 'info');
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  FileBankRevolution.init();
});

// Export for global access
window.FileBankRevolution = FileBankRevolution;
