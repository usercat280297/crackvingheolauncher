import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (username, email, password, passwordConfirm) =>
    api.post('/auth/register', { username, email, password, passwordConfirm }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  socialLogin: (provider) =>
    api.post(`/auth/social/${provider}`),
  
  getCurrentUser: () =>
    api.get('/auth/profile'),
  
  verifyToken: () =>
    api.post('/auth/verify'),
  
  logout: () =>
    api.post('/auth/logout')
};

// User API
export const userAPI = {
  getProfile: (userId) =>
    api.get(`/user/profile/${userId}`),
  
  updateProfile: (username, bio, avatar) =>
    api.put('/user/profile', { username, bio, avatar }),
  
  getPreferences: () =>
    api.get('/user/preferences'),
  
  updatePreferences: (theme, language, autoUpdate, notificationsEnabled) =>
    api.put('/user/preferences', { theme, language, autoUpdate, notificationsEnabled }),
  
  searchUsers: (query) =>
    api.get('/user/search', { params: { q: query } })
};

// Library API
export const libraryAPI = {
  getLibrary: (sort = 'addedAt', order = '-1', search = '', isFavorite = false) =>
    api.get('/library', { params: { sort, order, search, isFavorite } }),
  
  addGame: (appId, title, thumbnail) =>
    api.post('/library/add', { appId, title, thumbnail }),
  
  removeGame: (appId) =>
    api.delete(`/library/remove/${appId}`),
  
  toggleFavorite: (appId) =>
    api.put(`/library/toggle-favorite/${appId}`),
  
  updateGame: (appId, isInstalled, installPath, installSize, playTime, lastPlayed, rating, notes) =>
    api.put(`/library/update/${appId}`, { isInstalled, installPath, installSize, playTime, lastPlayed, rating, notes }),
  
  getStats: () =>
    api.get('/library/stats')
};

// Downloads API
export const downloadsAPI = {
  getDownloads: (status = 'all') =>
    api.get('/downloads', { params: { status } }),
  
  startDownload: (appId, title, totalSize, downloadPath) =>
    api.post('/downloads/start', { appId, title, totalSize, downloadPath }),
  
  updateProgress: (downloadId, progress, downloadedSize, speed, estimatedTime) =>
    api.put(`/downloads/progress/${downloadId}`, { progress, downloadedSize, speed, estimatedTime }),
  
  pauseDownload: (downloadId) =>
    api.put(`/downloads/pause/${downloadId}`),
  
  resumeDownload: (downloadId) =>
    api.put(`/downloads/resume/${downloadId}`),
  
  completeDownload: (downloadId) =>
    api.put(`/downloads/complete/${downloadId}`),
  
  cancelDownload: (downloadId) =>
    api.delete(`/downloads/cancel/${downloadId}`),
  
  getStats: () =>
    api.get('/downloads/stats')
};

// Reviews API
export const reviewsAPI = {
  getReviews: (appId, page = 1, limit = 10, sortBy = 'helpful') =>
    api.get(`/reviews/${appId}`, { params: { page, limit, sortBy } }),
  
  getStats: (appId) =>
    api.get(`/reviews/stats/${appId}`),
  
  postReview: (appId, rating, title, content, username) =>
    api.post('/reviews/add', { appId, rating, title, content, username }),
  
  updateReview: (reviewId, rating, title, content) =>
    api.put(`/reviews/update/${reviewId}`, { rating, title, content }),
  
  deleteReview: (reviewId) =>
    api.delete(`/reviews/delete/${reviewId}`),
  
  markHelpful: (reviewId) =>
    api.put(`/reviews/helpful/${reviewId}`),
  
  markNotHelpful: (reviewId) =>
    api.put(`/reviews/not-helpful/${reviewId}`)
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (unreadOnly = false, limit = 20) =>
    api.get('/notifications', { params: { unreadOnly, limit } }),
  
  markAsRead: (notificationId) =>
    api.put(`/notifications/read/${notificationId}`),
  
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  
  deleteNotification: (notificationId) =>
    api.delete(`/notifications/${notificationId}`)
};

// Search API (existing)
export const searchAPI = {
  search: (query, limit = 20) =>
    api.get('/search/search', { params: { q: query, limit } }),
  
  getSuggestions: (query, limit = 5) =>
    api.get('/search/suggestions', { params: { q: query, limit } })
};

export default api;
