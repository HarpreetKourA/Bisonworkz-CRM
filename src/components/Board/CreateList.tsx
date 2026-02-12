'use client'

import { useState } from 'react'
import { createList } from '@/app/boards/actions'
import styles from './List.module.css' // Reuse basic styles or create specific ones

export default function CreateList({ boardId }: { boardId: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
            await createList(boardId, title)
            setTitle('')
            setIsEditing(false)
        } catch (error) {
            console.error(error)
            alert('Failed to create list')
        }
    }

    if (!isEditing) {
        return (
            <div className={styles.listWrapper}>
                <button
                    onClick={() => setIsEditing(true)}
                    style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'left',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        transition: 'background 0.2s'
                    }}
                >
                    + Add another list
                </button>
            </div>
        )
    }

    return (
        <div className={styles.listWrapper}>
            <div className={styles.listContent} style={{ padding: '8px' }}>
                <form onSubmit={handleSubmit}>
                    <input
                        autoFocus
                        placeholder="Enter list title..."
                        className="input"
                        style={{ marginBottom: '8px', background: 'white' }}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button type="submit" className="btn btn-primary btn-sm">Add List</button>
                        <button
                            type="button"
                            className="btn btn-sm"
                            style={{ background: 'transparent', color: '#44546f' }}
                            onClick={() => setIsEditing(false)}
                        >
                            ✕
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
