/**
 * Team Collaboration UI Components
 * To be integrated into email-app-premium.js
 */

// Add these state variables to the EmailApp component:
const [comments, setComments] = useState([]);
const [activities, setActivities] = useState([]);
const [presence, setPresence] = useState([]);
const [collabStats, setCollabStats] = useState(null);
const [showCollabPanel, setShowCollabPanel] = useState(false);
const [newComment, setNewComment] = useState('');

// Add this function to load collaboration data:
const loadCollaborationData = async (emailId) => {
  try {
    const [commentsRes, activityRes, presenceRes, statsRes] = await Promise.all([
      fetch(`/api/collaboration/comments/${emailId}`),
      fetch(`/api/collaboration/activity/${emailId}`),
      fetch(`/api/collaboration/presence/${emailId}`),
      fetch(`/api/collaboration/stats/${emailId}`)
    ]);
    
    const commentsData = await commentsRes.json();
    const activityData = await activityRes.json();
    const presenceData = await presenceRes.json();
    const statsData = await statsRes.json();
    
    setComments(commentsData.comments || []);
    setActivities(activityData.activities || []);
    setPresence(presenceData.presence || []);
    setCollabStats(statsData.stats || {});
  } catch (error) {
    console.error('Load collaboration data error:', error);
  }
};

// Add comment function:
const addComment = async () => {
  if (!newComment.trim() || !selectedEmail) return;
  
  try {
    const response = await fetch('/api/collaboration/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_id: selectedEmail.id,
        author_email: user,
        author_name: 'Admin',
        comment_text: newComment,
        comment_type: 'comment'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      setNewComment('');
      loadCollaborationData(selectedEmail.id);
      alert('✅ Comment added successfully!');
    }
  } catch (error) {
    console.error('Add comment error:', error);
    alert('❌ Failed to add comment');
  }
};

// Track email view:
const trackEmailView = async (emailId) => {
  try {
    await fetch('/api/collaboration/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_id: emailId,
        user_email: user,
        user_name: 'Admin',
        activity_type: 'viewed'
      })
    });
  } catch (error) {
    console.error('Track view error:', error);
  }
};

// Update presence:
const updatePresence = async (emailId) => {
  try {
    await fetch('/api/collaboration/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_id: emailId,
        user_email: user,
        user_name: 'Admin',
        presence_type: 'viewing'
      })
    });
  } catch (error) {
    console.error('Update presence error:', error);
  }
};

