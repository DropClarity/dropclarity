"use client";

import { useEffect, useMemo, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/nextjs";

interface AnalysisRun {
  id: number;
  user_id: string;
  email: string;
  plan: string;
  status: string;
  filenames: string;
  jobs_found: number;
  revenue_total: number;
  cost_total: number;
  net_profit: number;
  margin_percent: number;
  processing_ms: number;
  created_at: string;
  error_message?: string;

  // Optional fields for future Worker support. The page stays safe if the
  // Worker only returns filenames today.
  file_urls?: string | string[];
  uploaded_files?:
    | string
    | Array<{
        filename?: string;
        name?: string;
        url?: string;
        cdnUrl?: string;
        cdn_url?: string;
        uuid?: string;
      }>;
  files?:
    | string
    | Array<{
        filename?: string;
        name?: string;
        url?: string;
        cdnUrl?: string;
        cdn_url?: string;
        uuid?: string;
      }>;
}

type AdminFileLink = {
  label: string;
  href?: string;
};

function money(value: number | string | undefined | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";

  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function pct(value: number | string | undefined | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.0%";
  return `${n.toFixed(1)}%`;
}

function runtime(value: number | string | undefined | null) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "0.0s";
  return `${(n / 1000).toFixed(1)}s`;
}

function safeDate(value: string | undefined | null) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function asArrayFromMaybeJson(value: unknown): any[] {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    return trimmed
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeFileUrl(raw: string | undefined | null) {
  if (!raw) return undefined;

  const value = String(raw).trim();
  if (!value) return undefined;

  if (/^https?:\/\//i.test(value)) return value;

  const uuidMatch = value.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );

  if (uuidMatch?.[0]) {
    return `https://ucarecdn.com/${uuidMatch[0]}/`;
  }

  return undefined;
}

function getRunFiles(run: AnalysisRun): AdminFileLink[] {
  const fileObjects = [
    ...asArrayFromMaybeJson(run.uploaded_files),
    ...asArrayFromMaybeJson(run.files),
  ];

  const objectLinks = fileObjects
    .map((file) => {
      if (typeof file === "string") {
        return {
          label: file,
          href: normalizeFileUrl(file),
        };
      }

      const label =
        file?.filename ||
        file?.name ||
        file?.url ||
        file?.cdnUrl ||
        file?.cdn_url ||
        file?.uuid ||
        "Uploaded file";

      const href =
        normalizeFileUrl(file?.url) ||
        normalizeFileUrl(file?.cdnUrl) ||
        normalizeFileUrl(file?.cdn_url) ||
        normalizeFileUrl(file?.uuid) ||
        normalizeFileUrl(label);

      return { label: String(label), href };
    })
    .filter((file) => file.label);

  const urlParts = asArrayFromMaybeJson(run.file_urls).map((url) => ({
    label: String(url).split("/").filter(Boolean).pop() || String(url),
    href: normalizeFileUrl(String(url)),
  }));

  const filenameParts = asArrayFromMaybeJson(run.filenames).map((name) => ({
    label: String(name),
    href: normalizeFileUrl(String(name)),
  }));

  const merged = [...objectLinks, ...urlParts, ...filenameParts];
  const seen = new Set<string>();

  return merged.filter((file) => {
    const key = `${file.label}|${file.href || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const adminEmails = ["arman.tajalli@dropclarity.com"];

  const isAdmin = adminEmails.includes(
    user?.primaryEmailAddress?.emailAddress || "",
  );

  useEffect(() => {
    async function loadRuns() {
      try {
        setLoading(true);
        setError("");

        const token = await getToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WORKER_URL}/api/admin/analysis-runs`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        const text = await res.text();
        let data: any = null;

        try {
          data = JSON.parse(text);
        } catch {}

        if (!res.ok) {
          throw new Error(
            data?.error || text || `Failed to load admin data (${res.status})`,
          );
        }

        setRuns(data?.runs || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && isAdmin) {
      loadRuns();
    }
  }, [isLoaded, isAdmin, getToken]);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const q = search.toLowerCase();
      const fileText = getRunFiles(run)
        .map((file) => file.label)
        .join(" ")
        .toLowerCase();

      return (
        run.email?.toLowerCase().includes(q) ||
        run.plan?.toLowerCase().includes(q) ||
        run.status?.toLowerCase().includes(q) ||
        run.filenames?.toLowerCase().includes(q) ||
        fileText.includes(q)
      );
    });
  }, [runs, search]);

  const totalRuns = runs.length;

  const successfulRuns = runs.filter((r) => r.status === "success").length;

  const failedRuns = runs.filter((r) => r.status === "failed").length;

  const totalRevenue = runs.reduce(
    (sum, r) => sum + (Number(r.revenue_total) || 0),
    0,
  );

  const totalProfit = runs.reduce(
    (sum, r) => sum + (Number(r.net_profit) || 0),
    0,
  );

  const avgProcessing =
    runs.length > 0
      ? Math.round(
          runs.reduce((sum, r) => sum + (Number(r.processing_ms) || 0), 0) /
            runs.length,
        )
      : 0;

  const successRate =
    totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

  if (!isLoaded) {
    return null;
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 px-3 py-6 text-slate-950 sm:px-5 sm:py-8 lg:px-8 lg:py-10 xl:px-10 2xl:px-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-140px] h-[420px] w-[520px] rounded-full bg-violet-200/40 blur-[110px]" />
        <div className="absolute right-[-180px] top-[-80px] h-[420px] w-[560px] rounded-full bg-cyan-200/40 blur-[115px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[420px] w-[760px] rounded-full bg-blue-100/65 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:52px_52px] opacity-[0.30]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] space-y-5 sm:space-y-6">
        {!isAdmin ? (
          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-7 text-center shadow-xl shadow-slate-200/70 backdrop-blur sm:p-9">
            <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-sm font-black text-red-600">
              !
            </div>
            <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Access Denied
            </h1>
            <p className="mx-auto max-w-md text-sm font-semibold leading-5 text-slate-500 sm:text-sm">
              You do not have permission to access the Admin View
              dashboard.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-6 lg:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-5 inline-flex rounded-full border border-cyan-200 bg-cyan-50/70 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
  Admin View
</div>

<h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
  Analysis Monitoring
</h1>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-5 text-slate-600 sm:text-sm">
                    Monitor uploads, analysis health, customer usage,
                    profitability totals, and processing performance across all
                    users.
                  </p>
                </div>

                <div className="w-full lg:w-[360px]">
                  <label className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-400">
                    Search activity
                  </label>
                  <input
                    type="text"
                    placeholder="Search users, plans, files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 sm:text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                label="Total Analyses"
                value={totalRuns.toLocaleString()}
                sublabel="All tracked runs"
              />

              <StatCard
                label="Successful"
                value={successfulRuns.toLocaleString()}
                sublabel={`${successRate}% success rate`}
              />

              <StatCard
                label="Failed"
                value={failedRuns.toLocaleString()}
                sublabel="Needs review"
                tone={failedRuns > 0 ? "red" : "slate"}
              />

              <StatCard
                label="Revenue Scanned"
                value={money(totalRevenue)}
                sublabel="Across analyses"
              />

              <StatCard
                label="Avg Runtime"
                value={runtime(avgProcessing)}
                sublabel="Processing speed"
              />
            </section>

            <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white/92 shadow-xl shadow-slate-200/70 backdrop-blur">
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-xl">
                    Recent Analysis Activity
                  </h2>

                  <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
                    Live visibility into customer uploads and parsing
                    performance.
                  </p>
                </div>

                <div className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] font-black text-slate-500">
                  {filteredRuns.length.toLocaleString()} visible
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm font-bold text-slate-500">
                  Loading analysis data...
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-black text-red-700 sm:text-sm">
                    {error}
                  </div>
                </div>
              ) : filteredRuns.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto max-w-lg rounded-3xl border border-slate-100 bg-slate-50 px-6 py-8">
                    <h3 className="text-lg font-black text-slate-950">
                      No analysis activity yet
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
                      Run a new analysis after the Worker logging update is
                      deployed, then refresh this page.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="hidden grid-cols-[minmax(230px,1.35fr)_90px_105px_minmax(300px,1.55fr)_80px_110px_110px_110px_85px_90px_130px] gap-3 bg-slate-50/70 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-400 xl:grid">
                    <div>User</div>
                    <div>Plan</div>
                    <div>Status</div>
                    <div>Files</div>
                    <div>Jobs</div>
                    <div>Revenue</div>
                    <div>Costs</div>
                    <div>Profit</div>
                    <div>Margin</div>
                    <div>Runtime</div>
                    <div>Date</div>
                  </div>

                  {filteredRuns.map((run) => (
                    <AnalysisRunRow key={run.id} run={run} />
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
                <h3 className="mb-4 text-xl font-black tracking-tight text-slate-950">
                  Platform Health
                </h3>

                <div className="space-y-3">
                  <HealthRow label="Success Rate" value={`${successRate}%`} />

                  <HealthRow
                    label="Total Profit Scanned"
                    value={money(totalProfit)}
                  />

                  <HealthRow
                    label="Average Runtime"
                    value={runtime(avgProcessing)}
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
                <h3 className="mb-4 text-xl font-black tracking-tight text-slate-950">
                  What You Can Monitor
                </h3>

                <div className="grid gap-2 text-sm font-semibold leading-5 text-slate-600 sm:grid-cols-2">
                  <MonitorItem text="Which users are actively uploading reports" />
                  <MonitorItem text="Which analyses fail or take too long" />
                  <MonitorItem text="Average parsing speed across uploads" />
                  <MonitorItem text="What file types users upload most" />
                  <MonitorItem text="Revenue and profitability totals processed" />
                  <MonitorItem text="Which plans are most active" />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AnalysisRunRow({ run }: { run: AnalysisRun }) {
  const success = run.status === "success";
  const started = run.status === "started";
  const netProfit = Number(run.net_profit || 0);
  const files = getRunFiles(run);

  return (
    <div className="grid gap-3 px-4 py-4 transition-colors hover:bg-cyan-50/35 xl:grid-cols-[minmax(230px,1.35fr)_90px_105px_minmax(300px,1.55fr)_80px_110px_110px_110px_85px_90px_130px] xl:items-center">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-black text-slate-950">
          {run.email || "Unknown User"}
        </p>

        <p className="mt-1 line-clamp-2 break-all text-[13px] font-semibold leading-4 text-slate-400">
          {run.user_id}
        </p>
      </div>

      <div>
        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-sm font-black capitalize text-slate-600 shadow-sm">
          {run.plan || "free"}
        </span>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-black ${
            success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : started
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {run.status}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap gap-1.5">
          {files.length ? (
            files.slice(0, 4).map((file, idx) =>
              file.href ? (
                <a
                  key={`${file.label}-${idx}`}
                  href={file.href}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[190px] truncate rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-sm font-black text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100"
                  title={file.label}
                >
                  {file.label}
                </a>
              ) : (
                <span
                  key={`${file.label}-${idx}`}
                  className="max-w-[190px] truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-bold text-slate-500"
                  title={`${file.label} — no file URL stored yet`}
                >
                  {file.label}
                </span>
              ),
            )
          ) : (
            <span className="text-sm font-bold text-slate-400">
              No files logged
            </span>
          )}

          {files.length > 4 && (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-sm font-black text-slate-500">
              +{files.length - 4}
            </span>
          )}
        </div>

        {files.length > 0 && !files.some((file) => file.href) && (
          <p className="mt-1 text-[13px] font-semibold leading-4 text-slate-400">
            File names only. Add UUID/CDN URL logging in Worker to open files.
          </p>
        )}
      </div>

      <MetricBlock label="Jobs" value={String(run.jobs_found || 0)} />
      <MetricBlock label="Revenue" value={money(run.revenue_total)} />
      <MetricBlock label="Costs" value={money(run.cost_total)} />

      <MetricBlock
        label="Profit"
        value={money(netProfit)}
        valueClass={netProfit >= 0 ? "text-emerald-700" : "text-red-600"}
      />

      <MetricBlock label="Margin" value={pct(run.margin_percent)} />
      <MetricBlock label="Runtime" value={runtime(run.processing_ms)} />
      <MetricBlock label="Date" value={safeDate(run.created_at)} compact />
    </div>
  );
}

function MetricBlock({
  label,
  value,
  compact = false,
  valueClass = "text-slate-800",
}: {
  label: string;
  value: string;
  compact?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3 xl:block xl:border-0 xl:bg-transparent xl:p-0">
      <span className="text-[13px] font-black uppercase tracking-wider text-slate-400 xl:hidden">
        {label}
      </span>
      <span
        className={`text-[15px] font-black ${compact ? "xl:text-sm" : ""} ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  tone = "slate",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "slate" | "red";
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-200/60 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <span
          className={`h-2 w-2 rounded-full ${
            tone === "red" ? "bg-red-500" : "bg-cyan-400"
          }`}
        />
      </div>

      <h3 className="mt-2.5 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </h3>

      {sublabel && (
        <p className="mt-1.5 text-[13px] font-bold text-slate-400">
          {sublabel}
        </p>
      )}
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-950">{value}</span>
    </div>
  );
}

function MonitorItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
      <span>{text}</span>
    </div>
  );
}
