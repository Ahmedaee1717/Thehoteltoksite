// ============================================
// FILE BANK PRO - OS-Level File Management
// ============================================

const FileBankPro = {
  state: {
    files: [],
    folders: [],
    selectedFiles: [],
    selectedFolders: [],
    currentFolder: null,
    currentView: 'grid',
    currentFilter: 'all',
    searchQuery: '',
    userEmail: localStorage.getItem('userEmail') || 'admin@investaycapital.com',
    draggedItem: null,
    draggedType: null, // 'file' or 'folder'
    contextMenuTarget: null,
    contextMenuType: null
  },

  // Initialize
  async init() {
    console.log('🚀 Initializing File Bank Pro...');
    
    // Load data
    await this.loadFolders();
    await this.loadFiles();
    
    // Render
    this.render();
    
    // Setup event listeners
    this.setupEventListeners();
    this.setupGlobalContextMenu();
    
    // Integrate with existing FileBankRevolution if it exists
    if (window.FileBankRevolution) {
      this.integrateWithExisting();
    }
    
    console.log('✅ File Bank Pro Ready!');
  },

  // Integrate with existing FileBank
  integrateWithExisting() {
    // Copy file card creation from existing implementation
    if (window.FileBankRevolution.createFileCard) {
      this.createFileCard = window.FileBankRevolution.createFileCard.bind(window.FileBankRevolution);
    }
    
    // Share state
    this.state.userEmail = window.FileBankRevolution.state.userEmail;
  },

  // Load folders
  async loadFolders() {
    try {
      const response = await fetch(`/api/filebank/folders?userEmail=${encodeURIComponent(this.state.userEmail)}`);
      const data = await response.json();
      this.state.folders = data.folders || [];
      console.log(`✅ Loaded ${this.state.folders.length} folders`);
    } catch (error) {
      console.error('❌ Error loading folders:', error);
    }
  },

  // Load files
  async loadFiles() {
    try {
      const response = await fetch(`/api/filebank/files?userEmail=${encodeURIComponent(this.state.userEmail)}`);
      const data = await response.json();
      this.state.files = data.files || [];
      console.log(`✅ Loaded ${this.state.files.length} files`);
    } catch (error) {
      console.error('❌ Error loading files:', error);
    }
  },

  // Render folders in sidebar
  renderFolders() {
    const container = document.getElementById('filebank-folders-list');
    if (!container) return;

    const html = `
      ${this.state.folders.map(folder => this.createFolderItem(folder)).join('')}
    `;
    
    container.innerHTML = html;
    this.setupFolderListeners();
  },

  // Create folder item HTML
  createFolderItem(folder) {
    const isActive = this.state.currentFolder === folder.id;
    const isShared = folder.is_team_shared === 1;
    const isOwner = folder.user_email === this.state.userEmail;
    
    return `
      <div class="filebank-folder-item ${isActive ? 'active' : ''}" 
           data-folder-id="${folder.id}"
           draggable="true"
           oncontextmenu="event.preventDefault(); FileBankPro.showFolderContextMenu(event, ${folder.id}); return false;">
        <div class="filebank-folder-icon">${folder.icon || '📁'}</div>
        <div class="filebank-folder-name">${this.escapeHtml(folder.folder_name)}</div>
        ${isShared ? '<div class="filebank-folder-badge">🌐</div>' : ''}
        <div class="filebank-folder-count">${this.getFilesInFolder(folder.id).length}</div>
      </div>
    `;
  },

  // Setup folder listeners
  setupFolderListeners() {
    document.querySelectorAll('.filebank-folder-item').forEach(item => {
      const folderId = parseInt(item.dataset.folderId);
      
      // Click to open
      item.addEventListener('click', () => {
        this.state.currentFolder = folderId;
        this.renderFolders();
        this.render();
      });
      
      // Drag start
      item.addEventListener('dragstart', (e) => {
        this.state.draggedItem = folderId;
        this.state.draggedType = 'folder';
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      
      // Drag end
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        this.state.draggedItem = null;
        this.state.draggedType = null;
      });
      
      // Drop zone
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.state.draggedType === 'file') {
          item.classList.add('drag-over');
        }
      });
      
      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });
      
      item.addEventListener('drop', async (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        
        if (this.state.draggedType === 'file' && this.state.draggedItem) {
          await this.moveFileToFolder(this.state.draggedItem, folderId);
        }
      });
    });
  },

  // Get files in folder
  getFilesInFolder(folderId) {
    return this.state.files.filter(f => f.folder_id === folderId);
  },

  // Move file to folder
  async moveFileToFolder(fileId, folderId) {
    try {
      const response = await fetch(`/api/filebank/files/${fileId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: this.state.userEmail,
          folderId: folderId
        })
      });

      if (response.ok) {
        await this.loadFiles();
        this.render();
        this.renderFolders();
        this.showNotification(`📁 File moved successfully`, 'success');
      } else {
        throw new Error('Move failed');
      }
    } catch (error) {
      console.error('Move error:', error);
      this.showNotification('Failed to move file', 'error');
    }
  },

  // Setup global context menu (right-click anywhere)
  setupGlobalContextMenu() {
    const grid = document.getElementById('filebank-grid');
    if (!grid) return;

    grid.addEventListener('contextmenu', (e) => {
      // If right-clicking on empty space (not on a file)
      if (e.target === grid || e.target.closest('.filebank-grid')) {
        e.preventDefault();
        this.showGlobalContextMenu(e);
      }
    });

    // Close context menu on click outside
    document.addEventListener('click', () => {
      this.closeAllContextMenus();
    });
  },

  // Show global context menu
  showGlobalContextMenu(event) {
    this.closeAllContextMenus();
    
    const menu = document.createElement('div');
    menu.id = 'filebank-global-context-menu';
    menu.className = 'filebank-context-menu active';
    menu.style.cssText = `
      position: fixed;
      left: ${event.pageX}px;
      top: ${event.pageY}px;
      background: linear-gradient(135deg, #1a1d3e 0%, #2d3561 100%);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      min-width: 200px;
    `;
    
    menu.innerHTML = `
      <div class="filebank-context-item" onclick="FileBankPro.createFolderModal()">
        <span>📁</span>
        <span>New Folder</span>
        <span style="margin-left: auto; opacity: 0.5; font-size: 11px;">Ctrl+Shift+N</span>
      </div>
      <div class="filebank-context-divider"></div>
      <div class="filebank-context-item" onclick="document.querySelector('#filebank-upload-btn').click(); FileBankPro.closeAllContextMenus();">
        <span>📤</span>
        <span>Upload Files</span>
        <span style="margin-left: auto; opacity: 0.5; font-size: 11px;">Ctrl+U</span>
      </div>
      <div class="filebank-context-divider"></div>
      <div class="filebank-context-item" onclick="FileBankPro.refreshAll()">
        <span>🔄</span>
        <span>Refresh</span>
        <span style="margin-left: auto; opacity: 0.5; font-size: 11px;">F5</span>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // Position adjustment if menu goes off-screen
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
      }
    }, 0);
  },

  // Show folder context menu
  showFolderContextMenu(event, folderId) {
    event.stopPropagation();
    this.closeAllContextMenus();
    
    const folder = this.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const isOwner = folder.user_email === this.state.userEmail;
    const isShared = folder.is_team_shared === 1;
    
    const menu = document.createElement('div');
    menu.id = 'filebank-folder-context-menu';
    menu.className = 'filebank-context-menu active';
    menu.style.cssText = `
      position: fixed;
      left: ${event.pageX}px;
      top: ${event.pageY}px;
      background: linear-gradient(135deg, #1a1d3e 0%, #2d3561 100%);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      min-width: 220px;
    `;
    
    menu.innerHTML = `
      <div class="filebank-context-item" onclick="FileBankPro.openFolder(${folderId})">
        <span>📂</span>
        <span>Open</span>
      </div>
      <div class="filebank-context-divider"></div>
      ${isOwner ? `
        <div class="filebank-context-item" onclick="FileBankPro.toggleFolderShare(${folderId})">
          <span>${isShared ? '🔓' : '🔒'}</span>
          <span>${isShared ? 'Make Private' : 'Share with Team'}</span>
        </div>
        <div class="filebank-context-item" onclick="FileBankPro.renameFolderModal(${folderId})">
          <span>✏️</span>
          <span>Rename</span>
        </div>
        <div class="filebank-context-divider"></div>
        <div class="filebank-context-item danger" onclick="FileBankPro.deleteFolder(${folderId})">
          <span>🗑️</span>
          <span>Delete Folder</span>
        </div>
      ` : `
        <div class="filebank-context-item disabled">
          <span>🔒</span>
          <span>You don't own this folder</span>
        </div>
      `}
    `;
    
    document.body.appendChild(menu);
  },

  // Close all context menus
  closeAllContextMenus() {
    document.querySelectorAll('.filebank-context-menu').forEach(menu => {
      menu.remove();
    });
  },

  // Create folder modal
  createFolderModal() {
    this.closeAllContextMenus();
    
    const modal = document.createElement('div');
    modal.id = 'filebank-create-folder-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #1a1d3e 0%, #2d3561 100%); border-radius: 16px; padding: 40px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid rgba(102, 126, 234, 0.3); animation: slideUp 0.3s ease;">
        <h3 style="color: white; margin: 0 0 25px 0; font-size: 24px; font-weight: 600; text-align: center;">📁 Create New Folder</h3>
        
        <div style="margin-bottom: 20px;">
          <label style="color: rgba(255, 255, 255, 0.9); display: block; margin-bottom: 10px; font-size: 14px; font-weight: 500;">Folder Name:</label>
          <input type="text" 
                 id="folder-name-input" 
                 placeholder="Enter folder name..." 
                 style="width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.08); border: 2px solid rgba(102, 126, 234, 0.3); border-radius: 10px; color: white; font-size: 15px; outline: none; transition: all 0.3s;"
                 onkeypress="if(event.key==='Enter') FileBankPro.confirmCreateFolder()"
                 autofocus>
        </div>
        
        <div style="margin-bottom: 25px;">
          <label style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="folder-share-checkbox" style="width: 20px; height: 20px; cursor: pointer;">
            <span style="font-size: 14px;">🌐 Share with team (everyone can access)</span>
          </label>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button onclick="FileBankPro.closeModal()" 
                  style="padding: 12px 24px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;">
            Cancel
          </button>
          <button onclick="FileBankPro.confirmCreateFolder()" 
                  style="padding: 12px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            ✨ Create Folder
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('folder-name-input').focus(), 100);
  },

  // Confirm create folder
  async confirmCreateFolder() {
    const input = document.getElementById('folder-name-input');
    const shareCheckbox = document.getElementById('folder-share-checkbox');
    const folderName = input?.value.trim();
    const isShared = shareCheckbox?.checked || false;
    
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
          parent_folder_id: this.state.currentFolder,
          is_team_shared: isShared ? 1 : 0
        })
      });

      if (response.ok) {
        await this.loadFolders();
        this.renderFolders();
        this.showNotification(`✅ Folder "${folderName}" created${isShared ? ' and shared' : ''}`, 'success');
        this.closeModal();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      this.showNotification(`Failed to create folder: ${error.message}`, 'error');
    }
  },

  // Toggle folder share
  async toggleFolderShare(folderId) {
    this.closeAllContextMenus();
    
    const folder = this.state.folders.find(f => f.id === folderId);
    if (!folder || folder.user_email !== this.state.userEmail) {
      this.showNotification('❌ You can only share your own folders', 'error');
      return;
    }

    const newState = folder.is_team_shared === 1 ? 0 : 1;
    
    try {
      const response = await fetch(`/api/filebank/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: this.state.userEmail,
          is_team_shared: newState
        })
      });

      if (response.ok) {
        await this.loadFolders();
        this.renderFolders();
        this.showNotification(
          newState ? `🌐 Folder "${folder.folder_name}" is now shared with everyone` : `🔒 Folder "${folder.folder_name}" is now private`,
          'success'
        );
      } else {
        throw new Error('Failed to update folder');
      }
    } catch (error) {
      console.error('Error toggling folder share:', error);
      this.showNotification('Failed to update folder', 'error');
    }
  },

  // Open folder
  openFolder(folderId) {
    this.closeAllContextMenus();
    this.state.currentFolder = folderId;
    this.renderFolders();
    this.render();
  },

  // Delete folder
  async deleteFolder(folderId) {
    this.closeAllContextMenus();
    
    const folder = this.state.folders.find(f => f.id === folderId);
    if (!folder) return;

    if (!confirm(`Delete folder "${folder.folder_name}"?\n\nAll files in this folder will also be deleted. This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/filebank/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: this.state.userEmail })
      });

      if (response.ok) {
        await this.loadFolders();
        await this.loadFiles();
        this.renderFolders();
        this.render();
        this.showNotification(`🗑️ Folder "${folder.folder_name}" deleted`, 'success');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      this.showNotification('Failed to delete folder', 'error');
    }
  },

  // Close modal
  closeModal() {
    const modals = document.querySelectorAll('[id*="modal"]');
    modals.forEach(modal => modal.remove());
  },

  // Refresh all
  async refreshAll() {
    this.closeAllContextMenus();
    await this.loadFolders();
    await this.loadFiles();
    this.renderFolders();
    this.render();
    this.showNotification('🔄 Refreshed', 'success');
  },

  // Setup event listeners
  setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key === 'N') {
          e.preventDefault();
          this.createFolderModal();
        } else if (e.key === 'u') {
          e.preventDefault();
          document.querySelector('#filebank-upload-btn')?.click();
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        this.refreshAll();
      }
    });
  },

  // Render files AND folders in grid
  render() {
    const grid = document.getElementById('filebank-grid');
    if (!grid) return;

    const filteredFiles = this.getFilteredFiles();
    const filteredFolders = this.getFilteredFolders();

    if (filteredFiles.length === 0 && filteredFolders.length === 0) {
      this.renderEmptyState(grid);
      return;
    }

    // Render folders FIRST, then files
    const foldersHTML = filteredFolders.map(folder => this.createFolderCard(folder)).join('');
    const filesHTML = filteredFiles.map(file => this.createFileCard(file)).join('');
    
    grid.innerHTML = foldersHTML + filesHTML;

    // Setup event listeners
    this.setupFolderCardListeners();
    this.setupFileCardListeners();
  },

  // Get filtered folders (show subfolders of current folder)
  getFilteredFolders() {
    let folders = this.state.folders;

    // Filter by parent folder
    if (this.state.currentFolder) {
      folders = folders.filter(f => f.parent_folder_id === this.state.currentFolder);
    } else {
      // Show top-level folders (no parent)
      folders = folders.filter(f => !f.parent_folder_id);
    }

    return folders;
  },

  // Create folder card (looks like a folder in the grid)
  createFolderCard(folder) {
    const isOwner = folder.user_email === this.state.userEmail;
    const isShared = folder.is_team_shared === 1;
    const fileCount = this.getFilesInFolder(folder.id).length;

    return `
      <div class="filebank-folder-card" 
           data-folder-id="${folder.id}"
           draggable="true"
           ondblclick="FileBankPro.openFolder(${folder.id})"
           oncontextmenu="event.preventDefault(); FileBankPro.showFolderContextMenu(event, ${folder.id}); return false;"
           style="position: relative; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border: 2px solid rgba(102, 126, 234, 0.3); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        
        ${isShared ? '<div class="filebank-collab-badge" style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);" title="Shared with everyone">🌐</div>' : ''}
        ${!isOwner ? '<div class="filebank-collab-badge" style="position: absolute; top: 42px; right: 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);" title="Not your folder">👤</div>' : ''}
        
        <div style="font-size: 80px; margin-bottom: 15px;">${folder.icon || '📁'}</div>
        
        <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px; word-break: break-word;">
          ${this.escapeHtml(folder.folder_name)}
        </div>
        
        <div style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">
          ${fileCount} file${fileCount !== 1 ? 's' : ''}
        </div>
        
        ${isOwner ? `
          <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; display: flex; gap: 8px; justify-content: center;">
            <button onclick="event.stopPropagation(); FileBankPro.toggleFolderShare(${folder.id})"
                    style="flex: 1; padding: 8px 12px; background: ${isShared ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(102, 126, 234, 0.2)'}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">
              ${isShared ? '🔓 SHARED' : '🔒 SHARE'}
            </button>
            <button onclick="event.stopPropagation(); FileBankPro.deleteFolder(${folder.id})"
                    style="padding: 8px 12px; background: rgba(239, 68, 68, 0.2); color: #ff6b6b; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">
              🗑️
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Create file card (delegate to existing implementation or create simple one)
  createFileCard(file) {
    // If FileBankRevolution exists and has createFileCard, use it
    if (window.FileBankRevolution && window.FileBankRevolution.createFileCard) {
      return window.FileBankRevolution.createFileCard.call(window.FileBankRevolution, file);
    }
    
    // Otherwise, create a simple file card
    const isOwner = file.user_email === this.state.userEmail;
    const fileSize = this.formatFileSize(file.file_size);
    const fileIcon = this.getSimpleFileIcon(file);
    
    return `
      <div class="filebank-file-card" 
           data-file-id="${file.id}"
           draggable="true"
           style="background: linear-gradient(135deg, rgba(26, 29, 62, 0.6) 0%, rgba(45, 53, 97, 0.6) 100%); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s;">
        
        <div style="font-size: 64px; text-align: center; margin-bottom: 15px;">${fileIcon}</div>
        
        <div style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 8px; word-break: break-word; text-align: center;">
          ${this.escapeHtml(file.original_filename)}
        </div>
        
        <div style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-align: center;">
          ${fileSize}
        </div>
      </div>
    `;
  },

  // Get simple file icon
  getSimpleFileIcon(file) {
    const ext = file.file_extension?.toLowerCase();
    const iconMap = {
      'pdf': '📄',
      'doc': '📝', 'docx': '📝',
      'xls': '📊', 'xlsx': '📊', 'csv': '📊',
      'ppt': '📊', 'pptx': '📊',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
      'mp4': '🎬', 'mov': '🎬', 'avi': '🎬',
      'mp3': '🎵', 'wav': '🎵',
      'zip': '🗜️', 'rar': '🗜️',
      'txt': '📃'
    };
    return iconMap[ext] || '📄';
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  // Setup folder card listeners
  setupFolderCardListeners() {
    document.querySelectorAll('.filebank-folder-card').forEach(card => {
      const folderId = parseInt(card.dataset.folderId);
      
      // Drag start
      card.addEventListener('dragstart', (e) => {
        this.state.draggedItem = folderId;
        this.state.draggedType = 'folder';
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      
      // Drag end
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.state.draggedItem = null;
        this.state.draggedType = null;
      });
      
      // Drop zone (accept files)
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.state.draggedType === 'file') {
          card.style.transform = 'scale(1.05)';
          card.style.borderColor = '#667eea';
          card.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
        }
      });
      
      card.addEventListener('dragleave', () => {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      });
      
      card.addEventListener('drop', async (e) => {
        e.preventDefault();
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
        
        if (this.state.draggedType === 'file' && this.state.draggedItem) {
          await this.moveFileToFolder(this.state.draggedItem, folderId);
        }
      });
    });
  },

  // Setup file card listeners
  setupFileCardListeners() {
    document.querySelectorAll('.filebank-file-card').forEach(card => {
      const fileId = parseInt(card.dataset.fileId);
      
      // Drag start
      card.addEventListener('dragstart', (e) => {
        this.state.draggedItem = fileId;
        this.state.draggedType = 'file';
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      
      // Drag end
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.state.draggedItem = null;
        this.state.draggedType = null;
      });
    });
  },

  // Render empty state
  renderEmptyState(grid) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.6);">
        <div style="font-size: 64px; margin-bottom: 20px;">📁</div>
        <h3 style="font-size: 20px; margin-bottom: 10px; color: rgba(255, 255, 255, 0.8);">No files or folders yet</h3>
        <p style="font-size: 14px; margin-bottom: 20px;">Right-click to create a folder or upload files</p>
        <button onclick="FileBankPro.createFolderModal()" style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
          📁 Create Folder
        </button>
      </div>
    `;
  },

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FileBankPro.init());
} else {
  FileBankPro.init();
}

// Expose globally
window.FileBankPro = FileBankPro;
