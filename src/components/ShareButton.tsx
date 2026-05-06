import { useState, useCallback } from "react";
import { shareOrCopy } from "../lib/share";

type Status = "idle" | "shared" | "copied" | "error";

interface Props {
  label: string;
  generatePayload: () => { title: string; text: string; url: string } | null;
  linkedInUrl?: string;
}

const BASE =
  (import.meta.env.SITE ?? "https://prismatic-labs.github.io") +
  (import.meta.env.BASE_URL ?? "/cloud-kettle-index").replace(/\/$/, "");

const LI_URL  = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(BASE)}`;
const OG_PATH = `${import.meta.env.BASE_URL ?? "/cloud-kettle-index"}/og.png`.replace(/\/\//g, "/");

export default function ShareButton({ label, generatePayload, linkedInUrl }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  const handleShare = useCallback(async () => {
    const payload = generatePayload();
    if (!payload) return;
    try {
      const method = await shareOrCopy(payload.title, payload.text, payload.url);
      setStatus(method === "native" ? "shared" : "copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [generatePayload]);

  const shareLabel =
    status === "shared" ? "Shared ✓" :
    status === "copied" ? "Copied ✓" :
    status === "error"  ? "Couldn't share" :
    label;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
      {/* Clipboard / Web Share API */}
      <button
        type="button"
        onClick={handleShare}
        aria-live="polite"
        className={[
          "underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 text-xs",
          status === "error" ? "text-red-400" :
          status === "idle"  ? "text-gray-400 hover:text-gray-600" :
          "text-green-600",
        ].join(" ")}
      >
        {shareLabel}
      </button>

      <span aria-hidden="true" className="text-gray-200">·</span>

      {/* LinkedIn share - opens LinkedIn compose with URL pre-loaded */}
      <a
        href={linkedInUrl ?? LI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-gray-600 underline underline-offset-2"
        aria-label="Share on LinkedIn (opens in new tab)"
      >
        Share on LinkedIn
      </a>

      <span aria-hidden="true" className="text-gray-200">·</span>

      {/* Instagram - no web share URL exists; download the OG image to post manually */}
      <a
        href={OG_PATH}
        download="cloud-kettle-index.png"
        className="text-gray-400 hover:text-gray-600 underline underline-offset-2"
        aria-label="Download image to share on Instagram"
        title="Download the card image - paste your caption from the clipboard"
      >
        Save image
      </a>


    </span>
  );
}
