import api from "./axios";

export const getMyProfile = () =>
    api.get("/users/me/profile");

export const updateMyProfile = (data) =>
    api.patch("/users/me/profile", data);
