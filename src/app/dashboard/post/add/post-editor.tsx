"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Extension, Node, type Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Code,
  Code2,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
  Pilcrow,
  Quote,
  Redo2,
  Save,
  Search,
  Send,
  Settings,
  Strikethrough,
  TableIcon,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { savePost } from "../actions";

const initialContent = `
  <p>Ketik / untuk memilih format seperti heading, paragraph, list, atau quote. Tekan Enter untuk membuat blok baru, lalu geser handle di kiri blok untuk mengatur urutannya.</p>
`;

function ToolbarIconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button {...props} />}>
        {children}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ImageUploadView({ node, updateAttributes }: NodeViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const src = node.attrs.src as string | null;
  const alt = (node.attrs.alt as string | null) ?? "Uploaded image";

  function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateAttributes({
        src: reader.result,
        alt: file.name,
      });
    };

    reader.readAsDataURL(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (file) {
      uploadFile(file);
    }
  }

  if (src) {
    return (
      <NodeViewWrapper className="my-6 w-full">
        <img
          src={src}
          alt={alt}
          className="h-auto w-full rounded-md border object-contain"
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-6 w-full">
      <div
        role="button"
        tabIndex={0}
        className="flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-lg border border-dashed border-foreground/70 bg-muted/40 px-6 py-10 text-center"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <ImageIcon className="size-5" />
        <div className="space-y-3">
          <p className="font-semibold">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground">SVG, PNG, JPG or GIF</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              uploadFile(file);
            }
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}

const imageUploadNode = Node.create({
  name: "imageUpload",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-upload"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-type": "image-upload", ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadView);
  },
});

type SlashMenuState = {
  open: boolean;
  query: string;
  from: number;
  to: number;
  top: number;
  left: number;
  selectedIndex: number;
};

const emptySlashMenu: SlashMenuState = {
  open: false,
  query: "",
  from: 0,
  to: 0,
  top: 0,
  left: 0,
  selectedIndex: 0,
};

type LinkMenuState = {
  open: boolean;
  top: number;
  left: number;
};

const emptyLinkMenu: LinkMenuState = {
  open: false,
  top: 0,
  left: 0,
};

type ContextMenuState = {
  open: boolean;
  top: number;
  left: number;
};

const emptyContextMenu: ContextMenuState = {
  open: false,
  top: 0,
  left: 0,
};

type BlockType = "paragraph" | "heading-2" | "heading-3" | "heading-4" | "heading-5";

const blockTypeLabels: Record<BlockType, string> = {
  paragraph: "Paragraph",
  "heading-2": "Heading 2",
  "heading-3": "Heading 3",
  "heading-4": "Heading 4",
  "heading-5": "Heading 5",
};

function getActiveBlockType(editor: Editor): BlockType {
  if (editor.isActive("heading", { level: 2 })) {
    return "heading-2";
  }

  if (editor.isActive("heading", { level: 3 })) {
    return "heading-3";
  }

  if (editor.isActive("heading", { level: 4 })) {
    return "heading-4";
  }

  if (editor.isActive("heading", { level: 5 })) {
    return "heading-5";
  }

  return "paragraph";
}

type SlashCommand = {
  title: string;
  keywords: string;
  icon: React.ReactNode;
  run: (editor: Editor, range: { from: number; to: number }) => void;
};

type ContextCommand = {
  title: string;
  icon: React.ReactNode;
  run: (editor: Editor) => void;
};

function selectedText(editor: Editor) {
  const { from, to, empty } = editor.state.selection;

  if (empty) {
    return "";
  }

  return editor.state.doc.textBetween(from, to, "\n").trim();
}

function textContent(text: string) {
  return text ? [{ type: "text", text }] : undefined;
}

function insertSelectedAsBlock(
  editor: Editor,
  content: Record<string, unknown>
) {
  editor.chain().focus().deleteSelection().insertContent(content).run();
}

const slashCommands: SlashCommand[] = [
  {
    title: "Paragraph",
    keywords: "paragraph text normal",
    icon: <Pilcrow className="size-4" />,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 2",
    keywords: "h2 heading subtitle",
    icon: <Heading2 className="size-4" />,
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 2 })
        .run();
    },
  },
  {
    title: "Heading 3",
    keywords: "h3 heading section",
    icon: <Heading3 className="size-4" />,
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 3 })
        .run();
    },
  },
  {
    title: "Heading 4",
    keywords: "h4 heading subsection",
    icon: <Heading4 className="size-4" />,
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 4 })
        .run();
    },
  },
  {
    title: "Heading 5",
    keywords: "h5 heading minor",
    icon: <Heading5 className="size-4" />,
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 5 })
        .run();
    },
  },
  {
    title: "Table",
    keywords: "table grid rows columns",
    icon: <TableIcon className="size-4" />,
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Image",
    keywords: "image picture photo media",
    icon: <ImageIcon className="size-4" />,
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "imageUpload" })
        .run();
    },
  },
  {
    title: "Check List",
    keywords: "checklist task todo",
    icon: <CheckSquare className="size-4" />,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Numbered List",
    keywords: "ordered numbered list",
    icon: <ListOrdered className="size-4" />,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Bulleted List",
    keywords: "bullet unordered list",
    icon: <List className="size-4" />,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Quote",
    keywords: "quote blockquote citation",
    icon: <Quote className="size-4" />,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
];

