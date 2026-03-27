import axios from "axios";

const API = axios.create({
  baseURL: "/api/admin",
});

export const getStats = () => API.get("/stats");
export const getRatingDistribution = () => API.get("/rating-distribution");
export const getFeedbackTrends = () => API.get("/feedback-trends");
export const getFacultyPerformance = () => API.get("/faculty-performance");
export const getCourseAnalytics = () => API.get("/course-analytics");
export const getInsights = () => API.get("/insights");
