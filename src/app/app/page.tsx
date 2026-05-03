"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const API_BASE = "https://dropclarity.com/api";

type FileRole = "" | "revenue" | "cost" | "combined";

type QueueItem = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "uploaded" | "error";
  pct: number;
  error?: string;
  uploaded?: {
    uuid: string;
    filename?: string;
    mime?: string;
    size?: number;
    cdnUrl?: string;
  };
  job_id: string;
  role: FileRole;
  suggestedRole?: "revenue" | "cost" | "combined" | "unknown";
};

type AssignmentError = {
  job_id?: boolean;
  role?: boolean;
};

type JobRow = {
  ident: string;
  short: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
};

type CostMix = {
  labor: number;
  materials: number;
  subs: number;
  other: number;
};

type CostMixBucket = {
  key: keyof CostMix;
  label: string;
  value: number;
  chartValue: number;
  color: string;
  colorClass: string;
  note: string;
  isCredit: boolean;
};

type CostMixDisplay = {
  buckets: CostMixBucket[];
  donutParts: { label: string; value: number; color: string }[];
  totalActivity: number;
  totalCredits: number;
  hasCredits: boolean;
};

type PlanKey = "free" | "core" | "scale";

type PlanAccess = {
  normalizedPlan: PlanKey;
  label: "Free" | "Core" | "Scale";
  isFree: boolean;
  isCore: boolean;
  isScale: boolean;
  hasPaidAccess: boolean;
  fileLimitPerAnalysis: number;
};

const FREE_FILES_PER_ANALYSIS = 3;

function normalizePlan(rawPlan: unknown, rawStatus?: unknown): PlanAccess {
  const status = String(rawStatus || "inactive")
    .trim()
    .toLowerCase();
  const hasActiveSubscription = ["active", "trialing"].includes(status);
  const raw = String(rawPlan || "free")
    .trim()
    .toLowerCase();

  const legacyCorePlan = ["p", "r", "o"].join("");
  let normalizedPlan: PlanKey = "free";

  if (hasActiveSubscription) {
    if (raw === "core" || raw === legacyCorePlan) normalizedPlan = "core";
    else if (raw === "scale") normalizedPlan = "scale";
  }

  const isCore = normalizedPlan === "core";
  const isScale = normalizedPlan === "scale";
  const isFree = normalizedPlan === "free";
  const hasPaidAccess = isCore || isScale;

  return {
    normalizedPlan,
    label: isScale ? "Scale" : isCore ? "Core" : "Free",
    isFree,
    isCore,
    isScale,
    hasPaidAccess,
    fileLimitPerAnalysis: hasPaidAccess
      ? Number.POSITIVE_INFINITY
      : FREE_FILES_PER_ANALYSIS,
  };
}

function planLimitText(access: PlanAccess) {
  if (access.hasPaidAccess) return `${access.label} plan: paid access active.`;
  return `Free plan: up to ${FREE_FILES_PER_ANALYSIS} files per analysis.`;
}

function TinySpinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" />
  );
}

function UploadGradientIcon() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-cyan-300 via-violet-400 to-blue-500 p-[1.5px] shadow-md shadow-violet-100">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 19V5"
            stroke="url(#uploadGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M6.5 10.5L12 5L17.5 10.5"
            stroke="url(#uploadGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="uploadGradient" x1="6" y1="5" x2="18" y2="19">
              <stop stopColor="#06B6D4" />
              <stop offset="0.5" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function money(n: number | string | undefined | null) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$—";
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function pct(n: number | string | undefined | null) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—%";
  return `${Math.round(v * 10) / 10}%`;
}

