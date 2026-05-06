import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { createElement as h } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { nationalModel, NESO_AVERAGE_KBS, NESO_AVERAGE_MW } from "../lib/dcModel";

// Read bundled font files from @fontsource/inter - no network dependency at build time
function loadBundledFont(weight: "400" | "700"): ArrayBuffer {
  const p = resolve(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`);
  const buf = readFileSync(p);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export const GET: APIRoute = async () => {
  const model  = nationalModel();
  // Hero: NESO annual-average central estimate
  const nesoKbs = (Math.round(NESO_AVERAGE_KBS / 10) * 10).toLocaleString("en-GB"); // "2,410"
  const nesoMw  = Math.round(NESO_AVERAGE_MW).toLocaleString("en-GB");               // "868"
  // Range: DSIT scenario bounds
  const kbsLow  = (Math.round(model.kettleBoilsPerSec.low  / 10) * 10).toLocaleString("en-GB");
  const kbsHigh = (Math.round(model.kettleBoilsPerSec.high / 10) * 10).toLocaleString("en-GB");

  const fonts: Parameters<typeof satori>[1]["fonts"] = [
    { name: "Inter", data: loadBundledFont("400"), weight: 400, style: "normal" },
    { name: "Inter", data: loadBundledFont("700"), weight: 700, style: "normal" },
  ];

  const family = fonts.length ? "Inter" : "sans-serif";

  // Layout: 1200×630, dark slate, amber accent
  const element = h(
    "div",
    {
      style: {
        width: 1200, height: 630,
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 72px",
        fontFamily: family,
      },
    },

    // ── Top bar ──────────────────────────────────────────────
    h("div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
      h("span", {
        style: { fontSize: 17, letterSpacing: 3, color: "#64748b", textTransform: "uppercase" as const },
      }, "The Cloud Kettle Index"),
      h("span", {
        style: {
          fontSize: 13, color: "#475569",
          background: "#1e293b", border: "1px solid #334155",
          padding: "4px 12px", borderRadius: 4,
        },
      }, "Modelled estimate · not a live meter"),
    ),

    // ── Main content ─────────────────────────────────────────
    h("div",
      { style: { display: "flex", flexDirection: "column", gap: 0 } },

      // Amber accent bar
      h("div", {
        style: { width: 72, height: 4, background: "#f59e0b", borderRadius: 2, marginBottom: 24 },
      }),

      // NESO central kettle-boils number (hero)
      h("div", {
        style: {
          fontSize: 108, fontWeight: 700, color: "#f59e0b",
          lineHeight: 1, letterSpacing: -2, fontFamily: family,
        },
      }, `~${nesoKbs}`),

      // Unit label
      h("div", {
        style: { fontSize: 30, color: "#94a3b8", fontWeight: 400, marginTop: 12 },
      }, "kettle-boils per second"),

      // NESO source + scenario range
      h("div", {
        style: { fontSize: 18, color: "#475569", marginTop: 16 },
      }, `NESO 2025 annual average · ~${nesoMw} MW · scenario range: ${kbsLow}–${kbsHigh} kbs`),
    ),

    // ── Footer ───────────────────────────────────────────────
    h("div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" } },
      h("span", {
        style: { fontSize: 15, color: "#334155" },
      }, "prismatic-labs.github.io/cloud-kettle-index"),
      h("span", {
        style: { fontSize: 15, color: "#334155" },
      }, "Prismatic Labs"),
    ),
  );

  const svg = await satori(element, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg).render().asPng();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