const contextCommands: ContextCommand[] = [
  {
    title: "Paragraph",
    icon: <Pilcrow className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "paragraph",
          content: textContent(text),
        });
        return;
      }

      editor.chain().focus().setParagraph().run();
    },
  },
  {
    title: "Heading 2",
    icon: <Heading2 className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "heading",
          attrs: { level: 2 },
          content: textContent(text),
        });
        return;
      }

      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    icon: <Heading3 className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "heading",
          attrs: { level: 3 },
          content: textContent(text),
        });
        return;
      }

      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "Heading 4",
    icon: <Heading4 className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "heading",
          attrs: { level: 4 },
          content: textContent(text),
        });
        return;
      }

      editor.chain().focus().toggleHeading({ level: 4 }).run();
    },
  },
  {
    title: "Heading 5",
    icon: <Heading5 className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "heading",
          attrs: { level: 5 },
          content: textContent(text),
        });
        return;
      }

      editor.chain().focus().toggleHeading({ level: 5 }).run();
    },
  },
  {
    title: "Numbered List",
    icon: <ListOrdered className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: textContent(text),
                },
              ],
            },
          ],
        });
        return;
      }

      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: "Bulleted List",
    icon: <List className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: textContent(text),
                },
              ],
            },
          ],
        });
        return;
      }

      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: "Quote",
    icon: <Quote className="size-4" />,
    run: (editor) => {
      const text = selectedText(editor);

      if (text) {
        insertSelectedAsBlock(editor, {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: textContent(text),
            },
          ],
        });
        return;
      }

      editor.chain().focus().toggleBlockquote().run();
    },
  },
];

const blockSelectionShortcut = Extension.create({
  name: "blockSelectionShortcut",

  addKeyboardShortcuts() {
    return {
      "Mod-a": ({ editor }) => {
        const { doc, selection } = editor.state;
        const { $from, from, to } = selection;

        if ($from.depth === 0) {
          return false;
        }

        const blockStart = $from.before($from.depth);
        const blockEnd = $from.after($from.depth);
        const blockNode = $from.node($from.depth);
        const textStart = blockStart + 1;
        const textEnd = blockEnd - 1;
        const isCurrentBlockSelected =
          from === textStart && to === textEnd;
        const isWholeDocumentSelected = from === 0 && to === doc.content.size;

        if (isCurrentBlockSelected || isWholeDocumentSelected) {
          return false;
        }

        if (!blockNode.isTextblock || textStart >= textEnd) {
          return editor.commands.setNodeSelection(blockStart);
        }

        editor.view.dispatch(
          editor.state.tr.setSelection(
            TextSelection.create(doc, textStart, textEnd)
          )
        );

        return true;
      },
    };
  },
});

type PostEditorProps = {
  mode?: "add" | "edit";
  postId?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialContent?: string;
  initialExcerpt?: string;
  initialPublishDate?: string | null;
  initialFeaturedImage?: string | null;
  initialAuthor?: string;
  initialCategory?: string;
  initialTag?: string;
  initialSeoTitle?: string;
  initialSeoDescription?: string;
  initialSchemaType?: string;
};

