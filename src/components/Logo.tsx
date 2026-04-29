export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 font-display tracking-wider ${className}`}
    >
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-full bg-eagles-green text-white text-lg"
      >
        E
      </span>
      <span className="text-xl">EAGLES AUTISM FOUNDATION</span>
    </div>
  );
}
