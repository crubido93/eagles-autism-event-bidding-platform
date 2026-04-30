export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-eagles-midnight text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 sm:py-12">
        <div>
          <p className="font-display text-xl tracking-wider text-white sm:text-2xl">
            EAGLES AUTISM FOUNDATION
          </p>
          <p className="mt-1 text-sm">
            Shifting from autism awareness to action.
          </p>
        </div>
        <div className="text-sm">
          <p className="break-words">
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
