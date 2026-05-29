"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/nextjs";

const WORKER_ORIGIN = (process.env.NEXT_PUBLIC_WORKER_URL || "https://dropclarity-api.armanrtajalli.workers.dev").replace(/\/api\/?$/, "");

type StatusFilter = "all" | "success" | "failed" | "started";
type WorkflowFilter = "all" | "initial_analyze" | "job_reanalyze" | "other";

type AdminFile = {
  filename?: string | null;
  name?: string | null;
  label?: string | null;
  url?: string | null;
  cdnUrl?: string | null;
  cdn_url?: string | null;
  fileUrl?: string | null;
  file_url?: string | null;
  uuid?: string | null;
  role?: string | null;
  job_id?: string | null;
  mime?: string | null;
  size?: number | string | null;
};

type CostBreakdown = {
  labor?: number | string | null;
  materials?: number | string | null;
  subs?: number | string | null;
  taxes?: number | string | null;
  other?: number | string | null;
  credits_total?: number | string | null;
  credits?: number | string | null;
};

interface AnalysisRun {
  id: string | number;
  user_id?: string | null;
  email?: string | null;
  plan?: string | null;
  status?: string | null;

  workflow_type?: string | null;
  workflowType?: string | null;
  workflow?: string | null;
  workflow_details?: any;
  workflowDetails?: any;
  workflow_details_json?: string | null;
  update_role?: string | null;
  updateRole?: string | null;
  job_id?: string | null;
  job_name?: string | null;

  file_count?: number | string | null;
  filenames?: string | null;
  file_names?: string[] | string | null;
  file_urls?: string | string[] | null;
  file_links?: AdminFile[] | string | null;
  uploaded_files?: AdminFile[] | string | null;
  files?: AdminFile[] | string | null;

  jobs_found?: number | string | null;
  jobs_detected?: number | string | null;

  revenue_total?: number | string | null;
  revenue_detected?: number | string | null;
  cost_total?: number | string | null;
  costs_detected?: number | string | null;
  net_profit?: number | string | null;
  net_profit_detected?: number | string | null;
  margin_percent?: number | string | null;
  margin_pct?: number | string | null;

  labor_total?: number | string | null;
  labor_detected?: number | string | null;
  materials_total?: number | string | null;
  materials_detected?: number | string | null;
  subs_total?: number | string | null;
  subs_detected?: number | string | null;
  taxes_total?: number | string | null;
  taxes_detected?: number | string | null;
  other_total?: number | string | null;
  other_detected?: number | string | null;
  credits_total?: number | string | null;
  credits_detected?: number | string | null;
  cost_breakdown?: CostBreakdown | null;

  added_revenue?: number | string | null;
  added_costs?: number | string | null;
  added_profit?: number | string | null;
  added_cost_breakdown?: CostBreakdown | null;
  old_revenue?: number | string | null;
  old_costs?: number | string | null;
  old_profit?: number | string | null;
  new_profit?: number | string | null;
  old_margin?: number | string | null;
  new_revenue?: number | string | null;
  new_costs?: number | string | null;
  new_margin?: number | string | null;

  processing_ms?: number | string | null;
  processing_time_ms?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  error_message?: string | null;
  report_id?: string | null;
  period_label?: string | null;
  diagnostics?: any;
}

type AdminPayload = {
  ok?: boolean;
  summary?: Record<string, unknown>;
  runs?: AnalysisRun[];
  recent_failures?: AnalysisRun[];
};

type FileLink = {
  label: string;
  href?: string;
  role?: string;
  jobId?: string;
  mime?: string;
  size?: number;
};

function n(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null) return 0;

  let s = String(value).trim();
  if (!s) return 0;

  const neg = /^\(.*\)$/.test(s);
  s = s.replace(/[(),\s$%]/g, "");
  const parsed = Number(s);
  if (!Number.isFinite(parsed)) return 0;
  return neg ? -parsed : parsed;
}

function money(value: unknown, digits = 0) {
  return n(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(value: unknown) {
  return `${n(value).toFixed(1)}%`;
}

function runtime(value: unknown) {
  const ms = n(value);
  if (ms <= 0) return "0.0s";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function safeDate(value: string | undefined | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function safeArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}


function safeObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, any>;
    } catch {}
  }

  return {};
}

