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
  // Signup still goes to backend directly usually? Or do we want to proxy it?
  // If we proxy it, we need to handle it in [...path].
  // But wait, if we call /api/auth/signup via proxy, it might fail if we require token.
  // The proxy requires token. So public routes must be handled differently or we need a public proxy.
  // For simplicity, let's make the proxy allow public routes OR just call direct backend for public actions 
  // BUT we want to avoid CORS if possible.
  // Actually, the plan was to modify api.js.
  // Let's check the proxy again. It checks `if (!session.token)`.
  // So we cannot use the proxy for public routes (signup).

  // OPTION 1: Create a specific route for signup in BFF? 
  // OPTION 2: Allow specific paths in proxy without token?

  // Let's modify the proxy to allow public paths? Or just call direct backend for signup?
  // Calling direct backend works if CORS is set up (which it is).
  // But `login` is now `/api/login`.

  // Let's stick to calling direct backend for signup for now to minimize changes, 
  // OR create a special route for signup.
  // Actually, let's keep signup direct to backend to match existing pattern for public routes if feasible, 
  // BUT the user wanted "iron-session for cookie management". 
  // Signup usually logs you in too? The current controller returns { message: "User created" } but doesn't return token.
  // So user has to login after signup. So signup can stay direct to backend.

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

