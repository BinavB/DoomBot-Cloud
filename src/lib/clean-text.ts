const binavSearchUrl = "https://www.google.com/search?q=binav.b";
const markdownLink = /\[[^\]]*\]\([^)]*\)/g;
const bareHandle = /\bbinav\.b\b/gi;

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
