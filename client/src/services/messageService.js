import api from './api';

export const getConversations = () => api.get('/messages');
export const getMessages = (conversationId) => api.get(`/messages/${conversationId}/messages`);
export const sendMessage = (payload) => api.post('/messages', payload);

export default { getConversations, getMessages, sendMessage };