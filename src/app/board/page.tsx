import type { Metadata } from "next";
import { Stickies } from "../stickies/stickies";

export const metadata: Metadata = {
  title: "Idea board",
  description: "Browse Kevin Pei’s project ideas.",
  alternates: { canonical: "/board" },
  openGraph: { title: "Kevin’s idea board", description: "Project ideas on stickies.", url: "/board" },
};

export default function BoardPage() {
  return <Stickies initialBoard />;
}
