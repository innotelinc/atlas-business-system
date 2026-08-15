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
