import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="card" style={{ padding: "1.25rem" }}>
      <h1 style={{ marginTop: 0 }}>Not found</h1>
      <p>The requested photo could not be found.</p>
      <Link className="button" href="/gallery">
        Back to gallery
      </Link>
    </section>
  );
}
