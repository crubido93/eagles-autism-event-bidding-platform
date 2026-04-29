import Link from "next/link";
import Logo from "./Logo";

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
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link href="/" className="self-start">
          <Logo />
        </Link>
        <div className="mt-12 rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
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
      </div>
    </main>
  );
}
