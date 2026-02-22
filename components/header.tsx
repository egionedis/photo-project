import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container inner">
        <Link className="site-title" href="/gallery">
          Edgar Gionedis
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/gallery">Gallery</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
