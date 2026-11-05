const testUrl = process.env.TEST_DATABASE_URL;
let parsed: URL | undefined;
try {
	if (testUrl) parsed = new URL(testUrl);
} catch {
	/* Report invalid and missing URLs with the same actionable setup error. */
}
if (
	!parsed ||
	!["postgres:", "postgresql:"].includes(parsed.protocol) ||
	!parsed.pathname.endsWith("_test")
) {
	throw new Error(
		"Integration tests require TEST_DATABASE_URL naming a disposable PostgreSQL database ending in _test; application DATABASE_URL is never used. Create and migrate a dedicated test database, then set TEST_DATABASE_URL.",
	);
}
process.env.DATABASE_URL = testUrl;
