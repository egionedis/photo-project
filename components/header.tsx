"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import styles from "./Header.module.css";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logoPlaceholder} aria-label="Home">
          <Image
            src="/logo.png"
            alt="Edgar Gionedis"
            width={40}
            height={40}
            className={styles.logoImage}
            priority
          />
        </Link>

        <Link className={styles.title} href="/">
          Edgar Gionedis
        </Link>

        <nav className={`${styles.nav} ${styles.desktopNav}`} aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/about">About</Link>
        </nav>

        <button
          className={styles.mobileMenuToggle}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`${styles.hamburger} ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className={`${styles.nav} ${styles.mobileNav}`} aria-label="Mobile navigation">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/collections" onClick={() => setMobileMenuOpen(false)}>Collections</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
        </nav>
      )}
    </header>
  );
}
