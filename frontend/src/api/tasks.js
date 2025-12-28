import api from './axios';

export const taskService = {
    // Note the added "/projects" segment to match your routes file
    getProjectTasks: (projectId) => api.get(`/tasks/projects/${projectId}/tasks`),
    
    updateStatus: (projectId, taskId, status) => 
        api.patch(`/tasks/projects/${projectId}/tasks/${taskId}/status`, { status }),
    
    assign: (projectId, taskId, userId) => 
        api.patch(`/tasks/projects/${projectId}/tasks/${taskId}/assign`, { userId }),
    
    unassign: (projectId, taskId) => 
        api.patch(`/tasks/projects/${projectId}/tasks/${taskId}/unassign`),
    
    delete: (projectId, taskId) => 
        api.delete(`/tasks/projects/${projectId}/tasks/${taskId}`),
        
    getProjectMembers: (projectId) => api.get(`/projects/${projectId}/members`)
};