/**
 * Investay Signal - PROFESSIONAL EMAIL PLATFORM
 * The most impressive email client you've ever seen
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Investay Signal...');
  
  function initApp() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      setTimeout(initApp, 100);
      return;
    }
    
    const { useState, useEffect, useRef } = React;
    const h = React.createElement;
    
    // Get user email from cookie or localStorage
    const getUserEmail = () => {
      // Try localStorage first (set during login)
      const stored = localStorage.getItem('userEmail');
      if (stored) return stored;
      
      // If not in localStorage, user is not logged in
      return null;
    };
    
    const user = getUserEmail();
    
    // Redirect to login if not logged in
    if (!user) {
      window.location.href = '/login';
    }
    
    function EmailApp() {
      const [view, setView] = useState('inbox');
      const [emails, setEmails] = useState([]);
      const [tasks, setTasks] = useState([]);
      const [contacts, setContacts] = useState([]);
      const [deals, setDeals] = useState([]);
      const [files, setFiles] = useState([]);
      const [folders, setFolders] = useState([]);
      const [loading, setLoading] = useState(false);
      const [showCompose, setShowCompose] = useState(false);
      const [selectedEmail, setSelectedEmail] = useState(null);
      const [hoveredNav, setHoveredNav] = useState(null);
      const [showCollabPanel, setShowCollabPanel] = useState(false);
      const [comments, setComments] = useState([]);
      const [collabStats, setCollabStats] = useState(null);
      const [newComment, setNewComment] = useState('');
      const [readStatuses, setReadStatuses] = useState({});
      const [replyMode, setReplyMode] = useState(null); // null, 'reply', or 'forward'
      const [replyText, setReplyText] = useState('');
      const [forwardTo, setForwardTo] = useState('');
      const [unreadCount, setUnreadCount] = useState(0);
      
      // Search state
      const [searchQuery, setSearchQuery] = useState('');
      const [searchResults, setSearchResults] = useState([]);
      const [searchLoading, setSearchLoading] = useState(false);
      const [showSearchResults, setShowSearchResults] = useState(false);
      const [searchIntent, setSearchIntent] = useState(null);
      
      // Task creation state
      const [newTaskTitle, setNewTaskTitle] = useState('');
      const [newTaskDescription, setNewTaskDescription] = useState('');
      const [newTaskPriority, setNewTaskPriority] = useState('medium');
      const [newTaskDueDate, setNewTaskDueDate] = useState('');
      
      // CRM state
      const [showCreateContact, setShowCreateContact] = useState(false);
      
      // File Bank state
      const [uploadingFile, setUploadingFile] = useState(false);
      const [uploadProgress, setUploadProgress] = useState(0);
      const [selectedFile, setSelectedFile] = useState(null);
      const [showFilePreview, setShowFilePreview] = useState(false);
      const [showFilePicker, setShowFilePicker] = useState(false);
      const [isDragging, setIsDragging] = useState(false);
      const [showCreateFolder, setShowCreateFolder] = useState(false);
      const [newFolderName, setNewFolderName] = useState('');
      const [newFolderIsShared, setNewFolderIsShared] = useState(false);
      const [currentFolder, setCurrentFolder] = useState(null);
      const [showCreateDeal, setShowCreateDeal] = useState(false);
      const [newContactName, setNewContactName] = useState('');
      const [newContactEmail, setNewContactEmail] = useState('');
      const [newContactPhone, setNewContactPhone] = useState('');
      const [newContactCompany, setNewContactCompany] = useState('');
      const [newContactPosition, setNewContactPosition] = useState('');
      const [newContactType, setNewContactType] = useState('client');
      const [newContactNotes, setNewContactNotes] = useState('');
      const [newDealTitle, setNewDealTitle] = useState('');
      const [newDealValue, setNewDealValue] = useState('');
      const [newDealStage, setNewDealStage] = useState('lead');
      const [newDealProbability, setNewDealProbability] = useState('50');
      const [newDealCloseDate, setNewDealCloseDate] = useState('');
      const [newDealNotes, setNewDealNotes] = useState('');
      const [newDealContactId, setNewDealContactId] = useState('');
      const [selectedContact, setSelectedContact] = useState(null);
      const [selectedDeal, setSelectedDeal] = useState(null);
      const [showContactDetail, setShowContactDetail] = useState(false);
      const [showDealDetail, setShowDealDetail] = useState(false);
      const [contactActivities, setContactActivities] = useState([]);
      const [contactDeals, setContactDeals] = useState([]);
      const [contactEmails, setContactEmails] = useState([]);
      
      useEffect(() => {
        loadData();
      }, [view]);
      
      // Auto-refresh read statuses in Sent folder
      useEffect(() => {
        let refreshInterval;
        if (view === 'sent' && emails.length > 0) {
          refreshInterval = setInterval(() => {
            const emailIds = emails.map(e => e.id);
            loadReadStatuses(emailIds);
            console.log('🔄 Auto-refreshing read statuses...');
          }, 10000); // Every 10 seconds
        }
        
        return () => {
          if (refreshInterval) {
            clearInterval(refreshInterval);
          }
        };
      }, [view, emails.length]);
      
      const loadData = async () => {
        setLoading(true);
        try {
          let url = '';
          if (view === 'inbox') url = `/api/email/inbox`;
          else if (view === 'sent') url = `/api/email/sent`;
          else if (view === 'spam') url = `/api/email/spam`;
          else if (view === 'trash') url = `/api/email/trash`;
          else if (view === 'drafts') url = `/api/email/drafts`;
          else if (view === 'archived') url = `/api/email/archived`;
          
          if (url) {
            const response = await fetch(url);
            const data = await response.json();
            const fetchedEmails = data.emails || data.drafts || [];
            setEmails(fetchedEmails);
            
            // Calculate unread count for inbox
            if (view === 'inbox') {
              const unread = fetchedEmails.filter(e => e.is_read === 0).length;
              setUnreadCount(unread);
            }
            
            // Load read statuses for sent emails
            if (view === 'sent' && fetchedEmails.length > 0) {
              const emailIds = fetchedEmails.map(e => e.id);
              loadReadStatuses(emailIds);
            }
          }
          
          // Load CRM data
          if (view === 'crm') {
            const [contactsRes, dealsRes] = await Promise.all([
              fetch(`/api/crm/contacts?user=${user}`),
              fetch(`/api/crm/deals?user=${user}`)
            ]);
            const contactsData = await contactsRes.json();
            const dealsData = await dealsRes.json();
            setContacts(contactsData.contacts || []);
            setDeals(dealsData.deals || []);
          }
          
          // Load File Bank data
          if (view === 'filebank') {
            const [filesRes, foldersRes] = await Promise.all([
              fetch(`/api/filebank/files?userEmail=${user}`),
              fetch(`/api/filebank/folders?userEmail=${user}`)
            ]);
            const filesData = await filesRes.json();
            const foldersData = await foldersRes.json();
            setFiles(filesData.files || []);
            setFolders(foldersData.folders || []);
          }
          
          // Load Tasks data
          if (view === 'tasks') {
            const tasksRes = await fetch(`/api/tasks?user=${user}`);
            const tasksData = await tasksRes.json();
            setTasks(tasksData.tasks || []);
          }
        } catch (error) {
          console.error('Load error:', error);
        }
        setLoading(false);
      };
      
      // Load unread count for inbox (always, regardless of current view)
      const loadUnreadCount = async () => {
        try {
          const response = await fetch(`/api/email/inbox`);
          const data = await response.json();
          const fetchedEmails = data.emails || [];
          const unread = fetchedEmails.filter(e => e.is_read === 0).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Unread count error:', error);
        }
      };
      
      // Load unread count on mount and when view changes
      useEffect(() => {
        loadUnreadCount();
      }, [view, selectedEmail]); // Refresh when view changes or email is opened
      
      // 🕒 Calculate time remaining until expiry
      const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        return `${hours}h`;
      };
      
      // AI-Powered Smart Search
      const performSmartSearch = async (query) => {
        if (!query || query.trim().length === 0) {
          setShowSearchResults(false);
          setSearchResults([]);
          return;
        }
        
        setSearchLoading(true);
        try {
          const response = await fetch('/api/email/search', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
              query: query.trim(),
              userEmail: user,
              folder: view === 'inbox' || view === 'sent' || view === 'drafts' || 
                       view === 'spam' || view === 'trash' || view === 'archive' ? view : null
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            setSearchResults(data.results || []);
            setSearchIntent(data.intent);
            setShowSearchResults(true);
            console.log('🔍 Smart Search Results:', {
              query: data.query,
              intent: data.intent,
              count: data.count
            });
          } else {
            console.error('Search error:', data.error);
            alert('❌ Search failed: ' + data.error);
          }
        } catch (error) {
          console.error('Search error:', error);
          alert('❌ Search failed: ' + error.message);
        } finally {
          setSearchLoading(false);
        }
      };
      
      const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
        setSearchIntent(null);
      };
      
      const sendEmail = async (to, subject, body) => {
        try {
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: user, to, subject, body, useAI: true })
          });
          const result = await response.json();
          
          if (result.success && result.emailSent) {
            alert('✅ Email sent successfully via Mailgun!\n\nMessage ID: ' + result.messageId);
          } else if (result.success && !result.emailSent) {
            alert('⚠️ Email saved but not sent:\n\n' + (result.mailgunError || 'Check Mailgun configuration'));
          } else {
            alert('❌ Failed to send:\n\n' + (result.error || 'Unknown error'));
          }
          
          loadData();
          setShowCompose(false);
        } catch (error) {
          alert('❌ Network error: ' + error.message);
        }
      };
      
      const loadCollabData = async (emailId) => {
        try {
          const [commentsRes, statsRes] = await Promise.all([
            fetch(`/api/collaboration/comments/${emailId}`),
            fetch(`/api/collaboration/stats/${emailId}`)
          ]);
          const commentsData = await commentsRes.json();
          const statsData = await statsRes.json();
          setComments(commentsData.comments || []);
          setCollabStats(statsData.stats || {});
        } catch (error) {
          console.error('Load collab error:', error);
        }
      };
      
      const loadReadStatuses = async (emailIds) => {
        try {
          const statuses = {};
          await Promise.all(
            emailIds.map(async (id) => {
              const res = await fetch(`/api/email/${id}/read-status`);
              const data = await res.json();
              if (data.success) {
                statuses[id] = data;
              }
            })
          );
          setReadStatuses(statuses);
        } catch (error) {
          console.error('Load read statuses error:', error);
        }
      };
      
      const addComment = async () => {
        if (!newComment.trim() || !selectedEmail) return;
        try {
          const res = await fetch('/api/collaboration/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email_id: selectedEmail.id,
              author_email: user,
              author_name: 'Admin',
              comment_text: newComment
            })
          });
          const result = await res.json();
          if (result.success) {
            setNewComment('');
            loadCollabData(selectedEmail.id);
          }
        } catch (error) {
          console.error('Add comment error:', error);
        }
      };
      
      // Task management functions
      const createTask = async () => {
        if (!newTaskTitle.trim()) {
          alert('⚠️ Please enter a task title');
          return;
        }
        try {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: user,
              title: newTaskTitle,
              description: newTaskDescription || null,
              priority: newTaskPriority,
              due_date: newTaskDueDate || null,
              category: 'general',
              status: 'pending'
            })
          });
          const result = await res.json();
          if (result.success) {
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskPriority('medium');
            setNewTaskDueDate('');
            loadData(); // Reload tasks
            alert('✅ Task created!');
          }
        } catch (error) {
          console.error('Create task error:', error);
          alert('❌ Failed to create task');
        }
      };
      
      const toggleTaskComplete = async (taskId, currentStatus) => {
        try {
          const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          const result = await res.json();
          if (result.success) {
            loadData(); // Reload tasks
          }
        } catch (error) {
          console.error('Toggle task error:', error);
        }
      };
      
      const deleteTask = async (taskId) => {
        if (!confirm('🗑️ Delete this task?')) return;
        try {
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
          });
          const result = await res.json();
          if (result.success) {
            loadData(); // Reload tasks
            alert('✅ Task deleted');
          }
        } catch (error) {
          console.error('Delete task error:', error);
        }
      };
      
      const createTaskFromEmail = async (email) => {
        try {
          const res = await fetch('/api/tasks/from-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailId: email.id,
              userEmail: user,
              title: `Follow up: ${email.subject}`,
              description: email.body_text || email.snippet || '',
              priority: 'medium'
            })
          });
          const result = await res.json();
          if (result.success) {
            alert('✅ Task created from email!');
            setView('tasks'); // Switch to tasks view
          }
        } catch (error) {
          console.error('Create task from email error:', error);
          alert('❌ Failed to create task');
        }
      };
      
      // CRM functions
      const createContact = async () => {
        if (!newContactName.trim() || !newContactEmail.trim()) {
          alert('⚠️ Please enter name and email');
          return;
        }
        try {
          const res = await fetch('/api/crm/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: user,
              name: newContactName,
              email: newContactEmail,
              phone: newContactPhone,
              company: newContactCompany,
              contactType: 'client'
            })
          });
          const result = await res.json();
          if (result.success) {
            setNewContactName('');
            setNewContactEmail('');
            setNewContactPhone('');
            setNewContactCompany('');
            setShowCreateContact(false);
            loadData();
            alert('✅ Contact created!');
          }
        } catch (error) {
          console.error('Create contact error:', error);
          alert('❌ Failed to create contact');
        }
      };
      
      const createDeal = async () => {
        if (!newDealTitle.trim()) {
          alert('⚠️ Please enter deal title');
          return;
        }
        try {
          const res = await fetch('/api/crm/deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: user,
              contactId: newDealContactId || null,
              title: newDealTitle,
              value: parseFloat(newDealValue) || 0,
              stage: newDealStage,
              probability: parseInt(newDealProbability) || 50,
              closeDate: newDealCloseDate || null,
              notes: newDealNotes
            })
          });
          const result = await res.json();
          if (result.success) {
            setNewDealTitle('');
            setNewDealValue('');
            setNewDealStage('lead');
            setNewDealProbability('50');
            setNewDealCloseDate('');
            setNewDealNotes('');
            setNewDealContactId('');
            setShowCreateDeal(false);
            loadData();
            alert('✅ Deal created!');
          }
        } catch (error) {
          console.error('Create deal error:', error);
          alert('❌ Failed to create deal');
        }
      };
      
      // Load contact details
      const loadContactDetails = async (contactId) => {
        try {
          const res = await fetch(`/api/crm/contacts/${contactId}`);
          const data = await res.json();
          if (data.contact) {
            setSelectedContact(data.contact);
            setContactActivities(data.activities || []);
            setContactDeals(data.deals || []);
            setContactEmails(data.emails || []);
            setShowContactDetail(true);
          }
        } catch (error) {
          console.error('Load contact details error:', error);
          alert('❌ Failed to load contact details');
        }
      };
      
      // Update contact
      const updateContact = async (contactId, updates) => {
        try {
          const res = await fetch(`/api/crm/contacts/${contactId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          const result = await res.json();
          if (result.success) {
            alert('✅ Contact updated!');
            loadContactDetails(contactId);
            loadData();
          }
        } catch (error) {
          console.error('Update contact error:', error);
          alert('❌ Failed to update contact');
        }
      };
      
      // Delete contact
      const deleteContact = async (contactId) => {
        if (!confirm('⚠️ Delete this contact? This action cannot be undone.')) return;
        try {
          const res = await fetch(`/api/crm/contacts/${contactId}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.success) {
            alert('✅ Contact deleted!');
            setShowContactDetail(false);
            loadData();
          }
        } catch (error) {
          console.error('Delete contact error:', error);
          alert('❌ Failed to delete contact');
        }
      };
      
      // Update deal
      const updateDeal = async (dealId, updates) => {
        try {
          const res = await fetch(`/api/crm/deals/${dealId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          const result = await res.json();
          if (result.success) {
            alert('✅ Deal updated!');
            loadData();
          }
        } catch (error) {
          console.error('Update deal error:', error);
          alert('❌ Failed to update deal');
        }
      };
      
      // Link email to contact
      const linkEmailToContact = async (emailId, contactEmail) => {
        try {
          // Log activity
          const contact = contacts.find(c => c.email === contactEmail);
          if (contact) {
            const res = await fetch('/api/crm/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail: user,
                contactId: contact.id,
                emailId: emailId,
                activityType: 'email',
                subject: 'Email interaction',
                activityDate: new Date().toISOString()
              })
            });
            const result = await res.json();
            if (result.success) {
              alert('✅ Email linked to contact!');
            }
          }
        } catch (error) {
          console.error('Link email error:', error);
        }
      };
      
      // File Bank Functions
      const handleFileUpload = async (file) => {
        if (!file) return;
        
        try {
          setUploadingFile(true);
          setUploadProgress(0);
          
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
          }, 200);
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userEmail', user);
          formData.append('folder_id', currentFolder ? currentFolder.id : '1');
          
          const res = await fetch('/api/filebank/files/upload', {
            method: 'POST',
            body: formData
          });
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          const result = await res.json();
          if (result.success) {
            alert('✅ File uploaded successfully!');
            loadData(); // Reload files
          } else {
            alert('❌ Upload failed: ' + (result.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('❌ Failed to upload file');
        } finally {
          setUploadingFile(false);
          setUploadProgress(0);
        }
      };
      
      const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
          handleFileUpload(droppedFiles[0]);
        }
      };
      
      const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
      };
      
      const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
      };
      
      const deleteFile = async (file) => {
        // Check if user owns the file
        if (file.user_email !== user && file.user_email !== 'system@investaycapital.com') {
          alert('❌ You can only delete files you uploaded.\n\nThis file was uploaded by: ' + file.user_email);
          return;
        }
        
        if (!confirm('🗑️ Delete this file? This cannot be undone.')) return;
        
        try {
          const res = await fetch(`/api/filebank/files/${file.id}?userEmail=${user}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'X-User-Email': user
            }
          });
          
          const result = await res.json();
          if (result.success) {
            alert('✅ File deleted!');
            setShowFilePreview(false);
            loadData();
          } else {
            alert('❌ ' + (result.message || result.error || 'Failed to delete file'));
          }
        } catch (error) {
          console.error('Delete file error:', error);
          alert('❌ Failed to delete file');
        }
      };
      
      const downloadFile = (file) => {
        // In production, this would download from blob storage
        alert(`📥 Downloading ${file.filename}...\n\nIn production, this would download from: ${file.file_path}`);
      };
      
      const shareFile = (file) => {
        const shareLink = `https://www.investaycapital.com/files/${file.id}`;
        navigator.clipboard.writeText(shareLink);
        alert(`🔗 Share link copied to clipboard!\n\n${shareLink}\n\nYou can now paste this link anywhere.`);
      };
      
      const createFolder = async () => {
        if (!newFolderName.trim()) {
          alert('⚠️ Please enter folder name');
          return;
        }
        
        try {
          const res = await fetch('/api/filebank/folders', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
              userEmail: user,
              folderName: newFolderName,
              parentFolderId: currentFolder ? currentFolder.id : null,
              isShared: newFolderIsShared,
              isTeamShared: newFolderIsShared
            })
          });
          
          const result = await res.json();
          if (result.success) {
            setNewFolderName('');
            setNewFolderIsShared(false);
            setShowCreateFolder(false);
            loadData();
            alert(`✅ ${newFolderIsShared ? 'Shared folder' : 'Folder'} created!`);
          }
        } catch (error) {
          console.error('Create folder error:', error);
          alert('❌ Failed to create folder');
        }
      };
      
      const navItems = [
        { id: 'inbox', icon: '◉', label: 'Inbox', gradient: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)' },
        { id: 'sent', icon: '↗', label: 'Sent', gradient: 'linear-gradient(135deg, #A88B5E 0%, #6B5942 100%)' },
        { id: 'drafts', icon: '✎', label: 'Drafts', gradient: 'linear-gradient(135deg, #8B7355 0%, #5D4A3A 100%)' },
        { id: 'spam', icon: '⊘', label: 'Spam', gradient: 'linear-gradient(135deg, #D4A574 0%, #9B7652 100%)' },
        { id: 'trash', icon: '◻', label: 'Trash', gradient: 'linear-gradient(135deg, #BFA076 0%, #8A6E4F 100%)' },
        { id: 'archived', icon: '▣', label: 'Archive', gradient: 'linear-gradient(135deg, #C4A976 0%, #937D5C 100%)' },
        { id: 'tasks', icon: '✓', label: 'Tasks', gradient: 'linear-gradient(135deg, #D1AE6E 0%, #9E825A 100%)' },
        { id: 'crm', icon: '👥', label: 'CRM', gradient: 'linear-gradient(135deg, #E8B86D 0%, #B89968 100%)' },
        { id: 'filebank', icon: '📁', label: 'Files', gradient: 'linear-gradient(135deg, #DDB76A 0%, #AA9265 100%)' }
      ];
      
      return h('div', { 
        style: { 
          display: 'flex', 
          height: '100vh', 
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: '#0a0e27',
          overflow: 'hidden'
        } 
      },
        // Ultra Premium Sidebar
        h('div', { 
          style: { 
            width: '300px',
            background: 'linear-gradient(180deg, #0f1429 0%, #1a1f3a 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
          }
        },
          // Animated Background Glow
          h('div', {
            style: {
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle at 50% 50%, rgba(201, 169, 98, 0.03) 0%, transparent 50%)',
              animation: 'pulse 4s ease-in-out infinite',
              pointerEvents: 'none'
            }
          }),
          
          // Premium Header
          h('div', { 
            style: { 
              padding: '32px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative',
              zIndex: 1
            } 
          },
            h('div', { 
              style: { 
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }
            },
              // Premium Logo - Clean and Simple
              h('div', {
                style: {
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  flexShrink: 0
                }
              },
                // Simple "I" lettermark
                h('div', {
                  style: {
                    fontSize: '28px',
                    fontWeight: '700',
                    color: 'white',
                    fontFamily: 'Georgia, serif'
                  }
                }, 'I')
              ),
              h('div', null,
                h('div', { 
                  style: { 
                    fontSize: '20px', 
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #C9A962 0%, #f5e6d3 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  } 
                }, 'Investay Signal'),
                h('div', { 
                  style: { 
                    fontSize: '11px', 
                    color: 'rgba(201, 169, 98, 0.7)',
                    fontWeight: '400',
                    letterSpacing: '0.3px',
                    marginTop: '2px',
                    fontStyle: 'italic'
                  } 
                }, 'If it\'s still important, it will still be here.')
              )
            ),
            
            // Compose Button - Ultra Premium
            h('button', {
              id: 'compose-button',
              onClick: () => setShowCompose(true),
              style: {
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(201, 169, 98, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              },
              onMouseEnter: (e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(201, 169, 98, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              },
              onMouseLeave: (e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(201, 169, 98, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }
            },
              h('span', { style: { fontSize: '18px', fontWeight: '600' } }, '✎'),
              'Compose'
            )
          ),
          
          // Ultra Premium Navigation
          h('nav', { 
            style: { 
              flex: 1, 
              padding: '24px 16px', 
              overflowY: 'auto',
              position: 'relative',
              zIndex: 1
            } 
          },
            navItems.map(item =>
              h('button', {
                key: item.id,
                onClick: () => setView(item.id),
                onMouseEnter: () => setHoveredNav(item.id),
                onMouseLeave: () => setHoveredNav(null),
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  marginBottom: '8px',
                  background: view === item.id 
                    ? 'rgba(201, 169, 98, 0.15)' 
                    : hoveredNav === item.id 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : 'transparent',
                  border: view === item.id 
                    ? '1px solid rgba(201, 169, 98, 0.3)' 
                    : '1px solid transparent',
                  color: view === item.id ? '#C9A962' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: view === item.id ? '0 4px 16px rgba(201, 169, 98, 0.2)' : 'none',
                  transform: hoveredNav === item.id ? 'translateX(4px)' : 'translateX(0)'
                }
              },
                // Icon with gradient background
                h('div', {
                  style: {
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: view === item.id ? item.gradient : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: view === item.id ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
                  }
                }, item.icon),
                h('span', { style: { flex: 1, letterSpacing: '0.2px' } }, item.label),
                
                // Powerful psychological unread indicator for Inbox
                item.id === 'inbox' && unreadCount > 0 && h('div', {
                  style: {
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#ef4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    animation: 'pulse 2s ease-in-out infinite',
                    whiteSpace: 'nowrap'
                  }
                }, unreadCount === 1 ? '1 Unread' : `${unreadCount} Unread`),
                
                // Powerful "All Clear" indicator for Inbox when zero unread
                item.id === 'inbox' && unreadCount === 0 && h('div', {
                  style: {
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#22c55e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap'
                  }
                }, '✓ All Clear'),
                
                // Active indicator dot for other tabs
                view === item.id && item.id !== 'inbox' && h('div', {
                  style: {
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#C9A962',
                    boxShadow: '0 0 8px rgba(201, 169, 98, 0.6)'
                  }
                })
              )
            )
          ),
          
          // User Profile - Premium
          h('div', {
            style: {
              padding: '20px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              position: 'relative',
              zIndex: 1
            }
          },
            h('div', {
              style: {
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '16px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }
            }, 'A'),
            h('div', { style: { flex: 1, minWidth: 0 } },
              h('div', { 
                style: { 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '2px'
                } 
              }, 'Admin'),
              h('div', { 
                style: { 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.4)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                } 
              }, user || 'admin@investay...')
            )
          ),
          
          // Logout Button
          h('div', {
            style: {
              padding: '12px 24px 20px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }
          },
            h('button', {
              onClick: () => {
                if (confirm('Are you sure you want to logout?')) {
                  localStorage.clear();
                  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.href = '/logout';
                }
              },
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                e.target.style.transform = 'translateY(-1px)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }
            },
              h('span', { style: { fontSize: '16px' } }, '🚪'),
              'Logout'
            )
          )
        ),
        
        // Ultra Premium Main Content
        h('div', { 
          style: { 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            background: '#0a0e27',
            position: 'relative',
            overflow: 'hidden'
          } 
        },
          // Animated Background Pattern
          h('div', {
            style: {
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(201, 169, 98, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(102, 126, 234, 0.03) 0%, transparent 50%)',
              pointerEvents: 'none'
            }
          }),
          
          // Premium Top Bar
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 20, 41, 0.8)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              zIndex: 10
            }
          },
            h('div', null,
              h('h1', { 
                style: { 
                  fontSize: '28px', 
                  fontWeight: '700',
                  margin: '0 0 4px 0',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                } 
              },
                view === 'inbox' ? '📧 Inbox' :
                view === 'sent' ? '📤 Sent Mail' :
                view === 'drafts' ? '📝 Drafts' :
                view === 'spam' ? '🚫 Spam' :
                view === 'trash' ? '🗑️ Trash' :
                view === 'archived' ? '📦 Archive' :
                'InvestMail'
              ),
              h('p', {
                style: {
                  margin: 0,
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '500'
                }
              }, showSearchResults ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}` : `${emails.length} ${emails.length === 1 ? 'email' : 'emails'}`)
            ),
            h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
              h('button', {
                onClick: () => {
                  loadData();
                  if (view === 'sent' && emails.length > 0) {
                    const emailIds = emails.map(e => e.id);
                    loadReadStatuses(emailIds);
                  }
                },
                style: {
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                },
                onMouseEnter: (e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                },
                onMouseLeave: (e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
              }, view === 'sent' ? '🔄 Check Read Status' : '🔄 Refresh')
            )
          ),
          
          // AI-Powered Smart Search Bar
          h('div', {
            style: {
              padding: '16px 32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 20, 41, 0.6)',
              backdropFilter: 'blur(20px)'
            }
          },
            h('div', { style: { position: 'relative' } },
              h('div', {
                style: {
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }
              },
                h('div', {
                  style: {
                    position: 'absolute',
                    left: '16px',
                    fontSize: '18px',
                    pointerEvents: 'none',
                    opacity: 0.5
                  }
                }, '🔍'),
                h('input', {
                  type: 'text',
                  placeholder: 'Smart Search: Try "unread emails from john", "important emails this week", "emails with attachments"...',
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  onKeyPress: (e) => {
                    if (e.key === 'Enter') {
                      performSmartSearch(searchQuery);
                    }
                  },
                  style: {
                    flex: 1,
                    padding: '14px 16px 14px 48px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(201, 169, 98, 0.2)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    outline: 'none'
                  },
                  onFocus: (e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)';
                  },
                  onBlur: (e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.borderColor = 'rgba(201, 169, 98, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }
                }),
                h('button', {
                  onClick: () => performSmartSearch(searchQuery),
                  disabled: searchLoading,
                  style: {
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #C9A962 0%, #A08852 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: searchLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    opacity: searchLoading ? 0.6 : 1
                  },
                  onMouseEnter: (e) => {
                    if (!searchLoading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 24px rgba(201, 169, 98, 0.4)';
                    }
                  },
                  onMouseLeave: (e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }, 
                  searchLoading ? '⏳ Searching...' : '🔍 Search'
                ),
                showSearchResults && h('button', {
                  onClick: clearSearch,
                  style: {
                    padding: '14px 20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  },
                  onMouseEnter: (e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  },
                  onMouseLeave: (e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }, '✖ Clear')
              ),
              
              // Search Intent Display
              showSearchResults && searchIntent && h('div', {
                style: {
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: 'rgba(201, 169, 98, 0.1)',
                  border: '1px solid rgba(201, 169, 98, 0.2)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center'
                }
              },
                h('span', { style: { color: '#C9A962', fontWeight: '600' } }, '🤖 AI Understood:'),
                searchIntent.sender && h('span', { 
                  style: { 
                    padding: '4px 8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  } 
                }, `📧 From: ${searchIntent.sender}`),
                searchIntent.recipient && h('span', { 
                  style: { 
                    padding: '4px 8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  } 
                }, `📨 To: ${searchIntent.recipient}`),
                searchIntent.hasAttachment && h('span', { 
                  style: { 
                    padding: '4px 8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  } 
                }, '📎 With Attachments'),
                searchIntent.isUnread && h('span', { 
                  style: { 
                    padding: '4px 8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  } 
                }, '✉️ Unread'),
                searchIntent.isStarred && h('span', { 
                  style: { 
                    padding: '4px 8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  } 
                }, '⭐ Starred'),
                searchIntent.dateRange && h('span', { 
                  style: { 
                    padding: '4px 8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  } 
                }, `📅 ${searchIntent.dateRange.start || ''} ${searchIntent.dateRange.end ? `to ${searchIntent.dateRange.end}` : ''}`),
                searchIntent.keywords && searchIntent.keywords.length > 0 && h('span', { 
                  style: { 
                    padding: '4px 8px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  } 
                }, `🔎 Keywords: ${searchIntent.keywords.join(', ')}`)
              )
            )
          ),
          
          // Premium Email List
          h('div', { 
            style: { 
              flex: 1, 
              overflow: 'auto', 
              padding: '24px 32px',
              position: 'relative',
              zIndex: 1
            } 
          },
            loading ? h('div', { 
              style: { 
                textAlign: 'center', 
                padding: '60px',
                color: 'rgba(255, 255, 255, 0.4)'
              } 
            },
              h('div', {
                style: {
                  width: '48px',
                  height: '48px',
                  border: '3px solid rgba(201, 169, 98, 0.2)',
                  borderTopColor: '#C9A962',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite'
                }
              }),
              `Loading your ${view}...`
            ) :
            // CRM View
            view === 'crm' ? h('div', {},
              // CRM Header with Actions
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
                h('h2', { style: { color: '#C9A962', fontSize: '24px', margin: 0 } }, '🏢 CRM Dashboard'),
                h('div', { style: { display: 'flex', gap: '12px' } },
                  h('button', {
                    onClick: () => setShowCreateContact(true),
                    style: {
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }
                  }, '👤 New Contact'),
                  h('button', {
                    onClick: () => setShowCreateDeal(true),
                    style: {
                      padding: '10px 20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }
                  }, '💼 New Deal')
                )
              ),
              
              // Two-column layout
              h('div', { style: { display: 'flex', gap: '24px' } },
                // Contacts Column
                h('div', { style: { flex: 1 } },
                  h('h3', { style: { color: '#C9A962', marginBottom: '16px', fontSize: '18px' } }, `👥 Contacts (${contacts.length})`),
                  contacts.length === 0 ? h('div', { 
                    style: { 
                      textAlign: 'center', 
                      padding: '60px 20px', 
                      color: 'rgba(255, 255, 255, 0.4)',
                      background: 'rgba(26, 31, 58, 0.6)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    } 
                  },
                    h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '👤'),
                    h('div', { style: { fontSize: '16px', marginBottom: '8px' } }, 'No contacts yet'),
                    h('div', { style: { fontSize: '13px' } }, 'Click "New Contact" to add your first contact')
                  ) : h('div', { style: { display: 'grid', gap: '12px' } },
                    contacts.map((contact, i) =>
                      h('div', {
                        key: contact.id || i,
                        onClick: () => loadContactDetails(contact.id),
                        style: {
                          padding: '16px',
                          background: 'rgba(26, 31, 58, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        },
                        onMouseEnter: (e) => {
                          e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      },
                        h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' } }, contact.name),
                        h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' } }, contact.email),
                        contact.company && h('div', { style: { fontSize: '12px', color: '#C9A962', marginBottom: '4px' } }, `🏢 ${contact.company}`),
                        contact.phone && h('div', { style: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' } }, `📞 ${contact.phone}`),
                        h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '8px' } }, `💼 ${contact.deal_count || 0} deals • 📊 ${contact.activity_count || 0} activities`)
                      )
                    )
                  )
                ),
                
                // Deals Column
                h('div', { style: { flex: 1 } },
                  h('h3', { style: { color: '#C9A962', marginBottom: '16px', fontSize: '18px' } }, `💼 Deals (${deals.length})`),
                  deals.length === 0 ? h('div', { 
                    style: { 
                      textAlign: 'center', 
                      padding: '60px 20px', 
                      color: 'rgba(255, 255, 255, 0.4)',
                      background: 'rgba(26, 31, 58, 0.6)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    } 
                  },
                    h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '💼'),
                    h('div', { style: { fontSize: '16px', marginBottom: '8px' } }, 'No deals yet'),
                    h('div', { style: { fontSize: '13px' } }, 'Click "New Deal" to add your first deal')
                  ) : h('div', { style: { display: 'grid', gap: '12px' } },
                    deals.map((deal, i) =>
                      h('div', {
                        key: deal.id || i,
                        onClick: () => {
                          setSelectedDeal(deal);
                          setShowDealDetail(true);
                        },
                        style: {
                          padding: '16px',
                          background: 'rgba(26, 31, 58, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        },
                        onMouseEnter: (e) => {
                          e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      },
                        h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' } }, deal.title),
                        h('div', { style: { fontSize: '14px', color: '#4ade80', marginBottom: '4px' } }, 
                          deal.value ? `$${deal.value.toLocaleString()}` : 'No value'
                        ),
                        h('div', { 
                          style: { 
                            display: 'inline-block',
                            fontSize: '11px', 
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: deal.stage === 'won' ? 'rgba(74, 222, 128, 0.1)' : 
                                       deal.stage === 'lost' ? 'rgba(239, 68, 68, 0.1)' :
                                       'rgba(201, 169, 98, 0.1)',
                            color: deal.stage === 'won' ? '#4ade80' : 
                                   deal.stage === 'lost' ? '#ef4444' : '#C9A962'
                          } 
                        }, (deal.stage || 'lead').toUpperCase()),
                        deal.contact_name && h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '4px' } }, `👤 ${deal.contact_name}`)
                      )
                    )
                  )
                )
              )
            ) :
            // File Bank View
            view === 'filebank' ? h('div', {},
              // Header with actions
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                  h('h3', { style: { color: '#C9A962', fontSize: '18px', margin: 0 } }, '📁 File Bank'),
                  currentFolder && h('div', {
                    style: {
                      padding: '6px 12px',
                      background: 'rgba(201, 169, 98, 0.15)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#C9A962',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }
                  },
                    `Filtering: ${currentFolder.folder_name}`,
                    h('button', {
                      onClick: () => setCurrentFolder(null),
                      style: {
                        background: 'none',
                        border: 'none',
                        color: '#C9A962',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0 4px'
                      }
                    }, '✕')
                  )
                ),
                h('div', { style: { display: 'flex', gap: '12px' } },
                  // Upload button
                  h('label', {
                    style: {
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s'
                    }
                  },
                    '⬆️ Upload File',
                    h('input', {
                      type: 'file',
                      style: { display: 'none' },
                      onChange: (e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(file);
                      }
                    })
                  ),
                  // Create Folder button
                  h('button', {
                    onClick: () => setShowCreateFolder(true),
                    style: {
                      padding: '10px 20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }
                  }, '📁 New Folder')
                )
              ),
              
              // Drag and drop upload zone
              uploadingFile ? h('div', {
                style: {
                  padding: '40px',
                  marginBottom: '24px',
                  background: 'rgba(26, 31, 58, 0.6)',
                  border: '2px dashed #C9A962',
                  borderRadius: '12px',
                  textAlign: 'center'
                }
              },
                h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '⏳'),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', marginBottom: '12px' } }, 'Uploading...'),
                h('div', {
                  style: {
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    margin: '0 auto',
                    maxWidth: '400px'
                  }
                },
                  h('div', {
                    style: {
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #C9A962 0%, #A88B4E 100%)',
                      transition: 'width 0.3s'
                    }
                  })
                ),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginTop: '8px' } }, `${uploadProgress}%`)
              ) : h('div', {
                onDrop: handleFileDrop,
                onDragOver: handleDragOver,
                onDragLeave: handleDragLeave,
                style: {
                  padding: '40px',
                  marginBottom: '24px',
                  background: isDragging ? 'rgba(201, 169, 98, 0.1)' : 'rgba(26, 31, 58, 0.6)',
                  border: isDragging ? '2px dashed #C9A962' : '2px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }
              },
                h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📤'),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', marginBottom: '8px' } }, 'Drag and drop files here'),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' } }, 'or click Upload File button above')
              ),
              
              // Files Grid
              (() => {
                // Filter files by current folder if selected
                const filteredFiles = currentFolder 
                  ? files.filter(f => f.folder_id === currentFolder.id)
                  : files;
                
                return filteredFiles.length === 0 ? h('div', { style: { textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.4)' } }, 
                  h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📁'),
                  h('div', { style: { fontSize: '16px' } }, currentFolder ? `No files in ${currentFolder.folder_name}` : 'No files yet'),
                  h('div', { style: { fontSize: '13px', marginTop: '8px' } }, 'Upload your first file to get started')
                ) : h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' } },
                  filteredFiles.map((file, i) =>
                  h('div', {
                    key: file.id || i,
                    onClick: () => {
                      setSelectedFile(file);
                      setShowFilePreview(true);
                    },
                    style: {
                      padding: '16px',
                      background: 'rgba(26, 31, 58, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      position: 'relative'
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  },
                    // File icon
                    h('div', { style: { fontSize: '48px', textAlign: 'center', marginBottom: '12px' } },
                      file.file_extension === 'pdf' ? '📄' :
                      file.file_extension === 'docx' || file.file_extension === 'doc' ? '📝' :
                      file.file_extension === 'xlsx' || file.file_extension === 'xls' ? '📊' :
                      file.file_extension === 'png' || file.file_extension === 'jpg' || file.file_extension === 'jpeg' ? '🖼️' :
                      file.file_extension === 'zip' || file.file_extension === 'rar' ? '📦' : '📄'
                    ),
                    h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, file.filename),
                    h('div', { style: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' } }, `${(file.file_size / 1024 / 1024).toFixed(2)} MB`),
                    file.folder_name && h('div', { style: { fontSize: '11px', color: '#C9A962', marginBottom: '8px' } }, `📁 ${file.folder_name}`),
                    h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' } },
                      file.thread_count > 0 ? `Used in ${file.thread_count} thread${file.thread_count > 1 ? 's' : ''}` : 'Not used yet'
                    ),
                    file.is_starred === 1 && h('div', { style: { position: 'absolute', top: '8px', right: '8px', fontSize: '16px' } }, '⭐'),
                    file.version > 1 && h('div', { style: { position: 'absolute', top: '8px', left: '8px', padding: '2px 8px', background: '#C9A962', borderRadius: '4px', fontSize: '10px', fontWeight: '600' } }, `v${file.version}`)
                  )
                )
              );
              })(),
              
              // Folders section
              folders.length > 0 && h('div', { style: { marginTop: '32px' } },
                h('h4', { style: { color: '#C9A962', marginBottom: '12px', fontSize: '16px' } }, '📂 Folders'),
                h('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
                  folders.map((folder, i) =>
                    h('div', {
                      key: folder.id || i,
                      onClick: () => setCurrentFolder(folder),
                      style: {
                        padding: '12px 20px',
                        background: currentFolder?.id === folder.id ? 'rgba(201, 169, 98, 0.2)' : 'rgba(26, 31, 58, 0.6)',
                        border: currentFolder?.id === folder.id ? '1px solid #C9A962' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }
                    },
                      h('span', { style: { fontSize: '20px' } }, folder.icon || '📁'),
                      h('span', { style: { fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)' } }, folder.folder_name),
                      folder.is_team_shared === 1 && h('span', { 
                        style: { 
                          fontSize: '10px', 
                          padding: '2px 8px', 
                          background: 'rgba(201, 169, 98, 0.2)', 
                          borderRadius: '4px', 
                          color: '#C9A962',
                          fontWeight: '600'
                        } 
                      }, '👥 SHARED'),
                      folder.file_count > 0 && h('span', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' } }, `(${folder.file_count})`)
                    )
                  )
                )
              )
            ) :
            // Tasks View
            view === 'tasks' ? h('div', {},
              h('h3', { style: { color: '#C9A962', marginBottom: '16px', fontSize: '18px' } }, '✅ Your Tasks'),
              
              // Create Task Form
              h('div', { 
                style: { 
                  marginBottom: '24px', 
                  padding: '20px', 
                  background: 'rgba(26, 31, 58, 0.6)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '12px' 
                } 
              },
                h('h4', { style: { color: 'rgba(255, 255, 255, 0.9)', marginBottom: '16px', fontSize: '15px' } }, '➕ Create New Task'),
                h('input', {
                  type: 'text',
                  placeholder: 'Task title *',
                  value: newTaskTitle,
                  onInput: (e) => setNewTaskTitle(e.target.value),
                  style: {
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }
                }),
                h('textarea', {
                  placeholder: 'Description (optional)',
                  value: newTaskDescription,
                  onInput: (e) => setNewTaskDescription(e.target.value),
                  style: {
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '80px'
                  }
                }),
                h('div', { style: { display: 'flex', gap: '12px', marginBottom: '12px' } },
                  h('select', {
                    value: newTaskPriority,
                    onChange: (e) => setNewTaskPriority(e.target.value),
                    style: {
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }
                  },
                    h('option', { value: 'low' }, '🟢 Low Priority'),
                    h('option', { value: 'medium' }, '🟡 Medium Priority'),
                    h('option', { value: 'high' }, '🟠 High Priority'),
                    h('option', { value: 'urgent' }, '🔴 Urgent')
                  ),
                  h('input', {
                    type: 'date',
                    value: newTaskDueDate,
                    onChange: (e) => setNewTaskDueDate(e.target.value),
                    style: {
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }
                  })
                ),
                h('button', {
                  onClick: createTask,
                  disabled: !newTaskTitle.trim(),
                  style: {
                    width: '100%',
                    padding: '12px',
                    background: newTaskTitle.trim() ? 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)' : 'rgba(100, 100, 100, 0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s'
                  }
                }, '➕ Create Task')
              ),
              
              // Tasks List
              h('div', { style: { display: 'grid', gap: '12px' } },
                tasks.length === 0 ? 
                  h('div', { style: { textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' } }, 'No tasks yet. Create one above!') :
                tasks.map((task, i) =>
                  h('div', {
                    key: task.id || i,
                    style: {
                      padding: '20px',
                      background: 'rgba(26, 31, 58, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      transition: 'all 0.3s',
                      opacity: task.status === 'completed' ? 0.6 : 1
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' } },
                      h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 } },
                        h('input', {
                          type: 'checkbox',
                          checked: task.status === 'completed',
                          onChange: () => toggleTaskComplete(task.id, task.status),
                          style: {
                            width: '20px',
                            height: '20px',
                            marginTop: '2px',
                            cursor: 'pointer',
                            accentColor: '#C9A962'
                          }
                        }),
                        h('div', { style: { flex: 1 } },
                          h('div', { 
                            style: { 
                              fontWeight: '600', 
                              color: 'rgba(255, 255, 255, 0.9)',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                            } 
                          }, task.title),
                          task.description && h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, task.description),
                          h('div', { style: { display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' } },
                            h('span', { 
                              style: { 
                                fontSize: '11px', 
                                padding: '4px 12px', 
                                borderRadius: '12px',
                                background: task.priority === 'urgent' ? 'rgba(239, 68, 68, 0.2)' :
                                           task.priority === 'high' ? 'rgba(251, 146, 60, 0.2)' :
                                           task.priority === 'medium' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                color: task.priority === 'urgent' ? '#ef4444' :
                                       task.priority === 'high' ? '#fb923c' :
                                       task.priority === 'medium' ? '#eab308' : '#22c55e'
                              } 
                            }, task.priority || 'low'),
                            task.due_date && h('span', { style: { fontSize: '12px', color: '#C9A962' } }, 
                              `⏰ ${new Date(task.due_date).toLocaleDateString()}`
                            )
                          )
                        )
                      ),
                      h('button', {
                        onClick: () => deleteTask(task.id),
                        style: {
                          background: 'none',
                          border: 'none',
                          color: 'rgba(239, 68, 68, 0.6)',
                          fontSize: '18px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        },
                        onMouseEnter: (e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)';
                          e.currentTarget.style.background = 'none';
                        }
                      }, '🗑️')
                    )
                  )
                )
              )
            ) :
            // Analytics View
            view === 'analytics' ? h('div', {},
              h('h3', { style: { color: '#C9A962', marginBottom: '24px', fontSize: '24px', fontWeight: '700' } }, '📊 Analytics Dashboard'),
              h('div', { style: { textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.5)' } },
                'Analytics dashboard coming soon...'
              )
            ) :
            // Team View
            view === 'team' ? h('div', {},
              h('h3', { style: { color: '#C9A962', marginBottom: '24px', fontSize: '24px', fontWeight: '700' } }, '👔 Team Collaboration'),
              h('div', { style: { textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.5)' } },
                'Team collaboration features coming soon...'
              )
            ) :
            // Email views - Show search results or regular emails
            (showSearchResults ? searchResults : emails).length === 0 ? h('div', { 
              style: { 
                textAlign: 'center', 
                padding: '80px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              } 
            },
              h('div', {
                style: {
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, rgba(201, 169, 98, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  marginBottom: '8px'
                }
              }, '📭'),
              h('h3', { 
                style: { 
                  marginBottom: '8px', 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '24px',
                  fontWeight: '600'
                } 
              }, 'No emails here'),
              h('p', { 
                style: { 
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '15px',
                  maxWidth: '400px'
                } 
              }, 
                view === 'sent' ? 'You haven\'t sent any emails yet. Click "Compose New Email" to get started.' : 
                showSearchResults ? 'No emails found matching your search. Try different keywords.' : 'This folder is empty.'
              )
            ) : h('div', { 
              style: { 
                display: 'grid', 
                gap: '16px'
              } 
            },
              // Show search results header if searching
              showSearchResults && h('div', {
                style: {
                  padding: '16px 20px',
                  background: 'rgba(201, 169, 98, 0.1)',
                  border: '1px solid rgba(201, 169, 98, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '8px'
                }
              },
                h('div', { style: { fontSize: '16px', fontWeight: '600', color: '#C9A962', marginBottom: '4px' } },
                  `🔍 Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`
                ),
                h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' } },
                  `Searching for: "${searchQuery}"`
                )
              ),
              (showSearchResults ? searchResults : emails).map((email, i) =>
                h('div', {
                  key: email.id || i,
                  onClick: () => {
                    console.log('📧 Email clicked:', email);
                    
                    // Mark as read when opening
                    if (!email.is_read) {
                      fetch(`/api/email/${email.id}/mark-read`, {
                        method: 'PATCH'
                      }).then(res => {
                        if (res.ok) {
                          // Update local state
                          email.is_read = 1;
                          console.log('✅ Marked as read');
                        }
                      }).catch(err => console.error('❌ Mark as read failed:', err));
                    }
                    
                    setSelectedEmail(email);
                    setShowCollabPanel(true);
                    loadCollabData(email.id);
                  },
                  style: {
                    padding: '24px',
                    // Read emails: darker, dimmed (lights off)
                    // Unread emails: brighter, highlighted
                    background: email.is_read 
                      ? 'linear-gradient(135deg, rgba(15, 20, 35, 0.4) 0%, rgba(10, 13, 25, 0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(15, 20, 41, 0.8) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: email.is_read 
                      ? '1px solid rgba(255, 255, 255, 0.03)'
                      : '1px solid rgba(201, 169, 98, 0.2)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: email.is_read
                      ? '0 2px 12px rgba(0, 0, 0, 0.3)'
                      : '0 4px 24px rgba(201, 169, 98, 0.15)',
                    opacity: email.is_read ? 0.7 : 1
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                    e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(201, 169, 98, 0.2)';
                    e.currentTarget.style.opacity = '1';
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.borderColor = email.is_read 
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(201, 169, 98, 0.2)';
                    e.currentTarget.style.boxShadow = email.is_read
                      ? '0 2px 12px rgba(0, 0, 0, 0.3)'
                      : '0 4px 24px rgba(201, 169, 98, 0.15)';
                    e.currentTarget.style.opacity = email.is_read ? '0.7' : '1';
                  }
                },
                  // Gradient shine effect
                  h('div', {
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)',
                      transition: 'left 0.5s'
                    }
                  }),
                  
                  h('div', { 
                    style: { 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px' 
                    } 
                  },
                    h('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }
                    },
                      h('div', {
                        style: {
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }
                      }, (view === 'sent' ? email.to_email : email.from_email || 'U')[0].toUpperCase()),
                      h('div', null,
                        h('div', { 
                          style: { 
                            fontWeight: '600', 
                            color: 'rgba(255, 255, 255, 0.95)',
                            fontSize: '15px',
                            marginBottom: '4px'
                          } 
                        },
                          view === 'sent' ? `To: ${email.to_email}` : `From: ${email.from_email || email.from_name || 'Unknown'}`
                        ),
                        h('div', { 
                          style: { 
                            fontSize: '12px', 
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontWeight: '500'
                          } 
                        },
                          new Date(email.sent_at || email.received_at || email.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        )
                      )
                    ),
                    // Status badges container
                    h('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }
                    },
                      // 🔵 Unread indicator badge
                      !email.is_read && h('div', {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2))',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          color: '#60a5fa',
                          boxShadow: '0 2px 12px rgba(59, 130, 246, 0.4)',
                          animation: 'pulse 2s ease-in-out infinite'
                        }
                      }, '🔵 UNREAD'),
                      
                      // ⏳ Timer Badge
                      email.expiry_type && h('div', {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: email.expiry_type === 'keep' 
                            ? 'linear-gradient(135deg, rgba(201, 169, 98, 0.2), rgba(201, 169, 98, 0.1))'
                            : email.expires_at && new Date(email.expires_at) - new Date() < 24 * 60 * 60 * 1000
                              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))'
                              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))',
                          border: email.expiry_type === 'keep'
                            ? '1px solid rgba(201, 169, 98, 0.3)'
                            : email.expires_at && new Date(email.expires_at) - new Date() < 24 * 60 * 60 * 1000
                              ? '1px solid rgba(239, 68, 68, 0.3)'
                              : '1px solid rgba(59, 130, 246, 0.3)',
                          color: email.expiry_type === 'keep'
                            ? 'rgba(201, 169, 98, 0.9)'
                            : email.expires_at && new Date(email.expires_at) - new Date() < 24 * 60 * 60 * 1000
                              ? '#ef4444'
                              : '#3b82f6',
                          boxShadow: email.expiry_type === 'keep'
                            ? '0 2px 8px rgba(201, 169, 98, 0.2)'
                            : email.expires_at && new Date(email.expires_at) - new Date() < 24 * 60 * 60 * 1000
                              ? '0 2px 8px rgba(239, 68, 68, 0.2)'
                              : '0 2px 8px rgba(59, 130, 246, 0.2)'
                        }
                      },
                        email.expiry_type === 'keep' ? '∞' : '⏳',
                        ' ',
                        email.expiry_type === 'keep' ? 'Keep' : getTimeRemaining(email.expires_at)
                      )
                    )
                  ),
                  
                  // Subject Line - Clear & Bold
                  h('div', { 
                    style: { 
                      fontWeight: '700', 
                      marginBottom: '6px', 
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '17px',
                      letterSpacing: '-0.3px',
                      lineHeight: '1.3'
                    } 
                  }, email.subject || '(No Subject)'),
                  
                  // Smart Summary Line - AI summary or snippet
                  h('div', { 
                    style: { 
                      fontSize: '13px', 
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: '1.5',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontStyle: email.ai_summary ? 'italic' : 'normal'
                    } 
                  }, 
                    email.ai_summary 
                      ? `💡 ${email.ai_summary}` 
                      : (email.snippet || email.body_text || 'No content')
                  ),
                  
                  // Thread context & metadata
                  h('div', {
                    style: {
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }
                  },
                    view === 'sent' && h('span', {}, `→ ${email.to_email}`),
                    email.snippet && h('span', {}, `${(email.snippet || email.body_text || '').length} chars`)
                  ),
                  
                  // Read status indicator for sent emails
                  view === 'sent' && readStatuses[email.id] && h('div', {
                    style: {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: readStatuses[email.id].is_read ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                      color: readStatuses[email.id].is_read ? '#22c55e' : 'rgba(255, 255, 255, 0.5)',
                      border: `1px solid ${readStatuses[email.id].is_read ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`
                    }
                  },
                    readStatuses[email.id].is_read ? '✓ Read' : '○ Unread',
                    readStatuses[email.id].is_read && readStatuses[email.id].receipts?.[0]?.opened_at && 
                      h('span', { style: { fontSize: '11px', opacity: 0.7 } }, 
                        ` • ${new Date(readStatuses[email.id].receipts[0].opened_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      )
                  )
                )
              )
            )
          )
        ),
        
        // File Preview Modal
        showFilePreview && selectedFile && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(10px)'
          },
          onClick: (e) => {
            if (e.target === e.currentTarget) setShowFilePreview(false);
          }
        },
          h('div', {
            style: {
              background: 'linear-gradient(135deg, #1A1F3A 0%, #0F1425 100%)',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }
          },
            // Header
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' } },
              h('div', {},
                h('h3', { style: { color: '#C9A962', fontSize: '20px', marginBottom: '8px' } }, selectedFile.filename),
                h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' } }, 
                  `${(selectedFile.file_size / 1024 / 1024).toFixed(2)} MB • Version ${selectedFile.version || 1} • ${selectedFile.folder_name || 'No folder'}`
                )
              ),
              h('button', {
                onClick: () => setShowFilePreview(false),
                style: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  fontSize: '18px'
                }
              }, '✕')
            ),
            
            // File icon preview
            h('div', {
              style: {
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(26, 31, 58, 0.6)',
                borderRadius: '12px',
                marginBottom: '24px'
              }
            },
              h('div', { style: { fontSize: '80px', marginBottom: '16px' } },
                selectedFile.file_extension === 'pdf' ? '📄' :
                selectedFile.file_extension === 'docx' || selectedFile.file_extension === 'doc' ? '📝' :
                selectedFile.file_extension === 'xlsx' || selectedFile.file_extension === 'xls' ? '📊' :
                selectedFile.file_extension === 'png' || selectedFile.file_extension === 'jpg' || selectedFile.file_extension === 'jpeg' ? '🖼️' :
                selectedFile.file_extension === 'zip' || selectedFile.file_extension === 'rar' ? '📦' : '📄'
              ),
              h('div', { style: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' } }, 'File preview not available')
            ),
            
            // File stats
            h('div', {
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px',
                padding: '20px',
                background: 'rgba(26, 31, 58, 0.6)',
                borderRadius: '12px'
              }
            },
              h('div', {},
                h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' } }, 'USAGE'),
                h('div', { style: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' } }, 
                  selectedFile.thread_count > 0 ? `${selectedFile.thread_count} thread${selectedFile.thread_count > 1 ? 's' : ''}` : 'Not used'
                )
              ),
              h('div', {},
                h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' } }, 'UPLOADED'),
                h('div', { style: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' } }, 
                  new Date(selectedFile.created_at || Date.now()).toLocaleDateString()
                )
              ),
              h('div', {},
                h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' } }, 'EXTENSION'),
                h('div', { style: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', textTransform: 'uppercase' } }, 
                  selectedFile.file_extension || 'unknown'
                )
              ),
              h('div', {},
                h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' } }, 'PATH'),
                h('div', { style: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, 
                  selectedFile.file_path || 'No path'
                )
              )
            ),
            
            // Actions
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
              h('button', {
                onClick: () => downloadFile(selectedFile),
                style: {
                  padding: '12px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, '📥 Download'),
              h('button', {
                onClick: () => shareFile(selectedFile),
                style: {
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, '🔗 Share Link'),
              h('button', {
                onClick: () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      alert('📤 Uploading new version...\n\nIn production, this would create version ' + ((selectedFile.version || 1) + 1));
                    }
                  };
                  input.click();
                },
                style: {
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, '🔄 New Version'),
              h('button', {
                onClick: () => deleteFile(selectedFile),
                style: {
                  padding: '12px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '10px',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, '🗑️ Delete')
            )
          )
        ),
        
        // Create Folder Modal
        showCreateFolder && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(10px)'
          },
          onClick: (e) => {
            if (e.target === e.currentTarget) setShowCreateFolder(false);
          }
        },
          h('div', {
            style: {
              background: 'linear-gradient(135deg, #1A1F3A 0%, #0F1425 100%)',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }
          },
            h('h3', { style: { color: '#C9A962', fontSize: '20px', marginBottom: '24px' } }, '📁 Create New Folder'),
            h('input', {
              type: 'text',
              placeholder: 'Folder name',
              value: newFolderName,
              onInput: (e) => setNewFolderName(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '16px'
              }
            }),
            // Shared folder checkbox
            h('label', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                cursor: 'pointer',
                padding: '12px',
                background: 'rgba(201, 169, 98, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(201, 169, 98, 0.2)'
              }
            },
              h('input', {
                type: 'checkbox',
                checked: newFolderIsShared,
                onChange: (e) => setNewFolderIsShared(e.target.checked),
                style: {
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#C9A962'
                }
              }),
              h('div', {},
                h('div', { style: { color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: '600', marginBottom: '4px' } }, '👥 Shared Folder'),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' } }, 'All team members can access files in this folder')
              )
            ),
            h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
              h('button', {
                onClick: () => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                  setNewFolderIsShared(false);
                },
                style: {
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, 'Cancel'),
              h('button', {
                onClick: createFolder,
                style: {
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, 'Create Folder')
            )
          )
        ),
        
        // File Picker Modal
        showFilePicker && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            backdropFilter: 'blur(10px)'
          },
          onClick: (e) => {
            if (e.target === e.currentTarget) setShowFilePicker(false);
          }
        },
          h('div', {
            style: {
              background: 'linear-gradient(135deg, #1A1F3A 0%, #0F1425 100%)',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }
          },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
              h('h3', { style: { color: '#C9A962', fontSize: '20px', margin: 0 } }, '📁 Select File from Bank'),
              h('button', {
                onClick: () => setShowFilePicker(false),
                style: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  fontSize: '18px'
                }
              }, '✕')
            ),
            
            files.length === 0 ? h('div', { style: { textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.4)' } },
              h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📁'),
              h('div', { style: { fontSize: '16px' } }, 'No files in your File Bank'),
              h('div', { style: { fontSize: '13px', marginTop: '8px' } }, 'Upload files to the File Bank first')
            ) : h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' } },
              files.map((file, i) =>
                h('div', {
                  key: file.id || i,
                  onClick: () => {
                    alert(`✅ Attached: ${file.filename}\n\nIn production, this file would be attached to your email.`);
                    setShowFilePicker(false);
                  },
                  style: {
                    padding: '16px',
                    background: 'rgba(26, 31, 58, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                },
                  h('div', { style: { fontSize: '48px', textAlign: 'center', marginBottom: '12px' } },
                    file.file_extension === 'pdf' ? '📄' :
                    file.file_extension === 'docx' || file.file_extension === 'doc' ? '📝' :
                    file.file_extension === 'xlsx' || file.file_extension === 'xls' ? '📊' :
                    file.file_extension === 'png' || file.file_extension === 'jpg' || file.file_extension === 'jpeg' ? '🖼️' :
                    file.file_extension === 'zip' || file.file_extension === 'rar' ? '📦' : '📄'
                  ),
                  h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, file.filename),
                  h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' } }, `${(file.file_size / 1024 / 1024).toFixed(2)} MB`)
                )
              )
            )
          )
        ),
        
        // Create Contact Modal
        showCreateContact && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(10px)'
          },
          onClick: (e) => {
            if (e.target === e.currentTarget) setShowCreateContact(false);
          }
        },
          h('div', {
            style: {
              background: 'linear-gradient(135deg, #1A1F3A 0%, #0F1425 100%)',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }
          },
            h('h3', { style: { color: '#C9A962', fontSize: '20px', marginBottom: '24px' } }, '👤 Create New Contact'),
            
            // Name
            h('input', {
              type: 'text',
              placeholder: 'Full Name *',
              value: newContactName,
              onInput: (e) => setNewContactName(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            
            // Email
            h('input', {
              type: 'email',
              placeholder: 'Email *',
              value: newContactEmail,
              onInput: (e) => setNewContactEmail(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            
            // Phone
            h('input', {
              type: 'tel',
              placeholder: 'Phone',
              value: newContactPhone,
              onInput: (e) => setNewContactPhone(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            
            // Company
            h('input', {
              type: 'text',
              placeholder: 'Company',
              value: newContactCompany,
              onInput: (e) => setNewContactCompany(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '24px'
              }
            }),
            
            h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
              h('button', {
                onClick: () => {
                  setShowCreateContact(false);
                  setNewContactName('');
                  setNewContactEmail('');
                  setNewContactPhone('');
                  setNewContactCompany('');
                },
                style: {
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, 'Cancel'),
              h('button', {
                onClick: createContact,
                style: {
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, 'Create Contact')
            )
          )
        ),
        
        // Create Deal Modal
        showCreateDeal && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(10px)'
          },
          onClick: (e) => {
            if (e.target === e.currentTarget) setShowCreateDeal(false);
          }
        },
          h('div', {
            style: {
              background: 'linear-gradient(135deg, #1A1F3A 0%, #0F1425 100%)',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }
          },
            h('h3', { style: { color: '#C9A962', fontSize: '20px', marginBottom: '24px' } }, '💼 Create New Deal'),
            
            // Title
            h('input', {
              type: 'text',
              placeholder: 'Deal Title *',
              value: newDealTitle,
              onInput: (e) => setNewDealTitle(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            
            // Value
            h('input', {
              type: 'number',
              placeholder: 'Deal Value ($)',
              value: newDealValue,
              onInput: (e) => setNewDealValue(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            
            // Stage
            h('select', {
              value: newDealStage,
              onChange: (e) => setNewDealStage(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px',
                cursor: 'pointer'
              }
            },
              h('option', { value: 'lead' }, 'Lead'),
              h('option', { value: 'qualified' }, 'Qualified'),
              h('option', { value: 'proposal' }, 'Proposal'),
              h('option', { value: 'negotiation' }, 'Negotiation'),
              h('option', { value: 'won' }, 'Won'),
              h('option', { value: 'lost' }, 'Lost')
            ),
            
            // Contact
            h('select', {
              value: newDealContactId,
              onChange: (e) => setNewDealContactId(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px',
                cursor: 'pointer'
              }
            },
              h('option', { value: '' }, 'Select Contact (Optional)'),
              contacts.map((contact, i) =>
                h('option', { key: i, value: contact.id }, `${contact.name} (${contact.email})`)
              )
            ),
            
            // Probability
            h('input', {
              type: 'number',
              placeholder: 'Probability (%) - Default 50%',
              value: newDealProbability,
              onInput: (e) => setNewDealProbability(e.target.value),
              min: '0',
              max: '100',
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            
            // Close Date
            h('input', {
              type: 'date',
              placeholder: 'Expected Close Date',
              value: newDealCloseDate,
              onInput: (e) => setNewDealCloseDate(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            
            // Notes
            h('textarea', {
              placeholder: 'Notes (Optional)',
              value: newDealNotes,
              onInput: (e) => setNewDealNotes(e.target.value),
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '24px',
                minHeight: '100px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }
            }),
            
            h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
              h('button', {
                onClick: () => {
                  setShowCreateDeal(false);
                  setNewDealTitle('');
                  setNewDealValue('');
                  setNewDealStage('lead');
                },
                style: {
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, 'Cancel'),
              h('button', {
                onClick: createDeal,
                style: {
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, 'Create Deal')
            )
          )
        ),
        
        // Contact Detail Modal
        showContactDetail && selectedContact && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            backdropFilter: 'blur(10px)'
          },
          onClick: (e) => {
            if (e.target === e.currentTarget) setShowContactDetail(false);
          }
        },
          h('div', {
            style: {
              background: 'linear-gradient(135deg, #1A1F3A 0%, #0F1425 100%)',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }
          },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' } },
              h('div', {},
                h('h3', { style: { color: '#C9A962', fontSize: '24px', marginBottom: '4px' } }, `👤 ${selectedContact.name}`),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' } }, selectedContact.email)
              ),
              h('button', {
                onClick: () => setShowContactDetail(false),
                style: {
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontSize: '24px'
                }
              }, '×')
            ),
            
            // Contact Info
            h('div', { style: { marginBottom: '24px' } },
              h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' } },
                selectedContact.phone && h('div', {},
                  h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Phone'),
                  h('div', { style: { color: 'rgba(255, 255, 255, 0.9)' } }, selectedContact.phone)
                ),
                selectedContact.company && h('div', {},
                  h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Company'),
                  h('div', { style: { color: 'rgba(255, 255, 255, 0.9)' } }, selectedContact.company)
                ),
                selectedContact.position && h('div', {},
                  h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Position'),
                  h('div', { style: { color: 'rgba(255, 255, 255, 0.9)' } }, selectedContact.position)
                ),
                selectedContact.contact_type && h('div', {},
                  h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Type'),
                  h('div', { style: { color: '#C9A962', textTransform: 'capitalize' } }, selectedContact.contact_type)
                )
              )
            ),
            
            // Deals
            h('div', { style: { marginBottom: '24px' } },
              h('h4', { style: { color: '#C9A962', fontSize: '16px', marginBottom: '12px' } }, `💼 Deals (${contactDeals.length})`),
              contactDeals.length === 0 ? h('div', { style: { padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' } }, 'No deals yet') :
              h('div', { style: { display: 'grid', gap: '8px' } },
                contactDeals.map((deal, i) =>
                  h('div', {
                    key: i,
                    style: {
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }
                  },
                    h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' } }, deal.title),
                    h('div', { style: { fontSize: '14px', color: '#4ade80' } }, `$${(deal.value || 0).toLocaleString()}`)
                  )
                )
              )
            ),
            
            // Recent Emails
            h('div', { style: { marginBottom: '24px' } },
              h('h4', { style: { color: '#C9A962', fontSize: '16px', marginBottom: '12px' } }, `📧 Recent Emails (${contactEmails.length})`),
              contactEmails.length === 0 ? h('div', { style: { padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' } }, 'No email history') :
              h('div', { style: { display: 'grid', gap: '8px' } },
                contactEmails.slice(0, 5).map((email, i) =>
                  h('div', {
                    key: i,
                    style: {
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer'
                    },
                    onClick: () => {
                      setSelectedEmail(emails.find(e => e.id === email.id));
                      setShowContactDetail(false);
                    }
                  },
                    h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginBottom: '4px' } }, email.subject),
                    h('div', { style: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' } }, new Date(email.created_at).toLocaleDateString())
                  )
                )
              )
            ),
            
            // Actions
            h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' } },
              h('button', {
                onClick: () => {
                  setShowCompose(true);
                  setShowContactDetail(false);
                },
                style: {
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, '✉️ Send Email'),
              h('button', {
                onClick: () => deleteContact(selectedContact.id),
                style: {
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, '🗑️ Delete')
            )
          )
        ),
        
        // Deal Detail Modal
        showDealDetail && selectedDeal && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            backdropFilter: 'blur(10px)'
          },
          onClick: (e) => {
            if (e.target === e.currentTarget) setShowDealDetail(false);
          }
        },
          h('div', {
            style: {
              background: 'linear-gradient(135deg, #1A1F3A 0%, #0F1425 100%)',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }
          },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' } },
              h('div', {},
                h('h3', { style: { color: '#C9A962', fontSize: '24px', marginBottom: '4px' } }, `💼 ${selectedDeal.title}`),
                h('div', { style: { fontSize: '20px', color: '#4ade80', fontWeight: '600' } }, `$${(selectedDeal.value || 0).toLocaleString()}`)
              ),
              h('button', {
                onClick: () => setShowDealDetail(false),
                style: {
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontSize: '24px'
                }
              }, '×')
            ),
            
            // Deal Info
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' } },
              h('div', {},
                h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Stage'),
                h('select', {
                  value: selectedDeal.stage,
                  onChange: (e) => {
                    updateDeal(selectedDeal.id, { stage: e.target.value });
                    setSelectedDeal({ ...selectedDeal, stage: e.target.value });
                  },
                  style: {
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }
                },
                  h('option', { value: 'lead' }, 'Lead'),
                  h('option', { value: 'qualified' }, 'Qualified'),
                  h('option', { value: 'proposal' }, 'Proposal'),
                  h('option', { value: 'negotiation' }, 'Negotiation'),
                  h('option', { value: 'won' }, 'Won'),
                  h('option', { value: 'lost' }, 'Lost')
                )
              ),
              selectedDeal.contact_name && h('div', {},
                h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Contact'),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.9)' } }, selectedDeal.contact_name)
              ),
              selectedDeal.probability !== undefined && h('div', {},
                h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Probability'),
                h('div', { style: { color: '#C9A962' } }, `${selectedDeal.probability}%`)
              ),
              selectedDeal.close_date && h('div', {},
                h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' } }, 'Close Date'),
                h('div', { style: { color: 'rgba(255, 255, 255, 0.9)' } }, new Date(selectedDeal.close_date).toLocaleDateString())
              )
            ),
            
            // Notes
            selectedDeal.notes && h('div', { style: { marginBottom: '24px' } },
              h('div', { style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '8px' } }, 'Notes'),
              h('div', { style: { padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: '1.6' } }, selectedDeal.notes)
            ),
            
            // Actions
            h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
              h('button', {
                onClick: () => setShowDealDetail(false),
                style: {
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }
              }, 'Close')
            )
          )
        ),
        
        // Ultra Premium Compose Modal
        showCompose && h(ComposeModal, {
          onClose: () => setShowCompose(false),
          onSend: sendEmail,
          files: files,
          showFilePicker: showFilePicker,
          setShowFilePicker: setShowFilePicker
        }),
        
        // Email Viewer Modal - Shows when email is selected
        selectedEmail && h(EmailViewerModal, {
          email: selectedEmail,
          onClose: () => {
            setSelectedEmail(null);
            setShowCollabPanel(false);
          },
          onShowCollab: () => setShowCollabPanel(true),
          view: view,
          showCollabPanel: showCollabPanel
        }),
        
        // Team Collaboration Panel - Slides in from right
        showCollabPanel && selectedEmail && h('div', {
          style: {
            position: 'fixed',
            right: 0,
            top: 0,
            width: '400px',
            height: '100vh',
            background: 'linear-gradient(180deg, #0f1429 0%, #1a1f3a 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.4)',
            animation: 'slideInRight 0.3s ease-out'
          }
        },
          h('div', { style: { padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            h('h3', { style: { margin: 0, color: '#C9A962', fontSize: '18px' } }, '👥 Team Collaboration'),
            h('button', {
              onClick: () => setShowCollabPanel(false),
              style: { background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)', fontSize: '24px', cursor: 'pointer' }
            }, '✕')
          ),
          h('div', { style: { padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
            h('div', { style: { textAlign: 'center', padding: '12px', background: 'rgba(201, 169, 98, 0.1)', borderRadius: '8px' } },
              h('div', { style: { fontSize: '20px', fontWeight: '700', color: '#C9A962' } }, collabStats?.total_views || 0),
              h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, 'Views')
            ),
            h('div', { style: { textAlign: 'center', padding: '12px', background: 'rgba(201, 169, 98, 0.1)', borderRadius: '8px' } },
              h('div', { style: { fontSize: '20px', fontWeight: '700', color: '#C9A962' } }, collabStats?.total_comments || 0),
              h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, 'Comments')
            )
          ),
          h('div', { style: { flex: 1, overflow: 'auto', padding: '20px' } },
            h('div', { style: { fontSize: '13px', color: '#C9A962', marginBottom: '16px', fontWeight: '600' } }, '💬 Team Comments'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' } },
              comments.length === 0 ? 
                h('div', { style: { textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' } }, 'No comments yet') :
                comments.map((comment, i) =>
                  h('div', {
                    key: i,
                    style: { padding: '12px', background: 'rgba(26, 31, 58, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }
                  },
                    h('div', { style: { fontSize: '12px', fontWeight: '600', color: '#C9A962', marginBottom: '8px' } }, comment.author_name || comment.author_email),
                    h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' } }, comment.comment_text),
                    h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' } }, new Date(comment.created_at).toLocaleString())
                  )
                )
            ),
            h('div', {},
              h('textarea', {
                value: newComment,
                onChange: (e) => setNewComment(e.target.value),
                placeholder: 'Add internal team comment (private)...',
                style: {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(26, 31, 58, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '80px',
                  marginBottom: '12px'
                }
              }),
              h('button', {
                onClick: addComment,
                disabled: !newComment.trim(),
                style: {
                  width: '100%',
                  padding: '12px',
                  background: newComment.trim() ? 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)' : 'rgba(100, 100, 100, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed'
                }
              }, '💬 Add Comment')
            )
          )
        )
      );
    }
    
    function ComposeModal({ onClose, onSend, files, showFilePicker, setShowFilePicker }) {
      console.log('🎨 ComposeModal START');
      const [to, setTo] = useState('');
      const [subject, setSubject] = useState('');
      const [body, setBody] = useState('');
      const [aiProcessing, setAiProcessing] = useState(false);
      const [showAiTools, setShowAiTools] = useState(false);
      const [aiPrompt, setAiPrompt] = useState('');
      
      // Contact suggestion state
      const [showContactSuggestions, setShowContactSuggestions] = useState(false);
      const [contactSuggestions, setContactSuggestions] = useState([]);
      const [loadingContacts, setLoadingContacts] = useState(false);
      
      // TEMP FIX: These were removed but code references them - set as empty/null
      const attachments = [];
      const spamCheck = null;
      const checkingSpam = false;
      
      // Load contact suggestions
      const loadContactSuggestions = async (query) => {
        setLoadingContacts(true);
        try {
          // Get CRM contacts
          const searchParam = query && query.length >= 1 ? `&search=${encodeURIComponent(query)}` : '';
          const crmRes = await fetch(`/api/crm/contacts?userEmail=${user}${searchParam}`);
          const crmData = await crmRes.json();
          
          console.log('CRM Contacts Response:', crmData); // Debug log
          
          // Get company team members (all @investaycapital.com emails)
          const teamEmails = [
            { email: 'admin@investaycapital.com', name: 'Admin', company: 'Investay Capital' },
            { email: 'test1@investaycapital.com', name: 'Test User 1', company: 'Investay Capital' },
            { email: 'ahmed.enin@virgingates.com', name: 'Ahmed Enin', company: 'Virgin Gates' },
            { email: 'ahmed@investaycapital.com', name: 'Ahmed', company: 'Investay Capital' },
            { email: 'talabatpromocode@gmail.com', name: 'Talabat Promo', company: 'External' }
          ];
          
          // Combine and filter suggestions
          const suggestions = [];
          const queryLower = (query || '').toLowerCase();
          
          // Add matching CRM contacts first
          if (crmData.contacts && Array.isArray(crmData.contacts)) {
            crmData.contacts.forEach(contact => {
              // If no query, show all. If query exists, filter
              const matchesQuery = !query || query.length === 0 ||
                contact.email.toLowerCase().includes(queryLower) || 
                contact.name.toLowerCase().includes(queryLower) ||
                (contact.company && contact.company.toLowerCase().includes(queryLower));
                
              if (matchesQuery) {
                suggestions.push({
                  email: contact.email,
                  name: contact.name,
                  company: contact.company || '',
                  type: 'crm'
                });
              }
            });
          }
          
          console.log('CRM matches:', suggestions.length); // Debug log
          
          // Add matching team emails
          teamEmails.forEach(teamMember => {
            const matchesQuery = !query || query.length === 0 ||
              teamMember.email.toLowerCase().includes(queryLower) || 
              teamMember.name.toLowerCase().includes(queryLower);
              
            if (matchesQuery && !suggestions.find(s => s.email === teamMember.email)) {
              suggestions.push({
                ...teamMember,
                type: 'team'
              });
            }
          });
          
          console.log('Total suggestions:', suggestions.length); // Debug log
          
          setContactSuggestions(suggestions.slice(0, 8)); // Limit to 8 suggestions
          setShowContactSuggestions(suggestions.length > 0);
        } catch (error) {
          console.error('Error loading contacts:', error);
        } finally {
          setLoadingContacts(false);
        }
      };
      
      // Handle TO field change
      const handleToChange = (value) => {
        setTo(value);
        loadContactSuggestions(value);
      };
      
      // Select contact from suggestions
      const selectContact = (contact) => {
        setTo(contact.email);
        setShowContactSuggestions(false);
      };
      
      const handleAIAssist = async (action, tone = 'professional') => {
        if (!body.trim() && action !== 'generate') {
          alert('✍️ Please write some text first!');
          return;
        }
        
        setAiProcessing(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/email/compose-assist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              action,
              text: body,
              tone,
              context: subject
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            setBody(data.text);
          } else {
            alert('❌ AI assist failed: ' + data.error);
          }
        } catch (error) {
          alert('❌ AI error: ' + error.message);
        } finally {
          setAiProcessing(false);
        }
      };
      
      const handleGenerateFromPrompt = async () => {
        if (!aiPrompt.trim()) {
          alert('💡 Please enter what you want the email to say!');
          return;
        }
        
        setAiProcessing(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/email/compose-assist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              action: 'expand',
              text: aiPrompt,
              tone: 'professional',
              context: subject || 'Email request'
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            setBody(data.text);
            setAiPrompt(''); // Clear prompt after generating
          } else {
            alert('❌ AI generation failed: ' + data.error);
          }
        } catch (error) {
          alert('❌ AI error: ' + error.message);
        } finally {
          setAiProcessing(false);
        }
      };
      
      const handleSend = () => {
        if (!to || !subject) {
          alert('Please fill recipient and subject');
          return;
        }
        
        // Warn if spam score is high
        if (spamCheck && spamCheck.level === 'danger') {
          const proceed = confirm(
            `⚠️ HIGH SPAM RISK DETECTED!\n\n` +
            `Spam Score: ${spamCheck.score}/100\n\n` +
            `Your email has ${spamCheck.issues.length} issues that may cause it to land in spam.\n\n` +
            `Do you want to send anyway? (Not recommended)`
          );
          if (!proceed) return;
        } else if (spamCheck && spamCheck.level === 'warning') {
          const proceed = confirm(
            `⚠️ MODERATE SPAM RISK\n\n` +
            `Spam Score: ${spamCheck.score}/100\n\n` +
            `Your email has ${spamCheck.issues.length} issues. Consider revising before sending.\n\n` +
            `Send anyway?`
          );
          if (!proceed) return;
        }
        
        onSend(to, subject, body);
      };
      
      console.log('🎨 ComposeModal return - to:', to, 'subject:', subject, 'body length:', body.length);
      return h('div', {
        onClick: onClose,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }
      },
        h('div', {
          onClick: (e) => e.stopPropagation(),
          style: {
            background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.95) 0%, rgba(15, 20, 41, 0.95) 100%)',
            backdropFilter: 'blur(40px)',
            borderRadius: '24px',
            padding: '32px',
            width: '700px',
            maxWidth: '90%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 169, 98, 0.1)',
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }
        },
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px'
            }
          },
            h('h2', { 
              style: { 
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #C9A962 0%, #f5e6d3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              } 
            }, '✍️ Compose New Email'),
            h('button', {
              onClick: onClose,
              style: {
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }, '✕')
          ),
          
          h('div', { style: { marginBottom: '16px', position: 'relative' } },
            h('label', {
              style: {
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }
            }, 'To'),
            h('input', {
              type: 'email',
              name: 'to_email_' + Date.now(),
              id: 'compose_to_' + Date.now(),
              placeholder: 'Start typing to see suggestions...',
              value: to,
              autoComplete: 'new-password',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: 'false',
              'data-form-type': 'other',
              'data-lpignore': 'true',
              onChange: (e) => handleToChange(e.target.value),
              onInput: (e) => handleToChange(e.target.value),
              onFocus: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)';
                if (to.length >= 2) {
                  loadContactSuggestions(to);
                } else if (to.length === 0) {
                  // Show all suggestions when field is empty and focused
                  loadContactSuggestions('');
                }
              },
              onBlur: (e) => {
                // Delay to allow click on suggestion
                setTimeout(() => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                  setShowContactSuggestions(false);
                }, 300);
              },
              style: {
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                outline: 'none'
              }
            }),
            
            // Contact suggestions dropdown
            showContactSuggestions && contactSuggestions.length > 0 && h('div', {
              style: {
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 41, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(201, 169, 98, 0.2)',
                borderRadius: '12px',
                marginTop: '4px',
                maxHeight: '320px',
                overflowY: 'auto',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                zIndex: 1001
              }
            },
              contactSuggestions.map((contact, i) =>
                h('div', {
                  key: i,
                  onClick: () => selectContact(contact),
                  style: {
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: i < contactSuggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    transition: 'all 0.2s'
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.background = 'rgba(201, 169, 98, 0.1)';
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.background = 'transparent';
                  }
                },
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                    // Icon
                    h('div', {
                      style: {
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: contact.type === 'crm' ? 'rgba(201, 169, 98, 0.2)' : 'rgba(102, 126, 234, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }
                    }, contact.type === 'crm' ? '👤' : '🏢'),
                    
                    // Contact info
                    h('div', { style: { flex: 1 } },
                      h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginBottom: '2px' } }, contact.name),
                      h('div', { style: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' } }, contact.email),
                      contact.company && h('div', { style: { fontSize: '11px', color: '#C9A962', marginTop: '2px' } }, `🏢 ${contact.company}`)
                    ),
                    
                    // Badge
                    h('div', {
                      style: {
                        fontSize: '10px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: contact.type === 'crm' ? 'rgba(201, 169, 98, 0.15)' : 'rgba(102, 126, 234, 0.15)',
                        color: contact.type === 'crm' ? '#C9A962' : '#667eea',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }
                    }, contact.type === 'crm' ? 'CRM' : 'TEAM')
                  )
                )
              ),
              
              // Loading indicator
              loadingContacts && h('div', {
                style: {
                  padding: '12px 16px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '13px'
                }
              }, '🔍 Searching contacts...')
            )
          ),
          
          h('div', { style: { marginBottom: '16px' } },
            h('label', {
              style: {
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }
            }, 'Subject'),
            h('input', {
              type: 'text',
              placeholder: 'Enter email subject',
              value: subject,
              onChange: (e) => setSubject(e.target.value),
              style: {
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                outline: 'none'
              },
              onFocus: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)';
              },
              onBlur: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }
            })
          ),
          
          // MESSAGE SECTION - No bottom margin for tight layout
          h('div', { style: { marginBottom: '0' } },
            h('label', {
              style: {
                display: 'block',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }
            }, 'Message'),
            
            // 🎨 CLEAN MESSAGE EDITOR - Fast & Beautiful
            h('div', {
              style: {
                position: 'relative',
                marginBottom: '20px'
              }
            },
              // Message textarea
              h('textarea', {
                placeholder: 'Write your message...',
                value: body,
                onChange: (e) => setBody(e.target.value),
                style: {
                  width: '100%',
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.06) 100%)',
                  border: '2px solid rgba(201, 169, 98, 0.25)',
                  borderRadius: '16px',
                  fontSize: '15.5px',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontFamily: 'inherit',
                  minHeight: '280px',
                  maxHeight: '450px',
                  resize: 'vertical',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  lineHeight: '1.8',
                  letterSpacing: '0.3px',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.15)'
                },
                onFocus: (e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.08) 100%)';
                  e.target.style.borderColor = 'rgba(201, 169, 98, 0.6)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(201, 169, 98, 0.12), inset 0 2px 12px rgba(0, 0, 0, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                },
                onBlur: (e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.06) 100%)';
                  e.target.style.borderColor = 'rgba(201, 169, 98, 0.25)';
                  e.target.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.15)';
                  e.target.style.transform = 'translateY(0)';
                }
              }),
              
              // Floating action buttons
              h('div', {
                style: {
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }
              },
                // Character count
                h('div', {
                  style: {
                    padding: '6px 14px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: body.length > 0 ? 'rgba(201, 169, 98, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                    border: '1px solid rgba(201, 169, 98, 0.2)'
                  }
                }, `${body.length} chars`),
                
                // Attach button
                h('label', {
                  style: {
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.25) 0%, rgba(139, 115, 85, 0.25) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(201, 169, 98, 0.6)',
                    borderRadius: '24px',
                    color: '#C9A962',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(201, 169, 98, 0.2)',
                    pointerEvents: 'all'
                  },
                  onMouseEnter: (e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(201, 169, 98, 0.35) 0%, rgba(139, 115, 85, 0.35) 100%)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(201, 169, 98, 0.35)';
                  },
                  onMouseLeave: (e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(201, 169, 98, 0.25) 0%, rgba(139, 115, 85, 0.25) 100%)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(201, 169, 98, 0.2)';
                  }
                },
                  '📎 Attach Files',
                  h('input', {
                    type: 'file',
                    multiple: true,
                    onChange: (e) => {
                      if (e.target.files.length > 0) {
                        alert(`✅ ${e.target.files.length} file(s) selected (upload coming soon!)`);
                      }
                    },
                    style: { display: 'none' }
                  })
                )
              )
            ),
            
            // 📎 ATTACHMENTS DISPLAY
            attachments.length > 0 && h('div', {
              style: {
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }
            },
              h('div', {
                style: {
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }
              }, `📎 ${attachments.length} Attachment${attachments.length > 1 ? 's' : ''}`),
              
              h('div', {
                style: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px'
                }
              },
                attachments.map((att, idx) =>
                  h('div', {
                    key: idx,
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(201, 169, 98, 0.1)',
                      border: '1px solid rgba(201, 169, 98, 0.2)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.8)'
                    }
                  },
                    att.preview && h('img', {
                      src: att.preview,
                      style: {
                        width: '32px',
                        height: '32px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }
                    }),
                    h('div', { style: { flex: 1 } },
                      h('div', { style: { fontWeight: '600', color: 'rgba(201, 169, 98, 0.9)' } }, att.name),
                      h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' } }, formatFileSize(att.size))
                    ),
                    h('button', {
                      onClick: () => removeAttachment(idx),
                      style: {
                        padding: '4px 8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        color: 'rgba(239, 68, 68, 0.9)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }
                    }, '✕')
                  )
                )
              )
            )
          ),
          
          // 🤖 AI COMPOSE ASSISTANT TOOLBAR
          h('div', {
            style: {
              marginTop: '16px',
              marginBottom: '24px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
              border: '1px solid rgba(147, 51, 234, 0.2)',
              borderRadius: '12px'
            }
          },
            h('button', {
              onClick: () => setShowAiTools(!showAiTools),
              disabled: aiProcessing,
              style: {
                width: '100%',
                padding: '10px 16px',
                background: showAiTools 
                  ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }
            }, showAiTools ? '🤖 Hide AI Tools' : '🤖 Show AI Tools'),
            
            showAiTools && h('div', { style: { marginTop: '12px' } },
              // GENERATE FROM PROMPT - Top priority feature
              h('div', {
                style: {
                  marginBottom: '16px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(79, 70, 229, 0.15) 100%)',
                  border: '2px solid rgba(147, 51, 234, 0.4)',
                  borderRadius: '12px'
                }
              },
                h('div', {
                  style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'rgba(147, 51, 234, 0.9)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }
                }, '✨ Generate Full Email from Prompt'),
                h('input', {
                  type: 'text',
                  placeholder: 'e.g., "Schedule meeting tomorrow about Q4 budget review"',
                  value: aiPrompt,
                  onChange: (e) => setAiPrompt(e.target.value),
                  onKeyPress: (e) => e.key === 'Enter' && !aiProcessing && handleGenerateFromPrompt(),
                  disabled: aiProcessing,
                  style: {
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    marginBottom: '10px'
                  }
                }),
                h('button', {
                  onClick: handleGenerateFromPrompt,
                  disabled: aiProcessing || !aiPrompt.trim(),
                  style: {
                    width: '100%',
                    padding: '12px 16px',
                    background: aiProcessing || !aiPrompt.trim()
                      ? 'rgba(147, 51, 234, 0.2)'
                      : 'linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: aiProcessing || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    opacity: aiProcessing || !aiPrompt.trim() ? 0.5 : 1,
                    boxShadow: aiProcessing || !aiPrompt.trim() ? 'none' : '0 4px 12px rgba(147, 51, 234, 0.3)'
                  }
                }, aiProcessing ? '⏳ Generating...' : '🚀 Generate Complete Email')
              ),
              
              // Divider
              h('div', {
                style: {
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.3) 50%, transparent 100%)',
                  marginBottom: '16px'
                }
              }),
              
              // Action buttons grid
              h('div', {
                style: {
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '10px'
                }
              }, '✏️ Enhance Existing Text'),
              h('div', {
                style: {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px'
                }
              },
              // Improve button
              h('button', {
                onClick: () => handleAIAssist('improve', 'professional'),
                disabled: aiProcessing,
                style: {
                  padding: '10px 14px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(34, 197, 94, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: aiProcessing ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiProcessing ? 0.5 : 1
                },
                onMouseEnter: (e) => !aiProcessing && (e.target.style.background = 'rgba(34, 197, 94, 0.2)'),
                onMouseLeave: (e) => (e.target.style.background = 'rgba(34, 197, 94, 0.1)')
              }, aiProcessing ? '⏳...' : '✨ Improve'),
              
              // Expand button
              h('button', {
                onClick: () => handleAIAssist('expand', 'professional'),
                disabled: aiProcessing,
                style: {
                  padding: '10px 14px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(59, 130, 246, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: aiProcessing ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiProcessing ? 0.5 : 1
                },
                onMouseEnter: (e) => !aiProcessing && (e.target.style.background = 'rgba(59, 130, 246, 0.2)'),
                onMouseLeave: (e) => (e.target.style.background = 'rgba(59, 130, 246, 0.1)')
              }, aiProcessing ? '⏳...' : '📝 Expand'),
              
              // Summarize button
              h('button', {
                onClick: () => handleAIAssist('summarize', 'professional'),
                disabled: aiProcessing,
                style: {
                  padding: '10px 14px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(251, 191, 36, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: aiProcessing ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiProcessing ? 0.5 : 1
                },
                onMouseEnter: (e) => !aiProcessing && (e.target.style.background = 'rgba(251, 191, 36, 0.2)'),
                onMouseLeave: (e) => (e.target.style.background = 'rgba(251, 191, 36, 0.1)')
              }, aiProcessing ? '⏳...' : '📊 Shorten'),
              
              // Friendly tone button
              h('button', {
                onClick: () => handleAIAssist('improve', 'friendly'),
                disabled: aiProcessing,
                style: {
                  padding: '10px 14px',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(236, 72, 153, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: aiProcessing ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiProcessing ? 0.5 : 1
                },
                onMouseEnter: (e) => !aiProcessing && (e.target.style.background = 'rgba(236, 72, 153, 0.2)'),
                onMouseLeave: (e) => (e.target.style.background = 'rgba(236, 72, 153, 0.1)')
              }, aiProcessing ? '⏳...' : '😊 Friendly'),
              
              // Formal tone button
              h('button', {
                onClick: () => handleAIAssist('improve', 'formal'),
                disabled: aiProcessing,
                style: {
                  padding: '10px 14px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(139, 92, 246, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: aiProcessing ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiProcessing ? 0.5 : 1
                },
                onMouseEnter: (e) => !aiProcessing && (e.target.style.background = 'rgba(139, 92, 246, 0.2)'),
                onMouseLeave: (e) => (e.target.style.background = 'rgba(139, 92, 246, 0.1)')
              }, aiProcessing ? '⏳...' : '👔 Formal'),
              
              // Casual button
              h('button', {
                onClick: () => handleAIAssist('improve', 'casual'),
                disabled: aiProcessing,
                style: {
                  padding: '10px 14px',
                  background: 'rgba(20, 184, 166, 0.1)',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(20, 184, 166, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: aiProcessing ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiProcessing ? 0.5 : 1
                },
                onMouseEnter: (e) => !aiProcessing && (e.target.style.background = 'rgba(20, 184, 166, 0.2)'),
                onMouseLeave: (e) => (e.target.style.background = 'rgba(20, 184, 166, 0.1)')
              }, aiProcessing ? '⏳...' : '👋 Casual')
              )
            )
          ),
          
          // Spam Score Indicator
          (subject || body) && h('div', {
            style: {
              marginTop: '20px',
              marginBottom: '20px',
              padding: '16px 20px',
              background: spamCheck 
                ? spamCheck.level === 'safe' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : spamCheck.level === 'warning' 
                    ? 'rgba(251, 191, 36, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
              border: spamCheck 
                ? `1px solid ${spamCheck.level === 'safe' 
                  ? 'rgba(34, 197, 94, 0.3)' 
                  : spamCheck.level === 'warning' 
                    ? 'rgba(251, 191, 36, 0.3)' 
                    : 'rgba(239, 68, 68, 0.3)'}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              transition: 'all 0.3s'
            }
          },
            h('div', { 
              style: { 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: spamCheck && spamCheck.issues.length > 0 ? '12px' : '0'
              } 
            },
              h('div', { 
                style: { 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                } 
              },
                h('div', { 
                  style: { 
                    fontSize: '20px' 
                  } 
                }, checkingSpam ? '⏳' : spamCheck 
                  ? spamCheck.level === 'safe' ? '✅' 
                  : spamCheck.level === 'warning' ? '⚠️' 
                  : '🚫' 
                  : '🔍'),
                h('div', { style: { flex: 1 } },
                  h('div', { 
                    style: { 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: spamCheck 
                        ? spamCheck.level === 'safe' ? '#22c55e' 
                        : spamCheck.level === 'warning' ? '#fbbf24' 
                        : '#ef4444'
                        : 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '4px'
                    } 
                  }, checkingSpam ? 'Checking spam score...' : spamCheck 
                    ? spamCheck.level === 'safe' ? '✅ Low Spam Risk' 
                    : spamCheck.level === 'warning' ? '⚠️ Moderate Spam Risk' 
                    : '🚫 High Spam Risk - Will be blocked'
                    : '🔍 Spam Checker Active'),
                  spamCheck && h('div', { 
                    style: { 
                      fontSize: '12px', 
                      color: 'rgba(255, 255, 255, 0.5)' 
                    } 
                  }, `Score: ${spamCheck.score}/100 • ${spamCheck.issues.length} ${spamCheck.issues.length === 1 ? 'issue' : 'issues'} detected`)
                )
              ),
              spamCheck && h('div', {
                style: {
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: spamCheck.level === 'safe' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : spamCheck.level === 'warning' 
                      ? 'rgba(251, 191, 36, 0.2)' 
                      : 'rgba(239, 68, 68, 0.2)',
                  color: spamCheck.level === 'safe' ? '#22c55e' 
                    : spamCheck.level === 'warning' ? '#fbbf24' 
                    : '#ef4444'
                }
              }, spamCheck.score.toString())
            ),
            
            // Show top 3 issues
            spamCheck && spamCheck.issues.length > 0 && h('div', {
              style: {
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }
            },
              h('div', {
                style: {
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }
              }, `Top ${Math.min(3, spamCheck.issues.length)} Issues:`),
              ...spamCheck.issues.slice(0, 3).map((issue, idx) =>
                h('div', {
                  key: idx,
                  style: {
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '6px',
                    paddingLeft: '12px',
                    position: 'relative'
                  }
                },
                  h('span', {
                    style: {
                      position: 'absolute',
                      left: '0',
                      color: issue.severity === 'high' ? '#ef4444' 
                        : issue.severity === 'medium' ? '#fbbf24' 
                        : '#94a3b8'
                    }
                  }, '•'),
                  ` ${issue.message}`
                )
              ),
              spamCheck.issues.length > 3 && h('div', {
                style: {
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }
              }, `+ ${spamCheck.issues.length - 3} more issues`)
            )
          ),
          
          // Attach from File Bank Button
          h('div', { style: { marginBottom: '16px' } },
            h('button', {
              onClick: () => setShowFilePicker(true),
              style: {
                padding: '12px 20px',
                background: 'rgba(201, 169, 98, 0.1)',
                border: '1px solid rgba(201, 169, 98, 0.3)',
                borderRadius: '10px',
                color: '#C9A962',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(201, 169, 98, 0.15)';
                e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(201, 169, 98, 0.1)';
                e.target.style.borderColor = 'rgba(201, 169, 98, 0.3)';
              }
            }, '📁 Attach from File Bank')
          ),
          
          h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
            h('button', {
              onClick: onClose,
              style: {
                padding: '14px 24px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }, 'Cancel'),
            h('button', {
              onClick: handleSend,
              style: {
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: '0 8px 24px rgba(201, 169, 98, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              },
              onMouseEnter: (e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(201, 169, 98, 0.5)';
              },
              onMouseLeave: (e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(201, 169, 98, 0.4)';
              }
            }, '🚀 Send Email')
          )
        )
      );
    }
    
    // Email Viewer Modal Component
    function EmailViewerModal({ email, onClose, onShowCollab, view, showCollabPanel }) {
      console.log('📧 EmailViewerModal rendering with email:', email);
      
      // Safety check
      if (!email) {
        console.error('❌ EmailViewerModal: No email provided!');
        return null;
      }
      
      // Local state for reply/forward and thread
      const [showReply, setShowReply] = useState(false);
      const [showForward, setShowForward] = useState(false);
      const [replyBody, setReplyBody] = useState('');
      const [forwardTo, setForwardTo] = useState('');
      const [forwardBody, setForwardBody] = useState('');
      const [sending, setSending] = useState(false);
      const [threadEmails, setThreadEmails] = useState([email]); // Start with current email
      const [loadingThread, setLoadingThread] = useState(false);
      const [aiProcessing, setAiProcessing] = useState(false);
      
      // Load full thread on mount
      useEffect(() => {
        if (email.thread_id) {
          loadThread();
        }
      }, [email.thread_id]);
      
      const loadThread = async () => {
        setLoadingThread(true);
        try {
          const response = await fetch(`/api/email/thread/${email.thread_id}`);
          const data = await response.json();
          if (data.success && data.emails) {
            setThreadEmails(data.emails);
            console.log('🧵 Thread loaded:', data.emails.length, 'messages');
          }
        } catch (err) {
          console.error('❌ Failed to load thread:', err);
        } finally {
          setLoadingThread(false);
        }
      };
      
      // AI Assist for reply - WITH FULL THREAD CONTEXT
      const handleReplyAIAssist = async (action, tone = 'professional') => {
        if (!replyBody.trim() && action !== 'expand') {
          alert('✍️ Please write some text first!');
          return;
        }
        
        setAiProcessing(true);
        try {
          // Build full conversation context for AI
          const conversationContext = threadEmails
            .map((msg, idx) => {
              const sender = msg.from_email || 'Unknown';
              const date = new Date(msg.sent_at || msg.created_at).toLocaleString();
              const body = msg.body_text || msg.snippet || '';
              return `[Message ${idx + 1} from ${sender} at ${date}]:\n${body}`;
            })
            .join('\n\n---\n\n');
          
          const fullContext = `FULL CONVERSATION THREAD:\n${conversationContext}\n\n---\n\nCURRENT REPLY BEING WRITTEN:\n${replyBody}`;
          
          console.log('🤖 Sending AI assist request with full thread context');
          
          const response = await fetch('/api/email/compose-assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action,
              text: replyBody,
              tone,
              context: fullContext,
              subject: email.subject || 'Reply'
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            setReplyBody(data.text);
          } else {
            alert('❌ AI assist failed: ' + data.error);
          }
        } catch (error) {
          console.error('AI assist error:', error);
          alert('❌ AI error: ' + error.message);
        } finally {
          setAiProcessing(false);
        }
      };
      
      // Helper function for time remaining
      const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        return `${hours}h`;
      };
      
      const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (err) {
          console.error('❌ Date formatting error:', err);
          return 'Invalid date';
        }
      };
      
      return h('div', {
        onClick: onClose,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: showCollabPanel ? '400px' : 0,
          bottom: 0,
          background: showCollabPanel ? 'transparent' : 'rgba(0, 0, 0, 0.85)',
          backdropFilter: showCollabPanel ? 'none' : 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
          padding: '20px',
          pointerEvents: showCollabPanel ? 'none' : 'auto'
        }
      },
        h('div', {
          onClick: (e) => e.stopPropagation(),
          style: {
            background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 41, 0.98) 100%)',
            backdropFilter: 'blur(40px)',
            borderRadius: '24px',
            width: showCollabPanel ? 'calc(100vw - 480px)' : '900px',
            maxWidth: showCollabPanel ? 'calc(100vw - 480px)' : '95%',
            maxHeight: '90vh',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 169, 98, 0.1)',
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: 'auto',
            transition: 'all 0.3s ease'
          }
        },
          // Header
          h('div', {
            style: {
              padding: '24px 32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, rgba(139, 115, 85, 0.1) 100%)'
            }
          },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }
            },
              h('div', {
                style: {
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 8px 16px rgba(201, 169, 98, 0.3)'
                }
              }, '📧'),
              h('div', {},
                h('div', {
                  style: {
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.95)',
                    marginBottom: '4px'
                  }
                }, email.subject || '(No Subject)'),
                h('div', {
                  style: {
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }
                },
                  h('span', {}, `📨 ${view === 'sent' ? 'To' : 'From'}: ${view === 'sent' ? email.to_email : email.from_email}`),
                  h('span', {}, `📅 ${formatDate(email.sent_at || email.received_at || email.created_at)}`)
                )
              )
            ),
            h('div', {
              style: {
                display: 'flex',
                gap: '8px'
              }
            },
              h('button', {
                onClick: () => {
                  onClose();
                  onShowCollab();
                },
                style: {
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'rgba(201, 169, 98, 0.15)',
                  border: '1px solid rgba(201, 169, 98, 0.3)',
                  color: '#C9A962',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  e.target.style.background = 'rgba(201, 169, 98, 0.25)';
                },
                onMouseLeave: (e) => {
                  e.target.style.background = 'rgba(201, 169, 98, 0.15)';
                }
              }, '👥 Team Collab'),
              h('button', {
                onClick: onClose,
                style: {
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                },
                onMouseLeave: (e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }, '✕')
            )
          ),
          
          // Email Content
          h('div', {
            style: {
              padding: '32px',
              overflowY: 'auto',
              flex: 1
            }
          },
            // Email metadata
            h('div', {
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '32px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }
            },
              h('div', {},
                h('div', {
                  style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px'
                  }
                }, view === 'sent' ? 'To' : 'From'),
                h('div', {
                  style: {
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500'
                  }
                }, view === 'sent' 
                  ? `${email.to_name || ''} <${email.to_email}>`.trim()
                  : `${email.from_name || ''} <${email.from_email}>`.trim()
                )
              ),
              h('div', {},
                h('div', {
                  style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px'
                  }
                }, 'Date'),
                h('div', {
                  style: {
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500'
                  }
                }, formatDate(email.sent_at || email.received_at || email.created_at))
              ),
              email.category && h('div', {},
                h('div', {
                  style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px'
                  }
                }, 'Category'),
                h('div', {
                  style: {
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: email.category === 'inbox' ? 'rgba(59, 130, 246, 0.15)'
                      : email.category === 'sent' ? 'rgba(34, 197, 94, 0.15)'
                      : email.category === 'spam' ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(156, 163, 175, 0.15)',
                    color: email.category === 'inbox' ? '#3b82f6'
                      : email.category === 'sent' ? '#22c55e'
                      : email.category === 'spam' ? '#ef4444'
                      : '#9ca3af'
                  }
                }, email.category.charAt(0).toUpperCase() + email.category.slice(1))
              ),
              email.priority !== undefined && h('div', {},
                h('div', {
                  style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px'
                  }
                }, 'Priority'),
                h('div', {
                  style: {
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500'
                  }
                }, email.priority === 2 ? '🔴 High' 
                  : email.priority === 1 ? '🟡 Medium' 
                  : '🟢 Normal')
              )
            ),
            
            // Thread View - Show all messages in conversation (Gmail-style)
            h('div', {
              style: {
                marginTop: '24px'
              }
            },
              h('div', {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }
              }, 
                '🧵 Conversation',
                threadEmails.length > 1 && h('span', {
                  style: {
                    background: 'rgba(201, 169, 98, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    color: '#C9A962'
                  }
                }, `${threadEmails.length} messages`)
              ),
              
              // Show all messages in thread
              threadEmails.map((msg, idx) =>
                h('div', {
                  key: msg.id,
                  style: {
                    marginBottom: idx < threadEmails.length - 1 ? '16px' : '0',
                    padding: '20px',
                    background: idx === threadEmails.length - 1 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: idx === threadEmails.length - 1
                      ? '1px solid rgba(59, 130, 246, 0.2)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative'
                  }
                },
                  // Message header
                  h('div', {
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }
                  },
                    h('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }
                    },
                      h('div', {
                        style: {
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          flexShrink: 0
                        }
                      }, msg.from_name ? msg.from_name.charAt(0).toUpperCase() : '📧'),
                      h('div', {},
                        h('div', {
                          style: {
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.9)'
                          }
                        }, msg.from_name || msg.from_email),
                        h('div', {
                          style: {
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.5)'
                          }
                        }, '→ ' + msg.to_email)
                      )
                    ),
                    h('div', {
                      style: {
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        textAlign: 'right'
                      }
                    }, formatDate(msg.sent_at || msg.received_at || msg.created_at))
                  ),
                  
                  // Message body
                  h('div', {
                    style: {
                      fontSize: '14px',
                      lineHeight: '1.7',
                      color: 'rgba(255, 255, 255, 0.85)',
                      whiteSpace: 'pre-wrap'
                    }
                  }, msg.body_text || msg.snippet || '(No content)'),
                  
                  // Latest message indicator
                  idx === threadEmails.length - 1 && h('div', {
                    style: {
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#3b82f6',
                      background: 'rgba(59, 130, 246, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }
                  }, '💬 Latest')
                )
              ),
              
              loadingThread && h('div', {
                style: {
                  textAlign: 'center',
                  padding: '20px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '13px'
                }
              }, '⏳ Loading thread...')
            ),
            
            // ⏳ INBOX = NOW Quick Expiry Selector (only if email has expiry data)
            (email.expiry_type !== undefined) && h('div', {
              style: {
                marginTop: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, rgba(139, 115, 85, 0.1) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(201, 169, 98, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }
            },
              h('div', {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(201, 169, 98, 0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }
              }, '⏳ Expiry Settings'),
              h('div', {
                style: {
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }
              },
                ['1h', '24h', '7d', '30d', 'keep'].map(expiry =>
                  h('button', {
                    key: expiry,
                    onClick: async () => {
                      try {
                        const response = await fetch(`/api/email/${email.id}/expiry`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ expiry_type: expiry })
                        });
                        if (response.ok) {
                          email.expiry_type = expiry;
                          alert(`✅ Expiry set to: ${expiry === 'keep' ? 'Keep forever' : expiry}`);
                        }
                      } catch (err) {
                        alert('❌ Failed to update expiry');
                      }
                    },
                    style: {
                      padding: '10px 20px',
                      borderRadius: '10px',
                      background: email.expiry_type === expiry
                        ? 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: email.expiry_type === expiry
                        ? '1px solid rgba(201, 169, 98, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: email.expiry_type === expiry
                        ? 'white'
                        : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    },
                    onMouseEnter: (e) => {
                      if (email.expiry_type !== expiry) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                      }
                    },
                    onMouseLeave: (e) => {
                      if (email.expiry_type !== expiry) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }
                  },
                    expiry === 'keep' ? '∞' : '⏳',
                    ' ',
                    expiry === 'keep' ? 'Keep Forever' : expiry.toUpperCase()
                  )
                )
              ),
              h('div', {
                style: {
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }
              }, email.expiry_type === 'keep' 
                ? '∞ This email will be kept forever' 
                : email.expires_at 
                  ? `⏳ Expires: ${getTimeRemaining(email.expires_at)}`
                  : '⏳ Expiry not set')
            ),
            
            // AI Summary (if available)
            email.ai_summary && h('div', {
              style: {
                marginTop: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }
            },
              h('div', {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(139, 92, 246, 0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }
              }, '✨ AI Summary'),
              h('div', {
                style: {
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'rgba(255, 255, 255, 0.8)'
                }
              }, email.ai_summary)
            ),
            
            // Action Items (if available)
            email.action_items && h('div', {
              style: {
                marginTop: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }
            },
              h('div', {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(34, 197, 94, 0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }
              }, '✅ Action Items'),
              h('div', {
                style: {
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'rgba(255, 255, 255, 0.8)'
                }
              }, email.action_items)
            )
          ),
          
          // Footer Actions
          h('div', {
            style: {
              padding: '20px 32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              background: 'rgba(0, 0, 0, 0.2)'
            }
          },
            h('button', {
              onClick: () => {
                setShowReply(!showReply);
                setShowForward(false);
              },
              style: {
                padding: '12px 24px',
                borderRadius: '10px',
                background: showReply ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.25)';
              },
              onMouseLeave: (e) => {
                if (!showReply) e.target.style.background = 'rgba(59, 130, 246, 0.15)';
              }
            }, '↩️ Reply'),
            h('button', {
              onClick: () => {
                setShowForward(!showForward);
                setShowReply(false);
                if (!showForward) {
                  // Pre-fill forward body
                  setForwardBody('\n\n---\nForwarded message:\nFrom: ' + email.from_email + '\nDate: ' + formatDate(email.sent_at || email.received_at) + '\nSubject: ' + (email.subject || 'No Subject') + '\n\n' + (email.body_text || email.snippet || ''));
                }
              },
              style: {
                padding: '12px 24px',
                borderRadius: '10px',
                background: showForward ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(34, 197, 94, 0.25)';
              },
              onMouseLeave: (e) => {
                if (!showForward) e.target.style.background = 'rgba(34, 197, 94, 0.15)';
              }
            }, '↪️ Forward'),
            h('button', {
              onClick: async () => {
                if (confirm('Are you sure you want to delete this email?')) {
                  try {
                    const response = await fetch(`/api/email/${email.id}`, {
                      method: 'DELETE'
                    });
                    if (response.ok) {
                      alert('✅ Email deleted successfully!');
                      onClose();
                      // Reload the email list
                      window.location.reload();
                    } else {
                      alert('❌ Failed to delete email');
                    }
                  } catch (err) {
                    console.error('Delete error:', err);
                    alert('❌ Error deleting email');
                  }
                }
              },
              style: {
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.25)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.15)';
              }
            }, '🗑️ Delete'),
            h('button', {
              onClick: () => createTaskFromEmail(email),
              style: {
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(201, 169, 98, 0.15)',
                border: '1px solid rgba(201, 169, 98, 0.3)',
                color: '#C9A962',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(201, 169, 98, 0.25)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(201, 169, 98, 0.15)';
              }
            }, '📝 Create Task')
          ),
          
          // Inline Reply Form (Gmail-style)
          showReply && h('div', {
            style: {
              padding: '24px 32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
              animation: 'slideUp 0.3s ease-out'
            }
          },
            h('div', {
              style: {
                marginBottom: '16px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }
            }, '📝 Reply to ' + email.from_email),
            h('textarea', {
              value: replyBody,
              onInput: (e) => setReplyBody(e.target.value),
              placeholder: 'Write your reply here...',
              style: {
                width: '100%',
                minHeight: '120px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit'
              }
            }),
            
            // AI Write Full Reply Button (prominent)
            h('div', {
              style: {
                marginTop: '16px',
                marginBottom: '12px'
              }
            },
              h('button', {
                onClick: async () => {
                  setAiProcessing(true);
                  try {
                    // Build full conversation context
                    const conversationContext = threadEmails
                      .map((msg, idx) => {
                        const sender = msg.from_email || 'Unknown';
                        const date = new Date(msg.sent_at || msg.created_at).toLocaleString();
                        const body = msg.body_text || msg.snippet || '';
                        return `[Message ${idx + 1} from ${sender} at ${date}]:\n${body}`;
                      })
                      .join('\n\n---\n\n');
                    
                    console.log('🤖 Generating full AI reply from thread context');
                    
                    const response = await fetch('/api/email/compose-assist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'generate_reply',
                        text: '',
                        tone: 'professional',
                        context: conversationContext,
                        subject: email.subject || 'Reply'
                      })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      setReplyBody(data.text);
                    } else {
                      alert('❌ AI generation failed: ' + data.error);
                    }
                  } catch (error) {
                    console.error('AI generation error:', error);
                    alert('❌ AI error: ' + error.message);
                  } finally {
                    setAiProcessing(false);
                  }
                },
                disabled: aiProcessing,
                style: {
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  background: aiProcessing 
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  color: '#a78bfa',
                  cursor: aiProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                },
                onMouseEnter: (e) => {
                  if (!aiProcessing) {
                    e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(59, 130, 246, 0.35) 100%)';
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.7)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.3)';
                  }
                },
                onMouseLeave: (e) => {
                  if (!aiProcessing) {
                    e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)';
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }
              }, 
                aiProcessing ? '⏳ Generating AI Reply...' : '🤖 Write Full Reply with AI'
              )
            ),
            
            // AI Assist Buttons (for editing)
            h('div', {
              style: {
                marginTop: '12px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }
            },
              h('div', {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(139, 92, 246, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginRight: '8px'
                }
              }, '✨ Or Edit:'),
              h('button', {
                onClick: () => handleReplyAIAssist('improve', 'professional'),
                disabled: aiProcessing,
                style: {
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: aiProcessing ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#a78bfa',
                  cursor: aiProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(139, 92, 246, 0.25)';
                },
                onMouseLeave: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(139, 92, 246, 0.15)';
                }
              }, aiProcessing ? '⏳' : '✨ Improve'),
              h('button', {
                onClick: () => handleReplyAIAssist('shorten'),
                disabled: aiProcessing,
                style: {
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: aiProcessing ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  cursor: aiProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(59, 130, 246, 0.25)';
                },
                onMouseLeave: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                }
              }, aiProcessing ? '⏳' : '📏 Shorten'),
              h('button', {
                onClick: () => handleReplyAIAssist('expand'),
                disabled: aiProcessing,
                style: {
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: aiProcessing ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                  cursor: aiProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(34, 197, 94, 0.25)';
                },
                onMouseLeave: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(34, 197, 94, 0.15)';
                }
              }, aiProcessing ? '⏳' : '📝 Expand'),
              h('button', {
                onClick: () => handleReplyAIAssist('fix'),
                disabled: aiProcessing,
                style: {
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: aiProcessing ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  color: '#fbbf24',
                  cursor: aiProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(251, 191, 36, 0.25)';
                },
                onMouseLeave: (e) => {
                  if (!aiProcessing) e.target.style.background = 'rgba(251, 191, 36, 0.15)';
                }
              }, aiProcessing ? '⏳' : '🔧 Fix Grammar')
            ),
            h('div', {
              style: {
                marginTop: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.5)',
                maxHeight: '200px',
                overflowY: 'auto'
              }
            },
              h('div', { style: { marginBottom: '8px', fontWeight: '600' } }, 'Original Message:'),
              h('div', {}, 'From: ' + email.from_email),
              h('div', {}, 'Date: ' + formatDate(email.sent_at || email.received_at)),
              h('div', {}, 'Subject: ' + (email.subject || 'No Subject')),
              h('div', { style: { marginTop: '12px', whiteSpace: 'pre-wrap' } }, email.body_text || email.snippet || '(No content)')
            ),
            h('div', {
              style: {
                marginTop: '16px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }
            },
              h('button', {
                onClick: () => setShowReply(false),
                style: {
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '13px'
                }
              }, 'Cancel'),
              h('button', {
                onClick: async () => {
                  if (!replyBody.trim()) {
                    alert('❌ Please write a reply');
                    return;
                  }
                  setSending(true);
                  try {
                    const response = await fetch('/api/email/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: email.from_email,
                        subject: 'Re: ' + (email.subject || 'No Subject'),
                        body: replyBody,
                        thread_id: email.thread_id
                      })
                    });
                    if (response.ok) {
                      alert('✅ Reply sent successfully!');
                      setShowReply(false);
                      setReplyBody('');
                      onClose();
                      window.location.reload();
                    } else {
                      alert('❌ Failed to send reply');
                    }
                  } catch (err) {
                    console.error('Reply error:', err);
                    alert('❌ Error sending reply');
                  } finally {
                    setSending(false);
                  }
                },
                disabled: sending,
                style: {
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: sending ? 'rgba(59, 130, 246, 0.3)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }
              }, sending ? '⏳ Sending...' : '📤 Send Reply')
            )
          ),
          
          // Inline Forward Form
          showForward && h('div', {
            style: {
              padding: '24px 32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
              animation: 'slideUp 0.3s ease-out'
            }
          },
            h('div', {
              style: {
                marginBottom: '16px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }
            }, '📨 Forward Message'),
            h('input', {
              type: 'email',
              value: forwardTo,
              onInput: (e) => setForwardTo(e.target.value),
              placeholder: 'To: recipient@example.com',
              style: {
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                marginBottom: '12px'
              }
            }),
            h('textarea', {
              value: forwardBody,
              onInput: (e) => setForwardBody(e.target.value),
              placeholder: 'Add a message (optional)...',
              style: {
                width: '100%',
                minHeight: '200px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit',
                whiteSpace: 'pre-wrap'
              }
            }),
            h('div', {
              style: {
                marginTop: '16px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }
            },
              h('button', {
                onClick: () => {
                  setShowForward(false);
                  setForwardTo('');
                  setForwardBody('');
                },
                style: {
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '13px'
                }
              }, 'Cancel'),
              h('button', {
                onClick: async () => {
                  if (!forwardTo.trim()) {
                    alert('❌ Please enter a recipient email');
                    return;
                  }
                  setSending(true);
                  try {
                    const response = await fetch('/api/email/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: forwardTo,
                        subject: 'Fwd: ' + (email.subject || 'No Subject'),
                        body: forwardBody
                      })
                    });
                    if (response.ok) {
                      alert('✅ Email forwarded successfully!');
                      setShowForward(false);
                      setForwardTo('');
                      setForwardBody('');
                      onClose();
                    } else {
                      alert('❌ Failed to forward email');
                    }
                  } catch (err) {
                    console.error('Forward error:', err);
                    alert('❌ Error forwarding email');
                  } finally {
                    setSending(false);
                  }
                },
                disabled: sending,
                style: {
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: sending ? 'rgba(34, 197, 94, 0.3)' : 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }
              }, sending ? '⏳ Sending...' : '📤 Forward Email')
            )
          )
        )
      );
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideInRight {
        from { 
          opacity: 0;
          transform: translateX(100%);
        }
        to { 
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(201, 169, 98, 0.3);
        borderRadius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(201, 169, 98, 0.5);
      }
      ::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
      
      /* Rich text editor styles */
      [contenteditable]:empty:before {
        content: attr(data-placeholder);
        color: rgba(255, 255, 255, 0.35);
        pointer-events: none;
      }
      [contenteditable] {
        word-wrap: break-word;
      }
      [contenteditable] b,
      [contenteditable] strong {
        font-weight: 700;
        color: rgba(255, 255, 255, 1);
      }
      [contenteditable] i,
      [contenteditable] em {
        font-style: italic;
        color: rgba(201, 169, 98, 1);
      }
      [contenteditable] u {
        text-decoration: underline;
        text-decoration-color: rgba(201, 169, 98, 0.7);
        text-decoration-thickness: 2px;
      }
      [contenteditable] a {
        color: rgba(59, 130, 246, 1);
        text-decoration: underline;
        cursor: pointer;
      }
      [contenteditable] a:hover {
        color: rgba(96, 165, 250, 1);
      }
      [contenteditable] ul,
      [contenteditable] ol {
        margin: 10px 0;
        padding-left: 28px;
      }
      [contenteditable] li {
        margin: 8px 0;
        color: rgba(255, 255, 255, 0.95);
      }
      [contenteditable] ul li::marker {
        color: rgba(201, 169, 98, 0.9);
      }
      [contenteditable] ol li::marker {
        color: rgba(201, 169, 98, 0.9);
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
    
    console.log('🎨 Rendering Ultra Premium EmailApp...');
    const root = ReactDOM.createRoot(document.getElementById('email-root'));
    root.render(h(EmailApp));
    console.log('✨ Premium Email System Loaded!');
  }
  
  initApp();
});
