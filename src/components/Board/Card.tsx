'use client'

import React, { useState } from 'react'
import styles from './Card.module.css'
import CardModal from './CardModal'

interface CardProps {
    id: string
    title: string
    description?: string
    listId: string
    boardId: string
    expense_summary?: number
    expense_credits?: number
}

export default function Card({ id, title, description, expense_summary, expense_credits, listId, boardId }: CardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <div
                className={styles.card}
                onClick={() => setIsModalOpen(true)}
            >
                <div style={{ marginBottom: 4 }}>{title}</div>
                {((expense_summary !== undefined && expense_summary !== 0) || true) && (
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#5e6c84', flexWrap: 'wrap' }}>
                        {expense_summary !== undefined && expense_summary !== 0 && (
                            <span style={{
                                backgroundColor: expense_summary > 0 ? '#e6fffa' : '#fff5f5',
                                color: expense_summary > 0 ? '#006644' : '#c53030',
                                padding: '2px 4px',
                                borderRadius: 3,
                                fontWeight: 600
                            }}>
                                {expense_summary > 0 ? '+' : '-'} ₹ {Math.abs(expense_summary).toLocaleString()}
                            </span>
                        )}
                        <span style={{
                            backgroundColor: '#ebecf0',
                            color: '#172b4d',
                            padding: '2px 4px',
                            borderRadius: 3,
                            fontWeight: 500
                        }}>
                            Value: ₹ {(expense_credits || 0).toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <CardModal
                    cardId={id}
                    boardId={boardId}
                    listId={listId}
                    initialTitle={title}
                    initialDescription={description}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
