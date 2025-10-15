import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inboxAPI } from '../../api/endpoints';

// Initial state
const initialState = {
  // Messages data
  messages: [],
  selectedMessage: null,
  
  // UI state
  activeFolder: 'inbox',
  selectedMessages: [],
  searchQuery: '',
  loading: false,
  error: null,
  
  // Folder counts
  folderCounts: {
    inbox: { total: 0, unread: 0 },
    starred: { total: 0, unread: 0 },
    sent: { total: 0, unread: 0 },
    draft: { total: 0, unread: 0 },
    important: { total: 0, unread: 0 },
    spam: { total: 0, unread: 0 },
    bin: { total: 0, unread: 0 },
    archived: { total: 0, unread: 0 }
  },
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasNext: false,
    hasPrev: false
  },

  // Compose modal state
  showComposeModal: false,
  composeData: {
    recipientEmail: '',
    recipientName: '',
    subject: '',
    content: '',
    category: 'Primary',
    priority: 'normal'
  },

  // Thread data
  threadMessages: [],
  currentThreadId: null,

  // Filters
  filters: {
    priority: '',
    category: '',
    messageType: ''
  }
};

// Async thunks for API calls

// Get folder counts
export const getFolderCounts = createAsyncThunk(
  'inbox/getFolderCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await inboxAPI.getFolderCounts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch folder counts');
    }
  }
);

// Get messages by folder
export const getMessages = createAsyncThunk(
  'inbox/getMessages',
  async ({ folder, page = 1, search = '', priority = '', category = '' }, { rejectWithValue }) => {
    try {
      const params = { page, search, priority, category };
      const response = await inboxAPI.getMessages(folder);
      return {
        ...response.data,
        folder
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch messages');
    }
  }
);

// Get specific message
export const getMessage = createAsyncThunk(
  'inbox/getMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await inboxAPI.getMessage(messageId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch message');
    }
  }
);

// Send new message
export const sendMessage = createAsyncThunk(
  'inbox/sendMessage',
  async (messageData, { rejectWithValue, dispatch }) => {
    try {
      const response = await inboxAPI.sendMessage(messageData);
      // Refresh folder counts and sent folder
      dispatch(getFolderCounts());
      dispatch(getMessages({ folder: 'sent' }));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send message');
    }
  }
);

// Reply to message
export const replyToMessage = createAsyncThunk(
  'inbox/replyToMessage',
  async ({ messageId, content, priority = 'normal' }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await inboxAPI.replyToMessage(messageId, { content, priority });
      // Refresh current folder and counts
      const state = getState().inbox;
      dispatch(getFolderCounts());
      dispatch(getMessages({ folder: state.activeFolder }));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send reply');
    }
  }
);

// Update message status
export const updateMessageStatus = createAsyncThunk(
  'inbox/updateMessageStatus',
  async ({ messageId, updates }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await inboxAPI.updateMessageStatus(messageId, updates);
      // Refresh current folder and counts
      const state = getState().inbox;
      dispatch(getFolderCounts());
      dispatch(getMessages({ folder: state.activeFolder }));
      return { messageId, updates };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update message');
    }
  }
);

// Bulk update messages
export const bulkUpdateMessages = createAsyncThunk(
  'inbox/bulkUpdateMessages',
  async ({ messageIds, action, folder, status }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await inboxAPI.bulkUpdateMessages({ messageIds, action, folder, status });
      // Refresh current folder and counts
      const state = getState().inbox;
      dispatch(getFolderCounts());
      dispatch(getMessages({ folder: state.activeFolder }));
      return { messageIds, action };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to bulk update messages');
    }
  }
);

// Delete message
export const deleteMessage = createAsyncThunk(
  'inbox/deleteMessage',
  async (messageId, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await inboxAPI.deleteMessage(messageId);
      // Refresh current folder and counts
      const state = getState().inbox;
      dispatch(getFolderCounts());
      dispatch(getMessages({ folder: state.activeFolder }));
      return messageId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete message');
    }
  }
);

// Get thread messages
export const getThreadMessages = createAsyncThunk(
  'inbox/getThreadMessages',
  async (threadId, { rejectWithValue }) => {
    try {
      const response = await inboxAPI.getThreadMessages(threadId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch thread messages');
    }
  }
);

// Create external message (for contact forms, etc.)
export const createExternalMessage = createAsyncThunk(
  'inbox/createExternalMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await inboxAPI.createExternalMessage(messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send message');
    }
  }
);