function valueFromPaths(source: Record<string, any>, paths: string[]) {
  for (const path of paths) {
    const parts = path.split(".");
    let current: any = source;

    for (const part of parts) {
      if (current == null || typeof current !== "object" || !(part in current)) {
        current = undefined;
        break;
      }

      current = current[part];
    }

    if (current != null && current !== "") return current;
  }

  return undefined;
}

function getWorkflowDetails(run: AnalysisRun): Record<string, any> {
  const direct = safeObject(run.workflow_details ?? run.workflowDetails ?? run.workflow_details_json);
  if (Object.keys(direct).length) return direct;

  const diagnostics = safeObject(run.diagnostics);
  return safeObject(diagnostics.workflow_details ?? diagnostics.workflowDetails ?? diagnostics.workflow_details_json);
}

function detailValue(run: AnalysisRun, paths: string[]) {
  const details = getWorkflowDetails(run);
  const sources = [
    run as Record<string, any>,
    details,
    safeObject(details.reanalyze),
    safeObject(details.re_analyze),
    safeObject(details.job_reanalyze),
    safeObject(details.update),
    safeObject(details.added),
    safeObject(details.before),
    safeObject(details.after),
    safeObject(details.comparison),
  ];

  for (const source of sources) {
    const value = valueFromPaths(source, paths);
    if (value != null && value !== "") return value;
  }

  return undefined;
}

function normalizeFileUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;

  if (/^https?:\/\//i.test(raw)) return raw;

  const uuid = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  if (uuid) return `https://ucarecdn.com/${uuid}/?download=1`;

  return undefined;
}

function fileLabelFromUrl(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || "Uploaded file");
  } catch {
    return "Uploaded file";
  }
}

function getRunFiles(run: AnalysisRun): FileLink[] {
  const details = getWorkflowDetails(run);
  const objects = [
    ...safeArray(run.file_links),
    ...safeArray(run.uploaded_files),
    ...safeArray(run.files),
    ...safeArray(details.file_links),
    ...safeArray(details.uploaded_files),
    ...safeArray(details.files),
    ...safeArray(details.source_files),
    ...safeArray(details.added_files),
    ...safeArray(details.added_file ? [details.added_file] : []),
  ];

  const fromObjects: FileLink[] = objects
    .map((file): FileLink | null => {
      if (typeof file === "string") {
        return {
          label: fileLabelFromUrl(normalizeFileUrl(file) || file) || file,
          href: normalizeFileUrl(file),
        };
      }

      const label = String(
        file?.filename ||
          file?.name ||
          file?.label ||
          file?.url ||
          file?.cdnUrl ||
          file?.cdn_url ||
          file?.fileUrl ||
          file?.file_url ||
          file?.uuid ||
          "Uploaded file",
      );

      const href =
        normalizeFileUrl(file?.fileUrl) ||
        normalizeFileUrl(file?.file_url) ||
        normalizeFileUrl(file?.url) ||
        normalizeFileUrl(file?.cdnUrl) ||
        normalizeFileUrl(file?.cdn_url) ||
        normalizeFileUrl(file?.uuid) ||
        normalizeFileUrl(label);

      return {
        label,
        href,
        role: file?.role ? String(file.role) : undefined,
        jobId: file?.job_id ? String(file.job_id) : undefined,
        mime: file?.mime ? String(file.mime) : undefined,
        size: file?.size == null ? undefined : n(file.size),
      };
    })
    .filter(Boolean) as FileLink[];

  const fromUrls = safeArray(run.file_urls).map((url) => ({
    label: fileLabelFromUrl(String(url)),
    href: normalizeFileUrl(url),
  }));

  const fromNames = safeArray(run.file_names ?? run.filenames).map((name) => ({
    label: String(name),
    href: normalizeFileUrl(name),
  }));

  const seenLabels = new Set<string>();
  const seenHrefs = new Set<string>();

  return [...fromObjects, ...fromUrls, ...fromNames].filter((file) => {
    const labelKey = String(file.label || "").trim().toLowerCase();
    const hrefKey = String(file.href || "").trim().toLowerCase();

    if (!labelKey) return false;
    if (hrefKey && seenHrefs.has(hrefKey)) return false;
    if (seenLabels.has(labelKey)) return false;

    seenLabels.add(labelKey);
    if (hrefKey) seenHrefs.add(hrefKey);

    return true;
  });
}

