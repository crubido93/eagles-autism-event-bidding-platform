import Link from "next/link";

export const metadata = {
  title: "Unsubscribe — Eagles Autism Foundation Auction",
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return <Inner searchParams={searchParams} />;
}

async function Inner({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="font-display text-2xl tracking-wide">You're unsubscribed</h1>
        <p className="mt-3 text-sm text-black/70 dark:text-white/70">
          {email ? (
            <>
              <strong>{email}</strong> will no longer receive promotional
              emails from the Eagles Autism Foundation auction.
            </>
          ) : (
            <>
              You will no longer receive promotional emails from the Eagles
              Autism Foundation auction.
            </>
          )}
        </p>
        <p className="mt-3 text-xs text-black/50 dark:text-white/50">
          Account-related emails (signup verification, password reset) will
          still be sent if you sign up again.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-eagles-green px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
