'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import styles from './RichTextEditor.module.css'
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
    //    Link as LinkIcon, Image as ImageIcon,
    Heading1, Heading2, Quote, Code, Undo, Redo
} from 'lucide-react'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
    placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null
    }

    return (
        <div className={styles.toolbar}>
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.isActive : ''}`}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.isActive : ''}`}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`${styles.toolbarButton} ${editor.isActive('underline') ? styles.isActive : ''}`}
                title="Underline"
            >
                <UnderlineIcon size={16} />
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 1 }) ? styles.isActive : ''}`}
                title="Heading 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 2 }) ? styles.isActive : ''}`}
                title="Heading 2"
            >
                <Heading2 size={16} />
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.isActive : ''}`}
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.isActive : ''}`}
                title="Ordered List"
            >
                <ListOrdered size={16} />
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`${styles.toolbarButton} ${editor.isActive('blockquote') ? styles.isActive : ''}`}
                title="Quote"
            >
                <Quote size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`${styles.toolbarButton} ${editor.isActive('codeBlock') ? styles.isActive : ''}`}
                title="Code Block"
            >
                <Code size={16} />
            </button>

            <div style={{ flex: 1 }} />

            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className={styles.toolbarButton}
                title="Undo"
            >
                <Undo size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className={styles.toolbarButton}
                title="Redo"
            >
                <Redo size={16} />
            </button>
        </div>
    )
}

export default function RichTextEditor({ content, onChange, editable = true, placeholder = 'Add a more detailed description...' }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Underline,
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: styles.editorContent,
            },
        },
    })

    // Update content if props change (e.g. initial load or external update)
    // Be careful with loops here. Only update if content is significantly different?
    // Usually better to control this differently, but for now:
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Avoid resetting cursor if possible, but hard to do perfectly
            // For description field, usually fine as it's not real-time collaborative in this implementations
            if (editor.getText() === '' && content) {
                editor.commands.setContent(content)
            }
        }
    }, [content, editor])

    React.useEffect(() => {
        if (editor) {
            editor.setEditable(editable)
        }
    }, [editable, editor])

    if (!editor) {
        return null
    }

    return (
        <div className={styles.editorWrapper}>
            {editable && <MenuBar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    )
}
