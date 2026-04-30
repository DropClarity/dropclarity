"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const API_BASE = "https://dropclarity.com/api";
const FALLBACK_USER_ID = "anon";

type DashboardMode = "ready" | "loading" | "error";
type ViewMode = "dashboard" | "job" | "alljobs" | "highrisk" | "reports";
type RangeKey = "all" | "mtd" | "last7" | "last30" | "custom";
type JobsSortKey = "date" | "profit" | "margin" | "revenue";
type ReportsSortKey = "newest" | "oldest" | "profit_low" | "profit_high" | "revenue_high";

type ReportTotals = {
  revenue: number;
  costs: number;
  netProfit: number;
};

type CostBreakdown = {
  labor?: number;
  materials?: number;
  subs?: number;
  other?: number;
};

type JobRow = {
  id?: string;
  report_id?: string;
  created_at?: string;
  period_label?: string;
  job_id?: string;
  job_name?: string;
  revenue?: number | string;
  costs?: number | string;
  profit?: number | string;
  margin_pct?: number | string;
  confidence?: number | string;
  cost_breakdown?: CostBreakdown;
};

type ReportRow = {
  id?: string;
  analysis_id?: string;
  created_at?: string;
  period_label?: string;
  revenue?: number | string;
  costs?: number | string;
  net_profit?: number | string;
  margin_pct?: number | string;
  period_end?: string;
  jobs?: JobRow[];
  job_rows?: JobRow[];
  job_details?: JobRow[];
};

type Insight = {
  title?: string;
  impact?: string;
  detail?: string;
  recommendation?: string;
};

type DashboardSummary = {
  id?: string | null;
  period_label?: string;
  created_at?: string | null;
  revenue?: number | string;
  costs?: number | string;
  net_profit?: number | string;
  margin_pct?: number | string;
  jobs_count?: number | string;
  losing_jobs_count?: number | string;
  reports_count?: number | string;
};

type DashboardState = {
  ok?: boolean;
  user_id?: string;
  range?: string;
  date_filter?: {
    range?: string;
    from?: string | null;
    to?: string | null;
  };
  summary?: DashboardSummary;
  reports?: ReportRow[];
  all_jobs?: JobRow[];
  jobs_losing_money?: JobRow[];
  lowest_profit_jobs?: JobRow[];
  insights?: Insight[];
  cost_mix?: CostBreakdown;
  mix?: CostBreakdown;
  job_history?: Record<string, JobHistoryRow[]>;
  jobs_history?: Record<string, JobHistoryRow[]>;
};

type JobHistoryRow = {
  month_key?: string;
  date?: string;
  created_at?: string;
  month?: string;
  period_label?: string;
  revenue?: number | string;
  costs?: number | string;
  gross_profit?: number | string;
  gross_margin_pct?: number | string;
};

type EditableJob = {
  job_id: string;
  job_name: string;
  job_type: string;
  job_address: string;
  job_date: string;
  revenue: number;
  material_cost: number;
  labor_cost: number;
  subs_cost: number;
  other_cost: number;
  notes: string;
  custom_categories: CustomCategory[];
  _editing?: "revenue" | "material_cost" | "labor_cost" | "subs_cost" | "other_cost" | null;
};

type CustomCategory = { name: string; amount: number };
type CostPart = { label: string; value: number; color: string; shadow: string };

type CreditMetrics = {
  totalCredits: number;
  profitRecoveredFromCredits: number;
  jobsWithCredits: number;
  avgCreditPerJob: number;
  avgCreditPerCreditJob: number;
  creditRatePct: number;
  creditsByBucket: Required<CostBreakdown>;
  biggestCreditJob: JobRow | null;
  biggestCreditAmount: number;
  positiveCostActivity: number;
  netCostAfterCredits: number;
};

type ScaleSummaryJob = {
  revenue?: number;
  costs?: number;
  profit?: number;
  margin?: number;
  name?: string;
  id?: string | null;
};

type ScaleAlert = {
  level?: "info" | "watch" | "warning" | "critical" | "healthy";
  title?: string;
  message?: string;
};

type ProfitLeakBreakdown = {
  type?: string;
  label?: string;
  amount?: number;
  jobs_count?: number;
  severity?: "healthy" | "watch" | "warning" | "critical";
  description?: string;
  fix?: string;
};

type StructuredAction = {
  text?: string;
  title?: string;
  impact?: number;
  priority?: "low" | "medium" | "high" | "critical";
  category?: string;
};

type LatestReport = {
  id?: string;
  created_at?: string;
  period_label?: string;
  revenue?: number;
  costs?: number;
  net_profit?: number;
  margin_pct?: number;
};

type ScaleSummary = {
  ok?: boolean;
  risk_level?: "healthy" | "warning" | "critical";
  priority_message?: string;
  summary_text?: string;
  trend_summary?: string;
  actions?: string[];
  structured_actions?: StructuredAction[];
  alerts?: ScaleAlert[];
  profit_leak_breakdown?: ProfitLeakBreakdown[];
  latest_report?: LatestReport | null;
  stats?: {
    total_jobs?: number;
    losing_jobs_count?: number;
    high_risk_count?: number;
    thin_margin_count?: number;
    avg_margin?: number;
    recoverable_profit?: number;
    recoverable?: number;
    total_revenue?: number;
    total_costs?: number;
    total_profit?: number;
    labor_total?: number;
    materials_total?: number;
    subs_total?: number;
    other_total?: number;
    labor_share_pct?: number;
    materials_share_pct?: number;
  };
  benchmarks?: {
    target_margin_pct?: number;
    warning_margin_pct?: number;
    avg_margin_pct?: number;
    labor_share_pct?: number;
    materials_share_pct?: number;
    known_costs?: number;
    profit_per_job?: number;
    cost_ratio_pct?: number;
  };
  losing_jobs?: ScaleSummaryJob[];
  high_risk_jobs?: ScaleSummaryJob[];
  thin_margin_jobs?: ScaleSummaryJob[];
  top_opportunities?: ScaleSummaryJob[];
};


type PlanAccess = {
  normalizedPlan: "free" | "core" | "scale";
  label: string;
  isFree: boolean;
  isCore: boolean;
  isScale: boolean;
  canUseCore: boolean;
  canUseScale: boolean;
  canExport: boolean;
  canUseCustomCategories: boolean;
  canSaveJobEdits: boolean;
  canViewJobDetail: boolean;
  canPreviewScale: boolean;
};

function normalizePlanName(plan: string): "free" | "core" | "scale" {
  const raw = String(plan || "free").trim().toLowerCase();

  if (raw === "core" || raw === "pro") return "core";
  if (raw === "scale") return "scale";
  return "free";
}

function getPlanAccess(plan: string): PlanAccess {
  const normalizedPlan = normalizePlanName(plan);
  const isScale = normalizedPlan === "scale";
  const isCore = normalizedPlan === "core";
  const isFree = normalizedPlan === "free";
  const canUseCore = isCore || isScale;
  const canUseScale = isScale;

  return {
    normalizedPlan,
    label: isScale ? "Scale" : isCore ? "Core" : "Free",
    isFree,
    isCore,
    isScale,
    canUseCore,
    canUseScale,
    canExport: canUseCore,
    canUseCustomCategories: canUseCore,
    canSaveJobEdits: canUseCore,
    canViewJobDetail: true,
    canPreviewScale: isScale,
  };
}

function lockMessage(feature: string, requiredPlan: string) {
  return `${feature} is available on ${requiredPlan}. You can still preview the value before upgrading.`;
}

const moneyFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtMoney(v: unknown) {
  return moneyFmt.format(parseNumberLoose(v));
}

function fmtPct(v: unknown) {
  return `${parseNumberLoose(v).toFixed(1)}%`;
}

function parseNumberLoose(x: unknown): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (x == null) return 0;

  if (typeof x === "string") {
    let s = x.trim();
    if (!s) return 0;
    const neg = /^\(.*\)$/.test(s);
    s = s.replace(/[(),\s$%]/g, "");
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    return neg ? -n : n;
  }

  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function parseMoneyInput(v: unknown): number {
  return parseNumberLoose(String(v ?? ""));
}

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateLabel(v?: string | null) {
  const d = safeDate(v);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dateTimeLabel(v?: string | null) {
  const d = safeDate(v);
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function rangeLabel(range: RangeKey) {
  if (range === "mtd") return "Month-to-date";
  if (range === "last7") return "Last 7 Days";
  if (range === "last30") return "Last 30 days";
  if (range === "custom") return "Custom range";
  return "All time";
}

function statusForJob(job: JobRow) {
  const profit = parseNumberLoose(job.profit);
  const margin = parseNumberLoose(job.margin_pct);

  if (profit < 0 || margin < 0) return { label: "Losing", cls: "bad" as const };
  if (margin < 20) return { label: "Thin margin", cls: "warn" as const };
  return { label: "Healthy", cls: "ok" as const };
}

function csvCell(v: unknown) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function fileSafeName(v: string) {
  return String(v || "export")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function exportAllJobsCsv(state: DashboardState) {
  const jobs = getAllJobs(state);
  const range = rangeLabel((state.range as RangeKey) || "all");

  const rows: unknown[][] = [
    ["DropClarity All Jobs Export"],
    ["Range", range],
    ["Generated", new Date().toLocaleString()],
    [],
    [
      "Job Name",
      "Job ID",
      "Date",
      "Period",
      "Revenue",
      "Costs",
      "Profit",
      "Margin %",
      "Labor",
      "Materials",
      "Subs",
      "Other",
      "Total Credits",
      "Labor Credits",
      "Materials Credits",
      "Subs Credits",
      "Other Credits",
      "Status",
    ],
  ];

  jobs.forEach((job) => {
    const status = statusForJob(job);

    rows.push([
      job.job_name || "",
      job.job_id || "",
      dateLabel(job.created_at),
      job.period_label || "",
      parseNumberLoose(job.revenue),
      parseNumberLoose(job.costs),
      parseNumberLoose(job.profit),
      parseNumberLoose(job.margin_pct),
      parseNumberLoose(job.cost_breakdown?.labor),
      parseNumberLoose(job.cost_breakdown?.materials),
      parseNumberLoose(job.cost_breakdown?.subs),
      parseNumberLoose(job.cost_breakdown?.other),
      getJobCreditTotal(job),
      getBucketCreditAmount(job.cost_breakdown?.labor),
      getBucketCreditAmount(job.cost_breakdown?.materials),
      getBucketCreditAmount(job.cost_breakdown?.subs),
      getBucketCreditAmount(job.cost_breakdown?.other),
      status.label,
    ]);
  });

  downloadCsv(`dropclarity-all-jobs-${fileSafeName(range)}.csv`, rows);
}

function exportSingleJobCsv(
  job: EditableJob,
  base: JobRow,
  history: JobHistoryRow[],
  state: DashboardState
) {
  const revenue = parseNumberLoose(job.revenue);
  const labor = parseNumberLoose(job.labor_cost);
  const materials = parseNumberLoose(job.material_cost);
  const subs = parseNumberLoose(job.subs_cost);
  const other = parseNumberLoose(job.other_cost);
  const customTotal = sumCustomCategories(job.custom_categories || []);
  const totalCosts = labor + materials + subs + other + customTotal;
  const profit = revenue - totalCosts;
  const margin = revenue !== 0 ? (profit / revenue) * 100 : 0;

  const rows: unknown[][] = [
    ["DropClarity Single Job Export"],
    ["Generated", new Date().toLocaleString()],
    ["Range", rangeLabel((state.range as RangeKey) || "all")],
    [],
    ["Job Detail"],
    ["Job ID", job.job_id || base.job_id || ""],
    ["Job Name", job.job_name || base.job_name || ""],
    ["Job Type", job.job_type || ""],
    ["Job Address", job.job_address || ""],
    ["Job Date", job.job_date || dateLabel(base.created_at)],
    [],
    ["Financial Summary"],
    ["Revenue", revenue],
    ["Labor", labor],
    ["Materials", materials],
    ["Subs", subs],
    ["Other", other],
    ["Custom Categories", customTotal],
    ["Total Costs", totalCosts],
    ["Gross Profit", profit],
    ["Gross Margin %", margin],
    [],
    ["Notes"],
    [job.notes || ""],
    [],
    ["Custom Categories"],
    ["Name", "Amount"],
  ];

  (job.custom_categories || []).forEach((c) => {
    rows.push([c.name || "", parseNumberLoose(c.amount)]);
  });

  rows.push([]);
  rows.push(["History"]);
  rows.push(["Month", "Revenue", "Costs", "Gross Profit", "Gross Margin %"]);

  history.forEach((h) => {
    rows.push([
      formatMonthLabel(String(h.month_key || "")),
      parseNumberLoose(h.revenue),
      parseNumberLoose(h.costs),
      parseNumberLoose(h.gross_profit),
      parseNumberLoose(h.gross_margin_pct),
    ]);
  });

  const name = job.job_id || job.job_name || base.job_id || base.job_name || "job";
  downloadCsv(`dropclarity-job-${fileSafeName(String(name))}.csv`, rows);
}

async function apiGetDashboard(token: string | null, range: RangeKey, customFrom: string, customTo: string): Promise<DashboardState> {
  const params = new URLSearchParams();
  params.set("range", range);

  if (range === "custom" && customFrom && customTo) {
    params.set("from", customFrom);
    params.set("to", customTo);
  }

  const res = await fetch(`${API_BASE}/dashboard?${params.toString()}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: { error?: string } | DashboardState | null = null;

  try {
    data = JSON.parse(text) as DashboardState;
  } catch {}

  if (!res.ok) {
    throw new Error((data as { error?: string } | null)?.error || text || `Dashboard failed (${res.status})`);
  }

  return (data as DashboardState) || {};
}


async function apiGetScaleSummary(token: string | null): Promise<ScaleSummary> {
  const res = await fetch(`${API_BASE}/scale-summary`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: { error?: string } | ScaleSummary | null = null;

  try {
    data = JSON.parse(text) as ScaleSummary;
  } catch {}

  if (!res.ok) {
    throw new Error((data as { error?: string } | null)?.error || text || `Scale summary failed (${res.status})`);
  }

  return (data as ScaleSummary) || {};
}

function getAllJobs(state: DashboardState): JobRow[] {
  if (Array.isArray(state.all_jobs)) return state.all_jobs;
  if (Array.isArray(state.lowest_profit_jobs)) return state.lowest_profit_jobs;
  if (Array.isArray(state.jobs_losing_money)) return state.jobs_losing_money;
  return [];
}

function buildJobKey(job: JobRow, idx: number): string {
  const rid = String(job.report_id || "").trim();
  const jid = String(job.job_id || "").trim();
  const name = String(job.job_name || "job").trim();
  const created = String(job.created_at || "").trim();
  return `${rid || "report"}:${jid || name}:${created}:${idx}`;
}

function findJobByKey(state: DashboardState, key: string): JobRow | null {
  const jobs = getAllJobs(state);
  return jobs.find((j, idx) => buildJobKey(j, idx) === key) || null;
}

function reportDeleteKey(r: ReportRow, idx = 0): string {
  return String(r.id || r.analysis_id || `${r.created_at || "unknown"}_${r.period_label || "report"}_${r.net_profit || "0"}_${idx}`);
}

function deletedReportsKey(userId: string): string {
  return `dc_deleted_reports_${userId}`;
}

function readDeletedReports(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(deletedReportsKey(userId)) || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function writeDeletedReports(userId: string, keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(deletedReportsKey(userId), JSON.stringify(Array.from(new Set(keys))));
  } catch {}
}

function filterDeletedReports(reports: ReportRow[], deletedKeys: string[]): ReportRow[] {
  const blocked = new Set(deletedKeys.map(String));
  return (Array.isArray(reports) ? reports : []).filter((r, idx) => !blocked.has(reportDeleteKey(r, idx)));
}

function extractJobsFromReports(reports: ReportRow[]): JobRow[] {
  return (Array.isArray(reports) ? reports : []).flatMap((report) => {
    const rows = report.jobs || report.job_rows || report.job_details || [];
    return (Array.isArray(rows) ? rows : []).map((job) => ({
      ...job,
      report_id: job.report_id || report.id || report.analysis_id,
      period_label: job.period_label || report.period_label,
      created_at: job.created_at || report.created_at,
    }));
  });
}

function getReportJobs(report: ReportRow, allJobs: JobRow[] = []): JobRow[] {
  const embedded = report.jobs || report.job_rows || report.job_details || [];

  if (Array.isArray(embedded) && embedded.length) {
    return embedded.map((job) => ({
      ...job,
      report_id: job.report_id || report.id || report.analysis_id,
      period_label: job.period_label || report.period_label,
      created_at: job.created_at || report.created_at,
    }));
  }

  const reportIds = new Set(
    [report.id, report.analysis_id]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
  );

  if (!reportIds.size) return [];

  return (Array.isArray(allJobs) ? allJobs : []).filter((job) =>
    reportIds.has(String(job.report_id || "").trim())
  );
}

function cleanReportPeriodLabel(label: unknown): string {
  const raw = String(label || "").trim();
  if (!raw) return "";
  if (raw.toLowerCase() === "latest period") return "";
  return raw;
}

function reportUploadType(report: ReportRow, jobs: JobRow[] = []): string {
  const text = `${report.period_label || ""} ${report.id || ""} ${report.analysis_id || ""} ${jobs
    .map((job) => `${job.job_name || ""} ${job.job_id || ""}`)
    .join(" ")}`.toLowerCase();

  if (/credit|refund|returned|memo/.test(text)) return "Credit / Refund";
  if (/adjust|adj|warranty/.test(text)) return "Adjustment";
  if (jobs.length > 1) return "Multi-job upload";
  return "Standard upload";
}

function getReportCreditTotal(report: ReportRow, allJobs: JobRow[] = []): number {
  return getReportJobs(report, allJobs).reduce((sum, job) => sum + getJobCreditTotal(job), 0);
}

function getReportDisplayInfo(report: ReportRow, allJobs: JobRow[] = []) {
  const jobs = getReportJobs(report, allJobs);
  const uniqueNames = Array.from(
    new Set(
      jobs
        .map((job) => String(job.job_name || job.job_id || "").trim())
        .filter(Boolean)
    )
  );
  const uniqueIds = Array.from(
    new Set(jobs.map((job) => String(job.job_id || "").trim()).filter(Boolean))
  );

  const cleanPeriod = cleanReportPeriodLabel(report.period_label);
  const uploadType = reportUploadType(report, jobs);

  let title = cleanPeriod || "Report";

  if (uniqueNames.length === 1) {
    title = uniqueNames[0];
  } else if (uniqueNames.length > 1) {
    title = `${uniqueNames[0]} + ${uniqueNames.length - 1} more job${uniqueNames.length - 1 === 1 ? "" : "s"}`;
  } else if (uniqueIds.length === 1) {
    title = uniqueIds[0];
  } else if (!cleanPeriod) {
    title = `Upload ${String(report.id || report.analysis_id || "").slice(0, 8) || "Report"}`;
  }

  const jobIdLabel = uniqueIds.length
    ? uniqueIds.slice(0, 3).join(", ") + (uniqueIds.length > 3 ? ` +${uniqueIds.length - 3}` : "")
    : "No Job ID detected";

  const details = [
    jobIdLabel,
    dateTimeLabel(report.created_at),
    cleanPeriod || "Saved upload",
  ].filter(Boolean);

  const tags = [uploadType];
  if (jobs.length > 0) tags.push(`${jobs.length} job${jobs.length === 1 ? "" : "s"}`);
  if (getReportCreditTotal(report, allJobs) > 0) tags.push("Has credits");

  return {
    title,
    subtitle: details.join(" • "),
    tags,
    jobs,
    jobIdLabel,
    uploadType,
  };
}

function reportSearchText(report: ReportRow, allJobs: JobRow[] = []): string {
  const info = getReportDisplayInfo(report, allJobs);

  return [
    info.title,
    info.subtitle,
    info.tags.join(" "),
    report.period_label,
    report.id,
    report.analysis_id,
    dateTimeLabel(report.created_at),
    getReportJobs(report, allJobs).map((job) => `${job.job_name || ""} ${job.job_id || ""}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function rebuildDashboardFromVisibleReports(state: DashboardState, visibleReports: ReportRow[]): DashboardState {
  const jobs = extractJobsFromReports(visibleReports);
  const fallbackJobs = getAllJobs(state);
  const reportKeys = new Set(
    visibleReports.flatMap((r) => [String(r.id || ""), String(r.analysis_id || "")]).filter(Boolean)
  );

  const visibleJobs = jobs.length
    ? jobs
    : fallbackJobs.filter((job) => {
        const reportId = String(job.report_id || "");
        return !reportId || reportKeys.has(reportId);
      });

  const revenue = visibleJobs.length
    ? visibleJobs.reduce((sum, job) => sum + parseNumberLoose(job.revenue), 0)
    : visibleReports.reduce((sum, report) => sum + parseNumberLoose(report.revenue), 0);

  const costs = visibleJobs.length
    ? visibleJobs.reduce((sum, job) => sum + parseNumberLoose(job.costs), 0)
    : visibleReports.reduce((sum, report) => sum + parseNumberLoose(report.costs), 0);

  const netProfit = visibleJobs.length
    ? visibleJobs.reduce((sum, job) => sum + parseNumberLoose(job.profit), 0)
    : visibleReports.reduce((sum, report) => sum + parseNumberLoose(report.net_profit), 0);

  const marginPct = revenue ? (netProfit / revenue) * 100 : 0;
  const losingJobsCount = visibleJobs.filter((job) => parseNumberLoose(job.profit) < 0).length;

  const costMix = visibleJobs.reduce(
    (mix, job) => {
      const cb = job.cost_breakdown || {};
      mix.labor += parseNumberLoose(cb.labor);
      mix.materials += parseNumberLoose(cb.materials);
      mix.subs += parseNumberLoose(cb.subs);
      mix.other += parseNumberLoose(cb.other);
      return mix;
    },
    { labor: 0, materials: 0, subs: 0, other: 0 }
  );

  const latestReport = visibleReports
    .slice()
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())[0];

  return {
    ...state,
    reports: visibleReports,
    all_jobs: visibleJobs,
    lowest_profit_jobs: visibleJobs.slice().sort((a, b) => parseNumberLoose(a.profit) - parseNumberLoose(b.profit)),
    jobs_losing_money: visibleJobs.filter((job) => parseNumberLoose(job.profit) < 0),
    cost_mix: costMix,
    mix: costMix,
    summary: {
      ...(state.summary || {}),
      id: latestReport?.id || latestReport?.analysis_id || state.summary?.id || null,
      period_label: latestReport?.period_label || state.summary?.period_label,
      created_at: latestReport?.created_at || state.summary?.created_at || null,
      revenue,
      costs,
      net_profit: netProfit,
      margin_pct: marginPct,
      jobs_count: visibleJobs.length,
      losing_jobs_count: losingJobsCount,
      reports_count: visibleReports.length,
    },
  };
}

function editKey(userId: string): string {
  return `dc_job_edits_${userId}`;
}

function readEdits(userId: string): Record<string, Partial<EditableJob>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(editKey(userId)) || "{}") || {};
  } catch {
    return {};
  }
}

function writeEdits(userId: string, obj: Record<string, Partial<EditableJob>>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(editKey(userId), JSON.stringify(obj || {}));
  } catch {}
}

function saveJobEdit(jobKey: string, patch: Partial<EditableJob>, userId: string) {
  const edits = readEdits(userId);
  const cleanPatch = { ...(patch || {}), _editing: null };
  edits[String(jobKey)] = { ...(edits[String(jobKey)] || {}), ...cleanPatch };
  writeEdits(userId, edits);
}

function resetJobEdit(jobKey: string, userId: string) {
  const edits = readEdits(userId);
  delete edits[String(jobKey)];
  writeEdits(userId, edits);
}

