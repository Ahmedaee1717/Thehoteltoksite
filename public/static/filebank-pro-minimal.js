// Minimal FileBankPro - Extends existing FileBankRevolution
window.FileBankProEnhanced = {
  async init() {
    console.log('🚀 Enhancing FileBank with Pro features...');
    
    // Wait for FileBankRevolution to load
    if (!window.FileBankRevolution) {
      console.error('❌ FileBankRevolution not found!');
      return;
    }
    
    const FBR = window.FileBankRevolution;
    
    // Override render to include folders
    const originalRender = FBR.render.bind(FBR);
    FBR.render = function() {
      const grid = document.getElementById('filebank-grid');
      if (!grid) return;

      const filteredFiles = this.getFilteredFiles();
      const filteredFolders = this.state.folders.filter(f => 
        this.state.currentFolder ? f.parent_folder_id === this.state.currentFolder : !f.parent_folder_id
      );

      if (filteredFiles.length === 0 && filteredFolders.length === 0) {
        this.renderEmptyState(grid);
        return;
      }

      // Render folders FIRST, then files
      const foldersHTML = filteredFolders.map(folder => window.FileBankProEnhanced.createFolderCard(folder)).join('');
      const filesHTML = filteredFiles.map(file => this.createFileCard(file)).join('');
      
      grid.innerHTML = foldersHTML + filesHTML;

      // Setup listeners
      this.setupFileCardListeners();
      window.FileBankProEnhanced.setupFolderCardListeners();
    };
    
    console.log('✅ FileBank Pro Enhanced Ready!');
  },
  
  createFolderCard(folder) {
    const FBR = window.FileBankRevolution;
    const isOwner = folder.user_email === FBR.state.userEmail;
    const isShared = folder.is_team_shared === 1;
    const fileCount = FBR.state.files.filter(f => f.folder_id === folder.id).length;

    return `
      <div class="filebank-folder-card filebank-file-card" 
           data-folder-id="${folder.id}"
           ondblclick="window.FileBankProEnhanced.openFolder(${folder.id})"
           oncontextmenu="event.preventDefault(); window.FileBankProEnhanced.showFolderMenu(event, ${folder.id}); return false;"
           style="position: relative; background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%); border: 2px solid rgba(102, 126, 234, 0.4);">
        
        ${isShared ? '<div class="filebank-collab-badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">🌐 Shared</div>' : ''}
        
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center;">
          <div style="font-size: 80px; margin-bottom: 15px;">${folder.icon || '📁'}</div>
          <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px;">${FBR.escapeHtml(folder.folder_name)}</div>
          <div style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">${fileCount} file${fileCount !== 1 ? 's' : ''}</div>
        </div>
        
        ${isOwner ? `
          <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; display: flex; gap: 8px;">
            <button onclick="event.stopPropagation(); window.FileBankProEnhanced.toggleFolderShare(${folder.id})"
                    style="flex: 1; padding: 8px; background: ${isShared ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(102, 126, 234, 0.2)'}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">
              ${isShared ? '🔓 SHARED' : '🔒 SHARE'}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },
  
  setupFolderCardListeners() {
    // Add folder-specific listeners here if needed
  },
  
  openFolder(folderId) {
    const FBR = window.FileBankRevolution;
    FBR.state.currentFolder = folderId;
    FBR.render();
  },
  
  async toggleFolderShare(folderId) {
    const FBR = window.FileBankRevolution;
    const folder = FBR.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const newState = folder.is_team_shared === 1 ? 0 : 1;
    
    try {
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
        FBR.render();
        FBR.showNotification(
          newState ? `🌐 Folder shared` : `🔒 Folder private`,
          'success'
        );
      }
    } catch (error) {
      FBR.showNotification('Failed to update folder', 'error');
    }
  },
  
  showFolderMenu(event, folderId) {
    // Use existing context menu or create new one
    const FBR = window.FileBankRevolution;
    const folder = FBR.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const menu = document.getElementById('filebank-context-menu');
    if (!menu) return;
    
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('active');
    
    // Update menu items for folder
    menu.innerHTML = `
      <div class="filebank-context-item" onclick="window.FileBankProEnhanced.openFolder(${folderId})">
        <span>📂</span><span>Open</span>
      </div>
      <div class="filebank-context-divider"></div>
      <div class="filebank-context-item" onclick="window.FileBankProEnhanced.toggleFolderShare(${folderId})">
        <span>${folder.is_team_shared ? '🔓' : '🔒'}</span>
        <span>${folder.is_team_shared ? 'Make Private' : 'Share'}</span>
      </div>
    `;
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.FileBankProEnhanced.init(), 500);
  });
} else {
  setTimeout(() => window.FileBankProEnhanced.init(), 500);
}
