/**
 * Removes <think>…</think> reasoning blocks that some local models put inside `content`.
 * Tags may be split across stream chunks, so it holds back a short tail when it could be a partial tag.
 */
export function createThinkStripper() {
  const OPEN = "<think>";
  const CLOSE = "</think>";
  let inThink = false;
  let pending = "";
  let atStart = true;

  const tailHold = (s: string, tag: string) => {
    for (let n = Math.min(tag.length - 1, s.length); n > 0; n--) {
      if (tag.startsWith(s.slice(s.length - n))) return n;
    }
    return 0;
  };

  function push(chunk: string): string {
    pending += chunk;
    let out = "";
    for (;;) {
      if (!inThink) {
        const i = pending.indexOf(OPEN);
        if (i >= 0) {
          out += pending.slice(0, i);
          pending = pending.slice(i + OPEN.length);
          inThink = true;
          continue;
        }
        const hold = tailHold(pending, OPEN);
        out += pending.slice(0, pending.length - hold);
        pending = pending.slice(pending.length - hold);
        break;
      }
      const j = pending.indexOf(CLOSE);
      if (j >= 0) {
        pending = pending.slice(j + CLOSE.length).replace(/^\s+/, "");
        inThink = false;
        continue;
      }
      pending = pending.slice(pending.length - tailHold(pending, CLOSE));
      break;
    }
    if (atStart) {
      out = out.replace(/^\s+/, "");
      if (out) atStart = false;
    }
    return out;
  }

  /** Flush whatever is left when the stream ends (an unclosed <think> is dropped). */
  function end(): string {
    const rest = inThink ? "" : pending;
    pending = "";
    return rest;
  }

  return { push, end };
}