function seedJobFromBase(base: JobRow): EditableJob {
  const cb = base?.cost_breakdown || {};
  const costs = parseNumberLoose(base?.costs);
  const labor = parseNumberLoose(cb.labor);
  const materials = parseNumberLoose(cb.materials);
  const subs = parseNumberLoose(cb.subs);
  const other = parseNumberLoose(cb.other);
  const known = labor + materials + subs + other;

  return {
    job_id: String(base?.job_id ?? ""),
    job_name: String(base?.job_name ?? "Job"),
    job_type: "",
    job_address: "",
    job_date: base?.created_at ? String(base.created_at).slice(0, 10) : "",
    revenue: parseNumberLoose(base?.revenue),
    labor_cost: labor,
    material_cost: materials,
    subs_cost: subs,
    other_cost: known > 0 ? other : costs,
    notes: "",
    custom_categories: [],
    _editing: null,
  };
}

function mergeJobWithEdits(seed: EditableJob, jobKey: string, userId: string): EditableJob {
  const e = readEdits(userId)[String(jobKey)] || null;
  const merged: EditableJob = e ? ({ ...seed, ...e } as EditableJob) : seed;
  if (!Array.isArray(merged.custom_categories)) merged.custom_categories = [];
  return { ...merged, _editing: null };
}

function sumCustomCategories(arr: CustomCategory[]): number {
  return (Array.isArray(arr) ? arr : []).reduce((s, x) => s + parseNumberLoose(x?.amount), 0);
}

function normalizeMonthKey(input: unknown): string {
  const d = new Date(String(input || ""));
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = String(key || "").split("-");
  if (!y || !m) return key || "Month";
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function extractJobHistory(state: DashboardState, baseJob: JobRow): JobHistoryRow[] {
  const allJobs = getAllJobs(state);
  const jobId = String(baseJob?.job_id || "").trim();
  const jobName = String(baseJob?.job_name || "").trim();

  const matches = allJobs.filter((j) => {
    const jid = String(j?.job_id || "").trim();
    const jn = String(j?.job_name || "").trim();
    if (jobId && jid) return jid === jobId;
    return jobName && jn === jobName;
  });

  return matches
    .map((j) => {
      const revenue = parseNumberLoose(j.revenue);
      const costs = parseNumberLoose(j.costs);
      const gp = Number.isFinite(parseNumberLoose(j.profit)) ? parseNumberLoose(j.profit) : revenue - costs;
      return {
        month_key: normalizeMonthKey(j.created_at || j.period_label),
        created_at: j.created_at,
        period_label: j.period_label,
        revenue,
        costs,
        gross_profit: gp,
        gross_margin_pct: revenue !== 0 ? (gp / revenue) * 100 : 0,
      };
    })
    .filter((x) => x.month_key)
    .sort((a, b) => String(a.month_key).localeCompare(String(b.month_key)));
}

function summarizeJobHealth(job: EditableJob, history: JobHistoryRow[]) {
  const revenue = parseNumberLoose(job.revenue);
  const knownCosts =
    parseNumberLoose(job.material_cost) +
    parseNumberLoose(job.labor_cost) +
    parseNumberLoose(job.subs_cost) +
    parseNumberLoose(job.other_cost) +
    sumCustomCategories(job.custom_categories || []);
  const gp = revenue - knownCosts;
  const gm = revenue !== 0 ? (gp / revenue) * 100 : 0;
  const hasHistory = Array.isArray(history) && history.length >= 2;

  let status: "ok" | "warn" | "bad" = "ok";
  let label = "Healthy";

  if (gp < 0 || gm < 0) {
    status = "bad";
    label = "Losing money";
  } else if (gm < 20) {
    status = "warn";
    label = "Thin margin";
  }

  return { status, label, gp, gm, knownCosts, confidence: hasHistory ? "History available" : "Single-period only" };
}

function dprCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height || 220));

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, w, h };
}

