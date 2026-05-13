import type { Metadata } from "next";
import Image from "next/image";
import { AboutContent } from "@/components/about-content";
import styles from "./page.module.css";

const PORTRAIT_URL =
  "https://res.cloudinary.com/daeq8lxbv/image/upload/v1771703886/IMG_0008_zfoqiv.jpg";

export const metadata: Metadata = {
  title: "About | Edgar Gionedis",
  description:
    "Photography portfolio of Edgar Gionedis, featuring travel, landscape, street, and personal photography.",
  alternates: {
    canonical: "/about"
  },
  openGraph: {
    title: "About | Edgar Gionedis",
    description:
      "Photography portfolio of Edgar Gionedis, featuring travel, landscape, street, and personal photography.",
    url: "/about",
    type: "website"
  }
};

export default function AboutPage() {
  return (
    <section className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.imageWrap}>
          <Image
            src={PORTRAIT_URL}
            alt="Portrait"
            width={1200}
            height={1600}
            sizes="(max-width: 767px) 100vw, 50vw"
            className={styles.image}
            unoptimized
          />
        </div>

        <div className={styles.copy}>
          <AboutContent />
        </div>
      </div>
    </section>
  );
}
