import React from "react";

/*
 * Renders Ark's replies as a small, easy-to-scan card instead of one block of text.
 *
 * The hint API asks the model for this shape:
 *   **Short title**
 *   - point
 *   - point
 *   💡 Example: ...      (or 👉 a question to think about)
 *
 * Anything else (plain sentences, numbered lists) still renders sensibly, and a
 * half-typed reply from the typewriter effect never shows stray ** marks.
 */

const TIP_STYLES = {
  "💡": "border-amber-200 bg-amber-50 text-amber-900",
  "👉": "border-brand-200 bg-brand-50 text-brand-800",
  "⭐": "border-emerald-200 bg-emerald-50 text-emerald-900",
  "🌟": "border-emerald-200 bg-emerald-50 text-emerald-900",
  "✅": "border-emerald-200 bg-emerald-50 text-emerald-900",
  "📐": "border-violet-200 bg-violet-50 text-violet-900",
  "📖": "border-sky-200 bg-sky-50 text-sky-900",
};
const TIP_PATTERN = /^(💡|👉|⭐|🌟|✅|📐|📖)\s*(.*)$/u;

/** **bold** inside a line; an unfinished "**" (mid-typing) is simply hidden. */
const renderInline = (text, keyPrefix) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part.replace(/\*+/g, "")}</React.Fragment>;
  });
};

/** Turn the raw reply into typed blocks, grouping neighbouring bullet lines. */
export const parseArkReply = (raw) => {
  const blocks = [];
  const lines = String(raw || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    // A whole line in bold is the title; "**Title" with the closing ** still
    // being typed counts too. "**Note:** more text" stays a normal line.
    // The model sometimes drops the ** — a short first line (no full stop)
    // followed by bullet points is still clearly the title.
    const shortLead =
      index === 0 &&
      line.length <= 40 &&
      !/[.?!:,]$/.test(line) &&
      /^[-•*]\s+/.test(lines[1] || "");
    const title =
      line.match(/^\*\*([^*]+)\*{0,2}$/) ||
      line.match(/^#{1,4}\s+(.+)$/) ||
      (shortLead ? [line, line] : null);
    const bullet = line.match(/^[-•*]\s+(.+)$/);
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    const tip = line.match(TIP_PATTERN);

    if (title) {
      blocks.push({ type: "title", text: title[1] });
    } else if (bullet || numbered) {
      const text = bullet ? bullet[1] : numbered[2];
      const last = blocks[blocks.length - 1];
      if (last && last.type === "list") last.items.push(text);
      else blocks.push({ type: "list", ordered: !!numbered, items: [text] });
    } else if (tip) {
      blocks.push({ type: "tip", icon: tip[1], text: tip[2] });
    } else {
      blocks.push({ type: "text", text: line });
    }
  });
  return blocks;
};

/** Plain text for read-aloud: no markdown symbols, Tamil letters kept. */
export const arkReplyToSpeech = (raw) =>
  String(raw || "")
    .replace(/\*\*/g, "")
    .replace(/^[-•*]\s+/gm, "")
    .replace(/[^\p{L}\p{M}\p{N}\s.,!?'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const ArkMessage = ({ text, typing = false }) => {
  const blocks = parseArkReply(text);

  return (
    <div className="space-y-2 font-ark text-[15px] leading-[1.5] text-slate-700">
      {blocks.map((block, i) => {
        if (block.type === "title") {
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-brand-500 to-cyan-400" />
              <h4 className="text-[17px] font-semibold leading-tight tracking-wide text-brand-700">
                {renderInline(block.text, `t${i}`)}
              </h4>
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  {block.ordered ? (
                    <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                      {j + 1}
                    </span>
                  ) : (
                    <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-cyan-400" />
                  )}
                  <span>{renderInline(item, `l${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "tip") {
          return (
            <div
              key={i}
              className={`flex gap-2 rounded-xl border px-3 py-2 text-[14px] ${TIP_STYLES[block.icon] || TIP_STYLES["💡"]}`}
            >
              <span className="shrink-0 leading-[1.5]">{block.icon}</span>
              <span>{renderInline(block.text, `p${i}`)}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-slate-800">
            {renderInline(block.text, `x${i}`)}
          </p>
        );
      })}
      {typing && (
        <span className="inline-block h-[16px] w-[2px] animate-pulse rounded-full bg-brand-500 align-middle" />
      )}
    </div>
  );
};

export default ArkMessage;
