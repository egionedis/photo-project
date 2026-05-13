"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../app/admin/admin.module.css";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        setError("Invalid password.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not log in. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <form style={{ maxWidth: "420px", margin: "0 auto", display: "grid", gap: "1.5rem" }} onSubmit={handleSubmit}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 400 }}>Admin Login</h1>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className={styles.input}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p style={{ color: "oklch(45% 0.15 25)", margin: 0, fontSize: "0.95rem" }}>{error}</p> : null}
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
