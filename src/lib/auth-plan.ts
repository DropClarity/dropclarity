// src/lib/auth-plan.ts

import { auth, clerkClient } from "@clerk/nextjs/server";
import { normalizePlan, PLAN_LIMITS, type Plan } from "./plans";

export type AuthPlan = {
  userId: string;
  plan: Plan;
  subscriptionStatus: string;
  hasPaidAccess: boolean;
  limits: (typeof PLAN_LIMITS)[Plan];
  isCore: boolean;
  isScale: boolean;
};

export async function getAuthPlan(): Promise<AuthPlan> {
  const { userId } = await auth();

  if (!userId) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const rawPlan = user.publicMetadata?.plan;
  const subscriptionStatus = String(
    user.publicMetadata?.subscriptionStatus || "inactive"
  );

  const normalizedPlan = normalizePlan(rawPlan);

  const hasPaidAccess = ["active", "trialing"].includes(subscriptionStatus);

  const finalPlan: Plan =
    hasPaidAccess && (normalizedPlan === "core" || normalizedPlan === "scale")
      ? normalizedPlan
      : "free";

  const isCore = finalPlan === "core";
  const isScale = finalPlan === "scale";

  return {
    userId,
    plan: finalPlan,
    subscriptionStatus,
    hasPaidAccess,
    limits: PLAN_LIMITS[finalPlan],
    isCore,
    isScale,
  };
}

export function forbidden(message = "Upgrade required") {
  return Response.json(
    { error: message, upgradeRequired: true },
    { status: 403 }
  );
}