function lineChart(canvas: HTMLCanvasElement, labels: string[], values: number[], color = "rgba(34,211,238,.95)") {
  const packed = dprCanvas(canvas);
  if (!packed) return;

  const { ctx, w, h } = packed;
  ctx.clearRect(0, 0, w, h);

  const pad = 24;
  const gx0 = pad;
  const gx1 = w - pad;
  const gy0 = pad;
  const gy1 = h - pad;

  for (let i = 0; i < 5; i++) {
    const y = gy0 + (i * (gy1 - gy0)) / 4;
    ctx.strokeStyle = "rgba(15,23,42,.06)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
  }

  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values, 1);
  const range = maxV - minV || 1;
  const xs = values.map((_, i) => gx0 + (i * (gx1 - gx0)) / Math.max(1, values.length - 1));
  const ys = values.map((v) => gy1 - ((v - minV) / range) * (gy1 - gy0));

  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.shadowColor = "rgba(34,211,238,.22)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, ys[i]) : ctx.lineTo(x, ys[i])));
  ctx.stroke();

  ctx.shadowBlur = 0;
  const grad = ctx.createLinearGradient(0, gy0, 0, gy1);
  grad.addColorStop(0, "rgba(34,211,238,.16)");
  grad.addColorStop(1, "rgba(124,58,237,.02)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, ys[i]) : ctx.lineTo(x, ys[i])));
  ctx.lineTo(gx1, gy1);
  ctx.lineTo(gx0, gy1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(15,23,42,.85)";
  xs.forEach((x, i) => {
    ctx.beginPath();
    ctx.arc(x, ys[i], 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(15,23,42,.48)";
  ctx.textAlign = "center";

  const step = Math.max(1, Math.floor(values.length / 5));
  labels.forEach((lb, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return;
    ctx.fillText(String(lb), xs[i], h - 7);
  });
}

function barChart(canvas: HTMLCanvasElement, labels: string[], a: number[], b: number[]) {
  const packed = dprCanvas(canvas);
  if (!packed) return;

  const { ctx, w, h } = packed;
  ctx.clearRect(0, 0, w, h);

  const pad = 24;
  const gx0 = pad;
  const gx1 = w - pad;
  const gy0 = pad;
  const gy1 = h - pad;

  for (let i = 0; i < 5; i++) {
    const y = gy0 + (i * (gy1 - gy0)) / 4;
    ctx.strokeStyle = "rgba(15,23,42,.06)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
  }

  const maxV = Math.max(...a, ...b, 1);
  const n = labels.length;
  const slot = (gx1 - gx0) / Math.max(1, n);
  const bw = Math.max(6, Math.min(18, slot * 0.26));
  const gap = bw * 0.3;
  const yFor = (v: number) => gy1 - (v / maxV) * (gy1 - gy0);

  for (let i = 0; i < n; i++) {
    const xBase = gx0 + i * slot + slot / 2;

    ctx.fillStyle = "rgba(34,211,238,.75)";
    ctx.shadowColor = "rgba(34,211,238,.20)";
    ctx.shadowBlur = 10;
    ctx.fillRect(xBase - bw - gap / 2, yFor(a[i]), bw, gy1 - yFor(a[i]));

    ctx.fillStyle = "rgba(124,58,237,.68)";
    ctx.shadowColor = "rgba(124,58,237,.18)";
    ctx.shadowBlur = 10;
    ctx.fillRect(xBase + gap / 2, yFor(b[i]), bw, gy1 - yFor(b[i]));

    ctx.shadowBlur = 0;
  }

  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(15,23,42,.48)";
  ctx.textAlign = "center";

  const step = Math.max(1, Math.floor(n / 5));
  for (let i = 0; i < n; i++) {
    if (i % step !== 0 && i !== n - 1) continue;
    ctx.fillText(String(labels[i]), gx0 + i * slot + slot / 2, h - 7);
  }
}

function buildCostMixParts(state: DashboardState): CostPart[] {
  const mix = state.cost_mix || state.mix || {};
  return [
    { label: "Labor", value: parseNumberLoose(mix.labor), color: "rgba(34,211,238,.95)", shadow: "rgba(34,211,238,.25)" },
    { label: "Materials", value: parseNumberLoose(mix.materials), color: "rgba(124,58,237,.90)", shadow: "rgba(124,58,237,.20)" },
    { label: "Subs", value: parseNumberLoose(mix.subs), color: "rgba(37,99,235,.90)", shadow: "rgba(37,99,235,.18)" },
    { label: "Other", value: parseNumberLoose(mix.other), color: "rgba(52,211,153,.90)", shadow: "rgba(52,211,153,.20)" },
  ];
}

function marginTargetKey(userId: string): string {
  return `dc_margin_target_${userId}`;
}

function readMarginTarget(userId: string): number {
  if (typeof window === "undefined") return 30;
  try {
    const raw = localStorage.getItem(marginTargetKey(userId));
    const n = parseNumberLoose(raw);
    return n > 0 && n <= 95 ? n : 30;
  } catch {
    return 30;
  }
}

function writeMarginTarget(userId: string, target: number) {
  if (typeof window === "undefined") return;
  try {
    const clean = Math.max(1, Math.min(95, parseNumberLoose(target)));
    localStorage.setItem(marginTargetKey(userId), String(clean));
  } catch {}
}

function emailAlertsKey(userId: string): string {
  return `dc_email_alerts_enabled_${userId}`;
}

function readEmailAlertsEnabled(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(emailAlertsKey(userId));
    return raw == null ? true : raw === "true";
  } catch {
    return true;
  }
}

function writeEmailAlertsEnabled(userId: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(emailAlertsKey(userId), String(enabled));
  } catch {}
}

function getScaleMetrics(state: DashboardState, targetMarginPct = 30) {
  const jobs = getAllJobs(state);
  const losingJobs = jobs.filter((j) => parseNumberLoose(j.profit) < 0);
  const thinMarginJobs = jobs.filter((j) => {
    const profit = parseNumberLoose(j.profit);
    const margin = parseNumberLoose(j.margin_pct);
    return profit >= 0 && margin >= 0 && margin < targetMarginPct;
  });

  const recoverableOpportunity = jobs.reduce((sum, job) => {
    const revenue = parseNumberLoose(job.revenue);
    const profit = parseNumberLoose(job.profit);
    const targetProfit = revenue * (targetMarginPct / 100);
    const gap = targetProfit - profit;
    return sum + Math.max(0, gap);
  }, 0);

  const avgMargin =
    jobs.length > 0
      ? jobs.reduce((sum, j) => sum + parseNumberLoose(j.margin_pct), 0) / jobs.length
      : 0;

  const highRiskCount = losingJobs.length + thinMarginJobs.length;
  const worstLoss = losingJobs.reduce((min, job) => Math.min(min, parseNumberLoose(job.profit)), 0);
  const totalAtRiskRevenue = [...losingJobs, ...thinMarginJobs].reduce((sum, job) => sum + parseNumberLoose(job.revenue), 0);

  return {
    losingJobs,
    thinMarginJobs,
    recoverableOpportunity,
    avgMargin,
    highRiskCount,
    worstLoss,
    totalAtRiskRevenue,
  };
}


function getBucketCreditAmount(value: unknown): number {
  const n = parseNumberLoose(value);
  return n < 0 ? Math.abs(n) : 0;
}

function getJobCreditTotal(job: JobRow): number {
  const cb = job?.cost_breakdown || {};
  return (
    getBucketCreditAmount(cb.labor) +
    getBucketCreditAmount(cb.materials) +
    getBucketCreditAmount(cb.subs) +
    getBucketCreditAmount(cb.other)
  );
}

function getPositiveBucketAmount(value: unknown): number {
  return Math.max(0, parseNumberLoose(value));
}

function getCreditMetrics(state: DashboardState): CreditMetrics {
  const jobs = getAllJobs(state);
  const creditsByBucket = {
    labor: jobs.reduce((sum, j) => sum + getBucketCreditAmount(j.cost_breakdown?.labor), 0),
    materials: jobs.reduce((sum, j) => sum + getBucketCreditAmount(j.cost_breakdown?.materials), 0),
    subs: jobs.reduce((sum, j) => sum + getBucketCreditAmount(j.cost_breakdown?.subs), 0),
    other: jobs.reduce((sum, j) => sum + getBucketCreditAmount(j.cost_breakdown?.other), 0),
  };

  const jobCreditRows = jobs
    .map((job) => ({ job, credit: getJobCreditTotal(job) }))
    .filter((row) => row.credit > 0)
    .sort((a, b) => b.credit - a.credit);

  const totalCredits = creditsByBucket.labor + creditsByBucket.materials + creditsByBucket.subs + creditsByBucket.other;

  const positiveCostActivity = jobs.reduce((sum, j) => {
    const cb = j.cost_breakdown || {};
    return (
      sum +
      getPositiveBucketAmount(cb.labor) +
      getPositiveBucketAmount(cb.materials) +
      getPositiveBucketAmount(cb.subs) +
      getPositiveBucketAmount(cb.other)
    );
  }, 0);

  const netCostAfterCredits = parseNumberLoose(state.summary?.costs);
  const jobsWithCredits = jobCreditRows.length;

  return {
    totalCredits,
    profitRecoveredFromCredits: totalCredits,
    jobsWithCredits,
    avgCreditPerJob: jobs.length ? totalCredits / jobs.length : 0,
    avgCreditPerCreditJob: jobsWithCredits ? totalCredits / jobsWithCredits : 0,
    creditRatePct: jobs.length ? (jobsWithCredits / jobs.length) * 100 : 0,
    creditsByBucket,
    biggestCreditJob: jobCreditRows[0]?.job || null,
    biggestCreditAmount: jobCreditRows[0]?.credit || 0,
    positiveCostActivity,
    netCostAfterCredits,
  };
}

function getCreditRows(state: DashboardState) {
  return getAllJobs(state)
    .map((job, idx) => ({ job, idx, key: buildJobKey(job, idx), credit: getJobCreditTotal(job) }))
    .filter((row) => row.credit > 0)
    .sort((a, b) => b.credit - a.credit);
}

function latestDashboardUpdate(state: DashboardState): string {
  const dates: number[] = [];
  const summaryDate = safeDate(state.summary?.created_at);
  if (summaryDate) dates.push(summaryDate.getTime());
  (Array.isArray(state.reports) ? state.reports : []).forEach((r) => { const d = safeDate(r.created_at); if (d) dates.push(d.getTime()); });
  getAllJobs(state).forEach((j) => { const d = safeDate(j.created_at); if (d) dates.push(d.getTime()); });
  if (!dates.length) return "just now";
  const diffMs = Math.max(0, Date.now() - Math.max(...dates));
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function jobDetectedLabel(job: JobRow, fallbackIdx = 0): string {
  const d = safeDate(job.created_at);
  if (!d) return fallbackIdx === 0 ? "Detected just now" : `Detected ${fallbackIdx + 1} checks ago`;
  const diffMs = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return "Detected less than 1 hour ago";
  if (hours < 24) return `Detected ${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `Detected ${days} day${days === 1 ? "" : "s"} ago`;
}

function avgOf(arr: number[]): number {
  const clean = arr.filter((n) => Number.isFinite(n));
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
}

function getSimilarJobs(base: JobRow, allJobs: JobRow[]): JobRow[] {
  const baseId = String(base.job_id || "").trim().toLowerCase();
  const baseName = String(base.job_name || "").trim().toLowerCase();
  const basePrefix = baseId.includes("-") ? baseId.split("-")[0] : "";
  const words = baseName.split(/\s+/).filter((w) => w.length >= 4);
  const pool = allJobs.filter((j) => j !== base);
  const close = pool.filter((j) => {
    const jid = String(j.job_id || "").trim().toLowerCase();
    const name = String(j.job_name || "").trim().toLowerCase();
    return Boolean((basePrefix && jid.startsWith(basePrefix)) || words.some((w) => name.includes(w)));
  });
  return (close.length >= 3 ? close : pool).slice(0, 42);
}

function jobComparisonStats(base: JobRow, allJobs: JobRow[]) {
  const pool = getSimilarJobs(base, allJobs);
  const baseMix = base.cost_breakdown || {};
  const baseRevenue = parseNumberLoose(base.revenue);
  const baseCosts = parseNumberLoose(base.costs);
  const baseProfit = parseNumberLoose(base.profit);
  const baseMargin = parseNumberLoose(base.margin_pct);
  const avgRevenue = avgOf(pool.map((j) => parseNumberLoose(j.revenue)));
  const avgCosts = avgOf(pool.map((j) => parseNumberLoose(j.costs)));
  const avgProfit = avgOf(pool.map((j) => parseNumberLoose(j.profit)));
  const avgMargin = avgOf(pool.map((j) => parseNumberLoose(j.margin_pct)));
  const drivers = [
    { label: "Labor", current: parseNumberLoose(baseMix.labor), average: avgOf(pool.map((j) => parseNumberLoose(j.cost_breakdown?.labor))) },
    { label: "Materials", current: parseNumberLoose(baseMix.materials), average: avgOf(pool.map((j) => parseNumberLoose(j.cost_breakdown?.materials))) },
    { label: "Subs", current: parseNumberLoose(baseMix.subs), average: avgOf(pool.map((j) => parseNumberLoose(j.cost_breakdown?.subs))) },
    { label: "Other", current: parseNumberLoose(baseMix.other), average: avgOf(pool.map((j) => parseNumberLoose(j.cost_breakdown?.other))) },
  ].map((x) => ({ ...x, gap: x.current - x.average })).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  return { count: pool.length, baseRevenue, baseCosts, baseProfit, baseMargin, avgRevenue, avgCosts, avgProfit, avgMargin, drivers };
}

function strongestJobIssue(job: JobRow, allJobs: JobRow[], marginTarget: number): string {
  const profit = parseNumberLoose(job.profit);
  const margin = parseNumberLoose(job.margin_pct);
  const stats = jobComparisonStats(job, allJobs);
  const topDriver = stats.drivers[0];
  if (profit < 0 && topDriver && topDriver.gap > 0) return `${topDriver.label} is running ${fmtMoney(topDriver.gap)} above benchmark and this job is below breakeven.`;
  if (margin < marginTarget && topDriver && topDriver.gap > 0) return `${topDriver.label} is the biggest cost driver; margin is ${fmtPct(marginTarget - margin)} below target.`;
  if (margin < marginTarget) return `Margin is below your ${fmtPct(marginTarget)} target and should be reviewed before quoting similar work.`;
  if (profit < 0) return "This job is below breakeven and should be reviewed first.";
  return "This job is being monitored against your target margin.";
}

function StatusPill({ mode }: { mode: DashboardMode }) {
  const label = mode === "loading" ? "Loading" : mode === "error" ? "Needs attention" : "Ready";
  const dot = mode === "loading" ? "rgba(34,211,238,.95)" : mode === "error" ? "rgba(239,68,68,.95)" : "rgba(52,211,153,.95)";

  return (
    <div className="pill">
      <span className="dot" style={{ background: dot, boxShadow: `0 0 0 4px ${dot.replace(".95", ".16")}` }} />
      <span>{label}</span>
      {mode === "loading" ? <span className="spinner" /> : null}
    </div>
  );
}

function UpgradeModal({
  feature,
  requiredPlan,
  currentPlan,
  onClose,
}: {
  feature: string;
  requiredPlan: string;
  currentPlan: string;
  onClose: () => void;
}) {
  return (
    <div className="upgradeOverlay" role="dialog" aria-modal="true" aria-label="Upgrade required">
      <div className="upgradeModal">
        <button type="button" className="upgradeClose" onClick={onClose} aria-label="Close upgrade prompt">
          ×
        </button>

        <div className="upgradeBadge">Upgrade to unlock</div>
        <h3 className="upgradeTitle">{feature} is included with {requiredPlan}.</h3>

        <p className="upgradeText">
          You are currently on {currentPlan}. You can keep previewing the dashboard, or upgrade when you are ready to use this feature.
        </p>

        <div className="upgradeValueBox">
          <div className="upgradeValueTitle">What this unlocks</div>
          <div className="upgradeValueText">
            More control over job profitability, cleaner reporting, and stronger decisions from the numbers already inside your dashboard.
          </div>
        </div>

        <div className="upgradeActions">
          <a className="btn btn-primary upgradePrimary" href="/#pricing">
            View pricing
          </a>
          <button type="button" className="btn" onClick={onClose}>
            Keep previewing
          </button>
        </div>
      </div>
    </div>
  );
}

function RangeControls({
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  onExportAllJobs,
  onApply,
  canExport,
  onLockedExport,
}: {
  range: RangeKey;
  setRange: (v: RangeKey) => void;
  customFrom: string;
  setCustomFrom: (v: string) => void;
  customTo: string;
  setCustomTo: (v: string) => void;
  onExportAllJobs: () => void;
  onApply: () => void;
  canExport: boolean;
  onLockedExport: () => void;
}) {
  const ranges: { key: RangeKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "mtd", label: "MTD" },
    { key: "last7", label: "Last 7 Days" },
    { key: "last30", label: "Last 30 Days" },
    { key: "custom", label: "Custom" },
  ];

 return (
  <div className="rangeWrap">
    <div>
      <div className="rangeLabel">Date Range</div>
      <div className="rangeSub">
        Filter the whole dashboard by period.
      </div>
    </div>

    <div className="rangeRight">
      <div className="rangeButtons">
        {ranges.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={range === r.key ? "rangeBtn active" : "rangeBtn"}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === "custom" ? (
        <div className="customDates">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={canExport ? "btn" : "btn lockedBtn"}
        onClick={canExport ? onExportAllJobs : onLockedExport}
        title={canExport ? "Export all jobs" : "CSV exports unlock on Core"}
      >
        {canExport ? "Export All Jobs CSV" : "Export All Jobs CSV 🔒"}
      </button>
    </div>
  </div>
);
}


function MarginTargetControl({
  marginTarget,
  marginTargetDraft,
  setMarginTargetDraft,
  onSaveMarginTarget,
}: {
  marginTarget: number;
  marginTargetDraft: string;
  setMarginTargetDraft: (v: string) => void;
  onSaveMarginTarget: () => void;
}) {
  return (
    <div className="marginTargetTopWrap">
      <div className="marginTargetTopText">
        <div className="marginTargetTopKicker">Margin Target</div>
        <div className="marginTargetTopTitle">Compare jobs against your target margin.</div>
        <div className="marginTargetTopSub">
          Used across job detail comparisons, high-risk flags, and Scale recoverable profit calculations.
        </div>
      </div>

      <div className="marginTargetTopControls">
        <div className="compactTargetInputGroup">
          <input
            className="compactTargetInput"
            inputMode="decimal"
            value={marginTargetDraft}
            onChange={(e) => setMarginTargetDraft(e.target.value)}
            aria-label="Margin target percentage"
          />
          <span>%</span>
        </div>
        <button className="btn compactTargetSave" type="button" onClick={onSaveMarginTarget}>
          Save Target
        </button>
        <div className="marginTargetCurrent">Current target: {fmtPct(marginTarget)}</div>
      </div>
    </div>
  );
}

function TopBar({
  state,
  mode,
  onRefresh,
  plan,
}: {
  state: DashboardState;
  mode: DashboardMode;
  onRefresh: () => void;
  plan?: string;
}) {
  const s = state?.summary || null;
  const profit = parseNumberLoose(s?.net_profit);
  const margin = parseNumberLoose(s?.margin_pct);
  const losing = parseNumberLoose(s?.losing_jobs_count);
  const profitHealth = !s ? "warn" : profit < 0 || losing > 0 ? "bad" : margin < 20 ? "warn" : "ok";
  const healthLabel = profitHealth === "bad" ? "⚠ Profit risk" : profitHealth === "warn" ? "Needs optimization" : "Healthy";

  return (
    <div className="topbar">
      <div className="dashboardIntro">
        <div className="pageKicker">Profitability Dashboard</div>
        <h1 className="pageTitle">
          Every job’s <span className="gradText">profit story</span>
        </h1>
        <div className="pageSub">
  {mode === "loading" ? (
    "Loading your profitability dashboard..."
  ) : s ? (
    <>
      Viewing <b>{rangeLabel((state.range as RangeKey) || "all")}</b> totals across every saved job analyzed in DropClarity.
    </>
  ) : (
    "No reports yet. Run an analysis from the Upload page to generate your first dashboard."
  )}
</div>
      </div>

      <div className="statusRow">
        <StatusPill mode={mode} />
        {s ? <div className={`pill health ${profitHealth} ${profitHealth === "bad" ? "riskPill" : ""}`}>{healthLabel}</div> : null}


<button className="btn" type="button" onClick={onRefresh}>
  Refresh
</button>

<a className="btn btn-primary" href="/app">
  Go to Upload
</a>
      </div>
    </div>
  );
}

function DashboardHero({ state }: { state: DashboardState }) {
  const s = state.summary || {};
  const jobs = getAllJobs(state);
  const losingJobs = parseNumberLoose(s.losing_jobs_count);
  const profit = parseNumberLoose(s.net_profit);
  const margin = parseNumberLoose(s.margin_pct);

  let headline = `${rangeLabel((state.range as RangeKey) || "all")} profitability totals`;
  let sub = `You have ${parseNumberLoose(s.jobs_count)} analyzed jobs in this view with a blended margin of ${fmtPct(margin)}.`;

  if (profit < 0 || losingJobs > 0) {
    headline = "Profitability needs attention";
    sub = `${losingJobs} job${losingJobs === 1 ? "" : "s"} are losing money in this range. Start with the lowest-profit jobs below.`;
  } else if (margin < 20 && jobs.length) {
    headline = "Margins are positive but thin";
    sub = `Blended margin is ${fmtPct(margin)}. Review costs and quoting before repeating similar jobs.`;
  }

  return (
    <div className="hero">
      <div className="heroBody">
        <div>
          <div className="heroTitle">{headline}</div>
          <div className="heroSub">{sub}</div>
          <div className="heroBadges">
            <span className="tag ok">{rangeLabel((state.range as RangeKey) || "all")}</span>
            <span className="tag">{String(parseNumberLoose(s.jobs_count))} jobs analyzed</span>
            <span className="tag">{String(parseNumberLoose(s.reports_count))} saved reports</span>
          </div>
        </div>

        <div className="summaryCard">
          <div className="kv"><span>Total Revenue</span><strong>{fmtMoney(s.revenue)}</strong></div>
          <div className="kv"><span>Total Costs</span><strong>{fmtMoney(s.costs)}</strong></div>
          <div className="divider" />
          <div className="kv"><span>Total Net Profit</span><strong className={profit < 0 ? "neg" : "pos"}>{fmtMoney(s.net_profit)}</strong></div>
          <div className="kv"><span>Total Margin</span><strong>{fmtPct(s.margin_pct)}</strong></div>
          <div className="kv"><span>Losing Jobs</span><strong>{String(parseNumberLoose(s.losing_jobs_count))}</strong></div>
        </div>
      </div>
    </div>
  );
}

function Kpis({ state }: { state: DashboardState }) {
  const s = state.summary || {};
  const profit = parseNumberLoose(s.net_profit);
  const avgJobRevenue = parseNumberLoose(s.revenue) / Math.max(1, parseNumberLoose(s.jobs_count));
  const costRatio = parseNumberLoose(s.revenue) ? (parseNumberLoose(s.costs) / parseNumberLoose(s.revenue)) * 100 : 0;

  const cards = [
    { label: "Total Net Profit", value: fmtMoney(s.net_profit), sub: "Revenue minus costs", cls: profit < 0 ? "neg" : "pos" },
    { label: "Total Revenue", value: fmtMoney(s.revenue), sub: `Avg/job: ${fmtMoney(avgJobRevenue)}`, cls: "" },
    { label: "Total Costs", value: fmtMoney(s.costs), sub: `Cost ratio: ${fmtPct(costRatio)}`, cls: "" },
    { label: "Total Margin", value: fmtPct(s.margin_pct), sub: "Blended margin", cls: "" },
    { label: "Jobs Analyzed", value: String(parseNumberLoose(s.jobs_count)), sub: "Unique job IDs/names", cls: "" },
    { label: "Losing Jobs", value: String(parseNumberLoose(s.losing_jobs_count)), sub: "Below $0 profit", cls: parseNumberLoose(s.losing_jobs_count) > 0 ? "neg" : "" },
  ];

  return (
    <div className="panel">
      <div className="panelHead">
        <div>
          <div className="panelTitle">Subtotal Indicators</div>
          <div className="panelSub">Totals for the selected date range.</div>
        </div>
      </div>

      <div className="kpis">
        {cards.map((c) => (
          <div className="kpi" key={c.label}>
            <div className="kLabel">{c.label}</div>
            <div className={`kValue ${c.cls}`}>{c.value}</div>
            <div className="kSub">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditRefundKpis({ state }: { state: DashboardState }) {
  const metrics = getCreditMetrics(state);

  if (metrics.totalCredits <= 0) {
    return null;
  }

  const cards = [
    {
      label: "Profit Recovered",
      value: fmtMoney(metrics.profitRecoveredFromCredits),
      sub: "Credits/refunds reducing job cost",
    },
    {
      label: "Total Credits",
      value: fmtMoney(metrics.totalCredits),
      sub: "Negative invoice lines detected",
    },
    {
      label: "Jobs w/ Credits",
      value: String(metrics.jobsWithCredits),
      sub: "Jobs with refunds or credits",
    },
    {
      label: "Avg Credit / Job",
      value: fmtMoney(metrics.avgCreditPerCreditJob),
      sub: "Across credit jobs only",
    },
  ];

  return (
    <div className="creditKpiPanel">
      <div className="creditKpiHead">
        <div>
          <div className="creditKpiTitle">Credit / Refund Tracking</div>
          <div className="creditKpiSub">A quiet check for supplier credits, warranty refunds, and credit memos. These are included in profit but kept from distorting cost mix visuals.</div>
        </div>
      </div>

      <div className="creditKpiGrid">
        {cards.map((c) => (
          <div className="creditKpiCard" key={c.label}>
            <div className="creditKpiLabel">{c.label}</div>
            <div className="creditKpiValue">{c.value}</div>
            <div className="creditKpiNote">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartsPanel({ state, view }: { state: DashboardState; view: ViewMode }) {
  const profitRef = useRef<HTMLCanvasElement | null>(null);
  const revCostRef = useRef<HTMLCanvasElement | null>(null);
  const jobs = getAllJobs(state);
  const parts = useMemo(() => buildCostMixParts(state), [state]);
  const creditMetrics = useMemo(() => getCreditMetrics(state), [state]);

  useEffect(() => {
    if (view !== "dashboard") return;

    const sorted = jobs.slice().sort((a, b) => parseNumberLoose(a.profit) - parseNumberLoose(b.profit)).slice(0, 12);
    const labels = sorted.map((j) => String(j.job_id || j.job_name || "Job").slice(0, 10));
    const profit = sorted.map((j) => parseNumberLoose(j.profit));
    const revenue = sorted.map((j) => parseNumberLoose(j.revenue));
    const costs = sorted.map((j) => parseNumberLoose(j.costs));

    if (profitRef.current && sorted.length) lineChart(profitRef.current, labels, profit, "rgba(16,185,129,.95)");
    if (revCostRef.current && sorted.length) barChart(revCostRef.current, labels, revenue, costs);
  }, [jobs, view]);

  return (
    <div className="charts">
      <div className="chartCard">
        <div className="chartHead">
          <div>
            <div className="chartTitle">Lowest-Profit Jobs</div>
            <div className="chartSub">Net profit by job in the selected range</div>
          </div>
        </div>
        {jobs.length ? <canvas ref={profitRef} width={520} height={220} /> : <div className="trendEmpty">No jobs in this range yet.</div>}
      </div>

      <div className="chartCard">
        <div className="chartHead">
          <div>
            <div className="chartTitle">Revenue vs Costs</div>
            <div className="chartSub">Top lowest-profit jobs</div>
          </div>
        </div>
        {jobs.length ? <canvas ref={revCostRef} width={520} height={220} /> : <div className="trendEmpty">No job-level totals yet.</div>}
      </div>

      <div className="chartCard wide">
        <div className="chartHead responsiveHead">
          <div>
            <div className="chartTitle">Cost Mix</div>
            <div className="chartSub">
              Donut/list visuals use absolute cost activity, while each card still shows the true signed bucket total.
            </div>
          </div>

          {creditMetrics.totalCredits > 0 ? (
            <span className="creditAppliedPill">Credits applied: -{fmtMoney(creditMetrics.totalCredits).replace("$", "$")}</span>
          ) : null}
        </div>

        <div className="mixList gridMix">
          {parts.map((p) => {
            const total = parts.reduce((s, x) => s + Math.abs(x.value), 0) || 1;
            const visualValue = Math.abs(p.value);
            const share = (visualValue / total) * 100;
            const isCredit = p.value < 0;

            return (
              <div className={isCredit ? "mixRow creditMixRow" : "mixRow"} key={p.label}>
                <div className="mixTop">
                  <span><span className="sw" style={{ background: p.color }} /> <b>{p.label}</b></span>
                  <span className={isCredit ? "creditText" : ""}>{fmtMoney(p.value)}</span>
                </div>
                <div className="barTrack">
                  <div
                    className={isCredit ? "barFill creditBarFill" : "barFill"}
                    style={{ width: `${Math.min(100, share)}%`, background: p.color }}
                  />
                </div>
                <div className="mixSub">
                  {fmtPct(share)} of cost activity{isCredit ? " • credit/refund bucket" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobsLog({ jobs, onOpenJob }: { jobs: JobRow[]; onOpenJob: (jobKey: string) => void }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<JobsSortKey>("date");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const rows = jobs
      .map((job, idx) => ({ job, idx, key: buildJobKey(job, idx) }))
      .filter(({ job }) => {
        if (!q) return true;
        return `${job.job_name || ""} ${job.job_id || ""} ${job.period_label || ""}`.toLowerCase().includes(q);
      });

    rows.sort((a, b) => {
      if (sort === "profit") return parseNumberLoose(a.job.profit) - parseNumberLoose(b.job.profit);
      if (sort === "margin") return parseNumberLoose(a.job.margin_pct) - parseNumberLoose(b.job.margin_pct);
      if (sort === "revenue") return parseNumberLoose(b.job.revenue) - parseNumberLoose(a.job.revenue);
      return new Date(b.job.created_at || "").getTime() - new Date(a.job.created_at || "").getTime();
    });

    return rows;
  }, [jobs, search, sort]);

  return (
    <div className="panel" id="jobsPanel">
      <div className="panelHead responsiveHead">
        <div>
          <div className="panelTitle">All Jobs Log</div>
          <div className="panelSub">Search, sort, and open any job.</div>
        </div>

        <div className="tableTools">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search job..." className="searchInput" />
          <select value={sort} onChange={(e) => setSort(e.target.value as JobsSortKey)} className="selectInput">
            <option value="date">Newest</option>
            <option value="profit">Lowest profit</option>
            <option value="margin">Lowest margin</option>
            <option value="revenue">Highest revenue</option>
          </select>
        </div>
      </div>

      <div className="tableWrap">
        {filtered.length ? (
          <table className="jobsTable">
            <thead>
              <tr>
                <th>Job</th>
                <th>Date</th>
                <th>Revenue</th>
                <th>Costs</th>
                <th>Profit</th>
                <th>Margin</th>
                <th>Credits</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ job, key }) => {
                const status = statusForJob(job);
                return (
                  <tr key={key}>
                    <td>
                      <div className="jobName">{job.job_name || job.job_id || "Unnamed job"}</div>
                      <div className="jobMeta">{job.job_id || "No Job ID"} • {job.period_label || "Report"}</div>
                    </td>
                    <td>{dateLabel(job.created_at)}</td>
                    <td>{fmtMoney(job.revenue)}</td>
                    <td>{fmtMoney(job.costs)}</td>
                    <td className={parseNumberLoose(job.profit) < 0 ? "neg strong" : "pos strong"}>{fmtMoney(job.profit)}</td>
                    <td>{fmtPct(job.margin_pct)}</td>
                    <td className={getJobCreditTotal(job) > 0 ? "creditText strong" : ""}>
                      {getJobCreditTotal(job) > 0 ? fmtMoney(getJobCreditTotal(job)) : "—"}
                    </td>
                    <td><span className={`tag ${status.cls}`}>{status.label}</span></td>
                    <td><button className="miniBtn" type="button" onClick={() => onOpenJob(key)}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty">No jobs match this filter.</div>
        )}
      </div>
    </div>
  );
}

function PastReports({
  reports,
  allJobs,
  totalReports,
  hiddenReportsCount,
  onDeleteReport,
  onManageReports,
}: {
  reports: ReportRow[];
  allJobs: JobRow[];
  totalReports: number;
  hiddenReportsCount: number;
  onDeleteReport: (report: ReportRow, idx: number) => void;
  onManageReports: () => void;
}) {
  return (
    <div className="panel">
      <div className="panelHead responsiveHead">
        <div>
          <div className="panelTitle">Past Reports</div>
          <div className="panelSub">
            Saved upload snapshots. Review or hide mistaken uploads from dashboard totals.
          </div>
        </div>
        <button className="reportsManageLink" type="button" onClick={onManageReports}>
          Manage
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="pad">
        <div className="reportMiniStats">
          <span>{totalReports} total</span>
          <span>{reports.length} active</span>
          {hiddenReportsCount > 0 ? <span>{hiddenReportsCount} hidden</span> : null}
        </div>

        {reports.length ? (
          <div className="list">
            {reports.slice(0, 8).map((r, idx) => {
              const p = parseNumberLoose(r.net_profit);
              const info = getReportDisplayInfo(r, allJobs);
              const creditTotal = getReportCreditTotal(r, allJobs);

              return (
                <div className="item reportPreviewItem" key={`${r.id || r.created_at}-${idx}`}>
                  <div className="itemTop">
                    <div>
                      <div className="itemName reportItemTitle">{info.title}</div>
                      <div className="itemMeta">{info.subtitle}</div>
                      <div className="reportTagRow">
                        {info.tags.slice(0, 3).map((tag) => (
                          <span className="reportInfoTag" key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="reportActions">
                      <div className={p < 0 ? "neg strong" : "pos strong"}>{fmtMoney(p)}</div>
                      <button className="deleteReportBtn" type="button" onClick={() => onDeleteReport(r, idx)} title="Hide this upload from dashboard totals">×</button>
                    </div>
                  </div>
                  <div className="itemMeta">Revenue: <b>{fmtMoney(r.revenue)}</b> • Costs: <b>{fmtMoney(r.costs)}</b> • Margin: <b>{fmtPct(r.margin_pct)}</b>{creditTotal > 0 ? <> • Credits: <b>{fmtMoney(creditTotal)}</b></> : null}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">No active reports in this view.</div>
        )}

        {reports.length > 8 ? (
          <button className="reportMoreLink" type="button" onClick={onManageReports}>
            View {reports.length - 8} more report{reports.length - 8 === 1 ? "" : "s"} →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Insights({ insights }: { insights: Insight[] }) {
  return (
    <div className="panel insightsPanel">
      <div className="panelHead insightsPanelHead">
        <div>
          <div className="panelTitle">Latest AI Insights</div>
          <div className="panelSub">Highlights from the latest report.</div>
        </div>
      </div>

      <div className="pad insightsPad">
        {insights.length ? (
          <div className="insightList">
            {insights.slice(0, 4).map((i, idx) => {
              const impact = String(i.impact || "").toLowerCase();
              const cls = impact.includes("high") || impact.includes("critical") ? "bad" : impact.includes("medium") || impact.includes("moderate") ? "warn" : "ok";
              const title = String(i.title || "Insight").trim();
              const impactLabel = String(i.impact || "Insight").trim();
              const detail = String(i.detail || "").trim();
              const recommendation = String(i.recommendation || "").trim();

              return (
                <article className="insightCard" key={`${title}-${idx}`}>
                  <div className="insightTop">
                    <div className="insightTitleWrap">
                      <div className="insightTitle">{title}</div>
                      {detail ? <p className="insightDetail">{detail}</p> : null}
                    </div>
                    <span className={`insightImpact ${cls}`}>{impactLabel}</span>
                  </div>

                  {recommendation ? (
                    <div className="insightRecommendation">
                      <span>Recommended</span>
                      <p>{recommendation}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty">No insights yet.</div>
        )}
      </div>
    </div>
  );
}

function ScaleOversightPanel({
  state,
  plan,
  scaleSummary,
  marginTarget,
  marginTargetDraft,
  setMarginTargetDraft,
  onSaveMarginTarget,
  emailAlertsEnabled,
  setEmailAlertsEnabled,
  userEmail,
  onOpenJob,
  onOpenHighRisk,
}: {
  state: DashboardState;
  plan: string;
  scaleSummary: ScaleSummary | null;
  marginTarget: number;
  marginTargetDraft: string;
  setMarginTargetDraft: (v: string) => void;
  onSaveMarginTarget: () => void;
  emailAlertsEnabled: boolean;
  setEmailAlertsEnabled: (v: boolean) => void;
  userEmail?: string | null;
  onOpenJob: (jobKey: string) => void;
  onOpenHighRisk: () => void;
}) {
  const jobs = getAllJobs(state);
  const fallbackMetrics = getScaleMetrics(state, marginTarget);
  const backendStats = scaleSummary?.stats || null;
  const backendBenchmarks = scaleSummary?.benchmarks || null;
  const access = getPlanAccess(plan);
  const isScale = access.canUseScale;
  const canPreviewScale = access.canPreviewScale;
  const updatedAtLabel = latestDashboardUpdate(state);

  const riskJobsFromData = jobs
    .filter((job) => parseNumberLoose(job.profit) < 0 || parseNumberLoose(job.margin_pct) < marginTarget)
    .sort((a, b) => {
      const aProfit = parseNumberLoose(a.profit);
      const bProfit = parseNumberLoose(b.profit);
      if (aProfit < 0 || bProfit < 0) return aProfit - bProfit;
      return parseNumberLoose(a.margin_pct) - parseNumberLoose(b.margin_pct);
    });

  const displayedRiskJobs = isScale ? riskJobsFromData.slice(0, 4) : canPreviewScale ? riskJobsFromData.slice(0, 1) : [];

  const losingLossAmount = fallbackMetrics.losingJobs.reduce((sum, job) => {
    const p = parseNumberLoose(job.profit);
    return sum + Math.abs(Math.min(0, p));
  }, 0);

  const thinMarginOpportunity = fallbackMetrics.thinMarginJobs.reduce((sum, job) => {
    const revenue = parseNumberLoose(job.revenue);
    const profit = parseNumberLoose(job.profit);
    const targetProfit = revenue * (marginTarget / 100);
    return sum + Math.max(0, targetProfit - profit);
  }, 0);

  const materialTotal = parseNumberLoose((state.cost_mix || state.mix || {}).materials);
  const laborTotal = parseNumberLoose((state.cost_mix || state.mix || {}).labor);
  const subsTotal = parseNumberLoose((state.cost_mix || state.mix || {}).subs);
  const otherTotal = parseNumberLoose((state.cost_mix || state.mix || {}).other);
  const knownCosts = materialTotal + laborTotal + subsTotal + otherTotal;
  const materialShare = knownCosts ? (materialTotal / knownCosts) * 100 : 0;
  const laborShare = knownCosts ? (laborTotal / knownCosts) * 100 : 0;

  const avgMargin =
    backendStats?.avg_margin != null
      ? parseNumberLoose(backendStats.avg_margin)
      : backendBenchmarks?.avg_margin_pct != null
      ? parseNumberLoose(backendBenchmarks.avg_margin_pct)
      : fallbackMetrics.avgMargin;

  const profitPerJob =
    backendBenchmarks?.profit_per_job != null
      ? parseNumberLoose(backendBenchmarks.profit_per_job)
      : jobs.length
      ? jobs.reduce((sum, j) => sum + parseNumberLoose(j.profit), 0) / jobs.length
      : 0;

  const totalRevenue = parseNumberLoose(state.summary?.revenue || backendStats?.total_revenue);
  const totalCosts = parseNumberLoose(state.summary?.costs || backendStats?.total_costs);
  const costRatio = totalRevenue ? (totalCosts / totalRevenue) * 100 : 0;

  const creditMetrics = getCreditMetrics(state);
  const recoverableOpportunity = fallbackMetrics.recoverableOpportunity;
  const monthlyLift = recoverableOpportunity / 12;
  const lastAlertSentLabel = emailAlertsEnabled && fallbackMetrics.highRiskCount > 0 ? updatedAtLabel : "No alert sent yet";
  const nextSummaryLabel = "Tomorrow at 8:00 AM";
  const riskLevel: "healthy" | "warning" | "critical" =
    fallbackMetrics.losingJobs.length > 0 ? "critical" : fallbackMetrics.thinMarginJobs.length > 0 ? "warning" : "healthy";
  const riskCls = riskLevel === "healthy" ? "ok" : riskLevel === "warning" ? "warn" : "bad";

  const currentRange = rangeLabel((state.range as RangeKey) || "all");
  const summaryTitle =
    fallbackMetrics.highRiskCount > 0
      ? `${fallbackMetrics.highRiskCount} active high-risk alert${fallbackMetrics.highRiskCount === 1 ? "" : "s"} need review.`
      : `No jobs are currently below your ${fmtPct(marginTarget)} target.`;

  const summaryCopy =
    fallbackMetrics.highRiskCount > 0
      ? `Based on your ${fmtPct(marginTarget)} margin target, DropClarity found ${fmtMoney(recoverableOpportunity)} in recoverable profit opportunity across this ${currentRange.toLowerCase()} view. If corrected, that is roughly ${fmtMoney(monthlyLift)} per month in added profit.`
      : `DropClarity is monitoring each saved job against your ${fmtPct(marginTarget)} margin target and will flag jobs that fall below it.`;

  const leakRows = [
    {
      label: "Losing jobs",
      amount: losingLossAmount,
      meta: `${fallbackMetrics.losingJobs.length} job${fallbackMetrics.losingJobs.length === 1 ? "" : "s"} below breakeven`,
      fix: "Review price, labor, and material assumptions before quoting similar jobs again.",
      cls: losingLossAmount > 0 ? "bad" : "ok",
    },
    {
      label: "Thin-margin jobs",
      amount: thinMarginOpportunity,
      meta: `${fallbackMetrics.thinMarginJobs.length} job${fallbackMetrics.thinMarginJobs.length === 1 ? "" : "s"} below ${fmtPct(marginTarget)} target`,
      fix: "Raise pricing, reduce costs, or flag these jobs before they turn negative.",
      cls: thinMarginOpportunity > 0 ? "warn" : "ok",
    },
    {
      label: "Credits recovered",
      amount: creditMetrics.totalCredits,
      meta: `${creditMetrics.jobsWithCredits} job${creditMetrics.jobsWithCredits === 1 ? "" : "s"} with supplier/warranty credits`,
      fix: "Track these separately so credits improve profit without making cost mix charts misleading.",
      cls: creditMetrics.totalCredits > 0 ? "ok" : "ok",
    },
    {
      label: "Materials exposure",
      amount: materialTotal,
      meta: `${fmtPct(materialShare)} of known costs`,
      fix: "Review supplier pricing, equipment assumptions, parts markup, and purchasing consistency.",
      cls: materialShare > 55 ? "warn" : "ok",
    },
  ];

  const actionRows = [
    {
      title: `Recover ${fmtMoney(recoverableOpportunity)} by pricing to your ${fmtPct(marginTarget)} target`,
      impact: recoverableOpportunity,
      priority: recoverableOpportunity > 0 ? "high" : "low",
      category: "margin_target",
    },
    {
      title:
        fallbackMetrics.losingJobs.length > 0
          ? `Review ${fallbackMetrics.losingJobs.length} losing job${fallbackMetrics.losingJobs.length === 1 ? "" : "s"} first`
          : "No losing jobs currently detected",
      impact: losingLossAmount,
      priority: losingLossAmount > 0 ? "critical" : "low",
      category: "job_review",
    },
    {
      title:
        avgMargin < marginTarget
          ? `Investigate why average margin is below your ${fmtPct(marginTarget)} target`
          : `Average margin is above your ${fmtPct(marginTarget)} target`,
      impact: Math.max(0, recoverableOpportunity - losingLossAmount),
      priority: avgMargin < marginTarget ? "high" : "low",
      category: "trend",
    },
  ];

  const benchmarkRows = [
    {
      label: "Target Margin",
      value: fmtPct(marginTarget),
      note: "User-set target used for alerts",
      cls: "ok",
    },
    {
      label: "Average Job Margin",
      value: fmtPct(avgMargin),
      note: avgMargin >= marginTarget ? "Above target" : "Below target",
      cls: avgMargin >= marginTarget ? "ok" : "warn",
    },
    {
      label: "Profit Per Job",
      value: fmtMoney(profitPerJob),
      note: "Net profit divided by analyzed jobs",
      cls: profitPerJob >= 0 ? "ok" : "bad",
    },
    {
      label: "Cost Ratio",
      value: fmtPct(costRatio),
      note: "Known costs as a share of revenue",
      cls: costRatio <= 100 - marginTarget ? "ok" : "warn",
    },
    {
      label: "Recoverable Profit",
      value: fmtMoney(recoverableOpportunity),
      note: `Gap to ${fmtPct(marginTarget)} target`,
      cls: recoverableOpportunity > 0 ? "warn" : "ok",
    },
    {
      label: "Total Credits",
      value: fmtMoney(creditMetrics.totalCredits),
      note: `${creditMetrics.jobsWithCredits} jobs with negative cost lines`,
      cls: creditMetrics.totalCredits > 0 ? "ok" : "ok",
    },
    {
      label: "Labor Share",
      value: fmtPct(laborShare),
      note: "Labor as a share of known costs",
      cls: laborShare > 50 ? "warn" : "ok",
    },
  ];

  const openJobFromRow = (job: JobRow) => {
    const idx = jobs.findIndex((j) => j === job);
    if (idx >= 0) onOpenJob(buildJobKey(job, idx));
  };

  if (!isScale) {
    const lockedFeatures = [
      {
        title: "Real-time email alerts",
        text: "Automatically notify the right people when a job loses money or drops below your margin target.",
      },
      {
        title: "Recoverable profit opportunities",
        text: "Surface the profit gap between current performance and your target margin without showing Core users the full Scale engine.",
      },
      {
        title: "Advanced job benchmarking",
        text: "Compare high-risk jobs against similar or recent jobs to identify what is driving margin differences.",
      },
    ];

    return (
      <div className="scalePanel premiumScalePanel scaleLockedPanel">
        <div className="panelHead scaleControlHead">
          <div>
            <div className="panelTitle">Scale Profit Control Center</div>
            <div className="panelSub">
              Upgrade to Scale to unlock real-time high-risk job alerts, recoverable profit tracking, priority action workflows, advanced benchmarking, and automated email alerts.
            </div>
          </div>

          <div className="scaleHeadRight">
            <div className="lockedScaleBadge"><span className="lockGlyph">🔒</span> Scale locked</div>
          </div>
        </div>

        <div className="lockedScaleHero">
          <div className="lockedScaleIcon">🔒</div>
          <div>
            <div className="lockedScaleKicker">Scale upgrade</div>
            <div className="lockedScaleTitle">Protect profit automatically as jobs are analyzed.</div>
            <div className="lockedScaleText">
              Your Core dashboard shows job profitability, trends, and cost breakdowns. Scale adds the automated oversight layer for teams that want DropClarity to flag issues, estimate recoverable profit, and trigger alerts without manually reviewing every job.
            </div>
            <div className="lockedScaleActions">
              <a className="btn btn-primary" href="/#pricing">Upgrade to Scale</a>
              <button className="btn" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                Keep reviewing Core dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="lockedFeatureGrid">
          {lockedFeatures.map((feature) => (
            <div className="lockedFeatureCard" key={feature.title}>
              <div className="lockedFeatureTop">
                <span className="lockedMiniIcon">🔒</span>
                <div className="lockedFeatureTitle">{feature.title}</div>
              </div>
              <div className="lockedFeatureText">{feature.text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="scalePanel premiumScalePanel">
      <div className="panelHead scaleControlHead">
        <div>
          <div className="panelTitle">Scale Profit Control Center</div>
          <div className="panelSub">
            High-risk job alerts, recoverable profit, margin targets, and real-time email alerts in one operating view.
          </div>
        </div>

        <div className="scaleHeadRight">
          <div className={`tag ${riskCls}`}>
            {isScale ? "Scale active" : canPreviewScale ? "Scale preview" : "Scale locked"} · {riskLevel}
          </div>
          <div className="alertStatusPill">
            <span className={fallbackMetrics.highRiskCount > 0 ? "alertDot hot" : "alertDot"} />
            {fallbackMetrics.highRiskCount} Active High-Risk Alert{fallbackMetrics.highRiskCount === 1 ? "" : "s"}
          </div>
          <div className="liveUpdatePill">Updated {updatedAtLabel}</div>
        </div>
      </div>

      {!isScale ? (
        <div className={canPreviewScale ? "gateBanner preview" : "gateBanner locked"}>
          <strong>{canPreviewScale ? "Scale preview mode" : "Scale features locked"}</strong>
          <span>
            {canPreviewScale
              ? "Preview Scale value here. Full real-time alerts, impact tracking, and action workflows unlock on Scale."
              : "Upgrade to Scale for high-risk alerts, recoverable profit estimates, margin targets, and real-time email alerting."}
          </span>
        </div>
      ) : null}

      <div className="scaleCommandGrid">
        <div className="scaleCommandHero">
          <div className="scaleKicker">Profit Intelligence</div>
          <div className="scaleTitle heroScaleTitle">{summaryTitle}</div>
          <div className="scaleText">{summaryCopy}</div>

          <div className="scaleMiniStats">
            <div>
              <span>At-Risk Jobs</span>
              <strong>{String(fallbackMetrics.highRiskCount)}</strong>
            </div>
            <div>
              <span>Recoverable Profit</span>
              <strong>{fmtMoney(recoverableOpportunity)}</strong>
            </div>
            <div>
              <span>Credits Recovered</span>
              <strong>{fmtMoney(creditMetrics.totalCredits)}</strong>
            </div>
            <div>
              <span>Worst Job Loss</span>
              <strong className={fallbackMetrics.worstLoss < 0 ? "neg" : ""}>{fmtMoney(fallbackMetrics.worstLoss)}</strong>
            </div>
            <div>
              <span>Monthly Lift</span>
              <strong>{fmtMoney(monthlyLift)}</strong>
            </div>
          </div>
        </div>

        <div className="scaleEmailCard">
          <div className="scaleKicker">Real-Time Email Alerts</div>
          <div className="emailAlertTitle">{emailAlertsEnabled ? "Email alerts are enabled" : "Email alerts are paused"}</div>
          <div className="scaleText">
            Send an email when a job loses money, falls below your margin target, or needs immediate review.
          </div>
          <div className="emailDestination">
            <span>Alert destination</span>
            <strong>{userEmail || "Account email"}</strong>
          </div>
          <div className="emailLiveGrid">
            <div><span>Last alert sent</span><strong>{lastAlertSentLabel}</strong></div>
            <div><span>Next summary</span><strong>{nextSummaryLabel}</strong></div>
          </div>
          <div className="emailTriggerList">
            <span>✓ Job becomes unprofitable</span>
            <span>✓ Margin drops below {fmtPct(marginTarget)}</span>
            <span>✓ Cost spike needs review</span>
          </div>
          <button
            className={emailAlertsEnabled ? "emailPauseLink" : "btn btn-primary"}
            type="button"
            onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
          >
            {emailAlertsEnabled ? "Pause Email Alerts" : "Enable Email Alerts"}
          </button>
        </div>
      </div>

      <div className="scaleGrid scaleGridPremiumV2">
        <div className="scaleCard">
          <div className="scaleCardHeaderRow">
            <div>
              <div className="scaleKicker">High-Risk Job Alerts</div>
              <div className="scaleCardSub">Jobs that are losing money or below your margin target.</div>
            </div>
            {displayedRiskJobs.length ? (
              <button className="miniBtn viewAllAlertsBtn" type="button" onClick={onOpenHighRisk}>
                View all
              </button>
            ) : null}
          </div>

          <div className="alertList">
            {displayedRiskJobs.length ? (
              displayedRiskJobs.map((job, idx) => {
                const profit = parseNumberLoose(job.profit);
                const margin = parseNumberLoose(job.margin_pct);
                const label = profit < 0 ? "Loss" : "Below Target";
                const issue = strongestJobIssue(job, jobs, marginTarget);

                return (
                  <div className="alertItem premiumAlert" key={`${job.job_id || job.job_name || "job"}-${idx}`}>
                    <div className="alertMain">
                      <div className="alertName">{job.job_name || job.job_id || "Unnamed job"}</div>
                      <div className="alertMeta">
                        {label}: {fmtMoney(profit)} · Margin {fmtPct(margin)} · {jobDetectedLabel(job, idx)}
                      </div>
                      <div className="alertIssue">Issue: {issue}</div>
                      <div className="alertCompareNote">Compared against {Math.max(1, jobComparisonStats(job, jobs).count)} similar or recent jobs.</div>
                      <div className="alertActions">
                        <button className="miniBtn" type="button" onClick={() => openJobFromRow(job)}>
                          Review Job
                        </button>
                        <button className="miniBtn ghostMini" type="button" onClick={onOpenHighRisk}>
                          View Jobs
                        </button>
                      </div>
                    </div>
                    <span className={profit < 0 ? "tag bad" : "tag warn"}>{profit < 0 ? "Critical" : "Risk"}</span>
                  </div>
                );
              })
            ) : (
              <div className="empty compact">
                {canPreviewScale ? `No jobs are currently below your ${fmtPct(marginTarget)} target.` : "High-risk alerts unlock on Scale."}
              </div>
            )}
          </div>
        </div>

        <div className="scaleCard">
          <div className="scaleKicker">Where You're Losing Money</div>

          <div className="leakList">
            {isScale || canPreviewScale ? (
              leakRows.map((leak) => (
                <div className="leakItem premiumLeak" key={leak.label}>
                  <div className="leakTop">
                    <div>
                      <div className="leakName">{leak.label}</div>
                      <div className="leakMeta">{leak.meta}</div>
                    </div>
                    <div className={`leakAmount ${leak.cls}`}>{fmtMoney(leak.amount)}</div>
                  </div>
                  <div className="leakFix">{leak.fix}</div>
                </div>
              ))
            ) : (
              <div className="empty compact">Profit leak breakdown unlocks on Scale.</div>
            )}
          </div>
        </div>

        <div className="scaleCard">
          <div className="scaleKicker">What To Fix First</div>

          <div className="actionStack">
            {isScale || canPreviewScale ? (
              actionRows.map((action, idx) => {
                const cls =
                  action.priority === "critical" || action.priority === "high"
                    ? "bad"
                    : action.priority === "low"
                    ? "ok"
                    : "warn";

                return (
                  <div className="actionCard premiumAction" key={`${action.title}-${idx}`}>
                    <div className="actionTop">
                      <span className={`tag ${cls}`}>#{idx + 1} {action.priority}</span>
                      {action.impact > 0 ? <strong>{fmtMoney(action.impact)}</strong> : null}
                    </div>
                    <div className="actionName">{action.title}</div>
                    <div className="actionMeta">{action.category}</div>
                    <div className="actionButtons">
                      <a className="miniBtn" href="#jobsPanel">
                        {idx === 0 ? "Apply Pricing Strategy" : idx === 1 ? "Review Jobs" : "View Trend"}
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty compact">Priority actions unlock on Scale.</div>
            )}
          </div>
        </div>

        <div className="scaleCard wideScaleCard">
          <div className="scaleKicker">Performance Snapshot</div>

          <div className="benchmarkGrid benchmarkGridV2">
            {benchmarkRows.map((row) => (
              <div className="benchmarkRow" key={row.label}>
                <div>
                  <div className="benchmarkLabel">{row.label}</div>
                  <div className="benchmarkNote">{row.note}</div>
                </div>
                <div className={`benchmarkValue ${row.cls}`}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="scaleCard alertsExplainerCard">
          <div className="scaleKicker">Alert Rules</div>
          <div className="ruleList">
            <div><b>Critical</b><span>Profit is below $0.</span></div>
            <div><b>High risk</b><span>Margin is below your {fmtPct(marginTarget)} target.</span></div>
            <div><b>Email</b><span>Send immediately when a new critical alert is detected.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardBody({
  state,
  setView,
  setJobKey,
  onOpenHighRisk,
  view,
  reports,
  allReportsCount,
  hiddenReportsCount,
  onDeleteReport,
  onManageReports,
  plan,
  scaleSummary,
  marginTarget,
  marginTargetDraft,
  setMarginTargetDraft,
  onSaveMarginTarget,
  emailAlertsEnabled,
  setEmailAlertsEnabled,
  userEmail,
}: {
  state: DashboardState;
  setView: (v: ViewMode) => void;
  setJobKey: (v: string) => void;
  onOpenHighRisk: () => void;
  view: ViewMode;
  reports: ReportRow[];
  allReportsCount: number;
  hiddenReportsCount: number;
  onDeleteReport: (report: ReportRow, idx: number) => void;
  onManageReports: () => void;
  plan: string;
  scaleSummary: ScaleSummary | null;
  marginTarget: number;
  marginTargetDraft: string;
  setMarginTargetDraft: (v: string) => void;
  onSaveMarginTarget: () => void;
  emailAlertsEnabled: boolean;
  setEmailAlertsEnabled: (v: boolean) => void;
  userEmail?: string | null;
}) {
  const jobs = getAllJobs(state);
  const insights = Array.isArray(state.insights) ? state.insights : [];

  return (
    <>
      <Kpis state={state} />
      <DashboardHero state={state} />
      <ChartsPanel state={state} view={view} />
      <CreditRefundKpis state={state} />
      <ScaleOversightPanel
        state={state}
        plan={plan}
        scaleSummary={scaleSummary}
        marginTarget={marginTarget}
        marginTargetDraft={marginTargetDraft}
        setMarginTargetDraft={setMarginTargetDraft}
        onSaveMarginTarget={onSaveMarginTarget}
        emailAlertsEnabled={emailAlertsEnabled}
        setEmailAlertsEnabled={setEmailAlertsEnabled}
        userEmail={userEmail}
        onOpenJob={(key: string) => {
          setJobKey(key);
          setView("job");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenHighRisk={onOpenHighRisk}
      />

      <div className="grid">
        <div className="mainCol">
          <JobsLog
            jobs={jobs}
            onOpenJob={(key: string) => {
              setJobKey(key);
              setView("job");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>

        <div className="sideStack">
          <PastReports reports={reports} allJobs={jobs} totalReports={allReportsCount} hiddenReportsCount={hiddenReportsCount} onDeleteReport={onDeleteReport} onManageReports={onManageReports} />
          <Insights insights={insights} />
        </div>
      </div>
    </>
  );
}


function JobComparisonPanel({ base, state, marginTarget }: { base: JobRow; state: DashboardState; marginTarget: number }) {
  const allJobs = getAllJobs(state);
  const stats = jobComparisonStats(base, allJobs);
  const gap = stats.baseMargin - stats.avgMargin;
  const driver = stats.drivers[0];
  const statusCls = stats.baseMargin >= marginTarget ? "ok" : stats.baseProfit < 0 ? "bad" : "warn";
  const statusText = stats.baseMargin >= marginTarget ? "Above target" : stats.baseProfit < 0 ? "Losing money" : "Below target";
  const rows = [
    { label: "Margin", current: fmtPct(stats.baseMargin), average: fmtPct(stats.avgMargin), gap: `${gap >= 0 ? "+" : ""}${gap.toFixed(1)} pts`, bad: gap < 0 },
    { label: "Revenue", current: fmtMoney(stats.baseRevenue), average: fmtMoney(stats.avgRevenue), gap: fmtMoney(stats.baseRevenue - stats.avgRevenue), bad: false },
    { label: "Total Costs", current: fmtMoney(stats.baseCosts), average: fmtMoney(stats.avgCosts), gap: fmtMoney(stats.baseCosts - stats.avgCosts), bad: stats.baseCosts > stats.avgCosts },
    { label: "Gross Profit", current: fmtMoney(stats.baseProfit), average: fmtMoney(stats.avgProfit), gap: fmtMoney(stats.baseProfit - stats.avgProfit), bad: stats.baseProfit < stats.avgProfit },
  ];

  return (
    <div className="panel comparisonPanel">
      <div className="panelHead comparisonHead">
        <div>
          <div className="sectionEyebrow">Job Comparison View</div>
          <div className="panelTitle">This job vs similar jobs</div>
          <div className="panelSub">Compared against {stats.count || Math.max(0, allJobs.length - 1)} similar or recent jobs to show what is driving the margin difference.</div>
        </div>
        <span className={`tag ${statusCls}`}>{statusText}</span>
      </div>
      <div className="comparisonGrid">
        <div className="comparisonScoreCard"><div className="comparisonLabel">Margin gap</div><div className={gap < 0 ? "comparisonValue neg" : "comparisonValue pos"}>{gap >= 0 ? "+" : ""}{gap.toFixed(1)} pts</div><div className="comparisonSub">Target: {fmtPct(marginTarget)} · Current: {fmtPct(stats.baseMargin)}</div></div>
        <div className="comparisonDriverCard"><div className="comparisonLabel">Biggest cost driver</div><div className="driverTitle">{driver?.label || "Costs"}</div><div className="comparisonSub">{driver ? `${fmtMoney(driver.current)} current vs ${fmtMoney(driver.average)} benchmark` : "Not enough cost detail yet."}</div></div>
        <div className="comparisonTableWrap"><table className="comparisonTable"><thead><tr><th>Metric</th><th>This Job</th><th>Benchmark</th><th>Gap</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.current}</td><td>{row.average}</td><td className={row.bad ? "neg strong" : "pos strong"}>{row.gap}</td></tr>)}</tbody></table></div>
      </div>
      <div className="driverGrid">{stats.drivers.map((d) => <div className="driverMini" key={d.label}><div className="driverMiniTop"><span>{d.label}</span><strong className={d.gap > 0 ? "neg" : "pos"}>{d.gap >= 0 ? "+" : ""}{fmtMoney(d.gap)}</strong></div><div className="driverMiniSub">This job: {fmtMoney(d.current)} · Benchmark: {fmtMoney(d.average)}</div></div>)}</div>
    </div>
  );
}

function JobEditor({
  jobKey,
  base,
  state,
  showBack,
  onBack,
  onAllJobs,
  refreshLocal,
  userId,
  access,
  onLocked,
  marginTarget = 30,
}: {
  jobKey: string;
  base: JobRow;
  state: DashboardState;
  showBack: boolean;
  onBack: () => void;
  onAllJobs: () => void;
  refreshLocal: () => void;
  userId: string;
  access: PlanAccess;
  onLocked: (feature: string, requiredPlan: string) => void;
  marginTarget?: number;
}) {
  const [job, setJob] = useState<EditableJob>(() => mergeJobWithEdits(seedJobFromBase(base || {}), jobKey, userId));
  const history = extractJobHistory(state, base || {});
  const health = summarizeJobHealth(job, history);
  const hasHistory = history.length >= 2;
  const uid = jobKey.replace(/[^a-zA-Z0-9_-]/g, "_");

  const profitRef = useRef<HTMLCanvasElement | null>(null);
  const revCostRef = useRef<HTMLCanvasElement | null>(null);
  const marginRef = useRef<HTMLCanvasElement | null>(null);

  const [saved, setSaved] = useState(false);
  const [editingMoneyField, setEditingMoneyField] = useState<
    "revenue" | "labor_cost" | "material_cost" | "subs_cost" | "other_cost" | null
  >(null);
  const [moneyDrafts, setMoneyDrafts] = useState<
    Record<"revenue" | "labor_cost" | "material_cost" | "subs_cost" | "other_cost", string>
  >({
    revenue: "",
    labor_cost: "",
    material_cost: "",
    subs_cost: "",
    other_cost: "",
  });
  const [editingCustomAmountIndex, setEditingCustomAmountIndex] = useState<number | null>(null);
  const [customAmountDrafts, setCustomAmountDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    setJob(mergeJobWithEdits(seedJobFromBase(base || {}), jobKey, userId));
    setEditingMoneyField(null);
    setEditingCustomAmountIndex(null);
    setMoneyDrafts({
      revenue: "",
      labor_cost: "",
      material_cost: "",
      subs_cost: "",
      other_cost: "",
    });
    setCustomAmountDrafts({});
  }, [jobKey, base, userId]);

  const customTotal = sumCustomCategories(job.custom_categories || []);
  const knownCosts = parseNumberLoose(job.material_cost) + parseNumberLoose(job.labor_cost) + parseNumberLoose(job.subs_cost) + parseNumberLoose(job.other_cost) + customTotal;
  const gp = parseNumberLoose(job.revenue) - knownCosts;
  const gm = parseNumberLoose(job.revenue) !== 0 ? (gp / parseNumberLoose(job.revenue)) * 100 : 0;

  useEffect(() => {
    if (!hasHistory) return;

    const labels = history.map((x) => formatMonthLabel(String(x.month_key || "")));
    const profit = history.map((x) => parseNumberLoose(x.gross_profit));
    const revenue = history.map((x) => parseNumberLoose(x.revenue));
    const costs = history.map((x) => parseNumberLoose(x.costs));
    const margin = history.map((x) => parseNumberLoose(x.gross_margin_pct));

    if (profitRef.current) lineChart(profitRef.current, labels, profit, "rgba(16,185,129,.95)");
    if (revCostRef.current) barChart(revCostRef.current, labels, revenue, costs);
    if (marginRef.current) lineChart(marginRef.current, labels, margin, "rgba(124,58,237,.92)");
  }, [hasHistory, history]);

  const setField = (field: keyof EditableJob, value: string | number | CustomCategory[] | EditableJob["_editing"]) => {
    setJob((j) => ({ ...j, [field]: value }));
  };

  const updateCustom = (idx: number, patch: Partial<CustomCategory>) => {
    if (!access.canUseCustomCategories) return;
    setJob((j) => ({
      ...j,
      custom_categories: j.custom_categories.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };

  const addCustom = () => {
    if (!access.canUseCustomCategories) {
      handleLocked("Custom categories", "Core");
      return;
    }
    setJob((j) => ({ ...j, custom_categories: [...j.custom_categories, { name: "", amount: 0 }] }));
  };

  const removeCustom = (idx: number) => {
    if (!access.canUseCustomCategories) {
      handleLocked("Custom categories", "Core");
      return;
    }
    setJob((j) => ({ ...j, custom_categories: j.custom_categories.filter((_, i) => i !== idx) }));
  };

  const handleLocked = (feature: string, requiredPlan: string) => {
    onLocked(feature, requiredPlan);
  };

  const save = () => {
    if (!access.canSaveJobEdits) {
      handleLocked("Saving job edits", "Core");
      return;
    }
    saveJobEdit(jobKey, job, userId);
    setSaved(true);
    setTimeout(() => setSaved(false), 900);
  };

  const reset = () => {
    resetJobEdit(jobKey, userId);
    setJob(mergeJobWithEdits(seedJobFromBase(base || {}), jobKey, userId));
  };

  const renderMoneyCell = (
    label: string,
    field: "revenue" | "labor_cost" | "material_cost" | "subs_cost" | "other_cost"
  ) => {
    const isEditing = editingMoneyField === field;
    const displayValue = isEditing ? moneyDrafts[field] : fmtMoney(job[field]);

    return (
      <td>
        <input
          className="cellEdit moneyEditInput"
          inputMode="decimal"
          type="text"
          value={displayValue}
          onFocus={(e) => {
            const rawValue = String(parseNumberLoose(job[field]));
            setEditingMoneyField(field);
            setMoneyDrafts((drafts) => ({ ...drafts, [field]: rawValue }));

            const input = e.currentTarget;
            window.setTimeout(() => {
              input?.focus();
              input?.select();
            }, 0);
          }}
          onChange={(e) => {
            const raw = e.currentTarget.value;
            setMoneyDrafts((drafts) => ({ ...drafts, [field]: raw }));
            setJob((current) => ({
              ...current,
              [field]: parseMoneyInput(raw),
            }));
          }}
          onBlur={() => {
            const finalValue = parseMoneyInput(moneyDrafts[field]);
            setJob((current) => ({
              ...current,
              [field]: finalValue,
            }));
            setMoneyDrafts((drafts) => ({ ...drafts, [field]: "" }));
            setEditingMoneyField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          aria-label={label}
          placeholder="$0.00"
        />
      </td>
    );
  };

  return (
    <>
      {showBack ? (
        <div className="jobHero">
          <div className="crumbs">
            <div className="crumb">View: <strong>Job Detail</strong></div>
            <div className="crumb">Job: <strong>{job.job_id || job.job_name || "—"}</strong></div>
            <button className="crumbBtn" type="button" onClick={onBack}>← Back to dashboard</button>
            <button className="crumbBtn secondary" type="button" onClick={onAllJobs}>View all jobs</button>
          </div>

          <div className="jobHeroBody">
            <div>
              <div className="jobHeroTitle">{job.job_name || job.job_id || "Job Detail"}</div>
              <div className="jobHeroSub">Edit costs, add categories, and review margin history for this job.</div>
              <div className="heroBadges">
                <span className={`tag ${health.status}`}>{health.label}</span>
                <span className="tag ok">{health.confidence}</span>
                <span className="tag">{hasHistory ? `${history.length} periods` : "Single period"}</span>
                {job.job_type ? <span className="tag">{job.job_type}</span> : null}
              </div>
            </div>

            <div className="jobSummaryCard">
              <div className="kv"><span>Edited Gross Profit</span><strong className={gp < 0 ? "neg" : "pos"}>{fmtMoney(gp)}</strong></div>
              <div className="kv"><span>Edited Gross Margin</span><strong className={gm < 0 ? "neg" : "pos"}>{fmtPct(gm)}</strong></div>
              <div className="divider" />
              <div className="kv"><span>Revenue</span><strong>{fmtMoney(job.revenue)}</strong></div>
              <div className="kv"><span>Known Costs</span><strong>{fmtMoney(knownCosts)}</strong></div>
              <div className="kv"><span>Credits Applied</span><strong className="creditText">{fmtMoney(getJobCreditTotal(base))}</strong></div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="jobPage">
        <div className="jobStats">
          <div className="stat"><div className="statLabel">Gross Profit</div><div className={`statValue ${gp < 0 ? "neg" : "pos"}`}>{fmtMoney(gp)}</div><div className="statSub">Includes manual edits.</div></div>
          <div className="stat"><div className="statLabel">Gross Margin</div><div className={`statValue ${gm < 0 ? "neg" : "pos"}`}>{fmtPct(gm)}</div><div className="statSub">Based on edited values.</div></div>
          <div className="stat"><div className="statLabel">Revenue</div><div className="statValue">{fmtMoney(job.revenue)}</div><div className="statSub">Editable below.</div></div>
          <div className="stat"><div className="statLabel">Known Costs</div><div className="statValue">{fmtMoney(knownCosts)}</div><div className="statSub">Cost buckets + custom.</div></div>
          <div className="stat"><div className="statLabel">Credits Applied</div><div className="statValue creditText">{fmtMoney(getJobCreditTotal(base))}</div><div className="statSub">Negative cost lines on this job.</div></div>
          <div className="stat"><div className="statLabel">Manual Categories</div><div className="statValue">{job.custom_categories.length}</div><div className="statSub">Commission, subs, reserves, etc.</div></div>
        </div>

        <div className="jobAnalysisHeader">
          <div>
            <div className="sectionEyebrow">Job Analysis</div>
            <div className="sectionTitle">Edit, adjust, and understand this job’s profitability</div>
          </div>
          <div className="sectionSubtle">Focused view for one job.</div>
        </div>

        <JobComparisonPanel base={base} state={state} marginTarget={marginTarget} />

        <div className="panel jobDetailFocus">
          <div className="panelHead">
            <div><div className="panelTitle">Job detail</div><div className="panelSub">Edit job info, cost buckets, notes, and manual categories.</div></div>
            <div className="buttonRow">
              <button
  className="btn btn-primary"
  type="button"
  onClick={save}
>
  {saved ? "Saved ✓" : access.canSaveJobEdits ? "Save changes" : "Save changes 🔒"}
</button>

<button
  className="btn"
  type="button"
  onClick={() => access.canExport ? exportSingleJobCsv(job, base, history, state) : handleLocked("CSV exports", "Core")}
>
  {access.canExport ? "Export Job CSV" : "Export Job CSV 🔒"}
</button>

<button className="btn" type="button" onClick={reset}>
  Reset
</button>

<button className="btn" type="button" onClick={addCustom}>
  {access.canUseCustomCategories ? "＋ Add category" : "＋ Add category 🔒"}
</button>
            </div>
          </div>

          <div className="pad jobDetailPad">
            <table className="jobTable">
              <thead>
                <tr>
                  <th>Job ID</th><th>Job Name</th><th>Type</th><th>Address</th><th>Date</th><th>Revenue</th><th>Labor</th><th>Materials</th><th>Subs</th><th>Other</th><th>Gross Profit</th><th>Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input className="cellEdit" value={job.job_id} onChange={(e) => setField("job_id", e.target.value)} placeholder="JOB-1021" /><div className="cellHint">Identifier</div></td>
                  <td><input className="cellEdit" value={job.job_name} onChange={(e) => setField("job_name", e.target.value)} placeholder="Customer / project" /><div className="cellHint">Name</div></td>
                  <td><input className="cellEdit" value={job.job_type} onChange={(e) => setField("job_type", e.target.value)} placeholder="Install" /><div className="cellHint">Optional</div></td>
                  <td><input className="cellEdit" value={job.job_address} onChange={(e) => setField("job_address", e.target.value)} placeholder="Address" /><div className="cellHint">Optional</div></td>
                  <td><input className="cellEdit" value={job.job_date} onChange={(e) => setField("job_date", e.target.value)} placeholder="YYYY-MM-DD" /><div className="cellHint">Optional</div></td>
                  {renderMoneyCell("Revenue", "revenue")}
                  {renderMoneyCell("Labor", "labor_cost")}
                  {renderMoneyCell("Materials", "material_cost")}
                  {renderMoneyCell("Subs", "subs_cost")}
                  {renderMoneyCell("Other", "other_cost")}
                  <td><div className={`calcCell ${gp < 0 ? "neg" : "pos"}`}>{fmtMoney(gp)}</div></td>
                  <td><div className={`calcCell ${gm < 0 ? "neg" : ""}`}>{fmtPct(gm)}</div></td>
                </tr>

                {job.custom_categories.map((row, idx) => (
                  <tr key={`${uid}-${idx}`}>
                    <td colSpan={6}><input className="cellEdit customInlineInput" value={row.name} disabled={!access.canUseCustomCategories} onChange={(e) => updateCustom(idx, { name: e.target.value })} placeholder="e.g. Sales Commission" /><div className="cellHint">Manual cost category</div></td>
                    <td colSpan={4}><input
                      className="cellEdit customAmountInput moneyEditInput"
                      inputMode="decimal"
                      type="text"
                      disabled={!access.canUseCustomCategories}
                      value={editingCustomAmountIndex === idx ? customAmountDrafts[idx] ?? "" : fmtMoney(row.amount)}
                      onFocus={(e) => {
                        const rawValue = String(parseNumberLoose(row.amount));
                        setEditingCustomAmountIndex(idx);
                        setCustomAmountDrafts((drafts) => ({ ...drafts, [idx]: rawValue }));

                        window.setTimeout(() => {
                          e.currentTarget.focus();
                          e.currentTarget.select();
                        }, 0);
                      }}
                      onChange={(e) => {
                        const raw = e.currentTarget.value;
                        setCustomAmountDrafts((drafts) => ({ ...drafts, [idx]: raw }));
                        updateCustom(idx, { amount: parseMoneyInput(raw) });
                      }}
                      onBlur={() => {
                        const finalValue = parseMoneyInput(customAmountDrafts[idx]);
                        updateCustom(idx, { amount: finalValue });
                        setCustomAmountDrafts((drafts) => {
                          const next = { ...drafts };
                          delete next[idx];
                          return next;
                        });
                        setEditingCustomAmountIndex(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="$0.00"
                    /><div className="cellHint">Additional cost amount</div></td>
                    <td colSpan={2}><div className="customRemoveWrap"><button className="btn-mini btn-danger" type="button" onClick={() => removeCustom(idx)}>× Remove</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="supportGrid">
              <div className="panel miniPanel">
                <div className="panelHead"><div><div className="panelTitle">Job notes</div><div className="panelSub">Add context for this job.</div></div></div>
                <div className="pad"><textarea className="cellEdit noteBox" value={job.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Example: Added 8% sales commission manually because it was not shown on the source export." /></div>
              </div>

              <div className="panel miniPanel">
                <div className="panelHead"><div><div className="panelTitle">Benchmarks</div><div className="panelSub">Quick checks for pricing decisions.</div></div></div>
                <div className="pad">
                  <div className="list">
                    <div className="item"><div className="itemName">Gross margin target</div><div className="itemMeta">Current: <b>{fmtPct(gm)}</b> • Target: <b>20–30%+</b> • {gm >= 30 ? "Strong." : gm >= 20 ? "Healthy but watch drift." : "Below target."}</div></div>
                    <div className="item"><div className="itemName">Manual categories</div><div className="itemMeta">Use for commissions, reserves, fuel, warranty, or missed costs.</div></div>
                    <div className="item"><div className="itemName">Practical use</div><div className="itemMeta">Save local edits without changing the original analysis.</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="jobCharts">
          <div className="chartCard"><div className="chartHead"><div><div className="chartTitle">Gross Profit Trend</div><div className="chartSub">By period for this job</div></div></div>{hasHistory ? <canvas ref={profitRef} width={520} height={220} /> : <div className="trendEmpty">Upload this job in another period to show trends.</div>}</div>
          <div className="chartCard"><div className="chartHead"><div><div className="chartTitle">Revenue vs Costs</div><div className="chartSub">For this job only</div></div></div>{hasHistory ? <canvas ref={revCostRef} width={520} height={220} /> : <div className="trendEmpty">More periods for this job will unlock this chart.</div>}</div>
          <div className="chartCard wide"><div className="chartHead"><div><div className="chartTitle">Margin Trend</div><div className="chartSub">Gross margin % by period</div></div></div>{hasHistory ? <canvas ref={marginRef} width={520} height={220} /> : <div className="trendEmpty">Margin history appears after multiple periods.</div>}</div>
        </div>
      </div>
    </>
  );
}

function JobView({
  state,
  jobKey,
  setView,
  setJobKey,
  refreshLocal,
  userId,
  access,
  onLocked,
  marginTarget = 30,
}: {
  state: DashboardState;
  jobKey: string;
  setView: (v: ViewMode) => void;
  setJobKey: (v: string) => void;
  refreshLocal: () => void;
  userId: string;
  access: PlanAccess;
  onLocked: (feature: string, requiredPlan: string) => void;
  marginTarget?: number;
}) {
  const base = findJobByKey(state, jobKey);

  if (!base) {
    return (
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="crumbs"><div className="crumb">View: <strong>Job Detail</strong></div><button className="crumbBtn" type="button" onClick={() => { setView("dashboard"); setJobKey(""); }}>← Back to dashboard</button></div>
        <div className="pad"><div className="empty">This job could not be found in the current dashboard state.</div></div>
      </div>
    );
  }

  return (
    <JobEditor
      jobKey={jobKey}
      base={base}
      state={state}
      showBack
      userId={userId}
      onBack={() => { setView("dashboard"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      onAllJobs={() => { setView("alljobs"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      refreshLocal={refreshLocal}
      access={access}
      onLocked={onLocked}
      marginTarget={marginTarget}
    />
  );
}

function AllJobsView({
  state,
  setView,
  setJobKey,
  refreshLocal,
  userId,
  access,
  onLocked,
}: {
  state: DashboardState;
  setView: (v: ViewMode) => void;
  setJobKey: (v: string) => void;
  refreshLocal: () => void;
  userId: string;
  access: PlanAccess;
  onLocked: (feature: string, requiredPlan: string) => void;
}) {
  const jobs = getAllJobs(state);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs
      .map((job, idx) => ({ job, idx, key: buildJobKey(job, idx) }))
      .filter(({ job }) => !q || `${job.job_name || ""} ${job.job_id || ""}`.toLowerCase().includes(q));
  }, [jobs, search]);

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <div className="crumbs">
        <div className="crumb">View: <strong>All Jobs Detail</strong></div>
        <div className="crumb"><strong>{String(filtered.length)}</strong> jobs shown</div>
        <button className="crumbBtn" type="button" onClick={() => { setView("dashboard"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Back to dashboard</button>
      </div>
      <div className="pad"><input className="searchInput wideSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs before expanding details..." /></div>
      <div className="pad">
        {filtered.length ? (
          filtered.map(({ job, key }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <JobEditor jobKey={key} base={job} state={state} showBack={false} userId={userId} access={access} onLocked={onLocked} onBack={() => {}} onAllJobs={() => {}} refreshLocal={refreshLocal} />
            </div>
          ))
        ) : (
          <div className="empty">No jobs match this search.</div>
        )}
      </div>
    </div>
  );
}


function HighRiskJobsView({
  state,
  setView,
  setJobKey,
  refreshLocal,
  userId,
  access,
  onLocked,
  marginTarget,
}: {
  state: DashboardState;
  setView: (v: ViewMode) => void;
  setJobKey: (v: string) => void;
  refreshLocal: () => void;
  userId: string;
  access: PlanAccess;
  onLocked: (feature: string, requiredPlan: string) => void;
  marginTarget: number;
}) {
  const jobs = getAllJobs(state);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs
      .map((job, idx) => ({ job, idx, key: buildJobKey(job, idx) }))
      .filter(({ job }) => parseNumberLoose(job.profit) < 0 || parseNumberLoose(job.margin_pct) < marginTarget)
      .sort((a, b) => {
        const ap = parseNumberLoose(a.job.profit);
        const bp = parseNumberLoose(b.job.profit);
        if (ap < 0 || bp < 0) return ap - bp;
        return parseNumberLoose(a.job.margin_pct) - parseNumberLoose(b.job.margin_pct);
      })
      .filter(({ job }) => !q || `${job.job_name || ""} ${job.job_id || ""}`.toLowerCase().includes(q));
  }, [jobs, marginTarget, search]);

  return (
    <div className="highRiskPage">
      <div className="highRiskHero panel">
        <div className="crumbs">
          <div className="crumb">View: <strong>High-Risk Jobs</strong></div>
          <div className="crumb"><strong>{String(filtered.length)}</strong> jobs below target</div>
          <button className="crumbBtn" type="button" onClick={() => { setView("dashboard"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Back to dashboard</button>
        </div>
        <div className="highRiskHeroBody">
          <div>
            <div className="sectionEyebrow">High-Risk Job Detail View</div>
            <div className="highRiskTitle">Review every job that needs attention.</div>
            <div className="highRiskSub">This view opens the full job detail editor for every job losing money or sitting below your {fmtPct(marginTarget)} margin target.</div>
          </div>
          <div className="highRiskSearchWrap">
            <input className="searchInput wideSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search high-risk jobs..." />
          </div>
        </div>
      </div>

      <div className="highRiskJobStack">
        {filtered.length ? (
          filtered.map(({ job, key }) => (
            <div key={key} className="highRiskJobCard">
              <JobEditor
                jobKey={key}
                base={job}
                state={state}
                showBack={false}
                userId={userId}
                access={access}
                onLocked={onLocked}
                onBack={() => {}}
                onAllJobs={() => {}}
                refreshLocal={refreshLocal}
                marginTarget={marginTarget}
              />
            </div>
          ))
        ) : (
          <div className="panel"><div className="pad"><div className="empty">No high-risk jobs match this view.</div></div></div>
        )}
      </div>
    </div>
  );
}

function ReportsManagerView({
  allReports,
  activeReports,
  allJobs,
  deletedReportKeys,
  onBack,
  onDeleteReport,
  onRestoreReport,
  onDeleteAllReports,
  onRestoreAllReports,
  onRefresh,
}: {
  allReports: ReportRow[];
  activeReports: ReportRow[];
  allJobs: JobRow[];
  deletedReportKeys: string[];
  onBack: () => void;
  onDeleteReport: (report: ReportRow, originalIdx: number) => void;
  onRestoreReport: (report: ReportRow, originalIdx: number) => void;
  onDeleteAllReports: () => void;
  onRestoreAllReports: () => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ReportsSortKey>("newest");

  const deletedSet = useMemo(() => new Set(deletedReportKeys.map(String)), [deletedReportKeys]);
  const hiddenCount = allReports.filter((report, idx) => deletedSet.has(reportDeleteKey(report, idx))).length;
  const activeCount = activeReports.length;

  const totals = useMemo<ReportTotals>(() => {
    return activeReports.reduce<ReportTotals>(
      (sum: ReportTotals, report: ReportRow) => {
        return {
          revenue: sum.revenue + parseNumberLoose(report.revenue),
          costs: sum.costs + parseNumberLoose(report.costs),
          netProfit: sum.netProfit + parseNumberLoose(report.net_profit),
        };
      },
      { revenue: 0, costs: 0, netProfit: 0 }
    );
  }, [activeReports]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();

    const mapped = allReports
      .map((report, originalIdx) => {
        const key = reportDeleteKey(report, originalIdx);
        const hidden = deletedSet.has(key);
        const info = getReportDisplayInfo(report, allJobs);
        const creditTotal = getReportCreditTotal(report, allJobs);
        return { report, originalIdx, key, hidden, info, creditTotal };
      })
      .filter(({ report }) => {
        if (!q) return true;
        return reportSearchText(report, allJobs).includes(q);
      });

    mapped.sort((a, b) => {
      if (sort === "oldest") return new Date(a.report.created_at || "").getTime() - new Date(b.report.created_at || "").getTime();
      if (sort === "profit_low") return parseNumberLoose(a.report.net_profit) - parseNumberLoose(b.report.net_profit);
      if (sort === "profit_high") return parseNumberLoose(b.report.net_profit) - parseNumberLoose(a.report.net_profit);
      if (sort === "revenue_high") return parseNumberLoose(b.report.revenue) - parseNumberLoose(a.report.revenue);
      return new Date(b.report.created_at || "").getTime() - new Date(a.report.created_at || "").getTime();
    });

    return mapped;
  }, [allReports, allJobs, deletedSet, search, sort]);

  return (
    <div className="reportsManagerPage">
      <div className="panel reportsManagerHero">
        <div className="crumbs">
          <div className="crumb">View: <strong>Manage Reports</strong></div>
          <div className="crumb"><strong>{activeCount}</strong> active</div>
          <div className="crumb"><strong>{hiddenCount}</strong> hidden</div>
          <button className="crumbBtn" type="button" onClick={onBack}>← Back to dashboard</button>
        </div>

        <div className="reportsManagerBody">
          <div>
            <div className="sectionEyebrow">Report Management</div>
            <div className="reportsManagerTitle">Clean up mistaken uploads without losing control.</div>
            <div className="reportsManagerSub">
              Hide a report to remove it from dashboard totals, charts, job logs, cost mix, credits, and Scale metrics. Restore hidden reports anytime.
            </div>
          </div>

          <div className="reportsSummaryCard">
            <div className="kv"><span>Active Reports</span><strong>{activeCount}</strong></div>
            <div className="kv"><span>Hidden Reports</span><strong>{hiddenCount}</strong></div>
            <div className="divider" />
            <div className="kv"><span>Active Revenue</span><strong>{fmtMoney(totals.revenue)}</strong></div>
            <div className="kv"><span>Active Costs</span><strong>{fmtMoney(totals.costs)}</strong></div>
            <div className="kv"><span>Active Net Profit</span><strong className={totals.netProfit < 0 ? "neg" : "pos"}>{fmtMoney(totals.netProfit)}</strong></div>
          </div>
        </div>
      </div>

      <div className="panel reportsManagerPanel">
        <div className="panelHead responsiveHead">
          <div>
            <div className="panelTitle">All Reports</div>
            <div className="panelSub">Search by job name, Job ID, upload type, date, or report ID. Hide mistaken uploads and dashboard totals update immediately.</div>
          </div>

          <div className="tableTools reportManagerTools">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..." className="searchInput" />
            <select value={sort} onChange={(e) => setSort(e.target.value as ReportsSortKey)} className="selectInput">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="profit_low">Lowest profit</option>
              <option value="profit_high">Highest profit</option>
              <option value="revenue_high">Highest revenue</option>
            </select>
            <button className="btn" type="button" onClick={onRefresh}>Refresh</button>
          </div>
        </div>

        <div className="reportsBulkActions">
          <button className="btn btn-danger-soft" type="button" onClick={onDeleteAllReports} disabled={!allReports.length || activeCount === 0}>
            Hide all active reports
          </button>
          <button className="btn" type="button" onClick={onRestoreAllReports} disabled={hiddenCount === 0}>
            Restore hidden reports
          </button>
        </div>

        <div className="tableWrap">
          {rows.length ? (
            <table className="jobsTable reportsTable">
              <thead>
                <tr>
                  <th>Report / Job</th>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Costs</th>
                  <th>Net Profit</th>
                  <th>Margin</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ report, originalIdx, key, hidden, info, creditTotal }) => {
                  const p = parseNumberLoose(report.net_profit);
                  return (
                    <tr key={key} className={hidden ? "hiddenReportRow" : ""}>
                      <td>
                        <div className="reportNameWrap">
                          <div>
                            <div className="jobName reportManagerJobName">{info.title}</div>
                            <div className="jobMeta">{info.subtitle}</div>
                            <div className="reportIdText">Report ID: {report.id || report.analysis_id || "Saved upload"}</div>
                            <div className="reportTagRow">
                              {info.tags.map((tag) => (
                                <span className="reportInfoTag" key={tag}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{dateTimeLabel(report.created_at)}</td>
                      <td>{fmtMoney(report.revenue)}</td>
                      <td>{fmtMoney(report.costs)}</td>
                      <td className={p < 0 ? "neg strong" : "pos strong"}>{fmtMoney(p)}</td>
                      <td>{fmtPct(report.margin_pct)}{creditTotal > 0 ? <div className="reportCreditText">Credits {fmtMoney(creditTotal)}</div> : null}</td>
                      <td><span className={hidden ? "tag warn" : "tag ok"}>{hidden ? "Hidden" : "Active"}</span></td>
                      <td>
                        {hidden ? (
                          <button className="miniBtn" type="button" onClick={() => onRestoreReport(report, originalIdx)}>
                            Restore
                          </button>
                        ) : (
                          <button className="miniBtn reportHideBtn" type="button" onClick={() => onDeleteReport(report, originalIdx)}>
                            Hide
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty">No reports match this search.</div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const USER_ID = user?.id || FALLBACK_USER_ID;
  const { getToken } = useAuth();

  const [upgradePrompt, setUpgradePrompt] = useState<{ feature: string; requiredPlan: string } | null>(null);

  const plan = useMemo(() => {
    if (!isLoaded || !isSignedIn) return "free";

    const rawPlan = String(user?.publicMetadata?.plan || "free").trim().toLowerCase();
    const subscriptionStatus = String(
      user?.publicMetadata?.subscriptionStatus || "inactive"
    ).trim().toLowerCase();

    const hasPaidAccess = ["active", "trialing"].includes(subscriptionStatus);

    // Only Free, Core, and Scale should exist in the dashboard UI now.
    return hasPaidAccess ? normalizePlanName(rawPlan) : "free";
  }, [
    isLoaded,
    isSignedIn,
    user?.publicMetadata?.plan,
    user?.publicMetadata?.subscriptionStatus,
  ]);


  const access = useMemo(() => getPlanAccess(plan), [plan]);

  const [state, setState] = useState<DashboardState>({});
  const [scaleSummary, setScaleSummary] = useState<ScaleSummary | null>(null);
  const [mode, setMode] = useState<DashboardMode>("loading");
  const [error, setError] = useState<string>("");
  const [view, setView] = useState<ViewMode>("dashboard");
  const [jobKey, setJobKey] = useState<string>("");
  const [deletedReportKeys, setDeletedReportKeys] = useState<string[]>([]);
  const [range, setRange] = useState<RangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [marginTarget, setMarginTarget] = useState<number>(30);
  const [marginTargetDraft, setMarginTargetDraft] = useState<string>("30");
  const [emailAlertsEnabled, setEmailAlertsEnabledState] = useState<boolean>(true);

  const loadAndRender = useCallback(async () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setMode("error");
      setError("Please sign in to view your dashboard.");
      return;
    }

    try {
      setMode("loading");
      setError("");

      const token = await getToken();
      const data = await apiGetDashboard(token, range, customFrom, customTo);

      let scaleData: ScaleSummary | null = null;
      try {
        scaleData = await apiGetScaleSummary(token);
      } catch (scaleError) {
        console.error("Failed to load Scale summary", scaleError);
      }

      setState({ ...(data || {}), range });
      setScaleSummary(scaleData);
      setMode("ready");
    } catch (e: unknown) {
      setMode("error");
      setError(e instanceof Error ? e.message : String(e));
      console.error(e);
    }
  }, [isLoaded, isSignedIn, getToken, range, customFrom, customTo]);

useEffect(() => {
  if (!isLoaded) return;

  const savedTarget = readMarginTarget(USER_ID);
  setMarginTarget(savedTarget);
  setMarginTargetDraft(String(savedTarget));
  setEmailAlertsEnabledState(readEmailAlertsEnabled(USER_ID));
  setDeletedReportKeys(readDeletedReports(USER_ID));
  loadAndRender();
}, [USER_ID, isLoaded, loadAndRender]);

  const saveMarginTarget = () => {
    const next = Math.max(1, Math.min(95, parseNumberLoose(marginTargetDraft)));
    setMarginTarget(next);
    setMarginTargetDraft(String(next));
    writeMarginTarget(USER_ID, next);
  };

  const setEmailAlertsEnabled = (enabled: boolean) => {
    setEmailAlertsEnabledState(enabled);
    writeEmailAlertsEnabled(USER_ID, enabled);
  };


  const refreshLocal = () => {};

  const allReports = useMemo(
    () => (Array.isArray(state.reports) ? state.reports : []),
    [state.reports]
  );

  const reports = useMemo(
    () => filterDeletedReports(allReports, deletedReportKeys),
    [allReports, deletedReportKeys]
  );

  const hiddenReportsCount = useMemo(() => {
    const deletedSet = new Set(deletedReportKeys.map(String));
    return allReports.filter((report, idx) => deletedSet.has(reportDeleteKey(report, idx))).length;
  }, [allReports, deletedReportKeys]);

  const visibleState = useMemo(
    () => rebuildDashboardFromVisibleReports(state, reports),
    [state, reports]
  );

  const persistDeletedReports = (keys: string[]) => {
    const next = Array.from(new Set(keys.map(String)));
    setDeletedReportKeys(next);
    writeDeletedReports(USER_ID, next);
  };

  const handleDeleteReport = (report: ReportRow, idx: number) => {
    const ok = window.confirm(
      "Hide this upload from dashboard totals? This removes it from totals, charts, job logs, Cost Mix, credits, and Scale metrics on this browser. You can restore it from Manage Reports."
    );

    if (!ok) return;

    const originalIdx = allReports.findIndex((r, originalIndex) => {
      if (r === report) return true;
      const sameId = (r.id && report.id && r.id === report.id) || (r.analysis_id && report.analysis_id && r.analysis_id === report.analysis_id);
      if (sameId) return true;
      return (
        reportDeleteKey(r, originalIndex) === reportDeleteKey(report, idx) ||
        (String(r.created_at || "") === String(report.created_at || "") &&
          String(r.period_label || "") === String(report.period_label || "") &&
          parseNumberLoose(r.net_profit) === parseNumberLoose(report.net_profit))
      );
    });
    const key = reportDeleteKey(report, originalIdx >= 0 ? originalIdx : idx);
    persistDeletedReports([...deletedReportKeys, key]);

    setJobKey("");
  };

  const handleRestoreReport = (_report: ReportRow, idx: number) => {
    const key = reportDeleteKey(_report, idx);
    persistDeletedReports(deletedReportKeys.filter((x) => x !== key));
    setJobKey("");
  };

  const handleDeleteAllReports = () => {
    const ok = window.confirm(
      "Hide all active reports from dashboard totals? This will clear the dashboard view on this browser, but you can restore hidden reports from this same page."
    );

    if (!ok) return;

    const allKeys = allReports.map((report, idx) => reportDeleteKey(report, idx));
    persistDeletedReports(allKeys);
    setView("reports");
    setJobKey("");
  };

  const handleRestoreAllReports = () => {
    persistDeletedReports([]);
    setView("reports");
    setJobKey("");
  };

  const openUpgradePrompt = (feature: string, requiredPlan: string) => {
    setUpgradePrompt({ feature, requiredPlan });
  };

  const changeRange = (nextRange: RangeKey) => {
    setRange(nextRange);
    setView("dashboard");
    setJobKey("");
  };

  const applyDateRange = () => {
    setView("dashboard");
    setJobKey("");
    loadAndRender();
  };

  return (
    <main className="dc-bg">
      <style dangerouslySetInnerHTML={{ __html: dashboardCss }} />

      <div className="wrap">
        {mode === "error" ? (
          <div className="panel">
            <div className="panelHead"><div><div className="panelTitle">Dashboard</div><div className="panelSub">Could not load data.</div></div></div>
            <div className="pad"><div className="error">{error}</div><div style={{ marginTop: 12 }}><button className="btn" type="button" onClick={loadAndRender}>Retry</button></div></div>
          </div>
        ) : (
          <>
            <TopBar
  state={visibleState}
  mode={mode}
  onRefresh={loadAndRender}
  plan={plan}
/>
            <RangeControls
  range={range}
  setRange={changeRange}
  customFrom={customFrom}
  setCustomFrom={setCustomFrom}
  customTo={customTo}
  setCustomTo={setCustomTo}
  onApply={applyDateRange}
  onExportAllJobs={() => exportAllJobsCsv(visibleState)}
  canExport={access.canExport}
  onLockedExport={() => openUpgradePrompt("CSV exports", "Core")}
/>

            <MarginTargetControl
              marginTarget={marginTarget}
              marginTargetDraft={marginTargetDraft}
              setMarginTargetDraft={setMarginTargetDraft}
              onSaveMarginTarget={saveMarginTarget}
            />

            {view === "job" && jobKey ? (
              <JobView state={visibleState} jobKey={jobKey} setView={setView} setJobKey={setJobKey} refreshLocal={refreshLocal} userId={USER_ID} access={access} onLocked={openUpgradePrompt} marginTarget={marginTarget} />
            ) : view === "alljobs" ? (
              <AllJobsView state={visibleState} setView={setView} setJobKey={setJobKey} refreshLocal={refreshLocal} userId={USER_ID} access={access} onLocked={openUpgradePrompt} />
            ) : view === "highrisk" ? (
              <HighRiskJobsView state={visibleState} setView={setView} setJobKey={setJobKey} refreshLocal={refreshLocal} userId={USER_ID} access={access} onLocked={openUpgradePrompt} marginTarget={marginTarget} />
            ) : view === "reports" ? (
              <ReportsManagerView
                allReports={allReports}
                activeReports={reports}
                allJobs={getAllJobs(state)}
                deletedReportKeys={deletedReportKeys}
                onBack={() => { setView("dashboard"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                onDeleteReport={handleDeleteReport}
                onRestoreReport={handleRestoreReport}
                onDeleteAllReports={handleDeleteAllReports}
                onRestoreAllReports={handleRestoreAllReports}
                onRefresh={loadAndRender}
              />
            ) : (
              <DashboardBody
  state={visibleState}
  setView={setView}
  setJobKey={setJobKey}
  onOpenHighRisk={() => { setView("highrisk"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
  view={view}
  reports={reports}
  allReportsCount={allReports.length}
  hiddenReportsCount={hiddenReportsCount}
  onDeleteReport={handleDeleteReport}
  onManageReports={() => { setView("reports"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
  plan={plan}
  scaleSummary={scaleSummary}
  marginTarget={marginTarget}
  marginTargetDraft={marginTargetDraft}
  setMarginTargetDraft={setMarginTargetDraft}
  onSaveMarginTarget={saveMarginTarget}
  emailAlertsEnabled={emailAlertsEnabled}
  setEmailAlertsEnabled={setEmailAlertsEnabled}
  userEmail={user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null}
/>
            )}
          </>
        )}
      </div>

      {upgradePrompt ? (
        <UpgradeModal
          feature={upgradePrompt.feature}
          requiredPlan={upgradePrompt.requiredPlan}
          currentPlan={access.label}
          onClose={() => setUpgradePrompt(null)}
        />
      ) : null}
    </main>
  );
}

const dashboardCss = `
:root{--bg:#ffffff;--panel:rgba(255,255,255,.84);--panel2:rgba(255,255,255,.92);--text:rgba(15,23,42,.92);--muted:rgba(15,23,42,.62);--muted2:rgba(15,23,42,.50);--line:rgba(15,23,42,.10);--line2:rgba(15,23,42,.06);--shadow:0 18px 60px rgba(2,6,23,.10);--radius:22px;--c1:#7C3AED;--c2:#22D3EE;--c3:#34D399;--c4:#F59E0B;--c5:#EF4444;--c6:#10B981}
*{box-sizing:border-box}
html,body{background:#fff!important;color:#0f172a!important}
.dc-bg{width:100%;min-height:100vh;padding:58px 0 34px;background:radial-gradient(1100px 520px at 10% -10%,rgba(124,58,237,.12),transparent 58%),radial-gradient(900px 520px at 92% 0%,rgba(34,211,238,.12),transparent 62%),radial-gradient(820px 520px at 50% 110%,rgba(52,211,153,.09),transparent 70%),linear-gradient(180deg,#fff,#fff);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0f172a!important}
.wrap{width:min(1920px,calc(100vw - 20px));max-width:1920px;margin:0 auto;padding:0 10px}.topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:18px}.dashboardIntro{max-width:920px}.statusRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.pageKicker{width:fit-content;margin-bottom:12px;border:1px solid rgba(34,211,238,.28);background:rgba(255,255,255,.86);box-shadow:0 10px 28px rgba(34,211,238,.10);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:950;color:rgba(8,145,178,.95)}.pageTitle{margin:0;max-width:900px;font-size:42px;line-height:1.04;font-weight:990;letter-spacing:-.045em;color:rgba(2,6,23,.96)}.gradText{background:linear-gradient(90deg,#06b6d4,#8b5cf6,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent}.pageSub{margin-top:10px;max-width:820px;color:rgba(51,65,85,.82);font-size:16px;line-height:1.55;font-weight:750}.pill{display:inline-flex;align-items:center;gap:10px;padding:10px 12px;border-radius:999px;border:1px solid var(--line2);background:rgba(255,255,255,.84);backdrop-filter:blur(10px);box-shadow:0 10px 28px rgba(2,6,23,.08);font-weight:900;font-size:12.5px;color:rgba(15,23,42,.82);user-select:none;white-space:nowrap}.pill.health.ok{color:rgba(5,150,105,.95)}.pill.health.warn{color:rgba(180,83,9,.95)}.pill.health.bad{color:rgba(220,38,38,.95)}.dot{width:10px;height:10px;border-radius:999px}.spinner{width:14px;height:14px;border-radius:999px;border:2px solid rgba(15,23,42,.14);border-top-color:rgba(124,58,237,.95);animation:spin .75s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.planBadge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:900;color:rgba(15,23,42,.55);background:rgba(255,255,255,.65);border:1px solid rgba(15,23,42,.08);backdrop-filter:blur(8px);box-shadow:0 8px 22px rgba(2,6,23,.05);white-space:nowrap}
.planDot{width:6px;height:6px;border-radius:999px;background:linear-gradient(135deg,#7C3AED,#22D3EE);box-shadow:0 0 8px rgba(124,58,237,.6)}
.btn{padding:11px 14px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.85);color:rgba(15,23,42,.90);font-weight:900;font-size:13px;cursor:pointer;transition:transform .08s ease,box-shadow .12s ease,background .12s ease,border-color .12s ease;text-decoration:none;display:inline-flex;align-items:center;gap:8px}.btn:hover{transform:translateY(-1px);box-shadow:0 14px 34px rgba(2,6,23,.10);border-color:rgba(34,211,238,.25)}.btn-primary{background:linear-gradient(90deg,rgba(34,211,238,.20),rgba(124,58,237,.20));border-color:rgba(34,211,238,.28)}.btn-mini{padding:8px 11px;border-radius:12px;border:1px solid var(--line2);background:rgba(255,255,255,.86);color:rgba(15,23,42,.88);font-weight:900;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}.btn-danger{border-color:rgba(239,68,68,.18);color:rgba(185,28,28,.96);background:rgba(239,68,68,.08)}.buttonRow{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.rangeWrap{margin:16px 0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;border-radius:22px;border:1px solid var(--line2);background:rgba(255,255,255,.82);box-shadow:0 14px 44px rgba(2,6,23,.07);padding:12px 14px}.rangeLabel{font-weight:950;color:#0f172a}.rangeSub{margin-top:3px;color:rgba(15,23,42,.55);font-weight:750;font-size:12.5px}.rangeRight{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:flex-end}.rangeButtons{display:flex;flex-wrap:wrap;gap:8px}.rangeBtn{border:1px solid var(--line);background:#fff;border-radius:999px;padding:10px 13px;font-weight:950;font-size:13px;color:rgba(15,23,42,.74);cursor:pointer}.rangeBtn.active{background:#0f172a;color:#fff;border-color:#0f172a;box-shadow:0 14px 34px rgba(15,23,42,.16)}.customDates{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.customDates input,.searchInput,.selectInput{border:1px solid var(--line);background:#fff;border-radius:14px;padding:11px 12px;font-weight:850;color:#0f172a;outline:none}.wideSearch{width:100%}
.panel{border-radius:var(--radius);border:1px solid var(--line2);background:var(--panel);backdrop-filter:blur(14px);box-shadow:var(--shadow);overflow:hidden}.panelHead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px 14px 12px;border-bottom:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.70))}.panelTitle{font-weight:950;letter-spacing:-.02em;color:rgba(15,23,42,.94);font-size:18px}.panelSub{margin-top:4px;color:var(--muted2);font-size:13px;line-height:1.4;font-weight:750}.grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(340px,.68fr);gap:14px;margin-top:12px;width:100%}.mainCol,.sideStack{display:flex;flex-direction:column;gap:14px}.pad{padding:14px}.hero,.jobHero{border-radius:22px;border:1px solid var(--line2);background:rgba(255,255,255,.86);box-shadow:0 18px 60px rgba(2,6,23,.08);overflow:hidden;margin-top:12px}.heroBody,.jobHeroBody{padding:16px 16px 14px;display:grid;grid-template-columns:1.15fr .85fr;gap:12px}.heroTitle,.jobHeroTitle{font-size:30px;line-height:1.05;font-weight:980;letter-spacing:-.03em;color:rgba(15,23,42,.94)}.heroSub,.jobHeroSub{margin-top:8px;font-size:15px;line-height:1.5;color:rgba(15,23,42,.64);font-weight:750;max-width:740px}.heroBadges{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}.summaryCard,.jobSummaryCard{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.86);padding:12px;display:flex;flex-direction:column;gap:10px}.kv{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;font-size:14px;font-weight:850;color:rgba(15,23,42,.70)}.kv strong{color:rgba(15,23,42,.94)}.divider{height:1px;background:rgba(15,23,42,.06);margin:4px 0 2px}
.kpis{padding:14px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.kpi,.stat{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.84);box-shadow:0 14px 40px rgba(2,6,23,.06);padding:12px}.kLabel,.statLabel{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:rgba(15,23,42,.52);font-weight:900}.kValue,.statValue{margin-top:7px;font-weight:980;font-size:22px;letter-spacing:-.02em;color:rgba(15,23,42,.90)}.kSub,.statSub{margin-top:7px;font-size:13px;line-height:1.35;color:rgba(15,23,42,.58);font-weight:760}.pos{color:rgba(5,150,105,.95)!important}.neg{color:rgba(220,38,38,.95)!important}.strong{font-weight:950}.charts,.jobCharts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.jobCharts{gap:12px}.chartCard{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.82);padding:12px;overflow:hidden;box-shadow:0 12px 38px rgba(2,6,23,.055)}.chartCard.wide{grid-column:1/-1}.chartHead{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:8px}.chartTitle{font-weight:950;letter-spacing:-.01em;color:rgba(15,23,42,.92);font-size:17px}.chartSub{color:rgba(15,23,42,.55);font-size:13px;font-weight:750}canvas{width:100%;height:auto;display:block}.trendEmpty{border-radius:18px;border:1px dashed rgba(15,23,42,.14);background:rgba(255,255,255,.55);padding:16px;color:rgba(15,23,42,.72);font-weight:850;font-size:14px;line-height:1.45}.mixList{display:flex;flex-direction:column;gap:14px}.gridMix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.mixRow{border:1px solid var(--line2);background:rgba(255,255,255,.82);border-radius:16px;padding:12px}.mixTop{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:rgba(15,23,42,.72);font-weight:850}.sw{display:inline-block;width:10px;height:10px;border-radius:4px;margin-right:7px}.barTrack{height:8px;border-radius:999px;background:rgba(15,23,42,.06);overflow:hidden;margin-top:8px}.barFill{height:100%;border-radius:999px}.mixSub{margin-top:6px;color:rgba(15,23,42,.52);font-size:12px;font-weight:750}
.tableTools{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.searchInput{min-width:220px}.tableWrap{overflow:auto}.jobsTable{width:100%;border-collapse:separate;border-spacing:0;min-width:900px}.jobsTable th,.jobsTable td{padding:13px 14px;border-bottom:1px solid rgba(15,23,42,.06);text-align:left;font-size:13.5px;font-weight:750;color:rgba(15,23,42,.72);vertical-align:middle}.jobsTable th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:rgba(15,23,42,.44);font-weight:950;background:rgba(15,23,42,.025)}.jobName{font-weight:950;color:#0f172a;font-size:14px}.jobMeta,.itemMeta{margin-top:5px;color:rgba(15,23,42,.52);font-size:12px;font-weight:750}.miniBtn{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;font-weight:950;font-size:12px;cursor:pointer}.tag{padding:6px 10px;border-radius:999px;border:1px solid var(--line2);font-weight:950;font-size:11.5px;white-space:nowrap;background:rgba(15,23,42,.04);color:rgba(15,23,42,.78)}.tag.ok{border-color:rgba(52,211,153,.22);color:rgba(5,150,105,.95);background:rgba(52,211,153,.10)}.tag.warn{border-color:rgba(245,158,11,.22);color:rgba(180,83,9,.95);background:rgba(245,158,11,.10)}.tag.bad{border-color:rgba(239,68,68,.22);color:rgba(220,38,38,.95);background:rgba(239,68,68,.10)}.list{display:flex;flex-direction:column;gap:10px}.item{border-radius:18px;border:1px solid rgba(15,23,42,.06);background:rgba(255,255,255,.86);padding:11px}.itemTop{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.itemName{font-weight:950;font-size:14px;color:rgba(15,23,42,.88)}.reportActions{display:flex;align-items:center;gap:10px}.deleteReportBtn{width:26px;height:26px;border-radius:999px;border:1px solid rgba(239,68,68,.18);background:rgba(239,68,68,.08);color:rgba(185,28,28,.95);font-weight:950;font-size:16px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.empty{text-align:center;padding:24px;color:rgba(15,23,42,.55);border:1px dashed rgba(15,23,42,.14);border-radius:18px;background:rgba(255,255,255,.55);font-weight:850;margin:14px}.error{border:1px solid rgba(239,68,68,.22);background:rgba(239,68,68,.08);color:rgba(15,23,42,.86);border-radius:18px;padding:14px;font-weight:850;font-size:13px;white-space:pre-wrap}
.crumbs{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.90),rgba(255,255,255,.72));position:relative;z-index:20;pointer-events:auto}.crumb{display:inline-flex;align-items:center;gap:8px;font-weight:900;font-size:12.5px;color:rgba(15,23,42,.72)}.crumb strong{color:rgba(15,23,42,.92)}.crumbBtn{margin-left:auto;display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;border:1px solid var(--line2);background:rgba(255,255,255,.82);font-weight:950;font-size:12.5px;cursor:pointer;transition:transform .08s ease,box-shadow .12s ease,border-color .12s ease;text-decoration:none;color:rgba(15,23,42,.90)}.crumbBtn.secondary{margin-left:0}.jobPage{display:flex;flex-direction:column;gap:12px;margin-top:12px}.jobAnalysisHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;border-radius:20px;border:1px solid rgba(34,211,238,.16);background:linear-gradient(135deg,rgba(255,255,255,.90),rgba(240,253,250,.72));box-shadow:0 14px 40px rgba(2,6,23,.055);padding:14px 16px}.sectionEyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(8,145,178,.86)}.sectionTitle{margin-top:4px;font-size:20px;line-height:1.1;font-weight:980;letter-spacing:-.025em;color:rgba(15,23,42,.94)}.sectionSubtle{font-size:12.5px;line-height:1.4;font-weight:850;color:rgba(15,23,42,.50);text-align:right}.jobDetailFocus{border:1px solid rgba(34,211,238,.14);box-shadow:0 18px 60px rgba(34,211,238,.08)}.jobStats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.jobDetailFocus{border-radius:18px}.jobDetailPad{overflow-x:auto}.jobTable{width:100%;min-width:1320px;table-layout:fixed;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.86)}.jobTable th,.jobTable td{padding:12px 8px;border-bottom:1px solid rgba(15,23,42,.06);vertical-align:middle;font-size:12.5px}.jobTable th{text-align:left;font-weight:950;color:rgba(15,23,42,.86);background:rgba(15,23,42,.035);position:sticky;top:0;z-index:2;font-size:12px;white-space:nowrap}.cellEdit{border:1px solid rgba(15,23,42,.12);background:#ffffff;border-radius:12px;padding:10px 10px;font-weight:800;font-size:14px;color:#0f172a!important;width:100%;outline:none;transition:border-color .12s ease,box-shadow .12s ease;position:relative;z-index:2;caret-color:#0f172a}.cellEdit:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.2)}.cellHint{margin-top:6px;font-size:11.5px;color:rgba(15,23,42,.62);font-weight:750}.customRemoveWrap{display:flex;justify-content:center;align-items:center}.supportGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.miniPanel{box-shadow:none}.noteBox{min-height:110px;resize:vertical}

.scalePanel{
  margin-top:12px;
  border-radius:22px;
  border:1px solid var(--line2);
  background:rgba(255,255,255,.88);
  box-shadow:var(--shadow);
  overflow:hidden;
}

.scaleGrid{
  display:grid;
  grid-template-columns:1.15fr 1fr 1fr 1fr;
  gap:12px;
  padding:14px;
  align-items:start;
}

.scaleGridPremium{
  grid-template-columns:1.25fr 1fr 1fr 1fr;
}

.scaleCard{
  min-width:0;
  align-self:flex-start;
  border-radius:18px;
  border:1px solid var(--line2);
  background:rgba(255,255,255,.88);
  padding:14px;
  box-shadow:0 10px 28px rgba(2,6,23,.04);
  height:fit-content;
}

.scaleCard.dark{
  background:linear-gradient(135deg,rgba(248,250,252,.98),rgba(236,253,245,.74));
  color:rgba(15,23,42,.92);
  border-color:rgba(34,211,238,.14);
  box-shadow:0 12px 30px rgba(34,211,238,.065);
  min-height:0;
}

.scaleHeroCard{
  border-left:4px solid rgba(34,211,238,.80);
}

.wideScaleCard{
  grid-column:span 2;
}

.teamScaleCard{
  grid-column:span 2;
}

.scaleKicker{
  font-size:10.5px;
  text-transform:uppercase;
  letter-spacing:.08em;
  font-weight:950;
  color:rgba(15,23,42,.46);
}

.scaleCard.dark .scaleKicker{
  color:rgba(8,145,178,.78);
}

.scaleTitle{
  margin-top:9px;
  font-size:19px;
  line-height:1.08;
  font-weight:980;
  letter-spacing:-.03em;
  color:rgba(15,23,42,.94);
}

.scaleTitle.small{
  font-size:17px;
}

.scaleCard.dark .scaleTitle{
  color:rgba(15,23,42,.94);
}

.scaleText{
  margin-top:8px;
  font-size:12.5px;
  line-height:1.45;
  font-weight:750;
  color:rgba(15,23,42,.58);
}

.scaleCard.dark .scaleText{
  color:rgba(51,65,85,.66);
}

.scaleMiniStats{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  margin-top:13px;
}

.scaleMiniStats div{
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.70);
  padding:10px;
}

.scaleMiniStats span{
  display:block;
  font-size:10.5px;
  text-transform:uppercase;
  letter-spacing:.07em;
  font-weight:950;
  color:rgba(15,23,42,.48);
}

.scaleMiniStats strong{
  display:block;
  margin-top:4px;
  font-size:15px;
  font-weight:980;
  color:rgba(15,23,42,.92);
}

.alertList,
.benchmarkList,
.leakList,
.actionStack{
  display:flex;
  flex-direction:column;
  gap:8px;
  margin-top:11px;
}

.alertItem,
.benchmarkRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.74);
  padding:9px 10px;
  min-width:0;
}

