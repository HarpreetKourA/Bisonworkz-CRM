'use client'

import React, { useState, useEffect } from 'react'
import { addComment, deleteComment } from '@/app/boards/actions'
import { CommentType } from '@/types/card-features'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import styles from './CardModal.module.css'

interface CommentsSectionProps {
    cardId: string
    boardId: string
    initialComments: CommentType[]
}

export default function CommentsSection({ cardId, boardId, initialComments }: CommentsSectionProps) {
    const [comments, setComments] = useState<CommentType[]>(initialComments)
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Sync when parent fetches new data (useState only initializes once)
    useEffect(() => {
        setComments(initialComments)
    }, [initialComments])

    const handleSubmit = async () => {
        if (!newComment.trim() || isSubmitting) return
        setIsSubmitting(true)
        setError('')
        try {
            const saved = await addComment(cardId, boardId, newComment.trim())
            setComments([saved, ...comments])
            setNewComment('')
        } catch (err: any) {
            console.error('Failed to add comment', err)
            setError(err?.message || 'Failed to save comment.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        setComments(comments.filter(c => c.id !== commentId))
        try {
            await deleteComment(commentId, boardId)
        } catch (err: any) {
            console.error('Failed to delete comment', err)
        }
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        })
    }

    return (
        <div className={styles.commentsSection}>
            <div className={styles.sectionHeader} style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MessageSquare size={20} className={styles.icon} />
                    <h3 className={styles.sectionTitle}>Comments and activity</h3>
                </div>
                <button className={styles.sidebarButton} style={{ width: 'auto', fontSize: 13, padding: '4px 8px', height: 'auto' }}>
                    Show details
                </button>
            </div>

            <div className={styles.commentInputWrapper}>
                <div className={styles.currentUserAvatar}>
                    B
                </div>
                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        className={styles.commentInput}
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                    />
                    <button
                        className={styles.commentSubmitBtn}
                        onClick={handleSubmit}
                        disabled={!newComment.trim()}
                    >
                        Save
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ color: '#dc2626', fontSize: '13px', padding: '8px', background: '#fee2e2', borderRadius: '4px', marginBottom: 12 }}>
                    ⚠️ {error}
                </div>
            )}

            <div className={styles.commentsList}>
                {comments.map(comment => (
                    <div key={comment.id} className={styles.commentItem}>
                        <div className={styles.commentAvatar}>
                            {(comment.full_name || comment.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.commentContentWrapper}>
                            <div className={styles.commentHeader}>
                                <span className={styles.commentAuthor}>{comment.full_name || comment.email || 'BisonWorkz'}</span>
                                <span className={styles.commentAction}> added a comment </span>
                                <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
                            </div>
                            <div className={styles.commentBubble}>
                                {comment.content}
                            </div>
                            <div className={styles.commentFooter}>
                                <button className={styles.commentLink}>Reply</button>
                                <button className={styles.commentLink} onClick={() => handleDelete(comment.id)}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <p className={styles.noComments} style={{ marginLeft: 40 }}>No activity recorded yet.</p>
                )}
            </div>
        </div>
    )
}
