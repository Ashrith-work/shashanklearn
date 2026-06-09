interface LogoProps {
  /** Show the tagline under the wordmark. */
  withTagline?: boolean;
  className?: string;
}

/** ShashankLearn brand mark — a stylized "play" inside a rounded square. */
export default function Logo({ withTagline = false, className = '' }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-600/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="text-2xl font-extrabold tracking-tight">
          Shashank<span className="text-brand-400">Learn</span>
        </span>
      </div>
      {withTagline && (
        <p className="text-sm text-white/60">Learn in seconds. Swipe to grow.</p>
      )}
    </div>
  );
}
