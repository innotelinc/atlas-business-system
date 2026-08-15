import { stripe } from "./stripe";
import { prisma } from "./prisma";

/**
 * Ensure every active service has a Stripe Product + Price, storing the price
 * ID on the Service row so checkout can reference `price` instead of inline
 * `price_data`. Existing prices that still match are left untouched; stale ones
 * are deactivated and replaced.
 */
export async function syncAllServicePrices(): Promise<{ synced: number; skipped: number }> {
  if (!stripe) throw new Error("Stripe is not configured — add STRIPE_SECRET_KEY first.");

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  let synced = 0;
  let skipped = 0;

  for (const s of services) {
    const interval = s.recurring ? ((s.interval as "year" | "month") ?? "year") : undefined;

    // Reuse an existing price if it's still current.
    if (s.stripePriceId) {
      try {
        const existing = await stripe.prices.retrieve(s.stripePriceId);
        if (
          existing.unit_amount === s.priceCents &&
          (existing.recurring?.interval ?? undefined) === interval &&
          existing.active
        ) {
          skipped++;
          continue;
        }
        await stripe.prices.update(s.stripePriceId, { active: false });
      } catch {
        // Stale or deleted price — fall through and create a fresh one.
      }
    }

    // Find or create the product.
    let productId: string | null = null;
    if (s.stripePriceId) {
      try {
        const old = await stripe.prices.retrieve(s.stripePriceId);
        productId = typeof old.product === "string" ? old.product : old.product.id;
      } catch {
        productId = null;
      }
    }
    if (!productId) {
      const products = await stripe.products.list({
        limit: 1,
        active: true,
      });
      const match = products.data.find((p) => p.metadata?.serviceKey === s.key);
      productId = match?.id ?? null;
    }
    if (!productId) {
      const product = await stripe.products.create({
        name: s.name,
        description: s.description ?? undefined,
        metadata: { serviceKey: s.key },
      });
      productId = product.id;
    }

    const price = await stripe.prices.create({
      product: productId,
      currency: "usd",
      unit_amount: s.priceCents,
      recurring: interval ? { interval } : undefined,
      metadata: { serviceKey: s.key },
    });

    await prisma.service.update({ where: { id: s.id }, data: { stripePriceId: price.id } });
    synced++;
  }

  return { synced, skipped };
}
