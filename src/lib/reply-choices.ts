export const maxChoices = 4;
export const maxChoiceLength = 60;

const choicesPrefix = "[[choices:";
const completeTag = /\n?\[\[choices:([^\]]*)\]\]\s*$/;

export function splitChoices(text: string): { body: string; choices: string[] } {
  const complete = completeTag.exec(text);
  if (complete) {
    const choices = complete[1]
      .split("|")
      .map((choice) => choice.trim())
      .filter((choice) => choice.length > 0 && choice.length <= maxChoiceLength)
      .slice(0, maxChoices);
    return { body: text.slice(0, complete.index).trimEnd(), choices };
  }
  const start = text.lastIndexOf("[[");
  const tail = start === -1 ? "" : text.slice(start);
  if (start !== -1 && !tail.includes("]]") && (choicesPrefix.startsWith(tail) || tail.startsWith(choicesPrefix))) {
    return { body: text.slice(0, start).trimEnd(), choices: [] };
  }
  return { body: text, choices: [] };
}