function getWorkflowType(run: AnalysisRun): string {
  return String(run.workflow_type || run.workflowType || run.workflow || detailValue(run, ["workflow_type", "workflowType", "workflow"]) || "initial_analyze").trim() || "initial_analyze";
}

function workflowLabel(workflow: string) {
  if (workflow === "job_reanalyze") return "Re-analyze";
  if (workflow === "initial_analyze") return "Initial analyze";
  return workflow.replace(/_/g, " ");
}

function getUpdateRole(run: AnalysisRun) {
  return String(detailValue(run, ["update_role", "updateRole", "role", "added_file.role", "file.role"]) || "—");
}

function getJobLabel(run: AnalysisRun) {
  return String(detailValue(run, ["job_id", "job_name", "job.id", "job.name", "target_job_id", "targetJobId"]) || "—");
}

function getOldRevenue(run: AnalysisRun) {
  return n(detailValue(run, ["old_revenue", "before_revenue", "revenue_before", "before.revenue", "original.revenue"]));
}

function getOldCosts(run: AnalysisRun) {
  return n(detailValue(run, ["old_costs", "old_cost", "before_costs", "costs_before", "before.costs", "original.costs"]));
}

function getOldProfit(run: AnalysisRun) {
  const explicit = detailValue(run, ["old_profit", "profit_before", "before.profit", "original.profit"]);
  if (explicit != null) return n(explicit);
  return getOldRevenue(run) - getOldCosts(run);
}

function getOldMargin(run: AnalysisRun) {
  const explicit = detailValue(run, ["old_margin", "old_margin_pct", "margin_before", "before.margin_pct", "before.margin"]);
  if (explicit != null) return n(explicit);
  const revenue = getOldRevenue(run);
  return revenue ? (getOldProfit(run) / revenue) * 100 : 0;
}

function getNewRevenue(run: AnalysisRun) {
  const explicit = detailValue(run, ["new_revenue", "after_revenue", "revenue_after", "after.revenue", "updated.revenue"]);
  if (explicit != null) return n(explicit);
  return getRevenue(run);
}

function getNewCosts(run: AnalysisRun) {
  const explicit = detailValue(run, ["new_costs", "new_cost", "after_costs", "costs_after", "after.costs", "updated.costs"]);
  if (explicit != null) return n(explicit);
  return getCosts(run);
}

function getNewProfit(run: AnalysisRun) {
  const explicit = detailValue(run, ["new_profit", "profit_after", "after.profit", "updated.profit"]);
  if (explicit != null) return n(explicit);
  return getProfit(run);
}

function getNewMargin(run: AnalysisRun) {
  const explicit = detailValue(run, ["new_margin", "new_margin_pct", "margin_after", "after.margin_pct", "after.margin"]);
  if (explicit != null) return n(explicit);
  const revenue = getNewRevenue(run);
  return revenue ? (getNewProfit(run) / revenue) * 100 : 0;
}

function getAddedRevenue(run: AnalysisRun) {
  return n(detailValue(run, ["added_revenue", "revenue_added", "added.revenue", "delta.revenue"]));
}

function getAddedCosts(run: AnalysisRun) {
  return n(detailValue(run, ["added_costs", "added_cost", "costs_added", "added.costs", "delta.costs"]));
}

function getAddedProfit(run: AnalysisRun) {
  const explicit = detailValue(run, ["added_profit", "profit_added", "added.profit", "delta.profit"]);
  if (explicit != null) return n(explicit);
  return getAddedRevenue(run) - getAddedCosts(run);
}

function getAddedBucket(run: AnalysisRun, bucket: keyof CostBreakdown) {
  const details = getWorkflowDetails(run);
  const candidates = [
    safeObject((run as any).added_cost_breakdown),
    safeObject(details.added_cost_breakdown),
    safeObject(details.added?.cost_breakdown),
    safeObject(details.delta?.cost_breakdown),
  ];
  const addedBreakdown = candidates.find((candidate) => Object.keys(candidate).length) || {};

  return n(addedBreakdown?.[bucket]);
}

