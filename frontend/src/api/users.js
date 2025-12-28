import api from "./axios";

export const fetchUsers = (limit = 20, offset = 0) =>
    api.get(`/users?limit=${limit}&offset=${offset}`);

export const updateUserRole = (userId, role) =>
    api.patch(`/users/${userId}/role`, { role });

export const deactivateUser = (userId) =>
    api.patch(`/users/${userId}/deactivate`);

export const reactivateUser = (userId) =>
    api.patch(`/users/${userId}/reactivate`);

export const inviteUser = (email, role) =>
    api.post("/users/invite", { email, role });
