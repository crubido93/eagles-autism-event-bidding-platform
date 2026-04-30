import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logos/logo-foundation.png"
      alt="Eagles Autism Foundation"
      width={600}
      height={180}
      priority
      className={`-my-4 h-24 w-auto sm:h-28 ${className}`}
    />
  );
}
