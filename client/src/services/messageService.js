import api from './api';

export const getConversations = () => api.get('/messages');
export const getMessages = (conversationId) => api.get(`/messages/${conversationId}/messages`);
export const sendMessage = (payload) => api.post('/messages', payload);
export const updateMessage = (messageId, content) => api.patch(`/messages/${messageId}`, { content });
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);

export default { getConversations, getMessages, sendMessage, updateMessage, deleteMessage };