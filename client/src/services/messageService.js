import api from './api';

export const getConversations = () => api.get('/messages');
export const getMessages = (conversationId) => api.get(`/messages/${conversationId}/messages`);
export const sendMessage = (payload) => api.post('/messages', payload);
export const updateMessage = (messageId, content) => api.patch(`/messages/${messageId}`, { content });
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);

// Admin inbox helpers
export const getUnreadMessagesCount = () => api.get('/messages/unread/count');
export const searchRecipients = (params) => api.get('/messages/recipients', { params });
export const uploadAttachment = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/messages/upload', formData);
};
export const markConversationRead = (conversationId) => api.patch(`/messages/conversations/${conversationId}/read`);
export const markConversationUnread = (conversationId) => api.patch(`/messages/conversations/${conversationId}/unread`);
export const toggleArchiveConversation = (conversationId) => api.patch(`/messages/conversations/${conversationId}/archive`);

export default {
  getConversations,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  getUnreadMessagesCount,
  searchRecipients,
  uploadAttachment,
  markConversationRead,
  markConversationUnread,
  toggleArchiveConversation,
};
