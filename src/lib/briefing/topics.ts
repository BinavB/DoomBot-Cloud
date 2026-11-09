export type TopicId = "world" | "politics" | "business" | "technology" | "developer" | "science" | "health" | "sport" | "entertainment";

export interface BriefingTopic {
  id: TopicId;
  label: string;
  feedUrl: string;
}

export const hackerNewsFeed = "hacker-news";

export const briefingTopics: BriefingTopic[] = [
  { id: "world", label: "World news", feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { id: "politics", label: "Politics", feedUrl: "https://feeds.bbci.co.uk/news/politics/rss.xml" },
  { id: "business", label: "Business and money", feedUrl: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { id: "technology", label: "Technology", feedUrl: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { id: "developer", label: "Developer and startup news", feedUrl: hackerNewsFeed },
  { id: "science", label: "Science and environment", feedUrl: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
  { id: "health", label: "Health", feedUrl: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  { id: "sport", label: "Sport", feedUrl: "https://feeds.bbci.co.uk/sport/rss.xml" },
  { id: "entertainment", label: "Entertainment", feedUrl: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },
];

export const defaultTopics: TopicId[] = ["world", "technology"];
export const maxTopics = 6;

const knownIds = new Set<string>(briefingTopics.map((topic) => topic.id));

export function normalizeTopics(value: unknown): TopicId[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = [...new Set(value.filter((item): item is string => typeof item === "string" && knownIds.has(item)))];
  return briefingTopics.map((topic) => topic.id).filter((id) => unique.includes(id)).slice(0, maxTopics);
}

export function findTopic(id: TopicId): BriefingTopic {
  return briefingTopics.find((topic) => topic.id === id) ?? briefingTopics[0];
}
