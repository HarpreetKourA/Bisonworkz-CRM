'use client'

import React, { useState } from 'react'
import styles from './Card.module.css'
import CardModal from './CardModal'
import { Calendar } from 'lucide-react'

interface LabelData {
    id: string
    color: string
    text?: string
}

interface CardProps {
    id: string
    title: string
    description?: string
    listId: string
    boardId: string
    expense_summary?: number
    expense_credits?: number
    due_date?: string
    labels?: LabelData[]
}

function getDueDateStatus(dueDateStr: string): 'overdue' | 'today' | 'upcoming' | 'none' {
    if (!dueDateStr) return 'none'
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const due = new Date(dueDateStr)
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

    if (dueDay < today) return 'overdue'
    if (dueDay.getTime() === today.getTime()) return 'today'
    return 'upcoming'
}

export default function Card({ id, title, description, expense_summary, expense_credits, due_date, labels, listId, boardId }: CardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const dueStatus = due_date ? getDueDateStatus(due_date) : 'none'

    return (
        <>
            <div
                className={styles.card}
                onClick={() => setIsModalOpen(true)}
            >
                {/* Label color strips */}
                {labels && labels.length > 0 && (
                    <div className={styles.labelStrips}>
                        {labels.map(label => (
                            <div
                                key={label.id}
                                className={styles.labelStrip}
                                style={{ backgroundColor: label.color }}
                                title={label.text || ''}
                            />
                        ))}
                    </div>
                )}

                <div className={styles.cardTitle}>{title}</div>

                <div className={styles.cardMeta}>
                    {/* Due date badge */}
                    {due_date && (
                        <span className={`${styles.dueBadge} ${styles[dueStatus]}`}>
                            <Calendar size={12} />
                            {new Date(due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    )}

                    {/* Expense summary */}
                    {expense_summary !== undefined && expense_summary !== 0 && (
                        <span className={expense_summary > 0 ? styles.creditBadge : styles.debitBadge}>
                            {expense_summary > 0 ? '+' : '-'} ₹{Math.abs(expense_summary).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CardModal
                    cardId={id}
                    boardId={boardId}
                    listId={listId}
                    initialTitle={title}
                    initialDescription={description}
                    initialDueDate={due_date}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
