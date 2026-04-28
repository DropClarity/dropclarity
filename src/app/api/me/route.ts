import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Plan = "free" | "core" | "scale";

function normalizePlan(plan: unknown): Plan {
  const value = String(plan || "free").toLowerCase().trim();

  // Legacy support
  if (value === "pro" || value === "starter" || value === "core") {
    return "core";
  }

  if (value === "scale") return "scale";

  return "free";
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    const publicPlan = normalizePlan(user.publicMetadata?.plan);
    const privatePlan = normalizePlan(user.privateMetadata?.plan);

    const subscriptionStatus = String(
      user.publicMetadata?.subscriptionStatus ||
        user.privateMetadata?.subscriptionStatus ||
        "inactive"
    )
      .toLowerCase()
      .trim();

    const metadataHasPaidAccess =
      user.privateMetadata?.hasPaidAccess === true ||
      user.publicMetadata?.hasPaidAccess === true;

    const hasPaidAccess =
      metadataHasPaidAccess || ["active", "trialing"].includes(subscriptionStatus);

    const normalizedPlan = publicPlan !== "free" ? publicPlan : privatePlan;

    const plan: Plan =
      hasPaidAccess && (normalizedPlan === "core" || normalizedPlan === "scale")
        ? normalizedPlan
        : "free";

    return NextResponse.json({
      plan,
      hasPaidAccess,
      subscriptionStatus,
      limits: {
        maxUploadsPerMonth: plan === "free" ? 3 : 999999,
        dashboardHistoryLimit: plan === "free" ? 3 : 999999,
        canAnalyze: true,
        canViewFullDashboard: plan !== "free",
        canExport: plan !== "free",
        canUseCustomCategories: plan !== "free",
        canSaveJobEdits: plan !== "free",
        canUseScaleFeatures: plan === "scale",
      },
    });
  } catch (error) {
    console.error("GET /api/me failed:", error);

    return NextResponse.json(
      { error: "Failed to load user plan" },
      { status: 500 }
    );
  }
}