// Create the slice
const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    // UI actions
    setActiveFolder: (state, action) => {
      state.activeFolder = action.payload;
      state.selectedMessages = [];
      state.selectedMessage = null;
    },
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    toggleMessageSelection: (state, action) => {
      const messageId = action.payload;
      const index = state.selectedMessages.indexOf(messageId);
      if (index > -1) {
        state.selectedMessages.splice(index, 1);
      } else {
        state.selectedMessages.push(messageId);
      }
    },
    
    selectAllMessages: (state) => {
      state.selectedMessages = state.messages.map(msg => msg.id);
    },
    
    clearSelectedMessages: (state) => {
      state.selectedMessages = [];
    },
    
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    
    clearSelectedMessage: (state) => {
      state.selectedMessage = null;
    },

    // Compose modal actions
    showComposeModal: (state, action) => {
      state.showComposeModal = true;
      if (action.payload) {
        state.composeData = { ...state.composeData, ...action.payload };
      }
    },
    
    hideComposeModal: (state) => {
      state.showComposeModal = false;
      state.composeData = initialState.composeData;
    },
    
    updateComposeData: (state, action) => {
      state.composeData = { ...state.composeData, ...action.payload };
    },

    // Filter actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Thread actions
    setCurrentThreadId: (state, action) => {
      state.currentThreadId = action.payload;
    },
    
    clearThreadMessages: (state) => {
      state.threadMessages = [];
      state.currentThreadId = null;
    },

    // Reset inbox state
    resetInboxState: (state) => {
      Object.assign(state, initialState);
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Get folder counts
      .addCase(getFolderCounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFolderCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.folderCounts = action.payload;
        state.error = null;
      })
      .addCase(getFolderCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get messages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.pagination = action.payload.pagination;
        state.activeFolder = action.payload.folder;
        state.error = null;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get specific message
      .addCase(getMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedMessage = action.payload;
        state.error = null;
      })
      .addCase(getMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.loading = false;
        state.showComposeModal = false;
        state.composeData = initialState.composeData;
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Reply to message
      .addCase(replyToMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(replyToMessage.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(replyToMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update message status
      .addCase(updateMessageStatus.fulfilled, (state, action) => {
        const { messageId, updates } = action.payload;
        const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex > -1) {
          state.messages[messageIndex] = { ...state.messages[messageIndex], ...updates };
        }
        if (state.selectedMessage && state.selectedMessage.id === messageId) {
          state.selectedMessage = { ...state.selectedMessage, ...updates };
        }
      })
      
      // Bulk update messages
      .addCase(bulkUpdateMessages.fulfilled, (state, action) => {
        state.selectedMessages = [];
        state.error = null;
      })
      
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        state.messages = state.messages.filter(msg => msg.id !== messageId);
        state.selectedMessages = state.selectedMessages.filter(id => id !== messageId);
        if (state.selectedMessage && state.selectedMessage.id === messageId) {
          state.selectedMessage = null;
        }
        state.error = null;
      })
      
      // Get thread messages
      .addCase(getThreadMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getThreadMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.threadMessages = action.payload.messages;
        state.currentThreadId = action.payload.threadId;
        state.error = null;
      })
      .addCase(getThreadMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create external message
      .addCase(createExternalMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createExternalMessage.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createExternalMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
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
  setCurrentThreadId,
  clearThreadMessages,
  resetInboxState,
  clearError
} = inboxSlice.actions;

// Selectors
export const selectInboxState = (state) => state.inbox;
export const selectMessages = (state) => state.inbox?.messages || [];
export const selectSelectedMessage = (state) => state.inbox.selectedMessage;
export const selectActiveFolder = (state) => state.inbox.activeFolder;
export const selectSelectedMessages = (state) => state.inbox.selectedMessages;
export const selectFolderCounts = (state) => state.inbox.folderCounts;
export const selectInboxLoading = (state) => state.inbox.loading;
export const selectInboxError = (state) => state.inbox.error;
export const selectPagination = (state) => state.inbox.pagination;
export const selectComposeModal = (state) => ({
  show: state.inbox.showComposeModal,
  data: state.inbox.composeData
});
export const selectThreadMessages = (state) => state.inbox.threadMessages;
export const selectCurrentThreadId = (state) => state.inbox.currentThreadId;
export const selectFilters = (state) => state.inbox.filters;

export default inboxSlice.reducer;
