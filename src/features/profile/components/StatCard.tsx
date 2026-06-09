interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-4">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-white/60">{label}</p>
      {hint && <p className="text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}
