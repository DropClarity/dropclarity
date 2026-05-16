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

      return (
        run.email?.toLowerCase().includes(q) ||
        run.plan?.toLowerCase().includes(q) ||
        run.status?.toLowerCase().includes(q) ||
        run.filenames?.toLowerCase().includes(q)
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
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-140px] h-[420px] w-[520px] rounded-full bg-violet-200/45 blur-[110px]" />
        <div className="absolute right-[-180px] top-[-80px] h-[420px] w-[560px] rounded-full bg-cyan-200/45 blur-[115px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[420px] w-[760px] rounded-full bg-blue-100/70 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.32]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
        {!isAdmin ? (
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center shadow-xl shadow-slate-200/70 backdrop-blur sm:p-10">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600">
              !
            </div>
            <h1 className="mb-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Access Denied
            </h1>
            <p className="mx-auto max-w-md text-sm font-semibold leading-6 text-slate-500 sm:text-base">
              You do not have permission to access the DropClarity admin
              dashboard.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-7 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50/70 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    DropClarity Admin
                  </div>

                  <h1 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                    Analysis Monitoring
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                    Monitor uploads, analysis health, customer usage,
                    profitability totals, and processing performance across all
                    users.
                  </p>
                </div>

                <div className="w-full lg:w-[380px]">
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                    Search activity
                  </label>
                  <input
                    type="text"
                    placeholder="Search users, plans, files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                value={`$${Math.round(totalRevenue).toLocaleString()}`}
                sublabel="Across analyses"
              />

              <StatCard
                label="Avg Runtime"
                value={`${(avgProcessing / 1000).toFixed(1)}s`}
                sublabel="Processing speed"
              />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-white/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                    Recent Analysis Activity
                  </h2>

                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    Live visibility into customer uploads and parsing
                    performance.
                  </p>
                </div>

                <div className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
                  {filteredRuns.length.toLocaleString()} visible
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm font-bold text-slate-500">
                  Loading analysis data...
                </div>
              ) : error ? (
                <div className="p-10 text-center">
                  <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
                    {error}
                  </div>
                </div>
              ) : filteredRuns.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto max-w-lg rounded-3xl border border-slate-100 bg-slate-50 px-6 py-8">
                    <h3 className="text-lg font-black text-slate-950">
                      No analysis activity yet
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      Run a new analysis after the Worker logging update is
                      deployed, then refresh this page.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Plan</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Files</th>
                        <th className="px-6 py-4">Jobs</th>
                        <th className="px-6 py-4">Revenue</th>
                        <th className="px-6 py-4">Costs</th>
                        <th className="px-6 py-4">Profit</th>
                        <th className="px-6 py-4">Margin</th>
                        <th className="px-6 py-4">Runtime</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRuns.map((run) => {
                        const success = run.status === "success";
                        const netProfit = Number(run.net_profit || 0);

                        return (
                          <tr
                            key={run.id}
                            className="border-b border-slate-100 transition-colors hover:bg-cyan-50/40"
                          >
                            <td className="px-6 py-5">
                              <div>
                                <p className="font-black text-slate-950">
                                  {run.email || "Unknown User"}
                                </p>

                                <p className="mt-1 max-w-[240px] break-all text-xs font-semibold text-slate-400">
                                  {run.user_id}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black capitalize text-slate-600 shadow-sm">
                                {run.plan || "free"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${
                                  success
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                                }`}
                              >
                                {run.status}
                              </span>
                            </td>

                            <td className="max-w-[260px] px-6 py-5 text-sm font-semibold text-slate-600">
                              <div className="space-y-1">
                                {(run.filenames || "")
                                  .split(",")
                                  .filter(Boolean)
                                  .slice(0, 3)
                                  .map((file, idx) => (
                                    <div key={idx} className="truncate">
                                      {file.trim()}
                                    </div>
                                  ))}
                              </div>
                            </td>

                            <td className="px-6 py-5 font-black text-slate-800">
                              {run.jobs_found || 0}
                            </td>

                            <td className="px-6 py-5 font-black text-slate-950">
                              ${Number(run.revenue_total || 0).toLocaleString()}
                            </td>

                            <td className="px-6 py-5 font-semibold text-slate-600">
                              ${Number(run.cost_total || 0).toLocaleString()}
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={
                                  netProfit >= 0
                                    ? "font-black text-emerald-700"
                                    : "font-black text-red-600"
                                }
                              >
                                ${netProfit.toLocaleString()}
                              </span>
                            </td>

                            <td className="px-6 py-5 font-semibold text-slate-600">
                              {Number(run.margin_percent || 0).toFixed(1)}%
                            </td>

                            <td className="px-6 py-5 font-semibold text-slate-600">
                              {(Number(run.processing_ms || 0) / 1000).toFixed(
                                1,
                              )}
                              s
                            </td>

                            <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-500">
                              {new Date(run.created_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-6">
                <h3 className="mb-5 text-xl font-black tracking-tight text-slate-950">
                  Platform Health
                </h3>

                <div className="space-y-4">
                  <HealthRow label="Success Rate" value={`${successRate}%`} />

                  <HealthRow
                    label="Total Profit Scanned"
                    value={`$${Math.round(totalProfit).toLocaleString()}`}
                  />

                  <HealthRow
                    label="Average Runtime"
                    value={`${(avgProcessing / 1000).toFixed(1)} seconds`}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-6">
                <h3 className="mb-5 text-xl font-black tracking-tight text-slate-950">
                  What You Can Monitor
                </h3>

                <div className="grid gap-3 text-sm font-semibold leading-6 text-slate-600 sm:grid-cols-2">
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
    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <span
          className={`h-2.5 w-2.5 rounded-full ${
            tone === "red" ? "bg-red-500" : "bg-cyan-400"
          }`}
        />
      </div>

      <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </h3>

      {sublabel && (
        <p className="mt-2 text-xs font-bold text-slate-400">{sublabel}</p>
      )}
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
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
