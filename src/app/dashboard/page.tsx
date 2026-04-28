"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const API_BASE = "https://dropclarity.com/api";
const FALLBACK_USER_ID = "anon";

type DashboardMode = "ready" | "loading" | "error";
type ViewMode = "dashboard" | "job" | "alljobs";
type RangeKey = "all" | "mtd" | "last7" | "last30" | "custom";

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
    canPreviewScale: canUseCore,
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
  let data: any = null;

  try {
    data = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error || text || `Dashboard failed (${res.status})`);
  }

  return data || {};
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
  let data: any = null;

  try {
    data = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error || text || `Scale summary failed (${res.status})`);
  }

  return data || {};
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

function getScaleMetrics(state: DashboardState) {
  const jobs = getAllJobs(state);
  const losingJobs = jobs.filter((j) => parseNumberLoose(j.profit) < 0);
  const thinMarginJobs = jobs.filter((j) => {
    const margin = parseNumberLoose(j.margin_pct);
    return margin >= 0 && margin < 20;
  });

  const recoverableOpportunity = jobs.reduce((sum, job) => {
    const revenue = parseNumberLoose(job.revenue);
    const profit = parseNumberLoose(job.profit);
    const targetProfit = revenue * 0.25;
    const gap = targetProfit - profit;
    return sum + Math.max(0, gap);
  }, 0);

  const avgMargin =
    jobs.length > 0
      ? jobs.reduce((sum, j) => sum + parseNumberLoose(j.margin_pct), 0) / jobs.length
      : 0;

  const highRiskCount = losingJobs.length + thinMarginJobs.length;

  return {
    losingJobs,
    thinMarginJobs,
    recoverableOpportunity,
    avgMargin,
    highRiskCount,
  };
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
  const healthLabel = profitHealth === "bad" ? "Profit risk" : profitHealth === "warn" ? "Needs optimization" : "Healthy";

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
        {s ? <div className={`pill health ${profitHealth}`}>{healthLabel}</div> : null}


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

function ChartsPanel({ state, view }: { state: DashboardState; view: ViewMode }) {
  const profitRef = useRef<HTMLCanvasElement | null>(null);
  const revCostRef = useRef<HTMLCanvasElement | null>(null);
  const jobs = getAllJobs(state);
  const parts = useMemo(() => buildCostMixParts(state), [state]);

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
        <div className="chartHead">
          <div>
            <div className="chartTitle">Cost Mix</div>
            <div className="chartSub">Labor, materials, subs, and other costs</div>
          </div>
        </div>
        <div className="mixList gridMix">
          {parts.map((p) => {
            const total = parts.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
            const share = (p.value / total) * 100;
            return (
              <div className="mixRow" key={p.label}>
                <div className="mixTop"><span><span className="sw" style={{ background: p.color }} /> <b>{p.label}</b></span><span>{fmtMoney(p.value)}</span></div>
                <div className="barTrack"><div className="barFill" style={{ width: `${Math.min(100, share)}%`, background: p.color }} /></div>
                <div className="mixSub">{fmtPct(share)} of known costs</div>
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
  const [sort, setSort] = useState<"date" | "profit" | "margin" | "revenue">("date");

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
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="selectInput">
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

function PastReports({ reports, onDeleteReport }: { reports: ReportRow[]; onDeleteReport: (report: ReportRow, idx: number) => void }) {
  return (
    <div className="panel">
      <div className="panelHead">
        <div>
          <div className="panelTitle">Past Reports</div>
          <div className="panelSub">Saved snapshots from prior uploads.</div>
        </div>
      </div>

      <div className="pad">
        {reports.length ? (
          <div className="list">
            {reports.slice(0, 15).map((r, idx) => {
              const p = parseNumberLoose(r.net_profit);
              return (
                <div className="item" key={`${r.id || r.created_at}-${idx}`}>
                  <div className="itemTop">
                    <div>
                      <div className="itemName">{r.period_label || "Report"}</div>
                      <div className="itemMeta">{dateTimeLabel(r.created_at)}</div>
                    </div>
                    <div className="reportActions">
                      <div className={p < 0 ? "neg strong" : "pos strong"}>{fmtMoney(p)}</div>
                      <button className="deleteReportBtn" type="button" onClick={() => onDeleteReport(r, idx)} title="Hide this report from dashboard">×</button>
                    </div>
                  </div>
                  <div className="itemMeta">Revenue: <b>{fmtMoney(r.revenue)}</b> • Costs: <b>{fmtMoney(r.costs)}</b> • Margin: <b>{fmtPct(r.margin_pct)}</b></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">No reports yet.</div>
        )}
      </div>
    </div>
  );
}

function Insights({ insights }: { insights: Insight[] }) {
  return (
    <div className="panel">
      <div className="panelHead">
        <div>
          <div className="panelTitle">Latest AI Insights</div>
          <div className="panelSub">Highlights from the latest report.</div>
        </div>
      </div>

      <div className="pad">
        {insights.length ? (
          <div className="list">
            {insights.slice(0, 4).map((i, idx) => {
              const impact = String(i.impact || "").toLowerCase();
              const cls = impact.includes("high") || impact.includes("critical") ? "bad" : impact.includes("medium") || impact.includes("moderate") ? "warn" : "ok";
              return (
                <div className="item" key={`${i.title}-${idx}`}>
                  <div className="itemTop"><div className="itemName">{i.title || "Insight"}</div><span className={`tag ${cls}`}>{i.impact || "Insight"}</span></div>
                  <div className="itemMeta">{i.detail}</div>
                  {i.recommendation ? <div className="itemMeta"><b>Recommended:</b> {i.recommendation}</div> : null}
                </div>
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
}: {
  state: DashboardState;
  plan: string;
  scaleSummary: ScaleSummary | null;
}) {
  const fallbackMetrics = getScaleMetrics(state);
  const backendStats = scaleSummary?.stats || null;
  const backendBenchmarks = scaleSummary?.benchmarks || null;

  const backendHighRiskJobs = Array.isArray(scaleSummary?.high_risk_jobs) ? scaleSummary.high_risk_jobs : [];
  const backendLosingJobs = Array.isArray(scaleSummary?.losing_jobs) ? scaleSummary.losing_jobs : [];
  const backendThinMarginJobs = Array.isArray(scaleSummary?.thin_margin_jobs) ? scaleSummary.thin_margin_jobs : [];
  const backendTopOpportunities = Array.isArray(scaleSummary?.top_opportunities) ? scaleSummary.top_opportunities : [];

  const alerts = Array.isArray(scaleSummary?.alerts) ? scaleSummary.alerts : [];
  const leakBreakdown = Array.isArray(scaleSummary?.profit_leak_breakdown) ? scaleSummary.profit_leak_breakdown : [];
  const structuredActions = Array.isArray(scaleSummary?.structured_actions) ? scaleSummary.structured_actions : [];

  const metrics = {
    losingJobs: fallbackMetrics.losingJobs,
    thinMarginJobs: fallbackMetrics.thinMarginJobs,
    recoverableOpportunity:
      backendStats?.recoverable_profit != null
        ? parseNumberLoose(backendStats.recoverable_profit)
        : backendStats?.recoverable != null
        ? parseNumberLoose(backendStats.recoverable)
        : fallbackMetrics.recoverableOpportunity,
    avgMargin:
      backendStats?.avg_margin != null
        ? parseNumberLoose(backendStats.avg_margin)
        : backendBenchmarks?.avg_margin_pct != null
        ? parseNumberLoose(backendBenchmarks.avg_margin_pct)
        : fallbackMetrics.avgMargin,
    highRiskCount:
      backendStats?.high_risk_count != null
        ? parseNumberLoose(backendStats.high_risk_count)
        : fallbackMetrics.highRiskCount,
  };

  const visibleRiskJobs =
    backendHighRiskJobs.length > 0
      ? backendHighRiskJobs
      : backendLosingJobs.length > 0
      ? backendLosingJobs
      : backendThinMarginJobs.length > 0
      ? backendThinMarginJobs
      : fallbackMetrics.losingJobs.map((job) => ({
          name: job.job_name || job.job_id || "Unnamed job",
          id: job.job_id || null,
          profit: parseNumberLoose(job.profit),
          margin: parseNumberLoose(job.margin_pct),
          revenue: parseNumberLoose(job.revenue),
          costs: parseNumberLoose(job.costs),
        }));

  const opportunities = backendTopOpportunities.length > 0 ? backendTopOpportunities : visibleRiskJobs;
  const access = getPlanAccess(plan);
  const isScale = access.canUseScale;
  const canPreviewScale = access.canPreviewScale;
  const displayedRiskJobs = isScale ? visibleRiskJobs.slice(0, 3) : canPreviewScale ? visibleRiskJobs.slice(0, 1) : [];
  const displayedAlerts = isScale ? alerts.slice(0, 2) : canPreviewScale ? alerts.slice(0, 1) : [];

  const riskLevel = scaleSummary?.risk_level || "healthy";
  const riskCls = riskLevel === "healthy" ? "ok" : riskLevel === "warning" ? "warn" : "bad";

  const summaryTitle =
    scaleSummary?.priority_message ||
    (metrics.highRiskCount > 0
      ? `${metrics.highRiskCount} jobs need review this week.`
      : "Profitability looks healthy across the latest analyzed jobs.");

  const summaryCopy =
    scaleSummary?.trend_summary ||
    scaleSummary?.summary_text ||
    "DropClarity is tracking margins, costs, and risk across your saved reports.";

  const benchmarkRows = [
    {
      label: "Average Job Margin",
      value: fmtPct(metrics.avgMargin),
      note: metrics.avgMargin >= 25 ? "Above target" : "Below preferred target",
      cls: metrics.avgMargin >= 25 ? "ok" : "warn",
    },
    {
      label: "Profit Per Job",
      value: fmtMoney(backendBenchmarks?.profit_per_job),
      note: "Net profit divided by analyzed jobs",
      cls: parseNumberLoose(backendBenchmarks?.profit_per_job) >= 0 ? "ok" : "bad",
    },
    {
      label: "Cost Ratio",
      value: fmtPct(backendBenchmarks?.cost_ratio_pct),
      note: "Known costs as a share of revenue",
      cls: parseNumberLoose(backendBenchmarks?.cost_ratio_pct) <= 75 ? "ok" : "warn",
    },
    {
      label: "Recoverable Opportunity",
      value: fmtMoney(metrics.recoverableOpportunity),
      note: "Estimated gap to target margin",
      cls: metrics.recoverableOpportunity > 0 ? "warn" : "ok",
    },
  ];

  const actionRows: StructuredAction[] =
    structuredActions.length > 0
      ? structuredActions.slice(0, 3)
      : (scaleSummary?.actions || []).slice(0, 3).map((text): StructuredAction => ({
          text,
          title: undefined,
          priority: riskLevel === "healthy" ? "low" : "medium",
          impact: 0,
          category: "Operations",
        }));

  return (
    <div className="scalePanel">
      <div className="panelHead">
        <div>
          <div className="panelTitle">Scale Profit Oversight</div>
          <div className="panelSub">
            Profit leaks, risk alerts, benchmarks, and next actions in one view.
          </div>
        </div>

        <div className={`tag ${riskCls}`}>
          {isScale ? "Scale active" : canPreviewScale ? "Scale preview" : "Scale locked"} · {riskLevel}
        </div>
      </div>

      {!isScale ? (
        <div className={canPreviewScale ? "gateBanner preview" : "gateBanner locked"}>
          <strong>{canPreviewScale ? "Scale preview mode" : "Scale features locked"}</strong>
          <span>
            {canPreviewScale
              ? "Preview Scale insights here. Full alerts, impact, and team views unlock on Scale."
              : "Upgrade to Scale for profit leaks, risk alerts, priority actions, benchmarks, and team views."}
          </span>
        </div>
      ) : null}

      <div className="scaleGrid scaleGridPremium">
        <div className="scaleCard dark scaleHeroCard">
          <div className="scaleKicker">Weekly Profit Intelligence</div>

          <div className="scaleTitle">{summaryTitle}</div>

          <div className="scaleText">{summaryCopy}</div>

          <div className="scaleMiniStats">
            <div>
              <span>Risk Jobs</span>
              <strong>{String(metrics.highRiskCount)}</strong>
            </div>
            <div>
              <span>Opportunity</span>
              <strong>{fmtMoney(metrics.recoverableOpportunity)}</strong>
            </div>
          </div>
        </div>

        <div className="scaleCard">
          <div className="scaleKicker">Profit Leak Breakdown</div>

          <div className="leakList">
            {isScale && leakBreakdown.length ? (
              leakBreakdown.slice(0, 3).map((leak, idx) => (
                <div className="leakItem" key={`${leak.type || leak.label || "leak"}-${idx}`}>
                  <div className="leakTop">
                    <div>
                      <div className="leakName">{leak.label || leak.type || "Profit leak"}</div>
                      <div className="leakMeta">
                        {String(leak.jobs_count || 0)} jobs · {leak.severity || "watch"}
                      </div>
                    </div>
                    <div className={`leakAmount ${parseNumberLoose(leak.amount) > 0 ? "warn" : "ok"}`}>
                      {fmtMoney(leak.amount)}
                    </div>
                  </div>
                  {leak.fix ? <div className="leakFix">{leak.fix}</div> : null}
                </div>
              ))
            ) : (
              <div className="empty compact">
                {isScale ? "No major profit leaks detected." : "Profit leaks unlock on Scale."}
              </div>
            )}
          </div>
        </div>

        <div className="scaleCard">
          <div className="scaleKicker">High-Risk Job Alerts</div>

          <div className="alertList">
            {displayedRiskJobs.map((job, idx) => (
              <div className="alertItem" key={`${job.id || job.name || "job"}-${idx}`}>
                <div>
                  <div className="alertName">{job.name || job.id || "Unnamed job"}</div>
                  <div className="alertMeta">
                    Profit {fmtMoney(job.profit)} · Margin {fmtPct(job.margin)}
                  </div>
                </div>
                <span className="tag bad">Risk</span>
              </div>
            ))}

            {!displayedRiskJobs.length && <div className="empty compact">{canPreviewScale ? "No high-risk jobs detected." : "Risk alerts unlock on Scale."}</div>}

            {displayedAlerts.map((alert, idx) => (
              <div className="alertItem soft" key={`${alert.title || "alert"}-${idx}`}>
                <div>
                  <div className="alertName">{alert.title || "Watch item"}</div>
                  <div className="alertMeta">{alert.message || "Review this item."}</div>
                </div>
                <span className={`tag ${alert.level === "critical" || alert.level === "warning" ? "bad" : alert.level === "watch" ? "warn" : "ok"}`}>
                  {alert.level || "info"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="scaleCard">
          <div className="scaleKicker">Priority Actions</div>

          <div className="actionStack">
            {isScale && actionRows.length ? (
              actionRows.map((action, idx) => {
                const priority = String(action.priority || "medium").toLowerCase();
                const cls =
                  priority === "critical" || priority === "high"
                    ? "bad"
                    : priority === "medium"
                    ? "warn"
                    : "ok";

                const actionTitle =
                  String(action.title || action.text || "Review profitability opportunity").trim();

                return (
                  <div className="actionCard" key={`${actionTitle}-${idx}`}>
                    <div className="actionTop">
                      <span className={`tag ${cls}`}>{action.priority || "medium"}</span>
                      {parseNumberLoose(action.impact) > 0 ? <strong>{fmtMoney(action.impact)}</strong> : null}
                    </div>
                    <div className="actionName">{actionTitle}</div>
                    {action.category ? <div className="actionMeta">{action.category}</div> : null}
                  </div>
                );
              })
            ) : (
              <div className="empty compact">
                {isScale ? "No immediate actions required." : "Priority actions unlock on Scale."}
              </div>
            )}
          </div>
        </div>

        <div className="scaleCard wideScaleCard">
          <div className="scaleKicker">Advanced Benchmarks</div>

          <div className="benchmarkGrid">
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

        <div className="scaleCard teamScaleCard">
          <div className="scaleKicker">Team Visibility</div>

          <div className="scaleTitle small">Manager-ready profit view</div>

          <div className="scaleText">
            Share the same profit view with owners, managers, and finance.
          </div>

          <div className="teamPills">
            <span>Owner</span>
            <span>Manager</span>
            <span>Finance</span>
          </div>

          {scaleSummary?.latest_report ? (
            <div className="latestReport">
              <div className="latestReportLabel">Latest report</div>
              <div className="latestReportValue">
                {scaleSummary.latest_report.period_label || "Latest Period"} · {fmtMoney(scaleSummary.latest_report.net_profit)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


function DashboardBody({
  state,
  setView,
  setJobKey,
  view,
  reports,
  onDeleteReport,
  plan,
  scaleSummary,
}: {
  state: DashboardState;
  setView: (v: ViewMode) => void;
  setJobKey: (v: string) => void;
  view: ViewMode;
  reports: ReportRow[];
  onDeleteReport: (report: ReportRow, idx: number) => void;
  plan: string;
  scaleSummary: ScaleSummary | null;
}) {
  const jobs = getAllJobs(state);
  const insights = Array.isArray(state.insights) ? state.insights : [];

  return (
    <>
      <DashboardHero state={state} />
      <Kpis state={state} />
      <ChartsPanel state={state} view={view} />
      <ScaleOversightPanel state={state} plan={plan} scaleSummary={scaleSummary} />

      <div className="grid">
        <div className="mainCol">
          <JobsLog
            jobs={jobs}
            onOpenJob={(key) => {
              setJobKey(key);
              setView("job");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>

        <div className="sideStack">
          <PastReports reports={reports} onDeleteReport={onDeleteReport} />
          <Insights insights={insights} />
        </div>
      </div>
    </>
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
          <div className="stat"><div className="statLabel">Manual Categories</div><div className="statValue">{job.custom_categories.length}</div><div className="statSub">Commission, subs, reserves, etc.</div></div>
        </div>

        <div className="jobAnalysisHeader">
          <div>
            <div className="sectionEyebrow">Job Analysis</div>
            <div className="sectionTitle">Edit, adjust, and understand this job’s profitability</div>
          </div>
          <div className="sectionSubtle">Focused view for one job.</div>
        </div>

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
}: {
  state: DashboardState;
  jobKey: string;
  setView: (v: ViewMode) => void;
  setJobKey: (v: string) => void;
  refreshLocal: () => void;
  userId: string;
  access: PlanAccess;
  onLocked: (feature: string, requiredPlan: string) => void;
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
    } catch (e: any) {
      setMode("error");
      setError(e?.message || String(e));
      console.error(e);
    }
  }, [isLoaded, isSignedIn, getToken, range, customFrom, customTo]);

useEffect(() => {
  if (!isLoaded) return;

  setDeletedReportKeys(readDeletedReports(USER_ID));
  loadAndRender();
}, [USER_ID, isLoaded, loadAndRender]);

  const refreshLocal = () => {};

  const reports = useMemo(
    () => filterDeletedReports(Array.isArray(state.reports) ? state.reports : [], deletedReportKeys),
    [state.reports, deletedReportKeys]
  );

  const visibleState = useMemo(() => ({ ...state, reports }), [state, reports]);

  const handleDeleteReport = (report: ReportRow, idx: number) => {
    const key = reportDeleteKey(report, idx);
    const next = Array.from(new Set([...deletedReportKeys, key]));
    setDeletedReportKeys(next);
    writeDeletedReports(USER_ID, next);
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

            {view === "job" && jobKey ? (
              <JobView state={visibleState} jobKey={jobKey} setView={setView} setJobKey={setJobKey} refreshLocal={refreshLocal} userId={USER_ID} access={access} onLocked={openUpgradePrompt} />
            ) : view === "alljobs" ? (
              <AllJobsView state={visibleState} setView={setView} setJobKey={setJobKey} refreshLocal={refreshLocal} userId={USER_ID} access={access} onLocked={openUpgradePrompt} />
            ) : (
              <DashboardBody
  state={visibleState}
  setView={setView}
  setJobKey={setJobKey}
  view={view}
  reports={reports}
  onDeleteReport={handleDeleteReport}
  plan={plan}
  scaleSummary={scaleSummary}
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
.kpis{padding:14px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.kpi,.stat{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.84);box-shadow:0 14px 40px rgba(2,6,23,.06);padding:12px}.kLabel,.statLabel{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:rgba(15,23,42,.52);font-weight:900}.kValue,.statValue{margin-top:7px;font-weight:980;font-size:22px;letter-spacing:-.02em;color:rgba(15,23,42,.90)}.kSub,.statSub{margin-top:7px;font-size:13px;line-height:1.35;color:rgba(15,23,42,.58);font-weight:760}.pos{color:rgba(5,150,105,.95)!important}.neg{color:rgba(220,38,38,.95)!important}.strong{font-weight:950}.charts,.jobCharts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.jobCharts{gap:12px}.chartCard{border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.82);padding:12px;overflow:hidden;box-shadow:0 12px 38px rgba(2,6,23,.055)}.chartCard.wide{grid-column:1/-1}.chartHead{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:8px}.chartTitle{font-weight:950;letter-spacing:-.01em;color:rgba(15,23,42,.92);font-size:17px}.chartSub{color:rgba(15,23,42,.55);font-size:13px;font-weight:750}canvas{width:100%;height:auto;display:block}.trendEmpty{border-radius:18px;border:1px dashed rgba(15,23,42,.14);background:rgba(255,255,255,.55);padding:16px;color:rgba(15,23,42,.72);font-weight:850;font-size:14px;line-height:1.45}.mixList{display:flex;flex-direction:column;gap:14px}.gridMix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.mixRow{border:1px solid var(--line2);background:rgba(255,255,255,.82);border-radius:16px;padding:12px}.mixTop{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:rgba(15,23,42,.72);font-weight:850}.sw{display:inline-block;width:10px;height:10px;border-radius:4px;margin-right:7px}.barTrack{height:8px;border-radius:999px;background:rgba(15,23,42,.06);overflow:hidden;margin-top:8px}.barFill{height:100%;border-radius:999px}.mixSub{margin-top:6px;color:rgba(15,23,42,.52);font-size:12px;font-weight:750}
.tableTools{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.searchInput{min-width:220px}.tableWrap{overflow:auto}.jobsTable{width:100%;border-collapse:separate;border-spacing:0;min-width:900px}.jobsTable th,.jobsTable td{padding:13px 14px;border-bottom:1px solid rgba(15,23,42,.06);text-align:left;font-size:13.5px;font-weight:750;color:rgba(15,23,42,.72);vertical-align:middle}.jobsTable th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:rgba(15,23,42,.44);font-weight:950;background:rgba(15,23,42,.025)}.jobName{font-weight:950;color:#0f172a;font-size:14px}.jobMeta,.itemMeta{margin-top:5px;color:rgba(15,23,42,.52);font-size:12px;font-weight:750}.miniBtn{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;font-weight:950;font-size:12px;cursor:pointer}.tag{padding:6px 10px;border-radius:999px;border:1px solid var(--line2);font-weight:950;font-size:11.5px;white-space:nowrap;background:rgba(15,23,42,.04);color:rgba(15,23,42,.78)}.tag.ok{border-color:rgba(52,211,153,.22);color:rgba(5,150,105,.95);background:rgba(52,211,153,.10)}.tag.warn{border-color:rgba(245,158,11,.22);color:rgba(180,83,9,.95);background:rgba(245,158,11,.10)}.tag.bad{border-color:rgba(239,68,68,.22);color:rgba(220,38,38,.95);background:rgba(239,68,68,.10)}.list{display:flex;flex-direction:column;gap:10px}.item{border-radius:18px;border:1px solid rgba(15,23,42,.06);background:rgba(255,255,255,.86);padding:11px}.itemTop{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.itemName{font-weight:950;font-size:14px;color:rgba(15,23,42,.88)}.reportActions{display:flex;align-items:center;gap:10px}.deleteReportBtn{width:26px;height:26px;border-radius:999px;border:1px solid rgba(239,68,68,.18);background:rgba(239,68,68,.08);color:rgba(185,28,28,.95);font-weight:950;font-size:16px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.empty{text-align:center;padding:24px;color:rgba(15,23,42,.55);border:1px dashed rgba(15,23,42,.14);border-radius:18px;background:rgba(255,255,255,.55);font-weight:850;margin:14px}.error{border:1px solid rgba(239,68,68,.22);background:rgba(239,68,68,.08);color:rgba(15,23,42,.86);border-radius:18px;padding:14px;font-weight:850;font-size:13px;white-space:pre-wrap}
.crumbs{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.90),rgba(255,255,255,.72));position:relative;z-index:20;pointer-events:auto}.crumb{display:inline-flex;align-items:center;gap:8px;font-weight:900;font-size:12.5px;color:rgba(15,23,42,.72)}.crumb strong{color:rgba(15,23,42,.92)}.crumbBtn{margin-left:auto;display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;border:1px solid var(--line2);background:rgba(255,255,255,.82);font-weight:950;font-size:12.5px;cursor:pointer;transition:transform .08s ease,box-shadow .12s ease,border-color .12s ease;text-decoration:none;color:rgba(15,23,42,.90)}.crumbBtn.secondary{margin-left:0}.jobPage{display:flex;flex-direction:column;gap:12px;margin-top:12px}.jobAnalysisHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;border-radius:20px;border:1px solid rgba(34,211,238,.16);background:linear-gradient(135deg,rgba(255,255,255,.90),rgba(240,253,250,.72));box-shadow:0 14px 40px rgba(2,6,23,.055);padding:14px 16px}.sectionEyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:rgba(8,145,178,.86)}.sectionTitle{margin-top:4px;font-size:20px;line-height:1.1;font-weight:980;letter-spacing:-.025em;color:rgba(15,23,42,.94)}.sectionSubtle{font-size:12.5px;line-height:1.4;font-weight:850;color:rgba(15,23,42,.50);text-align:right}.jobDetailFocus{border:1px solid rgba(34,211,238,.14);box-shadow:0 18px 60px rgba(34,211,238,.08)}.jobStats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.jobDetailFocus{border-radius:18px}.jobDetailPad{overflow-x:auto}.jobTable{width:100%;min-width:1320px;table-layout:fixed;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:18px;border:1px solid var(--line2);background:rgba(255,255,255,.86)}.jobTable th,.jobTable td{padding:12px 8px;border-bottom:1px solid rgba(15,23,42,.06);vertical-align:middle;font-size:12.5px}.jobTable th{text-align:left;font-weight:950;color:rgba(15,23,42,.86);background:rgba(15,23,42,.035);position:sticky;top:0;z-index:2;font-size:12px;white-space:nowrap}.cellEdit{border:1px solid rgba(15,23,42,.12);background:#ffffff;border-radius:12px;padding:10px 10px;font-weight:800;font-size:14px;color:#0f172a!important;width:100%;outline:none;transition:border-color .12s ease,box-shadow .12s ease;position:relative;z-index:2;caret-color:#0f172a}.cellEdit:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.2)}.cellHint{margin-top:6px;font-size:11.5px;color:rgba(15,23,42,.62);font-weight:750}.customRemoveWrap{display:flex;justify-content:center;align-items:center}.supportGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.miniPanel{box-shadow:none}.noteBox{min-height:110px;resize:vertical}

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

`;