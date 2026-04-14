import { sanitizeRichTextHtml } from "../../utils/richText";

interface RichTextContentProps {
  content: string;
  className?: string;
  emptyText?: string;
}

export default function RichTextContent({
  content,
  className = "",
  emptyText = "No content available.",
}: RichTextContentProps) {
  const sanitized = sanitizeRichTextHtml(content);

  if (!sanitized) {
    return <p className={className}>{emptyText}</p>;
  }

  return (
    <div
      className={`text-sm leading-6 text-slate-700 [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-slate-900 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-slate-900 [&_li]:ml-5 [&_li]:list-item [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:whitespace-pre-wrap [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
