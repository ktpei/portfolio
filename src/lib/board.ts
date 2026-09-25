export const noteColors = ["yellow", "blue", "pink", "green", "lavender"] as const;
export const noteStatuses = ["idea", "exploring", "building", "shelved"] as const;
export type NoteColor = (typeof noteColors)[number];
export type NoteStatus = (typeof noteStatuses)[number];
export type BoardNote = { id: string; title: string; body: string; color: NoteColor; status: NoteStatus; createdAt: string; updatedAt: string };
export type BoardComment = { id: string; noteId: string; name: string; body: string; createdAt: string };
export type BoardSnapshot = { notes: BoardNote[]; comments: BoardComment[]; mode: "local" | "connected" | "preview" };
export const statusLabels: Record<NoteStatus, string> = { idea: "Just an idea", exploring: "Exploring", building: "Building", shelved: "On the back burner" };
const date = "2026-09-25T05:15:00.000Z";
export const seedNotes: BoardNote[] = [
  { id: "guided-visor", title: "A visor that shows you the ropes", body: "A buffed-up visor for guidance and onboarding.", color: "yellow", status: "idea" },
  { id: "notes-to-text", title: "Handwritten → digital", body: "Note recognition / AI transcription.", color: "blue", status: "idea" },
  { id: "digital-poker", title: "Digital poker chips", body: "Digital poker chips.", color: "pink", status: "idea" },
  { id: "learn-asl", title: "Duolingo, but for ASL", body: "A way to learn American Sign Language.", color: "green", status: "idea" },
  { id: "pair-prompting", title: "Pair prompting", body: "Pair prompting.\nAgent coworking.", color: "lavender", status: "idea" },
  { id: "executable-tutorials", title: "Tutorial → executable", body: "Turn a tutorial recording into something executable.", color: "yellow", status: "idea" },
  { id: "morse-notifications", title: "A little Morse code", body: "Morse code with push notifications.", color: "pink", status: "idea" },
  { id: "virtual-collection", title: "A place for collections", body: "A virtual collection platform.", color: "blue", status: "idea" },
  { id: "prompt-guessing", title: "Guess the prompt", body: "Gartic Phone, but with prompt guessing.", color: "yellow", status: "idea" },
  { id: "streamer-redaction", title: "Keep the private stuff private", body: "Auto redaction for streamers.", color: "green", status: "idea" },
  { id: "small-experiments", title: "Other rabbit holes", body: "QA testing\nAuto points collector\n3D render", color: "lavender", status: "idea" },
  { id: "back-burner", title: "Crossed off, for now", body: "Movie syncing for long distance\nSpotify lyrics on the desktop", color: "pink", status: "shelved" },
].map((note) => ({ ...note, color: note.color as NoteColor, status: note.status as NoteStatus, createdAt: date, updatedAt: date }));
