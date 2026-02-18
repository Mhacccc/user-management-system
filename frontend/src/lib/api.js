import axios from "axios";

// Point to Next.js API Routes (BFF)
const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Remove interceptor as token is handled by iron-session on server side

export async function signup(data) {


  return axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/signup`, data);
}

export async function login(data) {
  return api.post("/login", data);
}

export async function logout() {
  return api.post("/logout");
}

export async function getUserSession() {
  return api.get("/user");
}

// Helper to remove token locally is no longer needed but we might want a 'logout' function
export function setToken(token) {
  // No-op or removed
}

export function getToken() {
  // No longer available on client, cookies are httpOnly
  return null;
}

export function removeToken() {
  // handled by logout api
}

export async function getUsers() {
  return api.get("/users");
}

export async function getDashboardStats() {
  return api.get("/users/stats");
}

export async function createUser(data) {
  return api.post('/users', data);
}

export async function getAuditLogs() {
  return api.get('/auditlogs');
}

export async function getMyActivity() {
  return api.get('/auditlogs/my-activity');
}

export async function updateUser(id, data) {
  return api.put(`/users/${id}`, data);
}

export async function getUser(id) {
  return api.get(`/users/${id}`);
}

export async function deleteUser(id) {
  return api.delete(`/users/${id}`);
}

export default api;