.alertItem.soft{
  background:rgba(248,250,252,.90);
}

.alertName,
.benchmarkLabel{
  font-weight:950;
  font-size:12.75px;
  color:rgba(15,23,42,.90);
}

.alertMeta,
.benchmarkNote{
  margin-top:2px;
  font-size:11.75px;
  line-height:1.35;
  font-weight:750;
  color:rgba(15,23,42,.52);
}

.leakItem{
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.76);
  padding:10px;
}

.leakTop{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
}

.leakName{
  font-size:13px;
  font-weight:950;
  color:rgba(15,23,42,.92);
}

.leakMeta{
  margin-top:3px;
  font-size:11.75px;
  font-weight:800;
  color:rgba(15,23,42,.50);
}

.leakAmount{
  white-space:nowrap;
  font-size:14px;
  font-weight:980;
  color:rgba(15,23,42,.92);
}

.leakAmount.ok{color:rgba(5,150,105,.95)}
.leakAmount.warn{color:rgba(180,83,9,.95)}

.leakFix{
  margin-top:8px;
  font-size:12px;
  line-height:1.4;
  font-weight:750;
  color:rgba(15,23,42,.58);
}

.actionCard{
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.76);
  padding:10px;
}

.actionTop{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  margin-bottom:7px;
}

.actionTop strong{
  font-size:13px;
  font-weight:980;
  color:rgba(5,150,105,.95);
}

