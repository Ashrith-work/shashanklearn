import { useEffect, useState } from 'react';
import { useQuiz } from '../hooks/useQuiz';

interface QuizModalProps {
  videoId: string;
  onClose: () => void;
}

/**
 * Pops after a guided video ends. Shows the question + options, grades the
 * answer server-side, then reveals correct/incorrect feedback before letting
 * the user continue. If the video has no quiz, it closes itself silently.
 */
export default function QuizModal({ videoId, onClose }: QuizModalProps) {
  const { quiz, loading, submitting, result, submit } = useQuiz(videoId);
  const [selected, setSelected] = useState<number | null>(null);

  // No quiz attached -> nothing to ask.
  useEffect(() => {
    if (!loading && !quiz) onClose();
  }, [loading, quiz, onClose]);

  if (loading || !quiz) return null;

  const answered = result !== null;

  async function handleSubmit() {
    if (selected === null) return;
    await submit(selected);
  }

  function optionClasses(index: number): string {
    const base =
      'w-full rounded-xl border px-4 py-3 text-left text-sm transition';
    if (!answered) {
      return `${base} ${
        selected === index
          ? 'border-brand-400 bg-brand-500/15'
          : 'border-white/10 bg-ink-700 hover:border-white/25'
      }`;
    }
    // After answering: highlight the correct one, and the wrong pick if any.
    if (index === result!.correctIndex) {
      return `${base} border-emerald-400 bg-emerald-500/15`;
    }
    if (index === selected) {
      return `${base} border-red-400 bg-red-500/15`;
    }
    return `${base} border-white/10 bg-ink-700 opacity-60`;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-6" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-400">
          Quick check
        </p>
        <h3 className="mb-5 text-base font-semibold leading-snug">{quiz.question}</h3>

        <div className="space-y-2.5">
          {quiz.options.map((option, index) => (
            <button
              key={index}
              type="button"
              disabled={answered || submitting}
              onClick={() => setSelected(index)}
              className={optionClasses(index)}
            >
              {option}
            </button>
          ))}
        </div>

        {answered && (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
              result!.isCorrect
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-red-500/10 text-red-300'
            }`}
          >
            {result!.isCorrect ? 'Correct! 🎉' : 'Not quite — review the highlighted answer.'}
          </p>
        )}

        <div className="mt-5">
          {answered ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold hover:bg-brand-500"
            >
              Continue
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-white/70 hover:text-white"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selected === null || submitting}
                className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Checking…' : 'Submit'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
