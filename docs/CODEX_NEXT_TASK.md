# Next task for Codex

The CSV v1 importer and synthetic dry-run are implemented. The next task is to validate the PostgreSQL write path and prepare the first real, permissioned feed without expanding the catalogue.

1. Start a disposable local PostgreSQL from `docker-compose.yml`; do not use a production database.
2. Apply both saved migrations and run the demo seed twice. Confirm counts do not grow on the second seed.
3. Add one synthetic Product row with verified test MPN, GTIN and region matching `fixtures/product-catalog-v1.json` (or create a dedicated DB fixture command; do not present it as real).
4. Run `fixtures/merchant-feed-v1.csv` without `--dry-run` twice. Confirm one Merchant, one successful FeedImport, one MerchantOfferIdentity, one Offer and one `MERCHANT_FEED` history point; the second identical import must report `repeated=true` and create no duplicates.
5. Test transaction rollback by injecting a controlled failure inside the disposable database workflow, then remove the injection. Confirm there are no partial merchant offers or identities.
6. Run a full feed missing the offer and an incremental feed missing the offer; verify only full deactivates it.
7. Inspect the product page in PostgreSQL mode. Check that stale/unavailable offers cannot create the minimum price or redirect.
8. Record exact commands and observed counts in `docs/VALIDATION.md`.

After the synthetic database flow passes, request one anonymized sample feed and field documentation from a store. Run it in dry-run first. Never add the real domain to `config/merchants.json` or write its data without the owner's explicit permission.
