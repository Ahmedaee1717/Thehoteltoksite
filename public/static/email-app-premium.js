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
      
      // Sending state - prevents duplicate sends and shows animation
      const [sendingEmail, setSendingEmail] = useState(false);
      const [sendStatus, setSendStatus] = useState(null); // null, 'sending', 'success', 'error', 'warning'
      
      // User profile state
      const [userProfile, setUserProfile] = useState({ displayName: user.split('@')[0], profileImage: null });
      const [showProfileModal, setShowProfileModal] = useState(false);
      
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
      const [composeAttachments, setComposeAttachments] = useState([]); // Attachments for compose modal
      const [isDragging, setIsDragging] = useState(false);
      const [showCreateFolder, setShowCreateFolder] = useState(false);
      const [newFolderName, setNewFolderName] = useState('');
      const [newFolderIsShared, setNewFolderIsShared] = useState(false);
      const [currentFolder, setCurrentFolder] = useState(null);
      
      // Forwarding state
      const [forwardingRules, setForwardingRules] = useState([]);
      const [showCreateRule, setShowCreateRule] = useState(false);
      const [newRuleForwardTo, setNewRuleForwardTo] = useState('');
      const [newRuleMatchSender, setNewRuleMatchSender] = useState('');
      const [newRuleMatchSubject, setNewRuleMatchSubject] = useState('');
      const [newRuleKeepOriginal, setNewRuleKeepOriginal] = useState(true);
      const [newRuleAddPrefix, setNewRuleAddPrefix] = useState(true);
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
      
      // Shared Mailbox state
      const [sharedMailboxes, setSharedMailboxes] = useState([]);
      const [currentMailbox, setCurrentMailbox] = useState(null); // null = personal, else shared mailbox
      const [sharedMailboxMembers, setSharedMailboxMembers] = useState([]);
      const [sharedDrafts, setSharedDrafts] = useState([]);
      const [activeUsers, setActiveUsers] = useState([]);
      const [showAdminPanel, setShowAdminPanel] = useState(false);
      const [showAddMember, setShowAddMember] = useState(false);
      const [newMemberEmail, setNewMemberEmail] = useState('');
      const [newMemberRole, setNewMemberRole] = useState('member');
      const [mailboxActivity, setMailboxActivity] = useState([]);
      
      // Read Receipts state (for shared mailboxes)
      const [readReceipts, setReadReceipts] = useState({}); // { emailId: [readers] }
      
      // World Clock state
      const [currentTime, setCurrentTime] = useState(new Date());
      
      // Update clock every second
      useEffect(() => {
        const timer = setInterval(() => {
          setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
      }, []);
      
      useEffect(() => {
        loadData();
      }, [view]);
      
      // Load shared mailboxes once on mount
      useEffect(() => {
        loadSharedMailboxes();
      }, []);
      
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
          
          // If in shared mailbox mode, load shared mailbox emails
          if (currentMailbox) {
            if (view === 'inbox') url = `/api/shared-mailboxes/${currentMailbox.id}/emails?folder=inbox`;
            else if (view === 'sent') url = `/api/shared-mailboxes/${currentMailbox.id}/emails?folder=sent`;
            else if (view === 'spam') url = `/api/shared-mailboxes/${currentMailbox.id}/emails?folder=spam`;
            else if (view === 'trash') url = `/api/shared-mailboxes/${currentMailbox.id}/emails?folder=trash`;
            else if (view === 'drafts') url = `/api/shared-mailboxes/${currentMailbox.id}/drafts`;
            else if (view === 'archived') url = `/api/shared-mailboxes/${currentMailbox.id}/emails?folder=archived`;
          } else {
            // Personal mailbox
            if (view === 'inbox') url = `/api/email/inbox`;
            else if (view === 'sent') url = `/api/email/sent`;
            else if (view === 'spam') url = `/api/email/spam`;
            else if (view === 'trash') url = `/api/email/trash`;
            else if (view === 'drafts') url = `/api/email/drafts`;
            else if (view === 'archived') url = `/api/email/archived`;
          }
          
          if (url) {
            console.log('📬 Loading emails from:', url);
            const response = await fetch(url);
            const data = await response.json();
            const fetchedEmails = data.emails || data.drafts || [];
            setEmails(fetchedEmails);
            console.log(`📬 Loaded ${fetchedEmails.length} emails`);
            
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
            
            // Load read receipts for shared mailbox
            if (currentMailbox && fetchedEmails.length > 0) {
              const emailIds = fetchedEmails.map(e => e.id);
              loadReadReceipts(currentMailbox.id, emailIds);
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
      
      // Load user profile
      const loadUserProfile = async () => {
        try {
          const response = await fetch('/api/auth/profile');
          const data = await response.json();
          if (data.success) {
            setUserProfile({
              displayName: data.user.displayName,
              profileImage: data.user.profileImage
            });
          }
        } catch (error) {
          console.error('Load profile error:', error);
        }
      };
      
      // Load forwarding rules
      const loadForwardingRules = async () => {
        try {
          const response = await fetch('/api/forwarding/rules');
          const data = await response.json();
          if (data.success) {
            setForwardingRules(data.rules || []);
            console.log('📨 Loaded forwarding rules:', data.rules.length);
          }
        } catch (error) {
          console.error('Load forwarding rules error:', error);
        }
      };
      
      // Load FileBank files (for attachment picker)
      const loadFileBankFiles = async () => {
        try {
          console.log('📂 Loading FileBank files for attachment picker...');
          const res = await fetch(`/api/filebank/files?userEmail=${user}`);
          const data = await res.json();
          console.log('📂 FileBank files loaded:', data.files?.length || 0);
          setFiles(data.files || []);
        } catch (err) {
          console.error('❌ Failed to load FileBank files:', err);
          setFiles([]);
        }
      };
      
      // ===== SHARED MAILBOX FUNCTIONS =====
      
      // Load shared mailboxes user has access to
      const loadSharedMailboxes = async () => {
        try {
          console.log('📬 Loading shared mailboxes...');
          const response = await fetch('/api/shared-mailboxes');
          console.log('📬 Response status:', response.status);
          const data = await response.json();
          console.log('📬 Response data:', data);
          setSharedMailboxes(data.mailboxes || []);
          console.log('📬 Loaded shared mailboxes:', data.mailboxes?.length || 0);
        } catch (error) {
          console.error('❌ Load shared mailboxes error:', error);
        }
      };
      
      // Switch to a shared mailbox
      const switchToMailbox = async (mailbox) => {
        setCurrentMailbox(mailbox);
        console.log('📬 Switched to mailbox:', mailbox ? mailbox.display_name : 'Personal');
        
        if (mailbox) {
          // Load mailbox details
          loadMailboxDetails(mailbox.id);
          // Update presence
          updatePresence(mailbox.id, 'viewing');
          // Start presence polling
          startPresencePolling(mailbox.id);
        } else {
          // Switched back to personal
          stopPresencePolling();
        }
        
        // Reset to inbox view and reload emails
        setView('inbox');
        setShowSearchResults(false);
        loadData();
      };
      
      // Load mailbox details (members, drafts, activity)
      const loadMailboxDetails = async (mailboxId) => {
        try {
          const [detailsRes, membersRes, draftsRes, activityRes] = await Promise.all([
            fetch(`/api/shared-mailboxes/${mailboxId}`),
            fetch(`/api/shared-mailboxes/${mailboxId}/members`),
            fetch(`/api/shared-mailboxes/${mailboxId}/drafts`),
            fetch(`/api/shared-mailboxes/${mailboxId}/activity?limit=20`)
          ]);
          
          const details = await detailsRes.json();
          const members = await membersRes.json();
          const drafts = await draftsRes.json();
          const activity = await activityRes.json();
          
          setSharedMailboxMembers(members.members || []);
          setSharedDrafts(drafts.drafts || []);
          setMailboxActivity(activity.activities || []);
          
          console.log('📬 Loaded mailbox details:', {
            members: members.members?.length || 0,
            drafts: drafts.drafts?.length || 0,
            activities: activity.activities?.length || 0
          });
        } catch (error) {
          console.error('Load mailbox details error:', error);
        }
      };
      
      // Update user presence in shared mailbox
      const updatePresence = async (mailboxId, status, draftId = null) => {
        try {
          const sessionId = localStorage.getItem('session_id') || generateSessionId();
          await fetch(`/api/shared-mailboxes/${mailboxId}/presence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status,
              current_draft_id: draftId,
              session_id: sessionId
            })
          });
        } catch (error) {
          console.error('Update presence error:', error);
        }
      };
      
      // Generate session ID
      const generateSessionId = () => {
        const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('session_id', id);
        return id;
      };
      
      // Poll for active users (real-time presence)
      let presenceInterval = null;
      const startPresencePolling = (mailboxId) => {
        stopPresencePolling();
        
        const pollPresence = async () => {
          try {
            const response = await fetch(`/api/shared-mailboxes/${mailboxId}/presence`);
            const data = await response.json();
            setActiveUsers(data.activeUsers || []);
          } catch (error) {
            console.error('Presence poll error:', error);
          }
        };
        
        pollPresence(); // Initial load
        presenceInterval = setInterval(pollPresence, 5000); // Poll every 5 seconds
      };
      
      const stopPresencePolling = () => {
        if (presenceInterval) {
          clearInterval(presenceInterval);
          presenceInterval = null;
        }
      };
      
      // Add member to shared mailbox
      const addMemberToMailbox = async (mailboxId, memberEmail, role) => {
        try {
          const response = await fetch(`/api/shared-mailboxes/${mailboxId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_email: memberEmail,
              role: role || 'member',
              permissions: ['view', 'send']
            })
          });
          
          const data = await response.json();
          if (data.success) {
            alert('✅ Member added successfully!');
            loadMailboxDetails(mailboxId);
            setShowAddMember(false);
            setNewMemberEmail('');
          } else {
            alert('❌ Failed to add member: ' + (data.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Add member error:', error);
          alert('❌ Failed to add member');
        }
      };
      
      // Remove member from shared mailbox
      const removeMemberFromMailbox = async (mailboxId, memberEmail) => {
        if (!confirm(`Remove ${memberEmail} from this shared mailbox?`)) return;
        
        try {
          const response = await fetch(`/api/shared-mailboxes/${mailboxId}/members/${encodeURIComponent(memberEmail)}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          if (data.success) {
            alert('✅ Member removed successfully!');
            loadMailboxDetails(mailboxId);
          } else {
            alert('❌ Failed to remove member');
          }
        } catch (error) {
          console.error('Remove member error:', error);
          alert('❌ Failed to remove member');
        }
      };
      
      // Handle adding attachment (called from global FilePicker)
      const handleAddAttachment = (file) => {
        // Determine if this is a FileBank file or a computer upload
        // FileBank files have: id (number), file_url, file_size (from DB)
        // Computer uploads have: file (File object), isLocalFile: true
        const isFileBank = file.file_url || (file.id && !file.isLocalFile);
        
        const normalizedFile = {
          id: file.id,
          name: file.filename || file.name,
          filename: file.filename || file.name,
          size: file.size || file.file_size,
          content_type: file.content_type || file.file_type,
          url: file.url || file.file_url,
          preview: file.preview || null,
          isLocalFile: !isFileBank, // Set based on detection
          file: file.file || null // Keep File object for computer uploads
        };
        
        setComposeAttachments(prev => [...prev, normalizedFile]);
        console.log('📎 Added attachment:', file.filename || file.name, 'isLocalFile:', !isFileBank, 'hasFileObject:', !!file.file);
        setShowFilePicker(false);
      };
      
      // Handle removing attachment
      const handleRemoveAttachment = (index) => {
        setComposeAttachments(prev => prev.filter((_, i) => i !== index));
        console.log('📎 Removed attachment at index:', index);
      };
      
      // Clear attachments when compose closes
      const handleCloseCompose = () => {
        setShowCompose(false);
        setComposeAttachments([]);
      };
      
      // Create new forwarding rule
      const createForwardingRule = async () => {
        if (!newRuleForwardTo.trim() || !newRuleForwardTo.includes('@')) {
          alert('❌ Please enter a valid email address!');
          return;
        }
        
        try {
          const response = await fetch('/api/forwarding/rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              forward_to: newRuleForwardTo,
              match_sender: newRuleMatchSender || null,
              match_subject: newRuleMatchSubject || null,
              keep_original: newRuleKeepOriginal ? 1 : 0,
              add_prefix: newRuleAddPrefix ? 1 : 0
            })
          });
          
          const data = await response.json();
          if (data.success) {
            alert('✅ Forwarding rule created!');
            setShowCreateRule(false);
            setNewRuleForwardTo('');
            setNewRuleMatchSender('');
            setNewRuleMatchSubject('');
            loadForwardingRules();
          } else {
            alert('❌ Failed to create rule: ' + data.error);
          }
        } catch (error) {
          console.error('Create rule error:', error);
          alert('❌ Error creating rule');
        }
      };
      
      // Toggle rule enabled/disabled
      const toggleRule = async (ruleId, currentEnabled) => {
        try {
          const response = await fetch(`/api/forwarding/rules/${ruleId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_enabled: currentEnabled ? 0 : 1 })
          });
          
          if (response.ok) {
            loadForwardingRules();
          }
        } catch (error) {
          console.error('Toggle rule error:', error);
        }
      };
      
      // Delete forwarding rule
      const deleteRule = async (ruleId) => {
        if (!confirm('🗑️ Delete this forwarding rule?')) return;
        
        try {
          const response = await fetch(`/api/forwarding/rules/${ruleId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            alert('✅ Rule deleted!');
            loadForwardingRules();
          }
        } catch (error) {
          console.error('Delete rule error:', error);
          alert('❌ Error deleting rule');
        }
      };
      
      // Load unread count on mount and when view changes
      useEffect(() => {
        loadUnreadCount();
        loadUserProfile(); // Load profile on mount
        if (view === 'forwarding') {
          loadForwardingRules(); // Load forwarding rules when viewing forwarding tab
        }
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
      
      const sendEmail = async (to, subject, body, attachments = []) => {
        // Prevent duplicate sends
        if (sendingEmail) {
          console.log('⚠️ Email send already in progress - ignoring duplicate click');
          return;
        }
        
        // Use shared mailbox email if in shared mailbox, otherwise use personal email
        const fromEmail = currentMailbox ? currentMailbox.email_address : user;
        console.log('📧 Sending from:', fromEmail, currentMailbox ? '(Shared Mailbox)' : '(Personal)');
        
        setSendingEmail(true);
        setSendStatus('sending');
        
        try {
          // Prepare attachment data for backend
          const attachmentData = [];
          
          for (const att of attachments) {
            if (att.isLocalFile && att.file) {
              // Computer upload: Read file as base64
              console.log(`📎 Reading computer file: ${att.filename} (${att.size} bytes)`);
              const reader = new FileReader();
              const base64Data = await new Promise((resolve, reject) => {
                reader.onload = () => {
                  const result = reader.result;
                  const base64 = result.split(',')[1]; // Get base64 without data: prefix
                  console.log(`📎 Base64 encoded: ${att.filename} - ${base64.length} chars`);
                  resolve(base64);
                };
                reader.onerror = (error) => {
                  console.error(`❌ FileReader error for ${att.filename}:`, error);
                  reject(error);
                };
                reader.readAsDataURL(att.file);
              });
              
              if (!base64Data || base64Data.length === 0) {
                console.error(`❌ Empty base64 data for ${att.filename}!`);
                continue; // Skip this attachment
              }
              
              attachmentData.push({
                filename: att.filename,
                content_type: att.content_type,
                size: att.size,
                data: base64Data, // Base64 string
                isLocalFile: true
              });
              console.log(`✅ Added to attachmentData: ${att.filename} (${base64Data.length} chars)`);
            } else {
              // FileBank file: Send ID for backend to fetch
              console.log(`📎 FileBank attachment: ${att.filename}, ID: ${att.id}`);
              attachmentData.push({
                id: att.id,
                filename: att.filename,
                url: att.url,
                size: att.size,
                content_type: att.content_type,
                isLocalFile: false
              });
            }
          }
          
          console.log(`📎 Sending email with ${attachments.length} attachments:`);
          console.log('📎 Attachment details:', JSON.stringify(attachmentData.map(a => ({
            filename: a.filename,
            isLocalFile: a.isLocalFile,
            hasData: !!a.data,
            dataLength: a.data?.length,
            hasId: !!a.id
          })), null, 2));
          
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              from: fromEmail, 
              to, 
              subject, 
              body, 
              useAI: true,
              attachments: attachmentData // ✅ Include attachments!
            })
          });
          
          console.log('📬 Response status:', response.status);
          console.log('📬 Response ok:', response.ok);
          
          const result = await response.json();
          console.log('📬 Response JSON:', JSON.stringify(result, null, 2));
          
          if (result.success && result.emailSent) {
            // Success animation
            setSendStatus('success');
            console.log('✅ Email sent successfully:', result.messageId);
            
            // Wait for animation to complete, then close
            setTimeout(() => {
              loadData();
              setShowCompose(false);
              setComposeAttachments([]); // Clear attachments
              setSendingEmail(false);
              setSendStatus(null);
            }, 2500); // 2.5 seconds for smooth animation
          } else if (result.success && !result.emailSent) {
            // Partial success
            setSendStatus('warning');
            console.warn('⚠️ Email saved but not sent:', result);
            setTimeout(() => {
              alert('⚠️ Email saved but not sent:\n\n' + (result.mailgunError || 'Check Mailgun configuration'));
              setSendingEmail(false);
              setSendStatus(null);
            }, 1500);
          } else {
            // Error
            setSendStatus('error');
            console.error('❌ Send failed with error:', result);
            console.error('❌ Error message:', result.error);
            console.error('❌ Error name:', result.errorName);
            console.error('❌ Error stack:', result.errorStack);
            setTimeout(() => {
              alert('❌ Failed to send:\n\n' + (result.error || 'Unknown error'));
              setSendingEmail(false);
              setSendStatus(null);
            }, 1500);
          }
        } catch (error) {
          setSendStatus('error');
          console.error('❌ Network/Parse error:', error);
          console.error('❌ Error name:', error.name);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error stack:', error.stack);
          setTimeout(() => {
            alert('❌ Network error: ' + error.message);
            setSendingEmail(false);
            setSendStatus(null);
          }, 1500);
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
      
      // Load read receipts for shared mailbox emails
      const loadReadReceipts = async (mailboxId, emailIds) => {
        try {
          console.log('📊 Loading read receipts for', emailIds.length, 'emails');
          const response = await fetch(`/api/shared-mailboxes/${mailboxId}/emails/read-receipts?emailIds=${emailIds.join(',')}`);
          const data = await response.json();
          if (data.success) {
            setReadReceipts(data.receipts || {});
            console.log('📊 Loaded read receipts:', Object.keys(data.receipts || {}).length, 'emails have readers');
          }
        } catch (error) {
          console.error('Load read receipts error:', error);
        }
      };
      
      // Mark email as read in shared mailbox
      const markEmailAsRead = async (mailboxId, emailId) => {
        try {
          await fetch(`/api/shared-mailboxes/${mailboxId}/emails/${emailId}/read`, {
            method: 'POST'
          });
          console.log('✓ Marked email', emailId, 'as read');
          // Reload read receipts for this email
          const response = await fetch(`/api/shared-mailboxes/${mailboxId}/emails/${emailId}/readers`);
          const data = await response.json();
          if (data.success) {
            setReadReceipts(prev => ({
              ...prev,
              [emailId]: data.readers
            }));
          }
        } catch (error) {
          console.error('Mark as read error:', error);
        }
      };
      
      const addComment = async () => {
        if (!newComment.trim() || !selectedEmail) return;
        try {
          // Fetch user profile to get actual display name
          const profileRes = await fetch('/api/auth/profile');
          const profileData = await profileRes.json();
          const displayName = profileData.success ? profileData.user.displayName : user.split('@')[0];
          
          const res = await fetch('/api/collaboration/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email_id: selectedEmail.id,
              thread_id: selectedEmail.thread_id, // 🔧 CRITICAL: Include thread_id for thread-based comments
              author_email: user,
              author_name: displayName, // 🔧 Use actual display name from profile
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
        { id: 'forwarding', icon: '⚡', label: 'Forwarding', gradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }
                },
                  // Main brand name
                  h('div', { 
                    style: { 
                      fontSize: '19px', 
                      fontWeight: '800',
                      color: '#FFFFFF',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      lineHeight: '1.2'
                    } 
                  }, 'INVESTAYCAPITAL'),
                  // Tagline
                  h('div', { 
                    style: { 
                      fontSize: '10px', 
                      color: 'rgba(201, 169, 98, 0.85)',
                      fontWeight: '600',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      borderTop: '1px solid rgba(201, 169, 98, 0.3)',
                      paddingTop: '6px',
                      marginTop: '2px'
                    } 
                  }, 'Internal Email System')
                )
              )
            ),
            
            // 📬 PREMIUM MAILBOX DROPDOWN - IMPRESSIVE DESIGN
            sharedMailboxes && sharedMailboxes.length > 0 && h('div', {
              style: {
                padding: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                marginBottom: '16px'
              }
            },
              // Section Header with Status
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
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }
                }, '📬 Mailbox'),
                currentMailbox && h('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#22c55e',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }
                },
                  h('div', {
                    style: {
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
                      animation: 'pulse 2s infinite'
                    }
                  }),
                  'Collaborative Mode'
                )
              ),
              
              // Premium Dropdown Container
              h('div', {
                style: {
                  position: 'relative'
                }
              },
                // Custom Dropdown
                h('select', {
                  value: currentMailbox ? currentMailbox.id : 'personal',
                  onChange: (e) => {
                    const mailboxId = e.target.value;
                    if (mailboxId === 'personal') {
                      switchToMailbox(null);
                    } else {
                      const mailbox = sharedMailboxes.find(m => m.id === parseInt(mailboxId));
                      switchToMailbox(mailbox);
                    }
                  },
                  style: {
                    width: '100%',
                    padding: '16px 18px',
                    paddingRight: '45px',
                    background: currentMailbox 
                      ? 'linear-gradient(135deg, rgba(201, 169, 98, 0.15) 0%, rgba(139, 115, 85, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.08) 100%)',
                    border: currentMailbox
                      ? '2px solid rgba(201, 169, 98, 0.4)'
                      : '2px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    appearance: 'none',
                    outline: 'none',
                    boxShadow: currentMailbox
                      ? '0 4px 12px rgba(201, 169, 98, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
                      : '0 4px 12px rgba(59, 130, 246, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }
                },
                  h('option', { 
                    value: 'personal',
                    style: {
                      background: '#1a1f3a',
                      color: '#fff',
                      padding: '12px'
                    }
                  }, `👤 Personal — ${user}`),
                  
                  h('optgroup', {
                    label: '━━━━━━ Shared Mailboxes ━━━━━━',
                    style: {
                      background: '#1a1f3a',
                      color: '#C9A962',
                      fontWeight: '700',
                      fontSize: '11px'
                    }
                  }),
                  
                  sharedMailboxes.map(mailbox =>
                    h('option', { 
                      key: mailbox.id, 
                      value: mailbox.id,
                      style: {
                        background: '#1a1f3a',
                        color: '#fff',
                        padding: '12px'
                      }
                    }, `📬 ${mailbox.display_name} — ${mailbox.email_address}`)
                  )
                ),
                
                // Custom Dropdown Arrow
                h('div', {
                  style: {
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }
                },
                  // Arrow Icon
                  h('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 14 14',
                    fill: 'none',
                    style: {
                      transition: 'transform 0.3s'
                    }
                  },
                    h('path', {
                      d: 'M3 5L7 9L11 5',
                      stroke: currentMailbox ? '#C9A962' : '#3b82f6',
                      strokeWidth: '2.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round'
                    })
                  )
                )
              ),
              
              // Live Collaboration Status (when in shared mailbox)
              currentMailbox && h('div', {
                style: {
                  marginTop: '12px',
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.08) 0%, rgba(139, 115, 85, 0.05) 100%)',
                  border: '1px solid rgba(201, 169, 98, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }
              },
                // Collaboration Icon
                h('div', {
                  style: {
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.25) 0%, rgba(139, 115, 85, 0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0
                  }
                }, '👥'),
                
                // User Info
                h('div', {
                  style: {
                    flex: 1,
                    minWidth: 0
                  }
                },
                  h('div', {
                    style: {
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#C9A962',
                      marginBottom: '2px'
                    }
                  }, 'Team Collaboration'),
                  h('div', {
                    style: {
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }, activeUsers.length > 0 ? `${activeUsers.length} member${activeUsers.length !== 1 ? 's' : ''} active` : 'No active members')
                ),
                
                // Active User Avatars
                activeUsers.length > 0 && h('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'center'
                  }
                },
                  activeUsers.slice(0, 3).map((user, idx) =>
                    h('div', {
                      key: idx,
                      title: user.user_email,
                      style: {
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx % 4]} 0%, ${['#2563eb', '#059669', '#d97706', '#dc2626'][idx % 4]} 100%)`,
                        border: '2px solid rgba(26, 31, 58, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#fff',
                        marginLeft: idx > 0 ? '-10px' : '0',
                        zIndex: 10 - idx,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        animation: 'pulse 2s infinite',
                        animationDelay: `${idx * 0.2}s`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        position: 'relative'
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.transform = 'scale(1.15) translateY(-2px)';
                        e.currentTarget.style.zIndex = '20';
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.zIndex = String(10 - idx);
                      }
                    }, 
                      user.user_email?.[0]?.toUpperCase() || '?',
                      // Online indicator dot
                      h('div', {
                        style: {
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          border: '2px solid rgba(26, 31, 58, 0.95)',
                          boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)'
                        }
                      })
                    )
                  ),
                  activeUsers.length > 3 && h('div', {
                    style: {
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.3) 100%)',
                      border: '2px solid rgba(26, 31, 58, 0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#94a3b8',
                      marginLeft: '-10px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    }
                  }, `+${activeUsers.length - 3}`)
                )
              )
            ),
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
          
          // Logout Button
          h('div', {
            style: {
              padding: '12px 24px 20px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }
          },
            // User Profile Section
            h('div', {
              onClick: () => setShowProfileModal(true),
              style: {
                padding: '12px',
                background: 'rgba(201, 169, 98, 0.05)',
                border: '1px solid rgba(201, 169, 98, 0.2)',
                borderRadius: '10px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.background = 'rgba(201, 169, 98, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = 'rgba(201, 169, 98, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            },
              // Profile Image / Avatar
              h('div', {
                style: {
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: userProfile.profileImage 
                    ? `url(${userProfile.profileImage}) center/cover` 
                    : 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(201, 169, 98, 0.3)',
                  flexShrink: 0
                }
              }, !userProfile.profileImage && (userProfile.displayName || user.split('@')[0])[0].toUpperCase()),
              // User Info
              h('div', { style: { flex: 1, minWidth: 0 } },
                h('div', { 
                  style: { 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#C9A962',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  } 
                }, userProfile.displayName || user.split('@')[0]),
                h('div', { 
                  style: { 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px'
                  } 
                }, user)
              ),
              h('div', { style: { fontSize: '16px', color: 'rgba(201, 169, 98, 0.5)' } }, '⚙️')
            ),
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
          
          // 🏛️ EXECUTIVE HEADER - Professional & Chic Design
          h('div', {
            style: {
              background: 'linear-gradient(180deg, #0A0E1A 0%, #0F1419 100%)',
              borderBottom: '1px solid rgba(201, 169, 98, 0.12)',
              position: 'relative',
              zIndex: 10
            }
          },
            // Subtle Top Accent Line
            h('div', {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(201, 169, 98, 0.4) 50%, transparent 100%)'
              }
            }),
            
            // Main Header Content
            h('div', {
              style: {
                padding: '20px 48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '1800px',
                margin: '0 auto'
              }
            },
              // Left Section - Title & Stats (Minimalist)
              h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '20px'
                }
              },
                // Main Title - Clean & Bold
                h('h1', { 
                  style: { 
                    fontSize: '28px', 
                    fontWeight: '300',
                    margin: 0,
                    color: '#FFFFFF',
                    letterSpacing: '0.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  } 
                },
                  view === 'inbox' ? 'Inbox' :
                  view === 'sent' ? 'Sent' :
                  view === 'drafts' ? 'Drafts' :
                  view === 'spam' ? 'Spam' :
                  view === 'trash' ? 'Trash' :
                  view === 'archived' ? 'Archive' :
                  view === 'forwarding' ? 'Forwarding' :
                  'Mail'
                ),
                
                // Subtle Stats
                h('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }
                },
                  // Minimalist Email Count
                  h('div', {
                    style: {
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.35)',
                      fontWeight: '400',
                      letterSpacing: '0.3px'
                    }
                  }, showSearchResults ? `${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}` : `${emails.length} ${emails.length === 1 ? 'message' : 'messages'}`),
                  
                  // Shared Indicator - Minimal Dot
                  currentMailbox && h('div', {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: 'rgba(201, 169, 98, 0.7)',
                      fontWeight: '500',
                      letterSpacing: '0.5px'
                    }
                  },
                    h('div', {
                      style: {
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#C9A962',
                        boxShadow: '0 0 8px rgba(201, 169, 98, 0.5)'
                      }
                    }),
                    'Shared'
                  )
                )
              ),
              
              // Right Section - World Clock (Refined)
              h('div', {
                style: {
                  display: 'flex',
                  gap: '32px',
                  alignItems: 'center'
                }
              },
                // London
                h('div', {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px'
                  }
                },
                  h('div', {
                    style: {
                      fontSize: '9px',
                      fontWeight: '500',
                      color: 'rgba(255, 255, 255, 0.25)',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px'
                    }
                  }, 'London'),
                  h('div', {
                    style: {
                      fontSize: '14px',
                      fontWeight: '400',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'Monaco, "Courier New", monospace'
                    }
                  }, new Date(currentTime.toLocaleString('en-US', { timeZone: 'Europe/London' })).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
                ),
                
                // Cairo
                h('div', {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px'
                  }
                },
                  h('div', {
                    style: {
                      fontSize: '9px',
                      fontWeight: '500',
                      color: 'rgba(255, 255, 255, 0.25)',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px'
                    }
                  }, 'Cairo'),
                  h('div', {
                    style: {
                      fontSize: '14px',
                      fontWeight: '400',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'Monaco, "Courier New", monospace'
                    }
                  }, new Date(currentTime.toLocaleString('en-US', { timeZone: 'Africa/Cairo' })).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
                ),
                
                // Dubai
                h('div', {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px'
                  }
                },
                  h('div', {
                    style: {
                      fontSize: '9px',
                      fontWeight: '500',
                      color: 'rgba(255, 255, 255, 0.25)',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px'
                    }
                  }, 'Dubai'),
                  h('div', {
                    style: {
                      fontSize: '14px',
                      fontWeight: '400',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'Monaco, "Courier New", monospace'
                    }
                  }, new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Dubai' })).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
                ),
                
                // Vertical Divider
                h('div', { 
                  style: { 
                    width: '1px', 
                    height: '28px', 
                    background: 'rgba(255, 255, 255, 0.06)'
                  } 
                }),
                
                // Local Time - Emphasized
                h('div', {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px'
                  }
                },
                  h('div', {
                    style: {
                      fontSize: '9px',
                      fontWeight: '600',
                      color: 'rgba(201, 169, 98, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px'
                    }
                  }, 'Local'),
                  h('div', {
                    style: {
                      fontSize: '16px',
                      fontWeight: '400',
                      color: '#C9A962',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'Monaco, "Courier New", monospace'
                    }
                  }, currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
                )
              )
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
            // Forwarding View
            view === 'forwarding' ? h('div', {},
              // Header
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
                h('h3', { style: { color: '#60A5FA', fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' } },
                  '⚡ Email Forwarding',
                  h('span', { style: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '400' } }, 
                    `${forwardingRules.length} ${forwardingRules.length === 1 ? 'rule' : 'rules'}`
                  )
                ),
                h('button', {
                  onClick: () => setShowCreateRule(true),
                  style: {
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }
                }, '+ New Rule')
              ),
              
              // Info Banner
              h('div', {
                style: {
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.6'
                }
              },
                '⚡ Auto-forward emails to external addresses based on sender, subject, or keywords. Forward incoming emails in real-time!'
              ),
              
              // Rules List
              forwardingRules.length === 0 ? h('div', {
                style: {
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  background: 'rgba(26, 31, 58, 0.6)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(96, 165, 250, 0.2)'
                }
              },
                h('div', { style: { fontSize: '64px', marginBottom: '16px' } }, '⚡'),
                h('div', { style: { fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.6)' } }, 'No forwarding rules yet'),
                h('div', { style: { fontSize: '14px', marginBottom: '24px' } }, 'Create a rule to automatically forward emails to external addresses'),
                h('button', {
                  onClick: () => setShowCreateRule(true),
                  style: {
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }
                }, '+ Create Your First Rule')
              ) : h('div', { style: { display: 'grid', gap: '16px' } },
                forwardingRules.map((rule, i) =>
                  h('div', {
                    key: rule.id || i,
                    style: {
                      padding: '20px',
                      background: rule.is_enabled 
                        ? 'linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(15, 20, 41, 0.8) 100%)'
                        : 'rgba(26, 31, 58, 0.4)',
                      border: rule.is_enabled
                        ? '1px solid rgba(96, 165, 250, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      opacity: rule.is_enabled ? 1 : 0.6,
                      transition: 'all 0.3s'
                    }
                  },
                    // Header Row
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } },
                      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                        h('div', {
                          style: {
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: rule.is_enabled
                              ? 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
                              : 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                          }
                        }, '⚡'),
                        h('div', {},
                          h('div', { style: { fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '15px' } }, `Forward to: ${rule.forward_to}`),
                          h('div', { style: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' } }, 
                            rule.trigger_count ? `✅ Triggered ${rule.trigger_count} times` : '⏳ Not triggered yet'
                          )
                        )
                      ),
                      h('div', { style: { display: 'flex', gap: '8px' } },
                        // Enable/Disable Toggle
                        h('button', {
                          onClick: () => toggleRule(rule.id, rule.is_enabled),
                          style: {
                            padding: '8px 16px',
                            background: rule.is_enabled
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(156, 163, 175, 0.2)',
                            border: '1px solid ' + (rule.is_enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'),
                            borderRadius: '8px',
                            color: rule.is_enabled ? '#22c55e' : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }
                        }, rule.is_enabled ? '✓ Enabled' : '○ Disabled'),
                        // Delete Button
                        h('button', {
                          onClick: () => deleteRule(rule.id),
                          style: {
                            padding: '8px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }
                        }, '🗑️')
                      )
                    ),
                    
                    // Conditions
                    h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' } },
                      rule.match_sender && h('div', {
                        style: {
                          padding: '6px 12px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#60a5fa'
                        }
                      }, `📧 From: ${rule.match_sender}`),
                      rule.match_subject && h('div', {
                        style: {
                          padding: '6px 12px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#a78bfa'
                        }
                      }, `📝 Subject: "${rule.match_subject}"`),
                      rule.match_category && h('div', {
                        style: {
                          padding: '6px 12px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#22c55e'
                        }
                      }, `📂 Category: ${rule.match_category}`),
                      !rule.match_sender && !rule.match_subject && !rule.match_category && h('div', {
                        style: {
                          padding: '6px 12px',
                          background: 'rgba(201, 169, 98, 0.15)',
                          border: '1px solid rgba(201, 169, 98, 0.3)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#C9A962'
                        }
                      }, '✨ Forward ALL emails'),
                      h('div', {
                        style: {
                          padding: '6px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }
                      }, rule.keep_original ? '📥 Keep original' : '🗑️ Delete after forward')
                    )
                  )
                )
              ),
              
              // Create Rule Modal
              showCreateRule && h('div', {
                onClick: () => setShowCreateRule(false),
                style: {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '20px'
                }
              },
                h('div', {
                  onClick: (e) => e.stopPropagation(),
                  style: {
                    background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 41, 0.98) 100%)',
                    borderRadius: '16px',
                    padding: '32px',
                    width: '600px',
                    maxWidth: '90%',
                    border: '1px solid rgba(96, 165, 250, 0.2)',
                    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
                  }
                },
                  h('h3', { style: { color: '#60A5FA', fontSize: '24px', marginBottom: '8px' } }, '⚡ Create Forwarding Rule'),
                  h('p', { style: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' } }, 
                    'Automatically forward emails to external addresses'
                  ),
                  
                  // Forward To (Required)
                  h('div', { style: { marginBottom: '20px' } },
                    h('label', { style: { display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' } }, 
                      'Forward To (Required) *'
                    ),
                    h('input', {
                      type: 'email',
                      placeholder: 'external@gmail.com',
                      value: newRuleForwardTo,
                      onChange: (e) => setNewRuleForwardTo(e.target.value),
                      style: {
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                      }
                    })
                  ),
                  
                  // Match Sender (Optional)
                  h('div', { style: { marginBottom: '20px' } },
                    h('label', { style: { display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' } }, 
                      'Match Sender (Optional)'
                    ),
                    h('input', {
                      type: 'email',
                      placeholder: 'boss@company.com (leave empty to forward all)',
                      value: newRuleMatchSender,
                      onChange: (e) => setNewRuleMatchSender(e.target.value),
                      style: {
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                      }
                    })
                  ),
                  
                  // Match Subject (Optional)
                  h('div', { style: { marginBottom: '20px' } },
                    h('label', { style: { display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' } }, 
                      'Match Subject Keywords (Optional)'
                    ),
                    h('input', {
                      type: 'text',
                      placeholder: 'urgent, important (leave empty to forward all)',
                      value: newRuleMatchSubject,
                      onChange: (e) => setNewRuleMatchSubject(e.target.value),
                      style: {
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                      }
                    })
                  ),
                  
                  // Options
                  h('div', { style: { marginBottom: '24px', display: 'flex', gap: '16px' } },
                    h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
                      h('input', {
                        type: 'checkbox',
                        checked: newRuleKeepOriginal,
                        onChange: (e) => setNewRuleKeepOriginal(e.target.checked),
                        style: { width: '16px', height: '16px', cursor: 'pointer' }
                      }),
                      h('span', { style: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' } }, '📥 Keep original in inbox')
                    ),
                    h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
                      h('input', {
                        type: 'checkbox',
                        checked: newRuleAddPrefix,
                        onChange: (e) => setNewRuleAddPrefix(e.target.checked),
                        style: { width: '16px', height: '16px', cursor: 'pointer' }
                      }),
                      h('span', { style: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' } }, '📝 Add [Fwd:] prefix')
                    )
                  ),
                  
                  // Buttons
                  h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
                    h('button', {
                      onClick: () => setShowCreateRule(false),
                      style: {
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }
                    }, 'Cancel'),
                    h('button', {
                      onClick: createForwardingRule,
                      style: {
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }
                    }, '✨ Create Rule')
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
                          console.log('✅ Marked as read - refreshing inbox...');
                          // Reload data to show updated read status
                          loadData();
                        }
                      }).catch(err => console.error('❌ Mark as read failed:', err));
                    }
                    
                    // Mark as read in shared mailbox
                    if (currentMailbox) {
                      markEmailAsRead(currentMailbox.id, email.id);
                    }
                    
                    setSelectedEmail(email);
                    setShowCollabPanel(true);
                    loadCollabData(email.id);
                  },
                  style: {
                    padding: '24px',
                    // INBOX: Read emails dimmed (lights off), Unread emails bright
                    // SENT: Always same brightness (recipient read status shown separately)
                    background: view === 'inbox' && email.is_read 
                      ? 'linear-gradient(135deg, rgba(15, 20, 35, 0.4) 0%, rgba(10, 13, 25, 0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(15, 20, 41, 0.8) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: view === 'inbox' && email.is_read 
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
                    opacity: (view === 'inbox' && email.is_read) ? 0.7 : 1
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                    e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(201, 169, 98, 0.2)';
                    e.currentTarget.style.opacity = '1';
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.borderColor = (view === 'inbox' && email.is_read)
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(201, 169, 98, 0.2)';
                    e.currentTarget.style.boxShadow = (view === 'inbox' && email.is_read)
                      ? '0 2px 12px rgba(0, 0, 0, 0.3)'
                      : '0 4px 24px rgba(201, 169, 98, 0.15)';
                    e.currentTarget.style.opacity = (view === 'inbox' && email.is_read) ? '0.7' : '1';
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
                      // 🔵 Unread indicator badge (CRITICAL: ONLY in INBOX, never in SENT/DRAFTS)
                      !email.is_read && (view === 'inbox' || view === 'search') && h('div', {
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
                      ),
                      
                      // 👁️ READ RECEIPTS (Shared Mailbox Only)
                      currentMailbox && readReceipts[email.id] && readReceipts[email.id].length > 0 && h('div', {
                        title: readReceipts[email.id].map(r => `${r.display_name || r.user_email} - ${new Date(r.read_at).toLocaleString()}`).join('\n'),
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '20px',
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15))',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          cursor: 'help'
                        }
                      },
                        h('span', {
                          style: {
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#22c55e'
                          }
                        }, '👁️'),
                        // Show avatars
                        h('div', {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '2px'
                          }
                        },
                          readReceipts[email.id].slice(0, 3).map((reader, idx) =>
                            h('div', {
                              key: reader.user_email,
                              title: `${reader.display_name || reader.user_email}\n${new Date(reader.read_at).toLocaleString()}`,
                              style: {
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx % 4]} 0%, ${['#2563eb', '#059669', '#d97706', '#dc2626'][idx % 4]} 100%)`,
                                border: '2px solid rgba(26, 31, 58, 0.95)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: '700',
                                color: '#fff',
                                marginLeft: idx > 0 ? '-8px' : '0',
                                zIndex: 10 - idx,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                cursor: 'help'
                              }
                            }, (reader.display_name || reader.user_email)[0]?.toUpperCase() || '?')
                          ),
                          readReceipts[email.id].length > 3 && h('div', {
                            title: readReceipts[email.id].slice(3).map(r => `${r.display_name || r.user_email} - ${new Date(r.read_at).toLocaleString()}`).join('\n'),
                            style: {
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.3) 100%)',
                              border: '2px solid rgba(26, 31, 58, 0.95)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: '700',
                              color: '#94a3b8',
                              marginLeft: '-8px',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                              cursor: 'help'
                            }
                          }, `+${readReceipts[email.id].length - 3}`)
                        )
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
                    handleAddAttachment(file); // Use main scope handler
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
          onClose: handleCloseCompose,
          onSend: sendEmail,
          files: files,
          showFilePicker: showFilePicker,
          setShowFilePicker: setShowFilePicker,
          loadFiles: loadFileBankFiles,
          attachments: composeAttachments,
          onRemoveAttachment: handleRemoveAttachment,
          onAddAttachment: handleAddAttachment
        }),
        
        // 🎬 STUNNING SENDING ANIMATION OVERLAY
        sendStatus && h(SendingAnimationOverlay, {
          status: sendStatus // 'sending', 'success', 'error', 'warning'
        }),
        
        // Profile Modal
        showProfileModal && h(ProfileModal, {
          user: user,
          userProfile: userProfile,
          onClose: () => setShowProfileModal(false),
          onUpdate: (updatedProfile) => {
            setUserProfile(updatedProfile);
            setShowProfileModal(false);
          }
        }),
        
        // 🎯 SHARED MAILBOX ADMIN PANEL
        showAdminPanel && h('div', {
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
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease-out'
          },
          onClick: () => setShowAdminPanel(false)
        },
          h('div', {
            style: {
              background: 'linear-gradient(180deg, #1a1f3a 0%, #0f1429 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(201, 169, 98, 0.3)',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: 'modalSlideIn 0.3s ease-out'
            },
            onClick: (e) => e.stopPropagation()
          },
            // Header
            h('div', {
              style: {
                padding: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }
            },
              h('div', {},
                h('h2', {
                  style: {
                    margin: 0,
                    color: '#C9A962',
                    fontSize: '24px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }
                }, '⚙️ Shared Mailbox Management'),
                h('p', {
                  style: {
                    margin: 0,
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px'
                  }
                }, 'Manage shared mailboxes and team members')
              ),
              h('button', {
                onClick: () => setShowAdminPanel(false),
                style: {
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '28px',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                },
                onMouseEnter: (e) => e.target.style.color = '#C9A962',
                onMouseLeave: (e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'
              }, '×')
            ),
            
            // Content
            h('div', { style: { padding: '24px' } },
              // Shared Mailboxes List
              h('div', { style: { marginBottom: '32px' } },
                h('h3', {
                  style: {
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }
                }, '📬 Shared Mailboxes'),
                
                h('div', { style: { display: 'grid', gap: '16px' } },
                  sharedMailboxes.map(mailbox =>
                    h('div', {
                      key: mailbox.id,
                      style: {
                        padding: '20px',
                        background: 'rgba(26, 31, 58, 0.6)',
                        border: '1px solid rgba(201, 169, 98, 0.2)',
                        borderRadius: '12px',
                        transition: 'all 0.2s'
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    },
                      h('div', {
                        style: {
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }
                      },
                        h('div', {},
                          h('div', {
                            style: {
                              color: '#C9A962',
                              fontSize: '16px',
                              fontWeight: '600',
                              marginBottom: '4px'
                            }
                          }, mailbox.display_name),
                          h('div', {
                            style: {
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '13px',
                              marginBottom: '4px'
                            }
                          }, mailbox.email_address),
                          h('div', {
                            style: {
                              color: 'rgba(255, 255, 255, 0.5)',
                              fontSize: '12px'
                            }
                          }, mailbox.description)
                        ),
                        h('div', {
                          style: {
                            padding: '4px 12px',
                            background: 'rgba(201, 169, 98, 0.2)',
                            border: '1px solid rgba(201, 169, 98, 0.3)',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#C9A962',
                            textTransform: 'uppercase'
                          }
                        }, `${mailbox.member_count || 0} Members`)
                      ),
                      
                      // Members Section (expandable)
                      currentMailbox && currentMailbox.id === mailbox.id && h('div', {
                        style: {
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }
                      },
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
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontSize: '14px',
                              fontWeight: '600'
                            }
                          }, '👥 Team Members'),
                          h('button', {
                            onClick: () => setShowAddMember(true),
                            style: {
                              padding: '6px 12px',
                              background: 'rgba(34, 197, 94, 0.2)',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                              borderRadius: '6px',
                              color: '#22c55e',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            },
                            onMouseEnter: (e) => e.target.style.background = 'rgba(34, 197, 94, 0.3)',
                            onMouseLeave: (e) => e.target.style.background = 'rgba(34, 197, 94, 0.2)'
                          }, '+ Add Member')
                        ),
                        
                        // Members List
                        h('div', { style: { display: 'grid', gap: '8px' } },
                          sharedMailboxMembers.map(member =>
                            h('div', {
                              key: member.user_email,
                              style: {
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
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
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'white'
                                  }
                                }, (member.display_name || member.user_email).substring(0, 1).toUpperCase()),
                                h('div', {},
                                  h('div', {
                                    style: {
                                      color: 'rgba(255, 255, 255, 0.9)',
                                      fontSize: '13px',
                                      fontWeight: '500'
                                    }
                                  }, member.display_name || member.user_email),
                                  h('div', {
                                    style: {
                                      color: 'rgba(255, 255, 255, 0.5)',
                                      fontSize: '11px'
                                    }
                                  }, member.user_email)
                                )
                              ),
                              h('div', {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }
                              },
                                h('span', {
                                  style: {
                                    padding: '4px 8px',
                                    background: member.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(201, 169, 98, 0.2)',
                                    border: `1px solid ${member.role === 'admin' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(201, 169, 98, 0.3)'}`,
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    color: member.role === 'admin' ? '#ef4444' : '#C9A962',
                                    textTransform: 'uppercase'
                                  }
                                }, member.role),
                                h('button', {
                                  onClick: () => removeMemberFromMailbox(mailbox.id, member.user_email),
                                  style: {
                                    padding: '4px 8px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    borderRadius: '4px',
                                    color: '#ef4444',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  },
                                  onMouseEnter: (e) => e.target.style.background = 'rgba(239, 68, 68, 0.3)',
                                  onMouseLeave: (e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                                }, 'Remove')
                              )
                            )
                          )
                        )
                      ),
                      
                      // Manage Button
                      h('button', {
                        onClick: () => {
                          if (currentMailbox && currentMailbox.id === mailbox.id) {
                            switchToMailbox(null);
                          } else {
                            switchToMailbox(mailbox);
                            loadMailboxDetails(mailbox.id);
                          }
                        },
                        style: {
                          width: '100%',
                          marginTop: '12px',
                          padding: '10px',
                          background: currentMailbox && currentMailbox.id === mailbox.id ? 'rgba(201, 169, 98, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${currentMailbox && currentMailbox.id === mailbox.id ? 'rgba(201, 169, 98, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '8px',
                          color: currentMailbox && currentMailbox.id === mailbox.id ? '#C9A962' : 'rgba(255, 255, 255, 0.7)',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        },
                        onMouseEnter: (e) => {
                          e.target.style.background = 'rgba(201, 169, 98, 0.2)';
                          e.target.style.color = '#C9A962';
                        },
                        onMouseLeave: (e) => {
                          if (!currentMailbox || currentMailbox.id !== mailbox.id) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                          }
                        }
                      }, currentMailbox && currentMailbox.id === mailbox.id ? '✓ Viewing Members' : '👁️ View Members')
                    )
                  )
                )
              )
            )
          )
        ),
        
        // Add Member Modal
        showAddMember && currentMailbox && h('div', {
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2001,
            animation: 'fadeIn 0.2s ease-out'
          },
          onClick: () => setShowAddMember(false)
        },
          h('div', {
            style: {
              background: 'linear-gradient(180deg, #1a1f3a 0%, #0f1429 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(201, 169, 98, 0.3)',
              width: '90%',
              maxWidth: '500px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            },
            onClick: (e) => e.stopPropagation()
          },
            h('h3', {
              style: {
                margin: '0 0 20px 0',
                color: '#C9A962',
                fontSize: '20px',
                fontWeight: '600'
              }
            }, '➕ Add Team Member'),
            
            h('input', {
              type: 'email',
              placeholder: 'user@investaycapital.com',
              value: newMemberEmail,
              onChange: (e) => setNewMemberEmail(e.target.value),
              style: {
                width: '100%',
                padding: '12px',
                background: 'rgba(26, 31, 58, 0.6)',
                border: '1px solid rgba(201, 169, 98, 0.3)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '16px'
              }
            }),
            
            h('select', {
              value: newMemberRole,
              onChange: (e) => setNewMemberRole(e.target.value),
              style: {
                width: '100%',
                padding: '12px',
                background: 'rgba(26, 31, 58, 0.6)',
                border: '1px solid rgba(201, 169, 98, 0.3)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '20px'
              }
            },
              h('option', { value: 'member' }, '👤 Member (View & Send)'),
              h('option', { value: 'admin' }, '👑 Admin (Full Access)')
            ),
            
            h('div', {
              style: {
                display: 'flex',
                gap: '12px'
              }
            },
              h('button', {
                onClick: () => setShowAddMember(false),
                style: {
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)',
                onMouseLeave: (e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              }, 'Cancel'),
              h('button', {
                onClick: () => {
                  if (newMemberEmail && currentMailbox) {
                    addMemberToMailbox(currentMailbox.id, newMemberEmail, newMemberRole);
                  }
                },
                style: {
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(201, 169, 98, 0.3)',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => e.target.style.transform = 'translateY(-1px)',
                onMouseLeave: (e) => e.target.style.transform = 'translateY(0)'
              }, '✓ Add Member')
            )
          )
        ),
        
        // Email Viewer Modal - Shows when email is selected
        selectedEmail && h(EmailViewerModal, {
          email: selectedEmail,
          onClose: () => {
            setSelectedEmail(null);
            setShowCollabPanel(false);
            // Reload email list to show updated read status
            loadData();
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
            h('div', { style: { fontSize: '14px', color: '#C9A962', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' } }, 
              '💬',
              'Team Comments',
              h('span', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '400' } }, '(Internal - Team Only)')
            ),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' } },
              comments.length === 0 ? 
                h('div', { 
                  style: { 
                    textAlign: 'center', 
                    padding: '60px 20px', 
                    color: 'rgba(255, 255, 255, 0.3)', 
                    fontSize: '13px',
                    background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.03) 0%, rgba(168, 139, 78, 0.03) 100%)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(201, 169, 98, 0.2)'
                  } 
                }, 
                  h('div', { style: { fontSize: '32px', marginBottom: '12px' } }, '📝'),
                  'No comments yet',
                  h('div', { style: { fontSize: '11px', marginTop: '8px', color: 'rgba(255, 255, 255, 0.2)' } }, 'Start the conversation with your team')
                ) :
                comments.map((comment, i) => {
                  // Sticky note colors (professional neon highlights)
                  const colors = [
                    { bg: 'linear-gradient(135deg, rgba(255, 235, 59, 0.12) 0%, rgba(255, 213, 79, 0.08) 100%)', border: 'rgba(255, 235, 59, 0.3)', glow: 'rgba(255, 235, 59, 0.15)', text: '#FFF9C4' },  // Neon Yellow
                    { bg: 'linear-gradient(135deg, rgba(129, 212, 250, 0.12) 0%, rgba(79, 195, 247, 0.08) 100%)', border: 'rgba(129, 212, 250, 0.3)', glow: 'rgba(129, 212, 250, 0.15)', text: '#E1F5FE' },  // Neon Blue
                    { bg: 'linear-gradient(135deg, rgba(165, 214, 167, 0.12) 0%, rgba(129, 199, 132, 0.08) 100%)', border: 'rgba(165, 214, 167, 0.3)', glow: 'rgba(165, 214, 167, 0.15)', text: '#E8F5E9' },  // Neon Green
                    { bg: 'linear-gradient(135deg, rgba(240, 98, 146, 0.12) 0%, rgba(244, 143, 177, 0.08) 100%)', border: 'rgba(240, 98, 146, 0.3)', glow: 'rgba(240, 98, 146, 0.15)', text: '#FCE4EC' },  // Neon Pink
                    { bg: 'linear-gradient(135deg, rgba(179, 157, 219, 0.12) 0%, rgba(149, 117, 205, 0.08) 100%)', border: 'rgba(179, 157, 219, 0.3)', glow: 'rgba(179, 157, 219, 0.15)', text: '#F3E5F5' },  // Neon Purple
                  ];
                  const colorIndex = i % colors.length;
                  const stickyColor = colors[colorIndex];
                  
                  return h('div', {
                    key: i,
                    style: { 
                      padding: '16px 18px',
                      background: stickyColor.bg,
                      border: `1.5px solid ${stickyColor.border}`,
                      borderRadius: '10px',
                      boxShadow: `0 4px 16px ${stickyColor.glow}, 0 0 0 1px rgba(255, 255, 255, 0.03)`,
                      position: 'relative',
                      transform: 'translateZ(0)',
                      transition: 'all 0.2s ease',
                      cursor: 'default'
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) translateZ(0)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${stickyColor.glow}, 0 0 0 1.5px ${stickyColor.border}`;
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.transform = 'translateZ(0)';
                      e.currentTarget.style.boxShadow = `0 4px 16px ${stickyColor.glow}, 0 0 0 1px rgba(255, 255, 255, 0.03)`;
                    }
                  },
                    // Top edge highlight (sticky note effect)
                    h('div', { 
                      style: { 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        height: '3px', 
                        background: stickyColor.border,
                        borderRadius: '10px 10px 0 0',
                        opacity: 0.6
                      } 
                    }),
                    // Author header
                    h('div', { 
                      style: { 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        paddingBottom: '10px',
                        borderBottom: `1px solid ${stickyColor.border}`
                      } 
                    },
                      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        h('div', { 
                          style: { 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: stickyColor.border,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'rgba(0, 0, 0, 0.7)',
                            boxShadow: `0 2px 8px ${stickyColor.glow}`
                          } 
                        }, (comment.author_name || comment.author_email || 'U')[0].toUpperCase()),
                        h('div', {},
                          h('div', { style: { fontSize: '13px', fontWeight: '600', color: stickyColor.text } }, comment.author_name || comment.author_email?.split('@')[0]),
                          h('div', { style: { fontSize: '10px', color: 'rgba(255, 255, 255, 0.35)', marginTop: '2px' } }, new Date(comment.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
                        )
                      ),
                      comment.comment_type && h('div', { 
                        style: { 
                          fontSize: '10px', 
                          padding: '3px 8px', 
                          background: stickyColor.border,
                          color: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: '4px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        } 
                      }, comment.comment_type)
                    ),
                    // Comment text
                    h('div', { 
                      style: { 
                        fontSize: '14px', 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      } 
                    }, comment.comment_text),
                    // Resolve button (if unresolved)
                    !comment.is_resolved && h('div', { 
                      style: { 
                        marginTop: '12px', 
                        paddingTop: '12px', 
                        borderTop: `1px solid ${stickyColor.border}`,
                        display: 'flex',
                        justifyContent: 'flex-end'
                      } 
                    },
                      h('button', {
                        onClick: () => {
                          fetch(`/api/collaboration/comments/${comment.id}/resolve`, { method: 'PUT' })
                            .then(() => loadCollabData(selectedEmail.id));
                        },
                        style: {
                          padding: '6px 12px',
                          fontSize: '11px',
                          background: stickyColor.border,
                          color: 'rgba(0, 0, 0, 0.7)',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        },
                        onMouseEnter: (e) => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = `0 2px 8px ${stickyColor.glow}`;
                        },
                        onMouseLeave: (e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }
                      }, '✓ Resolve')
                    )
                  );
                })
            ),
            h('div', {},
              h('textarea', {
                value: newComment,
                onChange: (e) => setNewComment(e.target.value),
                placeholder: 'Add internal team comment (visible to @investaycapital.com team members)...',
                style: {
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(26, 31, 58, 0.6)',
                  border: '1.5px solid rgba(201, 169, 98, 0.3)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '90px',
                  marginBottom: '12px',
                  transition: 'all 0.2s'
                },
                onFocus: (e) => {
                  e.target.style.borderColor = 'rgba(201, 169, 98, 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)';
                },
                onBlur: (e) => {
                  e.target.style.borderColor = 'rgba(201, 169, 98, 0.3)';
                  e.target.style.boxShadow = 'none';
                }
              }),
              h('button', {
                onClick: addComment,
                disabled: !newComment.trim(),
                style: {
                  width: '100%',
                  padding: '14px',
                  background: newComment.trim() ? 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)' : 'rgba(100, 100, 100, 0.3)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: newComment.trim() ? '0 4px 16px rgba(201, 169, 98, 0.3)' : 'none',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  if (newComment.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(201, 169, 98, 0.4)';
                  }
                },
                onMouseLeave: (e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = newComment.trim() ? '0 4px 16px rgba(201, 169, 98, 0.3)' : 'none';
                }
              }, '💬 Add Comment')
            )
          )
        )
      );
    }
    
    function ProfileModal({ user, userProfile, onClose, onUpdate }) {
      const [displayName, setDisplayName] = useState(userProfile.displayName || '');
      const [profileImageUrl, setProfileImageUrl] = useState(userProfile.profileImage || '');
      const [updating, setUpdating] = useState(false);
      
      const handleSave = async () => {
        setUpdating(true);
        try {
          const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              displayName: displayName,
              profileImage: profileImageUrl || null
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            onUpdate({ displayName, profileImage: profileImageUrl || null });
            alert('✅ Profile updated successfully!');
          } else {
            alert('❌ Failed to update profile: ' + result.error);
          }
        } catch (error) {
          console.error('Update profile error:', error);
          alert('❌ Error updating profile');
        } finally {
          setUpdating(false);
        }
      };
      
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
          zIndex: 2000
        }
      },
        h('div', {
          onClick: (e) => e.stopPropagation(),
          style: {
            background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 41, 0.98) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(201, 169, 98, 0.3)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 169, 98, 0.1)',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }
        },
          // Header
          h('div', {
            style: {
              padding: '24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }
          },
            h('div', {},
              h('h2', { style: { margin: 0, fontSize: '20px', fontWeight: '600', color: '#C9A962' } }, '⚙️ Profile Settings'),
              h('p', { style: { margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' } }, user)
            ),
            h('button', {
              onClick: onClose,
              style: {
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                padding: '8px',
                lineHeight: 1
              }
            }, '×')
          ),
          
          // Content
          h('div', { style: { padding: '24px' } },
            // Profile Image Section
            h('div', { style: { marginBottom: '24px', textAlign: 'center' } },
              h('div', { style: { fontSize: '13px', fontWeight: '600', color: '#C9A962', marginBottom: '16px' } }, 'Profile Picture'),
              h('div', {
                style: {
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: profileImageUrl 
                    ? `url(${profileImageUrl}) center/cover` 
                    : 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: '600',
                  color: 'white',
                  margin: '0 auto 16px auto',
                  boxShadow: '0 4px 16px rgba(201, 169, 98, 0.3)',
                  border: '3px solid rgba(201, 169, 98, 0.3)'
                }
              }, !profileImageUrl && (displayName || user.split('@')[0])[0].toUpperCase()),
              h('input', {
                type: 'text',
                value: profileImageUrl,
                onChange: (e) => setProfileImageUrl(e.target.value),
                placeholder: 'Profile image URL (e.g., https://...)',
                style: {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(26, 31, 58, 0.6)',
                  border: '1.5px solid rgba(201, 169, 98, 0.3)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  outline: 'none'
                }
              }),
              h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '8px' } }, 
                'Paste a URL to an image (jpg, png, gif)'
              )
            ),
            
            // Display Name Section
            h('div', { style: { marginBottom: '24px' } },
              h('label', { style: { fontSize: '13px', fontWeight: '600', color: '#C9A962', marginBottom: '8px', display: 'block' } }, 'Display Name'),
              h('input', {
                type: 'text',
                value: displayName,
                onChange: (e) => setDisplayName(e.target.value),
                placeholder: 'Your display name',
                style: {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(26, 31, 58, 0.6)',
                  border: '1.5px solid rgba(201, 169, 98, 0.3)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  outline: 'none'
                }
              })
            ),
            
            // Buttons
            h('div', { style: { display: 'flex', gap: '12px' } },
              h('button', {
                onClick: onClose,
                style: {
                  flex: 1,
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }
              }, 'Cancel'),
              h('button', {
                onClick: handleSave,
                disabled: updating,
                style: {
                  flex: 1,
                  padding: '14px',
                  background: updating ? 'rgba(201, 169, 98, 0.3)' : 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  boxShadow: updating ? 'none' : '0 4px 16px rgba(201, 169, 98, 0.3)'
                }
              }, updating ? '⏳ Saving...' : '💾 Save Changes')
            )
          )
        )
      );
    }
    
    // ============================================
    // 🎬 STUNNING SENDING ANIMATION OVERLAY
    // Professional animation that prevents duplicate sends
    // ============================================
    function SendingAnimationOverlay({ status }) {
      // Status can be: 'sending', 'success', 'error', 'warning'
      
      const getStatusConfig = () => {
        switch(status) {
          case 'sending':
            return {
              icon: '✉️',
              title: 'Sending Email',
              subtitle: 'Please wait...',
              color: '#C9A962',
              bgGradient: 'linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, rgba(139, 115, 85, 0.1) 100%)',
              borderColor: 'rgba(201, 169, 98, 0.3)',
              showSpinner: true
            };
          case 'success':
            return {
              icon: '✅',
              title: 'Email Sent!',
              subtitle: 'Your message is on its way',
              color: '#22c55e',
              bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
              borderColor: 'rgba(34, 197, 94, 0.3)',
              showSpinner: false
            };
          case 'error':
            return {
              icon: '❌',
              title: 'Send Failed',
              subtitle: 'Please try again',
              color: '#ef4444',
              bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              showSpinner: false
            };
          case 'warning':
            return {
              icon: '⚠️',
              title: 'Partially Sent',
              subtitle: 'Check configuration',
              color: '#f59e0b',
              bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              showSpinner: false
            };
          default:
            return null;
        }
      };
      
      const config = getStatusConfig();
      if (!config) return null;
      
      return h('div', {
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.3s ease-out'
        }
      },
        h('div', {
          style: {
            background: config.bgGradient,
            backdropFilter: 'blur(40px)',
            border: `2px solid ${config.borderColor}`,
            borderRadius: '32px',
            padding: '64px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            boxShadow: `0 32px 128px rgba(0, 0, 0, 0.6), 0 0 0 1px ${config.borderColor}`,
            animation: status === 'sending' ? 'pulseScale 2s ease-in-out infinite' : 'successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            transform: status === 'success' ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            maxWidth: '500px',
            textAlign: 'center'
          }
        },
          // Icon with animation
          h('div', {
            style: {
              fontSize: '96px',
              lineHeight: 1,
              animation: status === 'sending' ? 'float 3s ease-in-out infinite' : 
                        status === 'success' ? 'successBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 
                        'shake 0.5s ease-in-out',
              transform: 'translateZ(0)',
              filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3))'
            }
          }, config.icon),
          
          // Title
          h('div', {
            style: {
              fontSize: '36px',
              fontWeight: '800',
              color: config.color,
              letterSpacing: '-0.5px',
              textShadow: `0 2px 8px ${config.color}40`,
              animation: status === 'sending' ? 'shimmer 2s ease-in-out infinite' : 'none'
            }
          }, config.title),
          
          // Subtitle
          h('div', {
            style: {
              fontSize: '18px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '0.5px',
              marginTop: '-8px'
            }
          }, config.subtitle),
          
          // Spinner (only for sending state)
          config.showSpinner && h('div', {
            style: {
              marginTop: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center'
            }
          },
            // Three animated dots
            [0, 1, 2].map(i => 
              h('div', {
                key: i,
                style: {
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: config.color,
                  animation: `bounce 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.16}s`,
                  boxShadow: `0 4px 12px ${config.color}60`
                }
              })
            )
          ),
          
          // Progress bar for sending
          status === 'sending' && h('div', {
            style: {
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginTop: '16px'
            }
          },
            h('div', {
              style: {
                width: '60%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
                borderRadius: '3px',
                animation: 'progressSlide 1.5s ease-in-out infinite',
                boxShadow: `0 0 20px ${config.color}`
              }
            })
          ),
          
          // Success checkmark circle animation
          status === 'success' && h('div', {
            style: {
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: `4px solid ${config.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px',
              animation: 'checkmarkDraw 0.8s ease-out',
              boxShadow: `0 0 40px ${config.color}60`
            }
          },
            h('div', {
              style: {
                fontSize: '48px',
                animation: 'fadeIn 0.5s ease-out 0.4s both'
              }
            }, '✓')
          )
        )
      );
    }
    
    // ============================================
    // COMPOSE MODAL COMPONENT
    // ============================================
    function ComposeModal({ onClose, onSend, files, showFilePicker, setShowFilePicker, loadFiles, attachments, onRemoveAttachment, onAddAttachment }) {
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
      
      // Helper: Format file size
      const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      };
      
      // TEMP: Keep these for backward compatibility
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
        
        onSend(to, subject, body, attachments); // ✅ Pass attachments!
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
            padding: '0',
            width: 'min(900px, 90vw)',
            maxHeight: '90vh',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 169, 98, 0.1)',
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        },
          // Header - Fixed at top
          h('div', {
            style: {
              padding: '28px 32px 20px 32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0
            }
          },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
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
            )
          ),
          
          // Scrollable content area
          h('div', {
            style: {
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '24px 32px 16px 32px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(201, 169, 98, 0.3) rgba(0, 0, 0, 0.2)'
            }
          },
          
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
                }, `${body.length} chars`)
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
                      onClick: () => onRemoveAttachment(idx),
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
          )
          // End of scrollable content area
          ),
          
          // Fixed footer with action buttons
          h('div', {
            style: {
              padding: '20px 32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 41, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              flexShrink: 0
            }
          },
          
          // 📎 ATTACHMENT BUTTONS - Add before Send/Cancel
          h('div', { 
            style: { 
              display: 'flex', 
              gap: '12px', 
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            } 
          },
            // Computer file upload button
            h('div', { style: { position: 'relative' } },
              h('input', {
                type: 'file',
                multiple: true,
                id: 'computer-file-input',
                style: {
                  position: 'absolute',
                  opacity: 0,
                  width: '1px',
                  height: '1px'
                },
                onChange: (e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    // Create file object compatible with FileBank structure
                    const fileObj = {
                      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                      name: file.name,
                      filename: file.name,
                      size: file.size,
                      content_type: file.type || 'application/octet-stream',
                      file: file, // Store actual File object for upload
                      isLocalFile: true // Flag to identify computer uploads
                    };
                    onAddAttachment(fileObj); // Use prop handler
                  });
                  e.target.value = ''; // Reset input
                }
              }),
              h('label', {
                htmlFor: 'computer-file-input',
                style: {
                  padding: '12px 20px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  color: 'rgba(59, 130, 246, 0.9)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                },
                onMouseLeave: (e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }, '💻 From Computer')
            ),
            
            // FileBank button
            h('button', {
              onClick: () => {
                if (loadFiles) loadFiles(); // Load files if callback provided
                setShowFilePicker(true);
              },
              style: {
                padding: '12px 20px',
                background: 'rgba(201, 169, 98, 0.1)',
                border: '1px solid rgba(201, 169, 98, 0.3)',
                borderRadius: '10px',
                color: 'rgba(201, 169, 98, 0.9)',
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
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'rgba(201, 169, 98, 0.1)';
              }
            }, '📁 From FileBank')
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
          // End of footer
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
      
      // 📎 ATTACHMENTS STATE
      const [attachments, setAttachments] = useState([]);
      const [loadingAttachments, setLoadingAttachments] = useState(false);
      
      // Load attachments on mount
      useEffect(() => {
        if (email.id) {
          loadAttachments();
        }
      }, [email.id]);
      
      const loadAttachments = async () => {
        setLoadingAttachments(true);
        try {
          const response = await fetch(`/api/email/${email.id}/attachments`);
          const data = await response.json();
          if (data.success && data.attachments) {
            setAttachments(data.attachments);
            console.log(`📎 Loaded ${data.attachments.length} attachments for email ${email.id}`);
          }
        } catch (err) {
          console.error('❌ Failed to load attachments:', err);
        } finally {
          setLoadingAttachments(false);
        }
      };
      
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
            // CRITICAL: Sort by timestamp DESC (newest first) on client-side too!
            const sortedEmails = [...data.emails].sort((a, b) => {
              const timeA = new Date(a.sent_at || a.received_at || a.created_at).getTime();
              const timeB = new Date(b.sent_at || b.received_at || b.created_at).getTime();
              return timeB - timeA; // DESC = newest first
            });
            setThreadEmails(sortedEmails);
            console.log('🧵 Thread loaded and sorted:', sortedEmails.length, 'messages (newest first)');
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
      
      // Format file size (bytes to human-readable)
      const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      };
      
      // Strip quoted replies from email body to avoid showing history in threads
      const stripQuotedReply = (body) => {
        if (!body) return body;
        
        // Common quote patterns that indicate start of quoted/forwarded content
        const quotePatterns = [
          /^On .+wrote:$/m,                           // "On Mon, 5 Jan 2026 at 14:10, <email> wrote:"
          /^-+\s*Original Message\s*-+$/mi,           // "--- Original Message ---"
          /^_{10,}$/m,                                 // "________________________________"
          /^From:.+\nSent:.+\nTo:.+\nSubject:/mi,    // Outlook-style header
          /^>\s*.+/m,                                  // Lines starting with ">"
          /^━{3,}$/m,                                  // "━━━━━━━━━━━━━━━━━━"
        ];
        
        let cleanBody = body;
        
        // Find the earliest quote pattern match
        let earliestIndex = cleanBody.length;
        
        for (const pattern of quotePatterns) {
          const match = cleanBody.match(pattern);
          if (match && match.index < earliestIndex) {
            earliestIndex = match.index;
          }
        }
        
        // If we found a quote pattern, cut everything after it
        if (earliestIndex < cleanBody.length) {
          cleanBody = cleanBody.substring(0, earliestIndex).trim();
        }
        
        // Also remove lines that start with ">" (quoted text)
        const lines = cleanBody.split('\n');
        const nonQuotedLines = [];
        let foundQuote = false;
        
        for (const line of lines) {
          if (line.trim().startsWith('>')) {
            foundQuote = true;
            break; // Stop at first quoted line
          }
          nonQuotedLines.push(line);
        }
        
        if (foundQuote) {
          cleanBody = nonQuotedLines.join('\n').trim();
        }
        
        return cleanBody || body; // Fallback to original if stripping removed everything
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
              
              // Show all messages in thread (NEWEST FIRST - sorted DESC)
              threadEmails.map((msg, idx) => {
                // Since we sort NEWEST FIRST (DESC), idx=0 is the latest
                const isLatest = idx === 0;
                
                // Message number: Since newest is first, we need to reverse
                // Example: 3 messages total
                // idx=0 (latest) → messageNum = 3
                // idx=1 (middle) → messageNum = 2  
                // idx=2 (oldest) → messageNum = 1
                const messageNum = threadEmails.length - idx;
                
                return h('div', {
                  key: msg.id,
                  style: {
                    marginBottom: idx < threadEmails.length - 1 ? '16px' : '0',
                    padding: '20px',
                    // Latest message gets STRONG highlight
                    background: isLatest 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: isLatest
                      ? '2px solid rgba(59, 130, 246, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                    // Add subtle scale effect to latest
                    transform: isLatest ? 'scale(1.01)' : 'none',
                    transition: 'all 0.2s ease'
                  }
                },
                  // Message number badge (TOP LEFT)
                  h('div', {
                    style: {
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: isLatest ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)',
                      background: isLatest ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: isLatest ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                      zIndex: 10
                    }
                  }, `#${messageNum}`),
                  
                  // Latest indicator (TOP RIGHT)
                  isLatest && h('div', {
                    style: {
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }
                  }, 
                    '✨',
                    'LATEST'
                  ),
                  
                  // Message header
                  h('div', {
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      paddingBottom: '16px',
                      borderBottom: isLatest ? '2px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                      marginTop: '30px' // Space for badges
                    }
                  },
                    h('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1
                      }
                    },
                      h('div', {
                        style: {
                          width: isLatest ? '40px' : '36px',
                          height: isLatest ? '40px' : '36px',
                          borderRadius: '50%',
                          background: isLatest 
                            ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                            : 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isLatest ? '18px' : '15px',
                          flexShrink: 0,
                          border: isLatest ? '2px solid rgba(59, 130, 246, 0.4)' : 'none'
                        }
                      }, msg.from_name ? msg.from_name.charAt(0).toUpperCase() : '📧'),
                      h('div', { style: { flex: 1, minWidth: 0 } },
                        h('div', {
                          style: {
                            fontSize: isLatest ? '15px' : '13px',
                            fontWeight: isLatest ? '700' : '600',
                            color: isLatest ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)',
                            marginBottom: '4px'
                          }
                        }, msg.from_name || msg.from_email),
                        h('div', {
                          style: {
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }
                        }, 
                          '→',
                          msg.to_email
                        )
                      )
                    ),
                    // Timestamp - LARGER and clearer
                    h('div', {
                      style: {
                        fontSize: isLatest ? '13px' : '11px',
                        fontWeight: isLatest ? '600' : '500',
                        color: isLatest ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        paddingLeft: '12px'
                      }
                    }, formatDate(msg.sent_at || msg.received_at || msg.created_at))
                  ),
                  
                  // Message body - strip quoted replies to avoid showing history
                  h('div', { 
                    style: { 
                      fontSize: isLatest ? '15px' : '14px', 
                      lineHeight: '1.7', 
                      color: isLatest ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)', 
                      whiteSpace: 'pre-wrap',
                      marginBottom: '16px'
                    } 
                  }, stripQuotedReply(msg.body_text) || msg.snippet || '(No content)'),
                  
                  // 📎 ATTACHMENTS for this message (only if it's the main email)
                  isLatest && attachments.length > 0 && h('div', {
                    style: {
                      marginTop: '16px',
                      padding: '16px',
                      background: 'rgba(201, 169, 98, 0.08)',
                      border: '1px solid rgba(201, 169, 98, 0.2)',
                      borderRadius: '12px'
                    }
                  },
                    h('div', {
                      style: {
                        fontSize: '12px',
                        fontWeight: '700',
                        color: 'rgba(201, 169, 98, 0.9)',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }
                    }, 
                      '📎',
                      `${attachments.length} Attachment${attachments.length > 1 ? 's' : ''}`
                    ),
                    
                    h('div', {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }
                    },
                      attachments.map((att, idx) =>
                        h('a', {
                          key: idx,
                          href: att.r2_url || '#',
                          target: '_blank',
                          download: att.filename,
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          },
                          onMouseOver: (e) => {
                            e.target.style.background = 'rgba(201, 169, 98, 0.15)';
                            e.target.style.borderColor = 'rgba(201, 169, 98, 0.4)';
                          },
                          onMouseOut: (e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }
                        },
                          // File icon
                          h('div', {
                            style: {
                              width: '40px',
                              height: '40px',
                              background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.2) 0%, rgba(139, 115, 85, 0.2) 100%)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              flexShrink: 0
                            }
                          }, '📄'),
                          
                          // File info
                          h('div', { style: { flex: 1, minWidth: 0 } },
                            h('div', { 
                              style: { 
                                fontWeight: '600', 
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '14px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              } 
                            }, att.filename),
                            h('div', { 
                              style: { 
                                fontSize: '12px', 
                                color: 'rgba(255, 255, 255, 0.5)',
                                marginTop: '2px'
                              } 
                            }, 
                              `${Math.round(att.size / 1024)} KB • ${att.content_type || 'Unknown type'}`
                            )
                          ),
                          
                          // Download icon
                          h('div', {
                            style: {
                              fontSize: '18px',
                              color: 'rgba(201, 169, 98, 0.8)'
                            }
                          }, '⬇️')
                        )
                      )
                    )
                  )
                );
              }),
              
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
                    // Use shared mailbox email if in shared mailbox, otherwise use personal email
                    const fromEmail = currentMailbox ? currentMailbox.email_address : user;
                    console.log('📧 Replying from:', fromEmail, currentMailbox ? '(Shared Mailbox)' : '(Personal)');
                    
                    const response = await fetch('/api/email/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        from: fromEmail,
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
                    // Use shared mailbox email if in shared mailbox, otherwise use personal email
                    const fromEmail = currentMailbox ? currentMailbox.email_address : user;
                    console.log('📧 Forwarding from:', fromEmail, currentMailbox ? '(Shared Mailbox)' : '(Personal)');
                    
                    const response = await fetch('/api/email/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        from: fromEmail,
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
      
      /* 🎬 STUNNING SENDING ANIMATIONS */
      @keyframes pulseScale {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      @keyframes successPop {
        0% { transform: scale(0.8); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes successBounce {
        0% { transform: scale(0) rotate(-45deg); }
        50% { transform: scale(1.2) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
      @keyframes shimmer {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); opacity: 1; }
        50% { transform: translateY(-20px); opacity: 0.7; }
      }
      @keyframes progressSlide {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(300%); }
      }
      @keyframes checkmarkDraw {
        0% { 
          transform: scale(0) rotate(-45deg); 
          opacity: 0;
        }
        50% { 
          transform: scale(1.2) rotate(5deg); 
        }
        100% { 
          transform: scale(1) rotate(0deg); 
          opacity: 1;
        }
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