.actionName{
  font-size:13px;
  line-height:1.35;
  font-weight:900;
  color:rgba(15,23,42,.88);
}

.actionMeta{
  margin-top:5px;
  font-size:11.75px;
  font-weight:800;
  color:rgba(15,23,42,.48);
}

.benchmarkGrid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  margin-top:11px;
}

.benchmarkValue{
  font-weight:980;
  font-size:14.5px;
  white-space:nowrap;
  text-align:right;
}

.benchmarkValue.ok{color:rgba(5,150,105,.95)}
.benchmarkValue.warn{color:rgba(180,83,9,.95)}
.benchmarkValue.bad{color:rgba(220,38,38,.95)}

.teamPills{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-top:11px;
}

.teamPills span{
  border-radius:999px;
  border:1px solid rgba(15,23,42,.08);
  background:rgba(15,23,42,.04);
  padding:6px 9px;
  font-size:11.75px;
  font-weight:950;
  color:rgba(15,23,42,.68);
}

.latestReport{
  margin-top:12px;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(248,250,252,.90);
  padding:10px;
}

.latestReportLabel{
  font-size:10.5px;
  text-transform:uppercase;
  letter-spacing:.07em;
  font-weight:950;
  color:rgba(15,23,42,.46);
}

.latestReportValue{
  margin-top:4px;
  font-size:12.75px;
  font-weight:900;
  color:rgba(15,23,42,.86);
}

