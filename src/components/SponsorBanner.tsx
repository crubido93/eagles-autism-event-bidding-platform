const sponsors = [
  { name: "Eagles Autism Foundation", placeholder: "EAF" },
  { name: "McCloskey's", placeholder: "MC" },
];

export default function SponsorBanner() {
  return (
    <section className="border-y border-black/5 bg-black/[0.02] py-10 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Hosted in partnership with
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-12">
          {sponsors.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 opacity-70 transition hover:opacity-100"
            >
              <div className="grid h-14 w-14 place-items-center rounded-lg border border-black/10 bg-white font-display text-xl tracking-widest dark:border-white/20 dark:bg-eagles-midnight">
                {s.placeholder}
              </div>
              <span className="font-display text-lg tracking-wider">
                {s.name}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-black/40 dark:text-white/40">
          Replace placeholders by dropping logos into <code>/public/logos/</code>.
        </p>
      </div>
    </section>
  );
}
