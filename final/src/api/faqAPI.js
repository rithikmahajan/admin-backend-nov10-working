import API from './axiosConfig';

// FAQ API endpoints
export const faqAPI = {
  // Get all FAQs with optional pagination and search
  getAllFaqs: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    return API.get(`/faqs${queryString ? `?${queryString}` : ''}`);
  },

  // Get FAQ by ID
  getFaqById: (id) => API.get(`/faqs/${id}`),

  // Create new FAQ
  createFaq: (faqData) => API.post('/faqs', faqData),

  // Update FAQ
  updateFaq: (id, faqData) => API.put(`/faqs/${id}`, faqData),

  // Delete FAQ
  deleteFaq: (id) => API.delete(`/faqs/${id}`),

  // Toggle FAQ active status
  toggleFaqStatus: (id, isActive) => API.patch(`/faqs/${id}/status`, { isActive }),

  // Get FAQ categories
  getCategories: () => API.get('/faqs/categories'),

  // Bulk operations
  bulkDeleteFaqs: (ids) => API.delete('/faqs/bulk', { data: { ids } }),
  bulkUpdateStatus: (ids, isActive) => API.patch('/faqs/bulk/status', { ids, isActive }),

  // FAQ statistics
  getStats: () => API.get('/faqs/stats'),

  // Search FAQs
  searchFaqs: (query) => API.get(`/faqs/search?q=${encodeURIComponent(query)}`),
};

export default faqAPI;
