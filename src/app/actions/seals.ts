"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  appBaseUrl,
  areSealPurchasesEnabled,
  canGrantSealsLocally,
  canStartSealCheckout,
  getStripe,
} from "@/lib/stripe";
import { requireOnboardedUser } from "@/lib/session";
import { creditPaidPack, packFromMetadata } from "@/modules/seals/ledger";
import { getSealPack } from "@/modules/seals";

export async function startSealCheckout(formData: FormData) {
  const user = await requireOnboardedUser();
  if (!areSealPurchasesEnabled()) {
    redirect("/seals?error=under-construction");
  }
  const pack = getSealPack(String(formData.get("packId") ?? ""));
  if (!pack) {
    redirect("/seals?error=pack");
  }

  if (!canStartSealCheckout()) {
    redirect("/seals?error=stripe");
  }
  const stripe = getStripe();
  if (!stripe) {
    redirect("/seals?error=stripe");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      packId: pack.id,
      seals: String(pack.seals),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.amountCents,
          product_data: {
            name: `${pack.label} — Age Census`,
            description: "Credits to seal letters to future ages.",
          },
        },
      },
    ],
    success_url: `${appBaseUrl()}/seals?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl()}/seals?canceled=1`,
  });

  if (!session.url) {
    redirect("/seals?error=stripe");
  }
  redirect(session.url);
}

export async function grantDevSealPack(formData: FormData) {
  const user = await requireOnboardedUser();
  if (!canGrantSealsLocally()) {
    redirect("/seals?error=stripe");
  }
  const pack = getSealPack(String(formData.get("packId") ?? ""));
  if (!pack) {
    redirect("/seals?error=pack");
  }

  await prisma.$transaction(async (tx) => {
    await creditPaidPack(tx, {
      userId: user.id,
      pack,
      stripeSessionId: `dev_${pack.id}_${crypto.randomUUID()}`,
    });
  });

  redirect("/seals?granted=1");
}

export async function fulfillCheckoutSession(sessionId: string, userId: string) {
  const stripe = getStripe();
  if (!stripe || !sessionId) return { ok: false as const };

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return { ok: false as const };
  }

  const metadataUserId = session.metadata?.userId ?? session.client_reference_id;
  if (!metadataUserId || metadataUserId !== userId) {
    return { ok: false as const };
  }

  const pack = packFromMetadata(session.metadata?.packId, session.metadata?.seals);
  if (!pack) {
    return { ok: false as const };
  }

  const result = await prisma.$transaction(async (tx) =>
    creditPaidPack(tx, {
      userId,
      pack,
      stripeSessionId: session.id,
    }),
  );
  return { ok: true as const, ...result };
}
