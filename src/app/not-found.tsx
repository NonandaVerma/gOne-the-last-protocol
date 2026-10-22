import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-obsidian text-slate-100 p-6 text-center">
      <h1 className="font-display text-4xl sm:text-6xl font-black text-order-cyan mb-4 tracking-wider">
        404 — PROTOCOL VOID
      </h1>
      <p className="font-body text-slate-400 max-w-md mb-8 text-base">
        The requested coordinates do not exist within the current dimensional matrix.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-order-cyan/20 border border-order-cyan text-order-cyan font-bold tracking-widest uppercase hover:bg-order-cyan hover:text-obsidian transition-colors rounded"
      >
        Return to Reality
      </Link>
    </div>
  );
}
