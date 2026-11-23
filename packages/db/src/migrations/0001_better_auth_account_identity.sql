-- Better Auth 1.7.3+ uses provider_id/account_id instead of issuer/account_id.
-- https://github.com/better-auth/better-auth/blob/main/docs/content/docs/guides/1-7-upgrade-guide.mdx
-- Preserve legacy issuer values and fail before changing constraints if identities
-- need explicit reconciliation. Never merge different users automatically.
DO $$
DECLARE duplicate_groups bigint;
BEGIN
	SELECT count(*) INTO duplicate_groups FROM (
		SELECT provider_id, account_id FROM account
		GROUP BY provider_id, account_id HAVING count(*) > 1
	) duplicates;
	IF duplicate_groups > 0 THEN
		RAISE EXCEPTION 'Account identity migration: duplicate provider/account groups requested=%, allowed=0. Resolve duplicate identities without merging different users, then retry.', duplicate_groups;
	END IF;
END $$;--> statement-breakpoint
DROP INDEX "account_issuer_accountId_uidx";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_providerId_accountId_uidx" ON "account" USING btree ("provider_id","account_id");