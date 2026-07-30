import { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { EditorialKicker } from '@/components/landing/Editorial';
import type { UseCaseVideo } from '@/lib/useCaseVideos';

interface UseCaseReelSectionProps {
  video: UseCaseVideo;
  /** Use-case card title for copy, e.g. "Weddings" */
  title: string;
}

/**
 * Skimmer path for use-case articles: poster-first cinematic reel.
 * Video src loads only after the visitor hits Watch — no bandwidth hit for readers.
 */
export function UseCaseReelSection({ video, title }: UseCaseReelSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const handlePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || failed) return;
    if (!hasStarted) {
      el.src = video.src;
      setHasStarted(true);
    }
    void el.play().then(
      () => setIsPlaying(true),
      () => {
        /* autoplay policies shouldn't apply to click — ignore */
      },
    );
  }, [failed, hasStarted, video.src]);

  const handlePauseToggle = useCallback(() => {
    const el = videoRef.current;
    if (!el || !hasStarted) return;
    if (el.paused) {
      void el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [hasStarted]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    el.addEventListener('ended', onEnded);
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, []);

  if (failed) return null;

  return (
    <section
      aria-label={`${title} video overview`}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-8"
    >
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-10">
        {/* Copy — skimmer invitation */}
        <div className="order-2 flex-1 space-y-3 text-center md:order-1 md:text-left">
          <EditorialKicker>Prefer watching?</EditorialKicker>
          <h2 className="text-2xl md:text-3xl text-white tracking-tight">
            Get the gist in {video.durationLabel}
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-white/65 max-w-md md:max-w-none mx-auto md:mx-0">
            A short cinematic look at how {title} runs on ChravelApp — then keep reading if you want
            the details.
          </p>
          {!hasStarted && (
            <button
              type="button"
              onClick={handlePlay}
              className="accent-fill-gold mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              Watch the reel
            </button>
          )}
        </div>

        {/* Vertical reel frame */}
        <div className="order-1 md:order-2 shrink-0">
          <div className="relative mx-auto w-[220px] sm:w-[260px] md:w-[280px]">
            <div
              className="pointer-events-none absolute -inset-5 sm:-inset-7"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(196,151,70,0.16) 0%, rgba(196,151,70,0) 70%)',
              }}
              aria-hidden="true"
            />
            <div className="relative rounded-[1.35rem] p-px bg-gradient-to-b from-[#c49746]/55 via-white/10 to-white/5 shadow-2xl shadow-black/50">
              <div className="relative overflow-hidden rounded-[calc(1.35rem-1px)] bg-black aspect-[9/16]">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  poster={video.poster}
                  playsInline
                  preload="none"
                  controls={hasStarted}
                  aria-label={video.ariaLabel}
                  onError={() => setFailed(true)}
                  onClick={hasStarted ? handlePauseToggle : undefined}
                />

                {!hasStarted && (
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label={`Play ${title} reel`}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/55 shadow-lg transition-transform hover:scale-105 motion-safe:active:scale-[0.98]">
                      <Play className="ml-0.5 h-7 w-7 fill-white text-white" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Watch · {video.durationLabel}</span>
                  </button>
                )}

                {!hasStarted && (
                  <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light">
                      Reel
                    </span>
                    <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/85">
                      {video.durationLabel}
                    </span>
                  </div>
                )}

                {hasStarted && !isPlaying && (
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label="Resume reel"
                    className="absolute inset-0 flex items-center justify-center bg-black/20"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/55">
                      <Play className="ml-0.5 h-6 w-6 fill-white text-white" aria-hidden="true" />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
