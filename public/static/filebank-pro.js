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
    this.renderFolders();
    this.render();
    
    // Setup event listeners
    this.setupEventListeners();
    this.setupGlobalContextMenu();
    
    console.log('✅ File Bank Pro Ready!');
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

  // Render files (stub - keep existing render logic)
  render() {
    // Keep existing file rendering logic
    console.log('Rendering files...');
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
