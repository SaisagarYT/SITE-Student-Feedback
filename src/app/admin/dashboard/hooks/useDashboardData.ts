import { useQuery } from "@tanstack/react-query";
import {
  getStats,
  getRatingDistribution,
  getFeedbackTrends,
  getFacultyPerformance,
  getCourseAnalytics,
  getInsights
} from "../services/api";

export function useDashboardData() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: getStats });
  const rating = useQuery({ queryKey: ["rating"], queryFn: getRatingDistribution });
  const trends = useQuery({ queryKey: ["trends"], queryFn: getFeedbackTrends });
  const faculty = useQuery({ queryKey: ["faculty"], queryFn: getFacultyPerformance });
  const courses = useQuery({ queryKey: ["courses"], queryFn: getCourseAnalytics });
  const insights = useQuery({ queryKey: ["insights"], queryFn: getInsights });

  return { stats, rating, trends, faculty, courses, insights };
}
