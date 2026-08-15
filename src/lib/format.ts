const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function usd(cents: number): string {
  return usdFormatter.format(cents / 100);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return dateFormatter.format(new Date(d));
}

export function formatDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}

export function formatType(type: string): string {
  switch (type) {
    case "LLC":
      return "LLC (Limited Liability Company)";
    case "FOR_PROFIT":
      return "For-Profit Corporation";
    case "NON_PROFIT":
      return "Non-Profit Corporation";
    default:
      return type;
  }
}
