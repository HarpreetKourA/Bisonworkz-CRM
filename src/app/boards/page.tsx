'use client'

import { useEffect, useState } from 'react'
import { createBoard, getBoards, deleteBoard } from './actions'
import styles from './page.module.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Board {
    id: string
    title: string
    background: string
    created_at: string
}

export default function BoardsPage() {
    const [boards, setBoards] = useState<Board[]>([])
    const [isInternalLoading, setIsInternalLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedColor, setSelectedColor] = useState('linear-gradient(135deg, #0079bf, #5067c5)')

    const colors = [
        'linear-gradient(135deg, #0079bf, #5067c5)', // Blue
        'linear-gradient(135deg, #d29034, #ffb347)', // Orange
        'linear-gradient(135deg, #519839, #89c059)', // Green
        'linear-gradient(135deg, #b04632, #d25a46)', // Red
        'linear-gradient(135deg, #89609e, #a881bd)', // Purple
        'linear-gradient(135deg, #cd5a91, #e97eb1)', // Pink
    ]

    useEffect(() => {
        async function fetchBoards() {
            try {
                const data = await getBoards()
                setBoards(data)
            } catch (error) {
                console.error(error)
            } finally {
                setIsInternalLoading(false)
            }
        }
        fetchBoards()
    }, [])

    async function handleDeleteBoard(e: React.MouseEvent, boardId: string, title: string) {
        e.preventDefault() // Prevent link navigation
        if (!confirm(`Are you sure you want to delete board "${title}"? This cannot be undone.`)) return

        try {
            await deleteBoard(boardId)
            // Optimistic update
            setBoards(prev => prev.filter(b => b.id !== boardId))
        } catch (error) {
            alert('Failed to delete board')
            console.error(error)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    Your Workspaces
                </h1>
            </div>

            <div className={styles.grid}>
                {/* Create New Board Button */}
                <button className={styles.newBoardButton} onClick={() => setIsModalOpen(true)}>
                    <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</span>
                    <span>Create New Board</span>
                </button>

                {/* Loading Skeletons or Board List */}
                {isInternalLoading ? (
                    <>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius)' }} />
                        ))}
                    </>
                ) : (
                    boards.map((board) => (
                        <div key={board.id} className={styles.boardCardWrapper} style={{ position: 'relative' }}>
                            <Link
                                href={`/boards/${board.id}`}
                                className={styles.boardCard}
                                style={{ background: board.background }}
                            >
                                <span>{board.title}</span>
                            </Link>
                            <button
                                className={styles.deleteBoardBtn}
                                onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                                title="Delete Board"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Create Board Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => {
                    if (e.target === e.currentTarget) setIsModalOpen(false)
                }}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.modalTitle}>Create Board</h2>
                        <form action={createBoard}>
                            <div className="group">
                                <label className="label">Board Title</label>
                                <input
                                    name="title"
                                    className="input"
                                    placeholder="e.g., Project Launch"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="group">
                                <label className="label">Background</label>
                                <input type="hidden" name="background" value={selectedColor} />
                                <div className={styles.colorPicker}>
                                    {colors.map((color) => (
                                        <div
                                            key={color}
                                            className={`${styles.colorOption} ${selectedColor === color ? styles.selected : ''}`}
                                            style={{ background: color }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
