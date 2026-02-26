// mobile/src/api.js
// Axios-based API client — mirrors the web frontend api.js

import axios from "axios";
import { getIdToken } from "./firebase";

// TODO: Update this to your deployed backend URL
const BASE_URL = __DEV__
  ? "http://10.0.2.2:4000/api" // Android emulator → host machine
  : "https://your-backend.up.railway.app/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach Firebase token automatically
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  createProfile: (data) => api.post("/auth/profile", data),
  getProfile: () => api.get("/auth/profile"),
};

// ─── Menu ───────────────────────────────────────────────────────────────────
export const menuAPI = {
  getMenu: () => api.get("/menu"),
};

// ─── Orders ─────────────────────────────────────────────────────────────────
export const orderAPI = {
  place: (data) => api.post("/orders", data),
  getMyOrders: () => api.get("/orders/my"),
  cancelOrder: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
};

// ─── Payments ───────────────────────────────────────────────────────────────
export const paymentAPI = {
  initialize: (data) => api.post("/payments/initialize", data),
  verify: (ref) => api.get(`/payments/verify/${ref}`),
};

// ─── Events ─────────────────────────────────────────────────────────────────
export const eventAPI = {
  submit: (data) => api.post("/events", data),
  getMyEvents: () => api.get("/events/my"),
};

// ─── Settings ───────────────────────────────────────────────────────────────
export const settingsAPI = {
  get: () => api.get("/settings"),
};

export default api;
