import type { ComponentType } from 'react';
import type { LiveClassPublic } from '@/types';
import { CloseIcon } from '@/components/icons';
import LiveChat from './LiveChat';

/**
 * Props every video-room provider receives. Swap providers by passing a
 * different `VideoProvider` component to <LiveRoom> — the rest of the UI
 * (header, chat) is provider-agnostic.
 */
export interface LiveProviderProps {
  roomId: string;
  displayName: string;
}
export type LiveProviderComponent = ComponentType<LiveProviderProps>;

interface LiveRoomProps {
  liveClass: LiveClassPublic;
  displayName: string;
  onLeave: () => void;
  /** Defaults to a placeholder stage. Drop in a 100ms / Daily provider here. */
  VideoProvider?: LiveProviderComponent;
}

export default function LiveRoom({
  liveClass,
  displayName,
  onLeave,
  VideoProvider = StubVideoStage,
}: LiveRoomProps) {
  // room_id is the provider's room handle (masked to null for non-premium).
  const roomId = liveClass.room_id ?? liveClass.id;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-900">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{liveClass.title}</p>
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Live now
          </p>
        </div>
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
        >
          <CloseIcon className="h-4 w-4" />
          Leave
        </button>
      </header>

      {/* Video stage (provider-pluggable) */}
      <div className="aspect-video w-full bg-black">
        <VideoProvider roomId={roomId} displayName={displayName} />
      </div>

      {/* Chat fills the rest */}
      <LiveChat roomKey={roomId} displayName={displayName} />
    </div>
  );
}

/**
 * Placeholder video stage. Replace with a real provider component that joins the
 * room — e.g. 100ms (`useHMSActions().join({ authToken, userName })`) or Daily
 * (`callObject.join({ url })`). The join token should be minted by a premium-
 * gated Edge Function, never embedded client-side.
 */
function StubVideoStage({ roomId }: LiveProviderProps) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-white/70">Live video stage</p>
        <p className="text-xs text-white/40">
          Connect a provider (100ms / Daily) behind <code>LiveRoom</code>.
        </p>
        <p className="text-[11px] text-white/25">room: {roomId}</p>
      </div>
    </div>
  );
}
