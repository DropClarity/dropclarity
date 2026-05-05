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
  credits_total?: number | string;
  credits?: number | string;
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
  credit_total?: number | string;
  credits_total?: number | string;
  total_credits?: number | string;
  cost_credits?: number | string;
  credits?: number | string | { total?: number | string; cost?: number | string };
  confidence?: number | string;
  notes?: string;
  job_notes?: string;
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
  creditsByBucket: { labor: number; materials: number; subs: number; other: number; };
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
  const creditsApplied = getJobCreditTotal(base);
  const customTotal = sumCustomCategories(job.custom_categories || []);
  const totalCosts = labor + materials + subs + other + customTotal - creditsApplied;
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
    ["Other Costs", other],
    ["Credits / Adjustments", -creditsApplied],
    ["Custom Categories", customTotal],
    ["Total Costs After Credits", totalCosts],
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

async function apiSaveJobNotes(
  token: string | null,
  payload: {
    jobDbId?: string | null;
    reportId?: string | null;
    jobId?: string | null;
    jobName?: string | null;
    notes: string;
  }
): Promise<{ ok?: boolean; notes?: string }> {
  const res = await fetch(`${API_BASE}/job-notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: { error?: string; ok?: boolean; notes?: string } | null = null;

  try {
    data = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error || text || `Job notes save failed (${res.status})`);
  }

  return data || { ok: true, notes: payload.notes };
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
  const other = getTrueOtherCostFromBreakdown(cb);
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
    notes: String(base?.job_notes ?? base?.notes ?? ""),
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

  const padLeft = w < 520 ? 46 : 58;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 36;
  const gx0 = padLeft;
  const gx1 = w - padRight;
  const gy0 = padTop;
  const gy1 = h - padBottom;

  const cleanValues = values.map((v) => (Number.isFinite(v) ? v : 0));
  const minV = Math.min(...cleanValues, 0);
  const maxV = Math.max(...cleanValues, 1);
  const range = maxV - minV || 1;
  const axisValues = [maxV, minV + range / 2, minV];

  const axisMoney = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
    return `${sign}$${Math.round(abs)}`;
  };

  ctx.font = "11px ui-sans-serif, system-ui";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(15,23,42,.38)";

  axisValues.forEach((axisValue) => {
    const y = gy1 - ((axisValue - minV) / range) * (gy1 - gy0);
    ctx.strokeStyle = "rgba(15,23,42,.06)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
    ctx.fillText(axisMoney(axisValue), gx0 - 8, y);
  });

  // Light extra guides without labels so the chart has structure without clutter.
  for (let i = 1; i < 4; i++) {
    const y = gy0 + (i * (gy1 - gy0)) / 4;
    ctx.strokeStyle = "rgba(15,23,42,.035)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
  }

  const zeroY = gy1 - ((0 - minV) / range) * (gy1 - gy0);
  if (zeroY >= gy0 && zeroY <= gy1) {
    ctx.strokeStyle = "rgba(15,23,42,.13)";
    ctx.beginPath();
    ctx.moveTo(gx0, zeroY);
    ctx.lineTo(gx1, zeroY);
    ctx.stroke();
  }

  const xs = cleanValues.map((_, i) => gx0 + (i * (gx1 - gx0)) / Math.max(1, cleanValues.length - 1));
  const ys = cleanValues.map((v) => gy1 - ((v - minV) / range) * (gy1 - gy0));

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

  ctx.font = w < 520 ? "10px ui-sans-serif, system-ui" : "12px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(15,23,42,.48)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const step = Math.max(1, Math.ceil(labels.length / 5));
  labels.forEach((lb, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return;
    ctx.fillText(String(lb), xs[i], h - 10);
  });
}
function barChart(canvas: HTMLCanvasElement, labels: string[], a: number[], b: number[]) {
  const packed = dprCanvas(canvas);
  if (!packed) return;

  const { ctx, w, h } = packed;
  ctx.clearRect(0, 0, w, h);

  const padLeft = w < 520 ? 42 : 52;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 36;
  const gx0 = padLeft;
  const gx1 = w - padRight;
  const gy0 = padTop;
  const gy1 = h - padBottom;

  const maxV = Math.max(...a, ...b, 1);
  const axisMoney = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1000000) return `$${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`;
    return `$${Math.round(abs)}`;
  };

  ctx.font = "11px ui-sans-serif, system-ui";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(15,23,42,.36)";

  [maxV, maxV / 2, 0].forEach((axisValue) => {
    const y = gy1 - (axisValue / maxV) * (gy1 - gy0);
    ctx.strokeStyle = "rgba(15,23,42,.06)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
    ctx.fillText(axisMoney(axisValue), gx0 - 8, y);
  });

  for (let i = 1; i < 4; i++) {
    const y = gy0 + (i * (gy1 - gy0)) / 4;
    ctx.strokeStyle = "rgba(15,23,42,.035)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
  }

  const n = labels.length;
  const slot = (gx1 - gx0) / Math.max(1, n);
  const bw = Math.max(7, Math.min(20, slot * 0.24));
  const gap = bw * 0.34;
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

  ctx.font = w < 520 ? "10px ui-sans-serif, system-ui" : "12px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(15,23,42,.48)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const step = Math.max(1, Math.ceil(n / 5));
  for (let i = 0; i < n; i++) {
    if (i % step !== 0 && i !== n - 1) continue;
    ctx.fillText(String(labels[i]), gx0 + i * slot + slot / 2, h - 10);
  }
}
function getTrueOtherCostFromBreakdown(cb?: CostBreakdown): number {
  const other = parseNumberLoose(cb?.other);
  const credits = Math.max(0, parseNumberLoose(cb?.credits_total ?? cb?.credits));

  // Worker policy: credits/refunds are routed into Other as negative values for reconciliation,
  // while credits_total tracks the absolute credit amount. For display, separate them so
  // true Other fees are not shown as a negative Other bucket.
  if (credits > 0) return Math.max(0, other + credits);

  return Math.max(0, other);
}

function getDisplayCostMix(state: DashboardState) {
  const jobs = getAllJobs(state);

  if (jobs.length) {
    const credits = getCreditMetrics(state).totalCredits;
    const labor = jobs.reduce((sum, job) => sum + Math.max(0, parseNumberLoose(job.cost_breakdown?.labor)), 0);
    const materials = jobs.reduce((sum, job) => sum + Math.max(0, parseNumberLoose(job.cost_breakdown?.materials)), 0);
    const subs = jobs.reduce((sum, job) => sum + Math.max(0, parseNumberLoose(job.cost_breakdown?.subs)), 0);
    const other = jobs.reduce((sum, job) => sum + getTrueOtherCostFromBreakdown(job.cost_breakdown), 0);

    return { labor, materials, subs, other, credits };
  }

  const mix = state.cost_mix || state.mix || {};
  const credits = getCreditMetrics(state).totalCredits;
  const labor = Math.max(0, parseNumberLoose(mix.labor));
  const materials = Math.max(0, parseNumberLoose(mix.materials));
  const subs = Math.max(0, parseNumberLoose(mix.subs));
  const other = Math.max(0, parseNumberLoose(mix.other) + credits);

  return { labor, materials, subs, other, credits };
}

function buildCostMixParts(state: DashboardState): CostPart[] {
  const displayMix = getDisplayCostMix(state);

  return [
    { label: "Labor", value: displayMix.labor, color: "rgba(34,211,238,.95)", shadow: "rgba(34,211,238,.25)" },
    { label: "Materials", value: displayMix.materials, color: "rgba(124,58,237,.90)", shadow: "rgba(124,58,237,.20)" },
    { label: "Subs", value: displayMix.subs, color: "rgba(37,99,235,.90)", shadow: "rgba(37,99,235,.18)" },
    { label: "Other Costs", value: displayMix.other, color: "rgba(52,211,153,.90)", shadow: "rgba(52,211,153,.20)" },
    { label: "Credits / Adjustments", value: displayMix.credits > 0 ? -displayMix.credits : 0, color: "rgba(100,116,139,.82)", shadow: "rgba(100,116,139,.14)" },
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

function alertEmailsKey(userId: string): string {
  return `dc_alert_email_addresses_${userId}`;
}

function normalizeEmailList(list: string[], fallbackEmail?: string | null): string[] {
  const seeded = [fallbackEmail || "", ...(Array.isArray(list) ? list : [])];
  const clean = seeded
    .map((email) => String(email || "").trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return Array.from(new Set(clean));
}

function readAlertEmails(userId: string, fallbackEmail?: string | null): string[] {
  if (typeof window === "undefined") return normalizeEmailList([], fallbackEmail);
  try {
    const arr = JSON.parse(localStorage.getItem(alertEmailsKey(userId)) || "[]");
    return normalizeEmailList(Array.isArray(arr) ? arr.map(String) : [], fallbackEmail);
  } catch {
    return normalizeEmailList([], fallbackEmail);
  }
}

function writeAlertEmails(userId: string, emails: string[], fallbackEmail?: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(alertEmailsKey(userId), JSON.stringify(normalizeEmailList(emails, fallbackEmail)));
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

function getExplicitCreditAmount(job: JobRow): number {
  const rawCredits = job?.credits;
  const cb = job?.cost_breakdown || {};

  const candidates = [
    job?.credit_total,
    job?.credits_total,
    job?.total_credits,
    job?.cost_credits,
    cb?.credits_total,
    cb?.credits,
    typeof rawCredits === "object" && rawCredits !== null ? rawCredits.total : rawCredits,
    typeof rawCredits === "object" && rawCredits !== null ? rawCredits.cost : null,
  ];

  for (const candidate of candidates) {
    const n = parseNumberLoose(candidate);
    if (n > 0) return n;
    if (n < 0) return Math.abs(n);
  }

  return 0;
}


function getJobCreditTotal(job: JobRow): number {
  const explicit = getExplicitCreditAmount(job);
  if (explicit > 0) return explicit;

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

  const jobCreditRows = jobs
    .map((job) => ({ job, credit: getJobCreditTotal(job) }))
    .filter((row) => row.credit > 0)
    .sort((a, b) => b.credit - a.credit);

  const totalCredits = jobCreditRows.reduce((sum, row) => sum + row.credit, 0);

  // UI policy: credits are tracked as their own adjustment line. Even when the Worker
  // reconciles them through Other internally, dashboard visuals separate credits from
  // true Other costs so users do not confuse refunds with permits/fees/misc costs.
  const creditsByBucket = {
    labor: 0,
    materials: 0,
    subs: 0,
    other: totalCredits,
  };

  const positiveCostActivity = jobs.reduce((sum, j) => {
    const cb = j.cost_breakdown || {};
    return (
      sum +
      Math.max(0, parseNumberLoose(cb.labor)) +
      Math.max(0, parseNumberLoose(cb.materials)) +
      Math.max(0, parseNumberLoose(cb.subs)) +
      getTrueOtherCostFromBreakdown(cb)
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
    { label: "Other Costs", current: getTrueOtherCostFromBreakdown(baseMix), average: avgOf(pool.map((j) => getTrueOtherCostFromBreakdown(j.cost_breakdown))) },
    { label: "Credits", current: -getJobCreditTotal(base), average: avgOf(pool.map((j) => -getJobCreditTotal(j))) },
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

function buildDashboardHistoryUrl(nextView: ViewMode, nextJobKey = ""): string {
  if (typeof window === "undefined") return "/dashboard";

  const url = new URL(window.location.href);

  if (nextView === "dashboard") {
    url.searchParams.delete("dcView");
    url.searchParams.delete("dcJobKey");
  } else {
    url.searchParams.set("dcView", nextView);

    if (nextJobKey) {
      url.searchParams.set("dcJobKey", nextJobKey);
    } else {
      url.searchParams.delete("dcJobKey");
    }
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function readDashboardHistoryState(): { view: ViewMode; jobKey: string } {
  if (typeof window === "undefined") return { view: "dashboard", jobKey: "" };

  const url = new URL(window.location.href);
  const viewParam = url.searchParams.get("dcView") as ViewMode | null;
  const validViews = new Set<ViewMode>(["dashboard", "job", "alljobs", "highrisk", "reports"]);
  const view = viewParam && validViews.has(viewParam) ? viewParam : "dashboard";
  const jobKey = url.searchParams.get("dcJobKey") || "";

  return { view, jobKey };
}


type DashboardCachePayload = {
  cached_at: string;
  range: RangeKey;
  customFrom: string;
  customTo: string;
  state: DashboardState;
  scaleSummary: ScaleSummary | null;
};

function dashboardCacheKey(userId: string, range: RangeKey, customFrom = "", customTo = ""): string {
  const from = String(customFrom || "").trim();
  const to = String(customTo || "").trim();
  return `dc_dashboard_cache_${userId}_${range}_${from}_${to}`;
}

function readDashboardCache(
  userId: string,
  range: RangeKey,
  customFrom = "",
  customTo = ""
): DashboardCachePayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(dashboardCacheKey(userId, range, customFrom, customTo));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as DashboardCachePayload | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.state || typeof parsed.state !== "object") return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeDashboardCache(
  userId: string,
  range: RangeKey,
  customFrom: string,
  customTo: string,
  state: DashboardState,
  scaleSummary: ScaleSummary | null
) {
  if (typeof window === "undefined") return;

  try {
    const payload: DashboardCachePayload = {
      cached_at: new Date().toISOString(),
      range,
      customFrom: String(customFrom || ""),
      customTo: String(customTo || ""),
      state,
      scaleSummary,
    };

    localStorage.setItem(
      dashboardCacheKey(userId, range, customFrom, customTo),
      JSON.stringify(payload)
    );
  } catch {
    // Ignore localStorage quota/private-mode failures. The dashboard still loads from the API.
  }
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
    <div className="marginTargetTopWrap" aria-label="Margin target control">
      <div className="marginTargetTopText">
        <div className="marginTargetTopKicker">Target Margin</div>
        <div className="marginTargetCurrent">Current: {fmtPct(marginTarget)}</div>
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
          Save
        </button>
      </div>
    </div>
  );
}

function TopBar({
  state,
  mode,
  onRefresh,
  plan,
  marginTarget,
  marginTargetDraft,
  setMarginTargetDraft,
  onSaveMarginTarget,
}: {
  state: DashboardState;
  mode: DashboardMode;
  onRefresh: () => void;
  plan?: string;
  marginTarget: number;
  marginTargetDraft: string;
  setMarginTargetDraft: (v: string) => void;
  onSaveMarginTarget: () => void;
}) {
  const s = state?.summary || null;
  const profit = parseNumberLoose(s?.net_profit);
  const margin = parseNumberLoose(s?.margin_pct);
  const losing = parseNumberLoose(s?.losing_jobs_count);
  const profitHealth = !s ? "warn" : profit < 0 || losing > 0 ? "bad" : margin < 20 ? "warn" : "ok";
  const healthLabel = profitHealth === "bad" ? "⚠ Profit risk" : profitHealth === "warn" ? "Needs optimization" : "Healthy";
  void plan;

  return (
    <div className="topbar">
      <div className="dashboardIntro">
        <div className="pageKicker">Profitability Dashboard</div>
        <h1 className="pageTitle">
          See where <span className="gradText">profit is made and lost</span>
        </h1>
        <div className="pageSub">
  {mode === "loading" ? (
    "Loading your profitability dashboard..."
  ) : s ? (
    <>
      Viewing <b>{rangeLabel((state.range as RangeKey) || "all")}</b> job profitability, profit leaks, and margin risk across every saved analysis.
    </>
  ) : (
    "No reports yet. Run an analysis from the Upload page to generate your first dashboard."
  )}
</div>
      </div>

      <div className="topbarRight">
        <div className="statusRow">
          <StatusPill mode={mode} />
          {s ? <div className={`pill health ${profitHealth} ${profitHealth === "bad" ? "riskPill" : ""}`}>{healthLabel}</div> : null}

          <button className="btn" type="button" onClick={onRefresh}>
            Refresh
          </button>

          <a className="btn uploadPulseBtn" href="/app">
            Go to Upload
          </a>
        </div>

        <MarginTargetControl
          marginTarget={marginTarget}
          marginTargetDraft={marginTargetDraft}
          setMarginTargetDraft={setMarginTargetDraft}
          onSaveMarginTarget={onSaveMarginTarget}
        />
      </div>
    </div>
  );
}


function ProfitLeakSnapshot({
  state,
  marginTarget,
  onOpenHighRisk,
}: {
  state: DashboardState;
  marginTarget: number;
  onOpenHighRisk: () => void;
}) {
  const s = state.summary || {};
  const jobs = getAllJobs(state);
  const range = rangeLabel((state.range as RangeKey) || "all");
  const totalProfit = parseNumberLoose(s.net_profit);
  const totalRevenue = parseNumberLoose(s.revenue);
  const totalMargin = parseNumberLoose(s.margin_pct);

  const rows = jobs
    .map((job, idx) => {
      const revenue = parseNumberLoose(job.revenue);
      const profit = parseNumberLoose(job.profit);
      const margin = parseNumberLoose(job.margin_pct);
      const targetProfit = revenue * (marginTarget / 100);
      const recoverable = Math.max(0, targetProfit - profit);
      return {
        job,
        key: buildJobKey(job, idx),
        revenue,
        profit,
        margin,
        recoverable,
      };
    })
    .sort((a, b) => b.recoverable - a.recoverable || a.profit - b.profit);

  const losingRows = rows.filter((row) => row.profit < 0);
  const belowTargetRows = rows.filter((row) => row.profit >= 0 && row.margin < marginTarget);
  const recoverableProfit = rows.reduce((sum, row) => sum + row.recoverable, 0);
  const lossAmount = losingRows.reduce((sum, row) => sum + Math.abs(Math.min(0, row.profit)), 0);
  const topOpportunity = rows.find((row) => row.recoverable > 0) || rows[0] || null;
  const hasRisk = losingRows.length > 0 || belowTargetRows.length > 0 || recoverableProfit > 0;

  const headline = hasRisk
    ? `${losingRows.length} job${losingRows.length === 1 ? "" : "s"} are losing money.`
    : `Jobs are above breakeven in this ${range.toLowerCase()} view.`;

  const sub = hasRisk
    ? `DropClarity found ${fmtMoney(recoverableProfit)} in recoverable profit gap against your ${fmtPct(marginTarget)} target. Start with the highest-impact job below.`
    : `Keep monitoring new uploads against your ${fmtPct(marginTarget)} target margin so margin drift is caught early.`;

  return (
    <section className={hasRisk ? "profitSnapshot risk" : "profitSnapshot healthy"}>
      <div className="profitSnapshotMain">
        <div className="profitSnapshotKicker">What needs attention first</div>
        <h2 className="profitSnapshotTitle">{headline}</h2>
        <p className="profitSnapshotSub">{sub}</p>

        <div className="profitSnapshotActions">
          <button className="btn profitSnapshotPrimary" type="button" onClick={onOpenHighRisk}>
            Review high-risk jobs
          </button>
          <a className="btn profitSnapshotSecondary" href="#jobsPanel">
            View job log
          </a>
        </div>
      </div>

      <div className="profitSnapshotMetrics">
        <div className="profitSnapshotMetric primary">
          <span>Recoverable Profit</span>
          <strong>{fmtMoney(recoverableProfit)}</strong>
          <em>Gap to {fmtPct(marginTarget)} target</em>
        </div>
        <div className="profitSnapshotMetric">
          <span>Losing Jobs</span>
          <strong className={losingRows.length ? "neg" : "pos"}>{losingRows.length}</strong>
          <em>{lossAmount > 0 ? `${fmtMoney(lossAmount)} below breakeven` : "None below breakeven"}</em>
        </div>
        <div className="profitSnapshotMetric">
          <span>Total Net Profit</span>
          <strong className={totalProfit < 0 ? "neg" : "pos"}>{fmtMoney(totalProfit)}</strong>
          <em>{fmtPct(totalMargin)} blended margin</em>
        </div>
        <div className="profitSnapshotMetric">
          <span>Total Revenue</span>
          <strong>{fmtMoney(totalRevenue)}</strong>
          <em>{jobs.length} analyzed jobs</em>
        </div>
      </div>

      {topOpportunity ? (
        <button className="profitSnapshotOpportunity" type="button" onClick={onOpenHighRisk}>
          <span>Top opportunity</span>
          <strong>{topOpportunity.job.job_name || topOpportunity.job.job_id || "Review job"}</strong>
          <em>{topOpportunity.recoverable > 0 ? `${fmtMoney(topOpportunity.recoverable)} gap` : "Monitor margin"}</em>
        </button>
      ) : null}
    </section>
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
          <div className="panelTitle">Business Totals</div>
          <div className="panelSub">The numbers behind the profit leaks above.</div>
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

  const displayMix = getDisplayCostMix(state);
  const cards = [
    {
      label: "Credits / Adjustments",
      value: fmtMoney(metrics.totalCredits),
      sub: "Tracked separately from Other costs",
    },
    {
      label: "True Other Costs",
      value: fmtMoney(displayMix.other),
      sub: "Permits, fees, delivery, misc — before credits",
    },
    {
      label: "Jobs w/ Credits",
      value: String(metrics.jobsWithCredits),
      sub: "Jobs with refunds or credit memos",
    },
    {
      label: "Net Costs After Credits",
      value: fmtMoney(metrics.netCostAfterCredits),
      sub: "Used for profit and margin",
    },
  ];

  return (
    <div className="creditKpiPanel">
      <div className="creditKpiHead">
        <div>
          <div className="creditKpiTitle">Credit / Refund Tracking</div>
          <div className="creditKpiSub">Supplier credits, refunds, and credit memos are included in profit, but shown separately from true Other costs so the dashboard reconciles cleanly.</div>
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

    const drawCharts = () => {
      const sorted = jobs.slice().sort((a, b) => parseNumberLoose(a.profit) - parseNumberLoose(b.profit)).slice(0, 5);
      const labels = sorted.map((j) => String(j.job_id || j.job_name || "Job").slice(0, 10));
      const profit = sorted.map((j) => parseNumberLoose(j.profit));
      const revenue = sorted.map((j) => parseNumberLoose(j.revenue));
      const costs = sorted.map((j) => parseNumberLoose(j.costs));

      if (profitRef.current && sorted.length) lineChart(profitRef.current, labels, profit, "rgba(16,185,129,.95)");
      if (revCostRef.current && sorted.length) barChart(revCostRef.current, labels, revenue, costs);
    };

    drawCharts();
    window.addEventListener("resize", drawCharts);
    return () => window.removeEventListener("resize", drawCharts);
  }, [jobs, view]);

  return (
    <div className="charts">
      <div className="chartCard">
        <div className="chartHead">
          <div>
            <div className="chartTitle">Lowest-Profit Jobs</div>
            <div className="chartSub">Lowest 5 jobs by net profit in the selected range</div>
          </div>
        </div>
        {jobs.length ? <canvas ref={profitRef} width={520} height={220} /> : <div className="trendEmpty">No jobs in this range yet.</div>}
      </div>

      <div className="chartCard">
        <div className="chartHead">
          <div>
            <div className="chartTitle">Revenue vs Costs</div>
            <div className="chartSub">Revenue and costs for the lowest 5 jobs</div>
          </div>
        </div>
        {jobs.length ? <canvas ref={revCostRef} width={520} height={220} /> : <div className="trendEmpty">No job-level totals yet.</div>}
      </div>

      <div className="chartCard wide">
        <div className="chartHead responsiveHead">
          <div>
            <div className="chartTitle">Cost Mix</div>
            <div className="chartSub">
              Shows true cost buckets separately from credits/adjustments. Net costs still include credits for profit and margin.
            </div>
          </div>

          {creditMetrics.totalCredits > 0 ? (
            <span className="creditAppliedPill">Credits / adjustments: -{fmtMoney(creditMetrics.totalCredits).replace("$", "$")}</span>
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
                  {isCredit ? `Reduces total costs by ${fmtMoney(Math.abs(p.value))}` : `${fmtPct(share)} of gross cost activity`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobsLog({
  jobs,
  onOpenJob,
  onOpenAllJobs,
}: {
  jobs: JobRow[];
  onOpenJob: (jobKey: string) => void;
  onOpenAllJobs: () => void;
}) {
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
          <button className="btn allJobsDetailBtn" type="button" onClick={onOpenAllJobs}>
            View All Job Details
          </button>
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


function ProfitCommandCenter({
  state,
  marginTarget,
  onOpenJob,
  onOpenHighRisk,
}: {
  state: DashboardState;
  marginTarget: number;
  onOpenJob: (jobKey: string) => void;
  onOpenHighRisk: () => void;
}) {
  const jobs = getAllJobs(state);
  const creditMetrics = getCreditMetrics(state);
  const displayMix = getDisplayCostMix(state);
  const totalRevenue = parseNumberLoose(state.summary?.revenue);
  const totalCosts = parseNumberLoose(state.summary?.costs);
  const totalProfit = parseNumberLoose(state.summary?.net_profit);
  const totalMargin = parseNumberLoose(state.summary?.margin_pct);
  const grossCostActivity = displayMix.labor + displayMix.materials + displayMix.subs + displayMix.other;
  const costRatio = totalRevenue > 0 ? (totalCosts / totalRevenue) * 100 : 0;
  const profitPerJob = jobs.length ? totalProfit / jobs.length : 0;
  const avgRevenuePerJob = jobs.length ? totalRevenue / jobs.length : 0;

  const opportunityRows = jobs
    .map((job, idx) => {
      const revenue = parseNumberLoose(job.revenue);
      const profit = parseNumberLoose(job.profit);
      const margin = parseNumberLoose(job.margin_pct);
      const targetProfit = revenue * (marginTarget / 100);
      const gap = Math.max(0, targetProfit - profit);
      const status = profit < 0 ? "Critical" : margin < marginTarget ? "Below target" : "Healthy";
      const comparison = jobComparisonStats(job, jobs);
      const driver = comparison.drivers[0];
      const issue = strongestJobIssue(job, jobs, marginTarget);
      return {
        job,
        idx,
        key: buildJobKey(job, idx),
        revenue,
        profit,
        margin,
        targetProfit,
        gap,
        status,
        driver,
        issue,
      };
    })
    .sort((a, b) => b.gap - a.gap || a.profit - b.profit);

  const recoverableProfit = opportunityRows.reduce((sum, row) => sum + row.gap, 0);
  const highRiskRows = opportunityRows.filter((row) => row.gap > 0 || row.profit < 0);
  const losingRows = opportunityRows.filter((row) => row.profit < 0);
  const topActions = highRiskRows.slice(0, 4);
  const topRecoverableJob = opportunityRows.find((row) => row.gap > 0) || opportunityRows[0] || null;

  const materialShare = grossCostActivity > 0 ? (displayMix.materials / grossCostActivity) * 100 : 0;
  const laborShare = grossCostActivity > 0 ? (displayMix.labor / grossCostActivity) * 100 : 0;
  const subsShare = grossCostActivity > 0 ? (displayMix.subs / grossCostActivity) * 100 : 0;
  const otherShare = grossCostActivity > 0 ? (displayMix.other / grossCostActivity) * 100 : 0;

  const benchmarkCards = [
    {
      label: "Actual Margin",
      value: fmtPct(totalMargin),
      note: totalMargin >= marginTarget ? `Above ${fmtPct(marginTarget)} target` : `${fmtPct(marginTarget - totalMargin)} below target`,
      cls: totalMargin >= marginTarget ? "ok" : "warn",
    },
    {
      label: "Target Margin",
      value: fmtPct(marginTarget),
      note: "Used for recoverable profit and alerts",
      cls: "ok",
    },
    {
      label: "Profit / Job",
      value: fmtMoney(profitPerJob),
      note: `Avg revenue/job ${fmtMoney(avgRevenuePerJob)}`,
      cls: profitPerJob >= 0 ? "ok" : "bad",
    },
    {
      label: "Cost Ratio",
      value: fmtPct(costRatio),
      note: "Net costs as share of revenue",
      cls: costRatio <= 100 - marginTarget ? "ok" : "warn",
    },
    {
      label: "Materials Share",
      value: fmtPct(materialShare),
      note: "Gross cost activity benchmark",
      cls: materialShare > 60 ? "warn" : "ok",
    },
    {
      label: "Labor Share",
      value: fmtPct(laborShare),
      note: "Gross cost activity benchmark",
      cls: laborShare > 45 ? "warn" : "ok",
    },
  ];

  const commandSummary = recoverableProfit > 0
    ? `DropClarity found ${fmtMoney(recoverableProfit)} in profit gap to your ${fmtPct(marginTarget)} target across ${highRiskRows.length} job${highRiskRows.length === 1 ? "" : "s"}.`
    : `Jobs in this view are currently meeting your ${fmtPct(marginTarget)} margin target. Keep monitoring new uploads for profit leaks.`;

  return (
    <div className="wowCenter panel">
      <div className="wowTop">
        <div>
          <div className="sectionEyebrow">Profit Command Center</div>
          <div className="wowTitle">Know what profit is recoverable and what to fix first.</div>
          <div className="wowSub">{commandSummary}</div>
        </div>
        <div className="wowActions">
          <button className="btn subtlePrimaryBtn" type="button" onClick={onOpenHighRisk}>
            Review High-Risk Jobs
          </button>
        </div>
      </div>

      <div className="wowHeroGrid">
        <div className="wowRecoveryCard">
          <div className="wowKicker">Recoverable Profit</div>
          <div className={recoverableProfit > 0 ? "wowRecoveryValue warnText" : "wowRecoveryValue pos"}>{fmtMoney(recoverableProfit)}</div>
          <div className="wowRecoverySub">Estimated gap between current job profit and your {fmtPct(marginTarget)} target margin.</div>
          <div className="wowRecoveryStats">
            <div><span>At-risk jobs</span><strong>{highRiskRows.length}</strong></div>
            <div><span>Losing jobs</span><strong className={losingRows.length ? "neg" : "pos"}>{losingRows.length}</strong></div>
            <div><span>Credits tracked</span><strong>{fmtMoney(creditMetrics.totalCredits)}</strong></div>
          </div>
          {topRecoverableJob ? (
            <button className="wowPrimaryJob" type="button" onClick={() => onOpenJob(topRecoverableJob.key)}>
              <span>Top opportunity</span>
              <strong>{topRecoverableJob.job.job_name || topRecoverableJob.job.job_id || "Review job"}</strong>
              <em>{fmtMoney(topRecoverableJob.gap)} gap</em>
            </button>
          ) : null}
        </div>

        <div className="wowActionCard">
          <div className="wowCardHead">
            <div>
              <div className="wowKicker">Action Queue</div>
              <div className="wowCardTitle">What to fix first</div>
            </div>
            <span className="tag">Ranked by impact</span>
          </div>

          <div className="wowActionList">
            {topActions.length ? (
              topActions.map((row, idx) => (
                <button className="wowActionItem" type="button" key={row.key} onClick={() => onOpenJob(row.key)}>
                  <div className="wowActionRank">#{idx + 1}</div>
                  <div className="wowActionBody">
                    <div className="wowActionName">{row.job.job_name || row.job.job_id || "Unnamed job"}</div>
                    <div className="wowActionIssue">{row.issue}</div>
                    <div className="wowActionMeta">{row.driver?.label || "Margin"} driver · {row.status}</div>
                  </div>
                  <div className="wowActionImpact">{fmtMoney(row.gap)}</div>
                </button>
              ))
            ) : (
              <div className="wowEmpty">No immediate recoverable-profit actions in this range.</div>
            )}
          </div>
        </div>

        <div className="wowBenchmarkCard">
          <div className="wowCardHead">
            <div>
              <div className="wowKicker">Basic Benchmarking</div>
              <div className="wowCardTitle">How this business is trending</div>
            </div>
          </div>
          <div className="wowBenchmarkGrid">
            {benchmarkCards.map((card) => (
              <div className="wowBenchmarkItem" key={card.label}>
                <div>
                  <div className="wowBenchmarkLabel">{card.label}</div>
                  <div className="wowBenchmarkNote">{card.note}</div>
                </div>
                <strong className={card.cls}>{card.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wowCostStrip">
        <div><span>Materials share</span><strong>{fmtPct(materialShare)}</strong></div>
        <div><span>Labor share</span><strong>{fmtPct(laborShare)}</strong></div>
        <div><span>Subs share</span><strong>{fmtPct(subsShare)}</strong></div>
        <div><span>Other cost share</span><strong>{fmtPct(otherShare)}</strong></div>
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
  alertEmails,
  setAlertEmails,
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
  alertEmails: string[];
  setAlertEmails: (emails: string[]) => void;
  onOpenJob: (jobKey: string) => void;
  onOpenHighRisk: () => void;
}) {
  const jobs = getAllJobs(state);
  void marginTargetDraft;
  void setMarginTargetDraft;
  void onSaveMarginTarget;
  const fallbackMetrics = getScaleMetrics(state, marginTarget);
  const backendStats = scaleSummary?.stats || null;
  const backendBenchmarks = scaleSummary?.benchmarks || null;
  const access = getPlanAccess(plan);
  const isScale = access.canUseScale;
  const canPreviewScale = access.canPreviewScale;
  const updatedAtLabel = latestDashboardUpdate(state);
  const normalizedAlertEmails = useMemo(() => normalizeEmailList(alertEmails, userEmail), [alertEmails, userEmail]);
  const [isEditingAlertEmails, setIsEditingAlertEmails] = useState(false);
  const [alertEmailDraft, setAlertEmailDraft] = useState(normalizedAlertEmails.join(", "));

  useEffect(() => {
    if (!isEditingAlertEmails) setAlertEmailDraft(normalizedAlertEmails.join(", "));
  }, [isEditingAlertEmails, normalizedAlertEmails]);

  const saveAlertEmailDraft = () => {
    const next = normalizeEmailList(alertEmailDraft.split(/[\n,;]/), userEmail);
    setAlertEmails(next);
    setAlertEmailDraft(next.join(", "));
    setIsEditingAlertEmails(false);
  };

  const displayMixForScale = getDisplayCostMix(state);
  const materialTotal = displayMixForScale.materials;
  const laborTotal = displayMixForScale.labor;
  const subsTotal = displayMixForScale.subs;
  const otherTotal = displayMixForScale.other;
  const knownCosts = materialTotal + laborTotal + subsTotal + otherTotal;
  const materialShare = knownCosts ? (materialTotal / knownCosts) * 100 : 0;
  const laborShare = knownCosts ? (laborTotal / knownCosts) * 100 : 0;
  const subsShare = knownCosts ? (subsTotal / knownCosts) * 100 : 0;
  const otherShare = knownCosts ? (otherTotal / knownCosts) * 100 : 0;
  const totalRevenue = parseNumberLoose(state.summary?.revenue || backendStats?.total_revenue);
  const totalCosts = parseNumberLoose(state.summary?.costs || backendStats?.total_costs);
  const totalProfit = parseNumberLoose(state.summary?.net_profit || backendStats?.total_profit);
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
      ? totalProfit / jobs.length
      : 0;
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

  const opportunityRows = jobs
    .map((job, idx) => {
      const revenue = parseNumberLoose(job.revenue);
      const profit = parseNumberLoose(job.profit);
      const margin = parseNumberLoose(job.margin_pct);
      const targetProfit = revenue * (marginTarget / 100);
      const gap = Math.max(0, targetProfit - profit);
      const comparison = jobComparisonStats(job, jobs);
      const driver = comparison.drivers[0];
      const status = profit < 0 ? "Critical" : margin < marginTarget ? "Below target" : "Healthy";
      const issue = strongestJobIssue(job, jobs, marginTarget);
      return { job, idx, key: buildJobKey(job, idx), revenue, profit, margin, targetProfit, gap, comparison, driver, status, issue };
    })
    .sort((a, b) => b.gap - a.gap || a.profit - b.profit);

  const highRiskRows = opportunityRows.filter((row) => row.gap > 0 || row.profit < 0 || row.margin < marginTarget);
  const losingRows = opportunityRows.filter((row) => row.profit < 0);
  const topActions = highRiskRows.slice(0, 5);
  const topRecoverableJob = opportunityRows.find((row) => row.gap > 0) || opportunityRows[0] || null;
  const losingLossAmount = losingRows.reduce((sum, row) => sum + Math.abs(Math.min(0, row.profit)), 0);
  const thinMarginOpportunity = fallbackMetrics.thinMarginJobs.reduce((sum, job) => {
    const revenue = parseNumberLoose(job.revenue);
    const profit = parseNumberLoose(job.profit);
    const targetProfit = revenue * (marginTarget / 100);
    return sum + Math.max(0, targetProfit - profit);
  }, 0);

  const summaryTitle =
    fallbackMetrics.highRiskCount > 0
      ? `${fallbackMetrics.highRiskCount} high-risk jobs need review.`
      : `No jobs are currently below your ${fmtPct(marginTarget)} target.`;

  const summaryCopy =
    fallbackMetrics.highRiskCount > 0
      ? `DropClarity found ${fmtMoney(recoverableOpportunity)} in profit gap to your ${fmtPct(marginTarget)} target across this ${currentRange.toLowerCase()} view.`
      : `DropClarity is monitoring each saved job against your target margin and will flag jobs that fall below it.`;

  const benchmarkCards = [
    {
      label: "Actual Margin",
      value: fmtPct(avgMargin),
      note: avgMargin >= marginTarget ? `Above ${fmtPct(marginTarget)} target` : `${fmtPct(marginTarget - avgMargin)} below target`,
      cls: avgMargin >= marginTarget ? "ok" : "warn",
    },
    { label: "Target Margin", value: fmtPct(marginTarget), note: "Used for recoverable profit and alerts", cls: "ok" },
    { label: "Profit / Job", value: fmtMoney(profitPerJob), note: `Avg revenue/job ${fmtMoney(jobs.length ? totalRevenue / jobs.length : 0)}`, cls: profitPerJob >= 0 ? "ok" : "bad" },
    { label: "Cost Ratio", value: fmtPct(costRatio), note: "Net costs as share of revenue", cls: costRatio <= 100 - marginTarget ? "ok" : "warn" },
    { label: "Materials Share", value: fmtPct(materialShare), note: "Gross cost activity benchmark", cls: materialShare > 60 ? "warn" : "ok" },
    { label: "Labor Share", value: fmtPct(laborShare), note: "Gross cost activity benchmark", cls: laborShare > 45 ? "warn" : "ok" },
  ];

  const leakRows = [
    {
      label: "Losing jobs",
      amount: losingLossAmount,
      meta: `${losingRows.length} job${losingRows.length === 1 ? "" : "s"} below breakeven`,
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
      label: "Materials exposure",
      amount: materialTotal,
      meta: `${fmtPct(materialShare)} of known costs`,
      fix: "Review supplier pricing, equipment assumptions, parts markup, and purchasing consistency.",
      cls: materialShare > 55 ? "warn" : "ok",
    },
    {
      label: "Credits recovered",
      amount: creditMetrics.totalCredits,
      meta: `${creditMetrics.jobsWithCredits} job${creditMetrics.jobsWithCredits === 1 ? "" : "s"} with supplier/warranty credits`,
      fix: "Tracked separately so credits improve profit without distorting Other costs.",
      cls: "ok",
    },
  ];

  const costShareRows = [
    { label: "Materials", value: materialShare, amount: materialTotal },
    { label: "Labor", value: laborShare, amount: laborTotal },
    { label: "Subs", value: subsShare, amount: subsTotal },
    { label: "Other", value: otherShare, amount: otherTotal },
  ];

  const openJobFromRow = (key: string) => {
    onOpenJob(key);
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
    <div className="scalePanel premiumScalePanel scaleInsanePanel">
      <div className="panelHead scaleControlHead premiumScaleHead">
        <div>
          <div className="panelTitle">Scale Profit Control Center</div>
          <div className="panelSub">
            Premium oversight for recoverable profit, high-risk jobs, benchmarks, and real-time email alerts.
          </div>
        </div>

        <div className="scaleHeadRight">
          <div className={`tag ${riskCls}`}>Scale active · {riskLevel}</div>
          <div className="alertStatusPill">
            <span className={fallbackMetrics.highRiskCount > 0 ? "alertDot hot" : "alertDot"} />
            {fallbackMetrics.highRiskCount} Active High-Risk Alert{fallbackMetrics.highRiskCount === 1 ? "" : "s"}
          </div>
          <div className="liveUpdatePill">Updated {updatedAtLabel}</div>
        </div>
      </div>

      <div className="scaleExecutiveGrid">
        <div className="scaleRecoveryCommand">
          <div className="scaleCommandAura" />
          <div className="scaleKicker">Recoverable Profit</div>
          <div className={recoverableOpportunity > 0 ? "scaleRecoveryValue warnText" : "scaleRecoveryValue pos"}>{fmtMoney(recoverableOpportunity)}</div>
          <div className="scaleRecoverySub">Estimated gap between current job profit and your {fmtPct(marginTarget)} target margin.</div>

          <div className="scaleRecoveryStats">
            <div><span>At-risk jobs</span><strong>{fallbackMetrics.highRiskCount}</strong></div>
            <div><span>Losing jobs</span><strong className={losingRows.length ? "neg" : "pos"}>{losingRows.length}</strong></div>
            <div><span>Monthly lift</span><strong>{fmtMoney(monthlyLift)}</strong></div>
            <div><span>Credits tracked</span><strong>{fmtMoney(creditMetrics.totalCredits)}</strong></div>
          </div>

          {topRecoverableJob ? (
            <button className="scaleTopOpportunity" type="button" onClick={() => openJobFromRow(topRecoverableJob.key)}>
              <span>Top opportunity</span>
              <strong>{topRecoverableJob.job.job_name || topRecoverableJob.job.job_id || "Review job"}</strong>
              <em>{fmtMoney(topRecoverableJob.gap)} gap</em>
            </button>
          ) : null}
        </div>

        <div className="scaleActionQueueCard">
          <div className="scaleCardHeadSplit">
            <div>
              <div className="scaleKicker">Action Queue</div>
              <div className="scaleQueueTitle">What to fix first</div>
            </div>
            <span className="tag">Ranked by impact</span>
          </div>

          <div className="scaleQueueList">
            {topActions.length ? (
              topActions.map((row, idx) => (
                <button className="scaleQueueItem" type="button" key={row.key} onClick={() => openJobFromRow(row.key)}>
                  <div className="scaleQueueRank">#{idx + 1}</div>
                  <div className="scaleQueueBody">
                    <div className="scaleQueueName">{row.job.job_name || row.job.job_id || "Unnamed job"}</div>
                    <div className="scaleQueueIssue">{row.issue}</div>
                    <div className="scaleQueueMeta">{row.driver?.label || "Margin"} driver · {row.status}</div>
                  </div>
                  <div className="scaleQueueImpact">{fmtMoney(row.gap)}</div>
                </button>
              ))
            ) : (
              <div className="wowEmpty">No immediate recoverable-profit actions in this range.</div>
            )}
          </div>
        </div>

        <div className="scaleBenchmarkCard">
          <div className="scaleCardHeadSplit">
            <div>
              <div className="scaleKicker">Basic Benchmarking</div>
              <div className="scaleQueueTitle">How this business is trending</div>
            </div>
          </div>

          <div className="scaleBenchmarkRows">
            {benchmarkCards.map((card) => (
              <div className="scaleBenchmarkRow" key={card.label}>
                <div>
                  <div className="scaleBenchmarkLabel">{card.label}</div>
                  <div className="scaleBenchmarkNote">{card.note}</div>
                </div>
                <strong className={card.cls}>{card.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="scaleIntelligenceStrip">
        <div className="scaleInsightNarrative">
          <div className="scaleKicker">Profit Intelligence</div>
          <div className="scaleInsightTitle">{summaryTitle}</div>
          <div className="scaleInsightText">{summaryCopy}</div>
          <div className="scaleInsightProgress">
            <div className="scaleInsightProgressTop">
              <span>Recovered vs. target gap</span>
              <strong>{recoverableOpportunity > 0 ? fmtPct(Math.max(0, 100 - (recoverableOpportunity / Math.max(1, totalRevenue * (marginTarget / 100))) * 100)) : "100.0%"}</strong>
            </div>
            <div className="scaleProgressTrack"><div className="scaleProgressFill" style={{ width: `${Math.max(6, Math.min(100, recoverableOpportunity > 0 ? 100 - (recoverableOpportunity / Math.max(1, totalRevenue * (marginTarget / 100))) * 100 : 100))}%` }} /></div>
          </div>
        </div>

        <div className="scaleCostRadar">
          <div className="scaleKicker">Cost Pressure Radar</div>
          <div className="costRadarRows">
            {costShareRows.map((row) => (
              <div className="costRadarRow" key={row.label}>
                <div className="costRadarTop"><span>{row.label}</span><strong>{fmtPct(row.value)}</strong></div>
                <div className="costRadarTrack"><div className="costRadarFill" style={{ width: `${Math.max(4, Math.min(100, row.value))}%` }} /></div>
                <div className="costRadarAmount">{fmtMoney(row.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="scalePremiumGrid">
        <div className="scaleCard scaleEmailCard enterpriseEmailCard premiumEmailCard">
          <div className="emailCardTop">
            <div>
              <div className="scaleKicker">Real-Time Email Alerts</div>
              <div className="emailAlertTitle">{emailAlertsEnabled ? "Email alerts are enabled" : "Email alerts are paused"}</div>
            </div>
            <button className="miniBtn" type="button" onClick={() => setIsEditingAlertEmails(!isEditingAlertEmails)}>
              {isEditingAlertEmails ? "Cancel" : "Edit emails"}
            </button>
          </div>
          <div className="scaleText">
            Send alerts to one person or a small team when a job loses money, falls below your margin target, or needs immediate review.
          </div>

          {isEditingAlertEmails ? (
            <div className="emailEditBox">
              <label className="emailEditLabel">Alert recipients</label>
              <textarea
                className="emailEditTextarea"
                value={alertEmailDraft}
                onChange={(e) => setAlertEmailDraft(e.target.value)}
                placeholder="owner@company.com, ops@company.com"
              />
              <div className="emailEditHelp">Separate multiple emails with commas, semicolons, or new lines.</div>
              <div className="emailEditActions">
                <button className="btn subtleSaveBtn" type="button" onClick={saveAlertEmailDraft}>Save email list</button>
                <button className="btn" type="button" onClick={() => { setAlertEmailDraft(normalizedAlertEmails.join(", ")); setIsEditingAlertEmails(false); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="emailRecipientList">
              <div className="emailRecipientLabel">Alert recipients</div>
              {normalizedAlertEmails.length ? normalizedAlertEmails.map((email) => (
                <span className="emailRecipientPill" key={email}>{email}</span>
              )) : <span className="emailRecipientPill muted">No recipients set</span>}
            </div>
          )}

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
            className={emailAlertsEnabled ? "emailPauseLink" : "btn subtleSaveBtn"}
            type="button"
            onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
          >
            {emailAlertsEnabled ? "Pause Email Alerts" : "Enable Email Alerts"}
          </button>
        </div>

        <div className="scaleCard premiumLeakCard">
          <div className="scaleKicker">Where Money Is Leaking</div>
          <div className="premiumLeakList">
            {leakRows.map((leak) => (
              <div className="premiumLeakRow" key={leak.label}>
                <div className="premiumLeakTop">
                  <div>
                    <div className="premiumLeakName">{leak.label}</div>
                    <div className="premiumLeakMeta">{leak.meta}</div>
                  </div>
                  <div className={`premiumLeakAmount ${leak.cls}`}>{fmtMoney(leak.amount)}</div>
                </div>
                <div className="premiumLeakFix">{leak.fix}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="scaleCard alertsExplainerCard premiumRulesCard">
          <div className="scaleKicker">Alert Rules</div>
          <div className="ruleList">
            <div><b>Critical</b><span>Profit is below $0.</span></div>
            <div><b>High risk</b><span>Margin is below your {fmtPct(marginTarget)} target.</span></div>
            <div><b>Email</b><span>Send immediately when a new critical alert is detected.</span></div>
          </div>
          <button className="btn subtlePrimaryBtn premiumReviewBtn" type="button" onClick={onOpenHighRisk}>Review High-Risk Jobs</button>
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
  alertEmails,
  setAlertEmails,
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
  alertEmails: string[];
  setAlertEmails: (emails: string[]) => void;
}) {
  const jobs = getAllJobs(state);
  const insights = Array.isArray(state.insights) ? state.insights : [];

  return (
    <>
      <ProfitLeakSnapshot state={state} marginTarget={marginTarget} onOpenHighRisk={onOpenHighRisk} />
      <Kpis state={state} />
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
        alertEmails={alertEmails}
        setAlertEmails={setAlertEmails}
        onOpenJob={(key: string) => {
          setJobKey(key);
          setView("job");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenHighRisk={onOpenHighRisk}
      />

      <ChartsPanel state={state} view={view} />
      <CreditRefundKpis state={state} />

      <div className="grid">
        <div className="mainCol">
          <JobsLog
            jobs={jobs}
            onOpenAllJobs={() => {
              setView("alljobs");
              setJobKey("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
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
  getToken,
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
  getToken?: () => Promise<string | null>;
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
  const creditsApplied = getJobCreditTotal(base);
  const knownCosts = parseNumberLoose(job.material_cost) + parseNumberLoose(job.labor_cost) + parseNumberLoose(job.subs_cost) + parseNumberLoose(job.other_cost) + customTotal - creditsApplied;
  const gp = parseNumberLoose(job.revenue) - knownCosts;
  const gm = parseNumberLoose(job.revenue) !== 0 ? (gp / parseNumberLoose(job.revenue)) * 100 : 0;
  const comparison = jobComparisonStats(base || {}, getAllJobs(state));
  const topDriver = comparison.drivers[0];
  const targetProfit = parseNumberLoose(job.revenue) * (marginTarget / 100);
  const recoverableGap = Math.max(0, targetProfit - gp);
  const decisionTitle =
    gp < 0
      ? `This job is losing ${fmtMoney(Math.abs(gp))}`
      : gm < marginTarget
      ? `This job is ${fmtPct(marginTarget - gm)} below target`
      : `This job is performing above target`;
  const decisionSub =
    gp < 0
      ? `${topDriver?.label || "Costs"} appears to be the biggest pressure point. Review the editable cost buckets below before quoting similar work.`
      : gm < marginTarget
      ? `Current margin is ${fmtPct(gm)} against your ${fmtPct(marginTarget)} target, leaving ${fmtMoney(recoverableGap)} of recoverable profit gap.`
      : `Current margin is ${fmtPct(gm)} against your ${fmtPct(marginTarget)} target. Keep this job as a reference for similar work.`;

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

  const save = async () => {
    if (!access.canSaveJobEdits) {
      handleLocked("Saving job edits", "Core");
      return;
    }

    saveJobEdit(jobKey, job, userId);

    try {
      const token = getToken ? await getToken() : null;
      await apiSaveJobNotes(token, {
        jobDbId: base?.id || null,
        reportId: base?.report_id || null,
        jobId: job.job_id || base?.job_id || null,
        jobName: job.job_name || base?.job_name || null,
        notes: job.notes || "",
      });
    } catch (err) {
      console.error("Failed to save job notes", err);
    }

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
        <div className="jobHero decisionJobHero">
          <div className="crumbs">
            <div className="crumb">Profitability Dashboard</div>
            <div className="crumb">Job Detail</div>
            <div className="crumb">{job.job_id || job.job_name || "—"}</div>
            <button className="crumbBtn dashboardBackBtn" type="button" onClick={onBack}>← Back to dashboard</button>
            <button className="crumbBtn secondary" type="button" onClick={onAllJobs}>View all jobs</button>
          </div>

          <div className="jobHeroBody decisionJobHeroBody">
            <div className="decisionJobMain">
              <div className="sectionEyebrow">Single Job Review</div>
              <div className="jobHeroTitle decisionJobTitle">{decisionTitle}</div>
              <div className="jobHeroSub decisionJobSub">{decisionSub}</div>
              <div className="heroBadges">
                <span className={`tag ${health.status}`}>{health.label}</span>
                <span className="tag ok">{health.confidence}</span>
                <span className="tag">{hasHistory ? `${history.length} periods` : "Single period"}</span>
                {topDriver ? <span className="tag">Top driver: {topDriver.label}</span> : null}
                {job.job_type ? <span className="tag">{job.job_type}</span> : null}
              </div>
            </div>

            <div className="jobSummaryCard decisionSummaryCard">
              <div className="kv"><span>Profit Impact</span><strong className={gp < 0 ? "neg" : "pos"}>{fmtMoney(gp)}</strong></div>
              <div className="kv"><span>Margin vs Target</span><strong className={gm < marginTarget ? "neg" : "pos"}>{fmtPct(gm)} / {fmtPct(marginTarget)}</strong></div>
              <div className="kv"><span>Recoverable Gap</span><strong className={recoverableGap > 0 ? "warnText" : "pos"}>{fmtMoney(recoverableGap)}</strong></div>
              <div className="divider" />
              <div className="kv"><span>Revenue</span><strong>{fmtMoney(job.revenue)}</strong></div>
              <div className="kv"><span>Known Costs</span><strong>{fmtMoney(knownCosts)}</strong></div>
              <div className="kv"><span>Credits Applied</span><strong className="creditText">{fmtMoney(getJobCreditTotal(base))}</strong></div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={showBack ? "jobPage" : "jobPage stackedJobPage"}>
        {showBack ? (
          <>
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
          </>
        ) : null}

        <div className="panel jobDetailFocus">
          {showBack ? (
            <div className="panelHead">
              <div><div className="panelTitle">Job detail</div><div className="panelSub">Edit job info, cost buckets, notes, and manual categories.</div></div>
              <div className="buttonRow">
                <button
    className="btn subtleSaveBtn"
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
          ) : (
            <div className="stackedJobActions">
              <div className="stackedJobActionHint">Editable row</div>
              <div className="buttonRow">
                <button
                  className="btn subtleSaveBtn"
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
          )}

          <div className="pad jobDetailPad">
            <table className="jobTable">
              <thead>
                <tr>
                  <th>Job ID</th><th>Job Name</th><th>Type</th><th>Address</th><th>Date</th><th>Revenue</th><th>Labor</th><th>Materials</th><th>Subs</th><th>Other Costs</th><th>Gross Profit</th><th>Margin</th>
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

            {showBack ? (
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
            ) : null}
          </div>
        </div>

        {showBack ? (
        <div className="jobCharts">
          <div className="chartCard"><div className="chartHead"><div><div className="chartTitle">Gross Profit Trend</div><div className="chartSub">By period for this job</div></div></div>{hasHistory ? <canvas ref={profitRef} width={520} height={220} /> : <div className="trendEmpty">Upload this job in another period to show trends.</div>}</div>
          <div className="chartCard"><div className="chartHead"><div><div className="chartTitle">Revenue vs Costs</div><div className="chartSub">For this job only</div></div></div>{hasHistory ? <canvas ref={revCostRef} width={520} height={220} /> : <div className="trendEmpty">More periods for this job will unlock this chart.</div>}</div>
          <div className="chartCard wide"><div className="chartHead"><div><div className="chartTitle">Margin Trend</div><div className="chartSub">Gross margin % by period</div></div></div>{hasHistory ? <canvas ref={marginRef} width={520} height={220} /> : <div className="trendEmpty">Margin history appears after multiple periods.</div>}</div>
        </div>
        ) : null}
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
  getToken,
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
  getToken?: () => Promise<string | null>;
}) {
  const base = findJobByKey(state, jobKey);

  if (!base) {
    return (
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="crumbs"><div className="crumb">View: <strong>Job Detail</strong></div><button className="crumbBtn dashboardBackBtn" type="button" onClick={() => { setView("dashboard"); setJobKey(""); }}>← Back to dashboard</button></div>
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
      getToken={getToken}
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
  getToken,
}: {
  state: DashboardState;
  setView: (v: ViewMode) => void;
  setJobKey: (v: string) => void;
  refreshLocal: () => void;
  userId: string;
  access: PlanAccess;
  onLocked: (feature: string, requiredPlan: string) => void;
  getToken?: () => Promise<string | null>;
}) {
  const jobs = getAllJobs(state);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs
      .map((job, idx) => ({ job, idx, key: buildJobKey(job, idx) }))
      .filter(({ job }) => !q || `${job.job_name || ""} ${job.job_id || ""}`.toLowerCase().includes(q));
  }, [jobs, search]);

  const allJobsTotals = useMemo(() => {
    const edits = readEdits(userId);
    const revenue = filtered.reduce((sum, row) => sum + parseNumberLoose(row.job.revenue), 0);
    const costs = filtered.reduce((sum, row) => sum + parseNumberLoose(row.job.costs), 0);
    const profit = filtered.reduce((sum, row) => {
      const rowRevenue = parseNumberLoose(row.job.revenue);
      const rowCosts = parseNumberLoose(row.job.costs);
      const rowProfit = parseNumberLoose(row.job.profit);
      return sum + (Number.isFinite(rowProfit) ? rowProfit : rowRevenue - rowCosts);
    }, 0);
    const credits = filtered.reduce((sum, row) => sum + getJobCreditTotal(row.job), 0);
    const manualCategories = filtered.reduce((sum, row) => {
      const edit = edits[String(row.key)] || {};
      const custom = Array.isArray(edit.custom_categories) ? edit.custom_categories : [];
      return sum + custom.length;
    }, 0);

    return {
      revenue,
      costs,
      profit,
      margin: revenue !== 0 ? (profit / revenue) * 100 : 0,
      credits,
      manualCategories,
    };
  }, [filtered, userId]);

  const visibleJobsState = useMemo<DashboardState>(() => ({
    ...state,
    all_jobs: filtered.map((row) => row.job),
  }), [state, filtered]);

  return (
    <div className="panel allJobsDetailShell cleanModeShell" style={{ marginTop: 12 }}>
      <div className="modeContextHeader allJobsModeHeader">
        <div>
          <div className="modeEyebrow">Profitability Dashboard</div>
          <div className="modeTitle">All Jobs</div>
          <div className="modeSub">Bulk editing view — adjust job IDs, names, costs, notes, and categories without opening every job one by one.</div>
        </div>
        <div className="modeHeaderActions">
          <div className="modeCount"><strong>{String(filtered.length)}</strong><span>jobs shown</span></div>
          <button
            className="crumbBtn dashboardBackBtn"
            type="button"
            onClick={() => { setView("dashboard"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            ← Back to dashboard
          </button>
        </div>
      </div>

      <div className="pad allJobsToolbarPad cleanModeToolbar">
        <input
          className="searchInput wideSearch"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs before expanding details..."
        />
        <button
          className="btn"
          type="button"
          onClick={() => access.canExport ? exportAllJobsCsv(visibleJobsState) : onLocked("CSV exports", "Core")}
        >
          {access.canExport ? "Export Visible Jobs CSV" : "Export Visible Jobs CSV 🔒"}
        </button>
      </div>

      <div className="pad allJobsSubtotalPad">
        <div className="jobStats allJobsSubtotalGrid">
          <div className="stat">
            <div className="statLabel">Gross Profit</div>
            <div className={`statValue ${allJobsTotals.profit < 0 ? "neg" : "pos"}`}>{fmtMoney(allJobsTotals.profit)}</div>
            <div className="statSub">Combined visible jobs.</div>
          </div>
          <div className="stat">
            <div className="statLabel">Gross Margin</div>
            <div className={`statValue ${allJobsTotals.margin < 0 ? "neg" : "pos"}`}>{fmtPct(allJobsTotals.margin)}</div>
            <div className="statSub">Based on visible jobs.</div>
          </div>
          <div className="stat">
            <div className="statLabel">Revenue</div>
            <div className="statValue">{fmtMoney(allJobsTotals.revenue)}</div>
            <div className="statSub">Visible job revenue.</div>
          </div>
          <div className="stat">
            <div className="statLabel">Known Costs</div>
            <div className="statValue">{fmtMoney(allJobsTotals.costs)}</div>
            <div className="statSub">Visible job costs.</div>
          </div>
          <div className="stat">
            <div className="statLabel">Credits Applied</div>
            <div className="statValue creditText">{fmtMoney(allJobsTotals.credits)}</div>
            <div className="statSub">Credits across visible jobs.</div>
          </div>
          <div className="stat">
            <div className="statLabel">Manual Categories</div>
            <div className="statValue">{allJobsTotals.manualCategories}</div>
            <div className="statSub">Saved local custom rows.</div>
          </div>
        </div>
      </div>

      <div className="pad allJobsStackPad">
        {filtered.length ? (
          <div className="allJobsStack">
            {filtered.map(({ job, key }, index) => (
              <div key={key} className="allJobsStackItem">
                <div className="allJobsStackItemHead compactJobStackHeader">
                  <div>
                    <div className="allJobsStackJobName">{job.job_name || job.job_id || `Job ${index + 1}`}</div>
                    <div className="allJobsStackJobMeta">Job ID: {job.job_id || "No Job ID"} • {job.period_label || "Saved report"} • {dateLabel(job.created_at)}</div>
                  </div>
                  <button
                    className="miniBtn compactFullViewBtn"
                    type="button"
                    onClick={() => { setJobKey(key); setView("job"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    Full view
                  </button>
                </div>
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
                  getToken={getToken}
                />
              </div>
            ))}
          </div>
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
  const [sort, setSort] = useState<"impact" | "loss" | "margin" | "revenue">("impact");

  const riskRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = jobs
      .map((job, idx) => {
        const revenue = parseNumberLoose(job.revenue);
        const costs = parseNumberLoose(job.costs);
        const profit = parseNumberLoose(job.profit);
        const margin = parseNumberLoose(job.margin_pct);
        const targetProfit = revenue * (marginTarget / 100);
        const recoverable = Math.max(0, targetProfit - profit);
        const comparison = jobComparisonStats(job, jobs);
        const driver = comparison.drivers[0];
        const status = profit < 0 ? "Critical loss" : "Below target";
        const key = buildJobKey(job, idx);
        return { job, idx, key, revenue, costs, profit, margin, targetProfit, recoverable, comparison, driver, status };
      })
      .filter((row) => row.profit < 0 || row.margin < marginTarget)
      .filter((row) => !q || `${row.job.job_name || ""} ${row.job.job_id || ""} ${row.status}`.toLowerCase().includes(q));

    rows.sort((a, b) => {
      if (sort === "loss") return a.profit - b.profit;
      if (sort === "margin") return a.margin - b.margin;
      if (sort === "revenue") return b.revenue - a.revenue;
      return b.recoverable - a.recoverable || a.profit - b.profit;
    });

    return rows;
  }, [jobs, marginTarget, search, sort]);

  const totalRecoverable = riskRows.reduce((sum, row) => sum + row.recoverable, 0);
  const losingCount = riskRows.filter((row) => row.profit < 0).length;
  const thinCount = Math.max(0, riskRows.length - losingCount);
  const totalAtRiskRevenue = riskRows.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <div className="highRiskPage enterpriseRiskPage">
      <div className="highRiskHero panel cleanModeShell">
        <div className="modeContextHeader riskModeHeader">
          <div>
            <div className="modeEyebrow">Profitability Dashboard</div>
            <div className="modeTitle">High-Risk Jobs</div>
            <div className="modeSub">Jobs below your {fmtPct(marginTarget)} margin target ranked by recoverable profit, with the reason each job was flagged.</div>
          </div>
          <div className="modeHeaderActions">
            <div className="modeCount"><strong>{String(riskRows.length)}</strong><span>below target</span></div>
            <button className="crumbBtn dashboardBackBtn" type="button" onClick={() => { setView("dashboard"); setJobKey(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Back to dashboard</button>
          </div>
        </div>

        <div className="riskCommandHero">
          <div>
            <div className="sectionEyebrow">High-Risk Job Review</div>
            <div className="riskCommandTitle">These jobs are costing you the most.</div>
            <div className="riskCommandSub">
              Use this triage list to see what is wrong, how much profit is recoverable, and which job to open first.
            </div>
          </div>
          <div className="riskSearchControls">
            <input className="searchInput" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search high-risk jobs..." />
            <select className="selectInput" value={sort} onChange={(e) => setSort(e.target.value as "impact" | "loss" | "margin" | "revenue")}>
              <option value="impact">Highest recoverable</option>
              <option value="loss">Worst loss</option>
              <option value="margin">Lowest margin</option>
              <option value="revenue">Highest revenue</option>
            </select>
          </div>
        </div>

        <div className="riskSummaryGrid">
          <div className="riskSummaryCard"><span>Recoverable Profit</span><strong>{fmtMoney(totalRecoverable)}</strong><em>Gap to {fmtPct(marginTarget)} target</em></div>
          <div className="riskSummaryCard"><span>Losing Jobs</span><strong className={losingCount ? "neg" : "pos"}>{losingCount}</strong><em>Below breakeven</em></div>
          <div className="riskSummaryCard"><span>Thin-Margin Jobs</span><strong>{thinCount}</strong><em>Positive but below target</em></div>
          <div className="riskSummaryCard"><span>At-Risk Revenue</span><strong>{fmtMoney(totalAtRiskRevenue)}</strong><em>Revenue tied to flagged jobs</em></div>
        </div>
      </div>

      <div className="riskTablePanel panel">
        <div className="panelHead responsiveHead">
          <div>
            <div className="panelTitle">High-Risk Job Queue</div>
            <div className="panelSub">One row per job. Open the full editor only when the user needs to investigate or adjust the job.</div>
          </div>
          <button className="btn" type="button" onClick={() => downloadCsv("dropclarity-high-risk-jobs.csv", [["Job", "Job ID", "Revenue", "Costs", "Profit", "Margin %", "Recoverable Profit", "Top Driver", "Status"], ...riskRows.map((row) => [row.job.job_name || "", row.job.job_id || "", row.revenue, row.costs, row.profit, row.margin, row.recoverable, row.driver?.label || "", row.status])])}>
            Export High-Risk CSV
          </button>
        </div>

        <div className="riskQueueList">
          {riskRows.length ? riskRows.map((row, index) => {
            const isLoss = row.profit < 0;
            const driverLabel = row.driver?.label || "Margin";
            const driverGap = row.driver ? row.driver.gap : 0;
            const marginGap = Math.max(0, marginTarget - row.margin);
            const issue = isLoss
              ? `${driverLabel} appears to be the main pressure point and this job is below breakeven.`
              : `${driverLabel} is pressuring margin; this job is ${marginGap.toFixed(1)} pts below target.`;

            return (
              <div className={isLoss ? "riskQueueCard critical" : "riskQueueCard warning"} key={row.key}>
                <div className="riskRank">#{index + 1}</div>
                <div className="riskMain">
                  <div className="riskTitleRow">
                    <div>
                      <div className="riskJobName">{row.job.job_name || row.job.job_id || "Unnamed job"}</div>
                      <div className="riskJobMeta">{row.job.job_id || "No Job ID"} • {dateLabel(row.job.created_at)} • {row.job.period_label || "Saved report"}</div>
                    </div>
                    <span className={isLoss ? "tag bad" : "tag warn"}>{row.status}</span>
                  </div>

                  <div className="riskMetricGrid">
                    <div><span>Profit</span><strong className={row.profit < 0 ? "neg" : "pos"}>{fmtMoney(row.profit)}</strong></div>
                    <div><span>Margin</span><strong className={row.margin < marginTarget ? "neg" : "pos"}>{fmtPct(row.margin)}</strong></div>
                    <div><span>Recoverable</span><strong>{fmtMoney(row.recoverable)}</strong></div>
                    <div><span>Top Driver</span><strong>{driverLabel}</strong></div>
                  </div>

                  <div className="riskInsightBox">
                    <strong>Why it is flagged:</strong> {issue}
                    {row.driver ? <span> Current {driverLabel.toLowerCase()}: {fmtMoney(row.driver.current)} vs benchmark {fmtMoney(row.driver.average)}.</span> : null}
                  </div>
                </div>

                <div className="riskActions">
                  <button className="btn subtleSaveBtn" type="button" onClick={() => { setJobKey(row.key); setView("job"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Open Job Detail
                  </button>
                  <button className="btn" type="button" onClick={() => { setJobKey(row.key); setView("alljobs"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    View All Jobs
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="empty">No high-risk jobs match this view.</div>
          )}
        </div>
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
          <button className="crumbBtn dashboardBackBtn" type="button" onClick={onBack}>← Back to dashboard</button>
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
  const [alertEmails, setAlertEmailsState] = useState<string[]>([]);
  const suppressNextHistorySyncRef = useRef(false);
  const lastDashboardHistoryKeyRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initial = readDashboardHistoryState();
    const currentHistoryState = window.history.state || {};

    window.history.replaceState(
      {
        ...currentHistoryState,
        dcDashboard: true,
        dcView: initial.view,
        dcJobKey: initial.jobKey,
      },
      "",
      buildDashboardHistoryUrl(initial.view, initial.jobKey)
    );

    suppressNextHistorySyncRef.current = true;
    setView(initial.view);
    setJobKey(initial.jobKey);
    lastDashboardHistoryKeyRef.current = `${initial.view}|${initial.jobKey}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      const historyState = event.state || {};

      if (!historyState.dcDashboard) return;

      const nextView = (historyState.dcView || "dashboard") as ViewMode;
      const nextJobKey = String(historyState.dcJobKey || "");

      suppressNextHistorySyncRef.current = true;
      lastDashboardHistoryKeyRef.current = `${nextView}|${nextJobKey}`;
      setView(nextView);
      setJobKey(nextJobKey);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextKey = `${view}|${jobKey}`;

    if (suppressNextHistorySyncRef.current) {
      suppressNextHistorySyncRef.current = false;
      lastDashboardHistoryKeyRef.current = nextKey;
      return;
    }

    if (lastDashboardHistoryKeyRef.current === nextKey) return;

    const nextHistoryState = {
      ...(window.history.state || {}),
      dcDashboard: true,
      dcView: view,
      dcJobKey: jobKey || "",
    };

    const nextUrl = buildDashboardHistoryUrl(view, jobKey);

    if (view === "dashboard") {
      window.history.replaceState(nextHistoryState, "", nextUrl);
    } else {
      window.history.pushState(nextHistoryState, "", nextUrl);
    }

    lastDashboardHistoryKeyRef.current = nextKey;
  }, [view, jobKey]);

  const loadAndRender = useCallback(async (options?: { background?: boolean }) => {
    if (!isLoaded) return;

    const background = options?.background === true;

    if (!isSignedIn) {
      setMode("error");
      setError("Please sign in to view your dashboard.");
      return;
    }

    try {
      if (!background) {
        setMode("loading");
      }
      setError("");

      const token = await getToken();
      const data = await apiGetDashboard(token, range, customFrom, customTo);

      let scaleData: ScaleSummary | null = null;
      try {
        scaleData = await apiGetScaleSummary(token);
      } catch (scaleError) {
        console.error("Failed to load Scale summary", scaleError);
      }

      const nextState = { ...(data || {}), range };

      setState(nextState);
      setScaleSummary(scaleData);
      writeDashboardCache(USER_ID, range, customFrom, customTo, nextState, scaleData);
      setMode("ready");
    } catch (e: unknown) {
      if (background) {
        console.error("Background dashboard refresh failed", e);
        return;
      }

      setMode("error");
      setError(e instanceof Error ? e.message : String(e));
      console.error(e);
    }
  }, [USER_ID, isLoaded, isSignedIn, getToken, range, customFrom, customTo]);

useEffect(() => {
  if (!isLoaded) return;

  const savedTarget = readMarginTarget(USER_ID);
  setMarginTarget(savedTarget);
  setMarginTargetDraft(String(savedTarget));
  setEmailAlertsEnabledState(readEmailAlertsEnabled(USER_ID));
  setAlertEmailsState(readAlertEmails(USER_ID, user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null));
  setDeletedReportKeys(readDeletedReports(USER_ID));

  const cached = readDashboardCache(USER_ID, range, customFrom, customTo);
  if (cached?.state) {
    setState({ ...(cached.state || {}), range });
    setScaleSummary(cached.scaleSummary || null);
    setMode("ready");
    setError("");
    loadAndRender({ background: true });
  } else {
    loadAndRender();
  }
}, [USER_ID, isLoaded, loadAndRender, range, customFrom, customTo, user?.primaryEmailAddress?.emailAddress, user?.emailAddresses]);

  const saveMarginTarget = async () => {
    const next = Math.max(1, Math.min(95, parseNumberLoose(marginTargetDraft)));

    setMarginTarget(next);
    setMarginTargetDraft(String(next));
    writeMarginTarget(USER_ID, next);

    try {
      const token = await getToken();
      const fallbackEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
      const normalizedEmails = normalizeEmailList(alertEmails, fallbackEmail);

      const res = await fetch(`${API_BASE}/alert-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          marginTargetPct: next,
          emailAlertsEnabled,
          scaleAlertEmails: normalizedEmails,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `Failed to save alert settings (${res.status})`);
    } catch (err) {
      console.error("Failed to save margin target to alert settings", err);
    }
  };

  const setEmailAlertsEnabled = (enabled: boolean) => {
    setEmailAlertsEnabledState(enabled);
    writeEmailAlertsEnabled(USER_ID, enabled);
  };

  const setAlertEmails = (emails: string[]) => {
    const fallbackEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
    const next = normalizeEmailList(emails, fallbackEmail);
    setAlertEmailsState(next);
    writeAlertEmails(USER_ID, next, fallbackEmail);
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
            <div className="pad"><div className="error">{error}</div><div style={{ marginTop: 12 }}><button className="btn" type="button" onClick={() => loadAndRender()}>Retry</button></div></div>
          </div>
        ) : (
          <>
            <TopBar
  state={visibleState}
  mode={mode}
  onRefresh={() => loadAndRender()}
  plan={plan}
  marginTarget={marginTarget}
  marginTargetDraft={marginTargetDraft}
  setMarginTargetDraft={setMarginTargetDraft}
  onSaveMarginTarget={saveMarginTarget}
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


            {view === "job" && jobKey ? (
              <JobView state={visibleState} jobKey={jobKey} setView={setView} setJobKey={setJobKey} refreshLocal={refreshLocal} userId={USER_ID} access={access} onLocked={openUpgradePrompt} marginTarget={marginTarget} getToken={getToken} />
            ) : view === "alljobs" ? (
              <AllJobsView state={visibleState} setView={setView} setJobKey={setJobKey} refreshLocal={refreshLocal} userId={USER_ID} access={access} onLocked={openUpgradePrompt} getToken={getToken} />
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
                onRefresh={() => loadAndRender()}
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
  alertEmails={alertEmails}
  setAlertEmails={setAlertEmails}
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
.dc-bg *{box-sizing:border-box}
.dc-bg, .dc-bg{background:#fff!important;color:#0f172a!important}
.dc-bg{width:100%;min-height:100vh;padding:58px 0 34px;background:radial-gradient(1100px 520px at 10% -10%,rgba(124,58,237,.12),transparent 58%),radial-gradient(900px 520px at 92% 0%,rgba(34,211,238,.12),transparent 62%),radial-gradient(820px 520px at 50% 110%,rgba(52,211,153,.09),transparent 70%),linear-gradient(180deg,#fff,#fff);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0f172a!important}
.dc-bg .wrap{width:min(1920px,calc(100vw - 20px));max-width:1920px;margin:0 auto;padding:0 10px}.dc-bg .topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:18px}.dc-bg .dashboardIntro{max-width:920px}.dc-bg .statusRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.dc-bg .pageKicker{width:fit-content;margin-bottom:12px;border:1px solid rgba(34,211,238,.28);background:rgba(255,255,255,.86);box-shadow:0 10px 28px rgba(34,211,238,.10);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:950;color:rgba(8,145,178,.95)}.dc-bg .pageTitle{margin:0;max-width:900px;font-size:42px;line-height:1.04;font-weight:990;letter-spacing:-.045em;color:rgba(2,6,23,.96)}.dc-bg .gradText{background:linear-gradient(90deg,#06b6d4,#8b5cf6,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent}.dc-bg .pageSub{margin-top:10px;max-width:820px;color:rgba(51,65,85,.82);font-size:16px;line-height:1.55;font-weight:750}.dc-bg .pill{display:inline-flex;align-items:center;gap:10px;padding:10px 12px;border-radius:999px;border:1px solid var(--line2);background:rgba(255,255,255,.84);backdrop-filter:blur(10px);box-shadow:0 10px 28px rgba(2,6,23,.08);font-weight:900;font-size:12.5px;color:rgba(15,23,42,.82);user-select:none;white-space:nowrap}.dc-bg .pill.health.ok{color:rgba(5,150,105,.95)}.dc-bg .pill.health.warn{color:rgba(180,83,9,.95)}.dc-bg .pill.health.bad{color:rgba(220,38,38,.95)}.dc-bg .dot{width:10px;height:10px;border-radius:999px}.dc-bg .spinner{width:14px;height:14px;border-radius:999px;border:2px solid rgba(15,23,42,.14);border-top-color:rgba(124,58,237,.95);animation:spin .75s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.dc-bg .planBadge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:900;color:rgba(15,23,42,.55);background:rgba(255,255,255,.65);border:1px solid rgba(15,23,42,.08);backdrop-filter:blur(8px);box-shadow:0 8px 22px rgba(2,6,23,.05);white-space:nowrap}
.dc-bg .planDot{width:6px;height:6px;border-radius:999px;background:linear-gradient(135deg,#7C3AED,#22D3EE);box-shadow:0 0 8px rgba(124,58,237,.6)}
.dc-bg .btn{padding:11px 14px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.85);color:rgba(15,23,42,.90);font-weight:900;font-size:13px;cursor:pointer;transition:transform .08s ease,box-shadow .12s ease,background .12s ease,border-color .12s ease;text-decoration:none;display:inline-flex;align-items:center;gap:8px}.dc-bg .btn:hover{transform:translateY(-1px);box-shadow:0 14px 34px rgba(2,6,23,.10);border-color:rgba(34,211,238,.25)}.dc-bg .btn-primary{background:linear-gradient(90deg,rgba(34,211,238,.20),rgba(124,58,237,.20));border-color:rgba(34,211,238,.28)}.dc-bg .btn-mini{padding:8px 11px;border-radius:12px;border:1px solid var(--line2);background:rgba(255,255,255,.86);color:rgba(15,23,42,.88);font-weight:900;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}.dc-bg .btn-danger{border-color:rgba(239,68,68,.18);color:rgba(185,28,28,.96);background:rgba(239,68,68,.08)}.dc-bg .buttonRow{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.dc-bg .rangeWrap{margin:16px 0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;border-radius:22px;border:1px solid var(--line2);background:rgba(255,255,255,.82);box-shadow:0 14px 44px rgba(2,6,23,.07);padding:12px 14px}.dc-bg .rangeLabel{font-weight:950;color:#0f172a}.dc-bg .rangeSub{margin-top:3px;color:rgba(15,23,42,.55);font-weight:750;font-size:12.5px}.dc-bg .rangeRight{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:flex-end}.dc-bg .rangeButtons{display:flex;flex-wrap:wrap;gap:8px}.dc-bg .rangeBtn{border:1px solid var(--line);background:#fff;border-radius:999px;padding:10px 13px;font-weight:950;font-size:13px;color:rgba(15,23,42,.74);cursor:pointer}.dc-bg .rangeBtn.active{background:#0f172a;color:#fff;border-color:#0f172a;box-shadow:0 14px 34px rgba(15,23,42,.16)}.dc-bg .customDates{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.dc-bg .customDates input, .dc-bg .searchInput, .dc-bg .selectInput{border:1px solid var(--line);background:#fff;border-radius:14px;padding:11px 12px;font-weight:850;color:#0f172a;outline:none}.dc-bg .wideSearch{width:100%}
.dc-bg .panel{border-radius:var(--radius);border:1px solid var(--line2);background:var(--panel);backdrop-filter:blur(14px);box-shadow:var(--shadow);overflow:hidden}.dc-bg .panelHead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px 14px 12px;border-bottom:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.70))}.dc-bg .panelTitle{font-weight:950;letter-spacing:-.02em;color:rgba(15,23,42,.94);font-size:18px}.dc-bg .panelSub{margin-top:4px;color:var(--muted2);font-size:13px;line-height:1.4;font-weight:750}.dc-bg .grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(340px,.68fr);gap:14px;margin-top:12px;width:100%}.dc-bg .mainCol, .dc-bg .sideStack{display:flex;flex-direction:column;gap:14px}.dc-bg .pad{padding:14px}.dc-bg .hero, .dc-bg .jobHero{border-radius:22px;border:1px solid var(--line2);background:rgba(255,255,255,.86);box-shadow:0 18px 60px rgba(2,6,23,.08);overflow:hidden;margin-top:12px}.dc-bg .heroBody, .dc-bg .jobHeroBody{padding:16px 16px 14px;display:grid;grid-template-columns:1.15fr .85fr;gap:12px}.dc-bg .heroTitle, .dc-bg .jobHeroTitle{font-size:30px;line-height:1.05;font-weight:980;letter-spacing:-.03em;color:rgba(15,23,42,.94)}.dc-bg .heroSub, .dc-bg .jobHeroSub{margin-top:8px;font-size:15px;line-height:1.5;color:rgba(15,23,42,.64);font-weight:750;max-width:740px}.dc-bg .heroBadges{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}.dc-bg .summaryCard, .dc-bg .jobSummaryCard{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.86);padding:12px;display:flex;flex-direction:column;gap:10px}.dc-bg .kv{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;font-size:14px;font-weight:850;color:rgba(15,23,42,.70)}.dc-bg .kv strong{color:rgba(15,23,42,.94)}.dc-bg .divider{height:1px;background:rgba(15,23,42,.06);margin:4px 0 2px}
.dc-bg .kpis{padding:14px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.dc-bg .kpi, .dc-bg .stat{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.84);box-shadow:0 14px 40px rgba(2,6,23,.06);padding:12px}.dc-bg .kLabel, .dc-bg .statLabel{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:rgba(15,23,42,.52);font-weight:900}.dc-bg .kValue, .dc-bg .statValue{margin-top:7px;font-weight:980;font-size:22px;letter-spacing:-.02em;color:rgba(15,23,42,.90)}.dc-bg .kSub, .dc-bg .statSub{margin-top:7px;font-size:13px;line-height:1.35;color:rgba(15,23,42,.58);font-weight:760}.dc-bg .pos{color:rgba(5,150,105,.95)!important}.dc-bg .neg{color:rgba(220,38,38,.95)!important}.dc-bg .strong{font-weight:950}.dc-bg .charts, .dc-bg .jobCharts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.dc-bg .jobCharts{gap:12px}.dc-bg .chartCard{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.82);padding:12px;overflow:hidden;box-shadow:0 12px 38px rgba(2,6,23,.055)}.dc-bg .chartCard.wide{grid-column:1/-1}.dc-bg .chartHead{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:8px}.dc-bg .chartTitle{font-weight:950;letter-spacing:-.01em;color:rgba(15,23,42,.92);font-size:17px}.dc-bg .chartSub{color:rgba(15,23,42,.55);font-size:13px;font-weight:750}.dc-bg canvas{width:100%;height:auto;display:block}.dc-bg .trendEmpty{border-radius:18px;border:1px dashed rgba(15,23,42,.14);background:rgba(255,255,255,.55);padding:16px;color:rgba(15,23,42,.72);font-weight:850;font-size:14px;line-height:1.45}.dc-bg .mixList{display:flex;flex-direction:column;gap:14px}.dc-bg .gridMix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.dc-bg .mixRow{border:1px solid var(--line2);background:rgba(255,255,255,.82);border-radius:16px;padding:12px}.dc-bg .mixTop{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:rgba(15,23,42,.72);font-weight:850}.dc-bg .sw{display:inline-block;width:10px;height:10px;border-radius:4px;margin-right:7px}.dc-bg .barTrack{height:8px;border-radius:999px;background:rgba(15,23,42,.06);overflow:hidden;margin-top:8px}.dc-bg .barFill{height:100%;border-radius:999px}.dc-bg .mixSub{margin-top:6px;color:rgba(15,23,42,.52);font-size:12px;font-weight:750}
.dc-bg .tableTools{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.dc-bg .searchInput{min-width:220px}.dc-bg .tableWrap{overflow:auto}.dc-bg .jobsTable{width:100%;border-collapse:separate;border-spacing:0;min-width:900px}.dc-bg .jobsTable th, .dc-bg .jobsTable td{padding:13px 14px;border-bottom:1px solid rgba(15,23,42,.06);text-align:left;font-size:13.5px;font-weight:750;color:rgba(15,23,42,.72);vertical-align:middle}.dc-bg .jobsTable th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:rgba(15,23,42,.44);font-weight:950;background:rgba(15,23,42,.025)}.dc-bg .jobName{font-weight:950;color:#0f172a;font-size:14px}.dc-bg .jobMeta, .dc-bg .itemMeta{margin-top:5px;color:rgba(15,23,42,.52);font-size:12px;font-weight:750}.dc-bg .miniBtn{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;font-weight:950;font-size:12px;cursor:pointer}.dc-bg .tag{padding:6px 10px;border-radius:999px;border:1px solid var(--line2);font-weight:950;font-size:11.5px;white-space:nowrap;background:rgba(15,23,42,.04);color:rgba(15,23,42,.78)}.dc-bg .tag.ok{border-color:rgba(52,211,153,.22);color:rgba(5,150,105,.95);background:rgba(52,211,153,.10)}.dc-bg .tag.warn{border-color:rgba(245,158,11,.22);color:rgba(180,83,9,.95);background:rgba(245,158,11,.10)}.dc-bg .tag.bad{border-color:rgba(239,68,68,.22);color:rgba(220,38,38,.95);background:rgba(239,68,68,.10)}.dc-bg .list{display:flex;flex-direction:column;gap:10px}.dc-bg .item{border-radius:18px;border:1px solid rgba(15,23,42,.06);background:rgba(255,255,255,.86);padding:11px}.dc-bg .itemTop{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.dc-bg .itemName{font-weight:950;font-size:14px;color:rgba(15,23,42,.88)}.dc-bg .reportActions{display:flex;align-items:center;gap:10px}.dc-bg .deleteReportBtn{width:26px;height:26px;border-radius:999px;border:1px solid rgba(239,68,68,.18);background:rgba(239,68,68,.08);color:rgba(185,28,28,.95);font-weight:950;font-size:16px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.dc-bg .empty{text-align:center;padding:24px;color:rgba(15,23,42,.55);border:1px dashed rgba(15,23,42,.14);border-radius:18px;background:rgba(255,255,255,.55);font-weight:850;margin:14px}.dc-bg .error{border:1px solid rgba(239,68,68,.22);background:rgba(239,68,68,.08);color:rgba(15,23,42,.86);border-radius:18px;padding:14px;font-weight:850;font-size:13px;white-space:pre-wrap}
.dc-bg .crumbs{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.90),rgba(255,255,255,.72));position:relative;z-index:20;pointer-events:auto}.dc-bg .crumb{display:inline-flex;align-items:center;gap:8px;font-weight:900;font-size:12.5px;color:rgba(15,23,42,.72)}.dc-bg .crumb strong{color:rgba(15,23,42,.92)}.dc-bg .crumbBtn{margin-left:auto;display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;border:1px solid var(--line2);background:rgba(255,255,255,.82);font-weight:950;font-size:12.5px;cursor:pointer;transition:transform .08s ease,box-shadow .12s ease,border-color .12s ease;text-decoration:none;color:rgba(15,23,42,.90)}.dc-bg .crumbBtn.secondary{margin-left:0}.dc-bg .jobPage{display:flex;flex-direction:column;gap:12px;margin-top:12px}.dc-bg .jobAnalysisHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;border-radius:20px;border:1px solid rgba(34,211,238,.16);background:linear-gradient(135deg,rgba(255,255,255,.90),rgba(240,253,250,.72));box-shadow:0 14px 40px rgba(2,6,23,.055);padding:14px 16px}.dc-bg .sectionEyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(8,145,178,.86)}.dc-bg .sectionTitle{margin-top:4px;font-size:20px;line-height:1.1;font-weight:980;letter-spacing:-.025em;color:rgba(15,23,42,.94)}.dc-bg .sectionSubtle{font-size:12.5px;line-height:1.4;font-weight:850;color:rgba(15,23,42,.50);text-align:right}.dc-bg .jobDetailFocus{border:1px solid rgba(34,211,238,.14);box-shadow:0 18px 60px rgba(34,211,238,.08)}.dc-bg .jobStats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.dc-bg .jobDetailFocus{border-radius:18px}.dc-bg .jobDetailPad{overflow-x:auto}.dc-bg .jobTable{width:100%;min-width:1320px;table-layout:fixed;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.86)}.dc-bg .jobTable th, .dc-bg .jobTable td{padding:12px 8px;border-bottom:1px solid rgba(15,23,42,.06);vertical-align:middle;font-size:12.5px}.dc-bg .jobTable th{text-align:left;font-weight:950;color:rgba(15,23,42,.86);background:rgba(15,23,42,.035);position:sticky;top:0;z-index:2;font-size:12px;white-space:nowrap}.dc-bg .cellEdit{border:1px solid rgba(15,23,42,.12);background:#ffffff;border-radius:12px;padding:10px 10px;font-weight:800;font-size:14px;color:#0f172a!important;width:100%;outline:none;transition:border-color .12s ease,box-shadow .12s ease;position:relative;z-index:2;caret-color:#0f172a}.dc-bg .cellEdit:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.2)}.dc-bg .cellHint{margin-top:6px;font-size:11.5px;color:rgba(15,23,42,.62);font-weight:750}.dc-bg .customRemoveWrap{display:flex;justify-content:center;align-items:center}.dc-bg .supportGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.dc-bg .miniPanel{box-shadow:none}.dc-bg .noteBox{min-height:110px;resize:vertical}


.dc-bg .allJobsDetailShell{overflow:hidden}
.dc-bg .allJobsToolbarPad{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.dc-bg .allJobsToolbarPad .wideSearch{flex:1;min-width:260px}
.dc-bg .allJobsSubtotalPad{padding-top:6px}
.dc-bg .allJobsSubtotalGrid{margin:0;grid-template-columns:repeat(6,minmax(0,1fr))}
.dc-bg .allJobsStackPad{padding-top:12px}
.dc-bg .allJobsStack{display:flex;flex-direction:column;gap:14px}
.dc-bg .allJobsStackItem{border:1px solid rgba(15,23,42,.08);border-radius:20px;background:rgba(255,255,255,.84);box-shadow:0 12px 34px rgba(2,6,23,.055);overflow:hidden}
.dc-bg .allJobsStackItemHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(15,23,42,.06);background:rgba(248,250,252,.72)}
.dc-bg .compactJobStackHeader{background:linear-gradient(180deg,rgba(248,250,252,.86),rgba(255,255,255,.78))}
.dc-bg .allJobsStackJobName{font-size:15px;font-weight:980;letter-spacing:-.015em;color:rgba(15,23,42,.94)}
.dc-bg .allJobsStackJobMeta{margin-top:4px;font-size:12px;font-weight:760;color:rgba(15,23,42,.52)}
.dc-bg .compactFullViewBtn{padding:7px 10px;font-size:11.5px}
.dc-bg .stackedJobPage{margin-top:0;gap:0}
.dc-bg .stackedJobPage .jobDetailFocus{border:0;border-radius:0;box-shadow:none;background:transparent}
.dc-bg .stackedJobActions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px 0;background:rgba(255,255,255,.72)}
.dc-bg .stackedJobActionHint{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(15,23,42,.42);white-space:nowrap}
.dc-bg .stackedJobPage .buttonRow{gap:8px}
.dc-bg .stackedJobPage .btn{padding:9px 11px;border-radius:12px;font-size:12px}
.dc-bg .stackedJobPage .jobDetailPad{padding:10px 14px 14px}
.dc-bg .stackedJobPage .jobTable{min-width:1320px;background:rgba(255,255,255,.92)}

.dc-bg .scalePanel{
  margin-top:12px;
  border-radius:22px;
  border:1px solid var(--line2);
  background:rgba(255,255,255,.88);
  box-shadow:var(--shadow);
  overflow:hidden;
}

.dc-bg .scaleGrid{
  display:grid;
  grid-template-columns:1.15fr 1fr 1fr 1fr;
  gap:12px;
  padding:14px;
  align-items:start;
}

.dc-bg .scaleGridPremium{
  grid-template-columns:1.25fr 1fr 1fr 1fr;
}

.dc-bg .scaleCard{
  min-width:0;
  align-self:flex-start;
  border-radius:18px;
  border:1px solid var(--line2);
  background:rgba(255,255,255,.88);
  padding:14px;
  box-shadow:0 10px 28px rgba(2,6,23,.04);
  height:fit-content;
}

.dc-bg .scaleCard.dark{
  background:linear-gradient(135deg,rgba(248,250,252,.98),rgba(236,253,245,.74));
  color:rgba(15,23,42,.92);
  border-color:rgba(34,211,238,.14);
  box-shadow:0 12px 30px rgba(34,211,238,.065);
  min-height:0;
}

.dc-bg .scaleHeroCard{
  border-left:4px solid rgba(34,211,238,.80);
}

.dc-bg .wideScaleCard{
  grid-column:span 2;
}

.dc-bg .teamScaleCard{
  grid-column:span 2;
}

.dc-bg .scaleKicker{
  font-size:10.5px;
  text-transform:uppercase;
  letter-spacing:.08em;
  font-weight:950;
  color:rgba(15,23,42,.46);
}

.dc-bg .scaleCard.dark .scaleKicker{
  color:rgba(8,145,178,.78);
}

.dc-bg .scaleTitle{
  margin-top:9px;
  font-size:19px;
  line-height:1.08;
  font-weight:980;
  letter-spacing:-.03em;
  color:rgba(15,23,42,.94);
}

.dc-bg .scaleTitle.small{
  font-size:17px;
}

.dc-bg .scaleCard.dark .scaleTitle{
  color:rgba(15,23,42,.94);
}

.dc-bg .scaleText{
  margin-top:8px;
  font-size:12.5px;
  line-height:1.45;
  font-weight:750;
  color:rgba(15,23,42,.58);
}

.dc-bg .scaleCard.dark .scaleText{
  color:rgba(51,65,85,.66);
}

.dc-bg .scaleMiniStats{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  margin-top:13px;
}

.dc-bg .scaleMiniStats div{
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.70);
  padding:10px;
}

.dc-bg .scaleMiniStats span{
  display:block;
  font-size:10.5px;
  text-transform:uppercase;
  letter-spacing:.07em;
  font-weight:950;
  color:rgba(15,23,42,.48);
}

.dc-bg .scaleMiniStats strong{
  display:block;
  margin-top:4px;
  font-size:15px;
  font-weight:980;
  color:rgba(15,23,42,.92);
}

.dc-bg .alertList, .dc-bg .benchmarkList, .dc-bg .leakList, .dc-bg .actionStack{
  display:flex;
  flex-direction:column;
  gap:8px;
  margin-top:11px;
}

.dc-bg .alertItem, .dc-bg .benchmarkRow{
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

.dc-bg .alertItem.soft{
  background:rgba(248,250,252,.90);
}

.dc-bg .alertName, .dc-bg .benchmarkLabel{
  font-weight:950;
  font-size:12.75px;
  color:rgba(15,23,42,.90);
}

.dc-bg .alertMeta, .dc-bg .benchmarkNote{
  margin-top:2px;
  font-size:11.75px;
  line-height:1.35;
  font-weight:750;
  color:rgba(15,23,42,.52);
}

.dc-bg .leakItem{
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.76);
  padding:10px;
}

.dc-bg .leakTop{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
}

.dc-bg .leakName{
  font-size:13px;
  font-weight:950;
  color:rgba(15,23,42,.92);
}

.dc-bg .leakMeta{
  margin-top:3px;
  font-size:11.75px;
  font-weight:800;
  color:rgba(15,23,42,.50);
}

.dc-bg .leakAmount{
  white-space:nowrap;
  font-size:14px;
  font-weight:980;
  color:rgba(15,23,42,.92);
}

.dc-bg .leakAmount.ok{color:rgba(5,150,105,.95)}
.dc-bg .leakAmount.warn{color:rgba(180,83,9,.95)}

.dc-bg .leakFix{
  margin-top:8px;
  font-size:12px;
  line-height:1.4;
  font-weight:750;
  color:rgba(15,23,42,.58);
}

.dc-bg .actionCard{
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.76);
  padding:10px;
}

.dc-bg .actionTop{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  margin-bottom:7px;
}

.dc-bg .actionTop strong{
  font-size:13px;
  font-weight:980;
  color:rgba(5,150,105,.95);
}

.dc-bg .actionName{
  font-size:13px;
  line-height:1.35;
  font-weight:900;
  color:rgba(15,23,42,.88);
}

.dc-bg .actionMeta{
  margin-top:5px;
  font-size:11.75px;
  font-weight:800;
  color:rgba(15,23,42,.48);
}

.dc-bg .benchmarkGrid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  margin-top:11px;
}

.dc-bg .benchmarkValue{
  font-weight:980;
  font-size:14.5px;
  white-space:nowrap;
  text-align:right;
}

.dc-bg .benchmarkValue.ok{color:rgba(5,150,105,.95)}
.dc-bg .benchmarkValue.warn{color:rgba(180,83,9,.95)}
.dc-bg .benchmarkValue.bad{color:rgba(220,38,38,.95)}

.dc-bg .teamPills{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-top:11px;
}

.dc-bg .teamPills span{
  border-radius:999px;
  border:1px solid rgba(15,23,42,.08);
  background:rgba(15,23,42,.04);
  padding:6px 9px;
  font-size:11.75px;
  font-weight:950;
  color:rgba(15,23,42,.68);
}

.dc-bg .latestReport{
  margin-top:12px;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(248,250,252,.90);
  padding:10px;
}

.dc-bg .latestReportLabel{
  font-size:10.5px;
  text-transform:uppercase;
  letter-spacing:.07em;
  font-weight:950;
  color:rgba(15,23,42,.46);
}

.dc-bg .latestReportValue{
  margin-top:4px;
  font-size:12.75px;
  font-weight:900;
  color:rgba(15,23,42,.86);
}

.dc-bg .empty.compact{
  margin:0;
  padding:12px;
}


.dc-bg .lockedBtn{opacity:.74}
.dc-bg .gateBanner{margin:12px 14px 0;border-radius:16px;border:1px solid rgba(15,23,42,.08);padding:11px 12px;display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.4;font-weight:800;color:rgba(15,23,42,.64);background:rgba(248,250,252,.92)}
.dc-bg .gateBanner strong{color:rgba(15,23,42,.92);white-space:nowrap}
.dc-bg .gateBanner.preview{border-color:rgba(124,58,237,.16);background:linear-gradient(90deg,rgba(245,243,255,.92),rgba(255,255,255,.88))}
.dc-bg .gateBanner.locked{border-color:rgba(245,158,11,.18);background:linear-gradient(90deg,rgba(255,251,235,.92),rgba(255,255,255,.88))}
.dc-bg .cellEdit:disabled{cursor:not-allowed;background:rgba(248,250,252,.92);color:rgba(15,23,42,.48)!important}

.dc-bg .upgradeOverlay{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.46);backdrop-filter:blur(8px)}
.dc-bg .upgradeModal{position:relative;width:min(520px,100%);border-radius:28px;border:1px solid rgba(255,255,255,.70);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(248,250,252,.96));box-shadow:0 30px 90px rgba(2,6,23,.28);padding:24px;color:#0f172a}
.dc-bg .upgradeClose{position:absolute;right:16px;top:14px;width:34px;height:34px;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:#fff;color:rgba(15,23,42,.72);font-size:20px;font-weight:950;line-height:1;cursor:pointer}
.dc-bg .upgradeBadge{width:fit-content;border-radius:999px;border:1px solid rgba(124,58,237,.18);background:linear-gradient(90deg,rgba(34,211,238,.12),rgba(124,58,237,.12));color:rgba(91,33,182,.95);padding:7px 11px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
.dc-bg .upgradeTitle{margin:14px 38px 0 0;font-size:26px;line-height:1.05;letter-spacing:-.035em;font-weight:990;color:rgba(15,23,42,.96)}
.dc-bg .upgradeText{margin:12px 0 0;font-size:14px;line-height:1.55;font-weight:750;color:rgba(51,65,85,.78)}
.dc-bg .upgradeValueBox{margin-top:16px;border-radius:18px;border:1px solid rgba(15,23,42,.07);background:rgba(255,255,255,.78);padding:14px}
.dc-bg .upgradeValueTitle{font-size:13px;font-weight:950;color:rgba(15,23,42,.92)}
.dc-bg .upgradeValueText{margin-top:5px;font-size:13px;line-height:1.45;font-weight:750;color:rgba(15,23,42,.58)}
.dc-bg .upgradeActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.dc-bg .upgradePrimary{border-color:rgba(124,58,237,.24);box-shadow:0 14px 34px rgba(124,58,237,.12)}
.dc-bg .lockedBtn{opacity:.92;cursor:pointer}

.dc-bg .subtleSaveBtn{background:rgba(255,255,255,.92);border-color:rgba(15,23,42,.12);box-shadow:0 8px 20px rgba(2,6,23,.045)}
.dc-bg .subtleSaveBtn:hover{border-color:rgba(34,211,238,.24);box-shadow:0 12px 30px rgba(34,211,238,.10)}
.dc-bg .uploadPulseBtn,.dc-bg .dashboardBackBtn,.dc-bg .allJobsDetailBtn{position:relative;overflow:hidden;border-color:rgba(124,58,237,.20);background:linear-gradient(90deg,rgba(255,255,255,.94),rgba(245,243,255,.88));box-shadow:0 10px 24px rgba(124,58,237,.08)}
.dc-bg .uploadPulseBtn::after,.dc-bg .dashboardBackBtn::after,.dc-bg .allJobsDetailBtn::after{content:"";position:absolute;inset:-2px;background:linear-gradient(90deg,transparent,rgba(124,58,237,.10),transparent);transform:translateX(-120%);animation:softSheen 3.8s ease-in-out infinite;pointer-events:none}
@keyframes softSheen{0%,70%{transform:translateX(-120%)}100%{transform:translateX(120%)}}

@media(max-width:1300px){.dc-bg .scaleGrid, .dc-bg .scaleGridPremium{grid-template-columns:1fr 1fr}.dc-bg .wideScaleCard, .dc-bg .teamScaleCard{grid-column:span 2}.dc-bg .benchmarkGrid{grid-template-columns:1fr 1fr}.dc-bg .gridMix{grid-template-columns:repeat(2,minmax(0,1fr))}.dc-bg .supportGrid{grid-template-columns:1fr}.dc-bg .jobStats{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:1100px){.dc-bg .grid{grid-template-columns:1fr}.dc-bg .sideStack{display:grid;grid-template-columns:1fr 1fr}.dc-bg .sideStack .panel:first-child{grid-column:1/-1}.dc-bg .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.dc-bg .heroBody, .dc-bg .jobHeroBody{grid-template-columns:1fr}.dc-bg .charts, .dc-bg .jobCharts{grid-template-columns:1fr}.dc-bg .chartCard.wide{grid-column:auto}}
@media(max-width:760px){.dc-bg .jobAnalysisHeader{align-items:flex-start;flex-direction:column}.dc-bg .sectionSubtle{text-align:left}.dc-bg .scaleGrid, .dc-bg .scaleGridPremium{grid-template-columns:1fr}.dc-bg .wideScaleCard, .dc-bg .teamScaleCard{grid-column:auto}.dc-bg .benchmarkGrid{grid-template-columns:1fr}.dc-bg .scaleMiniStats{grid-template-columns:1fr}.dc-bg{padding:32px 0 28px;background:#fff!important}.dc-bg .wrap{width:100%;padding:0 16px}.dc-bg .pageTitle{font-size:32px}.dc-bg .topbar{flex-direction:column}.dc-bg .statusRow{justify-content:flex-start}.dc-bg .rangeWrap{align-items:flex-start}.dc-bg .rangeRight{justify-content:flex-start}.dc-bg .kpis{grid-template-columns:1fr 1fr}.dc-bg .sideStack{display:flex}.dc-bg .responsiveHead{flex-direction:column}.dc-bg .tableTools{width:100%;justify-content:stretch}.dc-bg .searchInput, .dc-bg .selectInput{width:100%}.dc-bg .gridMix{grid-template-columns:1fr}.dc-bg .jobStats{grid-template-columns:1fr 1fr}.dc-bg .crumbBtn{margin-left:0!important}}
@media(max-width:480px){.dc-bg .kpis, .dc-bg .jobStats{grid-template-columns:1fr}.dc-bg .pageTitle{font-size:29px}.dc-bg .heroTitle, .dc-bg .jobHeroTitle{font-size:25px}}

.dc-bg .moneyEditInput{
  cursor:text!important;
  pointer-events:auto!important;
  user-select:text!important;
}
.dc-bg .calcCell{
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
.dc-bg .jobTable input, .dc-bg .jobTable textarea{
  pointer-events:auto!important;
  user-select:text!important;
}

.dc-bg /* readability revamp */
.panel, .dc-bg .scalePanel, .dc-bg .hero, .dc-bg .jobHero{border-color:rgba(15,23,42,.085);box-shadow:0 20px 58px rgba(2,6,23,.09)}
.dc-bg .panelHead{padding:18px 18px 14px;border-bottom-color:rgba(15,23,42,.075)}
.dc-bg .panelTitle{font-size:20px;line-height:1.15;letter-spacing:-.025em;color:rgba(15,23,42,.97)}
.dc-bg .panelSub{font-size:14.5px;line-height:1.45;color:rgba(15,23,42,.66);font-weight:820;max-width:780px}.dc-bg .pageSub{font-size:17px;color:rgba(15,23,42,.68)}
.dc-bg .rangeWrap{padding:16px 18px}.dc-bg .rangeLabel{font-size:16px}.dc-bg .rangeSub{font-size:13.5px;color:rgba(15,23,42,.62)}
.dc-bg .heroBody, .dc-bg .jobHeroBody{padding:20px;gap:16px}.dc-bg .heroTitle, .dc-bg .jobHeroTitle{font-size:32px}.dc-bg .heroSub, .dc-bg .jobHeroSub{font-size:16px;color:rgba(15,23,42,.66);max-width:850px}.dc-bg .summaryCard, .dc-bg .jobSummaryCard{padding:16px;gap:12px;border-color:rgba(15,23,42,.08)}
.dc-bg .kpis{padding:16px;gap:12px}.dc-bg .kpi, .dc-bg .stat{padding:16px;border-color:rgba(15,23,42,.08);box-shadow:0 14px 34px rgba(2,6,23,.055)}.dc-bg .kLabel, .dc-bg .statLabel{font-size:12px;color:rgba(15,23,42,.56)}.dc-bg .kValue, .dc-bg .statValue{font-size:24px}.dc-bg .kSub, .dc-bg .statSub{font-size:14px;color:rgba(15,23,42,.64)}
.dc-bg .chartCard{padding:16px;border-color:rgba(15,23,42,.08)}.dc-bg .chartTitle{font-size:18px}.dc-bg .chartSub{font-size:14px;color:rgba(15,23,42,.62)}.dc-bg .trendEmpty, .dc-bg .empty{font-size:15px;color:rgba(15,23,42,.62);font-weight:900;background:rgba(255,255,255,.70)}
.dc-bg .jobsTable th{font-size:12px;color:rgba(15,23,42,.54)}.dc-bg .jobsTable td{font-size:14.5px;color:rgba(15,23,42,.76)}.dc-bg .jobName{font-size:15.5px}.dc-bg .jobMeta, .dc-bg .itemMeta{font-size:13px;color:rgba(15,23,42,.60)}.dc-bg .item{padding:14px;border-color:rgba(15,23,42,.08)}.dc-bg .itemName{font-size:15px}.dc-bg .tag{font-size:12px;padding:7px 11px}
.dc-bg .scalePanel .panelHead{align-items:center}.dc-bg .scaleGrid, .dc-bg .scaleGridPremium{gap:16px;padding:18px}.dc-bg .scaleCard{padding:18px;border-color:rgba(15,23,42,.085);box-shadow:0 12px 30px rgba(2,6,23,.055)}.dc-bg .scaleHeroCard{border-left-width:5px}.dc-bg .scaleKicker{font-size:12px;color:rgba(15,23,42,.55);letter-spacing:.075em}.dc-bg .scaleTitle{font-size:22px;line-height:1.12}.dc-bg .scaleTitle.small{font-size:19px}.dc-bg .scaleText{font-size:14px;line-height:1.55;color:rgba(15,23,42,.66)}.dc-bg .scaleMiniStats{gap:10px;margin-top:16px}.dc-bg .scaleMiniStats div{padding:13px}.dc-bg .scaleMiniStats span{font-size:11.5px}.dc-bg .scaleMiniStats strong{font-size:18px}.dc-bg .empty.compact{font-size:15px;line-height:1.45;font-weight:950;padding:16px;color:rgba(15,23,42,.58)}
.dc-bg .alertItem, .dc-bg .benchmarkRow, .dc-bg .leakItem, .dc-bg .actionCard{padding:13px;border-color:rgba(15,23,42,.08);background:rgba(255,255,255,.84)}.dc-bg .alertName, .dc-bg .benchmarkLabel, .dc-bg .leakName, .dc-bg .actionName{font-size:15px;line-height:1.3}.dc-bg .alertMeta, .dc-bg .benchmarkNote, .dc-bg .leakMeta, .dc-bg .actionMeta, .dc-bg .leakFix{font-size:13px;line-height:1.45;color:rgba(15,23,42,.62)}.dc-bg .benchmarkValue, .dc-bg .leakAmount{font-size:16px}.dc-bg .benchmarkGrid{gap:10px}.dc-bg .gateBanner{padding:14px 16px;font-size:14px;line-height:1.5;color:rgba(15,23,42,.68)}
.dc-bg .jobAnalysisHeader{padding:18px 20px}.dc-bg .sectionEyebrow{font-size:12px}.dc-bg .sectionTitle{font-size:23px}.dc-bg .sectionSubtle{font-size:14px;color:rgba(15,23,42,.60)}.dc-bg .jobStats{gap:12px}.dc-bg .jobDetailPad{padding:18px}.dc-bg .jobTable th{font-size:12.5px;color:rgba(15,23,42,.66)}.dc-bg .jobTable td{padding:14px 10px}.dc-bg .cellEdit{font-size:15px;padding:12px}.dc-bg .cellHint{font-size:12.5px;color:rgba(15,23,42,.58)}.dc-bg .supportGrid{gap:14px}.dc-bg .noteBox{min-height:130px}
@media(max-width:760px){.dc-bg .panelHead{padding:16px}.dc-bg .panelTitle{font-size:19px}.dc-bg .panelSub{font-size:14px}.dc-bg .scaleGrid, .dc-bg .scaleGridPremium{padding:14px}.dc-bg .scaleCard{padding:15px}.dc-bg .heroTitle, .dc-bg .jobHeroTitle{font-size:27px}.dc-bg .sectionSubtle{text-align:left}}



.dc-bg /* Scale Profit Control Center premium rewrite */
.premiumScalePanel{border-color:rgba(124,58,237,.13);box-shadow:0 26px 80px rgba(2,6,23,.105)}
.dc-bg .scaleControlHead{align-items:flex-start}
.dc-bg .scaleHeadRight{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.dc-bg .alertStatusPill{display:inline-flex;align-items:center;gap:9px;border-radius:999px;border:1px solid rgba(239,68,68,.18);background:rgba(254,242,242,.86);padding:9px 12px;font-size:12px;font-weight:950;color:rgba(185,28,28,.95);white-space:nowrap}
.dc-bg .alertDot{width:9px;height:9px;border-radius:999px;background:rgba(52,211,153,.95);box-shadow:0 0 0 4px rgba(52,211,153,.14)}
.dc-bg .alertDot.hot{background:rgba(239,68,68,.95);box-shadow:0 0 0 4px rgba(239,68,68,.14)}
.dc-bg .scaleCommandGrid{display:grid;grid-template-columns:1.35fr .85fr;gap:16px;padding:18px 18px 4px}
.dc-bg .scaleCommandHero{border-radius:22px;border:1px solid rgba(34,211,238,.18);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(236,253,245,.72));box-shadow:0 18px 44px rgba(34,211,238,.08);padding:20px;border-left:5px solid rgba(34,211,238,.85)}
.dc-bg .heroScaleTitle{font-size:26px;line-height:1.06;letter-spacing:-.04em}
.dc-bg .scaleTargetCard, .dc-bg .scaleEmailCard{border-radius:22px;border:1px solid rgba(15,23,42,.085);background:rgba(255,255,255,.90);box-shadow:0 14px 38px rgba(2,6,23,.06);padding:18px}
.dc-bg .targetInputRow{display:flex;gap:8px;align-items:center;margin-top:12px}
.dc-bg .targetInput{width:90px;border-radius:14px;border:1px solid rgba(15,23,42,.12);background:#fff;padding:12px;font-size:18px;font-weight:980;color:#0f172a;outline:none;text-align:center}
.dc-bg .targetInput:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.18)}
.dc-bg .targetInputRow span{font-size:18px;font-weight:950;color:rgba(15,23,42,.75)}
.dc-bg .targetHelp{margin-top:12px;font-size:13px;line-height:1.45;font-weight:800;color:rgba(15,23,42,.60)}
.dc-bg .targetChecklist{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.dc-bg .targetChecklist span{border-radius:999px;border:1px solid rgba(16,185,129,.16);background:rgba(16,185,129,.08);padding:6px 8px;font-size:11.5px;font-weight:950;color:rgba(5,150,105,.95)}
.dc-bg .emailAlertTitle{margin-top:9px;font-size:18px;line-height:1.1;font-weight:980;color:rgba(15,23,42,.94);letter-spacing:-.025em}
.dc-bg .emailDestination{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin:13px 0;border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(248,250,252,.9);padding:10px}
.dc-bg .emailDestination span{font-size:11px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.48)}
.dc-bg .emailDestination strong{font-size:12.5px;font-weight:950;color:rgba(15,23,42,.82);text-align:right;word-break:break-all}
.dc-bg .emailNote{margin-top:10px;font-size:11.5px;line-height:1.35;font-weight:800;color:rgba(15,23,42,.46)}
.dc-bg .btn-danger-soft{border-color:rgba(239,68,68,.18);background:rgba(254,242,242,.86);color:rgba(185,28,28,.96)}
.dc-bg .scaleGridPremiumV2{grid-template-columns:1.15fr 1fr 1fr;align-items:start}
.dc-bg .premiumAlert{align-items:flex-start;background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(248,250,252,.92))}
.dc-bg .alertMain{min-width:0}
.dc-bg .alertIssue{margin-top:6px;font-size:12.75px;line-height:1.4;font-weight:850;color:rgba(15,23,42,.68)}
.dc-bg .alertActions, .dc-bg .actionButtons{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.dc-bg .ghostMini{background:rgba(248,250,252,.92);text-decoration:none;color:rgba(15,23,42,.82)}
.dc-bg .premiumLeak, .dc-bg .premiumAction{background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,250,252,.86))}
.dc-bg .leakAmount.bad{color:rgba(220,38,38,.95)}
.dc-bg .benchmarkGridV2{grid-template-columns:1fr 1fr 1fr}
.dc-bg .alertsExplainerCard{grid-column:span 1}
.dc-bg .ruleList{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.dc-bg .ruleList div{border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(255,255,255,.76);padding:11px}
.dc-bg .ruleList b{display:block;font-size:13px;color:rgba(15,23,42,.92);font-weight:950}
.dc-bg .ruleList span{display:block;margin-top:3px;font-size:12.5px;line-height:1.4;color:rgba(15,23,42,.60);font-weight:800}

.dc-bg .subtleSaveBtn{background:rgba(255,255,255,.92);border-color:rgba(15,23,42,.12);box-shadow:0 8px 20px rgba(2,6,23,.045)}
.dc-bg .subtleSaveBtn:hover{border-color:rgba(34,211,238,.24);box-shadow:0 12px 30px rgba(34,211,238,.10)}
.dc-bg .uploadPulseBtn,.dc-bg .dashboardBackBtn,.dc-bg .allJobsDetailBtn{position:relative;overflow:hidden;border-color:rgba(124,58,237,.20);background:linear-gradient(90deg,rgba(255,255,255,.94),rgba(245,243,255,.88));box-shadow:0 10px 24px rgba(124,58,237,.08)}
.dc-bg .uploadPulseBtn::after,.dc-bg .dashboardBackBtn::after,.dc-bg .allJobsDetailBtn::after{content:"";position:absolute;inset:-2px;background:linear-gradient(90deg,transparent,rgba(124,58,237,.10),transparent);transform:translateX(-120%);animation:softSheen 3.8s ease-in-out infinite;pointer-events:none}
@keyframes softSheen{0%,70%{transform:translateX(-120%)}100%{transform:translateX(120%)}}

@media(max-width:1300px){.dc-bg .scaleCommandGrid{grid-template-columns:1fr 1fr}.dc-bg .scaleCommandHero{grid-column:1/-1}.dc-bg .scaleGridPremiumV2{grid-template-columns:1fr 1fr}.dc-bg .benchmarkGridV2{grid-template-columns:1fr 1fr}.dc-bg .alertsExplainerCard{grid-column:span 2}}
@media(max-width:760px){.dc-bg .scaleControlHead{align-items:flex-start;flex-direction:column}.dc-bg .scaleHeadRight{justify-content:flex-start}.dc-bg .scaleCommandGrid{grid-template-columns:1fr;padding:14px 14px 0}.dc-bg .scaleCommandHero{grid-column:auto}.dc-bg .scaleGridPremiumV2{grid-template-columns:1fr}.dc-bg .benchmarkGridV2{grid-template-columns:1fr}.dc-bg .alertsExplainerCard{grid-column:auto}.dc-bg .targetInputRow{flex-wrap:wrap}.dc-bg .targetInput{width:110px}.dc-bg .heroScaleTitle{font-size:23px}}



.dc-bg /* Global margin target control for Core + Scale */
.marginTargetTopWrap{margin:12px 0 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-radius:20px;border:1px solid rgba(34,211,238,.16);background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(240,253,250,.70));box-shadow:0 14px 42px rgba(2,6,23,.065);padding:14px 16px}
.dc-bg .marginTargetTopText{min-width:0}
.dc-bg .marginTargetTopKicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(8,145,178,.82)}
.dc-bg .marginTargetTopTitle{margin-top:4px;font-size:17px;line-height:1.15;font-weight:980;letter-spacing:-.02em;color:rgba(15,23,42,.94)}
.dc-bg .marginTargetTopSub{margin-top:4px;font-size:13px;line-height:1.4;font-weight:780;color:rgba(15,23,42,.58)}
.dc-bg .marginTargetTopControls{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap;flex:0 0 auto}
.dc-bg .compactTargetInputGroup{display:flex;align-items:center;gap:6px;border-radius:14px;border:1px solid rgba(15,23,42,.10);background:#fff;padding:7px 10px;box-shadow:0 8px 24px rgba(2,6,23,.04)}
.dc-bg .compactTargetInput{width:54px;border:0;outline:none;background:transparent;text-align:center;font-size:16px;font-weight:980;color:#0f172a;padding:2px 0}
.dc-bg .compactTargetInputGroup span{font-size:14px;font-weight:950;color:rgba(15,23,42,.68)}
.dc-bg .compactTargetSave{padding:9px 12px;border-radius:13px;font-size:12.5px}
.dc-bg .marginTargetCurrent{font-size:12px;font-weight:900;color:rgba(15,23,42,.52);white-space:nowrap}
@media(max-width:760px){.dc-bg .marginTargetTopWrap{align-items:flex-start;flex-direction:column}.dc-bg .marginTargetTopControls{justify-content:flex-start}.dc-bg .marginTargetCurrent{width:100%}}


.dc-bg /* Scale gating for Free/Core */
.scaleLockedPanel{border-color:rgba(15,23,42,.09);box-shadow:0 20px 58px rgba(2,6,23,.075)}
.dc-bg .lockedScaleBadge{display:inline-flex;align-items:center;gap:8px;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:rgba(248,250,252,.92);padding:8px 11px;font-size:12px;font-weight:950;color:rgba(71,85,105,.86);white-space:nowrap}
.dc-bg .lockGlyph, .dc-bg .lockedMiniIcon{filter:grayscale(1);opacity:.72}
.dc-bg .lockedScaleHero{margin:18px;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:flex-start;border-radius:22px;border:1px solid rgba(15,23,42,.08);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(248,250,252,.88));box-shadow:0 16px 44px rgba(2,6,23,.06);padding:20px}
.dc-bg .lockedScaleIcon{width:42px;height:42px;border-radius:16px;border:1px solid rgba(15,23,42,.10);background:rgba(241,245,249,.86);display:flex;align-items:center;justify-content:center;font-size:19px;filter:grayscale(1);opacity:.78}
.dc-bg .lockedScaleKicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(15,23,42,.46)}
.dc-bg .lockedScaleTitle{margin-top:6px;font-size:26px;line-height:1.08;font-weight:990;letter-spacing:-.035em;color:rgba(15,23,42,.94)}
.dc-bg .lockedScaleText{margin-top:9px;max-width:920px;font-size:14.5px;line-height:1.55;font-weight:780;color:rgba(15,23,42,.62)}
.dc-bg .lockedScaleActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.dc-bg .lockedFeatureGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:0 18px 18px}
.dc-bg .lockedFeatureCard{border-radius:18px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.88);box-shadow:0 12px 30px rgba(2,6,23,.045);padding:16px;min-height:132px}
.dc-bg .lockedFeatureTop{display:flex;align-items:center;gap:10px}
.dc-bg .lockedMiniIcon{width:28px;height:28px;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:rgba(241,245,249,.84);display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto}
.dc-bg .lockedFeatureTitle{font-size:15px;line-height:1.25;font-weight:970;color:rgba(15,23,42,.90)}
.dc-bg .lockedFeatureText{margin-top:10px;font-size:13px;line-height:1.48;font-weight:760;color:rgba(15,23,42,.58)}
.dc-bg .emailPauseLink{align-self:flex-start;background:transparent;border:none;color:rgba(100,116,139,.95);padding:6px 2px;font-size:13px;font-weight:850;cursor:pointer;text-decoration:none}
.dc-bg .emailPauseLink:hover{color:rgba(15,23,42,.92);text-decoration:underline}
@media(max-width:900px){.dc-bg .lockedFeatureGrid{grid-template-columns:1fr}.dc-bg .lockedScaleHero{grid-template-columns:1fr}.dc-bg .lockedScaleTitle{font-size:23px}}

.dc-bg /* Job comparison formatting fix */
.comparisonPanel{overflow:hidden;border-color:rgba(34,211,238,.14);box-shadow:0 18px 58px rgba(2,6,23,.075)}
.dc-bg .comparisonHead{align-items:center;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.88))}
.dc-bg .comparisonGrid{display:grid;grid-template-columns:minmax(240px,.85fr) minmax(260px,.95fr) minmax(520px,1.55fr);gap:14px;padding:16px;align-items:stretch}
.dc-bg .comparisonScoreCard, .dc-bg .comparisonDriverCard{border-radius:18px;border:1px solid rgba(15,23,42,.075);background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.86));padding:16px;box-shadow:0 12px 30px rgba(2,6,23,.045);min-width:0}
.dc-bg .comparisonLabel{font-size:11.5px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(15,23,42,.50)}
.dc-bg .comparisonValue{margin-top:8px;font-size:30px;line-height:1;font-weight:990;letter-spacing:-.035em}
.dc-bg .comparisonSub{margin-top:8px;font-size:13.5px;line-height:1.45;font-weight:800;color:rgba(15,23,42,.60)}
.dc-bg .driverTitle{margin-top:8px;font-size:24px;line-height:1.05;font-weight:990;letter-spacing:-.03em;color:rgba(15,23,42,.92)}
.dc-bg .comparisonTableWrap{border-radius:18px;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.92);overflow:auto;box-shadow:0 12px 30px rgba(2,6,23,.045)}
.dc-bg .comparisonTable{width:100%;min-width:520px;border-collapse:separate;border-spacing:0}
.dc-bg .comparisonTable th, .dc-bg .comparisonTable td{padding:13px 14px;border-bottom:1px solid rgba(15,23,42,.065);text-align:left;white-space:nowrap}
.dc-bg .comparisonTable th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.50);background:rgba(15,23,42,.025)}
.dc-bg .comparisonTable td{font-size:14px;font-weight:850;color:rgba(15,23,42,.74)}
.dc-bg .comparisonTable tr:last-child td{border-bottom:none}
.dc-bg .driverGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:0 16px 16px}
.dc-bg .driverMini{border-radius:16px;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.88);padding:13px;min-width:0}
.dc-bg .driverMiniTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;font-size:13px;font-weight:950;color:rgba(15,23,42,.88)}
.dc-bg .driverMiniTop strong{white-space:nowrap}
.dc-bg .driverMiniSub{margin-top:7px;font-size:12.5px;line-height:1.4;font-weight:800;color:rgba(15,23,42,.58)}

.dc-bg /* Cleaner real-time email alert spacing */
.scaleEmailCard{display:flex;flex-direction:column;gap:12px}
.dc-bg .scaleEmailCard .scaleKicker, .dc-bg .scaleEmailCard .emailAlertTitle, .dc-bg .scaleEmailCard .scaleText, .dc-bg .scaleEmailCard .emailDestination, .dc-bg .scaleEmailCard .emailLiveGrid, .dc-bg .scaleEmailCard .emailTriggerList, .dc-bg .scaleEmailCard .emailNote{margin-top:0}
.dc-bg .emailLiveGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dc-bg .emailLiveGrid div{border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(255,255,255,.76);padding:11px;min-width:0}
.dc-bg .emailLiveGrid span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.48)}
.dc-bg .emailLiveGrid strong{display:block;margin-top:4px;font-size:13px;line-height:1.25;font-weight:950;color:rgba(15,23,42,.86)}
.dc-bg .emailTriggerList{display:flex;flex-direction:column;gap:7px;border-radius:14px;border:1px solid rgba(34,211,238,.12);background:linear-gradient(135deg,rgba(240,253,250,.78),rgba(255,255,255,.80));padding:11px}
.dc-bg .emailTriggerList span{font-size:12.5px;line-height:1.35;font-weight:850;color:rgba(15,23,42,.70)}

.dc-bg /* High-risk view all workflow */
.scaleCardHeaderRow{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.dc-bg .scaleCardSub{margin-top:5px;font-size:12.5px;line-height:1.35;font-weight:800;color:rgba(15,23,42,.55)}
.dc-bg .viewAllAlertsBtn{background:linear-gradient(90deg,rgba(34,211,238,.14),rgba(124,58,237,.14));border-color:rgba(124,58,237,.18);white-space:nowrap}
.dc-bg .highRiskPage{display:flex;flex-direction:column;gap:14px;margin-top:12px}
.dc-bg .highRiskHero{overflow:hidden}
.dc-bg .highRiskHeroBody{padding:18px;display:grid;grid-template-columns:1.2fr .8fr;gap:14px;align-items:end}
.dc-bg .highRiskTitle{margin-top:5px;font-size:28px;line-height:1.05;font-weight:990;letter-spacing:-.035em;color:rgba(15,23,42,.94)}
.dc-bg .highRiskSub{margin-top:8px;font-size:15px;line-height:1.5;font-weight:780;color:rgba(15,23,42,.62);max-width:820px}
.dc-bg .highRiskSearchWrap{display:flex;justify-content:flex-end}
.dc-bg .highRiskJobStack{display:flex;flex-direction:column;gap:16px}
.dc-bg .highRiskJobCard{border-radius:22px;border:1px solid rgba(239,68,68,.10);background:rgba(255,255,255,.64);box-shadow:0 18px 50px rgba(2,6,23,.065);padding:0;overflow:hidden}
.dc-bg .highRiskJobCard .jobPage{margin-top:0;padding:14px}
.dc-bg .highRiskJobCard .jobAnalysisHeader{display:none}
.dc-bg .highRiskJobCard .jobStats{margin-bottom:0}


.dc-bg .subtleSaveBtn{background:rgba(255,255,255,.92);border-color:rgba(15,23,42,.12);box-shadow:0 8px 20px rgba(2,6,23,.045)}
.dc-bg .subtleSaveBtn:hover{border-color:rgba(34,211,238,.24);box-shadow:0 12px 30px rgba(34,211,238,.10)}
.dc-bg .uploadPulseBtn,.dc-bg .dashboardBackBtn,.dc-bg .allJobsDetailBtn{position:relative;overflow:hidden;border-color:rgba(124,58,237,.20);background:linear-gradient(90deg,rgba(255,255,255,.94),rgba(245,243,255,.88));box-shadow:0 10px 24px rgba(124,58,237,.08)}
.dc-bg .uploadPulseBtn::after,.dc-bg .dashboardBackBtn::after,.dc-bg .allJobsDetailBtn::after{content:"";position:absolute;inset:-2px;background:linear-gradient(90deg,transparent,rgba(124,58,237,.10),transparent);transform:translateX(-120%);animation:softSheen 3.8s ease-in-out infinite;pointer-events:none}
@keyframes softSheen{0%,70%{transform:translateX(-120%)}100%{transform:translateX(120%)}}

@media(max-width:1300px){.dc-bg .comparisonGrid{grid-template-columns:1fr 1fr}.dc-bg .comparisonTableWrap{grid-column:1/-1}.dc-bg .driverGrid{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.dc-bg .comparisonGrid{grid-template-columns:1fr;padding:14px}.dc-bg .comparisonTableWrap{grid-column:auto}.dc-bg .driverGrid{grid-template-columns:1fr;padding:0 14px 14px}.dc-bg .comparisonValue{font-size:26px}.dc-bg .emailLiveGrid{grid-template-columns:1fr}.dc-bg .highRiskHeroBody{grid-template-columns:1fr}.dc-bg .highRiskSearchWrap{justify-content:stretch}.dc-bg .scaleCardHeaderRow{align-items:stretch;flex-direction:column}.dc-bg .viewAllAlertsBtn{width:fit-content}}


.dc-bg /* Clean credit/refund integration */
.creditText{color:rgba(5,150,105,.96)!important}
.dc-bg .creditAppliedPill{display:inline-flex;align-items:center;border-radius:999px;border:1px solid rgba(16,185,129,.18);background:rgba(236,253,245,.88);color:rgba(5,150,105,.96);padding:8px 11px;font-size:12px;font-weight:950;white-space:nowrap}
.dc-bg .creditMixRow{border-color:rgba(16,185,129,.18);background:linear-gradient(180deg,rgba(236,253,245,.64),rgba(255,255,255,.86))}
.dc-bg .creditBarFill{opacity:.72}
.dc-bg .creditStat{border-color:rgba(16,185,129,.16);background:linear-gradient(180deg,rgba(236,253,245,.60),rgba(255,255,255,.86))}
.dc-bg .creditKpiPanel{margin-top:12px;border-radius:20px;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.82);box-shadow:0 16px 44px rgba(2,6,23,.055);overflow:hidden}
.dc-bg .creditKpiHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px 0}
.dc-bg .creditKpiTitle{font-size:14px;font-weight:950;color:rgba(15,23,42,.90);letter-spacing:-.01em}
.dc-bg .creditKpiSub{margin-top:3px;font-size:12.5px;line-height:1.4;font-weight:760;color:rgba(15,23,42,.52);max-width:920px}
.dc-bg .creditKpiGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 16px 16px}
.dc-bg .creditKpiCard{border-radius:16px;border:1px solid rgba(15,23,42,.065);background:rgba(248,250,252,.78);padding:12px;box-shadow:none}
.dc-bg .creditKpiLabel{font-size:10.5px;text-transform:uppercase;letter-spacing:.075em;color:rgba(15,23,42,.48);font-weight:950}
.dc-bg .creditKpiValue{margin-top:6px;font-size:18px;line-height:1.05;font-weight:980;color:rgba(15,23,42,.92);letter-spacing:-.015em}
.dc-bg .creditKpiNote{margin-top:6px;font-size:12px;line-height:1.35;font-weight:760;color:rgba(15,23,42,.52)}
@media(max-width:1100px){.dc-bg .creditKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.dc-bg .creditKpiGrid{grid-template-columns:1fr}.dc-bg .creditAppliedPill{width:fit-content}}


.dc-bg /* Report manager view */
.manageReportsBtn{background:linear-gradient(90deg,rgba(34,211,238,.12),rgba(124,58,237,.12));border-color:rgba(124,58,237,.16)}
.dc-bg .reportMiniStats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.dc-bg .reportMiniStats span{border-radius:999px;border:1px solid rgba(15,23,42,.08);background:rgba(248,250,252,.86);padding:6px 9px;font-size:11.5px;font-weight:950;color:rgba(15,23,42,.58)}
.dc-bg .reportFullWidthBtn{width:100%;justify-content:center;margin-top:12px}
.dc-bg .reportsManagerPage{display:flex;flex-direction:column;gap:14px;margin-top:12px}
.dc-bg .reportsManagerHero{overflow:hidden}
.dc-bg .reportsManagerBody{padding:18px;display:grid;grid-template-columns:1.25fr .75fr;gap:16px;align-items:stretch}
.dc-bg .reportsManagerTitle{margin-top:5px;font-size:30px;line-height:1.05;font-weight:990;letter-spacing:-.04em;color:rgba(15,23,42,.95)}
.dc-bg .reportsManagerSub{margin-top:8px;font-size:15px;line-height:1.5;font-weight:780;color:rgba(15,23,42,.62);max-width:850px}
.dc-bg .reportsSummaryCard{border-radius:18px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.88);padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 12px 34px rgba(2,6,23,.045)}
.dc-bg .reportsManagerPanel{overflow:hidden}
.dc-bg .reportManagerTools{align-items:center}
.dc-bg .reportsBulkActions{display:flex;gap:10px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid rgba(15,23,42,.06);background:rgba(248,250,252,.52)}
.dc-bg .reportsBulkActions .btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.dc-bg .reportsTable{min-width:980px}
.dc-bg .hiddenReportRow td{opacity:.62;background:rgba(248,250,252,.78)}
.dc-bg .reportHideBtn{border-color:rgba(239,68,68,.18);background:rgba(254,242,242,.78);color:rgba(185,28,28,.96)}
@media(max-width:900px){.dc-bg .reportsManagerBody{grid-template-columns:1fr}.dc-bg .reportsManagerTitle{font-size:26px}.dc-bg .reportManagerTools{width:100%;justify-content:stretch}.dc-bg .reportManagerTools .btn{justify-content:center}}



.dc-bg /* Report manager job identity upgrade */
.reportPreviewItem{transition:border-color .12s ease,box-shadow .12s ease,transform .08s ease}
.dc-bg .reportPreviewItem:hover{border-color:rgba(34,211,238,.18);box-shadow:0 14px 34px rgba(2,6,23,.065);transform:translateY(-1px)}
.dc-bg .reportItemTitle, .dc-bg .reportManagerJobName{letter-spacing:-.015em}
.dc-bg .reportNameWrap{display:flex;align-items:flex-start;gap:10px;min-width:280px}
.dc-bg .reportIdText{margin-top:5px;font-size:11.5px;line-height:1.35;font-weight:800;color:rgba(15,23,42,.42);max-width:520px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-bg .reportTagRow{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.dc-bg .reportInfoTag{display:inline-flex;align-items:center;border-radius:999px;border:1px solid rgba(15,23,42,.08);background:rgba(248,250,252,.92);padding:4px 7px;font-size:10.5px;line-height:1;font-weight:950;color:rgba(15,23,42,.58);white-space:nowrap}
.dc-bg .reportCreditText{margin-top:5px;font-size:11.5px;font-weight:950;color:rgba(5,150,105,.95);white-space:nowrap}
.dc-bg .reportsTable td:first-child{min-width:360px}
.dc-bg .reportsTable .jobMeta{max-width:520px;white-space:normal;line-height:1.35}
@media(max-width:760px){.dc-bg .reportIdText{white-space:normal}.dc-bg .reportsTable td:first-child{min-width:300px}.dc-bg .reportNameWrap{min-width:260px}}


.dc-bg /* DropClarity Premium Responsive Layout v2 - wide desktop, .dc-bg cleaner tablet/mobile */
html, .dc-bg{overflow-x:hidden!important;-webkit-text-size-adjust:100%;text-rendering:optimizeLegibility}
.dc-bg{padding-top:clamp(42px,4vw,64px);padding-bottom:clamp(28px,4vw,48px);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
.dc-bg .wrap{width:min(1960px,calc(100vw - clamp(16px,2vw,40px)))!important;max-width:1960px!important;margin-inline:auto!important;padding-inline:0!important}
.dc-bg .topbar{gap:clamp(14px,2vw,28px);margin-bottom:clamp(16px,2vw,24px)}
.dc-bg .dashboardIntro{max-width:1040px}.dc-bg .pageTitle{font-size:clamp(38px,3.1vw,54px);max-width:1040px}.dc-bg .pageSub{max-width:920px}.dc-bg .statusRow{gap:10px}
.dc-bg .rangeWrap, .dc-bg .marginTargetTopWrap, .dc-bg .hero, .dc-bg .panel, .dc-bg .scalePanel, .dc-bg .chartCard, .dc-bg .creditKpiPanel{backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.dc-bg .rangeWrap{margin:18px 0;padding:18px 20px;gap:16px}.dc-bg .rangeRight{gap:12px}.dc-bg .rangeButtons{gap:9px}.dc-bg .rangeBtn, .dc-bg .btn{min-height:42px}
.dc-bg .marginTargetTopWrap{padding:18px 20px;margin:14px 0 18px}.dc-bg .marginTargetTopTitle{font-size:18px}.dc-bg .marginTargetTopSub{max-width:980px}
.dc-bg .heroBody{grid-template-columns:minmax(0,1.35fr) minmax(380px,.65fr);padding:22px;gap:18px}.dc-bg .heroTitle{font-size:clamp(31px,2.1vw,40px)}.dc-bg .summaryCard{padding:18px;gap:13px}
.dc-bg .kpis{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:18px}.dc-bg .kpi{min-height:112px;padding:17px}.dc-bg .kValue{font-size:clamp(22px,1.5vw,29px)}
.dc-bg .charts{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin-top:16px}.dc-bg .chartCard{padding:18px}.dc-bg .gridMix{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.dc-bg .mixRow{padding:14px;min-width:0}
.dc-bg .creditKpiGrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.dc-bg .creditKpiCard{padding:14px}
.dc-bg .grid{grid-template-columns:minmax(0,1.72fr) minmax(390px,.58fr);gap:18px;margin-top:16px}.dc-bg .mainCol, .dc-bg .sideStack{gap:18px}.dc-bg .pad{padding:18px}.dc-bg .panelHead{padding:20px 20px 16px}.dc-bg .panelTitle{font-size:21px}.dc-bg .jobsTable{min-width:980px}.dc-bg .jobsTable th, .dc-bg .jobsTable td{padding:15px 16px}.dc-bg .tableWrap{-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
.dc-bg .scaleCommandGrid{grid-template-columns:minmax(0,1.45fr) minmax(360px,.55fr);gap:18px;padding:20px 20px 6px}.dc-bg .scaleGridPremiumV2{grid-template-columns:minmax(0,1.18fr) minmax(0,1fr) minmax(0,1fr);gap:18px;padding:20px}.dc-bg .scaleCard, .dc-bg .scaleEmailCard, .dc-bg .scaleCommandHero{padding:20px}.dc-bg .scaleMiniStats{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.dc-bg .benchmarkGridV2{grid-template-columns:repeat(3,minmax(0,1fr))}
.dc-bg .jobStats{grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}.dc-bg .jobHeroBody{grid-template-columns:minmax(0,1.35fr) minmax(380px,.65fr);padding:22px;gap:18px}.dc-bg .jobCharts{gap:16px}.dc-bg .comparisonGrid{grid-template-columns:minmax(250px,.78fr) minmax(280px,.84fr) minmax(560px,1.55fr);gap:16px}.dc-bg .driverGrid{gap:14px}.dc-bg .supportGrid{gap:16px}
.dc-bg .reportsManagerBody{grid-template-columns:minmax(0,1.32fr) minmax(380px,.68fr);gap:18px;padding:22px}.dc-bg .reportsTable{min-width:1080px}.dc-bg .reportsBulkActions{padding:16px 20px}.dc-bg .reportManagerTools{gap:10px}
@media (min-width:1800px){.dc-bg .wrap{width:min(2000px,calc(100vw - 32px))!important;max-width:2000px!important}.dc-bg .grid{grid-template-columns:minmax(0,1.82fr) minmax(420px,.55fr)}.dc-bg .pageTitle{font-size:56px}.dc-bg .heroTitle{font-size:42px}.dc-bg .scaleCommandHero{padding:24px}.dc-bg .scaleCard{padding:22px}}
@media (max-width:1500px){.dc-bg .wrap{width:calc(100vw - 32px)!important}.dc-bg .grid{grid-template-columns:minmax(0,1.58fr) minmax(360px,.62fr);gap:16px}.dc-bg .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.dc-bg .scaleMiniStats{grid-template-columns:repeat(3,minmax(0,1fr))}.dc-bg .benchmarkGridV2{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:1280px){.dc-bg .wrap{width:calc(100vw - 28px)!important}.dc-bg .pageTitle{font-size:40px}.dc-bg .heroBody, .dc-bg .jobHeroBody{grid-template-columns:1fr}.dc-bg .summaryCard, .dc-bg .jobSummaryCard{max-width:none}.dc-bg .grid{grid-template-columns:1fr}.dc-bg .sideStack{display:grid;grid-template-columns:1fr 1fr;gap:16px}.dc-bg .sideStack .panel:first-child{grid-column:1/-1}.dc-bg .charts{gap:14px}.dc-bg .gridMix{grid-template-columns:repeat(2,minmax(0,1fr))}.dc-bg .scaleCommandGrid{grid-template-columns:1fr}.dc-bg .scaleGridPremiumV2{grid-template-columns:1fr 1fr}.dc-bg .alertsExplainerCard{grid-column:span 2}.dc-bg .comparisonGrid{grid-template-columns:1fr 1fr}.dc-bg .comparisonTableWrap{grid-column:1/-1}.dc-bg .driverGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.dc-bg .reportsManagerBody{grid-template-columns:1fr}}
@media (max-width:1024px){.dc-bg{padding-top:34px}.dc-bg .wrap{width:calc(100vw - 24px)!important}.dc-bg .topbar{align-items:flex-start}.dc-bg .statusRow{justify-content:flex-start}.dc-bg .rangeWrap, .dc-bg .marginTargetTopWrap{align-items:flex-start;flex-direction:column}.dc-bg .rangeRight, .dc-bg .marginTargetTopControls{justify-content:flex-start;width:100%}.dc-bg .rangeButtons{width:100%;overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px;-webkit-overflow-scrolling:touch}.dc-bg .rangeBtn{flex:0 0 auto}.dc-bg .customDates{width:100%}.dc-bg .customDates input{flex:1 1 150px}.dc-bg .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.dc-bg .creditKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.dc-bg .charts, .dc-bg .jobCharts{grid-template-columns:1fr}.dc-bg .chartCard.wide{grid-column:auto}.dc-bg .sideStack{display:flex}.dc-bg .scaleGridPremiumV2{grid-template-columns:1fr}.dc-bg .alertsExplainerCard{grid-column:auto}.dc-bg .benchmarkGridV2{grid-template-columns:1fr 1fr}.dc-bg .highRiskHeroBody{grid-template-columns:1fr}.dc-bg .reportsManagerTitle{font-size:28px}}
@media (max-width:768px){.dc-bg{padding-top:28px;background:#fff!important}.dc-bg .wrap{width:100%!important;padding-inline:16px!important}.dc-bg .pageTitle{font-size:34px;line-height:1.04}.dc-bg .pageSub{font-size:15px}.dc-bg .topbar{margin-bottom:14px}.dc-bg .statusRow{width:100%}.dc-bg .statusRow .btn, .dc-bg .statusRow a.btn{flex:1 1 auto;justify-content:center}.dc-bg .rangeWrap, .dc-bg .marginTargetTopWrap, .dc-bg .hero, .dc-bg .panel, .dc-bg .scalePanel, .dc-bg .chartCard, .dc-bg .creditKpiPanel{border-radius:18px}.dc-bg .panelHead, .dc-bg .responsiveHead{flex-direction:column;align-items:stretch!important}.dc-bg .tableTools, .dc-bg .reportManagerTools{width:100%;display:grid;grid-template-columns:1fr;gap:10px}.dc-bg .searchInput, .dc-bg .selectInput{width:100%;min-width:0}.dc-bg .heroBody, .dc-bg .jobHeroBody{padding:18px}.dc-bg .heroTitle, .dc-bg .jobHeroTitle{font-size:28px}.dc-bg .heroSub, .dc-bg .jobHeroSub{font-size:14.5px}.dc-bg .kpis, .dc-bg .creditKpiGrid, .dc-bg .gridMix, .dc-bg .jobStats{grid-template-columns:1fr}.dc-bg .kpi, .dc-bg .stat{min-height:auto}.dc-bg .scaleCommandGrid, .dc-bg .scaleGridPremiumV2{padding:14px;gap:14px}.dc-bg .scaleMiniStats{grid-template-columns:1fr 1fr}.dc-bg .scaleHeadRight{justify-content:flex-start}.dc-bg .scaleControlHead{align-items:flex-start!important}.dc-bg .benchmarkGridV2{grid-template-columns:1fr}.dc-bg .lockedFeatureGrid{grid-template-columns:1fr}.dc-bg .comparisonGrid{grid-template-columns:1fr;padding:14px}.dc-bg .driverGrid{grid-template-columns:1fr;padding:0 14px 14px}.dc-bg .supportGrid{grid-template-columns:1fr}.dc-bg .jobDetailPad{padding:14px}.dc-bg .jobTable{min-width:1180px}.dc-bg .jobsTable{min-width:880px}.dc-bg .reportsTable{min-width:980px}.dc-bg .reportsBulkActions{padding:14px}.dc-bg .reportsBulkActions .btn{width:100%;justify-content:center}.dc-bg .reportsManagerBody{padding:16px}.dc-bg .reportsManagerTitle{font-size:25px}.dc-bg .crumbs{align-items:flex-start}.dc-bg .crumbBtn{margin-left:0!important}.dc-bg .creditAppliedPill{white-space:normal;line-height:1.25}.dc-bg .emailLiveGrid{grid-template-columns:1fr}}
@media (max-width:480px){.dc-bg .wrap{padding-inline:12px!important}.dc-bg .pageTitle{font-size:30px}.dc-bg .pageKicker{font-size:11px}.dc-bg .btn, .dc-bg .rangeBtn{width:100%;justify-content:center}.dc-bg .rangeButtons .rangeBtn{width:auto}.dc-bg .customDates{display:grid;grid-template-columns:1fr;gap:8px}.dc-bg .heroBody, .dc-bg .jobHeroBody, .dc-bg .panelHead, .dc-bg .pad, .dc-bg .chartCard{padding:14px}.dc-bg .kValue, .dc-bg .statValue{font-size:22px}.dc-bg .scaleMiniStats{grid-template-columns:1fr}.dc-bg .reportActions{align-items:flex-end;flex-direction:column}.dc-bg .itemTop{gap:8px}.dc-bg .reportsManagerSub, .dc-bg .heroSub, .dc-bg .panelSub{font-size:13.5px}.dc-bg .upgradeModal{border-radius:22px;padding:20px}.dc-bg .upgradeTitle{font-size:23px}.dc-bg .jobsTable th, .dc-bg .jobsTable td{padding:12px 12px}.dc-bg .reportNameWrap{min-width:240px}.dc-bg .reportsTable td:first-child{min-width:280px}}
@media (hover:none) and (pointer:coarse){.dc-bg .btn, .dc-bg .miniBtn, .dc-bg .rangeBtn, .dc-bg .deleteReportBtn, .dc-bg .crumbBtn{min-height:44px}.dc-bg .deleteReportBtn{min-width:44px}.dc-bg .btn:hover, .dc-bg .miniBtn:hover, .dc-bg .reportPreviewItem:hover{transform:none;box-shadow:inherit}}


.dc-bg /* DropClarity final polish: tighter dashboard header, .dc-bg KPI-first rhythm, .dc-bg sharper risk state, .dc-bg modest report controls */
.dashboardIntro{display:flex;flex-direction:column;gap:6px!important;max-width:980px!important}
.dc-bg .pageKicker{margin-bottom:2px!important;padding:5px 10px!important;font-size:11px!important;box-shadow:0 8px 22px rgba(34,211,238,.08)!important}
.dc-bg .pageTitle{font-size:clamp(30px,2.55vw,42px)!important;line-height:1.06!important;letter-spacing:-.038em!important;max-width:900px!important}
.dc-bg .pageSub{margin-top:2px!important;font-size:clamp(14px,1.1vw,16px)!important;line-height:1.42!important;max-width:760px!important;color:rgba(51,65,85,.72)!important}
.dc-bg .topbar{margin-bottom:14px!important;align-items:center!important}
.dc-bg .statusRow .riskPill{border-color:rgba(239,68,68,.34)!important;background:linear-gradient(135deg,rgba(254,242,242,.96),rgba(255,255,255,.86))!important;color:rgba(185,28,28,.98)!important;box-shadow:0 14px 34px rgba(239,68,68,.14),0 0 0 1px rgba(239,68,68,.08) inset!important;font-weight:990!important}
.dc-bg .statusRow .riskPill::after{content:"";width:7px;height:7px;border-radius:999px;background:rgba(239,68,68,.95);box-shadow:0 0 0 4px rgba(239,68,68,.13);margin-left:2px}
.dc-bg .kpis{padding:16px!important;gap:12px!important}
.dc-bg .kpi{min-height:104px!important}
.dc-bg .hero{margin-top:12px!important}
.dc-bg .heroBody{padding:18px 20px!important;gap:16px!important}
.dc-bg .heroTitle{font-size:clamp(24px,1.75vw,32px)!important;line-height:1.08!important}
.dc-bg .heroSub{font-size:clamp(14px,1vw,15.5px)!important;line-height:1.42!important;max-width:760px!important}
.dc-bg .summaryCard{padding:15px!important;gap:10px!important}
.dc-bg .reportsManageLink{appearance:none;border:0;background:transparent;color:rgba(15,23,42,.58);font-size:12.5px;font-weight:950;cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:6px 2px;border-radius:999px;white-space:nowrap;transition:color .12s ease,transform .08s ease}
.dc-bg .reportsManageLink:hover{color:rgba(8,145,178,.96);transform:translateX(1px)}
.dc-bg .reportsManageLink span{font-size:13px;line-height:1;color:rgba(8,145,178,.85)}
.dc-bg .reportMoreLink{appearance:none;width:100%;border:0;background:transparent;color:rgba(8,145,178,.92);font-size:12.5px;font-weight:950;cursor:pointer;padding:10px 4px;margin-top:8px;text-align:center;border-radius:12px}
.dc-bg .reportMoreLink:hover{background:rgba(34,211,238,.07)}
.dc-bg .manageReportsBtn{background:transparent!important;border-color:transparent!important;box-shadow:none!important}
.dc-bg .sideStack .panelHead{align-items:flex-start!important}
@media(max-width:768px){.dc-bg .pageTitle{font-size:30px!important}.dc-bg .topbar{align-items:flex-start!important}.dc-bg .kpis{grid-template-columns:1fr 1fr!important}.dc-bg .heroBody{padding:16px!important}.dc-bg .reportsManageLink{align-self:flex-start}.dc-bg .statusRow .riskPill{width:auto!important;justify-content:center}}
@media(max-width:480px){.dc-bg .pageTitle{font-size:28px!important}.dc-bg .pageSub{font-size:14px!important}.dc-bg .kpis{grid-template-columns:1fr!important}.dc-bg .heroTitle{font-size:24px!important}.dc-bg .reportsManageLink{padding:6px 0}.dc-bg .statusRow .riskPill{width:100%!important}}


.dc-bg /* Latest AI Insights responsive cleanup */
.insightsPanel{overflow:hidden}
.dc-bg .insightsPanelHead{align-items:flex-start}
.dc-bg .insightsPad{padding:18px}
.dc-bg .insightList{display:flex;flex-direction:column;gap:12px;min-width:0}
.dc-bg .insightCard{min-width:0;border-radius:18px;border:1px solid rgba(15,23,42,.08);background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.72));box-shadow:0 10px 28px rgba(2,6,23,.045);padding:14px 14px 13px;overflow:hidden}
.dc-bg .insightTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0}
.dc-bg .insightTitleWrap{min-width:0;flex:1 1 auto}
.dc-bg .insightTitle{font-size:15px;line-height:1.25;font-weight:980;letter-spacing:-.015em;color:rgba(15,23,42,.92);overflow-wrap:anywhere}
.dc-bg .insightDetail{margin:7px 0 0;font-size:13px;line-height:1.45;font-weight:780;color:rgba(15,23,42,.62);overflow-wrap:anywhere}
.dc-bg .insightImpact{flex:0 1 auto;max-width:44%;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(15,23,42,.10);background:rgba(248,250,252,.92);padding:7px 10px;font-size:11.5px;line-height:1.2;font-weight:950;text-align:center;white-space:normal;overflow-wrap:anywhere}
.dc-bg .insightImpact.ok{border-color:rgba(16,185,129,.20);background:rgba(16,185,129,.08);color:rgba(5,150,105,.96)}
.dc-bg .insightImpact.warn{border-color:rgba(245,158,11,.22);background:rgba(245,158,11,.10);color:rgba(180,83,9,.96)}
.dc-bg .insightImpact.bad{border-color:rgba(239,68,68,.22);background:rgba(239,68,68,.10);color:rgba(220,38,38,.96)}
.dc-bg .insightRecommendation{margin-top:11px;border-radius:14px;border:1px solid rgba(15,23,42,.065);background:rgba(255,255,255,.72);padding:10px 11px;min-width:0}
.dc-bg .insightRecommendation span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(15,23,42,.46)}
.dc-bg .insightRecommendation p{margin:4px 0 0;font-size:13px;line-height:1.45;font-weight:820;color:rgba(15,23,42,.66);overflow-wrap:anywhere}

.dc-bg /* Simpler margin target save button (slightly emphasized SaaS style) */
.compactTargetSave{
  background-color: #EEF2FF !important;   /* light indigo */
  color: #0F172A !important;              /* consistent text color */
  border: 1px solid #E0E7FF !important;   /* soft border */
  box-shadow: none !important;
  background-image: none !important;
}

.dc-bg .compactTargetSave:hover{
  background-color: #E0E7FF !important;
  border-color: #C7D2FE !important;
}

@media(max-width:1100px){.dc-bg .insightImpact{max-width:52%}}
@media(max-width:760px){.dc-bg .insightsPad{padding:14px}.dc-bg .insightTop{flex-direction:column;gap:9px}.dc-bg .insightImpact{max-width:100%;width:fit-content}.dc-bg .insightCard{padding:13px}.dc-bg .insightTitle{font-size:14.5px}.dc-bg .insightDetail, .dc-bg .insightRecommendation p{font-size:12.75px}.dc-bg .compactTargetSave{width:auto}}


.dc-bg /* Mobile/tablet horizontal scroll fix for wide dashboard sections */
.dc-bg, .dc-bg .wrap, .dc-bg .grid, .dc-bg .mainCol, .dc-bg .sideStack, .dc-bg .panel, .dc-bg .chartCard, .dc-bg .scalePanel, .dc-bg .jobPage, .dc-bg .reportsManagerPage, .dc-bg .highRiskPage{
  min-width: 0;
}

.dc-bg .tableWrap, .dc-bg .jobDetailPad, .dc-bg .comparisonTableWrap{
  width: 100%;
  max-width: 100%;
  overflow-x: auto !important;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
  scrollbar-width: thin;
}

.dc-bg .tableWrap::-webkit-scrollbar, .dc-bg .jobDetailPad::-webkit-scrollbar, .dc-bg .comparisonTableWrap::-webkit-scrollbar{
  height: 8px;
}

.dc-bg .tableWrap::-webkit-scrollbar-thumb, .dc-bg .jobDetailPad::-webkit-scrollbar-thumb, .dc-bg .comparisonTableWrap::-webkit-scrollbar-thumb{
  border-radius: 999px;
  background: rgba(15, 23, 42, .18);
}

.dc-bg .tableWrap::-webkit-scrollbar-track, .dc-bg .jobDetailPad::-webkit-scrollbar-track, .dc-bg .comparisonTableWrap::-webkit-scrollbar-track{
  background: rgba(15, 23, 42, .04);
}

.dc-bg .jobsTable, .dc-bg .reportsTable, .dc-bg .jobTable, .dc-bg .comparisonTable{
  table-layout: auto;
}

@media(max-width:768px){
  .dc-bg .tableWrap, .dc-bg .jobDetailPad, .dc-bg .comparisonTableWrap{
    border-radius: 0 0 18px 18px;
    cursor: grab;
  }

  .dc-bg .tableWrap::after, .dc-bg .jobDetailPad::after, .dc-bg .comparisonTableWrap::after{
    content: "Swipe sideways to view more →";
    display: block;
    position: sticky;
    left: 0;
    width: fit-content;
    margin: 10px 12px 12px;
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, .08);
    background: rgba(248, 250, 252, .92);
    color: rgba(15, 23, 42, .56);
    font-size: 11.5px;
    font-weight: 900;
    pointer-events: none;
  }

  .dc-bg .jobsTable{ min-width: 920px !important; }
  .dc-bg .reportsTable{ min-width: 1040px !important; }
  .dc-bg .jobTable{ min-width: 1200px !important; }
  .dc-bg .comparisonTable{ min-width: 620px !important; }
}

.dc-bg /* High-risk job alerts spacing cleanup */
.alertList{
  gap: 12px !important;
}

.dc-bg .alertItem.premiumAlert{
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 10px !important;
  padding: 14px !important;
}

.dc-bg .alertItem.premiumAlert > .tag{
  align-self: flex-start;
}

.dc-bg .alertMain{
  width: 100%;
  min-width: 0;
}

.dc-bg .alertName{
  overflow-wrap: anywhere;
}

.dc-bg .alertMeta, .dc-bg .alertIssue, .dc-bg .alertCompareNote{
  overflow-wrap: anywhere;
}

.dc-bg .alertActions{
  gap: 8px;
}

@media(max-width:760px){
  .dc-bg .alertActions .miniBtn{
    width: 100%;
    justify-content: center;
  }
}



/* Dashboard/footer isolation fix */
main.dc-bg{overflow-x:hidden;isolation:isolate;padding-bottom:96px!important;}
main.dc-bg .wrap{padding-bottom:56px;}
@media(max-width:760px){main.dc-bg{padding-bottom:82px;}main.dc-bg .wrap{padding-bottom:40px;}}


/* Dashboard chart mobile stability */
.dc-bg .charts .chartCard canvas{
  height:220px!important;
  min-height:220px;
  max-height:220px;
}
@media (max-width:768px){
  .dc-bg .charts .chartCard canvas{
    height:210px!important;
    min-height:210px;
    max-height:210px;
  }
  .dc-bg .charts{gap:14px;}
  .dc-bg .chartHead{align-items:flex-start;}
}
@media (max-width:480px){
  .dc-bg .charts .chartCard canvas{
    height:200px!important;
    min-height:200px;
    max-height:200px;
  }
}


.dc-bg .creditKpiPanel{margin-top:12px;border-radius:22px;border:1px solid rgba(16,185,129,.16);background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(236,253,245,.72));box-shadow:0 18px 52px rgba(16,185,129,.075);overflow:hidden}
.dc-bg .creditKpiHead{padding:16px 18px;border-bottom:1px solid rgba(16,185,129,.12);display:flex;justify-content:space-between;gap:14px}
.dc-bg .creditKpiTitle{font-size:20px;line-height:1.15;font-weight:980;letter-spacing:-.025em;color:rgba(6,95,70,.98)}
.dc-bg .creditKpiSub{margin-top:5px;font-size:14px;line-height:1.45;font-weight:800;color:rgba(15,23,42,.62);max-width:920px}
.dc-bg .creditKpiGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:16px}
.dc-bg .creditKpiCard{border-radius:18px;border:1px solid rgba(16,185,129,.14);background:rgba(255,255,255,.86);box-shadow:0 12px 32px rgba(2,6,23,.045);padding:14px}
.dc-bg .creditKpiLabel{font-size:11.5px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(6,95,70,.72)}
.dc-bg .creditKpiValue{margin-top:7px;font-size:23px;line-height:1.05;font-weight:990;letter-spacing:-.025em;color:rgba(6,95,70,.98)}
.dc-bg .creditKpiNote{margin-top:7px;font-size:13px;line-height:1.35;font-weight:780;color:rgba(15,23,42,.58)}
.dc-bg .creditAppliedPill{display:inline-flex;align-items:center;width:fit-content;border-radius:999px;border:1px solid rgba(16,185,129,.18);background:rgba(236,253,245,.92);padding:8px 11px;font-size:12.5px;font-weight:950;color:rgba(6,95,70,.98);white-space:nowrap}
.dc-bg .creditMixRow{border-color:rgba(16,185,129,.16)!important;background:rgba(236,253,245,.60)!important}
.dc-bg .creditText{color:rgba(6,95,70,.98)!important}
.dc-bg .reportCreditText{margin-top:4px;font-size:11.5px;font-weight:900;color:rgba(6,95,70,.92)}
@media(max-width:1100px){.dc-bg .creditKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.dc-bg .creditKpiGrid{grid-template-columns:1fr}.dc-bg .creditKpiHead{padding:15px}.dc-bg .creditKpiTitle{font-size:19px}}


/* Credit/adjustment visual de-emphasis + stronger dashboard return CTA */
.dc-bg .creditAppliedPill{
  border-color:rgba(15,23,42,.10)!important;
  background:rgba(248,250,252,.92)!important;
  color:rgba(51,65,85,.88)!important;
  box-shadow:none!important;
}
.dc-bg .creditMixRow{
  border-color:rgba(15,23,42,.075)!important;
  background:rgba(255,255,255,.82)!important;
  box-shadow:none!important;
}
.dc-bg .creditBarFill{opacity:.46!important}
.dc-bg .creditText{color:rgba(51,65,85,.86)!important}
.dc-bg .reportCreditText{color:rgba(71,85,105,.72)!important}
.dc-bg .creditKpiPanel{
  margin-top:12px!important;
  border-radius:22px!important;
  border:1px solid rgba(15,23,42,.085)!important;
  background:rgba(255,255,255,.86)!important;
  box-shadow:0 16px 44px rgba(2,6,23,.055)!important;
  overflow:hidden!important;
}
.dc-bg .creditKpiHead{
  padding:16px 18px!important;
  border-bottom:1px solid rgba(15,23,42,.065)!important;
  background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(248,250,252,.72))!important;
}
.dc-bg .creditKpiTitle{
  font-size:18px!important;
  line-height:1.15!important;
  font-weight:950!important;
  letter-spacing:-.02em!important;
  color:rgba(15,23,42,.92)!important;
}
.dc-bg .creditKpiSub{
  margin-top:5px!important;
  font-size:13.5px!important;
  line-height:1.45!important;
  font-weight:780!important;
  color:rgba(15,23,42,.58)!important;
  max-width:920px!important;
}
.dc-bg .creditKpiGrid{
  display:grid!important;
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  gap:12px!important;
  padding:16px!important;
}
.dc-bg .creditKpiCard{
  border-radius:18px!important;
  border:1px solid rgba(15,23,42,.075)!important;
  background:rgba(248,250,252,.70)!important;
  box-shadow:none!important;
  padding:14px!important;
}
.dc-bg .creditKpiLabel{
  font-size:11px!important;
  text-transform:uppercase!important;
  letter-spacing:.075em!important;
  font-weight:950!important;
  color:rgba(71,85,105,.66)!important;
}
.dc-bg .creditKpiValue{
  margin-top:7px!important;
  font-size:21px!important;
  line-height:1.05!important;
  font-weight:980!important;
  letter-spacing:-.02em!important;
  color:rgba(15,23,42,.92)!important;
}
.dc-bg .creditKpiNote{
  margin-top:7px!important;
  font-size:12.5px!important;
  line-height:1.35!important;
  font-weight:760!important;
  color:rgba(15,23,42,.52)!important;
}
.dc-bg .dashboardBackBtn{
  border-color:rgba(124,58,237,.26)!important;
  background:linear-gradient(90deg,rgba(124,58,237,.12),rgba(34,211,238,.10))!important;
  color:rgba(15,23,42,.96)!important;
  box-shadow:0 12px 30px rgba(124,58,237,.10)!important;
  animation:dashboardBackBtnNudge 3.8s ease-in-out infinite;
}
.dc-bg .dashboardBackBtn:hover{
  transform:translateY(-1px)!important;
  border-color:rgba(124,58,237,.36)!important;
  box-shadow:0 16px 38px rgba(124,58,237,.16)!important;
}
@keyframes dashboardBackBtnNudge{
  0%,72%,100%{transform:translateY(0)}
  80%{transform:translateY(-1px)}
  88%{transform:translateY(0)}
}
@media(max-width:1100px){.dc-bg .creditKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:760px){.dc-bg .creditKpiGrid{grid-template-columns:1fr!important}.dc-bg .creditAppliedPill{white-space:normal;line-height:1.25}.dc-bg .dashboardBackBtn{width:fit-content;max-width:100%}}
@media (hover:none) and (pointer:coarse){.dc-bg .dashboardBackBtn{animation:none}.dc-bg .dashboardBackBtn:hover{transform:none!important}}


/* Enterprise wow layer: recoverable profit + action queue + basic benchmarking */
.dc-bg .wowCenter{margin-top:12px;border-color:rgba(124,58,237,.12);background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(248,250,252,.92));box-shadow:0 26px 80px rgba(2,6,23,.09)}
.dc-bg .wowTop{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:18px 18px 4px;flex-wrap:wrap}.dc-bg .wowTitle{margin-top:5px;font-size:28px;line-height:1.05;font-weight:990;letter-spacing:-.04em;color:rgba(15,23,42,.96)}.dc-bg .wowSub{margin-top:8px;max-width:820px;color:rgba(15,23,42,.62);font-size:14px;line-height:1.5;font-weight:780}.dc-bg .wowActions{display:flex;gap:10px;flex-wrap:wrap}.dc-bg .subtlePrimaryBtn{background:linear-gradient(90deg,rgba(34,211,238,.12),rgba(124,58,237,.12));border-color:rgba(124,58,237,.18)}
.dc-bg .wowHeroGrid{display:grid;grid-template-columns:minmax(300px,.9fr) minmax(340px,1.15fr) minmax(340px,1fr);gap:14px;padding:14px 18px 18px}.dc-bg .wowRecoveryCard,.dc-bg .wowActionCard,.dc-bg .wowBenchmarkCard{border-radius:22px;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.90);box-shadow:0 14px 44px rgba(2,6,23,.055);padding:16px;min-width:0}.dc-bg .wowRecoveryCard{background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(240,249,255,.88));border-left:5px solid rgba(124,58,237,.82)}.dc-bg .wowKicker{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:980;color:rgba(15,23,42,.48)}.dc-bg .wowRecoveryValue{margin-top:8px;font-size:39px;line-height:1;font-weight:990;letter-spacing:-.055em;color:rgba(15,23,42,.94)}.dc-bg .warnText{color:rgba(180,83,9,.98)!important}.dc-bg .wowRecoverySub{margin-top:8px;color:rgba(15,23,42,.60);font-size:13px;line-height:1.4;font-weight:780}.dc-bg .wowRecoveryStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.dc-bg .wowRecoveryStats div{border-radius:15px;border:1px solid rgba(15,23,42,.06);background:rgba(255,255,255,.78);padding:10px}.dc-bg .wowRecoveryStats span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.45)}.dc-bg .wowRecoveryStats strong{display:block;margin-top:4px;font-size:15px;font-weight:990;color:rgba(15,23,42,.90)}
.dc-bg .wowPrimaryJob{width:100%;margin-top:12px;text-align:left;border:1px solid rgba(124,58,237,.16);background:rgba(255,255,255,.78);border-radius:16px;padding:11px 12px;cursor:pointer;display:grid;gap:3px;transition:transform .1s ease,box-shadow .14s ease}.dc-bg .wowPrimaryJob:hover{transform:translateY(-1px);box-shadow:0 16px 38px rgba(124,58,237,.12)}.dc-bg .wowPrimaryJob span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(124,58,237,.75)}.dc-bg .wowPrimaryJob strong{font-size:13.5px;color:rgba(15,23,42,.92);font-weight:950}.dc-bg .wowPrimaryJob em{font-style:normal;font-size:12px;color:rgba(15,23,42,.55);font-weight:850}.dc-bg .wowCardHead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}.dc-bg .wowCardTitle{margin-top:4px;font-size:17px;font-weight:980;letter-spacing:-.025em;color:rgba(15,23,42,.92)}
.dc-bg .wowActionList{display:flex;flex-direction:column;gap:8px}.dc-bg .wowActionItem{width:100%;border:1px solid rgba(15,23,42,.06);background:rgba(248,250,252,.72);border-radius:16px;padding:10px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;text-align:left;align-items:center;cursor:pointer;transition:background .12s ease,transform .1s ease,box-shadow .14s ease}.dc-bg .wowActionItem:hover{background:#fff;transform:translateY(-1px);box-shadow:0 14px 34px rgba(2,6,23,.07)}.dc-bg .wowActionRank{width:34px;height:34px;border-radius:12px;background:rgba(124,58,237,.10);color:rgba(91,33,182,.96);display:flex;align-items:center;justify-content:center;font-weight:990;font-size:12px}.dc-bg .wowActionBody{min-width:0}.dc-bg .wowActionName{font-weight:960;color:rgba(15,23,42,.94);font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dc-bg .wowActionIssue{margin-top:2px;color:rgba(15,23,42,.58);font-size:12px;line-height:1.35;font-weight:760}.dc-bg .wowActionMeta{margin-top:4px;color:rgba(15,23,42,.42);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.dc-bg .wowActionImpact{font-size:13px;font-weight:990;color:rgba(180,83,9,.98);white-space:nowrap}.dc-bg .wowEmpty{border-radius:16px;border:1px dashed rgba(15,23,42,.14);background:rgba(255,255,255,.58);padding:14px;text-align:center;color:rgba(15,23,42,.55);font-weight:850;font-size:13px}
.dc-bg .wowBenchmarkGrid{display:grid;grid-template-columns:1fr;gap:8px}.dc-bg .wowBenchmarkItem{border:1px solid rgba(15,23,42,.06);background:rgba(248,250,252,.72);border-radius:15px;padding:10px;display:flex;justify-content:space-between;gap:10px;align-items:center}.dc-bg .wowBenchmarkLabel{font-size:12.5px;font-weight:950;color:rgba(15,23,42,.86)}.dc-bg .wowBenchmarkNote{margin-top:3px;color:rgba(15,23,42,.48);font-size:11.5px;font-weight:760}.dc-bg .wowBenchmarkItem strong{font-size:14px;font-weight:990;white-space:nowrap}.dc-bg .wowBenchmarkItem strong.ok{color:rgba(5,150,105,.95)}.dc-bg .wowBenchmarkItem strong.warn{color:rgba(180,83,9,.98)}.dc-bg .wowBenchmarkItem strong.bad{color:rgba(220,38,38,.95)}.dc-bg .wowCostStrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:0 18px 18px}.dc-bg .wowCostStrip div{border-radius:16px;border:1px solid rgba(15,23,42,.06);background:rgba(255,255,255,.72);padding:11px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px}.dc-bg .wowCostStrip span{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;font-weight:950;color:rgba(15,23,42,.48)}.dc-bg .wowCostStrip strong{font-size:14px;font-weight:990;color:rgba(15,23,42,.86)}
@media(max-width:1250px){.dc-bg .wowHeroGrid{grid-template-columns:1fr 1fr}.dc-bg .wowBenchmarkCard{grid-column:1/-1}.dc-bg .wowBenchmarkGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:820px){.dc-bg .wowTop{padding:14px 14px 2px}.dc-bg .wowTitle{font-size:22px}.dc-bg .wowHeroGrid{grid-template-columns:1fr;padding:12px 14px 14px}.dc-bg .wowRecoveryValue{font-size:32px}.dc-bg .wowBenchmarkGrid{grid-template-columns:1fr}.dc-bg .wowCostStrip{grid-template-columns:1fr 1fr;padding:0 14px 14px}.dc-bg .wowActionItem{grid-template-columns:auto minmax(0,1fr);align-items:flex-start}.dc-bg .wowActionImpact{grid-column:2/-1}}
@media(max-width:560px){.dc-bg .wowCostStrip{grid-template-columns:1fr}.dc-bg .wowRecoveryStats{grid-template-columns:1fr}.dc-bg .wowTop{display:block}.dc-bg .wowActions{margin-top:12px}.dc-bg .wowActions .btn{width:100%;justify-content:center}.dc-bg .wowActionItem{grid-template-columns:1fr}.dc-bg .wowActionRank{width:fit-content;padding:0 10px}.dc-bg .wowActionImpact{grid-column:auto}}


.dc-bg .profitCommandPanel{
  margin-top:12px;
  border-radius:24px;
  border:1px solid rgba(15,23,42,.07);
  background:
    radial-gradient(700px 240px at 0% 0%,rgba(34,211,238,.13),transparent 58%),
    radial-gradient(680px 260px at 100% 0%,rgba(124,58,237,.11),transparent 58%),
    rgba(255,255,255,.90);
  box-shadow:0 20px 64px rgba(2,6,23,.075);
  overflow:hidden;
}
.dc-bg .profitCommandHeader{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:14px;
  padding:16px;
  border-bottom:1px solid rgba(15,23,42,.06);
}
.dc-bg .profitCommandTitle{
  margin-top:4px;
  font-size:24px;
  line-height:1.08;
  font-weight:990;
  letter-spacing:-.035em;
  color:rgba(15,23,42,.95);
}
.dc-bg .profitCommandSub{
  margin-top:7px;
  max-width:820px;
  font-size:13.5px;
  line-height:1.45;
  font-weight:760;
  color:rgba(15,23,42,.58);
}
.dc-bg .profitCommandBadge{
  display:inline-flex;
  align-items:center;
  gap:8px;
  white-space:nowrap;
  border-radius:999px;
  border:1px solid rgba(15,23,42,.08);
  background:rgba(255,255,255,.76);
  padding:9px 12px;
  font-size:12px;
  font-weight:950;
  color:rgba(15,23,42,.72);
}
.dc-bg .profitCommandCards{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
  padding:14px 16px 0;
}
.dc-bg .profitCommandCard{
  border-radius:18px;
  border:1px solid rgba(15,23,42,.07);
  background:rgba(255,255,255,.82);
  padding:12px;
  box-shadow:0 10px 28px rgba(2,6,23,.045);
}
.dc-bg .profitCommandCard.warn{border-color:rgba(245,158,11,.18);background:rgba(255,251,235,.70)}
.dc-bg .profitCommandCard.ok{border-color:rgba(16,185,129,.16);background:rgba(240,253,250,.70)}
.dc-bg .profitCommandLabel{
  font-size:10.5px;
  text-transform:uppercase;
  letter-spacing:.07em;
  font-weight:950;
  color:rgba(15,23,42,.48);
}
.dc-bg .profitCommandValue{
  margin-top:7px;
  font-size:23px;
  line-height:1;
  font-weight:990;
  letter-spacing:-.025em;
  color:rgba(15,23,42,.94);
}
.dc-bg .profitCommandNote{
  margin-top:7px;
  font-size:12.5px;
  line-height:1.35;
  font-weight:760;
  color:rgba(15,23,42,.56);
}
.dc-bg .profitCommandBody{
  display:grid;
  grid-template-columns:minmax(0,1.4fr) minmax(280px,.6fr);
  gap:12px;
  padding:14px 16px 16px;
}
.dc-bg .profitCommandActions,.dc-bg .profitCommandBenchmark{
  border-radius:18px;
  border:1px solid rgba(15,23,42,.06);
  background:rgba(255,255,255,.76);
  padding:12px;
}
.dc-bg .profitCommandSectionTitle{
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.07em;
  font-weight:950;
  color:rgba(15,23,42,.52);
  margin-bottom:9px;
}
.dc-bg .profitCommandAction{
  display:grid;
  grid-template-columns:30px minmax(0,1fr) auto;
  gap:10px;
  align-items:center;
  border-radius:15px;
  border:1px solid rgba(15,23,42,.055);
  background:rgba(248,250,252,.78);
  padding:10px;
}
.dc-bg .profitCommandAction + .profitCommandAction{margin-top:8px}
.dc-bg .profitCommandStep{
  width:30px;height:30px;
  display:grid;place-items:center;
  border-radius:999px;
  background:linear-gradient(135deg,rgba(34,211,238,.18),rgba(124,58,237,.16));
  font-size:12px;
  font-weight:990;
  color:rgba(15,23,42,.78);
}
.dc-bg .profitCommandActionText strong{
  display:block;
  font-size:13.5px;
  line-height:1.25;
  color:rgba(15,23,42,.92);
}
.dc-bg .profitCommandActionText span{
  display:block;
  margin-top:3px;
  font-size:12.5px;
  line-height:1.35;
  font-weight:760;
  color:rgba(15,23,42,.56);
}
.dc-bg .benchmarkMiniRows{display:grid;gap:8px}
.dc-bg .benchmarkMiniRows div{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.055);
  background:rgba(248,250,252,.78);
  padding:10px;
}
.dc-bg .benchmarkMiniRows span{font-size:12px;font-weight:850;color:rgba(15,23,42,.56)}
.dc-bg .benchmarkMiniRows strong{font-size:13.5px;font-weight:990;color:rgba(15,23,42,.90)}
@media(max-width:980px){
  .dc-bg .profitCommandCards{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dc-bg .profitCommandBody{grid-template-columns:1fr}
}

@media(max-width:1100px){.dc-bg .allJobsSubtotalGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.dc-bg .allJobsToolbarPad{flex-direction:column;align-items:stretch}.dc-bg .allJobsToolbarPad .wideSearch{min-width:0;width:100%}.dc-bg .allJobsSubtotalGrid{grid-template-columns:1fr 1fr}.dc-bg .allJobsStackItemHead{align-items:flex-start;flex-direction:column}.dc-bg .stackedJobActions{align-items:flex-start;flex-direction:column}.dc-bg .stackedJobActions .buttonRow{justify-content:flex-start}}

@media(max-width:640px){
  .dc-bg .profitCommandHeader{flex-direction:column}
  .dc-bg .profitCommandBadge{width:100%;justify-content:center}
  .dc-bg .profitCommandCards{grid-template-columns:1fr}
  .dc-bg .profitCommandAction{grid-template-columns:28px minmax(0,1fr)}
  .dc-bg .profitCommandAction .miniBtn{grid-column:1/-1;width:100%;justify-content:center}
  .dc-bg .profitCommandTitle{font-size:21px}
}



/* Enterprise risk queue redesign */
.dc-bg .enterpriseRiskPage{display:flex;flex-direction:column;gap:14px;margin-top:12px}
.dc-bg .riskCommandHero{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.52fr);gap:16px;align-items:end;padding:18px;border-bottom:1px solid rgba(15,23,42,.06)}
.dc-bg .riskCommandTitle{margin-top:6px;font-size:28px;line-height:1.05;font-weight:990;letter-spacing:-.035em;color:rgba(15,23,42,.96)}
.dc-bg .riskCommandSub{margin-top:8px;max-width:860px;font-size:15px;line-height:1.5;font-weight:780;color:rgba(15,23,42,.62)}
.dc-bg .riskSearchControls{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.dc-bg .riskSearchControls .searchInput{min-width:260px;flex:1}
.dc-bg .riskSummaryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:16px 18px 18px}
.dc-bg .riskSummaryCard{border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.86);border-radius:18px;padding:14px;box-shadow:0 10px 28px rgba(2,6,23,.045)}
.dc-bg .riskSummaryCard span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.52)}
.dc-bg .riskSummaryCard strong{display:block;margin-top:7px;font-size:23px;line-height:1;font-weight:990;color:rgba(15,23,42,.94)}
.dc-bg .riskSummaryCard em{display:block;margin-top:8px;font-style:normal;font-size:12.5px;font-weight:800;color:rgba(15,23,42,.56)}
.dc-bg .riskTablePanel{overflow:hidden}.dc-bg .riskQueueList{display:flex;flex-direction:column;gap:10px;padding:14px}
.dc-bg .riskQueueCard{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:14px;align-items:start;border:1px solid rgba(15,23,42,.075);background:rgba(255,255,255,.90);border-radius:20px;padding:14px;box-shadow:0 12px 30px rgba(2,6,23,.045)}
.dc-bg .riskQueueCard.critical{border-left:4px solid rgba(239,68,68,.70)}.dc-bg .riskQueueCard.warning{border-left:4px solid rgba(245,158,11,.70)}
.dc-bg .riskRank{width:38px;height:38px;border-radius:14px;display:grid;place-items:center;background:rgba(124,58,237,.10);color:rgba(91,33,182,.95);font-weight:990;font-size:13px}
.dc-bg .riskTitleRow{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.dc-bg .riskJobName{font-size:17px;line-height:1.15;font-weight:990;color:rgba(15,23,42,.96)}.dc-bg .riskJobMeta{margin-top:5px;font-size:12.5px;font-weight:800;color:rgba(15,23,42,.56)}
.dc-bg .riskMetricGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.dc-bg .riskMetricGrid div{border:1px solid rgba(15,23,42,.06);background:rgba(248,250,252,.82);border-radius:14px;padding:10px}.dc-bg .riskMetricGrid span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.48)}.dc-bg .riskMetricGrid strong{display:block;margin-top:4px;font-size:14.5px;font-weight:990;color:rgba(15,23,42,.90)}
.dc-bg .riskInsightBox{margin-top:10px;border-radius:14px;border:1px solid rgba(34,211,238,.14);background:linear-gradient(135deg,rgba(240,253,250,.70),rgba(255,255,255,.88));padding:10px 12px;font-size:13px;line-height:1.45;font-weight:780;color:rgba(15,23,42,.66)}.dc-bg .riskInsightBox strong{color:rgba(15,23,42,.92)}
.dc-bg .riskActions{display:flex;flex-direction:column;gap:8px;min-width:150px}.dc-bg .riskActions .btn{justify-content:center;white-space:nowrap}
.dc-bg .emailCardTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.dc-bg .emailRecipientList{margin-top:12px;border-radius:16px;border:1px solid rgba(15,23,42,.075);background:rgba(248,250,252,.78);padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.dc-bg .emailRecipientLabel{width:100%;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.48)}.dc-bg .emailRecipientPill{display:inline-flex;align-items:center;border-radius:999px;border:1px solid rgba(15,23,42,.09);background:#fff;padding:7px 10px;font-size:12px;font-weight:900;color:rgba(15,23,42,.78)}.dc-bg .emailRecipientPill.muted{color:rgba(15,23,42,.45)}
.dc-bg .emailEditBox{margin-top:12px;border-radius:16px;border:1px solid rgba(34,211,238,.16);background:rgba(255,255,255,.88);padding:10px}.dc-bg .emailEditLabel{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;font-weight:950;color:rgba(15,23,42,.50);margin-bottom:7px}.dc-bg .emailEditTextarea{width:100%;min-height:86px;resize:vertical;border:1px solid rgba(15,23,42,.12);border-radius:14px;padding:10px;font-weight:850;color:#0f172a;outline:none}.dc-bg .emailEditTextarea:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.16)}.dc-bg .emailEditHelp{margin-top:7px;font-size:12px;font-weight:750;color:rgba(15,23,42,.52)}.dc-bg .emailEditActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
@media(max-width:1100px){.dc-bg .riskCommandHero{grid-template-columns:1fr}.dc-bg .riskSearchControls{justify-content:flex-start}.dc-bg .riskSummaryGrid{grid-template-columns:1fr 1fr}.dc-bg .riskQueueCard{grid-template-columns:42px minmax(0,1fr)}}
@media(max-width:760px){.dc-bg .riskSummaryGrid,.dc-bg .riskMetricGrid{grid-template-columns:1fr}.dc-bg .riskQueueCard{grid-template-columns:1fr}.dc-bg .riskRank{width:fit-content;padding:0 12px}.dc-bg .riskActions{min-width:0;width:100%}.dc-bg .riskTitleRow{flex-direction:column}.dc-bg .riskSearchControls .searchInput{min-width:0;width:100%}}

/* Scale Profit Control Center premium redesign */
.dc-bg .scaleInsanePanel{
  position:relative;
  overflow:hidden;
  border-color:rgba(124,58,237,.16)!important;
  background:
    radial-gradient(900px 420px at 3% 8%,rgba(124,58,237,.105),transparent 58%),
    radial-gradient(780px 420px at 78% 0%,rgba(34,211,238,.11),transparent 60%),
    linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.90))!important;
  box-shadow:0 28px 90px rgba(2,6,23,.12)!important;
}
.dc-bg .scaleInsanePanel::before{
  content:"";
  position:absolute;
  left:0;right:0;top:0;height:3px;
  background:linear-gradient(90deg,#7c3aed,#22d3ee,#10b981);
  opacity:.88;
}
.dc-bg .premiumScaleHead{position:relative;z-index:2;background:rgba(255,255,255,.78)!important;backdrop-filter:blur(12px)}
.dc-bg .scaleExecutiveGrid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(300px,.92fr) minmax(420px,1.18fr) minmax(320px,.92fr);gap:16px;padding:18px}
.dc-bg .scaleRecoveryCommand,.dc-bg .scaleActionQueueCard,.dc-bg .scaleBenchmarkCard{
  position:relative;
  min-width:0;
  border:1px solid rgba(15,23,42,.08);
  border-radius:22px;
  background:rgba(255,255,255,.88);
  box-shadow:0 16px 45px rgba(2,6,23,.07);
  padding:18px;
  overflow:hidden;
}
.dc-bg .scaleRecoveryCommand{min-height:360px;border-left:5px solid rgba(124,58,237,.78);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(240,249,255,.82))}
.dc-bg .scaleCommandAura{position:absolute;right:-90px;bottom:-90px;width:230px;height:230px;border-radius:999px;background:radial-gradient(circle,rgba(34,211,238,.18),transparent 66%);pointer-events:none}
.dc-bg .scaleRecoveryValue{margin-top:8px;font-size:clamp(28px,2.4vw,34px);line-height:1.02;font-weight:990;letter-spacing:-.045em;color:rgba(15,23,42,.94)}
.dc-bg .warnText{color:rgba(180,83,9,.98)!important}
.dc-bg .scaleRecoverySub{margin-top:10px;font-size:14px;line-height:1.5;font-weight:820;color:rgba(15,23,42,.62)}
.dc-bg .scaleRecoveryStats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.dc-bg .scaleRecoveryStats div{border:1px solid rgba(15,23,42,.07);border-radius:16px;background:rgba(255,255,255,.76);padding:11px}
.dc-bg .scaleRecoveryStats span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(15,23,42,.48)}
.dc-bg .scaleRecoveryStats strong{display:block;margin-top:5px;font-size:17px;font-weight:990;color:rgba(15,23,42,.94)}
.dc-bg .scaleTopOpportunity{position:relative;width:100%;margin-top:16px;text-align:left;border-radius:18px;border:1px solid rgba(124,58,237,.18);background:rgba(255,255,255,.86);padding:13px 14px;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}
.dc-bg .scaleTopOpportunity:hover{transform:translateY(-1px);box-shadow:0 16px 36px rgba(124,58,237,.12);border-color:rgba(124,58,237,.30)}
.dc-bg .scaleTopOpportunity span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(124,58,237,.78)}
.dc-bg .scaleTopOpportunity strong{display:block;margin-top:5px;font-size:14px;font-weight:990;color:rgba(15,23,42,.94)}
.dc-bg .scaleTopOpportunity em{display:block;margin-top:6px;font-size:12.5px;font-style:normal;font-weight:900;color:rgba(15,23,42,.58)}
.dc-bg .scaleCardHeadSplit{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.dc-bg .scaleQueueTitle{margin-top:4px;font-size:19px;line-height:1.1;font-weight:990;letter-spacing:-.025em;color:rgba(15,23,42,.94)}
.dc-bg .scaleQueueList{display:flex;flex-direction:column;gap:10px}
.dc-bg .scaleQueueItem{width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:12px;align-items:center;text-align:left;border-radius:18px;border:1px solid rgba(15,23,42,.075);background:rgba(248,250,252,.76);padding:12px;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease,background .12s ease}
.dc-bg .scaleQueueItem:hover{transform:translateY(-1px);box-shadow:0 16px 36px rgba(2,6,23,.08);border-color:rgba(34,211,238,.22);background:rgba(255,255,255,.95)}
.dc-bg .scaleQueueRank{width:34px;height:34px;border-radius:14px;display:grid;place-items:center;background:rgba(124,58,237,.11);color:rgba(91,33,182,.96);font-weight:990;font-size:12px}
.dc-bg .scaleQueueName{font-size:14.5px;font-weight:990;color:rgba(15,23,42,.94);line-height:1.15}
.dc-bg .scaleQueueIssue{margin-top:4px;font-size:12.5px;line-height:1.35;font-weight:780;color:rgba(15,23,42,.58)}
.dc-bg .scaleQueueMeta{margin-top:5px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:950;color:rgba(15,23,42,.44)}
.dc-bg .scaleQueueImpact{white-space:nowrap;font-size:13px;font-weight:990;color:rgba(180,83,9,.98)}
.dc-bg .scaleBenchmarkRows{display:flex;flex-direction:column;gap:10px}
.dc-bg .scaleBenchmarkRow{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid rgba(15,23,42,.07);border-radius:16px;background:rgba(248,250,252,.80);padding:11px 12px}
.dc-bg .scaleBenchmarkLabel{font-size:13px;font-weight:990;color:rgba(15,23,42,.92)}
.dc-bg .scaleBenchmarkNote{margin-top:3px;font-size:12px;line-height:1.32;font-weight:760;color:rgba(15,23,42,.55)}
.dc-bg .scaleBenchmarkRow strong{font-size:14px;font-weight:990;white-space:nowrap}.dc-bg .scaleBenchmarkRow strong.ok{color:rgba(5,150,105,.98)}.dc-bg .scaleBenchmarkRow strong.warn{color:rgba(180,83,9,.98)}.dc-bg .scaleBenchmarkRow strong.bad{color:rgba(220,38,38,.96)}
.dc-bg .scaleIntelligenceStrip{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);gap:16px;padding:0 18px 18px}
.dc-bg .scaleInsightNarrative,.dc-bg .scaleCostRadar{border-radius:22px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.86);box-shadow:0 14px 40px rgba(2,6,23,.055);padding:16px}
.dc-bg .scaleInsightTitle{margin-top:5px;font-size:23px;line-height:1.08;font-weight:990;letter-spacing:-.035em;color:rgba(15,23,42,.96)}
.dc-bg .scaleInsightText{margin-top:8px;font-size:14px;line-height:1.5;font-weight:800;color:rgba(15,23,42,.62)}
.dc-bg .scaleInsightProgress{margin-top:16px;border-radius:18px;border:1px solid rgba(34,211,238,.14);background:linear-gradient(135deg,rgba(240,253,250,.72),rgba(255,255,255,.92));padding:12px}
.dc-bg .scaleInsightProgressTop{display:flex;justify-content:space-between;gap:10px;font-size:12px;font-weight:900;color:rgba(15,23,42,.58)}.dc-bg .scaleInsightProgressTop strong{color:rgba(5,150,105,.98)}
.dc-bg .scaleProgressTrack,.dc-bg .costRadarTrack{height:8px;margin-top:9px;border-radius:999px;background:rgba(15,23,42,.07);overflow:hidden}.dc-bg .scaleProgressFill,.dc-bg .costRadarFill{height:100%;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#22d3ee)}
.dc-bg .costRadarRows{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.dc-bg .costRadarRow{border:1px solid rgba(15,23,42,.06);border-radius:16px;background:rgba(248,250,252,.76);padding:10px}.dc-bg .costRadarTop{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:950;color:rgba(15,23,42,.70)}.dc-bg .costRadarAmount{margin-top:6px;font-size:12px;font-weight:850;color:rgba(15,23,42,.52)}
.dc-bg .scalePremiumGrid{display:grid;grid-template-columns:minmax(340px,.95fr) minmax(360px,1.05fr) minmax(280px,.65fr);gap:16px;padding:0 18px 18px}.dc-bg .premiumEmailCard,.dc-bg .premiumLeakCard,.dc-bg .premiumRulesCard{border-radius:22px!important;border-color:rgba(15,23,42,.08)!important;background:rgba(255,255,255,.88)!important;box-shadow:0 14px 40px rgba(2,6,23,.055)!important}.dc-bg .premiumLeakList{display:flex;flex-direction:column;gap:10px;margin-top:12px}.dc-bg .premiumLeakRow{border-radius:16px;border:1px solid rgba(15,23,42,.07);background:rgba(248,250,252,.76);padding:11px}.dc-bg .premiumLeakTop{display:flex;justify-content:space-between;gap:10px}.dc-bg .premiumLeakName{font-size:13.5px;font-weight:990;color:rgba(15,23,42,.92)}.dc-bg .premiumLeakMeta{margin-top:3px;font-size:12px;font-weight:800;color:rgba(15,23,42,.52)}.dc-bg .premiumLeakAmount{font-size:13.5px;font-weight:990;white-space:nowrap}.dc-bg .premiumLeakAmount.ok{color:rgba(5,150,105,.98)}.dc-bg .premiumLeakAmount.warn{color:rgba(180,83,9,.98)}.dc-bg .premiumLeakAmount.bad{color:rgba(220,38,38,.96)}.dc-bg .premiumLeakFix{margin-top:8px;font-size:12.25px;line-height:1.4;font-weight:760;color:rgba(15,23,42,.58)}.dc-bg .premiumReviewBtn{width:100%;justify-content:center;margin-top:14px}
@media(max-width:1350px){.dc-bg .scaleExecutiveGrid{grid-template-columns:1fr}.dc-bg .scaleRecoveryCommand{min-height:0}.dc-bg .scaleIntelligenceStrip,.dc-bg .scalePremiumGrid{grid-template-columns:1fr 1fr}.dc-bg .premiumRulesCard{grid-column:1/-1}}
@media(max-width:900px){.dc-bg .scaleIntelligenceStrip,.dc-bg .scalePremiumGrid{grid-template-columns:1fr}.dc-bg .scaleRecoveryStats,.dc-bg .costRadarRows{grid-template-columns:1fr 1fr}.dc-bg .scaleQueueItem{grid-template-columns:38px minmax(0,1fr)}}
@media(max-width:640px){.dc-bg .scaleExecutiveGrid,.dc-bg .scaleIntelligenceStrip,.dc-bg .scalePremiumGrid{padding-left:14px;padding-right:14px;gap:12px}.dc-bg .scaleRecoveryValue{font-size:28px}.dc-bg .scaleQueueItem{grid-template-columns:1fr}.dc-bg .scaleQueueRank{width:fit-content;padding:0 12px}.dc-bg .scaleQueueImpact{justify-self:start}.dc-bg .scaleRecoveryStats,.dc-bg .costRadarRows{grid-template-columns:1fr}.dc-bg .scaleCardHeadSplit,.dc-bg .premiumScaleHead{flex-direction:column}.dc-bg .scaleHeadRight{justify-content:flex-start}}


/* Compact top-right margin target + universal button hover polish */
.dc-bg .topbarRight{display:flex;flex-direction:column;align-items:flex-end;gap:10px;min-width:0}
.dc-bg .topbarRight .statusRow{justify-content:flex-end}
.dc-bg .topbarRight .marginTargetTopWrap{margin:0!important;width:auto;max-width:100%;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:10px!important;border-radius:999px!important;border:1px solid rgba(34,211,238,.16)!important;background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(240,253,250,.76))!important;box-shadow:0 10px 28px rgba(2,6,23,.055)!important;padding:8px 10px!important}
.dc-bg .topbarRight .marginTargetTopText{display:flex;align-items:center;gap:8px;min-width:0}
.dc-bg .topbarRight .marginTargetTopKicker{font-size:11px!important;letter-spacing:.07em!important;white-space:nowrap;margin:0!important;color:rgba(8,145,178,.84)!important}
.dc-bg .topbarRight .marginTargetTopTitle,.dc-bg .topbarRight .marginTargetTopSub{display:none!important}
.dc-bg .topbarRight .marginTargetCurrent{font-size:11.5px!important;font-weight:950!important;color:rgba(15,23,42,.56)!important;white-space:nowrap;width:auto!important}
.dc-bg .topbarRight .marginTargetTopControls{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;flex-wrap:nowrap!important;flex:0 0 auto!important}
.dc-bg .topbarRight .compactTargetInputGroup{padding:6px 9px!important;border-radius:999px!important;box-shadow:0 8px 18px rgba(2,6,23,.035)!important}
.dc-bg .topbarRight .compactTargetInput{width:44px!important;font-size:14px!important}
.dc-bg .topbarRight .compactTargetSave{padding:8px 11px!important;border-radius:999px!important;font-size:12px!important;background:linear-gradient(135deg,rgba(34,211,238,.12),rgba(124,58,237,.10))!important;border-color:rgba(34,211,238,.24)!important}
.dc-bg .btn,.dc-bg .miniBtn,.dc-bg .btn-mini,.dc-bg .rangeBtn,.dc-bg .crumbBtn,.dc-bg .deleteReportBtn,.dc-bg .reportMoreLink,.dc-bg .reportsManageLink,.dc-bg .emailPauseLink,.dc-bg .scaleQueueItem,.dc-bg .scaleTopOpportunity,.dc-bg .wowActionItem,.dc-bg .wowPrimaryJob,.dc-bg .riskQueueCard button,.dc-bg .lockedScaleActions a,.dc-bg .lockedScaleActions button{transition:transform .12s ease,box-shadow .14s ease,background .14s ease,border-color .14s ease,color .14s ease,opacity .14s ease!important}
.dc-bg .miniBtn:hover,.dc-bg .btn-mini:hover,.dc-bg .rangeBtn:hover,.dc-bg .crumbBtn:hover,.dc-bg .deleteReportBtn:hover,.dc-bg .reportMoreLink:hover,.dc-bg .reportsManageLink:hover,.dc-bg .emailPauseLink:hover{transform:translateY(-1px)!important;box-shadow:0 12px 28px rgba(2,6,23,.10)!important;border-color:rgba(34,211,238,.24)!important;background:rgba(255,255,255,.96)!important}
.dc-bg .rangeBtn:hover{background:rgba(248,250,252,.98)!important;color:rgba(15,23,42,.94)!important}
.dc-bg .rangeBtn.active:hover{background:#0f172a!important;color:#fff!important;box-shadow:0 16px 36px rgba(15,23,42,.18)!important}
.dc-bg .scaleQueueItem:hover,.dc-bg .scaleTopOpportunity:hover,.dc-bg .wowActionItem:hover,.dc-bg .wowPrimaryJob:hover{transform:translateY(-1px)!important;box-shadow:0 16px 36px rgba(2,6,23,.10)!important;border-color:rgba(34,211,238,.22)!important}
.dc-bg button:disabled,.dc-bg .btn:disabled{cursor:not-allowed!important;opacity:.55!important}
.dc-bg button:disabled:hover,.dc-bg .btn:disabled:hover{transform:none!important;box-shadow:none!important}
@media(max-width:900px){.dc-bg .topbar{align-items:flex-start!important}.dc-bg .topbarRight{width:100%;align-items:flex-start}.dc-bg .topbarRight .statusRow{justify-content:flex-start}.dc-bg .topbarRight .marginTargetTopWrap{justify-content:flex-start!important}}
@media(max-width:560px){.dc-bg .topbarRight .statusRow{width:100%;display:grid!important;grid-template-columns:1fr 1fr;gap:8px}.dc-bg .topbarRight .statusRow .pill,.dc-bg .topbarRight .statusRow .btn,.dc-bg .topbarRight .statusRow .uploadPulseBtn{width:100%;justify-content:center}.dc-bg .topbarRight .marginTargetTopWrap{width:100%;border-radius:18px!important;align-items:flex-start!important;flex-direction:column!important}.dc-bg .topbarRight .marginTargetTopText{width:100%;justify-content:space-between}.dc-bg .topbarRight .marginTargetTopControls{width:100%;display:grid!important;grid-template-columns:minmax(0,1fr) auto}.dc-bg .topbarRight .compactTargetInputGroup{justify-content:center}.dc-bg .topbarRight .compactTargetSave{justify-content:center}.dc-bg .topbarRight .compactTargetInput{width:100%!important;max-width:80px}}


/* Dashboard title descender fix: gives the gradient headline enough paint room without changing the desktop/tablet/mobile font sizing. */
.dc-bg .dashboardIntro{
  overflow:visible!important;
  padding-bottom:2px!important;
}
.dc-bg .pageTitle{
  display:block!important;
  overflow:visible!important;
  contain:none!important;
  line-height:1.18!important;
  padding-bottom:6px!important;
  margin-bottom:-2px!important;
}
.dc-bg .pageTitle .gradText{
  display:inline-block!important;
  overflow:visible!important;
  line-height:1.18!important;
  padding:0 .035em .10em 0!important;
  margin:0!important;
  vertical-align:baseline!important;
  -webkit-box-decoration-break:clone;
  box-decoration-break:clone;
}
@media(max-width:768px){
  .dc-bg .pageTitle{line-height:1.18!important;padding-bottom:6px!important;margin-bottom:-2px!important}
  .dc-bg .pageTitle .gradText{line-height:1.18!important;padding-bottom:.10em!important}
}



/* Launch-focused dashboard hierarchy */
.dc-bg .profitSnapshot{position:relative;margin:18px 0 14px;border-radius:28px;border:1px solid rgba(15,23,42,.08);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(240,253,250,.86) 44%,rgba(245,243,255,.82));box-shadow:0 24px 80px rgba(2,6,23,.10);padding:18px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(420px,.9fr);gap:16px;overflow:hidden}.dc-bg .profitSnapshot:before{content:"";position:absolute;inset:-120px auto auto -120px;width:340px;height:340px;border-radius:999px;background:radial-gradient(circle,rgba(34,211,238,.18),transparent 66%);pointer-events:none}.dc-bg .profitSnapshot.risk{border-color:rgba(239,68,68,.16);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,247,237,.88) 44%,rgba(245,243,255,.82))}.dc-bg .profitSnapshot.healthy{border-color:rgba(16,185,129,.18)}.dc-bg .profitSnapshotMain{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;min-height:210px;padding:8px}.dc-bg .profitSnapshotKicker{width:fit-content;margin-bottom:10px;padding:7px 10px;border-radius:999px;border:1px solid rgba(34,211,238,.24);background:rgba(255,255,255,.78);font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:rgba(8,145,178,.95)}.dc-bg .profitSnapshotTitle{margin:0;font-size:38px;line-height:1.03;letter-spacing:-.045em;color:rgba(2,6,23,.96);font-weight:990;max-width:760px}.dc-bg .profitSnapshotSub{margin:12px 0 0;max-width:760px;font-size:15.5px;line-height:1.55;font-weight:780;color:rgba(51,65,85,.78)}.dc-bg .profitSnapshotActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.dc-bg .profitSnapshotPrimary{background:linear-gradient(90deg,rgba(239,68,68,.13),rgba(124,58,237,.14));border-color:rgba(239,68,68,.22)}.dc-bg .profitSnapshotSecondary{background:rgba(255,255,255,.70)}.dc-bg .profitSnapshotMetrics{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:10px}.dc-bg .profitSnapshotMetric{border-radius:20px;border:1px solid rgba(15,23,42,.07);background:rgba(255,255,255,.82);padding:14px;box-shadow:0 12px 34px rgba(2,6,23,.055)}.dc-bg .profitSnapshotMetric.primary{border-color:rgba(245,158,11,.22);background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(255,247,237,.82))}.dc-bg .profitSnapshotMetric span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(15,23,42,.50)}.dc-bg .profitSnapshotMetric strong{display:block;margin-top:8px;font-size:25px;line-height:1;font-weight:990;letter-spacing:-.03em;color:rgba(15,23,42,.94)}.dc-bg .profitSnapshotMetric em{display:block;margin-top:8px;font-style:normal;font-size:12px;line-height:1.35;font-weight:760;color:rgba(15,23,42,.55)}.dc-bg .profitSnapshotOpportunity{grid-column:1/-1;border:1px solid rgba(124,58,237,.16);background:rgba(255,255,255,.76);border-radius:18px;padding:12px 14px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;text-align:left;cursor:pointer;transition:transform .1s ease,box-shadow .14s ease,border-color .14s ease}.dc-bg .profitSnapshotOpportunity:hover{transform:translateY(-1px);box-shadow:0 14px 40px rgba(2,6,23,.10);border-color:rgba(124,58,237,.28)}.dc-bg .profitSnapshotOpportunity span{font-size:11px;text-transform:uppercase;letter-spacing:.075em;font-weight:950;color:rgba(124,58,237,.86)}.dc-bg .profitSnapshotOpportunity strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:950;color:rgba(15,23,42,.92)}.dc-bg .profitSnapshotOpportunity em{font-style:normal;font-size:13px;font-weight:950;color:rgba(194,65,12,.94)}
.dc-bg .scaleInsanePanel{margin-top:14px}.dc-bg .scaleExecutiveGrid{align-items:stretch}.dc-bg .scaleRecoveryCommand,.dc-bg .scaleActionQueueCard,.dc-bg .scaleBenchmarkCard,.dc-bg .scaleCard{box-shadow:0 14px 42px rgba(2,6,23,.055)}.dc-bg .scaleQueueTitle,.dc-bg .scaleInsightTitle,.dc-bg .emailAlertTitle{letter-spacing:-.025em}.dc-bg .charts{margin-top:14px}.dc-bg .creditKpiPanel{margin-top:14px}

@media(max-width:1180px){.dc-bg .profitSnapshot{grid-template-columns:1fr}.dc-bg .profitSnapshotMain{min-height:0}.dc-bg .profitSnapshotTitle{font-size:34px}.dc-bg .profitSnapshotMetrics{grid-template-columns:repeat(4,minmax(0,1fr))}.dc-bg .profitSnapshotOpportunity{grid-template-columns:1fr auto}.dc-bg .profitSnapshotOpportunity span{grid-column:1/-1}.dc-bg .profitSnapshotOpportunity strong{white-space:normal}}
@media(max-width:760px){.dc-bg .profitSnapshot{padding:14px;border-radius:22px}.dc-bg .profitSnapshotTitle{font-size:28px;line-height:1.08}.dc-bg .profitSnapshotSub{font-size:14px}.dc-bg .profitSnapshotMetrics{grid-template-columns:1fr 1fr}.dc-bg .profitSnapshotMetric strong{font-size:21px}.dc-bg .profitSnapshotActions .btn{width:100%;justify-content:center}.dc-bg .profitSnapshotOpportunity{grid-template-columns:1fr}.dc-bg .profitSnapshotOpportunity em{justify-self:start}}
@media(max-width:520px){.dc-bg .profitSnapshotMetrics{grid-template-columns:1fr}.dc-bg .profitSnapshotTitle{font-size:25px}.dc-bg .profitSnapshotMetric{padding:12px}.dc-bg .profitSnapshotMain{padding:2px}.dc-bg .kpis{grid-template-columns:1fr!important}}


/* Clean mode headers for internal dashboard views */
.dc-bg .cleanModeShell{margin-top:14px}
.dc-bg .modeContextHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:18px 18px 16px;border-bottom:1px solid rgba(15,23,42,.06);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(240,253,250,.58) 48%,rgba(245,243,255,.50));}
.dc-bg .modeEyebrow{width:fit-content;margin-bottom:8px;padding:6px 10px;border-radius:999px;border:1px solid rgba(34,211,238,.24);background:rgba(255,255,255,.78);font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:rgba(8,145,178,.95)}
.dc-bg .modeTitle{font-size:30px;line-height:1.08;font-weight:990;letter-spacing:-.04em;color:rgba(2,6,23,.96)}
.dc-bg .modeSub{margin-top:7px;max-width:760px;font-size:14.5px;line-height:1.5;font-weight:760;color:rgba(51,65,85,.72)}
.dc-bg .modeHeaderActions{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}
.dc-bg .modeCount{display:flex;align-items:baseline;gap:6px;padding:10px 12px;border-radius:16px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.74);box-shadow:0 10px 28px rgba(2,6,23,.055);font-weight:850;color:rgba(15,23,42,.62)}
.dc-bg .modeCount strong{font-size:18px;line-height:1;color:rgba(15,23,42,.94)}
.dc-bg .modeCount span{font-size:12px}.dc-bg .cleanModeToolbar{align-items:center;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}.dc-bg .decisionJobHero{border-color:rgba(239,68,68,.11);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(255,247,237,.70) 48%,rgba(245,243,255,.58));}.dc-bg .decisionJobHeroBody{grid-template-columns:minmax(0,1fr) minmax(320px,.45fr);align-items:stretch}.dc-bg .decisionJobMain{display:flex;flex-direction:column;justify-content:center;min-height:190px}.dc-bg .decisionJobTitle{font-size:34px;line-height:1.05}.dc-bg .decisionJobSub{max-width:860px}.dc-bg .decisionSummaryCard{background:rgba(255,255,255,.82);box-shadow:0 14px 44px rgba(2,6,23,.06)}.dc-bg .warnText{color:rgba(194,65,12,.96)!important}.dc-bg .jobAnalysisHeader{background:linear-gradient(135deg,rgba(240,253,250,.86),rgba(245,243,255,.64));border-color:rgba(34,211,238,.18)}
@media(max-width:980px){.dc-bg .modeContextHeader{flex-direction:column}.dc-bg .modeHeaderActions{justify-content:flex-start}.dc-bg .decisionJobHeroBody{grid-template-columns:1fr}.dc-bg .decisionJobMain{min-height:0}.dc-bg .cleanModeToolbar{grid-template-columns:1fr}.dc-bg .cleanModeToolbar .btn{width:fit-content}}
@media(max-width:640px){.dc-bg .modeContextHeader{padding:14px}.dc-bg .modeTitle{font-size:25px}.dc-bg .modeSub{font-size:13.5px}.dc-bg .modeHeaderActions,.dc-bg .modeHeaderActions .crumbBtn{width:100%}.dc-bg .modeCount{width:100%;justify-content:center}.dc-bg .decisionJobTitle{font-size:28px}.dc-bg .cleanModeToolbar .btn{width:100%;justify-content:center}}
`;