export function PostEditor({
  mode = "add",
  postId,
  initialTitle = "",
  initialSlug = "",
  initialContent: initialEditorContent = initialContent,
  initialExcerpt = "",
  initialPublishDate = null,
  initialFeaturedImage = null,
  initialAuthor = "admin",
  initialCategory = "uncategorized",
  initialTag = "blog",
  initialSeoTitle = "",
  initialSeoDescription = "",
  initialSchemaType = "article",
}: PostEditorProps) {
  const isEditMode = mode === "edit";
  const router = useRouter();
  const publishActionLabel = isEditMode ? "Update" : "Publish";
  const titlePlaceholder = isEditMode ? "Edit judul artikel" : "Judul artikel";
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [publishDate, setPublishDate] = useState<Date | undefined>(
    initialPublishDate ? new Date(initialPublishDate) : undefined
  );
  const [featuredImage, setFeaturedImage] =
    useState<string | null>(initialFeaturedImage);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [author, setAuthor] = useState(initialAuthor);
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle);
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription);
  const [schemaType, setSchemaType] = useState(initialSchemaType);
  const [htmlDraft, setHtmlDraft] = useState(initialEditorContent);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkMenu, setLinkMenu] = useState<LinkMenuState>(emptyLinkMenu);
  const [contextMenu, setContextMenu] =
    useState<ContextMenuState>(emptyContextMenu);
  const [isPending, startTransition] = useTransition();
  const [toolbarScrollProgress, setToolbarScrollProgress] = useState(0);
  const [activeBlockType, setActiveBlockType] =
    useState<BlockType>("paragraph");
  const [slashMenu, setSlashMenu] =
    useState<SlashMenuState>(emptySlashMenu);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const toolbarScrollRef = useRef<HTMLDivElement>(null);
  const toolbarDragRef = useRef({
    isDragging: false,
    didDrag: false,
    startX: 0,
    scrollLeft: 0,
  });

  const updateToolbarScrollState = useCallback(() => {
    const toolbar = toolbarScrollRef.current;

    if (!toolbar) {
      return;
    }

    const maxScrollLeft = toolbar.scrollWidth - toolbar.clientWidth;

    const progress = maxScrollLeft > 0 ? toolbar.scrollLeft / maxScrollLeft : 0;

    setToolbarScrollProgress((current) => {
      if (Math.abs(current - progress) < 0.005) {
        return current;
      }

      return progress;
    });
  }, []);

  useEffect(() => {
    updateToolbarScrollState();
    window.addEventListener("resize", updateToolbarScrollState);

    return () => {
      window.removeEventListener("resize", updateToolbarScrollState);
    };
  }, [updateToolbarScrollState]);

  useEffect(() => {
    if (titleInputRef.current) {
      resizeTitleField(titleInputRef.current);
    }
  }, [title]);

  useEffect(() => {
    function closeFloatingMenus() {
      setContextMenu(emptyContextMenu);
    }

    window.addEventListener("click", closeFloatingMenus);

    return () => {
      window.removeEventListener("click", closeFloatingMenus);
    };
  }, []);

  function scrollToolbar(direction: "left" | "right") {
    toolbarScrollRef.current?.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  }

  function handleToolbarWheel(event: React.WheelEvent<HTMLDivElement>) {
    const toolbar = event.currentTarget;

    if (toolbar.scrollWidth <= toolbar.clientWidth) {
      return;
    }

    const horizontalDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (horizontalDelta === 0) {
      return;
    }

    event.preventDefault();
    toolbar.scrollLeft += horizontalDelta;
    updateToolbarScrollState();
  }

  function handleToolbarPointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const toolbar = event.currentTarget;

    if (toolbar.scrollWidth <= toolbar.clientWidth) {
      return;
    }

    toolbarDragRef.current = {
      isDragging: true,
      didDrag: false,
      startX: event.clientX,
      scrollLeft: toolbar.scrollLeft,
    };
    toolbar.setPointerCapture(event.pointerId);
  }

  function handleToolbarPointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const toolbar = event.currentTarget;
    const drag = toolbarDragRef.current;

    if (!drag.isDragging) {
      return;
    }

    const deltaX = event.clientX - drag.startX;

    if (Math.abs(deltaX) > 4) {
      drag.didDrag = true;
    }

    if (drag.didDrag) {
      event.preventDefault();
      toolbar.scrollLeft = drag.scrollLeft - deltaX;
      updateToolbarScrollState();
    }
  }

  function handleToolbarPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const toolbar = event.currentTarget;

    toolbarDragRef.current.isDragging = false;

    if (toolbar.hasPointerCapture(event.pointerId)) {
      toolbar.releasePointerCapture(event.pointerId);
    }
  }

  function handleToolbarClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!toolbarDragRef.current.didDrag) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    toolbarDragRef.current.didDrag = false;
  }

  function resizeTitleField(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  const filteredSlashCommands = useMemo(() => {
    const query = slashMenu.query.toLowerCase().trim();

    if (!query) {
      return slashCommands;
    }

    return slashCommands.filter((command) => {
      const value = `${command.title} ${command.keywords}`.toLowerCase();

      return value.includes(query);
    });
  }, [slashMenu.query]);

  const updateSlashMenu = useCallback((currentEditor: Editor) => {
    const { selection } = currentEditor.state;
    const { $from, from } = selection;

    if (!selection.empty || !$from.parent.isTextblock) {
      setSlashMenu(emptySlashMenu);
      return;
    }

    const textBeforeCursor = $from.parent.textBetween(0, $from.parentOffset);
    const match = /(?:^|\s)\/([a-zA-Z0-9 ]*)$/.exec(textBeforeCursor);

    if (!match) {
      setSlashMenu(emptySlashMenu);
      return;
    }

    const query = match[1] ?? "";
    const slashLength = query.length + 1;
    const slashFrom = from - slashLength;
    const coords = currentEditor.view.coordsAtPos(from);
    const visibleCommandCount = slashCommands.filter((command) => {
      if (!query.trim()) {
        return true;
      }

      const value = `${command.title} ${command.keywords}`.toLowerCase();

      return value.includes(query.toLowerCase().trim());
    }).length;
    const menuHeight = Math.min(Math.max(visibleCommandCount, 1), 9) * 36 + 8;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const shouldOpenAbove = coords.bottom + menuHeight + 16 > viewportHeight;
    const top = shouldOpenAbove
      ? Math.max(16, coords.top - menuHeight - 8)
      : coords.bottom + 8;
    const left = Math.min(coords.left + 16, viewportWidth - 272);

    setSlashMenu((current) => ({
      open: true,
      query,
      from: slashFrom,
      to: from,
      top,
      left: Math.max(16, left),
      selectedIndex: Math.min(
        current.selectedIndex,
        Math.max(filteredSlashCommands.length - 1, 0)
      ),
    }));
  }, [filteredSlashCommands.length]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        heading: {
          levels: [2, 3, 4, 5],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "underline underline-offset-4",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "h-auto w-full rounded-md border object-contain",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      imageUploadNode,
      Placeholder.configure({
        placeholder: "Tulis konten post...",
      }),
      blockSelectionShortcut,
    ],
    content: initialEditorContent,
    editorProps: {
      attributes: {
        class:
          "min-h-full w-full max-w-none flex-1 px-6 pt-10 pb-24 text-base leading-7 outline-none [&>*]:m-0 [&>*:not(:first-child)]:mt-5 [&_.ProseMirror-selectednode]:outline-none [&_blockquote]:mt-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h2]:mt-8 [&_h2]:scroll-m-20 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-snug [&_h3]:mt-7 [&_h3]:scroll-m-20 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h4]:mt-6 [&_h4]:scroll-m-20 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:leading-snug [&_h5]:mt-5 [&_h5]:scroll-m-20 [&_h5]:text-base [&_h5]:font-semibold [&_h5]:leading-snug [&_img]:my-6 [&_img]:h-auto [&_img]:w-full [&_li]:mt-2 [&_li]:leading-7 [&_ol]:my-6 [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:leading-7 [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_ul[data-type=taskList]]:ml-0 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_ul]:my-6 [&_ul]:ml-6 [&_ul]:list-disc",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setHtmlDraft(currentEditor.getHTML());
      setActiveBlockType(getActiveBlockType(currentEditor));
      updateSlashMenu(currentEditor);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      setActiveBlockType(getActiveBlockType(currentEditor));
      updateSlashMenu(currentEditor);
    },
  });

  const generatedSlug = useMemo(() => {
    const value = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    return value || "judul-post";
  }, [title]);

  const permalink = slug || generatedSlug;

  const wordCount = useMemo(() => {
    if (!editor) {
      return 0;
    }

    return editor
      .getText()
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [editor, htmlDraft]);

  const selectedSlashIndex = Math.min(
    slashMenu.selectedIndex,
    Math.max(filteredSlashCommands.length - 1, 0)
  );

  const runSlashCommand = useCallback(
    (command: SlashCommand) => {
      if (!editor) {
        return;
      }

      command.run(editor, { from: slashMenu.from, to: slashMenu.to });
      setSlashMenu(emptySlashMenu);
    },
    [editor, slashMenu.from, slashMenu.to]
  );

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!slashMenu.open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSlashMenu((current) => ({
        ...current,
        selectedIndex:
          (selectedSlashIndex + 1) % Math.max(filteredSlashCommands.length, 1),
      }));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSlashMenu((current) => ({
        ...current,
        selectedIndex:
          (selectedSlashIndex - 1 + filteredSlashCommands.length) %
          Math.max(filteredSlashCommands.length, 1),
      }));
      return;
    }

    if (event.key === "Enter") {
      const command = filteredSlashCommands[selectedSlashIndex];

      if (command) {
        event.preventDefault();
        runSlashCommand(command);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSlashMenu(emptySlashMenu);
    }
  }

  function applyBlockType(value: string | null) {
    if (!editor || !value) {
      return;
    }

    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = Number(value.replace("heading-", "")) as 2 | 3 | 4 | 5;
    editor.chain().focus().setHeading({ level }).run();
  }

  function setToolbarLink() {
    if (!editor) {
      return;
    }

    if (!linkUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkMenu(emptyLinkMenu);
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinkMenu(emptyLinkMenu);
  }

  function insertImageUpload() {
    editor?.chain().focus().insertContent({ type: "imageUpload" }).run();
  }

  function openLinkMenu() {
    if (!editor) {
      return;
    }

    const { from, to } = editor.state.selection;
    const startCoords = editor.view.coordsAtPos(from);
    const endCoords = editor.view.coordsAtPos(to);
    const menuWidth = 320;
    const menuHeight = 132;
    const viewportWidth = window.innerWidth;
    const shouldOpenAbove = startCoords.top - menuHeight - 12 > 0;
    const top = shouldOpenAbove
      ? startCoords.top - menuHeight - 8
      : endCoords.bottom + 8;
    const centerLeft = (startCoords.left + endCoords.right) / 2 - menuWidth / 2;

    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkMenu({
      open: true,
      top: Math.max(16, top),
      left: Math.min(Math.max(16, centerLeft), viewportWidth - menuWidth - 16),
    });
  }

  function openLinkMenuAt(top: number, left: number) {
    if (!editor) {
      return;
    }

    const menuWidth = 320;
    const viewportWidth = window.innerWidth;

    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkMenu({
      open: true,
      top: Math.max(16, top),
      left: Math.min(Math.max(16, left), viewportWidth - menuWidth - 16),
    });
  }

  function handleEditorContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    if (!editor) {
      return;
    }

    event.preventDefault();
    setSlashMenu(emptySlashMenu);
    setLinkMenu(emptyLinkMenu);

    if (editor.state.selection.empty) {
      const position = editor.view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });

      if (position) {
        editor.chain().focus().setTextSelection(position.pos).run();
      }
    }

    const menuWidth = 256;
    const menuHeight = 448;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    setContextMenu({
      open: true,
      top: Math.min(event.clientY, viewportHeight - menuHeight - 16),
      left: Math.min(event.clientX, viewportWidth - menuWidth - 16),
    });
  }

  function runContextCommand(command: ContextCommand) {
    if (!editor) {
      return;
    }

    command.run(editor);
    setContextMenu(emptyContextMenu);
  }

  function updateSlug(value: string) {
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
    );
  }

  function updateFeaturedImage(file: File) {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setFeaturedImage(String(reader.result));
    };

    reader.readAsDataURL(file);
  }

  function updateSelectValue(setValue: (value: string) => void) {
    return (value: string | null) => {
      if (value) {
        setValue(value);
      }
    };
  }

  function submitPost(status: "draft" | "published") {
    startTransition(async () => {
      const result = await savePost({
        id: postId,
        title,
        slug: permalink,
        contentHtml: editor?.getHTML() ?? htmlDraft,
        excerpt,
        status,
        publishedAt: publishDate ? publishDate.toISOString() : null,
        featuredImage,
        author,
        category,
        tag,
        seoTitle,
        seoDescription,
        schemaType,
      });

      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSecondaryAction() {
    if (isEditMode) {
      router.push("/dashboard/post");
      return;
    }

    submitPost("draft");
  }

  return (
    <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
      <Sidebar
        collapsible="none"
        className="hidden h-screen w-80 border-r px-4 pt-8 pb-4 min-[1400px]:flex"
      >
        <SidebarContent>
          <SidebarGroup className="p-1">
            <SidebarGroupContent className="space-y-4 px-0">
              <div className="space-y-2">
                <Label htmlFor="title-tags">Title Tags</Label>
                <SidebarInput
                  id="title-tags"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder="Judul untuk search result"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  placeholder="Ringkasan untuk hasil pencarian"
                  className="min-h-24 resize-y bg-background"
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup className="p-1">
            <SidebarGroupContent className="space-y-4 px-0">
              <div className="space-y-2">
                <Label>Schema</Label>
                <Select
                  value={schemaType}
                  onValueChange={updateSelectValue(setSchemaType)}
                >
                  <SelectTrigger className="w-full bg-background shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="blog-posting">Blog Posting</SelectItem>
                    <SelectItem value="news-article">News Article</SelectItem>
                    <SelectItem value="how-to">How To</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonical-url">Canonical URL</Label>
                <SidebarInput
                  id="canonical-url"
                  value={`/${permalink}`}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Kata</Label>
                <div className="flex h-8 items-center rounded-md border bg-background px-2.5 text-sm">
                  {wordCount} kata
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-0 min-w-0 bg-muted/30">
        <div className="flex h-dvh min-h-0 flex-col gap-4 overflow-hidden p-4 pb-24 min-[1200px]:pb-4">
          <section className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 min-w-0 flex-col gap-4">
            <div className="z-30 grid flex-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-transparent p-1">
              <div className="flex items-center gap-2">
                <div className="min-[1400px]:hidden">
                  <Sheet>
                  <SheetTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-[1400px]:hidden"
                      >
                        <Search />
                        SEO
                      </Button>
                    }
                  />
                  <SheetContent side="left" className="w-80 overflow-y-auto p-4 pt-8">
                    <SheetHeader className="sr-only">
                      <SheetTitle>SEO</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile-title-tags">Title Tags</Label>
                        <SidebarInput
                          id="mobile-title-tags"
                          value={seoTitle}
                          onChange={(event) => setSeoTitle(event.target.value)}
                          placeholder="Judul untuk search result"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile-seo-description">
                          Meta Description
                        </Label>
                        <Textarea
                          id="mobile-seo-description"
                          value={seoDescription}
                          onChange={(event) =>
                            setSeoDescription(event.target.value)
                          }
                          placeholder="Ringkasan untuk hasil pencarian"
                          className="min-h-24 resize-y bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Schema</Label>
                        <Select
                          value={schemaType}
                          onValueChange={updateSelectValue(setSchemaType)}
                        >
                          <SelectTrigger className="w-full bg-background shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="blog-posting">
                              Blog Posting
                            </SelectItem>
                            <SelectItem value="news-article">
                              News Article
                            </SelectItem>
                            <SelectItem value="how-to">How To</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile-canonical-url">Canonical URL</Label>
                        <SidebarInput
                          id="mobile-canonical-url"
                          value={`/${permalink}`}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Jumlah Kata</Label>
                        <div className="flex h-8 items-center rounded-md border bg-background px-2.5 text-sm">
                          {wordCount} kata
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                  </Sheet>
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-center gap-1 min-[1200px]:grid-cols-[minmax(0,1fr)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="min-[1200px]:hidden"
                  onClick={() => scrollToolbar("left")}
                >
                  <ChevronLeft />
                </Button>
                <div className="min-w-0">
                  <div
                    ref={toolbarScrollRef}
                    className="min-w-0 overflow-x-auto touch-pan-x select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    onClickCapture={handleToolbarClickCapture}
                    onPointerCancel={handleToolbarPointerUp}
                    onPointerDown={handleToolbarPointerDown}
                    onPointerLeave={handleToolbarPointerUp}
                    onPointerMove={handleToolbarPointerMove}
                    onPointerUp={handleToolbarPointerUp}
                    onScroll={updateToolbarScrollState}
                    onWheel={handleToolbarWheel}
                  >
                    <div className="flex h-10 w-max items-center justify-start gap-1 px-1 lg:mx-auto">
              <ToolbarIconButton
                label="Undo"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().undo().run()}
              >
                <Undo2 />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Redo"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().redo().run()}
              >
                <Redo2 />
              </ToolbarIconButton>
              <Separator orientation="vertical" className="mx-1 h-7" />
            <Select value={activeBlockType} onValueChange={applyBlockType}>
                <SelectTrigger size="sm" className="w-32 shadow-none">
                  <SelectValue>{blockTypeLabels[activeBlockType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraph">Paragraph</SelectItem>
                  <SelectItem value="heading-2">Heading 2</SelectItem>
                  <SelectItem value="heading-3">Heading 3</SelectItem>
                  <SelectItem value="heading-4">Heading 4</SelectItem>
                  <SelectItem value="heading-5">Heading 5</SelectItem>
                </SelectContent>
              </Select>
              <Separator orientation="vertical" className="mx-1 h-7" />
              <ToolbarIconButton
                label="Bulleted List"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <List />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Numbered List"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Code Block"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              >
                <Code2 />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Inline Code"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleCode().run()}
              >
                <Code />
              </ToolbarIconButton>
              <Separator orientation="vertical" className="mx-1 h-7" />
              <ToolbarIconButton
                label="Bold"
                type="button"
                variant={editor?.isActive("bold") ? "secondary" : "ghost"}
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <Bold />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Italic"
                type="button"
                variant={editor?.isActive("italic") ? "secondary" : "ghost"}
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <Italic />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Underline"
                type="button"
                variant={editor?.isActive("underline") ? "secondary" : "ghost"}
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Strikethrough"
                type="button"
                variant={editor?.isActive("strike") ? "secondary" : "ghost"}
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
              >
                <Strikethrough />
              </ToolbarIconButton>
              <Button
                type="button"
                variant={editor?.isActive("link") ? "secondary" : "ghost"}
                size="sm"
                disabled={!editor}
                onClick={openLinkMenu}
              >
                <LinkIcon />
                Link
              </Button>
              <Separator orientation="vertical" className="mx-1 h-7" />
              <ToolbarIconButton
                label="Align Left"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              >
                <AlignLeft />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Align Center"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() =>
                  editor?.chain().focus().setTextAlign("center").run()
                }
              >
                <AlignCenter />
              </ToolbarIconButton>
              <ToolbarIconButton
                label="Align Right"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              >
                <AlignRight />
              </ToolbarIconButton>
              <Separator orientation="vertical" className="mx-1 h-7" />
              <ToolbarIconButton
                label="Insert Image"
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!editor}
                onClick={insertImageUpload}
              >
                <ImageIcon />
              </ToolbarIconButton>
                    </div>
                  </div>
                  <div className="mx-1 mt-1 h-1 rounded-full bg-border min-[1200px]:hidden">
                    <div
                      className="h-full w-1/3 rounded-full bg-muted-foreground transition-transform"
                      style={{
                        transform: `translateX(${toolbarScrollProgress * 200}%)`,
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="min-[1200px]:hidden"
                  onClick={() => scrollToolbar("right")}
                >
                  <ChevronRight />
                </Button>
              </div>
              <div className="hidden items-center gap-2 min-[1200px]:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={handleSecondaryAction}
                >
                  {isEditMode ? <ChevronLeft /> : <Save />}
                  {isEditMode ? "Kembali" : "Simpan Draft"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={() => submitPost("published")}
                >
                  <Send />
                  {isPending ? "Menyimpan..." : publishActionLabel}
                </Button>
              </div>
              <div className="min-[1200px]:hidden">
                <Sheet>
                <SheetTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-[1200px]:hidden"
                    >
                      <Settings />
                      Details
                    </Button>
                  }
                />
                <SheetContent side="right" className="w-80 overflow-y-auto p-4 pt-8">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Post Settings</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile-featured-image">
                        Featured Image
                      </Label>
                      <button
                        id="mobile-featured-image"
                        type="button"
                        className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-dashed bg-background text-sm text-muted-foreground"
                        onClick={() => featuredImageInputRef.current?.click()}
                      >
                        {featuredImage ? (
                          <img
                            src={featuredImage}
                            alt="Featured image"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center gap-2">
                            <ImageIcon className="size-4" />
                            Upload image
                          </span>
                        )}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-post-excerpt">Excerpt</Label>
                      <Textarea
                        id="mobile-post-excerpt"
                        value={excerpt}
                        onChange={(event) => setExcerpt(event.target.value)}
                        placeholder="Ringkasan singkat untuk post ini"
                        className="min-h-24 resize-y bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-post-date">Date</Label>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              id="mobile-post-date"
                              type="button"
                              variant="outline"
                              className="w-full justify-start bg-background font-normal"
                            >
                              <CalendarIcon className="size-4" />
                              {publishDate
                                ? publishDate.toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "Pilih tanggal"}
                            </Button>
                          }
                        />
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={publishDate}
                            onSelect={setPublishDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-post-slug">Slug</Label>
                      <SidebarInput
                        id="mobile-post-slug"
                        value={permalink}
                        onChange={(event) => updateSlug(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Penulis</Label>
                      <Select
                        value={author}
                        onValueChange={updateSelectValue(setAuthor)}
                      >
                        <SelectTrigger className="w-full bg-background shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="author">Author</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Select
                        value={category}
                        onValueChange={updateSelectValue(setCategory)}
                      >
                        <SelectTrigger className="w-full bg-background shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized">
                            Uncategorized
                          </SelectItem>
                          <SelectItem value="news">News</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tag</Label>
                      <Select
                        value={tag}
                        onValueChange={updateSelectValue(setTag)}
                      >
                        <SelectTrigger className="w-full bg-background shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blog">Blog</SelectItem>
                          <SelectItem value="news">News</SelectItem>
                          <SelectItem value="release">Release</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
                </Sheet>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full">
              <Card className="flex min-h-full border border-border py-0 shadow-none ring-0">
                <CardContent className="flex min-h-full w-full flex-col p-0">
                  <div
                    className="flex min-h-full flex-1 flex-col"
                    onContextMenu={handleEditorContextMenu}
                    onKeyDownCapture={handleEditorKeyDown}
                  >
                    <div className="mt-10 px-6">
                      <Textarea
                        ref={titleInputRef}
                        value={title}
                        onChange={(event) => {
                          setTitle(event.target.value);
                          resizeTitleField(event.currentTarget);
                        }}
                        placeholder={titlePlaceholder}
                        rows={1}
                        onInput={(event) =>
                          resizeTitleField(event.currentTarget)
                        }
                        className="h-auto min-h-12 resize-none overflow-hidden break-words border-0 bg-transparent px-0 py-0 !text-[32px] font-bold leading-tight shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <EditorContent
                      className="min-h-[calc(100dvh-13rem)] flex-1 min-[1200px]:min-h-[calc(100dvh-10rem)]"
                      editor={editor}
                    />
                  </div>

                  {slashMenu.open ? (
                    <div
                      className="fixed z-50 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                      style={{
                        top: slashMenu.top,
                        left: slashMenu.left,
                      }}
                    >
                      {filteredSlashCommands.length > 0 ? (
                        filteredSlashCommands.map((command, index) => (
                          <button
                            key={command.title}
                            type="button"
                            className="flex h-9 w-full items-center gap-3 rounded-sm px-3 text-left text-sm hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                            data-active={index === selectedSlashIndex}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              runSlashCommand(command);
                            }}
                          >
                            <span className="flex size-4 items-center justify-center text-muted-foreground">
                              {command.icon}
                            </span>
                            <span className="font-medium">{command.title}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No blocks found
                        </div>
                      )}
                    </div>
                  ) : null}

                  {contextMenu.open ? (
                    <div
                      className="fixed z-50 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                      style={{
                        top: contextMenu.top,
                        left: contextMenu.left,
                      }}
                    >
                      {contextCommands.map((command) => (
                        <button
                          key={command.title}
                          type="button"
                          className="flex h-9 w-full items-center gap-3 rounded-sm px-3 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            runContextCommand(command);
                          }}
                        >
                          <span className="flex size-4 items-center justify-center text-muted-foreground">
                            {command.icon}
                          </span>
                          <span className="font-medium">{command.title}</span>
                        </button>
                      ))}
                      <div className="my-1 h-px bg-border" />
                      <button
                        type="button"
                        className="flex h-9 w-full items-center gap-3 rounded-sm px-3 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          openLinkMenuAt(contextMenu.top, contextMenu.left);
                          setContextMenu(emptyContextMenu);
                        }}
                      >
                        <span className="flex size-4 items-center justify-center text-muted-foreground">
                          <LinkIcon className="size-4" />
                        </span>
                        <span className="font-medium">Link</span>
                      </button>
                    </div>
                  ) : null}

                  {linkMenu.open ? (
                    <div
                      className="fixed z-50 w-80 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
                      style={{
                        top: linkMenu.top,
                        left: linkMenu.left,
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="floating-link-url">URL Link</Label>
                        <Input
                          id="floating-link-url"
                          value={linkUrl}
                          autoFocus
                          onChange={(event) => setLinkUrl(event.target.value)}
                          placeholder="https://example.com"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              setToolbarLink();
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              setLinkMenu(emptyLinkMenu);
                            }
                          }}
                        />
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLinkUrl("");
                            editor
                              ?.chain()
                              .focus()
                              .extendMarkRange("link")
                              .unsetLink()
                              .run();
                            setLinkMenu(emptyLinkMenu);
                          }}
                        >
                          Remove
                        </Button>
                        <Button type="button" size="sm" onClick={setToolbarLink}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </ScrollArea>
          </section>
        </div>
      </SidebarInset>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 min-[1200px]:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={handleSecondaryAction}
          >
            {isEditMode ? <ChevronLeft /> : <Save />}
            {isEditMode ? "Kembali" : "Simpan Draft"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={() => submitPost("published")}
          >
            <Send />
            {isPending ? "Menyimpan..." : publishActionLabel}
          </Button>
        </div>
      </div>

      <Sidebar
        side="right"
        collapsible="none"
        className="hidden h-screen w-80 border-l px-4 pt-8 pb-4 min-[1200px]:flex"
      >
        <SidebarContent>
          <SidebarGroup className="p-1">
            <SidebarGroupContent className="space-y-2 px-0">
              <Label htmlFor="featured-image">Featured Image</Label>
              <button
                id="featured-image"
                type="button"
                className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-dashed bg-background text-sm text-muted-foreground"
                onClick={() => featuredImageInputRef.current?.click()}
              >
                {featuredImage ? (
                  <img
                    src={featuredImage}
                    alt="Featured image"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    <ImageIcon className="size-4" />
                    Upload image
                  </span>
                )}
              </button>
              <input
                ref={featuredImageInputRef}
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    updateFeaturedImage(file);
                  }
                }}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup className="p-1">
            <SidebarGroupContent className="space-y-4 px-0">
              <div className="space-y-2">
                <Label htmlFor="post-excerpt">Excerpt</Label>
                <Textarea
                  id="post-excerpt"
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="Ringkasan singkat untuk post ini"
                  className="min-h-24 resize-y bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-date">Date</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id="post-date"
                        type="button"
                        variant="outline"
                        className="w-full justify-start bg-background font-normal"
                      >
                        <CalendarIcon className="size-4" />
                        {publishDate
                          ? publishDate.toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "Pilih tanggal"}
                      </Button>
                    }
                  />
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={publishDate}
                      onSelect={setPublishDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-slug">Slug</Label>
                <SidebarInput
                  id="post-slug"
                  value={permalink}
                  onChange={(event) => updateSlug(event.target.value)}
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup className="p-1">
            <SidebarGroupContent className="space-y-4 px-0">
              <div className="space-y-2">
                <Label>Penulis</Label>
                <Select
                  value={author}
                  onValueChange={updateSelectValue(setAuthor)}
                >
                  <SelectTrigger className="w-full bg-background shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={category}
                  onValueChange={updateSelectValue(setCategory)}
                >
                  <SelectTrigger className="w-full bg-background shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tag</Label>
                <Select value={tag} onValueChange={updateSelectValue(setTag)}>
                  <SelectTrigger className="w-full bg-background shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="release">Release</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
