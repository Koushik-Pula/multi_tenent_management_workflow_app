import api from './axios';

export const auditService = {
    getMyActivity: () => api.get('/audit/my-activity'),
};