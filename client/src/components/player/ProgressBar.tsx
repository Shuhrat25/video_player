import { useEffect, useRef, useState } from "react";
import { formatTime } from "./formatTime";

interface ProgressBarProps {
  sourceUrl: string | undefined;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  onSeek: (fraction: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}

export default function ProgressBar({
  sourceUrl,
  currentTime,
  duration,
  bufferedPercent,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState(0);
  const [thumbReady, setThumbReady] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const seekDebounce = useRef<ReturnType<typeof setTimeout>>();

  const displayTime = scrubbing ? hoverTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  function timeFromClientX(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return { fraction, x: clientX - rect.left, time: fraction * duration };
  }

  function requestThumbnail(time: number) {
    setThumbReady(false);
    clearTimeout(seekDebounce.current);
    seekDebounce.current = setTimeout(() => {
      const pv = previewVideoRef.current;
      if (pv && pv.readyState > 0 && Number.isFinite(time)) {
        try {
          pv.currentTime = time;
        } catch {
          /* video ещё не готов к произвольной перемотке */
        }
      }
    }, 60);
  }

  function onPreviewSeeked() {
    const pv = previewVideoRef.current;
    const canvas = previewCanvasRef.current;
    if (!pv || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    try {
      ctx.drawImage(pv, 0, 0, canvas.width, canvas.height);
      setThumbReady(true);
    } catch {
      // кросс-доменный источник без CORS-заголовков — превью недоступно, просто покажем время
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    const { x, time } = timeFromClientX(e.clientX);
    setHoverX(x);
    setHoverTime(time);
    requestThumbnail(time);
  }

  function handleMouseLeave() {
    if (!scrubbing) setHoverX(null);
  }

  function handleMouseDown(e: React.MouseEvent) {
    setScrubbing(true);
    onScrubStart();
    const { x, time } = timeFromClientX(e.clientX);
    setHoverX(x);
    setHoverTime(time);
  }

  useEffect(() => {
    if (!scrubbing) return;

    function onMove(e: MouseEvent) {
      const { x, time } = timeFromClientX(e.clientX);
      setHoverX(x);
      setHoverTime(time);
      requestThumbnail(time);
    }
    function onUp(e: MouseEvent) {
      const { fraction } = timeFromClientX(e.clientX);
      onSeek(fraction);
      setScrubbing(false);
      onScrubEnd();
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubbing, duration]);

  function handleTouchStart(e: React.TouchEvent) {
    setScrubbing(true);
    onScrubStart();
    const touch = e.touches[0];
    const { x, time } = timeFromClientX(touch.clientX);
    setHoverX(x);
    setHoverTime(time);
  }

  useEffect(() => {
    if (!scrubbing) return;

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      const { x, time } = timeFromClientX(touch.clientX);
      setHoverX(x);
      setHoverTime(time);
    }
    function onTouchEnd(e: TouchEvent) {
      const touch = e.changedTouches[0];
      if (touch) {
        const { fraction } = timeFromClientX(touch.clientX);
        onSeek(fraction);
      }
      setHoverX(null);
      setScrubbing(false);
      onScrubEnd();
    }

    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubbing, duration]);

  function handleClick(e: React.MouseEvent) {
    if (scrubbing) return; // клик после drag уже обработан в onUp
    const { fraction } = timeFromClientX(e.clientX);
    onSeek(fraction);
  }

  return (
    <div
      className="progress_area"
      ref={trackRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {hoverX !== null && (
        <div className="progress-preview" style={{ left: hoverX }}>
          <div className="progress-preview__thumb">
            {sourceUrl && (
              <>
                <video
                  ref={previewVideoRef}
                  src={sourceUrl}
                  muted
                  preload="auto"
                  crossOrigin="anonymous"
                  style={{ display: "none" }}
                  onSeeked={onPreviewSeeked}
                />
                <canvas
                  ref={previewCanvasRef}
                  width={160}
                  height={90}
                  style={{ display: thumbReady ? "block" : "none" }}
                />
              </>
            )}
            {!thumbReady && <div className="progress-preview__fallback" />}
          </div>
          <div className="progress-preview__time">{formatTime(hoverTime)}</div>
        </div>
      )}

      <div className="progress_bar" style={{ width: `${progressPercent}%` }} />
      <div className="buffered-progress-bar" style={{ width: `${bufferedPercent}%` }} />
    </div>
  );
}
