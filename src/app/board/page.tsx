import type { Metadata } from "next";
import { Stickies } from "../stickies/stickies";
import { BulletinBoard } from "./bulletin-board";

export const metadata: Metadata = {
  title: "The idea board",
  description: "A little window into what Kevin Pei is thinking about building. Browse the stickies and leave a thought.",
  alternates: { canonical: "/board" },
  openGraph: { title: "Kevin’s idea board", description: "Loose ideas, works in progress, and things worth trying.", url: "/board" },
};

export default function BoardPage() {
  return <Stickies board><BulletinBoard embedded native /></Stickies>;
}
