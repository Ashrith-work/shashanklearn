import { useState } from 'react';
import { Link } from 'react-router-dom';
import VideoManager from '../components/VideoManager';
import QuizManager from '../components/QuizManager';
import LiveManager from '../components/LiveManager';
import StatsPanel from '../components/StatsPanel';

type Tab = 'videos' | 'quizzes' | 'live' | 'stats';

const TABS: { key: Tab; label: string }[] = [
  { key: 'videos', label: 'Videos' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'live', label: 'Live' },
  { key: 'stats', label: 'Stats' },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('videos');

  return (
    <div className="min-h-screen bg-ink-900 pb-12">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h1 className="text-lg font-bold">
          Admin <span className="text-brand-400">·</span> ShashankLearn
        </h1>
        <Link to="/feed" className="text-sm text-brand-400 hover:underline">
          ← Feed
        </Link>
      </header>

      <div className="mx-auto max-w-md px-4 py-4">
        <div className="mb-5 grid grid-cols-4 rounded-xl bg-ink-800 p-1 text-sm font-medium">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg py-2 transition ${
                tab === t.key ? 'bg-brand-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'videos' && <VideoManager />}
        {tab === 'quizzes' && <QuizManager />}
        {tab === 'live' && <LiveManager />}
        {tab === 'stats' && <StatsPanel />}
      </div>
    </div>
  );
}
