import { useEffect, useRef, useState } from 'react';
import { useLiveChat } from '../hooks/useLiveChat';

interface LiveChatProps {
  roomKey: string;
  displayName: string;
}

/** Realtime chat panel for a live class. */
export default function LiveChat({ roomKey, displayName }: LiveChatProps) {
  const { messages, participants, send } = useLiveChat(roomKey, displayName);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    if (!text.trim()) return;
    send(text);
    setText('');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/50">
        <span>Live chat</span>
        <span>{participants} watching</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="pt-6 text-center text-sm text-white/30">
            Say hi to the class 👋
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-semibold text-brand-300">{m.user}</span>{' '}
              <span className="text-white/85">{m.text}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message…"
          className="flex-1 rounded-full border border-white/10 bg-ink-700 px-4 py-2.5 text-sm outline-none placeholder-white/40 focus:border-brand-400"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
