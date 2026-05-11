import type { Metadata } from "next";
import { redirect } from "next/navigation";

const SITE_DESCRIPTION =
  "Photography portfolio of Edgar Gionedis, featuring travel, landscape, street, and personal photography.";

export const metadata: Metadata = {
  title: "Edgar Gionedis | Photography Portfolio",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Edgar Gionedis | Photography Portfolio",
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website"
  }
};

export default function HomePage() {
  redirect("/gallery");
}
