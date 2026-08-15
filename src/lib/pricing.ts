import { prisma } from "./prisma";

export type ServiceLine = {
  id: string;
  key: string;
  name: string;
  priceCents: number;
  recurring: boolean;
  interval: string | null;
  quantity: number;
  stripePriceId?: string | null;
};

export async function getPricingConfig() {
  return prisma.pricingConfig.findUnique({ where: { id: "single" } });
}

/** Atlas service fee for a given entity type (LLC / for-profit / non-profit). */
export function getServiceFeeCents(
  pricing: { serviceFeeCents: number; serviceFeeCentsLLC?: number; serviceFeeCentsForProfit?: number; serviceFeeCentsNonProfit?: number } | null,
  type: string,
): number {
  if (!pricing) return 0;
  if (type === "FOR_PROFIT") return pricing.serviceFeeCentsForProfit ?? pricing.serviceFeeCents;
  if (type === "NON_PROFIT") return pricing.serviceFeeCentsNonProfit ?? pricing.serviceFeeCents;
  return pricing.serviceFeeCentsLLC ?? pricing.serviceFeeCents;
}

export function computeTotals(
  stateFeeCents: number,
  serviceFeeCents: number,
  services: ServiceLine[],
) {
  const oneTimeServices = services
    .filter((s) => !s.recurring)
    .reduce((sum, s) => sum + s.priceCents * s.quantity, 0);
  const recurringServices = services
    .filter((s) => s.recurring)
    .reduce((sum, s) => sum + s.priceCents * s.quantity, 0);
  const totalCents = stateFeeCents + serviceFeeCents + oneTimeServices + recurringServices;
  return { stateFeeCents, serviceFeeCents, oneTimeServices, recurringServices, totalCents };
}
