import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalBoardStore, BoardStoreError, validateComment, validateNote } from "../src/lib/board-store";

async function run() {
  const directory = await mkdtemp(join(tmpdir(), "board-store-"));
  const store = new LocalBoardStore(join(directory, "board.json"));

  const initial = await store.snapshot();
  assert.equal(initial.mode, "local");
  assert.equal(initial.notes.length, 12, "uninitialized local storage exposes the seed board");

  const comment = await store.createComment({ noteId: "guided-visor", name: "  Casey ", body: " Great idea. " });
  assert.equal(comment.comments[0]?.name, "Casey");
  assert.equal(comment.comments[0]?.body, "Great idea.");
  assert.equal(JSON.parse(await readFile(join(directory, "board.json"), "utf8")).initialized, true);

  const saved = await store.saveNote({ id: "guided-visor", title: "Updated", body: "Keep the original date.", color: "blue", status: "building" });
  assert.equal(saved.notes.find((note) => note.id === "guided-visor")?.createdAt, initial.notes.find((note) => note.id === "guided-visor")?.createdAt);

  const deleted = await store.deleteNote("guided-visor");
  assert.equal(deleted.comments.length, 0, "deleting a note cascades local comments");
  await assert.rejects(
    store.saveNote({ id: "guided-visor", title: "No resurrection", body: "Deleted seeds stay deleted.", color: "blue", status: "building" }),
    BoardStoreError,
  );
  assert.equal((await store.snapshot()).notes.some((note) => note.id === "guided-visor"), false);

  const concurrent = await Promise.all(Array.from({ length: 10 }, (_, index) =>
    store.createComment({ noteId: "notes-to-text", name: `Person ${index}`, body: `Comment ${index}` }),
  ));
  assert.equal(concurrent.at(-1)?.comments.length, 10, "serialized writes retain concurrent comments");

  const emptyPath = join(directory, "empty.json");
  await writeFile(emptyPath, JSON.stringify({ initialized: true, notes: [], comments: [] }), "utf8");
  const emptyStore = new LocalBoardStore(emptyPath);
  assert.deepEqual(await emptyStore.snapshot(), { notes: [], comments: [], mode: "local" }, "an initialized empty board remains empty");

  assert.throws(() => validateComment({ noteId: "bad/id", name: "A", body: "B" }), BoardStoreError);
  assert.throws(() => validateNote({ title: "", body: "B", color: "yellow", status: "idea" }), BoardStoreError);
  console.log("board-store tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
