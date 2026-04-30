import Link from "next/link";
import Logo from "./Logo";

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-eagles-midnight/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm hover:bg-black/5 sm:px-4 sm:py-2 dark:hover:bg-white/10"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-eagles-green px-3 py-1.5 text-sm text-white hover:bg-eagles-green/90 sm:px-4 sm:py-2"
          >
            <span className="sm:hidden">Sign up</span>
            <span className="hidden sm:inline">Sign up to bid</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
