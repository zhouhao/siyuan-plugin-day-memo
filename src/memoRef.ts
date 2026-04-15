import { Memo } from "./types";

const PREVIEW_MAX_LEN = 24;

export function makeMemoRefToken(memo: Memo): string {
  const preview = makeRefPreview(memo.content) || memo.id;
  const safe = preview.replace(/[\[\]]/g, "");
  return `[@${safe}](memo-ref://${memo.id})`;
}

export function makeRefPreview(content: string): string {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "[image]")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > PREVIEW_MAX_LEN
    ? stripped.slice(0, PREVIEW_MAX_LEN) + "…"
    : stripped;
}
