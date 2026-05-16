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

  const adminEmails = [
    "arman.tajalli@dropclarity.com",
  ];

  const isAdmin = adminEmails.includes(user?.primaryEmailAddress?.emailAddress || "");

  useEffect(() => {
    async function loadRuns() {
      try {
        setLoading(true);

        const token = await getToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WORKER_URL}/api/admin/analysis-runs`,
          {
            credentials: "include",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load admin data");
        }

        const data = await res.json();

        setRuns(data.runs || []);
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
    0
  );

  const totalProfit = runs.reduce(
    (sum, r) => sum + (Number(r.net_profit) || 0),
    0
  );

  const avgProcessing =
    runs.length > 0
      ? Math.round(
          runs.reduce((sum, r) => sum + (Number(r.processing_ms) || 0), 0) /
            runs.length
        )
      : 0;

  if (!isLoaded) {
    return null;
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {!isAdmin ? (
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-10 text-center">
                <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
                <p className="text-white/60">
                  You do not have permission to access the admin dashboard.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-white/40 mb-3">
                      DropClarity Admin
                    </p>

                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                      Analysis Monitoring
                    </h1>

                    <p className="text-white/60 mt-4 max-w-2xl text-lg">
                      Monitor uploads, analysis health, customer usage,
                      profitability totals, and processing performance across
                      all users.
                    </p>
                  </div>

                  <div className="w-full lg:w-[360px]">
                    <input
                      type="text"
                      placeholder="Search users, plans, files..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  <StatCard
                    label="Total Analyses"
                    value={totalRuns.toLocaleString()}
                  />

                  <StatCard
                    label="Successful"
                    value={successfulRuns.toLocaleString()}
                  />

                  <StatCard
                    label="Failed"
                    value={failedRuns.toLocaleString()}
                  />

                  <StatCard
                    label="Revenue Scanned"
                    value={`$${Math.round(totalRevenue).toLocaleString()}`}
                  />

                  <StatCard
                    label="Avg Runtime"
                    value={`${(avgProcessing / 1000).toFixed(1)}s`}
                  />
                </div>

                <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        Recent Analysis Activity
                      </h2>

                      <p className="text-white/50 mt-1 text-sm">
                        Live visibility into customer uploads and parsing
                        performance.
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="p-10 text-center text-white/50">
                      Loading analysis data...
                    </div>
                  ) : error ? (
                    <div className="p-10 text-center text-red-400">
                      {error}
                    </div>
                  ) : filteredRuns.length === 0 ? (
                    <div className="p-10 text-center text-white/50">
                      No analysis activity found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1200px]">
                        <thead>
                          <tr className="border-b border-white/10 text-left text-sm text-white/40">
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Plan</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Files</th>
                            <th className="px-6 py-4 font-medium">Jobs</th>
                            <th className="px-6 py-4 font-medium">Revenue</th>
                            <th className="px-6 py-4 font-medium">Costs</th>
                            <th className="px-6 py-4 font-medium">Profit</th>
                            <th className="px-6 py-4 font-medium">Margin</th>
                            <th className="px-6 py-4 font-medium">Runtime</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredRuns.map((run) => {
                            const success = run.status === "success";

                            return (
                              <tr
                                key={run.id}
                                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                              >
                                <td className="px-6 py-5">
                                  <div>
                                    <p className="font-medium text-white">
                                      {run.email || "Unknown User"}
                                    </p>

                                    <p className="text-xs text-white/40 mt-1 break-all">
                                      {run.user_id}
                                    </p>
                                  </div>
                                </td>

                                <td className="px-6 py-5 capitalize text-white/80">
                                  {run.plan || "free"}
                                </td>

                                <td className="px-6 py-5">
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                                      success
                                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                        : "bg-red-500/10 text-red-300 border-red-500/20"
                                    }`}
                                  >
                                    {run.status}
                                  </span>
                                </td>

                                <td className="px-6 py-5 text-sm text-white/70 max-w-[260px]">
                                  <div className="space-y-1">
                                    {(run.filenames || "")
                                      .split(",")
                                      .slice(0, 3)
                                      .map((file, idx) => (
                                        <div
                                          key={idx}
                                          className="truncate"
                                        >
                                          {file.trim()}
                                        </div>
                                      ))}
                                  </div>
                                </td>

                                <td className="px-6 py-5 text-white/80">
                                  {run.jobs_found || 0}
                                </td>

                                <td className="px-6 py-5 text-white font-medium">
                                  ${Number(run.revenue_total || 0).toLocaleString()}
                                </td>

                                <td className="px-6 py-5 text-white/80">
                                  ${Number(run.cost_total || 0).toLocaleString()}
                                </td>

                                <td className="px-6 py-5">
                                  <span
                                    className={
                                      Number(run.net_profit) >= 0
                                        ? "text-emerald-300 font-medium"
                                        : "text-red-300 font-medium"
                                    }
                                  >
                                    ${Number(run.net_profit || 0).toLocaleString()}
                                  </span>
                                </td>

                                <td className="px-6 py-5 text-white/80">
                                  {Number(run.margin_percent || 0).toFixed(1)}%
                                </td>

                                <td className="px-6 py-5 text-white/70">
                                  {(Number(run.processing_ms || 0) / 1000).toFixed(1)}s
                                </td>

                                <td className="px-6 py-5 text-white/50 text-sm whitespace-nowrap">
                                  {new Date(run.created_at).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-[#111111] border border-white/10 rounded-3xl p-6">
                    <h3 className="text-xl font-semibold mb-5">
                      Platform Health
                    </h3>

                    <div className="space-y-4">
                      <HealthRow
                        label="Success Rate"
                        value={`${
                          totalRuns > 0
                            ? Math.round((successfulRuns / totalRuns) * 100)
                            : 0
                        }%`}
                      />

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

                  <div className="bg-[#111111] border border-white/10 rounded-3xl p-6">
                    <h3 className="text-xl font-semibold mb-5">
                      What You Can Monitor
                    </h3>

                    <div className="space-y-4 text-white/70 text-sm leading-7">
                      <p>
                        • Which users are actively uploading reports
                      </p>

                      <p>
                        • Which analyses fail or take too long
                      </p>

                      <p>
                        • Average parsing speed across uploads
                      </p>

                      <p>
                        • What file types users upload most
                      </p>

                      <p>
                        • Revenue and profitability totals processed
                      </p>

                      <p>
                        • Which plans are most active
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-3xl p-5">
      <p className="text-sm text-white/50">{label}</p>

      <h3 className="text-3xl font-bold mt-3 tracking-tight">
        {value}
      </h3>
    </div>
  );
}

function HealthRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border border-white/5 rounded-2xl px-4 py-4 bg-white/[0.02]">
      <span className="text-white/50">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
