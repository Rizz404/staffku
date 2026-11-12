import type { CSSProperties } from "react";
import type { Agent } from "@/lib/agents";

/** Colored blob with two pill eyes. Pure CSS, shapes in globals.css. */
export default function Avatar({ agent, size = 44 }: { agent: Pick<Agent, "color" | "shape">; size?: number }) {
  const style = { "--c": agent.color, "--size": `${size}px` } as CSSProperties;
  return <span className="avatar" data-shape={agent.shape} style={style} aria-hidden="true" />;
}

/** Neutral white blob, used in the hero headline and the call-to-action. */
export function BrandBlob({ size = 56 }: { size?: number }) {
  return <span className="avatar plain" style={{ "--size": `${size}px` } as CSSProperties} aria-hidden="true" />;
}
