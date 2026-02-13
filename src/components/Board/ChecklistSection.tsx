'use client'

import React, { useState } from 'react'
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from '@/app/boards/actions'
import { ChecklistItemType } from '@/types/card-features'
import { CheckSquare, Plus, Trash2 } from 'lucide-react'
import styles from './CardModal.module.css'

interface ChecklistSectionProps {
    cardId: string
    boardId: string
    initialItems: ChecklistItemType[]
}

export default function ChecklistSection({ cardId, boardId, initialItems }: ChecklistSectionProps) {
    const [items, setItems] = useState<ChecklistItemType[]>(initialItems)
    const [newItemText, setNewItemText] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    const checkedCount = items.filter(i => i.is_checked).length
    const totalCount = items.length
    const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

    const handleAdd = async () => {
        if (!newItemText.trim()) return
        try {
            await addChecklistItem(cardId, boardId, newItemText.trim())
            setItems([...items, {
                id: crypto.randomUUID(),
                card_id: cardId,
                text: newItemText.trim(),
                is_checked: false,
                position: items.length,
                created_at: new Date().toISOString()
            }])
            setNewItemText('')
        } catch (error) {
            console.error('Failed to add checklist item', error)
        }
    }

    const handleToggle = async (item: ChecklistItemType) => {
        const newChecked = !item.is_checked
        setItems(items.map(i => i.id === item.id ? { ...i, is_checked: newChecked } : i))
        try {
            await toggleChecklistItem(item.id, boardId, newChecked)
        } catch (error) {
            console.error('Failed to toggle checklist item', error)
            setItems(items.map(i => i.id === item.id ? { ...i, is_checked: item.is_checked } : i))
        }
    }

    const handleDelete = async (itemId: string) => {
        setItems(items.filter(i => i.id !== itemId))
        try {
            await deleteChecklistItem(itemId, boardId)
        } catch (error) {
            console.error('Failed to delete checklist item', error)
        }
    }

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <CheckSquare size={20} className={styles.icon} />
                <h3 className={styles.sectionTitle}>Checklist</h3>
            </div>

            {totalCount > 0 && (
                <div className={styles.checklistProgress}>
                    <span className={styles.checklistPercent}>{percentage}%</span>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${percentage}%`,
                                background: percentage === 100 ? 'var(--success)' : 'var(--primary)'
                            }}
                        />
                    </div>
                </div>
            )}

            <div className={styles.checklistItems}>
                {items.map(item => (
                    <div key={item.id} className={styles.checklistItem}>
                        <input
                            type="checkbox"
                            checked={item.is_checked}
                            onChange={() => handleToggle(item)}
                            className={styles.checkbox}
                        />
                        <span className={`${styles.checklistText} ${item.is_checked ? styles.checkedText : ''}`}>
                            {item.text}
                        </span>
                        <button
                            className={styles.checklistDeleteBtn}
                            onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <div className={styles.checklistAddForm}>
                    <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Add an item"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                        autoFocus
                    />
                    <div className={styles.checklistAddActions}>
                        <button className={styles.saveButton} onClick={handleAdd}>Add</button>
                        <button className={styles.cancelButton} onClick={() => { setIsAdding(false); setNewItemText('') }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <button className={styles.addItemBtn} onClick={() => setIsAdding(true)}>
                    <Plus size={16} /> Add an item
                </button>
            )}
        </div>
    )
}
