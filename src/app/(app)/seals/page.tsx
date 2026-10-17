import { fulfillCheckoutSession, grantDevSealPack, startSealCheckout } from "@/app/actions/seals";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageShell } from "@/components/ui/PageShell";
import { SealIcon } from "@/components/ui/Icons";
import {
  areSealPurchasesEnabled,
  canGrantSealsLocally,
  canStartSealCheckout,
} from "@/lib/stripe";
import { requireOnboardedUser } from "@/lib/session";
import { SEAL_PACKS, formatSealBalance } from "@/modules/seals";

export const dynamic = "force-dynamic";

export const metadata = { title: "Seal balance" };

export default async function SealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string;
    canceled?: string;
    granted?: string;
    error?: string;
    reason?: string;
  }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;

  let justCredited = false;
  if (params.session_id && areSealPurchasesEnabled()) {
    const result = await fulfillCheckoutSession(params.session_id, user.id);
    justCredited = Boolean(result.ok && result.credited);
  }

  const refreshed = await requireOnboardedUser();
  const localGrant = canGrantSealsLocally();
  const checkoutReady = canStartSealCheckout();
  const purchasesEnabled = areSealPurchasesEnabled();
  const showUnderConstruction = !checkoutReady && !localGrant;

  return (
    <PageShell
      width="narrow"
      eyebrow="Seals"
      title={showUnderConstruction ? "Seal balance." : "Buy seals."}
      description="One free seal on signup. Each extra letter to a new age spends one seal when you seal it — drafts are free."
    >
      <div className="flex flex-col gap-8">
        {params.reason === "new-age" ? (
          <Notice tone="warning" title="A seal is required">
            Addressing a new age needs at least one seal. Existing drafts stay
            editable.
            {showUnderConstruction
              ? " Buying more seals isn’t available yet — see below."
              : null}
          </Notice>
        ) : null}
        {params.canceled === "1" ? (
          <Notice tone="info" title="Checkout canceled">
            No seals were added.
          </Notice>
        ) : null}
        {params.granted === "1" || justCredited ? (
          <Notice tone="info" title="Seals added">
            Your balance is now {formatSealBalance(refreshed.sealBalance)}.
          </Notice>
        ) : null}
        {params.session_id && !justCredited && params.granted !== "1" ? (
          <Notice tone="info" title="Payment received">
            If the balance hasn’t moved yet, refresh in a moment — webhooks and
            the success page both credit the same pack once.
          </Notice>
        ) : null}
        {params.error === "under-construction" || showUnderConstruction ? (
          <Notice tone="warning" title="Payment system is under construction">
            Purchasing seals isn’t available yet. You still get one free seal
            when you join. We’re putting payment in place — check back soon.
          </Notice>
        ) : null}
        {params.error === "stripe" ? (
          <Notice tone="warning" title="Stripe isn’t configured">
            Set STRIPE_SECRET_KEY and SEAL_PURCHASES_ENABLED=true, or use the
            local grant below in development.
          </Notice>
        ) : null}
        {params.error === "pack" ? (
          <Notice tone="warning" title="Unknown pack">
            Choose one of the packs below.
          </Notice>
        ) : null}

        <Card padding="md" className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Balance</p>
            <p className="mt-1 font-serif text-3xl text-ink">
              {formatSealBalance(refreshed.sealBalance)}
            </p>
          </div>
          <SealIcon size={28} className="text-accent" />
        </Card>

        {showUnderConstruction ? (
          <Card padding="lg" className="text-center">
            <p className="eyebrow">Coming soon</p>
            <h2 className="mt-2 font-serif text-2xl text-ink">
              Payment system is under construction
            </h2>
            <p className="mx-auto mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">
              Seal packs will appear here when checkout is ready. Until then,
              use your free signup seal — and keep writing drafts; they don’t
              spend a seal until you seal the letter.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {SEAL_PACKS.map((pack) => (
              <li key={pack.id}>
                <Card
                  padding="md"
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-serif text-xl text-ink">{pack.label}</p>
                    <p className="text-sm text-muted">{pack.priceLabel} USD</p>
                  </div>
                  {checkoutReady ? (
                    <form action={startSealCheckout}>
                      <input type="hidden" name="packId" value={pack.id} />
                      <Button type="submit" variant="primary">
                        Buy {pack.label}
                      </Button>
                    </form>
                  ) : (
                    <form action={grantDevSealPack}>
                      <input type="hidden" name="packId" value={pack.id} />
                      <Button type="submit" variant="secondary">
                        Grant {pack.label} (local)
                      </Button>
                    </form>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}

        {localGrant ? (
          <p className="text-sm text-muted">
            Stripe keys are not set, so packs are granted locally for
            development. No card is charged.
          </p>
        ) : null}
        {purchasesEnabled && checkoutReady ? (
          <p className="text-sm text-muted">
            Checkout is live. Packs are billed through Stripe.
          </p>
        ) : null}
      </div>
    </PageShell>
  );
}
