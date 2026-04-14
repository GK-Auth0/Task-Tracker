import { useEffect, useMemo, useRef, useState } from "react";
import {
  richTextToPlainText,
  sanitizeRichTextHtml,
} from "../../utils/richText";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

type BlockFormat = "p" | "h1" | "h2" | "h3" | "blockquote";

const toolbarButtonClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100";

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeightClassName = "min-h-[160px]",
  error,
  helperText,
  maxLength,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastEmittedRef = useRef<string>("");
  const isFocusedRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  const sanitizedValue = useMemo(() => sanitizeRichTextHtml(value), [value]);
  const plainTextLength = useMemo(
    () => richTextToPlainText(sanitizedValue).length,
    [sanitizedValue],
  );

  // Sync external value changes once the editor is not focused anymore.
  // This keeps typing stable while still allowing template/AI updates to land
  // after toolbar or helper button interactions blur the editor.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (isFocusedRef.current) return;
    if (editor.innerHTML !== sanitizedValue) {
      editor.innerHTML = sanitizedValue;
      lastEmittedRef.current = sanitizedValue;
    }
  }, [sanitizedValue, isFocused]);

  // Emit raw HTML while typing — no sanitization to avoid cursor reset
  const emitRaw = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const raw = editor.innerHTML;
    if (raw !== lastEmittedRef.current) {
      lastEmittedRef.current = raw;
      onChange(raw);
    }
  };

  // Sanitize only on blur
  const emitSanitized = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const clean = sanitizeRichTextHtml(editor.innerHTML);
    editor.innerHTML = clean;
    lastEmittedRef.current = clean;
    onChange(clean);
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitRaw();
  };

  const applyBlockFormat = (value: BlockFormat) => {
    runCommand("formatBlock", value);
  };

  const insertLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;
    runCommand("createLink", url);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <select
              defaultValue="p"
              onChange={(event) => applyBlockFormat(event.target.value as BlockFormat)}
              className="h-7 min-w-[104px] bg-transparent px-1 text-[11px] font-semibold text-slate-700 outline-none"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote</option>
            </select>
            <div className="h-4 w-px bg-slate-200" />
            <select
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return;
                runCommand("fontName", event.target.value);
              }}
              className="h-7 min-w-[92px] bg-transparent px-1 text-[11px] font-semibold text-slate-700 outline-none"
            >
              <option value="">Font</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Trebuchet MS">Trebuchet</option>
              <option value="Courier New">Courier</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("bold")}>
              B
            </button>
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("italic")}>
              I
            </button>
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("underline")}>
              U
            </button>
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("insertUnorderedList")}>
              List
            </button>
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("insertOrderedList")}>
              1.
            </button>
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("hiliteColor", "#fef08a")}>
              Mark
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
            <button type="button" className={toolbarButtonClass} onClick={insertLink}>
              Link
            </button>
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("unlink")}>
              Remove Link
            </button>
            <button type="button" className={toolbarButtonClass} onClick={() => runCommand("removeFormat")}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-xl border ${error ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
        {!plainTextLength && !isFocused ? (
          <p className="pointer-events-none absolute left-4 top-3 text-base text-slate-400">
            {placeholder}
          </p>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            isFocusedRef.current = true;
            setIsFocused(true);
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            setIsFocused(false);
            emitSanitized();
          }}
          onInput={emitRaw}
          className={`${minHeightClassName} px-4 py-3 text-base leading-7 text-slate-900 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-item [&_ol]:list-decimal [&_p]:min-h-[1.5rem] [&_ul]:list-disc`}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs ${error ? "text-red-500" : "text-slate-500"}`}>
          {error || helperText || "Formatting is preserved when you save this description."}
        </p>
        {typeof maxLength === "number" ? (
          <p className={`text-xs ${plainTextLength > maxLength ? "text-red-500" : "text-slate-400"}`}>
            {plainTextLength}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}
