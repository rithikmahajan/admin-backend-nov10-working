import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  Search,
  Mail,
  Star,
  Send,
  FileText,
  AlertTriangle,
  Trash2,
  Plus,
  MoreHorizontal,
  Archive,
  Reply,
  Forward,
  ArrowLeft,
  Paperclip,
  RefreshCw,
  Filter,
  X,
  Check,
  Eye,
  EyeOff,
  MessageCircle,
  Phone,
  Users,
  Clock,
  Smile,
  Image,
  Mic,
  Settings,
} from "lucide-react";

// Redux imports
import {
  getFolderCounts,
  getMessages,
  getMessage,
  sendMessage,
  replyToMessage,
  updateMessageStatus,
  bulkUpdateMessages,
  deleteMessage,
  getThreadMessages,
  setActiveFolder,
  setSearchQuery,
  toggleMessageSelection,
  selectAllMessages,
  clearSelectedMessages,
  setSelectedMessage,
  clearSelectedMessage,
  showComposeModal,
  hideComposeModal,
  updateComposeData,
  setFilters,
  clearFilters,
  clearError,
  // Selectors
  selectInboxState,
  selectMessages,
  selectSelectedMessage,
  selectActiveFolder,
  selectSelectedMessages,
  selectFolderCounts,
  selectInboxLoading,
  selectInboxError,
  selectPagination,
  selectComposeModal,
  selectFilters,
} from "../store/slices/inboxSlice";

// Chat Service Configuration
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:8001' 
  : 'https://your-production-api.com';

