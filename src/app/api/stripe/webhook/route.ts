import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { creditPaidPack, packFromMetadata } from "@/modules/seals/ledger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json({ received: true });
  }

  const userId = session.metadata?.userId ?? session.client_reference_id;
  const pack = packFromMetadata(session.metadata?.packId, session.metadata?.seals);
  if (!userId || !pack) {
    return NextResponse.json({ error: "Missing pack metadata" }, { status: 400 });
  }

  await prisma.$transaction((tx) =>
    creditPaidPack(tx, {
      userId,
      pack,
      stripeSessionId: session.id,
    }),
  );

  return NextResponse.json({ received: true });
}
