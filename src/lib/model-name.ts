export function formatModelName(model: string): string {
  const cleaned = model.replace(/^models\//, "").replace(/:free$/, "");
  if (cleaned === "openrouter/free") {
    return "OpenRouter free";
  }
  return cleaned
    .split(/[-_/]/)
    .map((part) => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}
