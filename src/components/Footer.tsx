export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-eagles-midnight text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center">
        <div>
          <p className="font-display text-2xl tracking-wider text-white">
            EAGLES AUTISM FOUNDATION
          </p>
          <p className="mt-1 text-sm">
            Shifting from autism awareness to action.
          </p>
        </div>
        <div className="text-sm">
          <p>
            Questions?{" "}
            <a
              href="mailto:info@eaglesautismfoundation.org"
              className="underline hover:text-white"
            >
              info@eaglesautismfoundation.org
            </a>
          </p>
          <p className="mt-1 text-white/50">
            McCloskey's · 17 Cricket Ave, Ardmore · Saturday, May 2 · 7 PM
          </p>
        </div>
      </div>
    </footer>
  );
}
