import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://happy-hopz.onrender.com/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data: any) => api.post('/auth/signup', data),
    login: (data: any) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    verifyEmail: (code: string) => api.post('/auth/verify-email', { code }),
    resendOTP: () => api.post('/auth/resend-otp'),
    googleLogin: (credential: string) => api.post('/auth/google', { credential }),
    updateProfile: (data: { name?: string; phone?: string }) => api.put('/auth/profile', data),
    changePassword: (data: any) => api.post('/auth/change-password', data),
    updateEmailPrefs: (data: any) => api.put('/auth/email-preferences', data),
    forgotPassword: (email: string) => api.post('/forgot-password', { email }),
    resetPassword: (data: any) => api.post('/reset-password', data),
};

// Products API
export const productsAPI = {
    getAll: (params?: any) => api.get('/products', { params }),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`)
};

// Cart API
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (data: { productId: string; quantity: number; size: string; color: string }) =>
        api.post('/cart', data),
    update: (id: string, quantity: number) => api.put(`/cart/${id}`, { quantity }),
    remove: (id: string) => api.delete(`/cart/${id}`),
    clear: () => api.delete('/cart'),
    validateCoupon: (data: { code: string; cartTotal: number }) => api.post('/coupons/validate', data),
    getReviews: (productId: string) => api.get(`/reviews/${productId}`),
    postReview: (data: any) => api.post('/reviews', data)
};

// Orders API
export const ordersAPI = {
    create: (data: any) => api.post('/orders', data),
    getAll: () => api.get('/orders'),
    getById: (id: string) => api.get(`/orders/${id}`),
    updateStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
    cancel: (id: string, data: { reason: string }) => api.patch(`/orders/${id}/cancel`, data),
    return: (id: string, data: { reason: string }) => api.patch(`/orders/${id}/return`, data)
};

// Payment API
export const paymentAPI = {
    createIntent: (data: { amount: number; orderId: string }) =>
        api.post('/payment/intent', data),
    confirm: (paymentIntentId: string) =>
        api.post('/payment/confirm', { paymentIntentId })
};

// Admin API
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: () => api.get('/admin/users'),
    getOrders: (params?: any) => api.get('/admin/orders', { params }),
    getOrder: (id: string) => api.get(`/orders/${id}`),
    updateOrderStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
    getProducts: () => api.get('/admin/products'),
    createProduct: (data: any) => api.post('/admin/products', data),
    updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
    deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
    bulkCreateProducts: (products: any[]) => api.post('/admin/products/bulk', { products }),
    bulkDeleteProducts: (ids: string[]) => api.delete('/admin/products/bulk', { data: { ids } }),
    bulkStockUpdate: (updates: { sku: string; stock: number }[]) => api.put('/admin/inventory/bulk-stock', { updates }),
    generateSEO: (id: string) => api.post(`/admin/products/${id}/seo-generate`),
    search: (query: string) => api.get(`/admin/search?q=${query}`),
    getAuditLogs: (filters?: { entity?: string; entityId?: string }) => {
        const params = new URLSearchParams();
        if (filters?.entity) params.append('entity', filters.entity);
        if (filters?.entityId) params.append('entityId', filters.entityId);
        return api.get(`/admin/audit-logs?${params.toString()}`);
    },
    getCoupons: () => api.get('/coupons'),
    createCoupon: (data: any) => api.post('/coupons', data),
    updateCoupon: (id: string, data: any) => api.put(`/coupons/${id}`, data),
    deleteCoupon: (id: string) => api.delete(`/coupons/${id}`),
    getAllReviews: () => api.get('/reviews/admin/all'),
    approveReview: (id: string, isApproved: boolean) => api.put(`/reviews/${id}/approve`, { isApproved }),
    featureReview: (id: string, isFeatured: boolean) => api.put(`/reviews/${id}/feature`, { isFeatured }),
    deleteReview: (id: string) => api.delete(`/reviews/${id}`),
    updateContent: (key: string, content: any) => api.put(`/content/${key}`, { content }),
    updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),

    // NEW: Site Settings - Payment Control
    getPaymentSettings: () => api.get('/admin/site-settings/payment'),
    updatePaymentSettings: (data: any) => api.post('/admin/site-settings/payment', data),

    // Marketing & Growth
    getAbandonedCarts: () => api.get('/marketing/abandoned-carts'),
    getFlashSales: () => api.get('/marketing/flash-sales'),
    createFlashSale: (data: any) => api.post('/marketing/flash-sales', data),
    getPopups: () => api.get('/marketing/popups'),
    createPopup: (data: any) => api.post('/marketing/popups', data),

    // Advanced Logistics (Draft Orders)
    createDraftOrder: (data: any) => api.post('/orders', { ...data, source: 'MANUAL' }),
};

export const marketingAPI = {
    getActiveSale: () => api.get('/marketing/flash-sales/active'),
    getActivePopup: () => api.get('/marketing/popups/active')
};

export const contentAPI = {
    get: (key: string) => api.get(`/content/${key}`),
    update: (key: string, content: any) => api.put(`/content/${key}`, { content })
};

export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all')
};

export const addressAPI = {
    getAll: () => api.get('/addresses'),
    create: (data: any) => api.post('/addresses', data),
    delete: (id: string) => api.delete(`/addresses/${id}`)
};

export const contactsAPI = {
    submit: (data: { name: string; email: string; subject: string; message: string }) =>
        api.post('/contacts', data),
    getAll: (params?: { status?: string }) => api.get('/contacts', { params }),
    updateStatus: (id: string, status: string) => api.put(`/contacts/${id}`, { status })
};

export const searchAPI = {
    query: (q: string) => api.get('/search', { params: { q } })
};

export default api;
