import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DEMO, demoQuiz } from '@/demo/demo';
import type { Json, QuizOptions } from '@/types';

export interface QuizResult {
  isCorrect: boolean;
  correctIndex: number;
}

interface LoadedQuiz {
  id: string;
  question: string;
  options: QuizOptions;
}

function toOptions(value: Json): QuizOptions {
  return Array.isArray(value) ? value.map((o) => String(o)) : [];
}

/**
 * Loads the quiz attached to a guided video (from the answer-free
 * `quiz_questions` view) and grades a submission via the `submit_quiz_answer`
 * RPC. `correct_index` is never fetched to the client — it only comes back in
 * the graded result, after the user has answered.
 */
export function useQuiz(videoId: string) {
  const [quiz, setQuiz] = useState<LoadedQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (DEMO) {
      setQuiz(
        demoQuiz.videoId === videoId
          ? { id: demoQuiz.id, question: demoQuiz.question, options: demoQuiz.options }
          : null
      );
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question, options')
        .eq('video_id', videoId)
        .limit(1);

      if (!active) return;
      if (error || !data || data.length === 0) {
        setQuiz(null);
      } else {
        const row = data[0];
        setQuiz({ id: row.id, question: row.question, options: toOptions(row.options) });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [videoId]);

  async function submit(selectedIndex: number): Promise<QuizResult | null> {
    if (!quiz || submitting) return null;
    if (DEMO) {
      const graded: QuizResult = {
        isCorrect: selectedIndex === demoQuiz.correctIndex,
        correctIndex: demoQuiz.correctIndex,
      };
      setResult(graded);
      return graded;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_quiz_id: quiz.id,
      p_selected_index: selectedIndex,
    });
    setSubmitting(false);

    if (error || !data || data.length === 0) {
      console.error('submit_quiz_answer failed:', error?.message);
      return null;
    }
    const graded: QuizResult = {
      isCorrect: data[0].is_correct,
      correctIndex: data[0].correct_index,
    };
    setResult(graded);
    return graded;
  }

  return { quiz, loading, submitting, result, submit };
}