// Chat API Service
const chatAPI = {
  createSession: async (userInfo, sessionContext) => {
    const response = await axios.post(`${API_BASE_URL}/api/chat/session`, {
      userInfo,
      sessionContext
    }, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  sendMessage: async (sessionId, message, messageType = 'text', attachments = []) => {
    const response = await axios.post(`${API_BASE_URL}/api/chat/message`, {
      sessionId,
      message,
      messageType,
      attachments
    }, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  getMessages: async (sessionId, after = null, limit = 50) => {
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    if (limit) params.append('limit', limit);
    
    const response = await axios.get(`${API_BASE_URL}/api/chat/messages/${sessionId}?${params}`, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      }
    });
    return response.data;
  },
  
  pollForMessages: async (sessionId, after = null) => {
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    
    const response = await axios.get(`${API_BASE_URL}/api/chat/poll/${sessionId}?${params}`, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      }
    });
    return response.data;
  },
  
  endSession: async (sessionId, rating = null, feedback = '') => {
    const response = await axios.post(`${API_BASE_URL}/api/chat/session/end`, {
      sessionId,
      rating,
      feedback
    }, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  submitRating: async (sessionId, rating, feedback = '', categories = {}) => {
    const response = await axios.post(`${API_BASE_URL}/api/chat/rating`, {
      sessionId,
      rating,
      feedback,
      categories
    }, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  validateSession: async (sessionId) => {
    const response = await axios.get(`${API_BASE_URL}/api/chat/session/${sessionId}`, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  getChatHistory: async (page = 1, limit = 10) => {
    const response = await axios.get(`${API_BASE_URL}/api/chat/history?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      }
    });
    return response.data;
  },

  // Admin-specific API functions
  admin: {
    getActiveSessions: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/chat/admin/active-sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },

    getSessionDetails: async (sessionId) => {
      const response = await axios.get(`${API_BASE_URL}/api/chat/admin/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },

    sendMessage: async (sessionId, message, messageType = 'text') => {
      const response = await axios.post(`${API_BASE_URL}/api/chat/admin/message`, {
        sessionId,
        message,
        messageType,
        sender: 'admin'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },

    endSession: async (sessionId, reason = 'completed') => {
      const response = await axios.post(`${API_BASE_URL}/api/chat/admin/session/${sessionId}/end`, {
        reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    }
  }
};

// Compose Modal Component
const ComposeModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { data: composeData } = useSelector(selectComposeModal);
  const loading = useSelector(selectInboxLoading);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(sendMessage(composeData));
  };

  const handleInputChange = (field, value) => {
    dispatch(updateComposeData({ [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Compose Message</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="email"
                value={composeData.recipientEmail}
                onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="recipient@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                value={composeData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Recipient Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter subject"
                required
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={composeData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Primary">Primary</option>
                  <option value="Social">Social</option>
                  <option value="Work">Work</option>
                  <option value="Friends">Friends</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={composeData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={composeData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Type your message here..."
                required
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reply Modal Component
const ReplyModal = ({ message, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectInboxLoading);
  const [replyContent, setReplyContent] = useState('');
  const [priority, setPriority] = useState('normal');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (replyContent.trim()) {
      dispatch(replyToMessage({
        messageId: message.id,
        content: replyContent,
        priority
      }));
      setReplyContent('');
      onClose();
    }
  };

  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reply to Message</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-500 mb-2">Replying to:</div>
            <div className="font-medium text-gray-900">{message.subject}</div>
            <div className="text-sm text-gray-600">From: {message.sender}</div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reply
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Type your reply here..."
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Reply size={16} />
                )}
                Send Reply
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


// Star Rating Component
const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition-colors ${
            (hoverRating || rating) >= star 
              ? 'text-yellow-400' 
              : 'text-gray-300'
          } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-400'}`}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          onClick={() => !readOnly && onRatingChange(star)}
          disabled={readOnly}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// Chat Rating Modal Component
const ChatRatingModal = ({ isOpen, onClose, onSubmit, sessionId }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [categories, setCategories] = useState({
    responsiveness: 0,
    helpfulness: 0,
    friendliness: 0,
    knowledgeability: 0,
    problemResolution: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit(sessionId, rating, feedback, categories);
      onClose();
    }
  };

  const handleCategoryRating = (category, value) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rate Your Experience</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating
              </label>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Ratings
              </label>
              <div className="space-y-3">
                {Object.entries(categories).map(([category, value]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <StarRating 
                      rating={value} 
                      onRatingChange={(val) => handleCategoryRating(category, val)} 
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Tell us about your experience..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={rating === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Rating
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Chat Message Component
const ChatMessage = ({ message, isOwnMessage, timestamp, sender, avatar }) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs md:max-w-md`}>
        {!isOwnMessage && (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
            {avatar || sender?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        )}
        
        <div className={`px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm">{message}</p>
          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        {isOwnMessage && (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
            You
          </div>
        )}
      </div>
    </div>
  );
};

// Real-time Chat Interface Component for Admin
const ChatInterface = ({ onClose, session = null }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [authError, setAuthError] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session when component mounts
  useEffect(() => {
    initializeChatSession();
  }, []);

  // Clean up polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const initializeChatSession = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthError(true);
        setIsLoading(false);
        return;
      }
      
      // If admin is connecting to a specific customer session
      if (session) {
        console.log('🔗 Admin connecting to customer session:', session.sessionId);
        setSessionId(session.sessionId);
        setIsConnected(true);
        
        // Load initial messages for the customer session
        await loadMessages(session.sessionId);
        
        // Start polling for new messages
        startPolling(session.sessionId);
        return;
      }
      
      // If no specific session provided, this shouldn't happen for admin
      console.warn('⚠️ No session provided for admin chat interface');
      setAuthError(true);
      
    } catch (error) {
      console.error('Error initializing chat session:', error);
      setAuthError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sessionId, after = null) => {
    try {
      const response = await chatAPI.getMessages(sessionId, after);
      if (response.success) {
        setMessages(response.data.messages);
        if (response.data.messages.length > 0) {
          setLastMessageId(response.data.messages[response.data.messages.length - 1].messageId);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startPolling = (sessionId) => {
    pollingRef.current = setInterval(async () => {
      try {
        const response = await chatAPI.pollForMessages(sessionId, lastMessageId);
        if (response.success) {
          if (response.data.messages.length > 0) {
            setMessages(prev => [...prev, ...response.data.messages]);
            setLastMessageId(response.data.messages[response.data.messages.length - 1].messageId);
          }
          
          if (response.data.sessionEnded) {
            setSessionEnded(true);
            setShowRatingModal(true);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      // Use admin API to send message
      const response = await chatAPI.admin.sendMessage(sessionId, messageToSend);
      if (response.success) {
        console.log('✅ Admin message sent successfully');
        // Message will be added via polling or can be added immediately
        const newMsg = {
          messageId: response.data.messageId || `msg_${Date.now()}`,
          sessionId: sessionId,
          message: messageToSend,
          sender: 'admin',
          senderInfo: {
            name: 'Support Agent',
            avatar: 'SA'
          },
          timestamp: new Date(),
          messageType: 'text'
        };
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error('❌ Error sending admin message:', error);
      // Re-add message to input on error
      setNewMessage(messageToSend);
    }
  };

  const handleEndChat = async () => {
    if (!sessionId) return;

    try {
      // Use admin API to end session
      await chatAPI.admin.endSession(sessionId, 'ended_by_admin');
      setSessionEnded(true);
      
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      // Close the chat interface
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error ending chat session:', error);
    }
  };

  const handleRatingSubmit = async (sessionId, rating, feedback, categories) => {
    try {
      await chatAPI.submitRating(sessionId, rating, feedback, categories);
      setShowRatingModal(false);
      
      // Clear the stored session ID after rating is submitted
      localStorage.removeItem('activeChatSessionId');
      
      // Reset chat state
      setMessages([]);
      setSessionId(null);
      setIsConnected(false);
      
      // Optionally close the chat interface after rating
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-1 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <MessageCircle size={20} />
            <div>
              <h3 className="font-semibold">Customer Support</h3>
              <p className="text-xs text-blue-100">
                {isConnected ? 'Connected' : 'Connecting...'}
                {sessionId && ` • Session: ${sessionId.slice(-8)}`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
          {!sessionEnded && (
            <button
              onClick={handleEndChat}
              className="text-white hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              End Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {authError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 text-lg font-medium mb-2">Authentication Required</div>
              <div className="text-gray-500 mb-4">Please log in to start a chat session with our support team.</div>
              <button 
                onClick={() => {
                  // Navigate to login page or show login modal
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Log In
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Connecting to support...</div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.messageId || index}
                message={msg.message}
                isOwnMessage={msg.sender === 'user'}
                timestamp={msg.timestamp}
                sender={msg.senderInfo?.name}
                avatar={msg.senderInfo?.avatar}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {!sessionEnded && isConnected && !authError && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                disabled={sessionEnded}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Smile size={18} />
              </button>
            </div>
            
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <Paperclip size={18} />
            </button>
            
            <button
              type="submit"
              disabled={!newMessage.trim() || sessionEnded}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Session Ended Message */}
      {sessionEnded && (
        <div className="border-t border-gray-200 p-4 bg-yellow-50">
          <div className="text-center text-yellow-800">
            <p className="font-medium">Chat session has ended</p>
            <p className="text-sm">Thank you for contacting our support team!</p>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <ChatRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        sessionId={sessionId}
      />
    </div>
  );
};

const Inbox = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const inboxState = useSelector(selectInboxState);
  const messages = useSelector(selectMessages);
  const selectedMessage = useSelector(selectSelectedMessage);
  const activeFolder = useSelector(selectActiveFolder);
  const selectedMessages = useSelector(selectSelectedMessages);
  const folderCounts = useSelector(selectFolderCounts);
  const loading = useSelector(selectInboxLoading);
  const error = useSelector(selectInboxError);
  const pagination = useSelector(selectPagination);
  const composeModal = useSelector(selectComposeModal);
  const filters = useSelector(selectFilters);

  // Local state
  const [searchQuery, setSearchQueryLocal] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showActiveChatSessions, setShowActiveChatSessions] = useState(false);
  const [activeChatSessions, setActiveChatSessions] = useState([]);
  const [activeSessionsLoading, setActiveSessionsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    dispatch(getFolderCounts());
    dispatch(getMessages({ folder: activeFolder }));
  }, [dispatch, activeFolder]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      dispatch(setSearchQuery(searchQuery));
      dispatch(getMessages({ 
        folder: activeFolder, 
        search: searchQuery,
        ...filters
      }));
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, dispatch, activeFolder, filters]);

  // Error handling
  useEffect(() => {
    if (error) {
      console.error('Inbox error:', error);
      // You can add toast notification here
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);

  // Load active customer chat sessions
  const loadActiveChatSessions = async () => {
    try {
      setActiveSessionsLoading(true);
      console.log('🔄 Loading active chat sessions...');
      
      // Use the chatAPI admin function
      const response = await chatAPI.admin.getActiveSessions();
      console.log('📊 Active chat sessions response:', response);
      
      if (response.success) {
        const sessions = response.data.sessions || [];
        console.log(`✅ Found ${sessions.length} active sessions`);
        setActiveChatSessions(sessions);
      } else {
        console.error('❌ Failed to load active sessions:', response.message);
        setActiveChatSessions([]);
      }
    } catch (error) {
      console.error('❌ Error loading active chat sessions:', error);
      setActiveChatSessions([]);
    } finally {
      setActiveSessionsLoading(false);
    }
  };

  // Load chat history when requested
  const loadChatHistory = async () => {
    try {
      setChatHistoryLoading(true);
      const response = await chatAPI.getChatHistory(1, 20);
      if (response.success) {
        setChatHistory(response.data.sessions);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setChatHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showChatHistory) {
      loadChatHistory();
    }
  }, [showChatHistory]);

  useEffect(() => {
    if (showActiveChatSessions) {
      loadActiveChatSessions();
    }
  }, [showActiveChatSessions]);

  const sidebarItems = [
    { id: "inbox", icon: Mail, label: "Inbox", count: folderCounts.inbox?.total || 0 },
    { id: "starred", icon: Star, label: "Starred", count: folderCounts.starred?.total || 0 },
    { id: "sent", icon: Send, label: "Sent", count: folderCounts.sent?.total || 0 },
    { id: "draft", icon: FileText, label: "Draft", count: folderCounts.draft?.total || 0 },
    { id: "spam", icon: AlertTriangle, label: "Spam", count: folderCounts.spam?.total || 0 },
    { id: "important", icon: Mail, label: "Important", count: folderCounts.important?.total || 0 },
    { id: "bin", icon: Trash2, label: "Bin", count: folderCounts.bin?.total || 0 },
  ];

  const chatActions = [
    { 
      id: "chat-history", 
      icon: Clock, 
      label: "Chat History", 
      action: () => setShowChatHistory(true),
      color: "text-green-600 hover:text-green-700 hover:bg-green-50"
    },
    { 
      id: "active-chats", 
      icon: MessageCircle, 
      label: "Active Customer Chats", 
      action: () => {
        // Show active customer chat sessions
        setShowActiveChatSessions(true);
      },
      color: "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    },
  ];

  const labels = [
    { name: "Primary", color: "bg-cyan-500", textColor: "text-cyan-700" },
    { name: "Social", color: "bg-blue-500", textColor: "text-blue-700" },
    { name: "Work", color: "bg-purple-500", textColor: "text-purple-700" },
    { name: "Friends", color: "bg-pink-500", textColor: "text-pink-700" },
    { name: "Support", color: "bg-green-500", textColor: "text-green-700" },
  ];

  const handleFolderClick = (folderId) => {
    dispatch(setActiveFolder(folderId));
    dispatch(clearSelectedMessages());
    dispatch(clearSelectedMessage());
  };

  const handleMessageClick = (message) => {
    dispatch(setSelectedMessage(message));
    // Mark as read if unread
    if (message.unread) {
      dispatch(updateMessageStatus({
        messageId: message.id,
        updates: { status: 'read' }
      }));
    }
  };

  const handleMessageSelection = (messageId, e) => {
    e.stopPropagation();
    dispatch(toggleMessageSelection(messageId));
  };

  const handleSelectAllMessages = () => {
    if (selectedMessages.length === messages.length) {
      dispatch(clearSelectedMessages());
    } else {
      dispatch(selectAllMessages());
    }
  };

  const handleBulkAction = (action) => {
    if (selectedMessages.length > 0) {
      dispatch(bulkUpdateMessages({
        messageIds: selectedMessages,
        action
      }));
    }
  };

  const handleStarMessage = (messageId, isStarred) => {
    dispatch(updateMessageStatus({
      messageId,
      updates: { isStarred: !isStarred }
    }));
  };

  const handleReplyMessage = (message) => {
    setReplyingToMessage(message);
    setShowReplyModal(true);
  };

  const handleRefresh = () => {
    dispatch(getFolderCounts());
    dispatch(getMessages({ folder: activeFolder, ...filters }));
  };

  const getTagColor = (tag) => {
    const label = labels.find((l) => l.name === tag);
    return label ? label.color : "bg-gray-500";
  };

  const getViewTitle = () => {
    const item = sidebarItems.find((item) => item.id === activeFolder);
    return item ? item.label : "Inbox";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Message detail view
  if (selectedMessage) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-72 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6">
            <button 
              onClick={() => dispatch(showComposeModal())}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus size={18} />
              Compose
            </button>
          </div>

          <nav className="px-3">
            <ul className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeFolder === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleFolderClick(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={
                            isActive ? "text-blue-600" : "text-gray-500"
                          }
                        />
                        <span
                          className={`font-medium ${
                            isActive ? "text-blue-700" : ""
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Customer Support Section */}
          <div className="px-3 mt-6 border-t border-gray-200 pt-6">
            <div className="mb-3 px-3">
              <h4 className="font-semibold text-gray-900 text-sm">Customer Support</h4>
              <p className="text-xs text-gray-500 mt-1">Manage customer conversations</p>
            </div>
            <ul className="space-y-1">
              {chatActions.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.id}>
                    <button
                      onClick={action.action}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${action.color}`}
                    >
                      <Icon size={18} />
                      <span className="font-medium text-sm">{action.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="px-6 mt-8">
            <h4 className="font-semibold text-gray-900 mb-3">Labels</h4>
            <ul className="space-y-2">
              {labels.map((label, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                  <span className={`text-sm font-medium ${label.textColor}`}>
                    {label.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Message Detail View */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <header className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => dispatch(clearSelectedMessage())}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {selectedMessage.subject}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority?.toUpperCase()}
                  </span>
                  {selectedMessage.messageType && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {selectedMessage.messageType.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleStarMessage(selectedMessage.id, selectedMessage.starred)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Star size={18} className={selectedMessage.starred ? "fill-yellow-500 text-yellow-500" : ""} />
                </button>
                <button 
                  onClick={() => dispatch(updateMessageStatus({
                    messageId: selectedMessage.id,
                    updates: { folder: 'archived' }
                  }))}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Archive size={18} />
                </button>
                <button 
                  onClick={() => dispatch(updateMessageStatus({
                    messageId: selectedMessage.id,
                    updates: { folder: 'bin' }
                  }))}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
          </header>

          {/* Message Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Message Header */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {selectedMessage.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedMessage.sender}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedMessage.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {selectedMessage.date}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedMessage.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getTagColor(
                          selectedMessage.tag
                        )}`}
                      >
                        {selectedMessage.tag}
                      </span>
                      {selectedMessage.important && (
                        <Star
                          size={14}
                          className="text-yellow-500 fill-current"
                        />
                      )}
                      {selectedMessage.attachments?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Paperclip size={12} />
                          {selectedMessage.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {selectedMessage.content}
                  </div>
                </div>
                
                {/* Attachments */}
                {selectedMessage.attachments?.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                          <Paperclip size={16} className="text-gray-400" />
                          <span className="flex-1 text-sm text-gray-700">{attachment.fileName}</span>
                          <span className="text-xs text-gray-500">{attachment.fileSize}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Actions */}
              <div className="flex items-center gap-3 mt-6">
                <button 
                  onClick={() => handleReplyMessage(selectedMessage)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Reply size={16} />
                  Reply
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Forward size={16} />
                  Forward
                </button>
                <button 
                  onClick={() => dispatch(updateMessageStatus({
                    messageId: selectedMessage.id,
                    updates: { isImportant: !selectedMessage.important }
                  }))}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Star size={16} className={selectedMessage.important ? "fill-yellow-500 text-yellow-500" : ""} />
                  {selectedMessage.important ? 'Remove from Important' : 'Mark Important'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modals */}
        <ComposeModal 
          isOpen={composeModal.show} 
          onClose={() => dispatch(hideComposeModal())} 
        />
        <ReplyModal 
          message={replyingToMessage} 
          isOpen={showReplyModal} 
          onClose={() => setShowReplyModal(false)} 
        />
      </div>
    );
  }

  // Main inbox view
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6">
          <button 
            onClick={() => dispatch(showComposeModal())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus size={18} />
            Compose
          </button>
        </div>

        <nav className="px-3">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeFolder === item.id;
              const unreadCount = folderCounts[item.id]?.unread || 0;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleFolderClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={isActive ? "text-blue-600" : "text-gray-500"}
                      />
                      <span
                        className={`font-medium ${
                          isActive ? "text-blue-700" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                      {unreadCount > 0 && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {unreadCount}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.count}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Customer Support Section */}
        <div className="px-3 mt-6 border-t border-gray-200 pt-6">
          <div className="mb-3 px-3">
            <h4 className="font-semibold text-gray-900 text-sm">Customer Support</h4>
            <p className="text-xs text-gray-500 mt-1">Manage customer conversations</p>
          </div>
          <ul className="space-y-1">
            {chatActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.id}>
                  <button
                    onClick={action.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${action.color}`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm">{action.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-6 mt-8">
          <h4 className="font-semibold text-gray-900 mb-3">Labels</h4>
          <ul className="space-y-2">
            {labels.map((label, index) => (
              <li
                key={index}
                onClick={() => dispatch(setFilters({ category: label.name }))}
                className="flex items-center gap-3 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                <span className={`text-sm font-medium ${label.textColor}`}>
                  {label.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {getViewTitle()}
              </h1>
              {loading && (
                <RefreshCw size={16} className="animate-spin text-blue-600" />
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                  showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Filters"
              >
                <Filter size={18} />
              </button>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQueryLocal(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => dispatch(setFilters({ priority: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => dispatch(setFilters({ category: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All</option>
                    {labels.map(label => (
                      <option key={label.name} value={label.name}>{label.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1"></div>
                <button
                  onClick={() => {
                    dispatch(clearFilters());
                    setShowFilters(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Toolbar */}
        {selectedMessages.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-700">
                {selectedMessages.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleBulkAction('markRead')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} />
                  Mark Read
                </button>
                <button 
                  onClick={() => handleBulkAction('markUnread')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <EyeOff size={14} />
                  Mark Unread
                </button>
                <button 
                  onClick={() => handleBulkAction('star')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Star size={14} />
                  Star
                </button>
                <button 
                  onClick={() => handleBulkAction('archive')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Archive size={14} />
                  Archive
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-auto">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading messages...</h3>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No messages
                </h3>
                <p className="text-gray-500">
                  There are no messages in this folder.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white mx-6 mt-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedMessages.length === messages.length &&
                      messages.length > 0
                    }
                    onChange={handleSelectAllMessages}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {messages.filter((m) => m.unread).length} unread
                  </span>
                  {pagination.totalMessages > 0 && (
                    <span className="text-sm text-gray-500">
                      Showing {messages.length} of {pagination.totalMessages}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="divide-y divide-gray-200">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`group flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      msg.unread ? "bg-blue-25 border-l-4 border-l-blue-200" : ""
                    } ${
                      selectedMessages.includes(msg.id)
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => handleMessageClick(msg)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(msg.id)}
                      onChange={(e) => handleMessageSelection(msg.id, e)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {msg.avatar}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`font-semibold text-gray-900 truncate ${
                              msg.unread ? "font-bold" : ""
                            }`}
                          >
                            {msg.sender}
                          </span>
                          {msg.important && (
                            <Star
                              size={14}
                              className="text-yellow-500 fill-current flex-shrink-0"
                            />
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getTagColor(
                              msg.tag
                            )} flex-shrink-0`}
                          >
                            {msg.tag}
                          </span>
                          {msg.priority && msg.priority !== 'normal' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(msg.priority)} bg-opacity-10 flex-shrink-0`}>
                              {msg.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-gray-900 mb-1 truncate ${
                            msg.unread ? "font-semibold" : ""
                          }`}
                        >
                          {msg.subject}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {msg.preview}
                        </div>
                      </div>

                      {/* Time and Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {msg.time}
                          </div>
                          {msg.date !== 'Today' && (
                            <div className="text-xs text-gray-400">
                              {msg.date}
                            </div>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReplyMessage(msg);
                            }}
                            title="Reply"
                          >
                            <Reply size={16} />
                          </button>
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStarMessage(msg.id, msg.starred);
                            }}
                            title="Star"
                          >
                            <Star size={16} className={msg.starred ? "fill-yellow-500 text-yellow-500" : ""} />
                          </button>
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="More options"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dispatch(getMessages({ 
                          folder: activeFolder, 
                          page: pagination.currentPage - 1,
                          search: searchQuery,
                          ...filters 
                        }))}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => dispatch(getMessages({ 
                          folder: activeFolder, 
                          page: pagination.currentPage + 1,
                          search: searchQuery,
                          ...filters 
                        }))}
                        disabled={!pagination.hasNext}
                        className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <ComposeModal 
        isOpen={composeModal.show} 
        onClose={() => dispatch(hideComposeModal())} 
      />
      <ReplyModal 
        message={replyingToMessage} 
        isOpen={showReplyModal} 
        onClose={() => setShowReplyModal(false)} 
      />

      {/* Chat Interface */}
      {showChatInterface && (
        <ChatInterface 
          session={selectedChatSession}
          onClose={() => {
            setShowChatInterface(false);
            setSelectedChatSession(null);
          }} 
        />
      )}

      {/* Chat History Modal */}
      {showChatHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Chat History</h2>
              <button
                onClick={() => setShowChatHistory(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {chatHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading chat history...</span>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Chat History</h3>
                  <p className="text-gray-500">No previous customer chat sessions found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((session) => (
                    <div
                      key={session.sessionId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              session.status === 'ended' 
                                ? 'bg-green-100 text-green-800' 
                                : session.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              Session ID: {session.sessionId.slice(-8)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Started:</span>
                              <p className="font-medium">
                                {new Date(session.startTime).toLocaleDateString()} {' '}
                                {new Date(session.startTime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            
                            {session.endTime && (
                              <div>
                                <span className="text-gray-500">Ended:</span>
                                <p className="font-medium">
                                  {new Date(session.endTime).toLocaleDateString()} {' '}
                                  {new Date(session.endTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            )}
                            
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <p className="font-medium">
                                {session.duration 
                                  ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Messages:</span>
                              <p className="font-medium">{session.messageCount || 0}</p>
                            </div>
                          </div>
                          
                          {session.assignedAdmin && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Support Agent:</span>
                              <span className="ml-1 font-medium">{session.assignedAdmin.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {session.rating && (
                            <div className="flex items-center">
                              <StarRating rating={session.rating} readOnly={true} />
                              <span className="ml-1 text-sm text-gray-600">({session.rating}/5)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 p-4 flex justify-end items-center">
              <button
                onClick={() => setShowChatHistory(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Chat Sessions Modal */}
      {showActiveChatSessions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Customer Chats</h2>
                <p className="text-sm text-gray-500 mt-1">Ongoing customer support conversations</p>
              </div>
              <button
                onClick={() => setShowActiveChatSessions(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {activeSessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading active sessions...</span>
                </div>
              ) : activeChatSessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Chats</h3>
                  <p className="text-gray-500">No customers are currently chatting. New conversations will appear here when customers start them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeChatSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => {
                        // Open chat interface for this session
                        console.log('📞 Opening chat for session:', session);
                        setSelectedChatSession(session);
                        setShowActiveChatSessions(false);
                        setShowChatInterface(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                            <span className="text-xs text-gray-500">
                              Session: {session.sessionId?.slice(-8) || 'Unknown'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600">Live</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Customer:</span>
                              <p className="font-medium">
                                {session.userInfo?.name || session.userInfo?.email || 'Anonymous User'}
                              </p>
                              {session.userInfo?.email && (
                                <p className="text-xs text-gray-500">{session.userInfo.email}</p>
                              )}
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Started:</span>
                              <p className="font-medium">
                                {session.startTime ? new Date(session.startTime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {session.startTime ? new Date(session.startTime).toLocaleDateString() : ''}
                              </p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Messages:</span>
                              <p className="font-medium">{session.messageCount || 0}</p>
                              {session.lastMessage && (
                                <p className="text-xs text-gray-500 truncate max-w-32">
                                  Last: "{session.lastMessage.message?.substring(0, 30)}..."
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {session.waitTime && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Waiting for:</span>
                              <span className="ml-1 font-medium text-orange-600">
                                {Math.floor((Date.now() - new Date(session.lastActivity)) / 60000)}m
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowActiveChatSessions(false);
                              setShowChatInterface(true);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Join Chat
                          </button>
                          
                          {session.priority === 'high' && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              High Priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 p-4 flex justify-between items-center">
              <button
                onClick={() => setShowActiveChatSessions(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  loadActiveChatSessions();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;