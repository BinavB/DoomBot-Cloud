export function removeLongDashes(text: string): string {
  return text.replace(/\s*—\s*/g, ", ").replace(/\s–\s/g, ", ");
}