.empty.compact{
  margin:0;
  padding:12px;
}


.lockedBtn{opacity:.74}
.gateBanner{margin:12px 14px 0;border-radius:16px;border:1px solid rgba(15,23,42,.08);padding:11px 12px;display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.4;font-weight:800;color:rgba(15,23,42,.64);background:rgba(248,250,252,.92)}
.gateBanner strong{color:rgba(15,23,42,.92);white-space:nowrap}
.gateBanner.preview{border-color:rgba(124,58,237,.16);background:linear-gradient(90deg,rgba(245,243,255,.92),rgba(255,255,255,.88))}
.gateBanner.locked{border-color:rgba(245,158,11,.18);background:linear-gradient(90deg,rgba(255,251,235,.92),rgba(255,255,255,.88))}
.cellEdit:disabled{cursor:not-allowed;background:rgba(248,250,252,.92);color:rgba(15,23,42,.48)!important}

.upgradeOverlay{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.46);backdrop-filter:blur(8px)}
.upgradeModal{position:relative;width:min(520px,100%);border-radius:28px;border:1px solid rgba(255,255,255,.70);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(248,250,252,.96));box-shadow:0 30px 90px rgba(2,6,23,.28);padding:24px;color:#0f172a}
.upgradeClose{position:absolute;right:16px;top:14px;width:34px;height:34px;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:#fff;color:rgba(15,23,42,.72);font-size:20px;font-weight:950;line-height:1;cursor:pointer}
.upgradeBadge{width:fit-content;border-radius:999px;border:1px solid rgba(124,58,237,.18);background:linear-gradient(90deg,rgba(34,211,238,.12),rgba(124,58,237,.12));color:rgba(91,33,182,.95);padding:7px 11px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
.upgradeTitle{margin:14px 38px 0 0;font-size:26px;line-height:1.05;letter-spacing:-.035em;font-weight:990;color:rgba(15,23,42,.96)}
.upgradeText{margin:12px 0 0;font-size:14px;line-height:1.55;font-weight:750;color:rgba(51,65,85,.78)}
.upgradeValueBox{margin-top:16px;border-radius:18px;border:1px solid rgba(15,23,42,.07);background:rgba(255,255,255,.78);padding:14px}
.upgradeValueTitle{font-size:13px;font-weight:950;color:rgba(15,23,42,.92)}
.upgradeValueText{margin-top:5px;font-size:13px;line-height:1.45;font-weight:750;color:rgba(15,23,42,.58)}
.upgradeActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.upgradePrimary{border-color:rgba(124,58,237,.24);box-shadow:0 14px 34px rgba(124,58,237,.12)}
.lockedBtn{opacity:.92;cursor:pointer}
@media(max-width:1300px){.scaleGrid,.scaleGridPremium{grid-template-columns:1fr 1fr}.wideScaleCard,.teamScaleCard{grid-column:span 2}.benchmarkGrid{grid-template-columns:1fr 1fr}.gridMix{grid-template-columns:repeat(2,minmax(0,1fr))}.supportGrid{grid-template-columns:1fr}.jobStats{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:1100px){.grid{grid-template-columns:1fr}.sideStack{display:grid;grid-template-columns:1fr 1fr}.sideStack .panel:first-child{grid-column:1/-1}.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.heroBody,.jobHeroBody{grid-template-columns:1fr}.charts,.jobCharts{grid-template-columns:1fr}.chartCard.wide{grid-column:auto}}
@media(max-width:760px){.jobAnalysisHeader{align-items:flex-start;flex-direction:column}.sectionSubtle{text-align:left}.scaleGrid,.scaleGridPremium{grid-template-columns:1fr}.wideScaleCard,.teamScaleCard{grid-column:auto}.benchmarkGrid{grid-template-columns:1fr}.scaleMiniStats{grid-template-columns:1fr}.dc-bg{padding:32px 0 28px;background:#fff!important}.wrap{width:100%;padding:0 16px}.pageTitle{font-size:32px}.topbar{flex-direction:column}.statusRow{justify-content:flex-start}.rangeWrap{align-items:flex-start}.rangeRight{justify-content:flex-start}.kpis{grid-template-columns:1fr 1fr}.sideStack{display:flex}.responsiveHead{flex-direction:column}.tableTools{width:100%;justify-content:stretch}.searchInput,.selectInput{width:100%}.gridMix{grid-template-columns:1fr}.jobStats{grid-template-columns:1fr 1fr}.crumbBtn{margin-left:0!important}}
@media(max-width:480px){.kpis,.jobStats{grid-template-columns:1fr}.pageTitle{font-size:29px}.heroTitle,.jobHeroTitle{font-size:25px}}

.moneyEditInput{
  cursor:text!important;
  pointer-events:auto!important;
  user-select:text!important;
}
.calcCell{
  border:1px solid rgba(15,23,42,.12);
  background:rgba(248,250,252,.95);
  border-radius:12px;
  padding:12px;
  font-weight:950;
  font-size:15px;
  color:#0f172a;
  width:100%;
  min-height:48px;
  display:flex;
  align-items:center;
}
.jobTable input,
.jobTable textarea{
  pointer-events:auto!important;
  user-select:text!important;
}

/* readability revamp */
.panel,.scalePanel,.hero,.jobHero{border-color:rgba(15,23,42,.085);box-shadow:0 20px 58px rgba(2,6,23,.09)}
.panelHead{padding:18px 18px 14px;border-bottom-color:rgba(15,23,42,.075)}
.panelTitle{font-size:20px;line-height:1.15;letter-spacing:-.025em;color:rgba(15,23,42,.97)}
.panelSub{font-size:14.5px;line-height:1.45;color:rgba(15,23,42,.66);font-weight:820;max-width:780px}.pageSub{font-size:17px;color:rgba(15,23,42,.68)}
.rangeWrap{padding:16px 18px}.rangeLabel{font-size:16px}.rangeSub{font-size:13.5px;color:rgba(15,23,42,.62)}
.heroBody,.jobHeroBody{padding:20px;gap:16px}.heroTitle,.jobHeroTitle{font-size:32px}.heroSub,.jobHeroSub{font-size:16px;color:rgba(15,23,42,.66);max-width:850px}.summaryCard,.jobSummaryCard{padding:16px;gap:12px;border-color:rgba(15,23,42,.08)}
.kpis{padding:16px;gap:12px}.kpi,.stat{padding:16px;border-color:rgba(15,23,42,.08);box-shadow:0 14px 34px rgba(2,6,23,.055)}.kLabel,.statLabel{font-size:12px;color:rgba(15,23,42,.56)}.kValue,.statValue{font-size:24px}.kSub,.statSub{font-size:14px;color:rgba(15,23,42,.64)}
.chartCard{padding:16px;border-color:rgba(15,23,42,.08)}.chartTitle{font-size:18px}.chartSub{font-size:14px;color:rgba(15,23,42,.62)}.trendEmpty,.empty{font-size:15px;color:rgba(15,23,42,.62);font-weight:900;background:rgba(255,255,255,.70)}
.jobsTable th{font-size:12px;color:rgba(15,23,42,.54)}.jobsTable td{font-size:14.5px;color:rgba(15,23,42,.76)}.jobName{font-size:15.5px}.jobMeta,.itemMeta{font-size:13px;color:rgba(15,23,42,.60)}.item{padding:14px;border-color:rgba(15,23,42,.08)}.itemName{font-size:15px}.tag{font-size:12px;padding:7px 11px}
.scalePanel .panelHead{align-items:center}.scaleGrid,.scaleGridPremium{gap:16px;padding:18px}.scaleCard{padding:18px;border-color:rgba(15,23,42,.085);box-shadow:0 12px 30px rgba(2,6,23,.055)}.scaleHeroCard{border-left-width:5px}.scaleKicker{font-size:12px;color:rgba(15,23,42,.55);letter-spacing:.075em}.scaleTitle{font-size:22px;line-height:1.12}.scaleTitle.small{font-size:19px}.scaleText{font-size:14px;line-height:1.55;color:rgba(15,23,42,.66)}.scaleMiniStats{gap:10px;margin-top:16px}.scaleMiniStats div{padding:13px}.scaleMiniStats span{font-size:11.5px}.scaleMiniStats strong{font-size:18px}.empty.compact{font-size:15px;line-height:1.45;font-weight:950;padding:16px;color:rgba(15,23,42,.58)}
.alertItem,.benchmarkRow,.leakItem,.actionCard{padding:13px;border-color:rgba(15,23,42,.08);background:rgba(255,255,255,.84)}.alertName,.benchmarkLabel,.leakName,.actionName{font-size:15px;line-height:1.3}.alertMeta,.benchmarkNote,.leakMeta,.actionMeta,.leakFix{font-size:13px;line-height:1.45;color:rgba(15,23,42,.62)}.benchmarkValue,.leakAmount{font-size:16px}.benchmarkGrid{gap:10px}.gateBanner{padding:14px 16px;font-size:14px;line-height:1.5;color:rgba(15,23,42,.68)}
.jobAnalysisHeader{padding:18px 20px}.sectionEyebrow{font-size:12px}.sectionTitle{font-size:23px}.sectionSubtle{font-size:14px;color:rgba(15,23,42,.60)}.jobStats{gap:12px}.jobDetailPad{padding:18px}.jobTable th{font-size:12.5px;color:rgba(15,23,42,.66)}.jobTable td{padding:14px 10px}.cellEdit{font-size:15px;padding:12px}.cellHint{font-size:12.5px;color:rgba(15,23,42,.58)}.supportGrid{gap:14px}.noteBox{min-height:130px}
@media(max-width:760px){.panelHead{padding:16px}.panelTitle{font-size:19px}.panelSub{font-size:14px}.scaleGrid,.scaleGridPremium{padding:14px}.scaleCard{padding:15px}.heroTitle,.jobHeroTitle{font-size:27px}.sectionSubtle{text-align:left}}



/* Scale Profit Control Center premium rewrite */
.premiumScalePanel{border-color:rgba(124,58,237,.13);box-shadow:0 26px 80px rgba(2,6,23,.105)}
.scaleControlHead{align-items:flex-start}
.scaleHeadRight{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.alertStatusPill{display:inline-flex;align-items:center;gap:9px;border-radius:999px;border:1px solid rgba(239,68,68,.18);background:rgba(254,242,242,.86);padding:9px 12px;font-size:12px;font-weight:950;color:rgba(185,28,28,.95);white-space:nowrap}
.alertDot{width:9px;height:9px;border-radius:999px;background:rgba(52,211,153,.95);box-shadow:0 0 0 4px rgba(52,211,153,.14)}
.alertDot.hot{background:rgba(239,68,68,.95);box-shadow:0 0 0 4px rgba(239,68,68,.14)}
.scaleCommandGrid{display:grid;grid-template-columns:1.35fr .85fr;gap:16px;padding:18px 18px 4px}
.scaleCommandHero{border-radius:22px;border:1px solid rgba(34,211,238,.18);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(236,253,245,.72));box-shadow:0 18px 44px rgba(34,211,238,.08);padding:20px;border-left:5px solid rgba(34,211,238,.85)}
.heroScaleTitle{font-size:26px;line-height:1.06;letter-spacing:-.04em}
.scaleTargetCard,.scaleEmailCard{border-radius:22px;border:1px solid rgba(15,23,42,.085);background:rgba(255,255,255,.90);box-shadow:0 14px 38px rgba(2,6,23,.06);padding:18px}
.targetInputRow{display:flex;gap:8px;align-items:center;margin-top:12px}
.targetInput{width:90px;border-radius:14px;border:1px solid rgba(15,23,42,.12);background:#fff;padding:12px;font-size:18px;font-weight:980;color:#0f172a;outline:none;text-align:center}
.targetInput:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.18)}
.targetInputRow span{font-size:18px;font-weight:950;color:rgba(15,23,42,.75)}
.targetHelp{margin-top:12px;font-size:13px;line-height:1.45;font-weight:800;color:rgba(15,23,42,.60)}
.targetChecklist{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.targetChecklist span{border-radius:999px;border:1px solid rgba(16,185,129,.16);background:rgba(16,185,129,.08);padding:6px 8px;font-size:11.5px;font-weight:950;color:rgba(5,150,105,.95)}
.emailAlertTitle{margin-top:9px;font-size:18px;line-height:1.1;font-weight:980;color:rgba(15,23,42,.94);letter-spacing:-.025em}
.emailDestination{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin:13px 0;border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(248,250,252,.9);padding:10px}
.emailDestination span{font-size:11px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.48)}
.emailDestination strong{font-size:12.5px;font-weight:950;color:rgba(15,23,42,.82);text-align:right;word-break:break-all}
.emailNote{margin-top:10px;font-size:11.5px;line-height:1.35;font-weight:800;color:rgba(15,23,42,.46)}
.btn-danger-soft{border-color:rgba(239,68,68,.18);background:rgba(254,242,242,.86);color:rgba(185,28,28,.96)}
.scaleGridPremiumV2{grid-template-columns:1.15fr 1fr 1fr;align-items:start}
.premiumAlert{align-items:flex-start;background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(248,250,252,.92))}
.alertMain{min-width:0}
.alertIssue{margin-top:6px;font-size:12.75px;line-height:1.4;font-weight:850;color:rgba(15,23,42,.68)}
.alertActions,.actionButtons{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.ghostMini{background:rgba(248,250,252,.92);text-decoration:none;color:rgba(15,23,42,.82)}
.premiumLeak,.premiumAction{background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,250,252,.86))}
.leakAmount.bad{color:rgba(220,38,38,.95)}
.benchmarkGridV2{grid-template-columns:1fr 1fr 1fr}
.alertsExplainerCard{grid-column:span 1}
.ruleList{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.ruleList div{border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(255,255,255,.76);padding:11px}
.ruleList b{display:block;font-size:13px;color:rgba(15,23,42,.92);font-weight:950}
.ruleList span{display:block;margin-top:3px;font-size:12.5px;line-height:1.4;color:rgba(15,23,42,.60);font-weight:800}
@media(max-width:1300px){.scaleCommandGrid{grid-template-columns:1fr 1fr}.scaleCommandHero{grid-column:1/-1}.scaleGridPremiumV2{grid-template-columns:1fr 1fr}.benchmarkGridV2{grid-template-columns:1fr 1fr}.alertsExplainerCard{grid-column:span 2}}
@media(max-width:760px){.scaleControlHead{align-items:flex-start;flex-direction:column}.scaleHeadRight{justify-content:flex-start}.scaleCommandGrid{grid-template-columns:1fr;padding:14px 14px 0}.scaleCommandHero{grid-column:auto}.scaleGridPremiumV2{grid-template-columns:1fr}.benchmarkGridV2{grid-template-columns:1fr}.alertsExplainerCard{grid-column:auto}.targetInputRow{flex-wrap:wrap}.targetInput{width:110px}.heroScaleTitle{font-size:23px}}



/* Global margin target control for Core + Scale */
.marginTargetTopWrap{margin:12px 0 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-radius:20px;border:1px solid rgba(34,211,238,.16);background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(240,253,250,.70));box-shadow:0 14px 42px rgba(2,6,23,.065);padding:14px 16px}
.marginTargetTopText{min-width:0}
.marginTargetTopKicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(8,145,178,.82)}
.marginTargetTopTitle{margin-top:4px;font-size:17px;line-height:1.15;font-weight:980;letter-spacing:-.02em;color:rgba(15,23,42,.94)}
.marginTargetTopSub{margin-top:4px;font-size:13px;line-height:1.4;font-weight:780;color:rgba(15,23,42,.58)}
.marginTargetTopControls{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap;flex:0 0 auto}
.compactTargetInputGroup{display:flex;align-items:center;gap:6px;border-radius:14px;border:1px solid rgba(15,23,42,.10);background:#fff;padding:7px 10px;box-shadow:0 8px 24px rgba(2,6,23,.04)}
.compactTargetInput{width:54px;border:0;outline:none;background:transparent;text-align:center;font-size:16px;font-weight:980;color:#0f172a;padding:2px 0}
.compactTargetInputGroup span{font-size:14px;font-weight:950;color:rgba(15,23,42,.68)}
.compactTargetSave{padding:9px 12px;border-radius:13px;font-size:12.5px}
.marginTargetCurrent{font-size:12px;font-weight:900;color:rgba(15,23,42,.52);white-space:nowrap}
@media(max-width:760px){.marginTargetTopWrap{align-items:flex-start;flex-direction:column}.marginTargetTopControls{justify-content:flex-start}.marginTargetCurrent{width:100%}}


/* Scale gating for Free/Core */
.scaleLockedPanel{border-color:rgba(15,23,42,.09);box-shadow:0 20px 58px rgba(2,6,23,.075)}
.lockedScaleBadge{display:inline-flex;align-items:center;gap:8px;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:rgba(248,250,252,.92);padding:8px 11px;font-size:12px;font-weight:950;color:rgba(71,85,105,.86);white-space:nowrap}
.lockGlyph,.lockedMiniIcon{filter:grayscale(1);opacity:.72}
.lockedScaleHero{margin:18px;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:flex-start;border-radius:22px;border:1px solid rgba(15,23,42,.08);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(248,250,252,.88));box-shadow:0 16px 44px rgba(2,6,23,.06);padding:20px}
.lockedScaleIcon{width:42px;height:42px;border-radius:16px;border:1px solid rgba(15,23,42,.10);background:rgba(241,245,249,.86);display:flex;align-items:center;justify-content:center;font-size:19px;filter:grayscale(1);opacity:.78}
.lockedScaleKicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(15,23,42,.46)}
.lockedScaleTitle{margin-top:6px;font-size:26px;line-height:1.08;font-weight:990;letter-spacing:-.035em;color:rgba(15,23,42,.94)}
.lockedScaleText{margin-top:9px;max-width:920px;font-size:14.5px;line-height:1.55;font-weight:780;color:rgba(15,23,42,.62)}
.lockedScaleActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.lockedFeatureGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:0 18px 18px}
.lockedFeatureCard{border-radius:18px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.88);box-shadow:0 12px 30px rgba(2,6,23,.045);padding:16px;min-height:132px}
.lockedFeatureTop{display:flex;align-items:center;gap:10px}
.lockedMiniIcon{width:28px;height:28px;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:rgba(241,245,249,.84);display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto}
.lockedFeatureTitle{font-size:15px;line-height:1.25;font-weight:970;color:rgba(15,23,42,.90)}
.lockedFeatureText{margin-top:10px;font-size:13px;line-height:1.48;font-weight:760;color:rgba(15,23,42,.58)}
.emailPauseLink{align-self:flex-start;background:transparent;border:none;color:rgba(100,116,139,.95);padding:6px 2px;font-size:13px;font-weight:850;cursor:pointer;text-decoration:none}
.emailPauseLink:hover{color:rgba(15,23,42,.92);text-decoration:underline}
@media(max-width:900px){.lockedFeatureGrid{grid-template-columns:1fr}.lockedScaleHero{grid-template-columns:1fr}.lockedScaleTitle{font-size:23px}}

