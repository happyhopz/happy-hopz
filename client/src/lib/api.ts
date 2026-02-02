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
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    signup: (data: any) => api.post('/auth/signup', data),
    login: (data: any) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    verifyEmail: (code: string) => api.post('/auth/verify-email', { code }),
    resendOTP: () => api.post('/auth/resend-otp'),
    googleLogin: (credential: string) => api.post('/auth/google', { credential }),
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
    updateStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data)
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
    deleteOrder: (id: string) => api.delete(`/admin/orders/${id}`),
    bulkDeleteOrders: (ids: string[]) => api.delete('/admin/orders/bulk', { data: { ids } }),
    getCoupons: () => api.get('/coupons'),
    createCoupon: (data: any) => api.post('/coupons', data),
    updateCoupon: (id: string, data: any) => api.put(`/coupons/${id}`, data),
    deleteCoupon: (id: string) => api.delete(`/coupons/${id}`),
    getAllReviews: () => api.get('/reviews/admin/all'),
    approveReview: (id: string, isApproved: boolean) => api.put(`/reviews/${id}/approve`, { isApproved }),
    featureReview: (id: string, isFeatured: boolean) => api.put(`/reviews/${id}/feature`, { isFeatured }),
    deleteReview: (id: string) => api.delete(`/reviews/${id}`),
    updateContent: (key: string, content: any) => api.put(`/content/${key}`, { content })
};

export const contentAPI = {
    get: (key: string) => api.get(`/content/${key}`),
    update: (key: string) => api.put(`/content/${key}`, { content: {} })
};

export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all')
};
