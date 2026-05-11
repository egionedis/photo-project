import type { Metadata } from "next";
import Image from "next/image";

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
    <section className="about-page">
      <div className="about-grid">
        <div className="about-image-wrap">
          <Image
            src={PORTRAIT_URL}
            alt="Portrait"
            width={1200}
            height={1600}
            sizes="(max-width: 767px) 100vw, 50vw"
            className="about-image"
            unoptimized
          />
        </div>

        <div className="about-copy">
          <h1>About me</h1>
          <div className="about-paragraphs">
            <p>
              This is a personal photobook where I try to capture the people,
              places, and movements that happen in my life.
            </p>
          </div>

          <p className="about-contact">
            Contact
            <br />
            edgar.gionedis@gmail.com
          </p>
        </div>
      </div>
    </section>
  );
}
