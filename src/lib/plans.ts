// src/lib/plans.ts

export type Plan = "free" | "core" | "scale";

export const PLAN_LIMITS = {
  free: {
    maxUploadsPerMonth: 3,
    dashboardHistoryLimit: 3,
    canAnalyze: true,
    canViewFullDashboard: false,
    canExport: false,
    canUseScaleFeatures: false,
  },
  core: {
    maxUploadsPerMonth: 999999,
    dashboardHistoryLimit: 999999,
    canAnalyze: true,
    canViewFullDashboard: true,
    canExport: true,
    canUseScaleFeatures: false,
  },
  scale: {
    maxUploadsPerMonth: 999999,
    dashboardHistoryLimit: 999999,
    canAnalyze: true,
    canViewFullDashboard: true,
    canExport: true,
    canUseScaleFeatures: true,
  },
} as const;

export function normalizePlan(plan: unknown): Plan {
  const value = String(plan || "free").toLowerCase().trim();

  // Legacy support: old "pro" users are now Core users.
  if (value === "pro") return "core";

  if (value === "core") return "core";
  if (value === "scale") return "scale";

  return "free";
}