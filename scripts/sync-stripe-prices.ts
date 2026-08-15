// Creates/updates Stripe Products + Prices for every active service and stores
// the price IDs on the Service rows. Run with `pnpm db:sync-stripe-prices`.
import { syncAllServicePrices } from "../src/lib/stripe-sync";

async function main() {
  const result = await syncAllServicePrices();
  console.log(`Stripe sync complete: ${result.synced} price(s) created, ${result.skipped} already current.`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
