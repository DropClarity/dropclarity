import { createHash } from "node:crypto";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS = {
  core: "price_1TXUvKDCdAr97ZqWHh6K29gj",
  scale: "price_1TXUvHDCdAr97ZqW4E9252Tj",
} as const;

type Plan = keyof typeof PRICE_IDS;

class CheckoutError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function checkoutKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

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
    const couponId = (
      plan === "core"
        ? process.env.STRIPE_BLACK_FRIDAY_CORE_COUPON_ID
        : process.env.STRIPE_BLACK_FRIDAY_SCALE_COUPON_ID
    )?.trim();

    if (!couponId) {
      throw new CheckoutError("Black Friday pricing is not configured. Please contact support.", 503);
    }

    let coupon: Stripe.Coupon;
    try {
      coupon = await stripe.coupons.retrieve(couponId, { expand: ["applies_to"] });
    } catch (err) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) {
        throw new CheckoutError("The Black Friday coupon is unavailable. Please contact support.", 503);
      }
      throw err;
    }

    const now = Math.floor(Date.now() / 1000);
    if (coupon.redeem_by && coupon.redeem_by <= now) {
      throw new CheckoutError("The Black Friday promotion has ended. No checkout was created.", 410);
    }
    if (
      !coupon.valid ||
      coupon.duration !== "forever" ||
      coupon.currency !== "usd" ||
      coupon.amount_off !== (plan === "core" ? 10000 : 20000) ||
      !coupon.redeem_by
    ) {
      throw new CheckoutError("The Black Friday coupon is invalid or incorrectly configured. Please contact support.", 503);
    }

    const price = await stripe.prices.retrieve(priceId);
    const productId = typeof price.product === "string" ? price.product : price.product.id;
    if (
      !price.active ||
      price.currency !== "usd" ||
      price.unit_amount !== (plan === "core" ? 49900 : 99900) ||
      price.recurring?.interval !== "month" ||
      price.recurring.interval_count !== 1 ||
      !coupon.applies_to?.products.includes(productId)
    ) {
      throw new CheckoutError("Black Friday pricing does not match the selected plan. Please contact support.", 503);
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const storedCustomerId = user.privateMetadata.stripeCustomerId;
    let customerId: string;
    if (typeof storedCustomerId !== "string" || !storedCustomerId) {
      const customer = await stripe.customers.create(
        { metadata: { userId, clerk_user_id: userId } },
        { idempotencyKey: checkoutKey(`checkout-customer:${userId}`) }
      );
      customerId = customer.id;
      // Persist the same customer identity the webhook and billing portal use.
      await clerk.users.updateUserMetadata(userId, {
        privateMetadata: { stripeCustomerId: customerId },
      });
    } else {
      customerId = storedCustomerId;
    }

    for await (const subscription of stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    })) {
      if (!["canceled", "incomplete_expired"].includes(subscription.status)) {
        throw new CheckoutError(
          "You already have a subscription or payment in progress. Please manage it through the billing portal.",
          409
        );
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const previousSessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 1 });
    for await (const openSession of stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 100,
    })) {
      if (openSession.mode !== "subscription") continue;
      const appliedCoupon = openSession.discounts?.[0]?.coupon;
      const appliedCouponId = typeof appliedCoupon === "string" ? appliedCoupon : appliedCoupon?.id;
      if (
        openSession.client_reference_id === userId &&
        openSession.metadata?.plan === plan &&
        appliedCouponId === couponId &&
        openSession.discounts?.length === 1 &&
        !openSession.allow_promotion_codes &&
        openSession.expires_at <= coupon.redeem_by &&
        openSession.success_url === `${appUrl}/dashboard?checkout=success` &&
        openSession.url
      ) {
        return NextResponse.json({ url: openSession.url });
      }
      throw new CheckoutError(
        "Another subscription checkout is already open. Complete or let it expire before starting a different checkout.",
        409
      );
    }

    // Stripe requires at least 30 minutes of Session lifetime. Do not issue
    // a new promotional Session that can remain open beyond the coupon cutoff.
    if (coupon.redeem_by - now < 31 * 60) {
      throw new CheckoutError("The Black Friday checkout window has closed. No checkout was created.", 410);
    }
    // The same key covers concurrent Core/Scale requests too: a conflicting
    // request must retry and encounter the open-Session guard rather than bill twice.
    const idempotencyKey = checkoutKey(
      `black-friday-checkout:${userId}:${customerId}:${previousSessions.data[0]?.id || "first"}`
    );
    // An hourly fixed expiry keeps retry parameters stable and stays within Stripe's
    // 30-minute–24-hour window; coupon expiry is always the upper bound.
    const expiresAt = Math.min(
      now - (now % 3600) + 23 * 3600,
      coupon.redeem_by
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      expires_at: expiresAt,
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
  metadata: {
    userId,
    clerk_user_id: userId,
    plan,
    priceId,
    price_id: priceId,
  },
},

      discounts: [{ coupon: couponId }],
    }, { idempotencyKey });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (
      err instanceof Stripe.errors.StripeIdempotencyError ||
      (err instanceof Stripe.errors.StripeError && err.code === "idempotency_key_in_use")
    ) {
      return NextResponse.json(
        { error: "A checkout request is already in progress. Please retry to resume it." },
        { status: 409 }
      );
    }
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.param?.includes("discount")) {
      return NextResponse.json(
        { error: "The Black Friday discount could not be applied. No full-price checkout was created." },
        { status: 503 }
      );
    }
    console.error("Checkout route failed:", err);

    return NextResponse.json(
      { error: "Checkout route failed" },
      { status: 500 }
    );
  }
}
