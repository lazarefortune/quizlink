"use client";

import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Eraser as EraserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { normalizeQuizRichTextForEditor } from "@/lib/rich-text/normalizeQuizRichTextForEditor";
import { richTextToPlainText } from "@/lib/rich-text/richTextToPlainText";
import { sanitizeQuizRichText } from "@/lib/rich-text/sanitizeQuizRichText";
import { cn } from "@/lib/utils";

type RichTextQuestionEditorProps = {
  value: string;
  onChange: (sanitizedHtml: string) => void;
  hasError?: boolean;
  errorTargetId?: string;
  placeholder?: string;
  ariaLabel?: string;
};

/**
 * Rich text editor for `question.label`. Backed by Tiptap, with a small toolbar
 * (bold / italic / underline / strike / clear formatting). Links and other
 * inline embeds are intentionally not supported in V1.
 *
 * Contract:
 * - `value` is sanitized HTML coming from storage or the builder snapshot.
 * - `onChange` always receives sanitized HTML (defense in depth: we re-sanitize
 *   what Tiptap produces on every update before propagating).
 */
export function RichTextQuestionEditor({
  value,
  onChange,
  hasError = false,
  errorTargetId,
  placeholder,
  ariaLabel,
}: RichTextQuestionEditorProps) {
  const { locale } = useLocale();

  const initialContent = useMemo(
    () => normalizeQuizRichTextForEditor(value),
    // Only compute the initial content once per editor lifetime; later updates
    // are handled via the dedicated `setContent` effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Underline,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel ?? "",
        "data-builder-error-target": hasError && errorTargetId ? errorTargetId : "",
        class: cn(
          "min-h-[100px] sm:min-h-[120px] w-full rounded-md border-2 bg-background px-3 py-2 text-base outline-none transition-colors focus:!border-primary focus-visible:!border-primary resize-none overflow-y-auto whitespace-pre-wrap [&_p]:m-0 [&_p+p]:mt-2",
          hasError
            ? "border-destructive/70 focus:!border-destructive focus-visible:!border-destructive"
            : "border-input",
        ),
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const sanitized = sanitizeQuizRichText(updatedEditor.getHTML());
      onChange(sanitized);
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    const currentHtml = editor.getHTML();
    const incoming = normalizeQuizRichTextForEditor(value);
    if (currentHtml === incoming || currentHtml === value) {
      return;
    }
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [editor, value]);

  const isEmpty = editor?.isEmpty ?? richTextToPlainText(value).length === 0;

  return (
    <div className="space-y-2">
      <div
        role="toolbar"
        aria-label={t(locale, "builder.richText.toolbarLabel")}
        className="flex flex-wrap items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 border-2 border-border/60 rounded-sm bg-secondary/30"
      >
        <ToolbarButton
          ariaLabel={t(locale, "builder.richText.bold")}
          isActive={editor?.isActive("bold") ?? false}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="h-3.5 w-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel={t(locale, "builder.richText.italic")}
          isActive={editor?.isActive("italic") ?? false}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="h-3.5 w-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel={t(locale, "builder.richText.underline")}
          isActive={editor?.isActive("underline") ?? false}
          disabled={!editor?.can().chain().focus().toggleUnderline().run()}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3.5 w-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel={t(locale, "builder.richText.strike")}
          isActive={editor?.isActive("strike") ?? false}
          disabled={!editor?.can().chain().focus().toggleStrike().run()}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon className="h-3.5 w-3.5" aria-hidden />
        </ToolbarButton>
        <div className="h-4 w-px bg-border mx-0.5 sm:mx-1 shrink-0" />
        <ToolbarButton
          ariaLabel={t(locale, "builder.richText.clearFormatting")}
          isActive={false}
          disabled={!editor}
          onClick={() =>
            editor?.chain().focus().unsetAllMarks().run()
          }
        >
          <EraserIcon className="h-3.5 w-3.5" aria-hidden />
        </ToolbarButton>
      </div>

      <div className="relative">
        <EditorContent editor={editor} />
        {isEmpty && placeholder ? (
          <div className="pointer-events-none absolute left-3 top-2 select-none text-base text-muted-foreground">
            {placeholder}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ToolbarButtonProps = {
  ariaLabel: string;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ ariaLabel, isActive, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      aria-pressed={isActive}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-7 w-7 shrink-0",
        isActive && "bg-primary text-primary-foreground",
      )}
    >
      {children}
    </Button>
  );
}
