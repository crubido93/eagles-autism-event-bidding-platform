import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logos/logo-foundation.png"
      alt="Eagles Autism Foundation"
      width={600}
      height={180}
      priority
      className={`-my-2 h-14 w-auto sm:-my-4 sm:h-24 lg:-my-6 lg:h-32 ${className}`}
    />
  );
}
