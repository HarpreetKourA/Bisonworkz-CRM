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
            <div className={styles.commentsSectionHeader}>
                <MessageSquare size={18} className={styles.icon} />
                <h3 className={styles.sectionTitle}>Comments</h3>
            </div>

            <div className={styles.commentInputWrap}>
                <input
                    type="text"
                    className={styles.commentInput}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                />
                <button
                    className={styles.commentSendBtn}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !newComment.trim()}
                >
                    <Send size={16} />
                </button>
            </div>

            {error && (
                <div style={{ color: '#dc2626', fontSize: '0.8125rem', padding: '4px 8px', background: '#fee2e2', borderRadius: '6px' }}>
                    ⚠️ {error}
                </div>
            )}

            <div className={styles.commentsList}>
                {comments.map(comment => (
                    <div key={comment.id} className={styles.commentItem}>
                        <div className={styles.commentAvatar}>
                            {(comment.full_name || comment.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.commentBody}>
                            <div className={styles.commentMeta}>
                                <strong>{comment.full_name || comment.email || 'User'}</strong>
                                <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
                            </div>
                            <p className={styles.commentContent}>{comment.content}</p>
                        </div>
                        <div className={styles.commentActions}>
                            <button
                                className={styles.commentDeleteBtn}
                                onClick={() => handleDelete(comment.id)}
                                title="Delete comment"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <p className={styles.noComments}>No comments yet.</p>
                )}
            </div>
        </div>
    )
}
