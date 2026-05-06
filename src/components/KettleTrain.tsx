import { useState, useRef, useCallback, useEffect } from "react";

const CAPTION_DURATION_MS = 2200;

export default function KettleTrain() {
  const [chugging, setChugging] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const handleActivate = useCallback(() => {
    if (chugging) return;

    setShowCaption(true);
    if (!prefersReduced.current) setChugging(true);

    if (captionTimer.current) clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => {
      setShowCaption(false);
      setChugging(false);
    }, CAPTION_DURATION_MS);
  }, [chugging]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  }, [handleActivate]);

  return (
    <div className="inline-flex flex-col items-center gap-1 select-none" aria-live="polite">
      <button
        type="button"
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        aria-label="Animate kettle-train explanation"
        className={[
          "relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1",
          "text-gray-400 hover:text-gray-600 transition-colors",
          chugging ? "animate-[chug_0.35s_ease-in-out_3]" : "",
        ].join(" ")}
        title="Click for a one-second explanation"
      >
        {/* Kettle silhouette SVG - also subtly reads as a steam train from the side */}
        <svg
          width="56"
          height="40"
          viewBox="0 0 56 40"
          fill="none"
          aria-hidden="true"
          className="block"
        >
          {/* Boiler body */}
          <rect x="6" y="16" width="32" height="16" rx="5" fill="currentColor" />
          {/* Spout */}
          <path d="M38 24 Q48 20 50 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Handle */}
          <path d="M6 20 Q0 20 0 26 Q0 32 6 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Lid */}
          <rect x="14" y="12" width="16" height="4" rx="2" fill="currentColor" />
          {/* Knob */}
          <circle cx="22" cy="11" r="2" fill="currentColor" />
          {/* Wheels (train detail) */}
          <circle cx="15" cy="33" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="29" cy="33" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {/* Steam puffs */}
          {showCaption && !prefersReduced.current && (
            <>
              <circle cx="24" cy="8" r="2" fill="currentColor" opacity="0.5" className="animate-[puff_0.6s_ease-out_0.1s_forwards]" />
              <circle cx="28" cy="5" r="1.5" fill="currentColor" opacity="0.4" className="animate-[puff_0.6s_ease-out_0.25s_forwards]" />
              <circle cx="22" cy="4" r="1" fill="currentColor" opacity="0.3" className="animate-[puff_0.6s_ease-out_0.4s_forwards]" />
            </>
          )}
        </svg>
      </button>

      {showCaption && (
        <p
          className="text-xs text-gray-500 text-center max-w-[180px] leading-tight"
          aria-live="assertive"
        >
          Choo choo - that&rsquo;s one second of modelled data-centre load.
        </p>
      )}

      <style>{`
        @keyframes chug {
          0%   { transform: translateX(0); }
          25%  { transform: translateX(4px); }
          75%  { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }
        @keyframes puff {
          0%   { transform: translateY(0); opacity: 0.5; }
          100% { transform: translateY(-8px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
