import { useEffect } from 'react';
// Type-only import is erased at compile time — it does NOT bundle hls.js.
import type HlsType from 'hls.js';

/**
 * Attaches an HLS source to a <video> element. Uses hls.js where MSE is
 * available, falls back to native HLS (Safari / iOS). Loading is gated by
 * `enabled` so off-screen cards don't fetch segments until they're near the
 * viewport (lazy-load + preload of neighbors).
 *
 * hls.js is imported dynamically so it's code-split out of the main bundle and
 * only fetched when a card actually needs MSE playback.
 */
export function useHlsPlayer(
  videoRef: React.RefObject<HTMLVideoElement>,
  src: string | null,
  enabled: boolean
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || !enabled) return;

    const isHls = src.includes('.m3u8');

    // Native HLS (Safari) or a plain progressive file — no hls.js needed.
    if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    // Needs hls.js: load the lightweight build on demand (no alt-audio /
    // subtitles / EME — fine for short vertical clips, ~170 kB smaller).
    let destroyed = false;
    let hls: HlsType | null = null;

    import('hls.js/light').then(({ default: Hls }) => {
      if (destroyed) return;
      if (Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 20, enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        // No MSE and not native HLS — last-ditch direct assignment.
        video.src = src;
      }
    });

    return () => {
      destroyed = true;
      if (hls) {
        hls.destroy();
      } else {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [videoRef, src, enabled]);
}
