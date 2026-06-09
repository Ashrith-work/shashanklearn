import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Default-exported so it can be React.lazy()'d into its own chunk (recharts is
// heavy — we don't want it in the main bundle).

interface ProfileChartsProps {
  quizByCategory: { category: string; accuracy: number; total: number }[];
  viewsByCategory: { category: string; count: number }[];
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];

const tooltipStyle = {
  background: '#15151f',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
};

export default function ProfileCharts({
  quizByCategory,
  viewsByCategory,
}: ProfileChartsProps) {
  return (
    <div className="space-y-5">
      {quizByCategory.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-ink-800 p-4">
          <h3 className="mb-3 text-sm font-semibold">Quiz accuracy by category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={quizByCategory} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {quizByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewsByCategory.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-ink-800 p-4">
          <h3 className="mb-3 text-sm font-semibold">Videos viewed by category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={viewsByCategory}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={(d: { category: string }) => d.category}
                labelLine={false}
              >
                {viewsByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
