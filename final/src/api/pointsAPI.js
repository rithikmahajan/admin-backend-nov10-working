import API from './axiosConfig';

// Points System API endpoints
export const pointsAPI = {
  // System configuration
  getSystemConfig: () => API.get('/points/config'),
  updateSystemConfig: (configData) => API.put('/points/config', configData),
  
  // Users with points
  getAllUsersWithPoints: (params = {}) => API.get('/points/users', { params }),
  getUserPoints: (userId) => API.get(`/points/user/${userId}`),
  getUserPointsHistory: (userId, params = {}) => API.get(`/points/user/${userId}/history`, { params }),
  
  // Points operations
  allocatePoints: (userId, pointsData) => API.post(`/points/user/${userId}/allocate`, pointsData),
  redeemPoints: (userId, pointsData) => API.post(`/points/user/${userId}/redeem`, pointsData),
  updateUserPoints: (userId, pointsData) => API.put(`/points/user/${userId}`, pointsData),
  deleteUserPoints: (userId) => API.delete(`/points/user/${userId}`),
  
  // Summary and statistics
  getPointsSummary: () => API.get('/points/summary'),
};

export default pointsAPI;
