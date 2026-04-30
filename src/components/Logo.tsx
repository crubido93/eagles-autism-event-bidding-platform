import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logos/logo-foundation.png"
      alt="Eagles Autism Foundation"
      width={600}
      height={180}
      priority
      className={`-my-6 h-28 w-auto sm:h-32 ${className}`}
    />
  );
}