function fmtBytes(b: number) {
  if (!Number.isFinite(b)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function shortMoney(v: number) {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

function shortLabel(s: string) {
  return s.length <= 10 ? s : `${s.slice(0, 10)}…`;
}

function inferRoleFromName(
  name: string,
): "revenue" | "cost" | "combined" | "unknown" {
  const s = name.toLowerCase();
  if (
    s.includes("combined") ||
    s.includes("job summary") ||
    s.includes("job_summary") ||
    s.includes("job-cost") ||
    s.includes("job cost")
  )
    return "combined";
  if (s.includes("invoice") || s.includes("revenue") || s.includes("sales"))
    return "revenue";
  if (
    s.includes("bill") ||
    s.includes("vendor") ||
    s.includes("expense") ||
    s.includes("cost") ||
    s.includes("receipt")
  )
    return "cost";
  return "unknown";
}

function bestJobIdentifier(job: any) {
  const id = job?.job_id != null ? String(job.job_id).trim() : "";
  const nm = String(job?.job_name || "").trim();
  return id || nm || "Job";
}

function buildJobChartData(out: any) {
  const jobsRaw = Array.isArray(out?.jobs) ? out.jobs : [];

  const jobs: JobRow[] = jobsRaw.map((j: any) => {
    const revenue = Number(j?.revenue) || 0;
    const costs = Number(j?.costs) || 0;
    const profit = Number.isFinite(Number(j?.profit))
      ? Number(j.profit)
      : revenue - costs;
    const ident = bestJobIdentifier(j);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { ident, short: shortLabel(ident), revenue, costs, profit, margin };
  });

  const top = jobs
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
  const sorted = top.slice().sort((a, b) => b.profit - a.profit);

  return {
    all: jobs,
    profit: {
      labels: sorted.map((x) => x.short),
      values: sorted.map((x) => x.profit),
      rows: sorted,
    },
    revcost: {
      labels: sorted.map((x) => x.short),
      rev: sorted.map((x) => x.revenue),
      cost: sorted.map((x) => x.costs),
      rows: sorted,
    },
  };
}

function categorizeCostLine(description = "") {
  const d = description.toLowerCase();

  if (
    [
      "subcontractor",
      "subcontractors",
      "subcontract",
      "subbed",
      "subs",
      "sub contractor",
      "vendor labor",
      "outside labor",
      "contract labor",
      "third party",
    ].some((k) => d.includes(k))
  ) {
    return "subs";
  }

  if (
    [
      "labor",
      "labour",
      "hours",
      "technician",
      "crew",
      "man hours",
      "payroll",
      "wages",
      "installer",
    ].some((k) => d.includes(k))
  ) {
    return "labor";
  }

  if (
    [
      "material",
      "materials",
      "parts",
      "supplies",
      "supply",
      "equipment",
      "unit",
      "hardware",
      "pipe",
      "wire",
      "hvac",
      "furnace",
      "condenser",
      "coil",
      "compressor",
      "duct",
      "thermostat",
    ].some((k) => d.includes(k))
  ) {
    return "materials";
  }

  return "other";
}

function buildCostMix(out: any): CostMix {
  const mix =
    out?.cost_mix && typeof out.cost_mix === "object" ? out.cost_mix : null;

  if (mix) {
    return {
      labor: Number(mix.labor) || 0,
      materials: Number(mix.materials) || 0,
      subs: Number(mix.subs) || 0,
      other: Number(mix.other) || 0,
    };
  }

  let labor = 0;
  let materials = 0;
  let subs = 0;
  let other = 0;

  const jobs = Array.isArray(out?.jobs) ? out.jobs : [];

  for (const job of jobs) {
    const lines = Array.isArray(job?.line_items)
      ? job.line_items
      : Array.isArray(job?.cost_lines)
        ? job.cost_lines
        : [];

    if (lines.length) {
      for (const line of lines) {
        const amount = Number(
          line?.line_total || line?.amount || line?.total || line?.value || 0,
        );
        const cat = String(line?.category || "").toLowerCase();
        const desc = String(line?.description || line?.name || "");
        const finalCat = ["labor", "materials", "subs", "other"].includes(cat)
          ? cat
          : categorizeCostLine(cat + " " + desc);

        if (finalCat === "labor") labor += amount;
        else if (finalCat === "subs") subs += amount;
        else if (finalCat === "materials") materials += amount;
        else other += amount;
      }
    } else {
      const cb = job?.cost_breakdown || {};
      labor += Number(cb.labor) || 0;
      materials += Number(cb.materials) || 0;
      subs += Number(cb.subs) || 0;
      other += Number(cb.other) || 0;
    }
  }

  return { labor, materials, subs, other };
}

function buildCostMixDisplay(costMix: CostMix): CostMixDisplay {
  const bucketMeta: Array<
    Omit<CostMixBucket, "value" | "chartValue" | "note" | "isCredit">
  > = [
    {
      key: "labor",
      label: "Labor",
      color: "rgba(34,211,238,.95)",
      colorClass: "bg-cyan-400",
    },
    {
      key: "materials",
      label: "Materials",
      color: "rgba(124,58,237,.90)",
      colorClass: "bg-violet-500",
    },
    {
      key: "subs",
      label: "Subs",
      color: "rgba(251,146,60,.92)",
      colorClass: "bg-orange-400",
    },
    {
      key: "other",
      label: "Other",
      color: "rgba(52,211,153,.90)",
      colorClass: "bg-emerald-400",
    },
  ];

  const buckets = bucketMeta.map((meta) => {
    const value = Number(costMix?.[meta.key]) || 0;
    const isCredit = value < 0;

    return {
      ...meta,
      value,
      chartValue: Math.abs(value),
      isCredit,
      note: isCredit
        ? "Credit / adjustment"
        : value > 0
          ? "Cost"
          : "No activity",
    };
  });

  const totalActivity = buckets.reduce(
    (sum, bucket) => sum + bucket.chartValue,
    0,
  );
  const totalCredits = buckets.reduce(
    (sum, bucket) => sum + Math.min(0, bucket.value),
    0,
  );

  return {
    buckets,
    donutParts: buckets.map((bucket) => ({
      label: bucket.label,
      value: bucket.chartValue,
      color: bucket.color,
    })),
    totalActivity,
    totalCredits,
    hasCredits: totalCredits < 0,
  };
}

function drawProfitChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  values: number[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = 240;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const gx0 = 28;
  const gx1 = w - 12;
  const gy0 = 18;
  const gy1 = h - 28;
  const zeroY = gy0 + (gy1 - gy0) / 2;
  const maxAbs = Math.max(...values.map((v) => Math.abs(v || 0)), 1);
  const scale = (gy1 - gy0) / 2 / maxAbs;

  for (let i = 0; i < 5; i++) {
    const y = gy0 + (i * (gy1 - gy0)) / 4;
    ctx.strokeStyle = "rgba(15,23,42,.06)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(15,23,42,.10)";
  ctx.beginPath();
  ctx.moveTo(gx0, zeroY);
  ctx.lineTo(gx1, zeroY);
  ctx.stroke();

  const n = labels.length || 1;
  const slot = (gx1 - gx0) / n;
  const bw = Math.max(10, Math.min(26, slot * 0.36));

  values.forEach((value, i) => {
    const x = gx0 + i * slot + slot / 2 - bw / 2;
    const y = zeroY - value * scale;
    const top = Math.min(y, zeroY);
    const height = Math.max(1, Math.abs(zeroY - y));
    const isNeg = value < 0;

    ctx.fillStyle = isNeg ? "rgba(239,68,68,.88)" : "rgba(34,197,94,.88)";
    ctx.fillRect(x, top, bw, height);

    ctx.font = "900 12px ui-sans-serif, system-ui";
    ctx.fillStyle = isNeg ? "rgba(185,28,28,.95)" : "rgba(22,101,52,.95)";
    ctx.textAlign = "center";
    ctx.fillText(
      shortMoney(value),
      x + bw / 2,
      value >= 0 ? top - 6 : top + height + 14,
    );
  });

  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(15,23,42,.48)";
  ctx.textAlign = "center";
  labels.forEach((label, i) => {
    const x = gx0 + i * slot + slot / 2;
    ctx.fillText(label, x, h - 7);
  });
}

function drawRevCostChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  rev: number[],
  cost: number[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = 240;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const gx0 = 28;
  const gx1 = w - 12;
  const gy0 = 18;
  const gy1 = h - 28;
  const maxV = Math.max(...rev, ...cost, 1);

  for (let i = 0; i < 5; i++) {
    const y = gy0 + (i * (gy1 - gy0)) / 4;
    ctx.strokeStyle = "rgba(15,23,42,.06)";
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx1, y);
    ctx.stroke();
  }

  const n = labels.length || 1;
  const slot = (gx1 - gx0) / n;
  const bw = Math.max(8, Math.min(20, slot * 0.26));
  const gap = bw * 0.34;

  function yFor(v: number) {
    return gy1 - (v / maxV) * (gy1 - gy0);
  }

  labels.forEach((label, i) => {
    const xBase = gx0 + i * slot + slot / 2;
    const xRev = xBase - bw - gap / 2;
    const xCost = xBase + gap / 2;

    const yR = yFor(rev[i] || 0);
    ctx.fillStyle = "rgba(34,211,238,.78)";
    ctx.fillRect(xRev, yR, bw, gy1 - yR);

    const yC = yFor(cost[i] || 0);
    ctx.fillStyle = "rgba(124,58,237,.68)";
    ctx.fillRect(xCost, yC, bw, gy1 - yC);

    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillStyle = "rgba(15,23,42,.48)";
    ctx.textAlign = "center";
    ctx.fillText(label, xBase, h - 7);
  });
}

function drawDonut(
  canvas: HTMLCanvasElement,
  parts: { label: string; value: number; color: string }[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = 220;
  const h = 220;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = 80;
  const thickness = 28;
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;

  let ang = -Math.PI / 2;

  parts.forEach((p) => {
    const safeValue = Math.max(0, p.value);
    if (safeValue <= 0.01) return;

    const a2 = ang + (safeValue / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, ang, a2);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.stroke();
    ang = a2;
  });

  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - thickness / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(15,23,42,.85)";
  ctx.font = "900 14px ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Cost Mix", cx, cy - 2);

  ctx.fillStyle = "rgba(15,23,42,.52)";
  ctx.font = "800 12px ui-sans-serif, system-ui";
  ctx.fillText("activity", cx, cy + 16);
}

export default function AppPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const USER_ID = user?.id || "anon";
  const { getToken } = useAuth();

  const access = useMemo(() => {
    const publicMeta = user?.publicMetadata || {};
    return normalizePlan(publicMeta.plan, publicMeta.subscriptionStatus);
  }, [user?.publicMetadata]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const profitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const revCostCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const donutCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [applyAll, setApplyAll] = useState("");
  const [assignmentErrors, setAssignmentErrors] = useState<
    Record<string, AssignmentError>
  >({});

  const uploadedItems = items.filter(
    (it) => it.status === "uploaded" && it.uploaded?.uuid,
  );
  const hasQueuedOrError = items.some(
    (it) => it.status === "queued" || it.status === "error",
  );
  const hasUploading = items.some((it) => it.status === "uploading");

  const chartData = useMemo(() => buildJobChartData(result || {}), [result]);
  const costMix = useMemo(() => buildCostMix(result || {}), [result]);
  const costMixDisplay = useMemo(() => buildCostMixDisplay(costMix), [costMix]);

  const kpis = result?.kpis || {};
  const revenue = Number(kpis.revenue) || 0;
  const costs = Number(kpis.costs) || 0;
  const netProfit = Number.isFinite(Number(kpis.net_profit))
    ? Number(kpis.net_profit)
    : revenue - costs;
  const margin = Number(kpis.profit_margin_pct) || 0;
  const losingJobs =
    Number(kpis.losing_jobs_count) ||
    chartData.all.filter((j) => j.profit < 0).length ||
    0;

  const smartSeverity =
    losingJobs > 0 || netProfit < 0 ? "bad" : margin < 20 ? "warn" : "good";
  const smartHeadline =
    smartSeverity === "bad"
      ? "Margin risk detected in this upload"
      : smartSeverity === "warn"
        ? "Profitability is positive but needs monitoring"
        : "Strong profitability across uploaded jobs";

  const smartCopy =
    smartSeverity === "bad"
      ? `${losingJobs} job${losingJobs === 1 ? "" : "s"} need review before quoting similar work.`
      : `Average margin is ${pct(margin)} with ${losingJobs} losing jobs detected.`;

  const totalMix = Math.max(1, costMixDisplay.totalActivity);
  const laborShare = (Math.abs(costMix.labor) / totalMix) * 100;
  const materialShare = (Math.abs(costMix.materials) / totalMix) * 100;
  const subsShare = (Math.abs(costMix.subs) / totalMix) * 100;

  const insights = [
    {
      title: "Margin Health",
      detail:
        losingJobs > 0
          ? `${losingJobs} uploaded job${losingJobs === 1 ? "" : "s"} are losing money or underperforming.`
          : `Uploaded jobs are profitable with a blended margin of ${pct(margin)}.`,
      tag: losingJobs > 0 ? "High impact" : "Healthy",
      color: losingJobs > 0 ? "bad" : "good",
    },
    {
      title: "Cost Structure",
      detail: `Labor is ${pct(laborShare)}, materials are ${pct(materialShare)}, and subs are ${pct(subsShare)} of costs.`,
      tag: laborShare > 35 ? "Needs attention" : "Healthy",
      color: laborShare > 35 ? "warn" : "good",
    },
    {
      title: "Recommended Focus",
      detail:
        losingJobs > 0
          ? "Start with the weakest job and compare quoted labor, actual labor, and material purchasing."
          : "Use this upload as a benchmark for healthy job structure and quoting discipline.",
      tag: "Next step",
      color: "good",
    },
  ];

  const actions = [
    losingJobs > 0
      ? "Review the losing job before quoting similar work again."
      : "Use this upload as a pricing benchmark for similar jobs.",
    laborShare > 35
      ? "Review labor allocation and field hours."
      : "Monitor labor and supplier trends weekly.",
    materialShare > 70
      ? "Engage suppliers for better material pricing."
      : "Keep tracking cost mix as more jobs are uploaded.",
    subsShare > 35
      ? "Review subcontractor scope, pricing, and markup assumptions."
      : "Track subcontractor exposure separately from materials.",
  ];

  function openFilePicker() {
    requestAnimationFrame(() => {
      fileRef.current?.click();
    });
  }

  function showToast(msg: string, tone: "success" | "error" = "success") {
    setToastTone(tone);
    setToast(msg);
    setTimeout(() => setToast(""), 5200);
  }

  function addFiles(files: FileList | null) {
    const selectedFiles = Array.from(files || []);

    if (isLoaded && !isSignedIn) {
      showToast("Please sign in before uploading files.", "error");
      return;
    }

    if (!selectedFiles.length) {
      showToast("No file was selected.", "error");
      return;
    }

    if (
      access.isFree &&
      items.length + selectedFiles.length > FREE_FILES_PER_ANALYSIS
    ) {
      showToast(
        `Free plan allows up to ${FREE_FILES_PER_ANALYSIS} files per analysis. Upgrade to Core or Scale to analyze more files.`,
        "error",
      );
      return;
    }

    setResult(null);

    setItems((prev) => {
      const existing = new Set(
        prev.map(
          (it) => `${it.file.name}-${it.file.size}-${it.file.lastModified}`,
        ),
      );
      const next = [...prev];

      selectedFiles.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existing.has(key)) return;

        const suggestedRole = inferRoleFromName(file.name);

        next.push({
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`,
          file,
          status: "queued",
          pct: 0,
          job_id: "",
          role: "",
          suggestedRole,
        });
      });

      return next;
    });

    showToast(
      `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} added.`,
    );
  }

  async function uploadOne(item: QueueItem) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, status: "uploading", pct: 20, error: "" }
          : it,
      ),
    );

    const form = new FormData();
    form.append("file", item.file, item.file.name);

    try {
      const token = await getToken();

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: {
          "X-User-Id": USER_ID,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) throw new Error(data?.error || text || "Upload failed");

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "uploaded", pct: 100, uploaded: data }
            : it,
        ),
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: "error",
                pct: 0,
                error: err.message || "Upload failed",
              }
            : it,
        ),
      );
    }
  }

  async function uploadFiles() {
    if (isLoaded && !isSignedIn) {
      showToast("Please sign in before uploading files.", "error");
      return;
    }

    if (access.isFree && items.length > FREE_FILES_PER_ANALYSIS) {
      showToast(
        `Free plan allows up to ${FREE_FILES_PER_ANALYSIS} files per analysis. Upgrade to Core or Scale to upload more.`,
        "error",
      );
      return;
    }

    const targets = items.filter(
      (it) => it.status === "queued" || it.status === "error",
    );
    for (const item of targets) {
      await uploadOne(item);
    }
  }

  function validateAssignments() {
    const nextErrors: Record<string, AssignmentError> = {};

    uploadedItems.forEach((it) => {
      const error: AssignmentError = {};
      if (!it.job_id.trim()) error.job_id = true;
      if (it.role !== "revenue" && it.role !== "cost" && it.role !== "combined")
        error.role = true;
      if (error.job_id || error.role) nextErrors[it.id] = error;
    });

    setAssignmentErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast("Review the highlighted fields before continuing.", "error");
      return false;
    }

    return true;
  }

  async function runAnalyze() {
    if (!uploadedItems.length) {
      showToast("Upload at least one file first.", "error");
      return;
    }

    if (isLoaded && !isSignedIn) {
      showToast("Please sign in before analyzing files.", "error");
      return;
    }

    if (access.isFree && uploadedItems.length > FREE_FILES_PER_ANALYSIS) {
      showToast(
        `Free plan allows up to ${FREE_FILES_PER_ANALYSIS} files per analysis. Upgrade to Core or Scale to analyze more files.`,
        "error",
      );
      return;
    }

    setAnalyzing(true);

    try {
      const payload = {
        user_id: USER_ID,
        period_label: "Latest Period",
        files: uploadedItems.map((it, idx) => {
          const filename = it.uploaded?.filename || it.file.name;
          const mime =
            it.uploaded?.mime || it.file.type || "application/octet-stream";
          const lower = filename.toLowerCase();

          const isStructured =
            lower.endsWith(".csv") ||
            lower.endsWith(".xlsx") ||
            lower.endsWith(".xls") ||
            mime.includes("csv") ||
            mime.includes("spreadsheet") ||
            mime.includes("excel");

          return {
            uuid: it.uploaded?.uuid,
            kind: idx === 0 ? "job_export" : "supporting",
            filename,
            mime,
            job_id: it.job_id.trim(),
            role: it.role === "combined" ? "combined_invoice" : it.role,
            parse_mode: isStructured ? "code" : "ai",
            file_category: isStructured ? "structured" : "document",
          };
        }),
      };

      const token = await getToken();

      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) throw new Error(data?.error || text || "Analyze failed");

      setResult(data);
      showToast("Analysis complete.");
    } catch (err: any) {
      showToast(err.message || "Analyze failed.", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  function analyzeFiles() {
    if (!uploadedItems.length) {
      showToast("Upload at least one file first.", "error");
      return;
    }

    if (isLoaded && !isSignedIn) {
      showToast("Please sign in before analyzing files.", "error");
      return;
    }

    if (access.isFree && uploadedItems.length > FREE_FILES_PER_ANALYSIS) {
      showToast(
        `Free plan allows up to ${FREE_FILES_PER_ANALYSIS} files per analysis. Upgrade to Core or Scale to analyze more files.`,
        "error",
      );
      return;
    }

    setJobModalOpen(true);
  }

  function continueFromAssignments() {
    if (!validateAssignments()) return;
    setJobModalOpen(false);
    runAnalyze();
  }

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );

    if ("job_id" in patch || "role" in patch) {
      setAssignmentErrors((prev) => {
        const next = { ...prev };
        const current = { ...(next[id] || {}) };

        if ("job_id" in patch && String(patch.job_id || "").trim())
          current.job_id = false;
        if (
          "role" in patch &&
          (patch.role === "revenue" ||
            patch.role === "cost" ||
            patch.role === "combined")
        )
          current.role = false;

        if (!current.job_id && !current.role) delete next[id];
        else next[id] = current;

        return next;
      });
    }
  }

  function applyJobToAll() {
    setItems((prev) =>
      prev.map((it) =>
        it.status === "uploaded" ? { ...it, job_id: applyAll } : it,
      ),
    );
    if (applyAll.trim()) {
      setAssignmentErrors((prev) => {
        const next = { ...prev };
        uploadedItems.forEach((it) => {
          if (next[it.id]) {
            next[it.id] = { ...next[it.id], job_id: false };
            if (!next[it.id].role) delete next[it.id];
          }
        });
        return next;
      });
    }
  }

  useEffect(() => {
    if (!result) return;

    requestAnimationFrame(() => {
      if (profitCanvasRef.current) {
        drawProfitChart(
          profitCanvasRef.current,
          chartData.profit.labels,
          chartData.profit.values,
        );
      }

      if (revCostCanvasRef.current) {
        drawRevCostChart(
          revCostCanvasRef.current,
          chartData.revcost.labels,
          chartData.revcost.rev,
          chartData.revcost.cost,
        );
      }

      if (donutCanvasRef.current) {
        drawDonut(donutCanvasRef.current, costMixDisplay.donutParts);
      }
    });
  }, [result, chartData, costMixDisplay]);

  const baseButton =
    "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm hover:border-slate-300 hover:shadow-md active:scale-[0.99]";
  const disabledButton =
    "disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none disabled:hover:border-slate-200 disabled:hover:shadow-none";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white">
      <style dangerouslySetInnerHTML={{ __html: analyzePageCss }} />
      <section className="analyzeShell relative z-0 overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_18%,#f8fbff_52%,#ffffff_100%)] px-4 py-8 sm:px-5 sm:py-10 lg:px-6 lg:py-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-35%] top-[40px] h-[260px] w-[340px] rounded-full bg-violet-100/35 blur-[82px] sm:left-[-12%] sm:h-[360px] sm:w-[520px] sm:bg-violet-200/35 sm:blur-[90px]" />
          <div className="absolute right-[-42%] top-[55px] h-[280px] w-[360px] rounded-full bg-cyan-100/35 blur-[86px] sm:right-[-10%] sm:top-[20px] sm:h-[360px] sm:w-[560px] sm:bg-cyan-200/40 sm:blur-[95px]" />
          <div className="absolute left-[20%] top-[320px] h-[220px] w-[320px] rounded-full bg-emerald-50/45 blur-[88px] sm:left-[35%] sm:top-[260px] sm:h-[320px] sm:w-[520px] sm:bg-emerald-100/45 sm:blur-[100px]" />
        </div>

        <div className="analyzeWrap relative z-10 mx-auto w-full px-0 sm:px-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div className="analyzeTopbar mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="pageKicker">Profitability Workspace</div>

              <h1 className="pageTitle">
                Turn job files into{" "}
                <span className="gradText">profit clarity</span>
              </h1>

              <p className="pageSub">
                Upload invoices, bills, and exports to instantly see revenue,
                costs, margin risk, losing jobs, and next-step actions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
                {analyzing
                  ? "Analyzing…"
                  : hasUploading
                    ? "Uploading"
                    : result
                      ? "Completed"
                      : "Ready"}
              </div>
            </div>
          </div>

          <div className="analyzeActions relative z-20 mb-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openFilePicker();
              }}
              className={baseButton}
            >
              Choose files
            </button>

            <button
              type="button"
              disabled={!items.length || !hasQueuedOrError || hasUploading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadFiles();
              }}
              className={`${baseButton} ${disabledButton}`}
            >
              Upload
            </button>

            <button
              type="button"
              disabled={!uploadedItems.length || hasUploading || analyzing}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                analyzeFiles();
              }}
              className={`rounded-2xl border px-5 py-3 text-sm font-black shadow-sm hover:shadow-md active:scale-[0.99] ${
                analyzing
                  ? "border-violet-200 bg-gradient-to-r from-violet-50 via-cyan-50 to-violet-50 text-slate-900"
                  : "border-cyan-200 bg-gradient-to-r from-cyan-50 to-violet-50 text-slate-900"
              } ${disabledButton} disabled:bg-none`}
            >
              <span className="flex w-full items-center justify-center gap-2 text-center">
                {analyzing && <TinySpinner />}
                {analyzing ? "Analyzing" : "Analyze"}
              </span>
            </button>
          </div>

          <div className="uploadPanel relative z-10 overflow-hidden rounded-[22px] border border-slate-100 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white/90 p-5">
              <div>
                <h2 className="font-black tracking-tight text-slate-950">
                  Upload Queue
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Add multiple files — each uploads separately.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setItems([]);
                  setResult(null);
                  setAssignmentErrors({});
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openFilePicker();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="m-5 cursor-pointer touch-manipulation rounded-3xl border border-dashed border-slate-300 bg-white/90 p-5"
            >
              <div className="flex items-center gap-4">
                <UploadGradientIcon />

                <div>
                  <div className="font-black text-slate-950">
                    Drop files here
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">
                    or click Choose files. Tip: put the job export first.
                  </div>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="grid gap-3 px-5 pb-5 xl:grid-cols-2 2xl:grid-cols-3">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-3xl border border-slate-100 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <div className="break-words text-sm font-black text-slate-950">
                          {it.file.name}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-400">
                          {fmtBytes(it.file.size)} •{" "}
                          {it.file.type || "unknown type"}
                        </div>
                        {it.error && (
                          <div className="mt-2 text-xs font-bold text-red-600">
                            {it.error}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-black ${
                            it.status === "uploaded"
                              ? "bg-emerald-50 text-emerald-700"
                              : it.status === "error"
                                ? "bg-red-50 text-red-700"
                                : it.status === "uploading"
                                  ? "bg-cyan-50 text-cyan-700"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {it.status}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setItems((prev) =>
                              prev.filter((x) => x.id !== it.id),
                            );
                            setAssignmentErrors((prev) => {
                              const next = { ...prev };
                              delete next[it.id];
                              return next;
                            });
                          }}
                          className="rounded-xl border border-slate-100 px-2 py-1 text-xs font-black text-slate-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {toast && (
              <div
                className={`mx-5 mb-5 rounded-2xl p-4 text-sm font-bold ${
                  toastTone === "error"
                    ? "border border-red-100 bg-red-50 text-red-700"
                    : "border border-emerald-100 bg-emerald-50 text-emerald-800"
                }`}
              >
                {toast}
              </div>
            )}
          </div>

          {result && (
            <div className="resultsPanel mt-5 overflow-hidden rounded-[22px] border border-slate-100 bg-white/80 text-[15px] leading-6 shadow-xl shadow-slate-200/70 backdrop-blur lg:text-base">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-white/90 p-5 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950 lg:text-2xl">
                    Results
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 lg:text-base">
                    KPIs + smart insights + job-level charts + actions.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href="/dashboard"
                    className="dashboardCtaBtn relative overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-4 py-2 text-xs font-black text-slate-900 shadow-md shadow-violet-100 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <span className="dashboardCtaGlow" />
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <span className="dashboardCtaDot" />
                      View Dashboard →
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        JSON.stringify(result, null, 2),
                      )
                    }
                    className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-black text-slate-700"
                  >
                    Copy report
                  </button>
                </div>
              </div>

              <div className="resultsBody p-5">
                <div className="resultKpiGrid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                  {[
                    ["Revenue", money(revenue), ""],
                    ["Costs", money(costs), ""],
                    [
                      "Net Profit",
                      money(netProfit),
                      netProfit < 0 ? "text-red-600" : "text-emerald-700",
                    ],
                    ["Margin", pct(margin), ""],
                    [
                      "Jobs",
                      String(kpis.jobs_count ?? chartData.all.length ?? "—"),
                      "",
                    ],
                    [
                      "Losing Jobs",
                      String(losingJobs ?? "—"),
                      losingJobs > 0 ? "text-red-600" : "",
                    ],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {label}
                      </div>
                      <div
                        className={`mt-2 text-xl font-black lg:text-2xl ${color || "text-slate-900"}`}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="smartSummaryPanel mt-4 rounded-3xl border border-slate-100 bg-white p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="text-sm font-black uppercase tracking-wider text-slate-400">
                        Smart Summary
                      </div>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">
                        {smartHeadline}
                      </h3>
                      <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 text-slate-500 lg:text-base">
                        {smartCopy}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
                        smartSeverity === "bad"
                          ? "bg-red-50 text-red-700"
                          : smartSeverity === "warn"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {smartSeverity === "bad"
                        ? "High impact"
                        : smartSeverity === "warn"
                          ? "Needs attention"
                          : "Healthy"}
                    </span>
                  </div>
                </div>

                <div className="analysisGrid mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-100 bg-white p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-black text-slate-950 lg:text-xl">
                        Profit by Job
                      </h3>
                      <p className="text-sm font-semibold leading-6 text-slate-500">
                        Green = profitable, red = negative.
                      </p>
                    </div>
                    <canvas ref={profitCanvasRef} className="w-full" />
                    <JobList rows={chartData.profit.rows} mode="profit" />
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-white p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-black text-slate-950 lg:text-xl">
                        Revenue vs Costs by Job
                      </h3>
                      <p className="text-sm font-semibold leading-6 text-slate-500">
                        Exact job identifier + totals shown below.
                      </p>
                    </div>
                    <canvas ref={revCostCanvasRef} className="w-full" />
                    <JobList rows={chartData.revcost.rows} mode="revcost" />
                  </div>
                </div>

                <div className="costMixPanel mt-4 rounded-3xl border border-slate-100 bg-white p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-lg font-black text-slate-950 lg:text-xl">
                        Cost Mix
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        All jobs combined — donut uses absolute cost activity so
                        negative credits do not distort the chart. The cards
                        still show the true signed bucket totals used for
                        profit.
                      </p>
                    </div>

                    {costMixDisplay.hasCredits && (
                      <div className="w-fit rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                        Credits applied: {money(costMixDisplay.totalCredits)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-6 md:grid-cols-[240px_1fr] md:items-center">
                    <canvas ref={donutCanvasRef} width={220} height={220} />
                    <div className="grid gap-3 xl:grid-cols-4">
                      {costMixDisplay.buckets.map((bucket) => (
                        <div
                          key={bucket.key}
                          className={`rounded-2xl border p-4 text-sm font-bold leading-6 lg:text-base ${
                            bucket.isCredit
                              ? "border-emerald-100 bg-emerald-50/60 text-emerald-800"
                              : "border-slate-100 bg-slate-50/70 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-3 w-3 rounded ${bucket.colorClass}`}
                            />
                            <span>
                              <b className="text-slate-900">{bucket.label}</b> —{" "}
                              {money(bucket.value)}
                            </span>
                          </div>

                          <div className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">
                            {bucket.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bottomAnalysisGrid mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-100 bg-white p-5">
                    <h3 className="text-lg font-black text-slate-950 lg:text-xl">
                      Smart Insights
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      What matters most from this upload right now.
                    </p>

                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                      {insights.map((insight) => (
                        <div
                          key={insight.title}
                          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-base font-black text-slate-950">
                              {insight.title}
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                insight.color === "bad"
                                  ? "bg-red-50 text-red-700"
                                  : insight.color === "warn"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {insight.tag}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-7 text-slate-500 lg:text-base">
                            {insight.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-white p-5">
                    <h3 className="text-lg font-black text-slate-950 lg:text-xl">
                      Recommended Actions
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      Next 7 days — operator-ready.
                    </p>

                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                      {actions.map((action) => (
                        <label
                          key={action}
                          className="flex cursor-pointer gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <input type="checkbox" className="mt-1" />
                          <span className="text-sm font-bold leading-7 text-slate-700 lg:text-base">
                            {action}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {result && (
        <a
          href="/dashboard"
          className="floatingDashboardCta"
          aria-label="View full DropClarity dashboard"
        >
          <span className="floatingDashboardPulse" />
          <span className="relative z-10 flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-blue-600 text-xs font-black text-white shadow-sm shadow-violet-100">
              ✓
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
                Analysis complete
              </span>
              <span className="block truncate text-sm font-black text-slate-900">
                View dashboard →
              </span>
            </span>
          </span>
        </a>
      )}

      {jobModalOpen && (
        <div className="assignModalOverlay fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-sm sm:p-4">
          <div className="assignModal mx-auto my-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-600 shadow-sm">
                    Required before analysis
                  </div>

                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Assign Job IDs & File Types
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                    Add a job identifier and choose whether each file is revenue
                    or cost.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 p-4 sm:p-5">
              <div className="mb-5 rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm">
                <div className="mb-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Quick apply
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-600">
                    Use this when every uploaded file belongs to the same job.
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={applyAll}
                    onChange={(e) => setApplyAll(e.target.value)}
                    placeholder="e.g. JOB-1042 or Smith Kitchen Reno"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 focus:placeholder:text-slate-200"
                  />

                  <button
                    type="button"
                    onClick={applyJobToAll}
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-900 shadow-sm hover:border-cyan-200"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {uploadedItems.map((it) => {
                  const errors = assignmentErrors[it.id] || {};
                  const roleMissing = !!errors.role;
                  const jobMissing = !!errors.job_id;

                  return (
                    <div
                      key={it.id}
                      className={`rounded-3xl border bg-white p-5 shadow-sm ${
                        roleMissing || jobMissing
                          ? "border-red-200 ring-4 ring-red-50"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="break-words text-base font-black text-slate-950">
                            {it.uploaded?.filename || it.file.name}
                          </div>

                          <div className="mt-1 text-xs font-bold text-slate-400">
                            {fmtBytes(it.file.size)} •{" "}
                            {it.file.type || "unknown type"}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                            it.role === "revenue"
                              ? "bg-emerald-50 text-emerald-700"
                              : it.role === "cost"
                                ? "bg-violet-50 text-violet-700"
                                : it.role === "combined"
                                  ? "bg-cyan-50 text-cyan-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {it.role === "combined"
                            ? "Combined Invoice"
                            : it.role
                              ? it.role
                              : "type needed"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-[1.35fr_.85fr]">
                        <div>
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                            Job ID / Job Name{" "}
                            <span className="text-red-500">*</span>
                          </label>

                          <input
                            value={it.job_id}
                            onChange={(e) =>
                              updateItem(it.id, { job_id: e.target.value })
                            }
                            placeholder="e.g. JOB-1042"
                            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 outline-none focus:ring-4 focus:placeholder:text-slate-200 ${
                              jobMissing
                                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                                : "border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
                            }`}
                          />

                          {jobMissing && (
                            <div className="mt-2 text-xs font-black text-red-600">
                              *Required
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                            File Type <span className="text-red-500">*</span>
                          </label>

                          <select
                            value={it.role}
                            onChange={(e) =>
                              updateItem(it.id, {
                                role: e.target.value as FileRole,
                              })
                            }
                            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-black outline-none focus:ring-4 ${
                              roleMissing
                                ? "border-red-500 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-100"
                                : "border-slate-200 text-slate-900 focus:border-cyan-300 focus:ring-cyan-100"
                            }`}
                          >
                            <option value="">Select type</option>
                            <option value="revenue">Revenue</option>
                            <option value="cost">Cost</option>
                            <option value="combined">Combined Invoice</option>
                          </select>

                          {roleMissing && (
                            <div className="mt-2 text-xs font-black text-red-600">
                              *Required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 flex flex-col justify-between gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="text-xs font-bold leading-5 text-slate-500">
                Revenue = money earned. Cost = bills, receipts, expenses.
                Combined Invoice = one file that includes both revenue and
                costs.
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={continueFromAssignments}
                  className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50 px-6 py-3 text-sm font-black text-slate-900 shadow-md shadow-cyan-100 hover:border-cyan-300"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function JobList({
  rows,
  mode,
}: {
  rows: JobRow[];
  mode: "profit" | "revcost";
}) {
  return (
    <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 2xl:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.ident}
          className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center"
        >
          <div className="min-w-0">
            <div className="truncate text-base font-black text-slate-950">
              {row.ident}
            </div>
            <div className="mt-1 text-sm font-bold leading-6 text-slate-500">
              Revenue {money(row.revenue)} • Costs {money(row.costs)}
            </div>
          </div>

          <div className="shrink-0 text-base font-black">
            {mode === "profit" ? (
              <span
                className={row.profit < 0 ? "text-red-600" : "text-emerald-700"}
              >
                {money(row.profit)}
              </span>
            ) : (
              <span className="text-slate-900">Net {money(row.profit)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const analyzePageCss = `
.analyzeShell{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0f172a!important}
.analyzeWrap{width:min(1760px,calc(100vw - 44px));max-width:1760px;margin:0 auto}
.analyzeTopbar{align-items:flex-start;margin-bottom:18px}
.pageKicker{width:fit-content;margin-bottom:10px;border:1px solid rgba(34,211,238,.28);background:rgba(255,255,255,.86);box-shadow:0 10px 28px rgba(34,211,238,.10);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:950;color:rgba(8,145,178,.95)}
.pageTitle{margin:0;max-width:980px;font-size:clamp(30px,3.25vw,42px);line-height:1.05;font-weight:990;letter-spacing:-.045em;color:rgba(2,6,23,.96)}
.gradText{background:linear-gradient(90deg,#06b6d4,#8b5cf6,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent}
.pageSub{margin-top:9px;max-width:860px;color:rgba(51,65,85,.78);font-size:clamp(14px,1.2vw,17px);line-height:1.5;font-weight:750}
.analyzeActions{margin-bottom:16px}
.analyzeActions button,.analyzeActions a{min-height:44px}
.dashboardCtaBtn{isolation:isolate;animation:dashboardCtaNudge 3.4s ease-in-out infinite}
.dashboardCtaGlow{position:absolute;inset:-24px;z-index:0;background:linear-gradient(90deg,rgba(34,211,238,.0),rgba(139,92,246,.16),rgba(34,211,238,.0));transform:translateX(-60%);animation:dashboardCtaSweep 2.9s ease-in-out infinite}
.dashboardCtaDot{height:7px;width:7px;border-radius:999px;background:#10b981;box-shadow:0 0 0 5px rgba(16,185,129,.09);animation:dashboardCtaDot 1.8s ease-in-out infinite}
.floatingDashboardCta{position:fixed;right:22px;bottom:22px;z-index:80;display:flex;max-width:calc(100vw - 32px);align-items:center;border:1px solid rgba(139,92,246,.18);border-radius:18px;background:rgba(255,255,255,.92);padding:9px 11px;box-shadow:0 16px 42px rgba(15,23,42,.13),0 0 0 1px rgba(255,255,255,.65) inset;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);text-decoration:none;animation:floatingDashboardEnter .34s ease-out both,floatingDashboardBreathe 3.4s ease-in-out .65s infinite}
.floatingDashboardPulse{position:absolute;inset:-2px;border-radius:20px;background:linear-gradient(135deg,rgba(34,211,238,.16),rgba(139,92,246,.15),rgba(37,99,235,.12));filter:blur(8px);opacity:.44;animation:floatingDashboardGlow 2.8s ease-in-out infinite}
@keyframes dashboardCtaSweep{0%{transform:translateX(-70%)}55%,100%{transform:translateX(70%)}}
@keyframes dashboardCtaNudge{0%,78%,100%{transform:translateY(0)}86%{transform:translateY(-1px)}94%{transform:translateY(0)}}
@keyframes dashboardCtaDot{0%,100%{transform:scale(1);box-shadow:0 0 0 4px rgba(16,185,129,.08)}50%{transform:scale(1.14);box-shadow:0 0 0 7px rgba(16,185,129,.12)}}
@keyframes floatingDashboardEnter{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes floatingDashboardBreathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes floatingDashboardGlow{0%,100%{opacity:.28}50%{opacity:.58}}
.uploadPanel,.resultsPanel{border-color:rgba(15,23,42,.085)!important;box-shadow:0 20px 58px rgba(2,6,23,.09)!important;border-radius:22px!important}
.uploadPanel>div:first-child,.resultsPanel>div:first-child{padding:18px!important;border-bottom-color:rgba(15,23,42,.075)!important}
.uploadPanel h2,.resultsPanel h2{font-size:20px!important;line-height:1.15;letter-spacing:-.025em;color:rgba(15,23,42,.97)!important}
.uploadPanel p,.resultsPanel p{color:rgba(15,23,42,.62)!important;font-weight:760!important}
.uploadPanel [role="button"]{margin:18px!important;padding:18px!important;border-radius:22px!important;border-color:rgba(15,23,42,.16)!important;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}
.uploadPanel [role="button"]:hover{transform:translateY(-1px);box-shadow:0 18px 44px rgba(2,6,23,.08);border-color:rgba(34,211,238,.35)!important}
.resultsBody{padding:18px!important}
.resultKpiGrid{gap:12px!important;grid-template-columns:repeat(6,minmax(0,1fr))!important}
.resultKpiGrid>div{border-color:rgba(15,23,42,.08)!important;border-radius:18px!important;box-shadow:0 14px 34px rgba(2,6,23,.055)!important;padding:16px!important}
.resultKpiGrid>div div:first-child{font-size:12px!important;color:rgba(15,23,42,.56)!important}
.resultKpiGrid>div div:nth-child(2){font-size:24px!important;line-height:1.05!important;letter-spacing:-.02em!important}
.smartSummaryPanel,.costMixPanel,.analysisGrid>div,.bottomAnalysisGrid>div{border-color:rgba(15,23,42,.08)!important;box-shadow:0 12px 34px rgba(2,6,23,.055)!important;border-radius:22px!important;padding:18px!important}
.smartSummaryPanel h3{font-size:clamp(22px,2.2vw,30px)!important;line-height:1.08!important;letter-spacing:-.035em!important}
.analysisGrid,.bottomAnalysisGrid{gap:16px!important}
.analysisGrid h3,.bottomAnalysisGrid h3,.costMixPanel h3{font-size:20px!important;line-height:1.15!important;letter-spacing:-.02em!important}
.analysisGrid p,.bottomAnalysisGrid p,.costMixPanel p{font-size:14px!important;line-height:1.5!important;color:rgba(15,23,42,.62)!important;font-weight:760!important}
.costMixPanel canvas{width:min(220px,100%)!important;margin:0 auto}
.assignModal{max-width:min(1120px,calc(100vw - 32px))!important;border-radius:28px!important}
.assignModal h2{font-size:clamp(22px,2.4vw,28px)!important;line-height:1.08!important;letter-spacing:-.035em!important}
.assignModalOverlay{-webkit-overflow-scrolling:touch}
@media(max-width:1280px){.analyzeWrap{width:min(100%,calc(100vw - 32px))}.resultKpiGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
@media(max-width:900px){.resultKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.uploadPanel>div:first-child,.resultsPanel>div:first-child{align-items:flex-start!important;flex-direction:column!important}}
@media(max-width:760px){
  .floatingDashboardCta{left:16px;right:16px;bottom:14px;width:auto;padding:9px 11px;border-radius:18px}
  .analyzeShell{padding:28px 0 82px!important}
  .analyzeWrap{width:100%!important;max-width:100%!important;padding:0 18px!important}
  .pageTitle{font-size:29px!important;line-height:1.08!important}
  .pageSub{font-size:14px!important;line-height:1.48!important}
  .analyzeTopbar{padding:0!important}
  .analyzeActions{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;width:100%!important}
  .analyzeActions button{display:flex!important;width:100%!important;align-items:center!important;justify-content:center!important;text-align:center!important}
  .uploadPanel,.resultsPanel{width:100%!important;overflow:hidden!important;border-radius:22px!important}
  .uploadPanel>div:first-child,.resultsPanel>div:first-child{padding:18px!important}
  .uploadPanel [role="button"]{margin:14px!important;padding:16px!important}
  .uploadPanel [role="button"]>div{align-items:flex-start!important}
  .uploadPanel .grid{min-width:0!important}
  .uploadPanel span.rounded-full{max-width:100%;white-space:nowrap}
  .resultKpiGrid{grid-template-columns:1fr!important}
  .smartSummaryPanel,.costMixPanel,.analysisGrid>div,.bottomAnalysisGrid>div{padding:16px!important}
  .costMixPanel>div:first-child{align-items:flex-start!important;flex-direction:column!important}
  .assignModalOverlay{padding:0!important}
  .assignModal{margin:0!important;max-width:100%!important;width:100%!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;border-left:0!important;border-right:0!important}
  .assignModal h2{font-size:23px!important}
  .assignModal select,.assignModal input{font-size:16px!important}
}
@media(max-width:420px){.analyzeWrap{padding:0 14px!important}.pageTitle{font-size:27px!important}}
`;
