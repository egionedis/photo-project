"use client";

import { useState } from "react";

export function AdminRebuildButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRebuild() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cloudinary/rebuild-snapshot", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to rebuild");
      }

      setMessage("✓ Gallery rebuilt");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage("✗ Rebuild failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={handleRebuild}
        disabled={loading}
        style={{
          padding: "0.5rem 0.75rem",
          border: "1px solid #e5e5e5",
          background: "#ffffff",
          color: "#171717",
          borderRadius: "10px",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: '"EB Garamond", Garamond, "Times New Roman", serif',
          fontSize: "0.875rem",
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? "Rebuilding..." : "Rebuild Gallery"}
      </button>
      {message && (
        <span
          style={{
            fontSize: "0.875rem",
            fontFamily: '"EB Garamond", Garamond, "Times New Roman", serif',
            color: message.startsWith("✓") ? "#3f6b5c" : "#d32f2f"
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
