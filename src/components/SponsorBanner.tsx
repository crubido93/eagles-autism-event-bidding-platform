import Image from "next/image";

const sponsors = [
  {
    name: "Philadelphia Eagles",
    src: "/logos/eagles.png",
    width: 200,
    height: 140,
  },
  {
    name: "McCloskey's",
    src: "/logos/mcc-logo.webp",
    width: 160,
    height: 160,
  },
];

export default function SponsorBanner() {
  return (
    <section className="border-y border-black/5 bg-black/[0.02] py-12 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Hosted in partnership with
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-12 sm:gap-20">
          {sponsors.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-4 transition hover:scale-105"
              title={s.name}
            >
              <Image
                src={s.src}
                alt={s.name}
                width={s.width}
                height={s.height}
                className="h-20 w-auto object-contain sm:h-24"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