/* Job comparison formatting fix */
.comparisonPanel{overflow:hidden;border-color:rgba(34,211,238,.14);box-shadow:0 18px 58px rgba(2,6,23,.075)}
.comparisonHead{align-items:center;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.88))}
.comparisonGrid{display:grid;grid-template-columns:minmax(240px,.85fr) minmax(260px,.95fr) minmax(520px,1.55fr);gap:14px;padding:16px;align-items:stretch}
.comparisonScoreCard,.comparisonDriverCard{border-radius:18px;border:1px solid rgba(15,23,42,.075);background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.86));padding:16px;box-shadow:0 12px 30px rgba(2,6,23,.045);min-width:0}
.comparisonLabel{font-size:11.5px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(15,23,42,.50)}
.comparisonValue{margin-top:8px;font-size:30px;line-height:1;font-weight:990;letter-spacing:-.035em}
.comparisonSub{margin-top:8px;font-size:13.5px;line-height:1.45;font-weight:800;color:rgba(15,23,42,.60)}
.driverTitle{margin-top:8px;font-size:24px;line-height:1.05;font-weight:990;letter-spacing:-.03em;color:rgba(15,23,42,.92)}
.comparisonTableWrap{border-radius:18px;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.92);overflow:auto;box-shadow:0 12px 30px rgba(2,6,23,.045)}
.comparisonTable{width:100%;min-width:520px;border-collapse:separate;border-spacing:0}
.comparisonTable th,.comparisonTable td{padding:13px 14px;border-bottom:1px solid rgba(15,23,42,.065);text-align:left;white-space:nowrap}
.comparisonTable th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.50);background:rgba(15,23,42,.025)}
.comparisonTable td{font-size:14px;font-weight:850;color:rgba(15,23,42,.74)}
.comparisonTable tr:last-child td{border-bottom:none}
.driverGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:0 16px 16px}
.driverMini{border-radius:16px;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.88);padding:13px;min-width:0}
.driverMiniTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;font-size:13px;font-weight:950;color:rgba(15,23,42,.88)}
.driverMiniTop strong{white-space:nowrap}
.driverMiniSub{margin-top:7px;font-size:12.5px;line-height:1.4;font-weight:800;color:rgba(15,23,42,.58)}

