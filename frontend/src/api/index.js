import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

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
