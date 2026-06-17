"use client";

import { useRef, useState } from "react";
import type { PredictionResult } from "@/lib/types";
import { CLASS_META, CLASS_ORDER, formatPercent } from "@/lib/classes";
import { SpinnerIcon, UploadIcon } from "./Icons";

interface DownloadReportButtonProps {
  result: PredictionResult;
}

/**
 * Renders an off-screen, light-themed one-page report of the REAL prediction
 * and exports it as a PNG via html-to-image. No data is faked or sent anywhere
 * -- it is a snapshot of the actual model output already on screen.
 */
export function DownloadReportButton({ result }: DownloadReportButtonProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const topMeta = CLASS_META[result.top_class];
  const stamp = new Date();

  const handleDownload = async () => {
    if (!reportRef.current || busy) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        // The report uses a system font stack; skip trying to inline the
        // cross-origin Google Fonts stylesheet (blocked by CORS / harmless).
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `neuroscan-report-${stamp.getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Report export failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="btn-ghost"
      >
        {busy ? (
          <SpinnerIcon className="h-4 w-4" />
        ) : (
          <UploadIcon className="h-4 w-4 rotate-180" />
        )}
        {busy ? "Preparing…" : "Download report"}
      </button>

      {/* Off-screen report (rendered, not display:none, so it can be captured) */}
      <div
        aria-hidden
        style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none" }}
      >
        <div
          ref={reportRef}
          style={{
            width: 820,
            background: "#ffffff",
            color: "#0f172a",
            fontFamily:
              "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
            padding: 36,
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#0891B2,#22D3EE)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                ◑
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>NeuroScan</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Brain Tumor MRI — Classification Report
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
              <div>{stamp.toLocaleString()}</div>
              <div>Model: {result.model_label}</div>
            </div>
          </div>

          {/* Predicted result */}
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#0891B2",
                fontWeight: 700,
              }}
            >
              Predicted class
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: topMeta.hex }}>
                {topMeta.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: topMeta.hex }}>
                {formatPercent(result.top_confidence)}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
              {topMeta.description}
            </div>
          </div>

          {/* Probabilities */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Class probabilities
            </div>
            {CLASS_ORDER.map((id) => {
              const p =
                result.probabilities.find((x) => x.class_id === id)
                  ?.probability ?? 0;
              const meta = CLASS_META[id];
              return (
                <div
                  key={id}
                  style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}
                >
                  <div style={{ width: 110, fontSize: 13, color: "#334155" }}>
                    {meta.short}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 10,
                      background: "#f1f5f9",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${p * 100}%`,
                        height: "100%",
                        background: meta.hex,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 56,
                      textAlign: "right",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {formatPercent(p)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Images */}
          <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
            <figure style={{ flex: 1, margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.original_image}
                alt="Original MRI"
                style={{ width: "100%", borderRadius: 10, display: "block" }}
              />
              <figcaption
                style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 6 }}
              >
                Original scan
              </figcaption>
            </figure>
            {result.gradcam_image && (
              <figure style={{ flex: 1, margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.gradcam_image}
                  alt="Grad-CAM heatmap"
                  style={{ width: "100%", borderRadius: 10, display: "block" }}
                />
                <figcaption
                  style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 6 }}
                >
                  Grad-CAM model attention
                </figcaption>
              </figure>
            )}
          </div>

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 24,
              borderTop: "1px solid #e2e8f0",
              paddingTop: 14,
              fontSize: 11,
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#b45309" }}>
              Educational demonstration only.
            </strong>{" "}
            This report is generated by an experimental machine-learning demo and
            is <strong>not</strong> a medical device. It must never be used for
            diagnosis, screening, or treatment decisions. Predictions are not
            clinically validated.
          </div>
        </div>
      </div>
    </>
  );
}
