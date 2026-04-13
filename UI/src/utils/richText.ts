const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "FONT",
  "H1",
  "H2",
  "H3",
  "H4",
  "I",
  "LI",
  "MARK",
  "OL",
  "P",
  "S",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeUrl = (href: string) => {
  try {
    const url = new URL(href, window.location.origin);
    return SAFE_PROTOCOLS.includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
};

const sanitizeInlineStyle = (value: string | null) => {
  if (!value) return "";

  return value
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [rawProperty, rawValue] = entry.split(":");
      const property = rawProperty?.trim().toLowerCase();
      const nextValue = rawValue?.trim();

      if (!property || !nextValue) return "";
      if (property === "background-color" || property === "color") {
        return `${property}: ${nextValue}`;
      }
      if (property === "font-family") {
        return `${property}: ${nextValue.replace(/[^a-z0-9,\s"'_-]/gi, "")}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("; ");
};

const sanitizeNode = (node: Node, doc: Document): Node | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    const fragment = doc.createDocumentFragment();
    Array.from(element.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, doc);
      if (sanitizedChild) fragment.appendChild(sanitizedChild);
    });
    return fragment;
  }

  const normalizedTag =
    tagName === "B"
      ? "strong"
      : tagName === "I"
        ? "em"
        : tagName === "FONT"
          ? "span"
          : tagName.toLowerCase();

  const next = doc.createElement(normalizedTag);

  if (tagName === "A") {
    const href = sanitizeUrl(element.getAttribute("href") || "");
    if (href) {
      next.setAttribute("href", href);
      next.setAttribute("target", "_blank");
      next.setAttribute("rel", "noreferrer");
    }
  }

  const style =
    tagName === "FONT"
      ? sanitizeInlineStyle(
          [
            element.getAttribute("style"),
            element.getAttribute("face")
              ? `font-family: ${element.getAttribute("face")}`
              : "",
          ]
            .filter(Boolean)
            .join("; "),
        )
      : sanitizeInlineStyle(element.getAttribute("style"));

  if (style) {
    next.setAttribute("style", style);
  }

  Array.from(element.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, doc);
    if (sanitizedChild) next.appendChild(sanitizedChild);
  });

  return next;
};

export const sanitizeRichTextHtml = (input: string) => {
  if (!input.trim()) return "";

  if (typeof window === "undefined") {
    return input;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${input}</div>`, "text/html");
  const container = parsed.body.firstElementChild || parsed.body;
  const cleanDoc = document.implementation.createHTMLDocument("");
  const output = cleanDoc.createElement("div");

  Array.from(container.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, cleanDoc);
    if (sanitizedChild) output.appendChild(sanitizedChild);
  });

  return output.innerHTML.trim();
};

export const richTextToPlainText = (input: string) => {
  if (!input.trim()) return "";

  if (typeof window === "undefined") {
    return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const container = document.createElement("div");
  container.innerHTML = sanitizeRichTextHtml(input);
  return (container.textContent || "").replace(/\s+/g, " ").trim();
};

export const getRichTextPreview = (input: string, maxLength: number = 180) => {
  const plainText = richTextToPlainText(input);
  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
};

export const plainTextToRichText = (input: string) => {
  const text = input.trim();
  if (!text) return "";

  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      const level = Math.min(4, line.match(/^#+/)?.[0].length || 1);
      blocks.push(`<h${level}>${escapeHtml(line.replace(/^#{1,4}\s+/, ""))}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s+/.test(line)) {
      blocks.push(`<blockquote>${escapeHtml(line.replace(/^>\s+/, ""))}</blockquote>`);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(`<li>${escapeHtml(lines[index].trim().replace(/^[-*]\s+/, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${escapeHtml(lines[index].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,4}\s+/.test(lines[index].trim()) &&
      !/^>\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraph.push(escapeHtml(lines[index].trim()));
      index += 1;
    }
    blocks.push(`<p>${paragraph.join("<br />")}</p>`);
  }

  return sanitizeRichTextHtml(blocks.join(""));
};