/* Cleaner real-time email alert spacing */
.scaleEmailCard{display:flex;flex-direction:column;gap:12px}
.scaleEmailCard .scaleKicker,.scaleEmailCard .emailAlertTitle,.scaleEmailCard .scaleText,.scaleEmailCard .emailDestination,.scaleEmailCard .emailLiveGrid,.scaleEmailCard .emailTriggerList,.scaleEmailCard .emailNote{margin-top:0}
.emailLiveGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.emailLiveGrid div{border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(255,255,255,.76);padding:11px;min-width:0}
.emailLiveGrid span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.48)}
.emailLiveGrid strong{display:block;margin-top:4px;font-size:13px;line-height:1.25;font-weight:950;color:rgba(15,23,42,.86)}
.emailTriggerList{display:flex;flex-direction:column;gap:7px;border-radius:14px;border:1px solid rgba(34,211,238,.12);background:linear-gradient(135deg,rgba(240,253,250,.78),rgba(255,255,255,.80));padding:11px}
.emailTriggerList span{font-size:12.5px;line-height:1.35;font-weight:850;color:rgba(15,23,42,.70)}

/* High-risk view all workflow */
.scaleCardHeaderRow{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.scaleCardSub{margin-top:5px;font-size:12.5px;line-height:1.35;font-weight:800;color:rgba(15,23,42,.55)}
.viewAllAlertsBtn{background:linear-gradient(90deg,rgba(34,211,238,.14),rgba(124,58,237,.14));border-color:rgba(124,58,237,.18);white-space:nowrap}
.highRiskPage{display:flex;flex-direction:column;gap:14px;margin-top:12px}
.highRiskHero{overflow:hidden}
.highRiskHeroBody{padding:18px;display:grid;grid-template-columns:1.2fr .8fr;gap:14px;align-items:end}
.highRiskTitle{margin-top:5px;font-size:28px;line-height:1.05;font-weight:990;letter-spacing:-.035em;color:rgba(15,23,42,.94)}
.highRiskSub{margin-top:8px;font-size:15px;line-height:1.5;font-weight:780;color:rgba(15,23,42,.62);max-width:820px}
.highRiskSearchWrap{display:flex;justify-content:flex-end}
.highRiskJobStack{display:flex;flex-direction:column;gap:16px}
.highRiskJobCard{border-radius:22px;border:1px solid rgba(239,68,68,.10);background:rgba(255,255,255,.64);box-shadow:0 18px 50px rgba(2,6,23,.065);padding:0;overflow:hidden}
.highRiskJobCard .jobPage{margin-top:0;padding:14px}
.highRiskJobCard .jobAnalysisHeader{display:none}
.highRiskJobCard .jobStats{margin-bottom:0}

@media(max-width:1300px){.comparisonGrid{grid-template-columns:1fr 1fr}.comparisonTableWrap{grid-column:1/-1}.driverGrid{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.comparisonGrid{grid-template-columns:1fr;padding:14px}.comparisonTableWrap{grid-column:auto}.driverGrid{grid-template-columns:1fr;padding:0 14px 14px}.comparisonValue{font-size:26px}.emailLiveGrid{grid-template-columns:1fr}.highRiskHeroBody{grid-template-columns:1fr}.highRiskSearchWrap{justify-content:stretch}.scaleCardHeaderRow{align-items:stretch;flex-direction:column}.viewAllAlertsBtn{width:fit-content}}


/* Clean credit/refund integration */
.creditText{color:rgba(5,150,105,.96)!important}
.creditAppliedPill{display:inline-flex;align-items:center;border-radius:999px;border:1px solid rgba(16,185,129,.18);background:rgba(236,253,245,.88);color:rgba(5,150,105,.96);padding:8px 11px;font-size:12px;font-weight:950;white-space:nowrap}
.creditMixRow{border-color:rgba(16,185,129,.18);background:linear-gradient(180deg,rgba(236,253,245,.64),rgba(255,255,255,.86))}
.creditBarFill{opacity:.72}
.creditStat{border-color:rgba(16,185,129,.16);background:linear-gradient(180deg,rgba(236,253,245,.60),rgba(255,255,255,.86))}
.creditKpiPanel{margin-top:12px;border-radius:20px;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.82);box-shadow:0 16px 44px rgba(2,6,23,.055);overflow:hidden}
.creditKpiHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px 0}
.creditKpiTitle{font-size:14px;font-weight:950;color:rgba(15,23,42,.90);letter-spacing:-.01em}
.creditKpiSub{margin-top:3px;font-size:12.5px;line-height:1.4;font-weight:760;color:rgba(15,23,42,.52);max-width:920px}
.creditKpiGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 16px 16px}
.creditKpiCard{border-radius:16px;border:1px solid rgba(15,23,42,.065);background:rgba(248,250,252,.78);padding:12px;box-shadow:none}
.creditKpiLabel{font-size:10.5px;text-transform:uppercase;letter-spacing:.075em;color:rgba(15,23,42,.48);font-weight:950}
.creditKpiValue{margin-top:6px;font-size:18px;line-height:1.05;font-weight:980;color:rgba(15,23,42,.92);letter-spacing:-.015em}
.creditKpiNote{margin-top:6px;font-size:12px;line-height:1.35;font-weight:760;color:rgba(15,23,42,.52)}
@media(max-width:1100px){.creditKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.creditKpiGrid{grid-template-columns:1fr}.creditAppliedPill{width:fit-content}}


/* Report manager view */
.manageReportsBtn{background:linear-gradient(90deg,rgba(34,211,238,.12),rgba(124,58,237,.12));border-color:rgba(124,58,237,.16)}
.reportMiniStats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.reportMiniStats span{border-radius:999px;border:1px solid rgba(15,23,42,.08);background:rgba(248,250,252,.86);padding:6px 9px;font-size:11.5px;font-weight:950;color:rgba(15,23,42,.58)}
.reportFullWidthBtn{width:100%;justify-content:center;margin-top:12px}
.reportsManagerPage{display:flex;flex-direction:column;gap:14px;margin-top:12px}
.reportsManagerHero{overflow:hidden}
.reportsManagerBody{padding:18px;display:grid;grid-template-columns:1.25fr .75fr;gap:16px;align-items:stretch}
.reportsManagerTitle{margin-top:5px;font-size:30px;line-height:1.05;font-weight:990;letter-spacing:-.04em;color:rgba(15,23,42,.95)}
.reportsManagerSub{margin-top:8px;font-size:15px;line-height:1.5;font-weight:780;color:rgba(15,23,42,.62);max-width:850px}
.reportsSummaryCard{border-radius:18px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.88);padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 12px 34px rgba(2,6,23,.045)}
.reportsManagerPanel{overflow:hidden}
.reportManagerTools{align-items:center}
.reportsBulkActions{display:flex;gap:10px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid rgba(15,23,42,.06);background:rgba(248,250,252,.52)}
.reportsBulkActions .btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.reportsTable{min-width:980px}
.hiddenReportRow td{opacity:.62;background:rgba(248,250,252,.78)}
.reportHideBtn{border-color:rgba(239,68,68,.18);background:rgba(254,242,242,.78);color:rgba(185,28,28,.96)}
@media(max-width:900px){.reportsManagerBody{grid-template-columns:1fr}.reportsManagerTitle{font-size:26px}.reportManagerTools{width:100%;justify-content:stretch}.reportManagerTools .btn{justify-content:center}}



/* Report manager job identity upgrade */
.reportPreviewItem{transition:border-color .12s ease,box-shadow .12s ease,transform .08s ease}
.reportPreviewItem:hover{border-color:rgba(34,211,238,.18);box-shadow:0 14px 34px rgba(2,6,23,.065);transform:translateY(-1px)}
.reportItemTitle,.reportManagerJobName{letter-spacing:-.015em}
.reportNameWrap{display:flex;align-items:flex-start;gap:10px;min-width:280px}
.reportIdText{margin-top:5px;font-size:11.5px;line-height:1.35;font-weight:800;color:rgba(15,23,42,.42);max-width:520px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.reportTagRow{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.reportInfoTag{display:inline-flex;align-items:center;border-radius:999px;border:1px solid rgba(15,23,42,.08);background:rgba(248,250,252,.92);padding:4px 7px;font-size:10.5px;line-height:1;font-weight:950;color:rgba(15,23,42,.58);white-space:nowrap}
.reportCreditText{margin-top:5px;font-size:11.5px;font-weight:950;color:rgba(5,150,105,.95);white-space:nowrap}
.reportsTable td:first-child{min-width:360px}
.reportsTable .jobMeta{max-width:520px;white-space:normal;line-height:1.35}
@media(max-width:760px){.reportIdText{white-space:normal}.reportsTable td:first-child{min-width:300px}.reportNameWrap{min-width:260px}}


/* DropClarity Premium Responsive Layout v2 - wide desktop, cleaner tablet/mobile */
html,body{overflow-x:hidden!important;-webkit-text-size-adjust:100%;text-rendering:optimizeLegibility}
.dc-bg{padding-top:clamp(42px,4vw,64px);padding-bottom:clamp(28px,4vw,48px);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
.wrap{width:min(1960px,calc(100vw - clamp(16px,2vw,40px)))!important;max-width:1960px!important;margin-inline:auto!important;padding-inline:0!important}
.topbar{gap:clamp(14px,2vw,28px);margin-bottom:clamp(16px,2vw,24px)}
.dashboardIntro{max-width:1040px}.pageTitle{font-size:clamp(38px,3.1vw,54px);max-width:1040px}.pageSub{max-width:920px}.statusRow{gap:10px}
.rangeWrap,.marginTargetTopWrap,.hero,.panel,.scalePanel,.chartCard,.creditKpiPanel{backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.rangeWrap{margin:18px 0;padding:18px 20px;gap:16px}.rangeRight{gap:12px}.rangeButtons{gap:9px}.rangeBtn,.btn{min-height:42px}
.marginTargetTopWrap{padding:18px 20px;margin:14px 0 18px}.marginTargetTopTitle{font-size:18px}.marginTargetTopSub{max-width:980px}
.heroBody{grid-template-columns:minmax(0,1.35fr) minmax(380px,.65fr);padding:22px;gap:18px}.heroTitle{font-size:clamp(31px,2.1vw,40px)}.summaryCard{padding:18px;gap:13px}
.kpis{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:18px}.kpi{min-height:112px;padding:17px}.kValue{font-size:clamp(22px,1.5vw,29px)}
.charts{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin-top:16px}.chartCard{padding:18px}.gridMix{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.mixRow{padding:14px;min-width:0}
.creditKpiGrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.creditKpiCard{padding:14px}
.grid{grid-template-columns:minmax(0,1.72fr) minmax(390px,.58fr);gap:18px;margin-top:16px}.mainCol,.sideStack{gap:18px}.pad{padding:18px}.panelHead{padding:20px 20px 16px}.panelTitle{font-size:21px}.jobsTable{min-width:980px}.jobsTable th,.jobsTable td{padding:15px 16px}.tableWrap{-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
.scaleCommandGrid{grid-template-columns:minmax(0,1.45fr) minmax(360px,.55fr);gap:18px;padding:20px 20px 6px}.scaleGridPremiumV2{grid-template-columns:minmax(0,1.18fr) minmax(0,1fr) minmax(0,1fr);gap:18px;padding:20px}.scaleCard,.scaleEmailCard,.scaleCommandHero{padding:20px}.scaleMiniStats{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.benchmarkGridV2{grid-template-columns:repeat(3,minmax(0,1fr))}
.jobStats{grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}.jobHeroBody{grid-template-columns:minmax(0,1.35fr) minmax(380px,.65fr);padding:22px;gap:18px}.jobCharts{gap:16px}.comparisonGrid{grid-template-columns:minmax(250px,.78fr) minmax(280px,.84fr) minmax(560px,1.55fr);gap:16px}.driverGrid{gap:14px}.supportGrid{gap:16px}
.reportsManagerBody{grid-template-columns:minmax(0,1.32fr) minmax(380px,.68fr);gap:18px;padding:22px}.reportsTable{min-width:1080px}.reportsBulkActions{padding:16px 20px}.reportManagerTools{gap:10px}
@media (min-width:1800px){.wrap{width:min(2000px,calc(100vw - 32px))!important;max-width:2000px!important}.grid{grid-template-columns:minmax(0,1.82fr) minmax(420px,.55fr)}.pageTitle{font-size:56px}.heroTitle{font-size:42px}.scaleCommandHero{padding:24px}.scaleCard{padding:22px}}
@media (max-width:1500px){.wrap{width:calc(100vw - 32px)!important}.grid{grid-template-columns:minmax(0,1.58fr) minmax(360px,.62fr);gap:16px}.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.scaleMiniStats{grid-template-columns:repeat(3,minmax(0,1fr))}.benchmarkGridV2{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:1280px){.wrap{width:calc(100vw - 28px)!important}.pageTitle{font-size:40px}.heroBody,.jobHeroBody{grid-template-columns:1fr}.summaryCard,.jobSummaryCard{max-width:none}.grid{grid-template-columns:1fr}.sideStack{display:grid;grid-template-columns:1fr 1fr;gap:16px}.sideStack .panel:first-child{grid-column:1/-1}.charts{gap:14px}.gridMix{grid-template-columns:repeat(2,minmax(0,1fr))}.scaleCommandGrid{grid-template-columns:1fr}.scaleGridPremiumV2{grid-template-columns:1fr 1fr}.alertsExplainerCard{grid-column:span 2}.comparisonGrid{grid-template-columns:1fr 1fr}.comparisonTableWrap{grid-column:1/-1}.driverGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.reportsManagerBody{grid-template-columns:1fr}}
@media (max-width:1024px){.dc-bg{padding-top:34px}.wrap{width:calc(100vw - 24px)!important}.topbar{align-items:flex-start}.statusRow{justify-content:flex-start}.rangeWrap,.marginTargetTopWrap{align-items:flex-start;flex-direction:column}.rangeRight,.marginTargetTopControls{justify-content:flex-start;width:100%}.rangeButtons{width:100%;overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px;-webkit-overflow-scrolling:touch}.rangeBtn{flex:0 0 auto}.customDates{width:100%}.customDates input{flex:1 1 150px}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.creditKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.charts,.jobCharts{grid-template-columns:1fr}.chartCard.wide{grid-column:auto}.sideStack{display:flex}.scaleGridPremiumV2{grid-template-columns:1fr}.alertsExplainerCard{grid-column:auto}.benchmarkGridV2{grid-template-columns:1fr 1fr}.highRiskHeroBody{grid-template-columns:1fr}.reportsManagerTitle{font-size:28px}}
@media (max-width:768px){.dc-bg{padding-top:28px;background:#fff!important}.wrap{width:100%!important;padding-inline:16px!important}.pageTitle{font-size:34px;line-height:1.04}.pageSub{font-size:15px}.topbar{margin-bottom:14px}.statusRow{width:100%}.statusRow .btn,.statusRow a.btn{flex:1 1 auto;justify-content:center}.rangeWrap,.marginTargetTopWrap,.hero,.panel,.scalePanel,.chartCard,.creditKpiPanel{border-radius:18px}.panelHead,.responsiveHead{flex-direction:column;align-items:stretch!important}.tableTools,.reportManagerTools{width:100%;display:grid;grid-template-columns:1fr;gap:10px}.searchInput,.selectInput{width:100%;min-width:0}.heroBody,.jobHeroBody{padding:18px}.heroTitle,.jobHeroTitle{font-size:28px}.heroSub,.jobHeroSub{font-size:14.5px}.kpis,.creditKpiGrid,.gridMix,.jobStats{grid-template-columns:1fr}.kpi,.stat{min-height:auto}.scaleCommandGrid,.scaleGridPremiumV2{padding:14px;gap:14px}.scaleMiniStats{grid-template-columns:1fr 1fr}.scaleHeadRight{justify-content:flex-start}.scaleControlHead{align-items:flex-start!important}.benchmarkGridV2{grid-template-columns:1fr}.lockedFeatureGrid{grid-template-columns:1fr}.comparisonGrid{grid-template-columns:1fr;padding:14px}.driverGrid{grid-template-columns:1fr;padding:0 14px 14px}.supportGrid{grid-template-columns:1fr}.jobDetailPad{padding:14px}.jobTable{min-width:1180px}.jobsTable{min-width:880px}.reportsTable{min-width:980px}.reportsBulkActions{padding:14px}.reportsBulkActions .btn{width:100%;justify-content:center}.reportsManagerBody{padding:16px}.reportsManagerTitle{font-size:25px}.crumbs{align-items:flex-start}.crumbBtn{margin-left:0!important}.creditAppliedPill{white-space:normal;line-height:1.25}.emailLiveGrid{grid-template-columns:1fr}}
@media (max-width:480px){.wrap{padding-inline:12px!important}.pageTitle{font-size:30px}.pageKicker{font-size:11px}.btn,.rangeBtn{width:100%;justify-content:center}.rangeButtons .rangeBtn{width:auto}.customDates{display:grid;grid-template-columns:1fr;gap:8px}.heroBody,.jobHeroBody,.panelHead,.pad,.chartCard{padding:14px}.kValue,.statValue{font-size:22px}.scaleMiniStats{grid-template-columns:1fr}.reportActions{align-items:flex-end;flex-direction:column}.itemTop{gap:8px}.reportsManagerSub,.heroSub,.panelSub{font-size:13.5px}.upgradeModal{border-radius:22px;padding:20px}.upgradeTitle{font-size:23px}.jobsTable th,.jobsTable td{padding:12px 12px}.reportNameWrap{min-width:240px}.reportsTable td:first-child{min-width:280px}}
@media (hover:none) and (pointer:coarse){.btn,.miniBtn,.rangeBtn,.deleteReportBtn,.crumbBtn{min-height:44px}.deleteReportBtn{min-width:44px}.btn:hover,.miniBtn:hover,.reportPreviewItem:hover{transform:none;box-shadow:inherit}}


/* DropClarity final polish: tighter dashboard header, KPI-first rhythm, sharper risk state, modest report controls */
.dashboardIntro{display:flex;flex-direction:column;gap:6px!important;max-width:980px!important}
.pageKicker{margin-bottom:2px!important;padding:5px 10px!important;font-size:11px!important;box-shadow:0 8px 22px rgba(34,211,238,.08)!important}
.pageTitle{font-size:clamp(30px,2.55vw,42px)!important;line-height:1.06!important;letter-spacing:-.038em!important;max-width:900px!important}
.pageSub{margin-top:2px!important;font-size:clamp(14px,1.1vw,16px)!important;line-height:1.42!important;max-width:760px!important;color:rgba(51,65,85,.72)!important}
.topbar{margin-bottom:14px!important;align-items:center!important}
.statusRow .riskPill{border-color:rgba(239,68,68,.34)!important;background:linear-gradient(135deg,rgba(254,242,242,.96),rgba(255,255,255,.86))!important;color:rgba(185,28,28,.98)!important;box-shadow:0 14px 34px rgba(239,68,68,.14),0 0 0 1px rgba(239,68,68,.08) inset!important;font-weight:990!important}
.statusRow .riskPill::after{content:"";width:7px;height:7px;border-radius:999px;background:rgba(239,68,68,.95);box-shadow:0 0 0 4px rgba(239,68,68,.13);margin-left:2px}
.kpis{padding:16px!important;gap:12px!important}
.kpi{min-height:104px!important}
.hero{margin-top:12px!important}
.heroBody{padding:18px 20px!important;gap:16px!important}
.heroTitle{font-size:clamp(24px,1.75vw,32px)!important;line-height:1.08!important}
.heroSub{font-size:clamp(14px,1vw,15.5px)!important;line-height:1.42!important;max-width:760px!important}
.summaryCard{padding:15px!important;gap:10px!important}
.reportsManageLink{appearance:none;border:0;background:transparent;color:rgba(15,23,42,.58);font-size:12.5px;font-weight:950;cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:6px 2px;border-radius:999px;white-space:nowrap;transition:color .12s ease,transform .08s ease}
.reportsManageLink:hover{color:rgba(8,145,178,.96);transform:translateX(1px)}
.reportsManageLink span{font-size:13px;line-height:1;color:rgba(8,145,178,.85)}
.reportMoreLink{appearance:none;width:100%;border:0;background:transparent;color:rgba(8,145,178,.92);font-size:12.5px;font-weight:950;cursor:pointer;padding:10px 4px;margin-top:8px;text-align:center;border-radius:12px}
.reportMoreLink:hover{background:rgba(34,211,238,.07)}
.manageReportsBtn{background:transparent!important;border-color:transparent!important;box-shadow:none!important}
.sideStack .panelHead{align-items:flex-start!important}
@media(max-width:768px){.pageTitle{font-size:30px!important}.topbar{align-items:flex-start!important}.kpis{grid-template-columns:1fr 1fr!important}.heroBody{padding:16px!important}.reportsManageLink{align-self:flex-start}.statusRow .riskPill{width:auto!important;justify-content:center}}
@media(max-width:480px){.pageTitle{font-size:28px!important}.pageSub{font-size:14px!important}.kpis{grid-template-columns:1fr!important}.heroTitle{font-size:24px!important}.reportsManageLink{padding:6px 0}.statusRow .riskPill{width:100%!important}}


/* Latest AI Insights responsive cleanup */
.insightsPanel{overflow:hidden}
.insightsPanelHead{align-items:flex-start}
.insightsPad{padding:18px}
.insightList{display:flex;flex-direction:column;gap:12px;min-width:0}
.insightCard{min-width:0;border-radius:18px;border:1px solid rgba(15,23,42,.08);background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.72));box-shadow:0 10px 28px rgba(2,6,23,.045);padding:14px 14px 13px;overflow:hidden}
.insightTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0}
.insightTitleWrap{min-width:0;flex:1 1 auto}
.insightTitle{font-size:15px;line-height:1.25;font-weight:980;letter-spacing:-.015em;color:rgba(15,23,42,.92);overflow-wrap:anywhere}
.insightDetail{margin:7px 0 0;font-size:13px;line-height:1.45;font-weight:780;color:rgba(15,23,42,.62);overflow-wrap:anywhere}
.insightImpact{flex:0 1 auto;max-width:44%;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:rgba(248,250,252,.92);padding:7px 10px;font-size:11.5px;line-height:1.2;font-weight:950;text-align:center;white-space:normal;overflow-wrap:anywhere}
.insightImpact.ok{border-color:rgba(16,185,129,.20);background:rgba(16,185,129,.08);color:rgba(5,150,105,.96)}
.insightImpact.warn{border-color:rgba(245,158,11,.22);background:rgba(245,158,11,.10);color:rgba(180,83,9,.96)}
.insightImpact.bad{border-color:rgba(239,68,68,.22);background:rgba(239,68,68,.10);color:rgba(220,38,38,.96)}
.insightRecommendation{margin-top:11px;border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(255,255,255,.72);padding:10px 11px;min-width:0}
.insightRecommendation span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(15,23,42,.46)}
.insightRecommendation p{margin:4px 0 0;font-size:13px;line-height:1.45;font-weight:820;color:rgba(15,23,42,.66);overflow-wrap:anywhere}

/* Simpler margin target save button (slightly emphasized SaaS style) */
.compactTargetSave {
  background-color: #EEF2FF !important;   /* light indigo */
  color: #0F172A !important;              /* consistent text color */
  border: 1px solid #E0E7FF !important;   /* soft border */
  box-shadow: none !important;
  background-image: none !important;
}

.compactTargetSave:hover {
  background-color: #E0E7FF !important;
  border-color: #C7D2FE !important;
}

@media(max-width:1100px){.insightImpact{max-width:52%}}
@media(max-width:760px){.insightsPad{padding:14px}.insightTop{flex-direction:column;gap:9px}.insightImpact{max-width:100%;width:fit-content}.insightCard{padding:13px}.insightTitle{font-size:14.5px}.insightDetail,.insightRecommendation p{font-size:12.75px}.compactTargetSave{width:auto}}

`;