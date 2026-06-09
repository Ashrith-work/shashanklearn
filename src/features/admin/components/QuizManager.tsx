import { useEffect, useState } from 'react';
import type { Quiz, Video } from '@/types';
import { createQuiz, deleteQuiz, listGuidedVideos, listQuizzes } from '../api';

const input =
  'w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-sm outline-none focus:border-brand-400';

const emptyOptions = ['', '', '', ''];

export default function QuizManager() {
  const [guided, setGuided] = useState<Video[]>([]);
  const [videoId, setVideoId] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(emptyOptions);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const list = await listGuidedVideos();
      setGuided(list);
      if (list.length && !videoId) setVideoId(list[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (videoId) listQuizzes(videoId).then(setQuizzes);
    else setQuizzes([]);
  }, [videoId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const filled = options.map((o) => o.trim());
    if (!question.trim()) return setError('Question is required.');
    if (filled.some((o) => !o)) return setError('Fill in all four options.');

    setBusy(true);
    const { error } = await createQuiz({
      video_id: videoId,
      question: question.trim(),
      options: filled,
      correct_index: correct,
    });
    setBusy(false);
    if (error) return setError(error);

    setQuestion('');
    setOptions(emptyOptions);
    setCorrect(0);
    listQuizzes(videoId).then(setQuizzes);
  }

  async function handleDelete(id: string) {
    const { error } = await deleteQuiz(id);
    if (error) setError(error);
    else listQuizzes(videoId).then(setQuizzes);
  }

  if (!guided.length) {
    return (
      <p className="rounded-xl border border-white/10 bg-ink-800 p-4 text-sm text-white/50">
        Create a <span className="text-amber-300">guided</span> video first — quizzes attach to guided videos.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <label className="block text-xs text-white/50">
        Guided video
        <select className={`${input} mt-1`} value={videoId} onChange={(e) => setVideoId(e.target.value)}>
          {guided.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
      </label>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-white/10 bg-ink-800 p-4">
        <h2 className="text-sm font-semibold">Add a quiz question</h2>
        <input
          className={input}
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correct === i}
              onChange={() => setCorrect(i)}
              title="Mark as correct"
            />
            <input
              className={input}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                setOptions(next);
              }}
            />
          </div>
        ))}
        <p className="text-[11px] text-white/40">Select the radio next to the correct option.</p>

        {error && <p className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold hover:bg-brand-500 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Add question'}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Questions · {quizzes.length}</h2>
        {quizzes.map((q) => (
          <div key={q.id} className="rounded-xl border border-white/10 bg-ink-800 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{q.question}</p>
              <button
                type="button"
                onClick={() => handleDelete(q.id)}
                className="shrink-0 text-xs text-red-300 hover:text-red-200"
              >
                Delete
              </button>
            </div>
            <ul className="mt-1 space-y-0.5 text-xs text-white/50">
              {(Array.isArray(q.options) ? q.options : []).map((o, i) => (
                <li key={i} className={i === q.correct_index ? 'text-emerald-300' : ''}>
                  {i === q.correct_index ? '✓ ' : '• '}
                  {String(o)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
