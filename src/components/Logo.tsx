import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logos/logo.png"
      alt="Eagles Autism Foundation"
      width={600}
      height={180}
      priority
      className={`h-10 w-auto sm:h-12 ${className}`}
    />
  );
}
