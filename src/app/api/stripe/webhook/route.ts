import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

type Plan = "free" | "core" | "scale";

const PRICE_TO_PLAN: Record<string, Plan> = {
  // Legacy starter price now maps to Core if anyone still checks out with it
  price_1TPuIPRZe2CjTTV9Zmom5RZe: "core",

  // Legacy pro price now maps to Core
  price_1TPuKCRZe2CjTTV9JERg2aZP: "core",

  // Scale stays Scale
  price_1TPuKkRZe2CjTTV9lVpmYk5A: "scale",
};

function normalizePlan(plan: unknown): Plan {
  const value = String(plan || "free").toLowerCase().trim();

  if (value === "scale") return "scale";

  // Legacy support
  if (value === "core" || value === "pro" || value === "starter") {
    return "core";
  }

  return "free";
}

async function saveSubscriptionToClerk(params: {
  userId: string;
  plan: Plan;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  priceId?: string | null;
}) {
  const clerk = await clerkClient();

  const hasPaidAccess = ["active", "trialing"].includes(
    String(params.status).toLowerCase()
  );

  const finalPlan: Plan = hasPaidAccess ? params.plan : "free";

  await clerk.users.updateUserMetadata(params.userId, {
    publicMetadata: {
      plan: finalPlan,
      subscriptionStatus: params.status,
    },
    privateMetadata: {
      stripeCustomerId: params.stripeCustomerId || null,
      stripeSubscriptionId: params.stripeSubscriptionId || null,
      stripePriceId: params.priceId || null,
      hasPaidAccess,
    },
  });
}

function getPlanFromSubscription(subscription: Stripe.Subscription): {
  plan: Plan;
  priceId: string | null;
} {
  const priceId = subscription.items.data[0]?.price?.id || null;

  const planFromPrice = priceId ? PRICE_TO_PLAN[priceId] : null;
  const planFromMetadata = subscription.metadata?.plan;

  return {
    plan: normalizePlan(planFromMetadata || planFromPrice || "free"),
    priceId,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId || session.client_reference_id;

      if (!userId) {
        console.error("❌ No userId found in checkout session");
        return NextResponse.json({ received: true });
      }

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      let plan = normalizePlan(session.metadata?.plan);
      let priceId = session.metadata?.priceId || null;
      let status = "active";

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const result = getPlanFromSubscription(subscription);

        plan = result.plan;
        priceId = result.priceId;
        status = subscription.status;
      }

      await saveSubscriptionToClerk({
        userId,
        plan,
        status,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : null,
        stripeSubscriptionId: subscriptionId,
        priceId,
      });

      console.log("✅ Checkout completed:", { userId, plan, status });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      const userId =
        subscription.metadata?.userId || subscription.metadata?.clerk_user_id;

      if (!userId) {
        console.warn("⚠️ No userId on subscription metadata");
        return NextResponse.json({ received: true });
      }

      const { plan, priceId } = getPlanFromSubscription(subscription);

      await saveSubscriptionToClerk({
        userId,
        plan,
        status: subscription.status,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : null,
        stripeSubscriptionId: subscription.id,
        priceId,
      });

      console.log("✅ Subscription updated:", {
        userId,
        plan,
        status: subscription.status,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}