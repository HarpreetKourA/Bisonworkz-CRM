'use client'

import { useState } from 'react'
import { createCard } from '@/app/boards/actions'
import styles from './List.module.css'

export default function CreateCard({ listId, boardId }: { listId: string, boardId: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
            await createCard(listId, boardId, title)
            setTitle('')
            setIsEditing(false)
        } catch (error) {
            console.error(error)
            alert('Failed to create card')
        }
    }

    if (!isEditing) {
        return (
            <button className={styles.addCardBtn} onClick={() => setIsEditing(true)}>
                <span>+ Add a card</span>
            </button>
        )
    }

    return (
        <div style={{ padding: '0 4px 8px 4px' }}>
            <form onSubmit={handleSubmit}>
                <textarea
                    autoFocus
                    placeholder="Enter a title for this card..."
                    className="input"
                    style={{
                        marginBottom: '8px',
                        background: 'white',
                        color: 'black',
                        resize: 'none',
                        height: '60px',
                        padding: '8px 12px',
                        display: 'block',
                        width: '100%'
                    }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit(e)
                        }
                    }}
                />
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button type="submit" className="btn btn-primary btn-sm">Add Card</button>
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
    )
}
