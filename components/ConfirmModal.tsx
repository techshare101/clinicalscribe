"use client";
import React from "react";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
};

export default function ConfirmModal({
  open,
  title = "Confirm",
  description = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmButtonClass = {
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700",
    info: "bg-blue-600 text-white hover:bg-blue-700",
  }[variant];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 m-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 rounded ${confirmButtonClass} disabled:opacity-50 min-w-[100px]`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}