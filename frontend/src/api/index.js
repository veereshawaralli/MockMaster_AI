import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

const STORAGE_KEY = "mockmaster-profile";

// Auth: a bearer token issued at login/register rides on every request. The
// backend derives the user id from this token, so one profile can't read
// another's data by guessing an id.
export const setAuthToken = (token) => {
  if (!token) {
    delete API.defaults.headers.common["Authorization"];
  } else {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// Bootstrap the header from a persisted session at load, so the first request
// after a refresh (e.g. a restored dashboard) is already authenticated.
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) : null;
  if (saved && saved.token) setAuthToken(saved.token);
} catch {
  /* ignore malformed storage */
}

export const registerUser = (name, password) =>
  API.post("/api/auth/register", { name, password }).then((r) => r.data);

export const loginUser = (name, password) =>
  API.post("/api/auth/login", { name, password }).then((r) => r.data);

export const getMe = () => API.get("/api/auth/me").then((r) => r.data);

export const logoutUser = () => API.post("/api/auth/logout").then((r) => r.data);

// Profile names (public) used to populate the login picker.
export const listUsers = () =>
  API.get("/api/users").then((r) => r.data.users);

// Sessions
export const createSession = (topic, difficulty) =>
  API.post("/api/sessions", { topic, difficulty }).then((r) => r.data);

export const getSessions = () =>
  API.get("/api/sessions").then((r) => r.data);

export const getSessionDetail = (id) =>
  API.get(`/api/sessions/${id}`).then((r) => r.data);

export const deleteSession = (id) =>
  API.delete(`/api/sessions/${id}`).then((r) => r.data);

// Evaluate
export const evaluateAnswer = (data) =>
  API.post("/api/evaluate", data).then((r) => r.data);

// Questions
export const getQuestion = (topic, difficulty, exclude = []) =>
  API.post("/api/question", { topic, difficulty, exclude }).then((r) => r.data);

export const adaptDifficulty = (current, scores) =>
  API.post(`/api/adapt-difficulty?current=${current}`, scores).then((r) => r.data);

// Dashboard
export const getDashboard = () =>
  API.get("/api/dashboard").then((r) => r.data);

// Topics & Difficulties
export const getTopics = () =>
  API.get("/api/topics").then((r) => r.data);

export const getDifficulties = () =>
  API.get("/api/difficulties").then((r) => r.data);

export default API;
