import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    const stripeCustomerId = user.privateMetadata?.stripeCustomerId;

    if (typeof stripeCustomerId !== "string" || !stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);

    return NextResponse.json(
      { error: "Could not open billing portal" },
      { status: 500 }
    );
  }
}