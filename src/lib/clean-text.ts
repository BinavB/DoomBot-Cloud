const binavSearchUrl = "https://www.google.com/search?q=binav.b";
const markdownLink = /\[[^\]]*\]\([^)]*\)/g;
const bareHandle = /\bbinav\.b\b/gi;

const codeFence = /(```[\s\S]*?(?:```|$))/;
const tableSeparatorCell = /^:?-{2,}:?$/;
const horizontalRule = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const boldTouchingWord = /\*\*([^*\n]+?)\*\*(?=[\p{L}\p{N}])/gu;

function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/\*\*/g, ""));
}

function isTableRow(line: string): boolean {
  return line.includes("|") && line.trim().length > 1;
}

function isSeparatorRow(line: string): boolean {
  return tableCells(line).every((cell) => tableSeparatorCell.test(cell));
}

function tableAsList(rows: string[]): string[] {
  const [header, ...body] = rows.filter((row) => !isSeparatorRow(row)).map(tableCells);
  return body.map((cells) => {
    const details = cells
      .slice(1)
      .map((cell, index) => (cell && header[index + 1] ? `${header[index + 1]} ${cell}` : cell))
      .filter(Boolean);
    return details.length > 0 ? `- ${cells[0]}: ${details.join(", ")}` : `- ${cells[0]}`;
  });
}

function convertTables(lines: string[]): string[] {
  const result: string[] = [];
  let index = 0;
  while (index < lines.length) {
    let end = index;
    while (end < lines.length && isTableRow(lines[end])) {
      end += 1;
    }
    const block = lines.slice(index, end);
    if (block.length >= 2 && block.some(isSeparatorRow)) {
      result.push("", ...tableAsList(block), "");
      index = end;
      continue;
    }
    result.push(lines[index]);
    index += 1;
  }
  return result;
}

function dropUnpairedBold(line: string): string {
  if ((line.split("**").length - 1) % 2 === 0) {
    return line;
  }
  const last = line.lastIndexOf("**");
  return line.slice(0, last) + line.slice(last + 2);
}

function tidyProse(text: string): string {
  return convertTables(text.split("\n"))
    .filter((line) => !horizontalRule.test(line))
    .map((line) => dropUnpairedBold(line.replace(boldTouchingWord, "**$1** ")))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function tidyReply(text: string): string {
  return text
    .split(codeFence)
    .map((part) => (part.startsWith("```") ? part : tidyProse(part)))
    .join("");
}

export function removeLongDashes(text: string): string {
  return text.replace(/\s*—\s*/g, ", ").replace(/\s–\s/g, ", ");
}

function pointHandleLinkToSearch(link: string): string {
  const label = link.slice(1, link.indexOf("]"));
  return label.toLowerCase() === "binav.b" ? `[${label}](${binavSearchUrl})` : link;
}

export function linkBinavHandle(text: string): string {
  const links = text.match(markdownLink) ?? [];
  const plainParts = text.split(markdownLink).map((part) => part.replace(bareHandle, (handle) => `[${handle}](${binavSearchUrl})`));
  return plainParts.reduce((joined, part, index) => joined + part + (links[index] ? pointHandleLinkToSearch(links[index]) : ""), "");
}
