import ReactMarkdown from "react-markdown";
import { linkBinavHandle, removeLongDashes } from "@/lib/clean-text";

export function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {linkBinavHandle(removeLongDashes(text))}
      </ReactMarkdown>
    </div>
  );
}
