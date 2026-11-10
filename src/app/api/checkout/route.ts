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

async function assertNoSubscription(customerId: string) {
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

    await assertNoSubscription(customerId);

    const appUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const previousSessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 1 });
    const openSessions: Stripe.Checkout.Session[] = [];
    for await (const openSession of stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 100,
    })) {
      if (openSession.mode !== "subscription") continue;
      openSessions.push(openSession);
    }
    if (openSessions.length > 1) {
      throw new CheckoutError("Multiple checkouts are open. Please contact support before trying again.", 409);
    }
    if (openSessions.length === 1) {
      const openSession = await stripe.checkout.sessions.retrieve(openSessions[0].id);
      const sessionCustomer = typeof openSession.customer === "string"
        ? openSession.customer : openSession.customer?.id;
      const previousPlan = normalizeCheckoutPlan(openSession.metadata?.plan);
      if (
        sessionCustomer !== customerId ||
        openSession.client_reference_id !== userId ||
        !previousPlan ||
        openSession.metadata?.priceId !== PRICE_IDS[previousPlan] ||
        openSession.mode !== "subscription"
      ) {
        throw new CheckoutError("An unrelated checkout is open. Please contact support before trying again.", 409);
      }
      if (openSession.status === "complete" || openSession.subscription) {
        throw new CheckoutError("Your previous checkout has completed. Please refresh the Dashboard or manage your subscription in billing.", 409);
      }
      if (openSession.status !== "open" && openSession.status !== "expired") {
        throw new CheckoutError("Could not confirm the previous checkout state. Please retry.", 409);
      }
      const appliedCoupon = openSession.discounts?.[0]?.coupon;
      const appliedCouponId = typeof appliedCoupon === "string" ? appliedCoupon : appliedCoupon?.id;
      if (
        openSession.status === "open" &&
        openSession.client_reference_id === userId &&
        openSession.metadata?.plan === plan &&
        appliedCouponId === couponId &&
        openSession.discounts?.length === 1 &&
        !openSession.allow_promotion_codes &&
        openSession.expires_at <= coupon.redeem_by &&
        openSession.success_url === `${appUrl}/dashboard?checkout=success` &&
        openSession.url
      ) {
        await assertNoSubscription(customerId);
        return NextResponse.json({ url: openSession.url });
      }
      if (openSession.status === "open") {
        if (previousPlan === plan) {
          throw new CheckoutError("The existing checkout no longer matches this promotion. Please contact support or let it expire.", 409);
        }
        // Validate the replacement window before invalidating a usable checkout.
        if (coupon.redeem_by - Math.floor(Date.now() / 1000) < 31 * 60) {
          throw new CheckoutError("The Black Friday checkout window has closed. Your existing checkout was not changed.", 410);
        }
        let expiredSession: Stripe.Checkout.Session;
        try {
          expiredSession = await stripe.checkout.sessions.expire(openSession.id, {}, {
            idempotencyKey: checkoutKey(`switch-expire:${customerId}:${openSession.id}`),
          });
        } catch {
          // A timeout may have expired the Session, or a payment may have won
          // the race. Never create a replacement in the same failed request.
          const currentSession = await stripe.checkout.sessions.retrieve(openSession.id);
          if (currentSession.status === "complete" || currentSession.subscription) {
            throw new CheckoutError("Your previous checkout completed while switching plans. Please refresh the Dashboard or manage your subscription in billing.", 409);
          }
          throw new CheckoutError("Could not safely finish closing the previous checkout. Please retry before starting another checkout.", 409);
        }
        if (expiredSession.status !== "expired" || expiredSession.subscription) {
          throw new CheckoutError("Stripe did not confirm the previous checkout was expired. Please retry.", 409);
        }
      }
    }

    await assertNoSubscription(customerId);
    for await (const conflictingSession of stripe.checkout.sessions.list({
      customer: customerId, status: "open", limit: 100,
    })) {
      if (conflictingSession.mode === "subscription") {
        throw new CheckoutError("Another checkout operation is in progress. Please retry to resume it.", 409);
      }
    }
    const latestSessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 1 });
    if (latestSessions.data[0]?.id !== previousSessions.data[0]?.id) {
      throw new CheckoutError("Checkout changed during this request. Please retry to resume the latest checkout.", 409);
    }
    const latestSession = latestSessions.data[0];
    if (latestSession?.mode === "subscription" && latestSession.status === "complete") {
      const subscriptionId = typeof latestSession.subscription === "string"
        ? latestSession.subscription : latestSession.subscription?.id;
      if (!subscriptionId) {
        throw new CheckoutError("Your previous checkout is still being processed. Please retry after refreshing the Dashboard.", 409);
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (!["canceled", "incomplete_expired"].includes(subscription.status)) {
        throw new CheckoutError("Your previous checkout has completed. Please manage your subscription through billing.", 409);
      }
    }

    // Stripe requires at least 30 minutes of Session lifetime. Do not issue
    // a new promotional Session that can remain open beyond the coupon cutoff.
    const checkoutNow = Math.floor(Date.now() / 1000);
    if (coupon.redeem_by - checkoutNow < 31 * 60) {
      throw new CheckoutError("The Black Friday checkout window has closed. No checkout was created.", 410);
    }
    // The same key covers concurrent Core/Scale requests too: a conflicting
    // request must retry and recheck Stripe state. This is not a cross-instance lock.
    const idempotencyKey = checkoutKey(
      `black-friday-checkout:${userId}:${customerId}:${previousSessions.data[0]?.id || "first"}`
    );
    // An hourly fixed expiry keeps retry parameters stable and stays within Stripe's
    // 30-minute–24-hour window; coupon expiry is always the upper bound.
    const expiresAt = Math.min(
      checkoutNow - (checkoutNow % 3600) + 23 * 3600,
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

    if (session.status !== "open" || !session.url) {
      return NextResponse.json(
        { error: "Checkout is no longer open. Please retry to check the current subscription state." },
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
      { error: "Could not safely confirm checkout with Stripe. Please retry; no fallback checkout will be created." },
      { status: 503 }
    );
  }
}
