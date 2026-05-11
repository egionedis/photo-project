"use client";

import { useLanguage } from "@/components/language-provider";

export function AboutContent() {
  const { t } = useLanguage();

  return (
    <>
      <h1>{t("aboutMe")}</h1>
      <div className="about-paragraphs">
        <p>{t("aboutBody")}</p>
      </div>

      <p className="about-contact">
        {t("contact")}
        <br />
        edgar.gionedis@gmail.com
      </p>
    </>
  );
}
