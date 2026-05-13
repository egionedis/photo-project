"use client";

import { useLanguage } from "@/components/language-provider";
import styles from "@/app/about/page.module.css";

export function AboutContent() {
  const { t } = useLanguage();

  return (
    <>
      <h1>{t("aboutMe")}</h1>
      <div className={styles.paragraphs}>
        <p>{t("aboutBody")}</p>
      </div>

      <p className={styles.contact}>
        {t("contact")}
        <br />
        edgar.gionedis@gmail.com
      </p>
    </>
  );
}
