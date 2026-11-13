export const noteColors = ["yellow", "blue", "pink", "green", "lavender"] as const;
export const noteStatuses = ["idea", "exploring", "building", "shelved", "done"] as const;
export type NoteColor = (typeof noteColors)[number];
export type NoteStatus = (typeof noteStatuses)[number];
export type Vote = -1 | 0 | 1;
export type BoardNote = { id: string; title: string; body: string; color: NoteColor; status: NoteStatus; createdAt: string; updatedAt: string; score?: number };
export type BoardComment = { id: string; noteId: string; name: string; body: string; createdAt: string };
export type BoardSnapshot = { notes: BoardNote[]; comments: BoardComment[]; mode: "local" | "connected" | "preview" };
export const statusLabels: Record<NoteStatus, string> = { idea: "Idea", exploring: "Exploring", building: "Building", shelved: "Shelved", done: "Done" };
export const seedNoteDate = "2026-09-25T05:15:00.000Z";
export const seedNotes: BoardNote[] = [
  { id: "guided-visor", title: "Buffed up [visor](https://github.com/ktpei/visor) but for guidance/onboard", body: "This was basically a shittier [Clicky](https://www.heyclicky.com/) before Clicky was a thing, which was our exact vision.\n[Visor demo](https://www.youtube.com/watch?v=uYmiHdQ1VMU)", color: "yellow", status: "idea" },
  { id: "notes-to-text", title: "Music transcription", body: "", color: "blue", status: "idea" },
  { id: "digital-poker", title: "Digital poker chips", body: "Forgot the chips? Use your phones to track everyone’s stacks, bets, and the pot while you play with a real deck.", color: "pink", status: "idea" },
  { id: "learn-asl", title: "Duolingo but for ASL", body: "", color: "green", status: "idea" },
  { id: "pair-prompting", title: "Pair prompting", body: "Multiplayer AI ([Conductor](https://www.conductor.build/)).", color: "lavender", status: "idea" },
  { id: "executable-tutorials", title: "Tutorial → executable", body: "Record yourself doing a task once, then share it as a computer use workflow someone else can run to repeat the same steps.", color: "yellow", status: "idea" },
  { id: "morse-notifications", title: "Morse code with push notifications buzzes", body: "", color: "pink", status: "idea" },
  { id: "virtual-collection", title: "Virtual collection platform", body: "Virtual ripping", color: "blue", status: "idea" },
  { id: "prompt-guessing", title: "Gartic Phone, but with guessing the original prompt of a generated photo", body: "", color: "yellow", status: "idea" },
  { id: "streamer-redaction", title: "Auto redact for streamers", body: "", color: "green", status: "idea" },
  { id: "back-burner", title: "Already done", body: "[Movie syncing for long distance](https://github.com/ktpei/twoseat)\n[Spotify lyrics on the desktop](https://github.com/ka1kqi/glass)", color: "pink", status: "done" },
].map((note) => ({ ...note, color: note.color as NoteColor, status: note.status as NoteStatus, createdAt: seedNoteDate, updatedAt: seedNoteDate }));

export function refreshSeedNote(note: BoardNote): BoardNote {
  // Update starter copy while preserving owner edits and deletions.
  if (Date.parse(note.createdAt) !== Date.parse(seedNoteDate) || Date.parse(note.updatedAt) !== Date.parse(seedNoteDate)) return note;
  const seed = seedNotes.find((seed) => seed.id === note.id);
  return seed ? { ...note, ...seed } : note;
}

export function parseNoteText(text: string): Array<string | { label: string; href: string }> {
  const parts: Array<string | { label: string; href: string }> = [];
  let end = 0;
  for (const match of text.matchAll(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/gi)) {
    const [, label, href] = match;
    if (!URL.canParse(href)) continue;
    if (match.index > end) parts.push(text.slice(end, match.index));
    parts.push({ label, href });
    end = match.index + match[0].length;
  }
  if (end < text.length) parts.push(text.slice(end));
  return parts;
}

export function notePlainText(text: string) {
  return parseNoteText(text).map((part) => typeof part === "string" ? part : part.label).join("");
}
