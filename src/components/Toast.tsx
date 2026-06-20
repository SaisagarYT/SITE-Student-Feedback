"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "#10b981",
          icon: "✓",
        };
      case "error":
        return {
          bg: "#ef4444",
          icon: "✕",
        };
      case "warning":
        return {
          bg: "#f59e0b",
          icon: "⚠",
        };
      case "info":
        return {
          bg: "#3b82f6",
          icon: "ℹ",
        };
      default:
        return {
          bg: "#6b7280",
          icon: "•",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className="animate-slide-in-right flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white font-medium"
      style={{
        background: styles.bg,
        animation: "slideInRight 0.3s ease-out, slideOutRight 0.3s ease-out 3.7s forwards",
      }}
    >
      <span className="text-xl font-bold">{styles.icon}</span>
      <span>{toast.message}</span>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
