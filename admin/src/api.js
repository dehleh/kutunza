// admin/src/api.js
import axios from "axios";
import { getIdToken } from "./firebase";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use(async (cfg) => {
  const token = await getIdToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => Promise.reject(new Error(err.response?.data?.error || err.message))
);

// Auth / Profile
export const authAPI = {
  getProfile: () => api.get("/auth/profile"),
  getUsers: (limit = 50) => api.get(`/auth/admin/users?limit=${limit}`),
  grantAdmin: (uid) => api.post("/auth/admin/grant", { targetUid: uid }),
  revokeAdmin: (uid) => api.post("/auth/admin/revoke", { targetUid: uid }),
};

// Orders
export const orderAPI = {
  getAll: (status, limit = 50) => {
    const q = status ? `?status=${status}&limit=${limit}` : `?limit=${limit}`;
    return api.get(`/orders${q}`);
  },
  updateStatus: (id, status, note) => api.patch(`/orders/${id}/status`, { status, note }),
  cancelOrder: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
  cleanup: () => api.post("/orders/cleanup"),
};

// Menu
export const menuAPI = {
  getAll: () => api.get("/menu"),
  seed: (categories) => api.post("/menu/seed", { categories }),
  addCategory: (data) => api.post("/menu/category", data),
  deleteCategory: (id) => api.delete(`/menu/${id}`),
  updateCategory: (id, data) => api.put(`/menu/${id}`, data),
  addItem: (catId, data) => api.post(`/menu/${catId}/item`, data),
  editItem: (catId, itemId, data) => api.patch(`/menu/${catId}/item/${itemId}`, data),
  toggleItem: (catId, itemId) => api.patch(`/menu/${catId}/item/${itemId}/toggle`),
  deleteItem: (catId, itemId) => api.delete(`/menu/${catId}/item/${itemId}`),
};

// Events
export const eventAPI = {
  getAll: (status, limit = 50) => {
    const q = status ? `?status=${status}&limit=${limit}` : `?limit=${limit}`;
    return api.get(`/events${q}`);
  },
  updateStatus: (id, status, note) => api.patch(`/events/${id}/status`, { status, note }),
  create: (data) => api.post("/events", data),
  suggestMenu: (data) => api.post("/events/suggest-menu", data),
};

// Settings
export const settingsAPI = {
  get: () => api.get("/settings"),
  update: (data) => api.put("/settings", data),
};

// Payments
export const paymentAPI = {
  refund: (orderId, reason) => api.post("/payments/refund", { orderId, reason }),
};

export default api;
