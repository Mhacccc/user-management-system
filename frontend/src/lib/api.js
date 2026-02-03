import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function signup(data) {
  return api.post("/auth/signup", data);
}

export async function login(data) {
  return api.post("/auth/login", data);
}

export function setToken(token) {
  if (typeof window !== "undefined") localStorage.setItem("token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function removeToken() {
  if (typeof window !== "undefined") localStorage.removeItem("token");
}

export async function getUsers() {
  return api.get("/users");
}

export async function createUser(data) {
  return api.post('/users', data);
}

export async function getAuditLogs() {
  return api.get('/auditlogs');
}

export async function updateUser(id, data) {
  return api.put(`/users/${id}`, data);
}

export async function getUser(id) {
  return api.get(`/users/${id}`);
}

export default api;

export async function deleteUser(id) {
  return api.delete(`/users/${id}`);
}
