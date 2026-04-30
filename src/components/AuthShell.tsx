import Image from "next/image";
import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-eagles-green/5 to-white dark:from-eagles-midnight dark:via-eagles-green/10 dark:to-eagles-midnight">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/" className="self-center">
          <Image
            src="/logos/logo-foundation.png"
            alt="Eagles Autism Foundation"
            width={600}
            height={180}
            priority
            className="h-40 w-auto sm:h-48"
          />
        </Link>
        <div className="-mt-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:-mt-6 sm:p-8 dark:border-white/10 dark:bg-white/[0.03]">
          <h1 className="font-display text-3xl tracking-wide">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <div className="mt-6 text-center text-sm text-black/60 dark:text-white/60">
            {footer}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
            Sponsored by
          </p>
          <div className="flex items-center justify-center gap-8">
            <Image
              src="/logos/eagles.png"
              alt="Philadelphia Eagles"
              width={200}
              height={140}
              className="h-12 w-auto object-contain sm:h-14"
            />
            <Image
              src="/logos/mcc-logo.webp"
              alt="McCloskey's"
              width={160}
              height={160}
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
