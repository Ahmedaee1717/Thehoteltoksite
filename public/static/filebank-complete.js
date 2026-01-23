// 🚀 COMPLETE FILE BANK - OS-LEVEL FILE MANAGEMENT 🚀
// Built to the HIGHEST standards: Fast, Simple, Smooth, Impressive

window.FileBankComplete = {
  async init() {
    console.log('🚀 Initializing Complete File Bank...');
    
    // Wait for FileBankRevolution
    if (!window.FileBankRevolution) {
      console.error('❌ FileBankRevolution not found!');
      return;
    }
    
    const FBR = window.FileBankRevolution;
    
    // NOTE: getFilteredFiles in filebank-revolution.js already handles folder filtering correctly
    // We don't need to override it anymore
    
    // Override render to show FOLDERS FIRST as big cards
    const originalRender = FBR.render.bind(FBR);
    FBR.render = function() {
      const grid = document.getElementById('filebank-grid');
      if (!grid) return;

      const filteredFiles = this.getFilteredFiles();
      
      // FILTER OUT "Team Shared" folders from grid - they only show in sidebar
      // Also filter based on currentFolder
      const filteredFolders = this.state.folders.filter(f => {
        // Hide "Team Shared" folders in main grid
        if (f.folder_name === 'Team Shared' || f.folder_name === 'Shared') {
          return false;
        }
        
        // SHARED TAB: Only show shared folders (is_team_shared === 1)
        if (this.state.currentFilter === 'shared') {
          return f.is_team_shared === 1;
        }
        
        // Show folders based on current location
        if (this.state.currentFolder) {
          return f.parent_folder_id === this.state.currentFolder;
        } else {
          return !f.parent_folder_id;
        }
      });

      if (filteredFiles.length === 0 && filteredFolders.length === 0) {
        this.renderEmptyState(grid);
        return;
      }

      // Render folders FIRST, then files
      const foldersHTML = filteredFolders.map(folder => window.FileBankComplete.createFolderCard(folder)).join('');
      const filesHTML = filteredFiles.map(file => this.createFileCard(file)).join('');
      
      grid.innerHTML = foldersHTML + filesHTML;

      // Setup ALL listeners
      this.setupFileCardListeners();
      window.FileBankComplete.setupFolderListeners();
      window.FileBankComplete.setupDragDropIntoFolders();
      window.FileBankComplete.setupRightClickMenu();
    };
    
    // Force re-render to show folders immediately
    FBR.render();
    
    console.log('✅ Complete File Bank Ready!');
  },
  
  // Get files inside folder for preview
  getFilesInFolder(folderId) {
    const FBR = window.FileBankRevolution;
    return FBR.state.files.filter(f => f.folder_id === folderId);
  },
  
  // Generate folder preview content
  generateFolderPreview(folder) {
    const files = this.getFilesInFolder(folder.id);
    if (files.length === 0) {
      return `<div style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 12px;">📂 Empty folder</div>`;
    }
    
    const previewFiles = files.slice(0, 5);
    return `
      <div style="padding: 16px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-top: 12px;">
        <div style="color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">📁 Contents</div>
        ${previewFiles.map(f => `
          <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; margin-bottom: 4px;">
            <span style="font-size: 16px;">${window.FileBankRevolution.getFileIcon(f)}</span>
            <div style="flex: 1; min-width: 0;">
              <div style="color: white; font-size: 11px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(f.original_filename)}</div>
              <div style="color: rgba(255, 255, 255, 0.5); font-size: 9px;">${this.formatFileSize(f.file_size)}</div>
            </div>
          </div>
        `).join('')}
        ${files.length > 5 ? `<div style="color: rgba(255, 255, 255, 0.5); font-size: 10px; text-align: center; margin-top: 8px;">+${files.length - 5} more files</div>` : ''}
      </div>
    `;
  },
  
  // Create beautiful folder card
  createFolderCard(folder) {
    const FBR = window.FileBankRevolution;
    const isOwner = folder.user_email === FBR.state.userEmail;
    const isShared = folder.is_team_shared === 1;
    const fileCount = FBR.state.files.filter(f => f.folder_id === folder.id).length;
    const totalSize = FBR.state.files
      .filter(f => f.folder_id === folder.id)
      .reduce((sum, f) => sum + (f.file_size || 0), 0);
    
    // Check if column view
    const isColumnView = document.getElementById('filebank-grid')?.classList.contains('columns-view');

    console.log('📁 Rendering folder:', { 
      name: folder.folder_name, 
      is_team_shared: folder.is_team_shared, 
      isShared,
      rawFolder: folder 
    });

    return `
      <div class="filebank-folder-card filebank-file-card" 
           data-folder-id="${folder.id}"
           data-folder-owner="${folder.user_email}"
           ondblclick="window.FileBankComplete.openFolder(${folder.id})"
           oncontextmenu="event.preventDefault(); window.FileBankComplete.showFolderMenu(event, ${folder.id}); return false;"
           style="position: relative; 
                  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%); 
                  border: 2px solid rgba(102, 126, 234, 0.4);
                  transition: all 0.3s ease;
                  cursor: pointer;">
        
        ${isShared ? `
          <div style="position: absolute; top: 12px; right: 12px; 
                      background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
                      backdrop-filter: blur(10px);
                      padding: 8px 14px;
                      border-radius: 10px;
                      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                      border: 1px solid rgba(255, 255, 255, 0.2);">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 14px;">🌐</span>
              <span style="color: white; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">SHARED</span>
            </div>
            <div style="color: rgba(255, 255, 255, 0.9); font-size: 10px; font-weight: 500;">
              by ${this.getDisplayName(folder.user_email)}
            </div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 9px; margin-top: 2px;">
              ${this.formatTimeAgo(folder.updated_at || folder.created_at)}
            </div>
          </div>
        ` : ''}
        
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: ${isColumnView ? 'flex-start' : 'center'}; padding: ${isColumnView ? '20px' : '40px 20px'}; text-align: center;">
          <div style="font-size: ${isColumnView ? '60px' : '80px'}; margin-bottom: 15px; filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3));">${folder.icon || '📁'}</div>
          <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${this.escapeHtml(folder.folder_name)}</div>
          <div style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">${fileCount} file${fileCount !== 1 ? 's' : ''} · ${this.formatFileSize(totalSize)}</div>
          
          ${isColumnView ? this.generateFolderPreview(folder) : ''}
        </div>
        
        ${isOwner ? `
          <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; display: flex; gap: 8px;">
            <button onclick="event.stopPropagation(); window.FileBankComplete.toggleFolderShare(${folder.id})"
                    style="flex: 1; padding: 10px; 
                           background: ${isShared ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))'}; 
                           color: white; border: none; border-radius: 8px; cursor: pointer; 
                           font-size: 12px; font-weight: 600; 
                           transition: all 0.2s ease;
                           box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
              ${isShared ? '🔓 SHARED' : '🔒 SHARE'}
            </button>
          </div>
        ` : ''}
        
        <!-- Drop zone indicator -->
        <div class="folder-drop-indicator" style="display: none; position: absolute; inset: 0; background: rgba(102, 126, 234, 0.3); border: 3px dashed #667eea; border-radius: 12px; pointer-events: none;"></div>
      </div>
    `;
  },
  
  // Setup folder listeners
  setupFolderListeners() {
    document.querySelectorAll('.filebank-folder-card').forEach(card => {
      // Hover effects
      card.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.3)';
      });
      
      card.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      });
    });
  },
  
  // Setup drag & drop into folders
  setupDragDropIntoFolders() {
    const FBR = window.FileBankRevolution;
    
    // Make files draggable AND add right-click menu
    document.querySelectorAll('.filebank-file-card:not(.filebank-folder-card)').forEach(fileCard => {
      fileCard.draggable = true;
      
      // Right-click context menu for files
      fileCard.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fileId = e.currentTarget.dataset.fileId;
        if (fileId) {
          this.showFileMenu(e, fileId);
        }
      });
      
      fileCard.addEventListener('dragstart', (e) => {
        const fileId = e.currentTarget.dataset.fileId;
        if (!fileId) return;
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', fileId);
        e.currentTarget.style.opacity = '0.5';
        
        console.log('🎯 Drag started:', fileId);
      });
      
      fileCard.addEventListener('dragend', (e) => {
        e.currentTarget.style.opacity = '1';
      });
    });
    
    // Make folders drop targets
    document.querySelectorAll('.filebank-folder-card').forEach(folderCard => {
      folderCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Show drop indicator
        const indicator = folderCard.querySelector('.folder-drop-indicator');
        if (indicator) indicator.style.display = 'block';
        
        folderCard.style.transform = 'scale(1.08)';
        folderCard.style.boxShadow = '0 16px 48px rgba(102, 126, 234, 0.5)';
      });
      
      folderCard.addEventListener('dragleave', (e) => {
        const indicator = folderCard.querySelector('.folder-drop-indicator');
        if (indicator) indicator.style.display = 'none';
        
        folderCard.style.transform = 'translateY(0) scale(1)';
        folderCard.style.boxShadow = 'none';
      });
      
      folderCard.addEventListener('drop', async (e) => {
        e.preventDefault();
        
        const indicator = folderCard.querySelector('.folder-drop-indicator');
        if (indicator) indicator.style.display = 'none';
        
        folderCard.style.transform = 'translateY(0) scale(1)';
        folderCard.style.boxShadow = 'none';
        
        const fileId = e.dataTransfer.getData('text/plain');
        const folderId = folderCard.dataset.folderId;
        
        if (!fileId || !folderId) return;
        
        console.log('📂 Dropped file', fileId, 'into folder', folderId);
        
        await this.moveFileToFolder(fileId, folderId);
      });
    });
  },
  
  // Move file to folder
  async moveFileToFolder(fileId, folderId) {
    const FBR = window.FileBankRevolution;
    
    try {
      FBR.showNotification('📦 Moving file...', 'info');
      
      const response = await fetch(`/api/filebank/files/${fileId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: FBR.state.userEmail,
          folderId: parseInt(folderId)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await FBR.loadFiles();
        FBR.render();
        FBR.showNotification('✅ File moved successfully!', 'success');
      } else {
        throw new Error(data.error || 'Failed to move file');
      }
    } catch (error) {
      console.error('❌ Move error:', error);
      FBR.showNotification('❌ Failed to move file: ' + error.message, 'error');
    }
  },
  
  // Setup right-click context menu
  setupRightClickMenu() {
    const grid = document.getElementById('filebank-grid');
    if (!grid) return;
    
    // Right-click on empty space
    grid.addEventListener('contextmenu', (e) => {
      // Only trigger if clicking on the grid itself, not a file/folder
      if (e.target.id === 'filebank-grid' || e.target.classList.contains('filebank-empty-state')) {
        e.preventDefault();
        this.showGlobalContextMenu(e);
      }
    });
  },
  
  // Show global context menu (right-click on empty space)
  showGlobalContextMenu(event) {
    const FBR = window.FileBankRevolution;
    
    // Remove existing menu
    const existingMenu = document.getElementById('filebank-global-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create menu
    const menu = document.createElement('div');
    menu.id = 'filebank-global-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${event.pageX}px;
      top: ${event.pageY}px;
      background: rgba(20, 24, 36, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 12px;
      padding: 8px;
      z-index: 10000;
      min-width: 200px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
      animation: menuSlideIn 0.2s ease;
    `;
    
    menu.innerHTML = `
      <div class="context-menu-item" onclick="window.FileBankComplete.createFolderFromMenu()">
        <span style="font-size: 18px;">📁</span>
        <span>New Folder</span>
        <span style="opacity: 0.5; font-size: 11px;">Ctrl+Shift+N</span>
      </div>
      <div class="context-menu-item" onclick="window.FileBankRevolution.openUploadModal(); document.getElementById('filebank-global-menu').remove();">
        <span style="font-size: 18px;">📤</span>
        <span>Upload Files</span>
        <span style="opacity: 0.5; font-size: 11px;">Ctrl+U</span>
      </div>
      <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>
      <div class="context-menu-item" onclick="window.FileBankRevolution.loadFiles(); window.FileBankRevolution.loadFolders(); window.FileBankRevolution.render(); document.getElementById('filebank-global-menu').remove();">
        <span style="font-size: 18px;">🔄</span>
        <span>Refresh</span>
        <span style="opacity: 0.5; font-size: 11px;">F5</span>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  },
  
  // Show folder context menu
  showFolderMenu(event, folderId) {
    const FBR = window.FileBankRevolution;
    const folder = FBR.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const isOwner = folder.user_email === FBR.state.userEmail;
    const isShared = folder.is_team_shared === 1;
    
    // Remove existing menu
    const existingMenu = document.getElementById('filebank-global-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create menu
    const menu = document.createElement('div');
    menu.id = 'filebank-global-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${event.pageX}px;
      top: ${event.pageY}px;
      background: rgba(20, 24, 36, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 12px;
      padding: 8px;
      z-index: 10000;
      min-width: 220px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
      animation: menuSlideIn 0.2s ease;
    `;
    
    menu.innerHTML = `
      <div class="context-menu-item" onclick="window.FileBankComplete.openFolder(${folderId}); document.getElementById('filebank-global-menu').remove();">
        <span style="font-size: 18px;">📂</span>
        <span>Open Folder</span>
      </div>
      ${isOwner ? `
        <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>
        <div class="context-menu-item" onclick="window.FileBankComplete.toggleFolderShare(${folderId}); document.getElementById('filebank-global-menu').remove();">
          <span style="font-size: 18px;">${isShared ? '🔓' : '🔒'}</span>
          <span>${isShared ? 'Make Private' : 'Share with Team'}</span>
        </div>
        <div class="context-menu-item" onclick="window.FileBankComplete.renameFolder(${folderId}); document.getElementById('filebank-global-menu').remove();">
          <span style="font-size: 18px;">✏️</span>
          <span>Rename</span>
        </div>
        <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>
        <div class="context-menu-item context-menu-danger" onclick="window.FileBankComplete.deleteFolder(${folderId}); document.getElementById('filebank-global-menu').remove();">
          <span style="font-size: 18px;">🗑️</span>
          <span>Delete Folder</span>
        </div>
      ` : `
        <div style="padding: 12px; color: rgba(255,255,255,0.5); font-size: 12px; text-align: center;">
          You don't own this folder
        </div>
      `}
    `;
    
    document.body.appendChild(menu);
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  },
  
  // Show file context menu
  showFileMenu(event, fileId) {
    const FBR = window.FileBankRevolution;
    const file = FBR.state.files.find(f => f.id == fileId);
    if (!file) return;
    
    const isOwner = file.user_email === FBR.state.userEmail;
    const isShared = file.is_shared === 1;
    const isStarred = file.is_starred === 1;
    
    // Remove existing menu
    const existingMenu = document.getElementById('filebank-global-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create menu
    const menu = document.createElement('div');
    menu.id = 'filebank-global-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${event.pageX}px;
      top: ${event.pageY}px;
      background: rgba(20, 24, 36, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 12px;
      padding: 8px;
      z-index: 10000;
      min-width: 220px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
      animation: menuSlideIn 0.2s ease;
    `;
    
    menu.innerHTML = `
      <div class="context-menu-item" onclick="FileBankRevolution.openFile('${fileId}'); document.getElementById('filebank-global-menu').remove();">
        <span style="font-size: 18px;">👁️</span>
        <span>Open / Preview</span>
      </div>
      <div class="context-menu-item" onclick="FileBankRevolution.downloadFile('${fileId}'); document.getElementById('filebank-global-menu').remove();">
        <span style="font-size: 18px;">📥</span>
        <span>Download</span>
      </div>
      <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>
      <div class="context-menu-item" onclick="FileBankRevolution.toggleStar('${fileId}'); document.getElementById('filebank-global-menu').remove();">
        <span style="font-size: 18px;">${isStarred ? '⭐' : '☆'}</span>
        <span>${isStarred ? 'Unstar' : 'Star'}</span>
      </div>
      <div class="context-menu-item" onclick="FileBankRevolution.emailFile('${fileId}'); document.getElementById('filebank-global-menu').remove();">
        <span style="font-size: 18px;">📧</span>
        <span>Send via Email</span>
      </div>
      ${isOwner ? `
        <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>
        <div class="context-menu-item" onclick="FileBankRevolution.toggleShareFile('${fileId}'); document.getElementById('filebank-global-menu').remove();">
          <span style="font-size: 18px;">${isShared ? '🔓' : '🔒'}</span>
          <span>${isShared ? 'Unshare' : 'Share'}</span>
        </div>
        <div class="context-menu-item context-menu-danger" onclick="FileBankRevolution.deleteFile('${fileId}'); document.getElementById('filebank-global-menu').remove();">
          <span style="font-size: 18px;">🗑️</span>
          <span>Delete</span>
        </div>
      ` : `
        <div style="padding: 12px; color: rgba(255,255,255,0.5); font-size: 12px; text-align: center;">
          You can view and download this file
        </div>
      `}
    `;
    
    document.body.appendChild(menu);
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  },
  
  // Create folder from context menu
  async createFolderFromMenu() {
    const menu = document.getElementById('filebank-global-menu');
    if (menu) menu.remove();
    
    await window.FileBankRevolution.createFolder();
  },
  
  // Open folder
  openFolder(folderId) {
    const FBR = window.FileBankRevolution;
    FBR.state.currentFolder = folderId;
    
    // Reset filter to 'all' when opening a folder (so all files in folder show)
    if (FBR.state.currentFilter !== 'all') {
      FBR.state.currentFilter = 'all';
      // Update sidebar active state
      document.querySelectorAll('[data-filter]').forEach(el => {
        el.classList.toggle('active', el.dataset.filter === 'all');
      });
    }
    
    FBR.render();
    
    // Update breadcrumb
    const folder = FBR.state.folders.find(f => f.id === folderId);
    if (folder) {
      FBR.showNotification(`📂 Opened: ${folder.folder_name}`, 'info');
    }
  },
  
  // Toggle folder share
  async toggleFolderShare(folderId) {
    const FBR = window.FileBankRevolution;
    const folder = FBR.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const newState = folder.is_team_shared === 1 ? 0 : 1;
    
    try {
      FBR.showNotification(newState ? '🌐 Sharing folder...' : '🔒 Making folder private...', 'info');
      
      const response = await fetch(`/api/filebank/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: FBR.state.userEmail,
          is_team_shared: newState
        })
      });

      if (response.ok) {
        await FBR.loadFolders();
        await FBR.loadFiles(); // Reload files to update their folder_is_shared status
        FBR.render();
        FBR.showNotification(
          newState ? '🌐 Folder shared with team!' : '🔒 Folder is now private',
          'success'
        );
      } else {
        throw new Error('Failed to update folder');
      }
    } catch (error) {
      console.error('❌ Share error:', error);
      FBR.showNotification('❌ Failed to update folder', 'error');
    }
  },
  
  // Rename folder
  async renameFolder(folderId) {
    const FBR = window.FileBankRevolution;
    const folder = FBR.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const newName = prompt('Rename folder:', folder.folder_name);
    if (!newName || newName === folder.folder_name) return;
    
    try {
      const response = await fetch(`/api/filebank/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: FBR.state.userEmail,
          folderName: newName
        })
      });

      if (response.ok) {
        await FBR.loadFolders();
        FBR.render();
        FBR.showNotification('✏️ Folder renamed!', 'success');
      }
    } catch (error) {
      FBR.showNotification('❌ Failed to rename folder', 'error');
    }
  },
  
  // Delete folder (only if user owns it)
  async deleteFolder(folderId) {
    const FBR = window.FileBankRevolution;
    const folder = FBR.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    // Check ownership
    if (folder.user_email !== FBR.state.userEmail) {
      FBR.showNotification('❌ You can only delete folders you created', 'error');
      return;
    }
    
    const fileCount = FBR.state.files.filter(f => f.folder_id === folderId).length;
    const confirmMsg = fileCount > 0 
      ? `Delete "${folder.folder_name}" and its ${fileCount} file(s)?`
      : `Delete folder "${folder.folder_name}"?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
      FBR.showNotification('🗑️ Deleting folder...', 'info');
      
      const response = await fetch(`/api/filebank/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: FBR.state.userEmail
        })
      });

      if (response.ok) {
        await FBR.loadFolders();
        await FBR.loadFiles();
        FBR.render();
        FBR.showNotification('🗑️ Folder deleted!', 'success');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      FBR.showNotification('❌ Failed to delete: ' + error.message, 'error');
    }
  },
  
  // Helper: Format file size
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  },
  
  // Helper: Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // Helper: Get display name from email
  getDisplayName(email) {
    if (!email) return 'Unknown';
    // Extract name before @ and capitalize
    const name = email.split('@')[0];
    return name.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  },
  
  // Helper: Format time ago
  formatTimeAgo(dateString) {
    if (!dateString) return 'recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  }
};

// Add CSS for context menu items
const style = document.createElement('style');
style.textContent = `
  @keyframes menuSlideIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    color: white;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-size: 13px;
  }
  
  .context-menu-item:hover {
    background: rgba(102, 126, 234, 0.3);
    transform: translateX(4px);
  }
  
  .context-menu-item span:first-child {
    width: 24px;
    text-align: center;
  }
  
  .context-menu-item span:nth-child(2) {
    flex: 1;
  }
  
  .context-menu-danger:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;
document.head.appendChild(style);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for FileBankRevolution to initialize first
    setTimeout(() => window.FileBankComplete.init(), 600);
  });
} else {
  setTimeout(() => window.FileBankComplete.init(), 600);
}
