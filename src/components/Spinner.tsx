interface SpinnerProps {
  /** Center in a full-screen container. */
  fullScreen?: boolean;
  label?: string;
}

export default function Spinner({ fullScreen = false, label }: SpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
      {label && <span className="text-sm text-white/60">{label}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900">
        {spinner}
      </div>
    );
  }
  return spinner;
}
