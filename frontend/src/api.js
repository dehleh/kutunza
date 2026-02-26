// frontend/src/api.js
// Axios-based API client with automatic Firebase auth token injection

import axios from "axios";
import { getIdToken } from "./firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach Firebase token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  createProfile: (data) => api.post("/auth/profile", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.post("/auth/profile", data),
};

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const menuAPI = {
  getMenu: () => api.get("/menu"),
  seedMenu: (categories) => api.post("/menu/seed", { categories }),
  updateCategory: (catId, data) => api.put(`/menu/${catId}`, data),
  toggleItem: (catId, itemId) => api.patch(`/menu/${catId}/item/${itemId}/toggle`),
  editItem: (catId, itemId, data) => api.patch(`/menu/${catId}/item/${itemId}`, data),
  addItem: (catId, data) => api.post(`/menu/${catId}/item`, data),
  deleteItem: (catId, itemId) => api.delete(`/menu/${catId}/item/${itemId}`),
  addCategory: (data) => api.post("/menu/category", data),
  deleteCategory: (catId) => api.delete(`/menu/${catId}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orderAPI = {
  place: (orderData) => api.post("/orders", orderData),
  getMyOrders: () => api.get("/orders/my"),
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
  cancelOrder: (orderId, reason) => api.patch(`/orders/${orderId}/cancel`, { reason }),

  // Admin
  getAllOrders: (params) => api.get("/orders", { params }),
  updateStatus: (orderId, status, note) =>
    api.patch(`/orders/${orderId}/status`, { status, note }),
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const paymentAPI = {
  initialize: (data) => api.post("/payments/initialize", data),
  verify: (reference) => api.get(`/payments/verify/${reference}`),
};

// ─── Events ──────────────────────────────────────────────────────────────────
export const eventAPI = {
  submit: (data) => api.post("/events", data),
  getMyEvents: () => api.get("/events/my"),

  // Admin
  getAllEvents: (params) => api.get("/events", { params }),
  updateStatus: (eventId, status, note) =>
    api.patch(`/events/${eventId}/status`, { status, note }),
};

// ─── Settings ────────────────────────────────────────────────────────────────
export const settingsAPI = {
  get: () => api.get("/settings"),
  update: (data) => api.put("/settings", data),
};

export default api;
