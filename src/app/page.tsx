import Link from "next/link";
import Nav from "@/components/Nav";
import SponsorBanner from "@/components/SponsorBanner";
import Footer from "@/components/Footer";

const DONATE_URL =
  "https://fundraisers.eaglesautismfoundation.org/jimmer-mccafferty-6";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Nav />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,76,84,0.18),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-eagles-green/30 bg-eagles-green/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-eagles-green">
              <span className="h-1.5 w-1.5 rounded-full bg-eagles-green" />
              Saturday · May 2 · 7 PM
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-wide sm:text-6xl lg:text-7xl">
              A night for the
              <br />
              <span className="text-eagles-green">Eagles Autism</span>
              <br />
              Foundation.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-black/70 dark:text-white/70">
              Join us at McCloskey's in Ardmore for an evening with familiar
              friends and faces — Super Bowl raffles, exclusive auctions, and
              special guests stopping by. 100% of proceeds go to autism
              research and care.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-eagles-green px-6 py-3 font-medium text-white shadow-sm transition hover:bg-eagles-green/90"
              >
                Sign up & start bidding
              </Link>
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-black/15 bg-white px-6 py-3 font-medium text-black transition hover:border-eagles-green hover:text-eagles-green dark:border-white/15 dark:bg-transparent dark:text-white"
              >
                Donate directly →
              </a>
            </div>
            <p className="mt-4 text-sm text-black/50 dark:text-white/50">
              Can't make it in person? Tax-deductible donations and company
              matches are welcome.
            </p>
          </div>

          <aside className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="font-display text-xl tracking-wider">
              EVENT DETAILS
            </h2>
            <dl className="mt-6 space-y-5 text-sm">
              <Detail label="When" value="Saturday, May 2 — 7:00 PM" />
              <Detail
                label="Where"
                value={
                  <>
                    McCloskey's
                    <br />
                    17 Cricket Ave, Ardmore
                  </>
                }
              />
              <Detail
                label="Entry"
                value="$25 — patio access + discounted drinks"
              />
              <Detail
                label="Proceeds"
                value="100% to the Eagles Autism Foundation"
              />
            </dl>
            <p className="mt-6 border-t border-black/10 pt-6 text-xs text-black/50 dark:border-white/10 dark:text-white/50">
              Bring a friend. Pay forward any ticket-related favors.
            </p>
          </aside>
        </div>
      </section>

      <SponsorBanner />

      <section
        id="cause"
        className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2"
      >
        <div>
          <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
            About the cause
          </h2>
          <p className="mt-4 text-black/70 dark:text-white/70">
            The Eagles Autism Foundation is dedicated to raising funds for
            innovative autism research and care. By partnering with thought
            leaders in neurodiversity, EAF powers scientific breakthroughs
            with transformational impact on the autism community — in
            Philadelphia and around the world.
          </p>
          <p className="mt-4 text-black/70 dark:text-white/70">
            Through research, advocacy, empathy, and unity, the foundation is
            helping to shift from autism awareness to action.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
            About the night
          </h2>
          <p className="mt-4 text-black/70 dark:text-white/70">
            Expect Super Bowl raffles, an assortment of auction items and
            experiences, and special guests. The fee for entry is $25 which
            includes patio access and discounted drinks. Even if you can't be
            there in person, you can still bid online once items go live.
          </p>
          <p className="mt-4 text-black/70 dark:text-white/70">
            No donation is too small for such an important cause.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl border border-eagles-green/20 bg-gradient-to-br from-eagles-green to-eagles-midnight p-10 text-white sm:p-14">
          <h3 className="font-display text-3xl tracking-wide sm:text-4xl">
            Ready to bid?
          </h3>
          <p className="mt-3 max-w-2xl text-white/80">
            12+ exclusive items go live the night of the event. Create an
            account now so you're ready when bidding opens — and so we can
            notify you the second you're outbid.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-white px-6 py-3 font-medium text-eagles-green transition hover:bg-white/90"
            >
              Create account
            </Link>
            <Link
              href="/auction"
              className="rounded-md border border-white/30 px-6 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Preview the auction
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
        {label}
      </dt>
      <dd className="mt-1 text-base">{value}</dd>
    </div>
  );
}
