"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
    <form className="card stack" style={{ maxWidth: "460px", padding: "1rem" }} onSubmit={handleSubmit}>
      <h1 style={{ margin: 0 }}>Admin Login</h1>
      <label className="stack" style={{ gap: "0.4rem" }}>
        Password
        <input
          className="input"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p style={{ color: "#b62525", margin: 0 }}>{error}</p> : null}
      <button className="button" type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
