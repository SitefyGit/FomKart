"use client";
import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "info";
export type ToastItem = { id: string; type: ToastType; title?: string; message: string; duration?: number };

function color(type: ToastType) {
  switch (type) {
    case "success":
      return "bg-green-600 ring-green-700";
    case "error":
      return "bg-red-600 ring-red-700";
    default:
      return "bg-gray-800 ring-gray-900";
  }
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[1000] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

export function Toast({ id, type, title, message, duration = 3500, onClose }: ToastItem & { onClose: () => void }) {
  useEffect(() => {
    const tm = setTimeout(onClose, duration);
    return () => clearTimeout(tm);
  }, [id, duration, onClose]);

  return (
    <div
      className={`pointer-events-auto ${color(
        type
      )} text-white shadow-lg ring-1 rounded-lg px-4 py-3 flex items-start gap-3 min-w-[260px]`}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5">
        {type === "success" ? (
          <span aria-hidden>✔</span>
        ) : type === "error" ? (
          <span aria-hidden>⚠</span>
        ) : (
          <span aria-hidden>ℹ</span>
        )}
      </div>
      <div className="flex-1">
        {title && <div className="font-semibold text-sm leading-none mb-1">{title}</div>}
        <div className="text-sm opacity-95">{message}</div>
      </div>
      <button
        aria-label="Close notification"
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white transition"
      >
        ×
      </button>
    </div>
  );
}