// ============================================
// COLLABORATION PANEL COMPONENT
// ============================================
const CollaborationPanel = () => {
  if (!selectedEmail || !showCollabPanel) return null;
  
  return h('div', {
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
      boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.4)'
    }
  },
    // Header
    h('div', {
      style: {
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
        h('span', { style: { fontSize: '24px' } }, '👥'),
        h('h3', { 
          style: { 
            margin: 0, 
            color: '#C9A962',
            fontSize: '18px',
            fontWeight: '600'
          } 
        }, 'Team Collaboration')
      ),
      h('button', {
        onClick: () => setShowCollabPanel(false),
        style: {
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '4px 8px'
        }
      }, '✕')
    ),
    
    // Stats Bar
    h('div', {
      style: {
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }
    },
      h('div', {
        style: {
          textAlign: 'center',
          padding: '12px',
          background: 'rgba(201, 169, 98, 0.1)',
          borderRadius: '8px'
        }
      },
        h('div', { style: { fontSize: '20px', fontWeight: '700', color: '#C9A962' } }, 
          collabStats?.total_views || 0
        ),
        h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, 
          'Views'
        )
      ),
      h('div', {
        style: {
          textAlign: 'center',
          padding: '12px',
          background: 'rgba(201, 169, 98, 0.1)',
          borderRadius: '8px'
        }
      },
        h('div', { style: { fontSize: '20px', fontWeight: '700', color: '#C9A962' } }, 
          collabStats?.total_comments || 0
        ),
        h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, 
          'Comments'
        )
      ),
      h('div', {
        style: {
          textAlign: 'center',
          padding: '12px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '8px'
        }
      },
        h('div', { style: { fontSize: '20px', fontWeight: '700', color: '#22c55e' } }, 
          presence.length
        ),
        h('div', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' } }, 
          'Active'
        )
      )
    ),
    
    // Active Users
    presence.length > 0 && h('div', {
      style: {
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }
    },
      h('div', { style: { fontSize: '13px', color: '#C9A962', marginBottom: '12px', fontWeight: '600' } }, 
        '🔴 Currently Viewing'
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        presence.map((p, i) =>
          h('div', {
            key: i,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)'
            }
          },
            h('div', {
              style: {
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 2s ease-in-out infinite'
              }
            }),
            p.user_name || p.user_email,
            h('span', { style: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' } },
              ` • ${p.presence_type}`
            )
          )
        )
      )
    ),
    
    // Comments Section
    h('div', { style: { flex: 1, overflow: 'auto', padding: '20px' } },
      h('div', { style: { fontSize: '13px', color: '#C9A962', marginBottom: '16px', fontWeight: '600' } }, 
        '💬 Team Comments'
      ),
      
      // Comments List
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' } },
        comments.length === 0 ? 
          h('div', { 
            style: { 
              textAlign: 'center', 
              padding: '40px 20px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '13px'
            } 
          }, 'No comments yet. Be the first to comment!') :
          comments.map((comment, i) =>
            h('div', {
              key: comment.id || i,
              style: {
                padding: '12px',
                background: 'rgba(26, 31, 58, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px'
              }
            },
              h('div', { 
                style: { 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                } 
              },
                h('div', { 
                  style: { 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#C9A962' 
                  } 
                }, comment.author_name || comment.author_email),
                comment.priority && h('span', {
                  style: {
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: comment.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    color: comment.priority === 'high' ? '#ef4444' : '#eab308'
                  }
                }, comment.priority.toUpperCase())
              ),
              h('div', { 
                style: { 
                  fontSize: '13px', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '8px',
                  lineHeight: '1.5'
                } 
              }, comment.comment_text),
              h('div', { 
                style: { 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.4)' 
                } 
              }, new Date(comment.created_at).toLocaleString())
            )
          )
      ),
      
      // Add Comment Form
      h('div', { style: { marginTop: '20px' } },
        h('textarea', {
          value: newComment,
          onChange: (e) => setNewComment(e.target.value),
          placeholder: 'Add a team comment (private, not sent to recipient)...',
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
            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s'
          }
        }, '💬 Add Comment')
      )
    ),
    
    // Activity Log (collapsed by default)
    activities.length > 0 && h('div', {
      style: {
        padding: '16px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        maxHeight: '200px',
        overflow: 'auto'
      }
    },
      h('div', { style: { fontSize: '13px', color: '#C9A962', marginBottom: '12px', fontWeight: '600' } }, 
        '📊 Activity Log'
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        activities.slice(0, 10).map((activity, i) =>
          h('div', {
            key: activity.id || i,
            style: {
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
              gap: '8px'
            }
          },
            h('span', {}, getActivityIcon(activity.activity_type)),
            h('span', {}, `${activity.user_name || activity.user_email} ${activity.activity_type}`),
            h('span', { style: { marginLeft: 'auto', fontSize: '11px' } }, 
              new Date(activity.created_at).toLocaleTimeString()
            )
          )
        )
      )
    )
  );
};

// Helper function for activity icons
const getActivityIcon = (type) => {
  const icons = {
    viewed: '👁️',
    opened: '📖',
    replied: '↩️',
    forwarded: '➡️',
    archived: '📦',
    deleted: '🗑️',
    starred: '⭐',
    commented: '💬',
    assigned: '👤'
  };
  return icons[type] || '•';
};

// Add this to the email onClick handler:
onClick: () => {
  setSelectedEmail(email);
  setShowCollabPanel(true);
  loadCollaborationData(email.id);
  trackEmailView(email.id);
  updatePresence(email.id);
}

// Add collaboration button to email header (in the main content area):
h('button', {
  onClick: () => {
    if (selectedEmail) {
      setShowCollabPanel(!showCollabPanel);
      if (!showCollabPanel) {
        loadCollaborationData(selectedEmail.id);
      }
    }
  },
  style: {
    padding: '8px 16px',
    background: showCollabPanel ? 'linear-gradient(135deg, #C9A962 0%, #A88B4E 100%)' : 'rgba(201, 169, 98, 0.1)',
    border: '1px solid rgba(201, 169, 98, 0.3)',
    borderRadius: '8px',
    color: '#C9A962',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.3s'
  }
}, 
  '👥',
  'Team Collaboration',
  collabStats && collabStats.total_comments > 0 && h('span', {
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '700'
    }
  }, collabStats.total_comments)
)