function getRevenue(run: AnalysisRun) {
  return n(run.revenue_total ?? run.revenue_detected);
}

function getCosts(run: AnalysisRun) {
  return n(run.cost_total ?? run.costs_detected);
}

function getProfit(run: AnalysisRun) {
  const explicit = run.net_profit ?? run.net_profit_detected;
  if (explicit != null) return n(explicit);
  return getRevenue(run) - getCosts(run);
}

function getMargin(run: AnalysisRun) {
  const explicit = run.margin_percent ?? run.margin_pct;
  if (explicit != null) return n(explicit);
  const revenue = getRevenue(run);
  return revenue ? (getProfit(run) / revenue) * 100 : 0;
}

function getRuntime(run: AnalysisRun) {
  return n(run.processing_ms ?? run.processing_time_ms);
}

function getJobs(run: AnalysisRun) {
  return n(run.jobs_found ?? run.jobs_detected);
}

function getBucket(run: AnalysisRun, bucket: keyof CostBreakdown) {
  const aliases: Record<string, unknown> = {
    labor: run.labor_total ?? run.labor_detected,
    materials: run.materials_total ?? run.materials_detected,
    subs: run.subs_total ?? run.subs_detected,
    taxes: run.taxes_total ?? run.taxes_detected,
    other: run.other_total ?? run.other_detected,
    credits_total: run.credits_total ?? run.credits_detected,
  };

  return n(run.cost_breakdown?.[bucket] ?? aliases[bucket]);
}

