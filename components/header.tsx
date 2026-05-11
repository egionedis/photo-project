"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function Header() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="site-header">
      <div className="container inner">
        <Link className="site-title" href="/gallery">
          Edgar Gionedis
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/gallery">{t("gallery")}</Link>
          <Link href="/about">{t("about")}</Link>
          <div className="language-toggle" aria-label={t("language")}>
            <button
              type="button"
              className={language === "pt" ? "is-active" : ""}
              onClick={() => setLanguage("pt")}
              aria-pressed={language === "pt"}
            >
              PT
            </button>
            <button
              type="button"
              className={language === "en" ? "is-active" : ""}
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
            >
              EN
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
