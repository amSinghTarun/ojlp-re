"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Image from "@tiptap/extension-image"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LinkIcon,
  Undo,
  Redo,
  ImageIcon,
} from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageSelector } from "./image-selector"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onImageInsert?: (url: string) => void
}

export function RichTextEditor({ value, onChange, onImageInsert }: RichTextEditorProps) {
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const handleImageSelect = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: "Article image" }).run()
      setIsImageSelectorOpen(false)
      if (onImageInsert) {
        onImageInsert(url)
      }
    }
  }

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 border-b p-2">
        <ToggleGroup type="multiple" className="flex flex-wrap">
          <ToggleGroupItem
            value="bold"
            aria-label="Toggle bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-state={editor.isActive("bold") ? "on" : "off"}
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Toggle italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-state={editor.isActive("italic") ? "on" : "off"}
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            aria-label="Toggle underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            data-state={editor.isActive("underline") ? "on" : "off"}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="strike"
            aria-label="Toggle strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            data-state={editor.isActive("strike") ? "on" : "off"}
          >
            <Strikethrough className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <span className="w-px h-6 bg-border mx-1" />

        <ToggleGroup type="single" className="flex flex-wrap">
          <ToggleGroupItem
            value="h1"
            aria-label="Heading 1"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            data-state={editor.isActive("heading", { level: 1 }) ? "on" : "off"}
          >
            <Heading1 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="h2"
            aria-label="Heading 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            data-state={editor.isActive("heading", { level: 2 }) ? "on" : "off"}
          >
            <Heading2 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="h3"
            aria-label="Heading 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            data-state={editor.isActive("heading", { level: 3 }) ? "on" : "off"}
          >
            <Heading3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <span className="w-px h-6 bg-border mx-1" />

        <ToggleGroup type="single" className="flex flex-wrap">
          <ToggleGroupItem
            value="left"
            aria-label="Align left"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            data-state={editor.isActive({ textAlign: "left" }) ? "on" : "off"}
          >
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="center"
            aria-label="Align center"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            data-state={editor.isActive({ textAlign: "center" }) ? "on" : "off"}
          >
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="right"
            aria-label="Align right"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            data-state={editor.isActive({ textAlign: "right" }) ? "on" : "off"}
          >
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <span className="w-px h-6 bg-border mx-1" />

        <ToggleGroup type="multiple" className="flex flex-wrap">
          <ToggleGroupItem
            value="bulletList"
            aria-label="Bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-state={editor.isActive("bulletList") ? "on" : "off"}
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="orderedList"
            aria-label="Ordered list"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-state={editor.isActive("orderedList") ? "on" : "off"}
          >
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <span className="w-px h-6 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={editor.isActive("link") ? "bg-accent" : ""}>
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  defaultValue={editor.getAttributes("link").href || ""}
                  placeholder="https://example.com"
                />
              </div>
              <Button onClick={setLink}>{editor.isActive("link") ? "Update Link" : "Add Link"}</Button>
            </div>
          </PopoverContent>
        </Popover>

        <Dialog open={isImageSelectorOpen} onOpenChange={setIsImageSelectorOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px]">
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
            </DialogHeader>
            <ImageSelector onSelect={handleImageSelect} />
          </DialogContent>
        </Dialog>

        <span className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="prose prose-slate dark:prose-invert max-w-none p-4" />
    </div>
  )
}