function healthFlags(run: AnalysisRun): string[] {
  const flags: string[] = [];
  const revenue = getRevenue(run);
  const costs = getCosts(run);
  const jobs = getJobs(run);
  const runtimeMs = getRuntime(run);
  const other = getBucket(run, "other");
  const totalBuckets =
    getBucket(run, "labor") +
    getBucket(run, "materials") +
    getBucket(run, "subs") +
    getBucket(run, "taxes") +
    getBucket(run, "other");

  if (String(run.status || "").toLowerCase() === "failed") flags.push("Failed");
  if (jobs <= 0 && run.status === "success") flags.push("No jobs");
  if (revenue <= 0 && costs > 0) flags.push("Cost-only");
  if (costs <= 0 && revenue > 0) flags.push("Revenue-only");
  if (Math.abs(costs) > 0 && Math.abs(totalBuckets - costs) > 1) flags.push("Bucket mismatch");
  if (costs > 0 && other / costs > 0.35) flags.push("High Other");
  if (getBucket(run, "taxes") > 0) flags.push("Tax detected");
  if (getBucket(run, "credits_total") > 0) flags.push("Credits");
  if (runtimeMs > 60000) flags.push("Slow");
  if (getWorkflowType(run) === "job_reanalyze") flags.push("Re-analyze");

  return flags.slice(0, 4);
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "started") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function workflowClass(workflow: string) {
  if (workflow === "job_reanalyze") return "border-violet-200 bg-violet-50 text-violet-700";
  if (workflow === "initial_analyze") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("all");
  const [selectedRunId, setSelectedRunId] = useState<string | number | null>(null);

  const adminEmails = ["arman.tajalli@dropclarity.com"];
  const isAdmin = adminEmails.includes(user?.primaryEmailAddress?.emailAddress || "");

  const loadRuns = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const token = await getToken();
      const res = await fetch(`${WORKER_ORIGIN}/api/admin/analysis-runs?limit=250`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const text = await res.text();
      let data: AdminPayload | null = null;

      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error((data as any)?.error || text || `Failed to load admin data (${res.status})`);
      }

      setRuns(Array.isArray(data?.runs) ? data.runs : []);
      setSummary(data?.summary || {});
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isAdmin) loadRuns();
  }, [isLoaded, isAdmin, loadRuns]);

  const filteredRuns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return runs.filter((run) => {
      const status = String(run.status || "").toLowerCase();
      const workflow = getWorkflowType(run);
      const files = getRunFiles(run).map((file) => file.label).join(" ").toLowerCase();

      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (workflowFilter !== "all") {
        if (workflowFilter === "other" && ["initial_analyze", "job_reanalyze"].includes(workflow)) return false;
        if (workflowFilter !== "other" && workflow !== workflowFilter) return false;
      }

      if (!q) return true;

      return [
        run.email,
        run.user_id,
        run.plan,
        run.status,
        workflow,
        run.job_id,
        run.job_name,
        run.report_id,
        run.period_label,
        files,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [runs, search, statusFilter, workflowFilter]);

  const selectedRun = useMemo(() => {
    return filteredRuns.find((run) => String(run.id) === String(selectedRunId)) || filteredRuns[0] || null;
  }, [filteredRuns, selectedRunId]);

  const stats = useMemo(() => {
    const total = runs.length;
    const success = runs.filter((run) => run.status === "success").length;
    const failed = runs.filter((run) => run.status === "failed").length;
    const started = runs.filter((run) => run.status === "started").length;
    const reanalyze = runs.filter((run) => getWorkflowType(run) === "job_reanalyze").length;
    const totalRevenue = runs.reduce((sum, run) => sum + getRevenue(run), 0);
    const totalCosts = runs.reduce((sum, run) => sum + getCosts(run), 0);
    const totalProfit = runs.reduce((sum, run) => sum + getProfit(run), 0);
    const avgRuntime = total ? runs.reduce((sum, run) => sum + getRuntime(run), 0) / total : 0;
    const successRate = total ? (success / total) * 100 : 0;
    const taxRuns = runs.filter((run) => getBucket(run, "taxes") > 0).length;
    const creditRuns = runs.filter((run) => getBucket(run, "credits_total") > 0).length;
    const highOtherRuns = runs.filter((run) => {
      const costs = getCosts(run);
      return costs > 0 && getBucket(run, "other") / costs > 0.35;
    }).length;
    const missingRevenueRuns = runs.filter((run) => getRevenue(run) <= 0 && getCosts(run) > 0).length;

    return {
      total,
      success,
      failed,
      started,
      reanalyze,
      totalRevenue,
      totalCosts,
      totalProfit,
      avgRuntime,
      successRate,
      taxRuns,
      creditRuns,
      highOtherRuns,
      missingRevenueRuns,
    };
  }, [runs]);

  const workflowRows = useMemo(() => {
    const groups = new Map<string, AnalysisRun[]>();
    for (const run of runs) {
      const key = getWorkflowType(run);
      groups.set(key, [...(groups.get(key) || []), run]);
    }

    return Array.from(groups.entries()).map(([workflow, items]) => {
      const success = items.filter((run) => run.status === "success").length;
      return {
        workflow,
        count: items.length,
        successRate: items.length ? (success / items.length) * 100 : 0,
        avgRuntime: items.length ? items.reduce((sum, run) => sum + getRuntime(run), 0) / items.length : 0,
      };
    });
  }, [runs]);

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn />;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 font-medium text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px] space-y-5">
        {!isAdmin ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-950">Access denied</h1>
            <p className="mt-2 text-sm text-slate-500">You do not have permission to access this admin dashboard.</p>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Admin operations
                  </div>
                  <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Analysis Quality Monitor</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Track initial analyses, re-analyze updates, file access, cost-bucket attribution, runtime, and warning flags across every test workflow.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Search user, job, report, file..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 sm:w-[340px]"
                  />
                  <button
                    type="button"
                    onClick={loadRuns}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
              <StatCard label="Runs" value={stats.total.toLocaleString()} sublabel="All workflows" />
              <StatCard label="Success rate" value={pct(stats.successRate)} sublabel={`${stats.success} successful`} tone={stats.successRate >= 95 ? "good" : "warn"} />
              <StatCard label="Failed" value={stats.failed.toLocaleString()} sublabel="Needs review" tone={stats.failed ? "bad" : "good"} />
              <StatCard label="Re-analyzes" value={stats.reanalyze.toLocaleString()} sublabel="Add missing invoice" tone="info" />
              <StatCard label="Revenue" value={money(stats.totalRevenue)} sublabel="Scanned" />
              <StatCard label="Costs" value={money(stats.totalCosts)} sublabel="Scanned" />
              <StatCard label="Profit" value={money(stats.totalProfit)} sublabel="Net detected" tone={stats.totalProfit >= 0 ? "good" : "bad"} />
              <StatCard label="Avg runtime" value={runtime(stats.avgRuntime)} sublabel="All runs" tone={stats.avgRuntime > 60000 ? "warn" : "info"} />
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Workflow health</h2>
                    <p className="text-sm text-slate-500">Confirms each path is being tracked separately.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {workflowRows.length ? (
                    workflowRows.map((row) => (
                      <div key={row.workflow} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${workflowClass(row.workflow)}`}>
                            {workflowLabel(row.workflow)}
                          </span>
                          <span className="text-sm font-semibold text-slate-950">{row.count}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-slate-500">Success</div>
                            <div className="font-semibold">{pct(row.successRate)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Avg runtime</div>
                            <div className="font-semibold">{runtime(row.avgRuntime)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No workflow data yet.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950">Parsing watchlist</h2>
                <p className="mt-1 text-sm text-slate-500">Quick counters for issues you want to catch before users do.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <WatchCard label="Tax detected" value={stats.taxRuns} />
                  <WatchCard label="Credits detected" value={stats.creditRuns} />
                  <WatchCard label="High Other bucket" value={stats.highOtherRuns} tone={stats.highOtherRuns ? "warn" : "good"} />
                  <WatchCard label="Cost-only runs" value={stats.missingRevenueRuns} tone={stats.missingRevenueRuns ? "warn" : "good"} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Run audit log</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Click any run to open all files, bucket diagnostics, warnings, and workflow details.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none"
                    >
                      <option value="all">All statuses</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="started">Started</option>
                    </select>

                    <select
                      value={workflowFilter}
                      onChange={(event) => setWorkflowFilter(event.target.value as WorkflowFilter)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none"
                    >
                      <option value="all">All workflows</option>
                      <option value="initial_analyze">Initial analyze</option>
                      <option value="job_reanalyze">Re-analyze</option>
                      <option value="other">Other</option>
                    </select>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                      {filteredRuns.length.toLocaleString()} visible
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">Loading admin data...</div>
              ) : error ? (
                <div className="p-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
                </div>
              ) : filteredRuns.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No runs match the current filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1320px] w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Run</th>
                        <th className="px-4 py-3">Workflow</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Files</th>
                        <th className="px-4 py-3 text-right">Jobs</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Costs</th>
                        <th className="px-4 py-3 text-right">Profit</th>
                        <th className="px-4 py-3 text-right">Margin</th>
                        <th className="px-4 py-3 text-right">Runtime</th>
                        <th className="px-4 py-3">Flags</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRuns.map((run) => (
                        <RunRow
                          key={String(run.id)}
                          run={run}
                          selected={String(selectedRun?.id) === String(run.id)}
                          onSelect={() => setSelectedRunId(run.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {selectedRun ? <RunDetailPanel run={selectedRun} /> : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Admin API summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Raw backend summary is kept here for quick sanity checks while you are still testing.
              </p>
              <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(summary || {}, null, 2)}
              </pre>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function RunRow({ run, selected, onSelect }: { run: AnalysisRun; selected: boolean; onSelect: () => void }) {
  const files = getRunFiles(run);
  const workflow = getWorkflowType(run);
  const status = String(run.status || "unknown").toLowerCase();
  const profit = getProfit(run);
  const flags = healthFlags(run);

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer transition hover:bg-slate-50 ${selected ? "bg-sky-50/60" : "bg-white"}`}
    >
      <td className="px-4 py-4 align-top">
        <div className="max-w-[260px]">
          <div className="truncate font-semibold text-slate-950">{run.email || "Unknown user"}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{run.user_id || "No user id"}</div>
          <div className="mt-1 truncate text-xs text-slate-400">{run.report_id || "No report id"}</div>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <span className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${workflowClass(workflow)}`}>
          {workflowLabel(workflow)}
        </span>
        {workflow === "job_reanalyze" ? (
          <div className="mt-2 text-xs text-slate-500">
            {getUpdateRole(run)} · {getJobLabel(run)}
          </div>
        ) : null}
      </td>

      <td className="px-4 py-4 align-top">
        <span className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${statusClass(status)}`}>{status}</span>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="max-w-[320px]">
          {files.length ? (
            <div className="space-y-1">
              {files.slice(0, 2).map((file, idx) => (
                <FileAnchor key={`${file.label}-${idx}`} file={file} />
              ))}
              {files.length > 2 ? (
                <div className="text-xs font-medium text-slate-500">+{files.length - 2} more available in detail panel</div>
              ) : null}
            </div>
          ) : (
            <span className="text-sm text-slate-400">No files logged</span>
          )}
        </div>
      </td>

      <td className="px-4 py-4 text-right align-top font-medium">{getJobs(run).toLocaleString()}</td>
      <td className="px-4 py-4 text-right align-top font-medium">{money(getRevenue(run))}</td>
      <td className="px-4 py-4 text-right align-top font-medium">{money(getCosts(run))}</td>
      <td className={`px-4 py-4 text-right align-top font-semibold ${profit < 0 ? "text-red-600" : "text-emerald-700"}`}>
        {money(profit)}
      </td>
      <td className="px-4 py-4 text-right align-top font-medium">{pct(getMargin(run))}</td>
      <td className="px-4 py-4 text-right align-top font-medium">{runtime(getRuntime(run))}</td>
      <td className="px-4 py-4 align-top">
        <div className="flex max-w-[240px] flex-wrap gap-1">
          {flags.length ? flags.map((flag) => <Flag key={flag} label={flag} />) : <span className="text-xs text-slate-400">Clean</span>}
        </div>
      </td>
      <td className="px-4 py-4 align-top text-xs font-medium text-slate-500">{safeDate(run.created_at)}</td>
    </tr>
  );
}

function RunDetailPanel({ run }: { run: AnalysisRun }) {
  const files = getRunFiles(run);
  const workflow = getWorkflowType(run);
  const flags = healthFlags(run);
  const buckets = [
    ["Labor", getBucket(run, "labor")],
    ["Materials", getBucket(run, "materials")],
    ["Subcontractors", getBucket(run, "subs")],
    ["Taxes", getBucket(run, "taxes")],
    ["Other", getBucket(run, "other")],
    ["Credits", getBucket(run, "credits_total")],
  ] as const;

  const costs = getCosts(run);
  const bucketSum = buckets.slice(0, 5).reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const bucketDiff = costs - bucketSum;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Selected run detail</h2>
            <p className="mt-1 text-sm text-slate-500">
              {run.email || "Unknown user"} · {workflowLabel(workflow)} · {safeDate(run.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${workflowClass(workflow)}`}>{workflowLabel(workflow)}</span>
            <span className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${statusClass(String(run.status || ""))}`}>{run.status || "unknown"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Workflow</h3>
          <div className="mt-3 space-y-2 text-sm">
            <KeyValue label="Plan" value={run.plan || "free"} />
            <KeyValue label="Report ID" value={run.report_id || "—"} />
            <KeyValue label="Period" value={run.period_label || "—"} />
            <KeyValue label="Job" value={getJobLabel(run)} />
            <KeyValue label="Update role" value={getUpdateRole(run)} />
            <KeyValue label="Runtime" value={runtime(getRuntime(run))} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Financial output</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniMetric label="Revenue" value={money(getRevenue(run))} />
            <MiniMetric label="Costs" value={money(getCosts(run))} />
            <MiniMetric label="Profit" value={money(getProfit(run))} tone={getProfit(run) < 0 ? "bad" : "good"} />
            <MiniMetric label="Margin" value={pct(getMargin(run))} />
          </div>
          {workflow === "job_reanalyze" ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniMetric label="Added revenue" value={money(getAddedRevenue(run))} />
              <MiniMetric label="Added costs" value={money(getAddedCosts(run))} />
              <MiniMetric label="Added profit" value={money(getAddedProfit(run))} tone={getAddedProfit(run) < 0 ? "bad" : "good"} />
              <MiniMetric label="New margin" value={pct(getNewMargin(run))} />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Quality flags</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {flags.length ? flags.map((flag) => <Flag key={flag} label={flag} />) : <span className="text-sm text-slate-500">No warning flags for this run.</span>}
          </div>
          {run.error_message ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {run.error_message}
            </div>
          ) : null}
        </div>
      </div>

      {workflow === "job_reanalyze" ? (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Re-analyze comparison</h3>
                <p className="text-xs text-slate-600">Shows the original job result next to the updated result after the added invoice.</p>
              </div>
              <span className="rounded-full border border-violet-200 bg-white px-2 py-1 text-xs font-semibold text-violet-700">
                {getUpdateRole(run)} added
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <ComparisonCard title="Original job" revenue={getOldRevenue(run)} costs={getOldCosts(run)} profit={getOldProfit(run)} margin={getOldMargin(run)} />
              <ComparisonCard title="Added invoice" revenue={getAddedRevenue(run)} costs={getAddedCosts(run)} profit={getAddedProfit(run)} margin={getAddedRevenue(run) ? (getAddedProfit(run) / getAddedRevenue(run)) * 100 : 0} />
              <ComparisonCard title="Updated job" revenue={getNewRevenue(run)} costs={getNewCosts(run)} profit={getNewProfit(run)} margin={getNewMargin(run)} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 px-4 pb-4 xl:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">Cost bucket diagnostics</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${Math.abs(bucketDiff) <= 1 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              Difference: {money(bucketDiff)}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {buckets.map(([label, value]) => {
              const base = Math.max(1, Math.abs(costs));
              const width = Math.min(100, (Math.abs(Number(value || 0)) / base) * 100);
              return (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-950">{money(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-400" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">All files</h3>
              <p className="mt-1 text-xs text-slate-500">Every uploaded file is selectable here, including the files previously hidden behind “+ more”.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
              {files.length} file{files.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            {files.length ? (
              files.map((file, idx) => (
                <div key={`${file.label}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <FileAnchor file={file} />
                  {file.role || file.jobId || file.mime ? (
                    <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-500">
                      {file.role ? <span>Role: {file.role}</span> : null}
                      {file.jobId ? <span>Job: {file.jobId}</span> : null}
                      {file.mime ? <span>{file.mime}</span> : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                No file links were returned for this run.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <details className="rounded-xl border border-slate-200 bg-slate-950">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-white">Raw diagnostics JSON</summary>
          <pre className="max-h-[360px] overflow-auto border-t border-slate-800 p-4 text-xs leading-5 text-slate-100">
            {JSON.stringify(run.diagnostics || run, null, 2)}
          </pre>
        </details>
      </div>
    </section>
  );
}

function ComparisonCard({
  title,
  revenue,
  costs,
  profit,
  margin,
}: {
  title: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">{title}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Revenue" value={money(revenue)} />
        <MiniMetric label="Costs" value={money(costs)} />
        <MiniMetric label="Profit" value={money(profit)} tone={profit < 0 ? "bad" : "good"} />
        <MiniMetric label="Margin" value={pct(margin)} />
      </div>
    </div>
  );
}

function FileAnchor({ file }: { file: FileLink }) {
  if (file.href) {
    return (
      <a
        href={file.href}
        target="_blank"
        rel="noreferrer"
        className="block truncate text-sm font-medium text-sky-700 underline decoration-sky-200 underline-offset-4 hover:text-sky-900"
        title={file.label}
        onClick={(event) => event.stopPropagation()}
      >
        {file.label}
      </a>
    );
  }

  return (
    <span className="block truncate text-sm font-medium text-slate-500" title={`${file.label} — no URL saved`}>
      {file.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const dot =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "bad"
          ? "bg-red-500"
          : tone === "info"
            ? "bg-sky-500"
            : "bg-slate-400";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`mt-1 h-2 w-2 rounded-full ${dot}`} />
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</div>
      {sublabel ? <div className="mt-1 text-xs text-slate-500">{sublabel}</div> : null}
    </div>
  );
}

function WatchCard({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "good" | "warn" }) {
  return (
    <div className={`rounded-xl border p-3 ${tone === "warn" ? "border-amber-200 bg-amber-50" : tone === "good" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value.toLocaleString()}</div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[220px] break-words text-right font-medium text-slate-950">{value}</span>
    </div>
  );
}

function MiniMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-600" : "text-slate-950"}`}>
        {value}
      </div>
    </div>
  );
}

function Flag({ label }: { label: string }) {
  const bad = ["Failed", "No jobs", "Bucket mismatch"].includes(label);
  const warn = ["Cost-only", "Revenue-only", "High Other", "Slow"].includes(label);

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        bad ? "bg-red-50 text-red-700" : warn ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}
