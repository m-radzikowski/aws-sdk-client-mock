import { appendFileSync } from "fs";
import prettyAnsi from "pretty-ansi";
import type { SnapshotSerializer } from "vitest";

export default {
  serialize(text, config, indentation, depth, refs, printer) {
    appendFileSync("snapshot.log", text + "\n")
    
    return printer(prettyAnsi(typeof text === 'string' ? text : text.message), config, indentation, depth, refs);
  },
  test(val) {
    return (
      (typeof val === "string" && val.includes(`\x1B`)) ||
      (val !== null &&
        typeof val === "object" &&
        "message" in val &&
        typeof val.message === "string" &&
        val.message.includes(`\x1B`))
    );
  },
} satisfies SnapshotSerializer;
