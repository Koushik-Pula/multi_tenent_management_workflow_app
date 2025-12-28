import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const currentRefreshToken = localStorage.getItem('refreshToken');

                if (!currentRefreshToken) {
                    throw new Error("No refresh token");
                }

                const res = await axios.post('http://localhost:5000/auth/refresh', {
                    refreshToken: currentRefreshToken
                });

                const { accessToken, refreshToken: newRefreshToken } = res.data;

                localStorage.setItem('accessToken', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                
                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;