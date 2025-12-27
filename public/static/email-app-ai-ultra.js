/**
 * InvestMail - ULTRA AI-POWERED EMAIL SYSTEM
 * With GPT-4 AI Writing Assistant, Smart Replies, Semantic Search, and More
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('🚀🤖 Initializing AI-Powered InvestMail...');
  
  function initApp() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      setTimeout(initApp, 100);
      return;
    }
    
    const { useState, useEffect, useRef } = React;
    const h = React.createElement;
    
    // Get JWT token from localStorage
    const getToken = () => localStorage.getItem('token');
    const getUser = () => localStorage.getItem('userEmail') || 'admin@investaycapital.com';
    
    // API helpers with auth
    const apiCall = async (url, options = {}) => {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      };
      
      const response = await fetch(url, { ...options, headers });
      if (!response.ok && response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      return response.json();
    };
    
    function EmailApp() {
      const [view, setView] = useState('inbox');
      const [emails, setEmails] = useState([]);
      const [loading, setLoading] = useState(false);
      const [showCompose, setShowCompose] = useState(false);
      const [selectedEmail, setSelectedEmail] = useState(null);
      const [searchQuery, setSearchQuery] = useState('');
      const [searching, setSearching] = useState(false);
      
      useEffect(() => {
        loadData();
      }, [view]);
      
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
            const data = await apiCall(url);
            setEmails(data.emails || data.drafts || []);
          }
        } catch (error) {
          console.error('Load error:', error);
        } finally {
          setLoading(false);
        }
      };
      
      const handleSearch = async () => {
        if (!searchQuery.trim()) {
          loadData();
          return;
        }
        
        setSearching(true);
        try {
          const data = await apiCall('/api/email/search', {
            method: 'POST',
            body: JSON.stringify({ 
              query: searchQuery,
              userEmail: getUser()
            })
          });
          setEmails(data.results || []);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setSearching(false);
        }
      };
      
      const handleSendEmail = async (to, subject, body) => {
        try {
          const data = await apiCall('/api/email/send', {
            method: 'POST',
            body: JSON.stringify({ to, subject, body, useAI: true })
          });
          
          if (data.success) {
            alert('✅ ' + data.message);
            setShowCompose(false);
            loadData();
          } else {
            alert('❌ Failed to send: ' + data.error);
          }
        } catch (error) {
          alert('❌ Error sending email: ' + error.message);
        }
      };
      
      const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        window.location.href = '/login';
      };
      
      return h('div', { style: styles.container },
        // Header
        h('header', { style: styles.header },
          h('div', { style: styles.headerLeft },
            h('h1', { style: styles.logo }, '✉️ InvestMail AI'),
            h('div', { style: styles.searchBox },
              h('input', {
                type: 'text',
                placeholder: '🤖 AI Semantic Search (type anything...)',
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                onKeyPress: (e) => e.key === 'Enter' && handleSearch(),
                style: styles.searchInput
              }),
              h('button', {
                onClick: handleSearch,
                disabled: searching,
                style: styles.searchButton
              }, searching ? '🔍...' : '🔍 Search')
            )
          ),
          h('div', { style: styles.headerRight },
            h('button', {
              onClick: () => setShowCompose(true),
              style: styles.composeBtn
            }, '✍️ Compose AI'),
            h('button', {
              onClick: handleLogout,
              style: styles.logoutBtn
            }, '🚪 Logout')
          )
        ),
        
        // Main content
        h('div', { style: styles.main },
          // Sidebar
          h('aside', { style: styles.sidebar },
            ['inbox', 'sent', 'drafts', 'archived', 'spam', 'trash'].map(v =>
              h('button', {
                key: v,
                onClick: () => setView(v),
                style: {
                  ...styles.navBtn,
                  ...(view === v && styles.navBtnActive)
                }
              }, 
                getIcon(v) + ' ' + capitalize(v) + 
                (v === 'inbox' ? ` (${emails.filter(e => !e.is_read).length})` : '')
              )
            )
          ),
          
          // Email list
          h('div', { style: styles.emailList },
            loading ? 
              h('div', { style: styles.loading }, '⏳ Loading emails...') :
            emails.length === 0 ?
              h('div', { style: styles.empty }, '📭 No emails found') :
            emails.map(email =>
              h('div', {
                key: email.id,
                onClick: () => setSelectedEmail(email),
                style: {
                  ...styles.emailItem,
                  ...(email.is_read === 0 && styles.emailItemUnread),
                  ...(selectedEmail?.id === email.id && styles.emailItemSelected)
                }
              },
                h('div', { style: styles.emailHeader },
                  h('span', { style: styles.emailFrom }, 
                    view === 'sent' ? '→ ' + email.to_email : '← ' + email.from_email
                  ),
                  h('span', { style: styles.emailDate }, formatDate(email.received_at || email.sent_at))
                ),
                h('div', { style: styles.emailSubject }, email.subject),
                h('div', { style: styles.emailSnippet }, email.snippet || email.body_text?.substring(0, 100)),
                email.category && h('span', { 
                  style: styles.categoryBadge 
                }, '🏷️ ' + email.category),
                email.sentiment && h('span', {
                  style: styles.sentimentBadge
                }, getSentimentIcon(email.sentiment) + ' ' + email.sentiment),
                email.priority > 0 && h('span', {
                  style: styles.priorityBadge
                }, '⚠️ Priority: ' + email.priority)
              )
            )
          ),
          
          // Email detail
          selectedEmail && h(EmailDetail, {
            email: selectedEmail,
            onClose: () => setSelectedEmail(null),
            onReply: (text) => {
              setShowCompose(true);
              // Pre-fill reply
            }
          })
        ),
        
        // Compose modal
        showCompose && h(ComposeModalAI, {
          onClose: () => setShowCompose(false),
          onSend: handleSendEmail
        })
      );
    }
    
    function EmailDetail({ email, onClose, onReply }) {
      const [smartReplies, setSmartReplies] = useState([]);
      const [loadingReplies, setLoadingReplies] = useState(false);
      
      useEffect(() => {
        loadSmartReplies();
      }, [email.id]);
      
      const loadSmartReplies = async () => {
        setLoadingReplies(true);
        try {
          // Note: Need to implement this endpoint
          const response = await fetch('/api/email/smart-replies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ emailBody: email.body_text })
          });
          const data = await response.json();
          if (data.success) {
            setSmartReplies(data.replies || []);
          }
        } catch (error) {
          console.error('Failed to load smart replies:', error);
        } finally {
          setLoadingReplies(false);
        }
      };
      
      return h('div', { style: styles.detailPanel },
        h('div', { style: styles.detailHeader },
          h('h2', { style: styles.detailSubject }, email.subject),
          h('button', {
            onClick: onClose,
            style: styles.closeBtn
          }, '✕')
        ),
        h('div', { style: styles.detailMeta },
          h('div', null, h('strong', null, 'From: '), email.from_email),
          h('div', null, h('strong', null, 'To: '), email.to_email),
          h('div', null, h('strong', null, 'Date: '), formatDate(email.received_at || email.sent_at))
        ),
        
        // AI features
        email.ai_summary && h('div', { style: styles.aiSummary },
          h('strong', null, '🤖 AI Summary: '),
          email.ai_summary
        ),
        
        email.action_items && h('div', { style: styles.actionItems },
          h('strong', null, '✅ Action Items:'),
          h('ul', null, 
            JSON.parse(email.action_items).map((item, i) =>
              h('li', { key: i }, item)
            )
          )
        ),
        
        h('div', { style: styles.detailBody }, email.body_text || email.body_html),
        
        // Smart replies
        smartReplies.length > 0 && h('div', { style: styles.smartReplies },
          h('strong', null, '💡 Smart Replies:'),
          smartReplies.map((reply, i) =>
            h('button', {
              key: i,
              onClick: () => onReply(reply),
              style: styles.smartReplyBtn
            }, reply)
          )
        )
      );
    }
    
    function ComposeModalAI({ onClose, onSend }) {
      const [to, setTo] = useState('');
      const [subject, setSubject] = useState('');
      const [body, setBody] = useState('');
      const [showAI, setShowAI] = useState(false);
      const [aiAction, setAiAction] = useState('improve');
      const [aiTone, setAiTone] = useState('professional');
      const [aiLoading, setAiLoading] = useState(false);
      
      const handleAIAssist = async () => {
        if (!body.trim()) {
          alert('Please write some text first');
          return;
        }
        
        setAiLoading(true);
        try {
          const data = await apiCall('/api/email/compose-assist', {
            method: 'POST',
            body: JSON.stringify({
              action: aiAction,
              text: body,
              tone: aiTone,
              context: subject
            })
          });
          
          if (data.success) {
            setBody(data.text);
          } else {
            alert('AI assist failed: ' + data.error);
          }
        } catch (error) {
          alert('AI error: ' + error.message);
        } finally {
          setAiLoading(false);
        }
      };
      
      const handleSend = () => {
        if (!to || !subject || !body) {
          alert('Please fill all fields');
          return;
        }
        onSend(to, subject, body);
      };
      
      return h('div', { 
        onClick: onClose, 
        style: styles.modal 
      },
        h('div', {
          onClick: (e) => e.stopPropagation(),
          style: styles.modalContent
        },
          h('div', { style: styles.modalHeader },
            h('h2', null, '✍️ Compose with AI'),
            h('button', { onClick: onClose, style: styles.closeBtn }, '✕')
          ),
          
          // To field
          h('div', { style: styles.formGroup },
            h('label', null, 'To:'),
            h('input', {
              type: 'email',
              value: to,
              onChange: (e) => setTo(e.target.value),
              placeholder: 'recipient@example.com',
              style: styles.input
            })
          ),
          
          // Subject field
          h('div', { style: styles.formGroup },
            h('label', null, 'Subject:'),
            h('input', {
              type: 'text',
              value: subject,
              onChange: (e) => setSubject(e.target.value),
              placeholder: 'Email subject',
              style: styles.input
            })
          ),
          
          // AI Toolbar
          h('div', { style: styles.aiToolbar },
            h('button', {
              onClick: () => setShowAI(!showAI),
              style: styles.aiToggleBtn
            }, showAI ? '🤖 Hide AI Tools' : '🤖 Show AI Tools'),
            
            showAI && h('div', { style: styles.aiControls },
              h('select', {
                value: aiAction,
                onChange: (e) => setAiAction(e.target.value),
                style: styles.select
              },
                h('option', { value: 'improve' }, '✨ Improve'),
                h('option', { value: 'expand' }, '📝 Expand'),
                h('option', { value: 'summarize' }, '📊 Summarize'),
                h('option', { value: 'reply' }, '↩️ Generate Reply'),
                h('option', { value: 'translate' }, '🌐 Translate')
              ),
              
              h('select', {
                value: aiTone,
                onChange: (e) => setAiTone(e.target.value),
                style: styles.select
              },
                h('option', { value: 'professional' }, '💼 Professional'),
                h('option', { value: 'friendly' }, '😊 Friendly'),
                h('option', { value: 'formal' }, '👔 Formal'),
                h('option', { value: 'casual' }, '👋 Casual'),
                h('option', { value: 'persuasive' }, '🎯 Persuasive')
              ),
              
              h('button', {
                onClick: handleAIAssist,
                disabled: aiLoading,
                style: styles.aiActionBtn
              }, aiLoading ? '⏳ Processing...' : '🚀 Apply AI')
            )
          ),
          
          // Body field
          h('div', { style: styles.formGroup },
            h('label', null, 'Message:'),
            h('textarea', {
              value: body,
              onChange: (e) => setBody(e.target.value),
              placeholder: 'Write your email here... Use AI tools to enhance it!',
              style: styles.textarea,
              rows: 12
            })
          ),
          
          // Send button
          h('div', { style: styles.modalFooter },
            h('button', {
              onClick: handleSend,
              style: styles.sendBtn
            }, '📧 Send Email'),
            h('button', {
              onClick: onClose,
              style: styles.cancelBtn
            }, 'Cancel')
          )
        )
      );
    }
    
    // Helper functions
    function getIcon(view) {
      const icons = {
        inbox: '📥',
        sent: '📤',
        drafts: '📝',
        archived: '📦',
        spam: '🚫',
        trash: '🗑️'
      };
      return icons[view] || '📧';
    }
    
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    }
    
    function getSentimentIcon(sentiment) {
      const icons = {
        positive: '😊',
        neutral: '😐',
        negative: '😟',
        urgent: '🚨'
      };
      return icons[sentiment] || '📧';
    }
    
    // Styles
    const styles = {
      container: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
        color: '#fff',
        fontFamily: 'Inter, sans-serif'
      },
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        background: 'rgba(26, 31, 46, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201, 169, 98, 0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      },
      headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        flex: 1
      },
      logo: {
        margin: 0,
        fontSize: '24px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #C9A962 0%, #f5e6d3 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      },
      searchBox: {
        display: 'flex',
        gap: '10px',
        flex: 1,
        maxWidth: '600px'
      },
      searchInput: {
        flex: 1,
        padding: '12px 20px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none'
      },
      searchButton: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      headerRight: {
        display: 'flex',
        gap: '15px'
      },
      composeBtn: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(201, 169, 98, 0.3)',
        transition: 'all 0.2s'
      },
      logoutBtn: {
        padding: '12px 24px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      main: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      },
      sidebar: {
        width: '250px',
        background: 'rgba(26, 31, 46, 0.5)',
        borderRight: '1px solid rgba(201, 169, 98, 0.1)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto'
      },
      navBtn: {
        padding: '14px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s'
      },
      navBtnActive: {
        background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.2) 0%, rgba(139, 115, 85, 0.2) 100%)',
        borderColor: 'rgba(201, 169, 98, 0.4)',
        color: '#C9A962',
        fontWeight: '600'
      },
      emailList: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        background: 'rgba(15, 20, 25, 0.3)'
      },
      emailItem: {
        padding: '18px 22px',
        marginBottom: '12px',
        background: 'rgba(26, 31, 46, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      emailItemUnread: {
        background: 'rgba(201, 169, 98, 0.08)',
        borderColor: 'rgba(201, 169, 98, 0.2)',
        fontWeight: '600'
      },
      emailItemSelected: {
        background: 'rgba(201, 169, 98, 0.15)',
        borderColor: 'rgba(201, 169, 98, 0.4)',
        transform: 'translateX(4px)'
      },
      emailHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '13px'
      },
      emailFrom: {
        color: '#C9A962',
        fontWeight: '600'
      },
      emailDate: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '12px'
      },
      emailSubject: {
        fontSize: '15px',
        fontWeight: '600',
        marginBottom: '6px',
        color: 'rgba(255, 255, 255, 0.9)'
      },
      emailSnippet: {
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: '1.5',
        marginBottom: '10px'
      },
      categoryBadge: {
        display: 'inline-block',
        padding: '4px 10px',
        background: 'rgba(201, 169, 98, 0.1)',
        border: '1px solid rgba(201, 169, 98, 0.2)',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#C9A962',
        marginRight: '8px'
      },
      sentimentBadge: {
        display: 'inline-block',
        padding: '4px 10px',
        background: 'rgba(100, 200, 255, 0.1)',
        border: '1px solid rgba(100, 200, 255, 0.2)',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#64c8ff',
        marginRight: '8px'
      },
      priorityBadge: {
        display: 'inline-block',
        padding: '4px 10px',
        background: 'rgba(255, 100, 100, 0.1)',
        border: '1px solid rgba(255, 100, 100, 0.2)',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#ff6464'
      },
      loading: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.5)'
      },
      empty: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.5)'
      },
      detailPanel: {
        width: '600px',
        background: 'rgba(26, 31, 46, 0.8)',
        borderLeft: '1px solid rgba(201, 169, 98, 0.1)',
        padding: '30px',
        overflowY: 'auto'
      },
      detailHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '20px'
      },
      detailSubject: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#C9A962',
        margin: 0,
        flex: 1,
        paddingRight: '20px'
      },
      closeBtn: {
        width: '32px',
        height: '32px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '18px'
      },
      detailMeta: {
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '10px',
        fontSize: '14px',
        lineHeight: '1.8',
        color: 'rgba(255, 255, 255, 0.7)'
      },
      aiSummary: {
        padding: '15px',
        background: 'rgba(100, 200, 255, 0.08)',
        border: '1px solid rgba(100, 200, 255, 0.2)',
        borderRadius: '10px',
        marginBottom: '20px',
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'rgba(255, 255, 255, 0.8)'
      },
      actionItems: {
        padding: '15px',
        background: 'rgba(100, 255, 150, 0.08)',
        border: '1px solid rgba(100, 255, 150, 0.2)',
        borderRadius: '10px',
        marginBottom: '20px',
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.8)'
      },
      detailBody: {
        fontSize: '15px',
        lineHeight: '1.8',
        color: 'rgba(255, 255, 255, 0.85)',
        whiteSpace: 'pre-wrap',
        padding: '20px 0'
      },
      smartReplies: {
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(201, 169, 98, 0.08)',
        border: '1px solid rgba(201, 169, 98, 0.2)',
        borderRadius: '10px'
      },
      smartReplyBtn: {
        display: 'block',
        width: '100%',
        padding: '12px',
        marginTop: '10px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s'
      },
      modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      },
      modalContent: {
        width: '800px',
        maxWidth: '90%',
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 41, 0.98) 100%)',
        backdropFilter: 'blur(40px)',
        borderRadius: '20px',
        padding: '30px',
        border: '1px solid rgba(201, 169, 98, 0.2)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        overflowY: 'auto'
      },
      modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
      },
      formGroup: {
        marginBottom: '20px'
      },
      input: {
        width: '100%',
        padding: '14px 18px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '15px',
        fontFamily: 'inherit',
        outline: 'none',
        marginTop: '8px'
      },
      textarea: {
        width: '100%',
        padding: '14px 18px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '15px',
        fontFamily: 'inherit',
        outline: 'none',
        marginTop: '8px',
        resize: 'vertical'
      },
      aiToolbar: {
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(201, 169, 98, 0.08)',
        border: '1px solid rgba(201, 169, 98, 0.2)',
        borderRadius: '12px'
      },
      aiToggleBtn: {
        width: '100%',
        padding: '12px',
        background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
      },
      aiControls: {
        display: 'flex',
        gap: '12px',
        marginTop: '15px'
      },
      select: {
        flex: 1,
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none',
        cursor: 'pointer'
      },
      aiActionBtn: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      },
      modalFooter: {
        display: 'flex',
        gap: '12px',
        marginTop: '25px'
      },
      sendBtn: {
        flex: 1,
        padding: '14px',
        background: 'linear-gradient(135deg, #C9A962 0%, #8B7355 100%)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(201, 169, 98, 0.3)'
      },
      cancelBtn: {
        padding: '14px 30px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
      }
    };
    
    // Mount app
    const root = document.getElementById('email-root');
    if (root) {
      ReactDOM.render(h(EmailApp), root);
      console.log('✅ AI-Powered InvestMail loaded successfully!');
    } else {
      console.error('❌ Root element not found');
    }
  }
  
  initApp();
});
