import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS = {
  core: "price_1TPuKCRZe2CjTTV9JERg2aZP",
  scale: "price_1TPuKkRZe2CjTTV9lVpmYk5A",
} as const;

type Plan = keyof typeof PRICE_IDS;

function normalizeCheckoutPlan(plan: unknown): Plan | null {
  const value = String(plan || "").toLowerCase().trim();

  // Legacy support: old "pro" button/metadata now routes to Core.
  if (value === "core" || value === "pro") return "core";

  if (value === "scale") return "scale";

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = normalizeCheckoutPlan(body.plan);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan. Use core or scale." },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan];

    const appUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=canceled`,

      client_reference_id: userId,

      metadata: {
        userId,
        clerk_user_id: userId,
        plan,
        priceId,
        price_id: priceId,
      },

      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId,
          clerk_user_id: userId,
          plan,
          priceId,
          price_id: priceId,
        },
      },

      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout route failed:", err);

    return NextResponse.json(
      { error: "Checkout route failed" },
      { status: 500 }
    );
  }
}