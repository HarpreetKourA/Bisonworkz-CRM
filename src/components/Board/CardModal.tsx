'use client'

import React, { useState, useEffect } from 'react'
import {
    updateCard, deleteCard, getExpenses, createExpense, deleteExpense, updateExpense,
    getLabels, addLabel, removeLabel,
    getChecklist,
    getCardMembers, getBoardMembers, addCardMember, removeCardMember,
    getComments
} from '@/app/boards/actions'
import styles from './CardModal.module.css'
import {
    AlignLeft, Trash2, X, CreditCard, Plus, Calendar, Edit2, Save, XCircle,
    Tag, CheckSquare, Users, Clock
} from 'lucide-react'
import { ExpenseType } from '@/types/expense'
import { LabelType, ChecklistItemType, CardMemberType, CommentType } from '@/types/card-features'
import ChecklistSection from './ChecklistSection'
import CommentsSection from './CommentsSection'

interface CardModalProps {
    cardId: string
    boardId: string
    listId: string
    initialTitle: string
    initialDescription?: string
    initialDueDate?: string
    onClose: () => void
}

const LABEL_COLORS = [
    { color: '#61bd4f', name: 'Green' },
    { color: '#f2d600', name: 'Yellow' },
    { color: '#ff9f1a', name: 'Orange' },
    { color: '#eb5a46', name: 'Red' },
    { color: '#c377e0', name: 'Purple' },
    { color: '#0079bf', name: 'Blue' },
    { color: '#00c2e0', name: 'Teal' },
    { color: '#ff78cb', name: 'Pink' },
    { color: '#344563', name: 'Dark' },
    { color: '#b3bac5', name: 'Gray' },
]

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

export default function CardModal({
    cardId, boardId, listId, initialTitle, initialDescription, initialDueDate, onClose
}: CardModalProps) {
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription || '')
    const [isEditingDesc, setIsEditingDesc] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Due date
    const [dueDate, setDueDate] = useState(initialDueDate || '')
    const [showDatePicker, setShowDatePicker] = useState(false)

    // Labels
    const [labels, setLabels] = useState<LabelType[]>([])
    const [showLabelPicker, setShowLabelPicker] = useState(false)
    const [labelText, setLabelText] = useState('')
    const [selectedLabelColor, setSelectedLabelColor] = useState(LABEL_COLORS[0].color)

    // Checklist
    const [checklistItems, setChecklistItems] = useState<ChecklistItemType[]>([])
    const [showChecklist, setShowChecklist] = useState(false)

    // Members
    const [members, setMembers] = useState<CardMemberType[]>([])
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [showMemberPicker, setShowMemberPicker] = useState(false)

    // Comments
    const [comments, setComments] = useState<CommentType[]>([])

    // Ledger State
    const [expenses, setExpenses] = useState<ExpenseType[]>([])
    const [summary, setSummary] = useState({ credit: 0, debit: 0, total: 0 })
    const [isAddingExpense, setIsAddingExpense] = useState(false)
    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: '',
        type: 'credit' as 'credit' | 'debit',
        date: new Date().toISOString().split('T')[0]
    })

    // Editing Expense State
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
    const [editFormData, setEditFormData] = useState({
        title: '',
        amount: '',
        type: 'credit' as 'credit' | 'debit',
        date: ''
    })

    // Fetch all data on load
    useEffect(() => {
        const fetchAll = async () => {
            // Fetch each data source independently so one failure doesn't break others
            try {
                const expData = await getExpenses(cardId)
                if (expData) { setExpenses(expData); calculateSummary(expData) }
            } catch (e) { console.error("Failed to fetch expenses", e) }

            try {
                const lblData = await getLabels(cardId)
                setLabels(lblData)
            } catch (e) { console.error("Failed to fetch labels", e) }

            try {
                const clData = await getChecklist(cardId)
                setChecklistItems(clData)
                if (clData.length > 0) setShowChecklist(true)
            } catch (e) { console.error("Failed to fetch checklist", e) }

            try {
                const memData = await getCardMembers(cardId)
                setMembers(memData)
            } catch (e) { console.error("Failed to fetch members", e) }

            try {
                const cmtData = await getComments(cardId)
                setComments(cmtData)
            } catch (e) { console.error("Failed to fetch comments", e) }
        }
        fetchAll()
    }, [cardId])

    const calculateSummary = (data: ExpenseType[]) => {
        let credit = 0
        let debit = 0
        data.forEach(exp => {
            if (exp.type === 'credit') credit += exp.amount
            else debit += exp.amount
        })
        setSummary({ credit, debit, total: credit - debit })
    }

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // Save Title
    const handleTitleBlur = async () => {
        if (title.trim() === initialTitle) return
        if (!title.trim()) { setTitle(initialTitle); return }
        try {
            await updateCard(cardId, boardId, { title })
        } catch (error) {
            console.error('Failed to update title', error)
            setTitle(initialTitle)
        }
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
    }

    // Save Description
    const saveDescription = async () => {
        if (description === initialDescription) { setIsEditingDesc(false); return }
        setIsLoading(true)
        try {
            await updateCard(cardId, boardId, { description })
            setIsEditingDesc(false)
        } catch (error) {
            console.error('Failed to update description', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Due Date
    const saveDueDate = async (date: string) => {
        setDueDate(date)
        setShowDatePicker(false)
        try {
            await updateCard(cardId, boardId, { due_date: date || null })
        } catch (err: any) {
            console.error('Failed to update due date', err)
            alert('Failed to save due date: ' + (err?.message || 'Unknown error'))
        }
    }

    // Labels
    const handleAddLabel = async (color: string, text: string) => {
        if (!text.trim()) return
        try {
            await addLabel(cardId, boardId, color, text.trim())
            const updated = await getLabels(cardId)
            setLabels(updated)
            setLabelText('')
        } catch (error) {
            console.error('Failed to add label', error)
        }
    }

    const handleRemoveLabel = async (labelId: string) => {
        setLabels(labels.filter(l => l.id !== labelId))
        try {
            await removeLabel(labelId, boardId)
        } catch (error) {
            console.error('Failed to remove label', error)
        }
    }

    // Members
    const handleShowMembers = async () => {
        if (!showMemberPicker) {
            try {
                const users = await getBoardMembers()
                setAllUsers(users)
            } catch (error) {
                console.error('Failed to fetch users', error)
            }
        }
        setShowMemberPicker(!showMemberPicker)
    }

    const handleAddMember = async (userId: string) => {
        try {
            await addCardMember(cardId, boardId, userId)
            const updated = await getCardMembers(cardId)
            setMembers(updated)
        } catch (error) {
            console.error('Failed to add member', error)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        setMembers(members.filter(m => m.id !== memberId))
        try {
            await removeCardMember(memberId, boardId)
        } catch (error) {
            console.error('Failed to remove member', error)
        }
    }

    // Expenses
    const handleAddExpense = async () => {
        if (!newExpense.title || !newExpense.amount) return
        try {
            const amount = parseFloat(newExpense.amount)
            await createExpense(cardId, boardId, {
                title: newExpense.title, amount, type: newExpense.type, date: newExpense.date
            })
            const updatedExpenses = await getExpenses(cardId)
            setExpenses(updatedExpenses)
            calculateSummary(updatedExpenses)
            setIsAddingExpense(false)
            setNewExpense({ ...newExpense, title: '', amount: '' })
        } catch (error) {
            console.error("Failed to create expense", error)
        }
    }

    const startEditing = (exp: ExpenseType) => {
        setEditingExpenseId(exp.id)
        setEditFormData({ title: exp.title, amount: exp.amount.toString(), type: exp.type, date: exp.date })
    }
    const cancelEditing = () => { setEditingExpenseId(null) }

    const saveEditedExpense = async () => {
        if (!editingExpenseId || !editFormData.title || !editFormData.amount) return
        try {
            await updateExpense(editingExpenseId, boardId, {
                title: editFormData.title, amount: parseFloat(editFormData.amount),
                type: editFormData.type, date: editFormData.date
            })
            const updatedExpenses = await getExpenses(cardId)
            setExpenses(updatedExpenses)
            calculateSummary(updatedExpenses)
            cancelEditing()
        } catch (error) {
            console.error("Failed to update expense", error)
        }
    }

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm('Delete this expense?')) return
        try {
            await deleteExpense(expenseId, boardId)
            const updatedExpenses = expenses.filter(e => e.id !== expenseId)
            setExpenses(updatedExpenses)
            calculateSummary(updatedExpenses)
        } catch (error) {
            console.error("Failed to delete expense", error)
        }
    }

    // Delete Card
    const handleDeleteCard = async () => {
        if (!confirm('Are you sure you want to delete this card?')) return
        setIsLoading(true)
        try {
            await deleteCard(cardId, boardId)
            onClose()
        } catch (error) {
            console.error('Failed to delete card', error)
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Title & Ledger Dashboard */}
                <div className={styles.header}>
                    <div className={styles.ledgerDashboard}>
                        <div className={styles.ledgerBox}>
                            <div className={styles.ledgerLabel}>Summary</div>
                            <div className={`${styles.ledgerValue} ${styles.summaryVal}`}>
                                ₹ {summary.total.toLocaleString()}
                            </div>
                        </div>
                        <div className={styles.ledgerBox}>
                            <div className={styles.ledgerLabel}>Credit</div>
                            <div className={`${styles.ledgerValue} ${styles.creditVal}`}>
                                ₹ {summary.credit.toLocaleString()}
                            </div>
                        </div>
                        <div className={styles.ledgerBox}>
                            <div className={styles.ledgerLabel}>Debit</div>
                            <div className={`${styles.ledgerValue} ${styles.debitVal}`}>
                                ₹ {summary.debit.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <textarea
                        className={styles.titleInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        rows={1}
                        spellCheck={false}
                    />

                    {/* Labels Display */}
                    {labels.length > 0 && (
                        <div className={styles.labelsDisplay}>
                            {labels.map(label => (
                                <span
                                    key={label.id}
                                    className={styles.labelPill}
                                    style={{ backgroundColor: label.color }}
                                    onClick={() => handleRemoveLabel(label.id)}
                                    title="Click to remove"
                                >
                                    {label.text || '\u00A0'}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Quick Action Bar */}
                    <div className={styles.actionBar}>
                        <button className={styles.actionBarBtn} onClick={() => setIsAddingExpense(!isAddingExpense)}>
                            <Plus size={14} /> Add
                        </button>
                        <button className={styles.actionBarBtn} onClick={() => setShowLabelPicker(!showLabelPicker)}>
                            <Tag size={14} /> Labels
                        </button>
                        <button className={styles.actionBarBtn} onClick={() => setShowDatePicker(!showDatePicker)}>
                            <Clock size={14} /> Dates
                        </button>
                        <button className={styles.actionBarBtn} onClick={() => { setShowChecklist(!showChecklist) }}>
                            <CheckSquare size={14} /> Checklist
                        </button>
                        <button className={styles.actionBarBtn} onClick={handleShowMembers}>
                            <Users size={14} /> Members
                        </button>
                    </div>

                    {/* Label Picker Popover */}
                    {showLabelPicker && (
                        <div className={styles.popover}>
                            <div className={styles.popoverHeader}>
                                <span>Labels</span>
                                <button className={styles.popoverClose} onClick={() => setShowLabelPicker(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Label name (e.g. Urgent, In Progress)"
                                value={labelText}
                                onChange={(e) => setLabelText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && labelText.trim()) handleAddLabel(selectedLabelColor, labelText) }}
                                style={{ marginBottom: 10 }}
                            />
                            <div className={styles.colorGrid}>
                                {LABEL_COLORS.map(lc => (
                                    <button
                                        key={lc.color}
                                        className={`${styles.colorSwatch} ${selectedLabelColor === lc.color ? styles.colorSwatchActive : ''}`}
                                        style={{ backgroundColor: lc.color }}
                                        onClick={() => setSelectedLabelColor(lc.color)}
                                        title={lc.name}
                                    />
                                ))}
                            </div>
                            <button
                                className={styles.saveButton}
                                onClick={() => handleAddLabel(selectedLabelColor, labelText)}
                                disabled={!labelText.trim()}
                                style={{ marginTop: 10, width: '100%' }}
                            >
                                Add Label
                            </button>
                        </div>
                    )}

                    {/* Date Picker Popover */}
                    {showDatePicker && (
                        <div className={styles.popover}>
                            <div className={styles.popoverHeader}>
                                <span>Due Date</span>
                                <button className={styles.popoverClose} onClick={() => setShowDatePicker(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={dueDate ? dueDate.split('T')[0] : ''}
                                onChange={(e) => saveDueDate(e.target.value)}
                            />
                            {dueDate && (
                                <button className={styles.cancelButton} onClick={() => saveDueDate('')}>
                                    Remove date
                                </button>
                            )}
                        </div>
                    )}

                    {/* Member Picker Popover */}
                    {showMemberPicker && (
                        <div className={styles.popover}>
                            <div className={styles.popoverHeader}>
                                <span>Members</span>
                                <button className={styles.popoverClose} onClick={() => setShowMemberPicker(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className={styles.memberList}>
                                {allUsers.map(user => {
                                    const isAssigned = members.some(m => m.user_id === user.id)
                                    return (
                                        <div key={user.id} className={styles.memberOption}>
                                            <div className={styles.memberAvatar}>
                                                {(user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <span className={styles.memberEmail}>{user.email}</span>
                                            {isAssigned ? (
                                                <button
                                                    className={styles.memberRemoveBtn}
                                                    onClick={() => {
                                                        const mem = members.find(m => m.user_id === user.id)
                                                        if (mem) handleRemoveMember(mem.id)
                                                    }}
                                                >✕</button>
                                            ) : (
                                                <button
                                                    className={styles.memberAddBtn}
                                                    onClick={() => handleAddMember(user.id)}
                                                >+</button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Due Date Display */}
                    {dueDate && (() => {
                        const status = getDueDateStatus(dueDate)
                        const statusStyles: Record<string, React.CSSProperties> = {
                            overdue: { background: '#fee2e2', color: '#991b1b', fontWeight: 600 },
                            today: { background: '#fef3c7', color: '#92400e', fontWeight: 600 },
                            upcoming: { background: 'var(--surface-hover)', color: 'var(--text)' },
                            none: {},
                        }
                        const statusLabel = status === 'overdue' ? ' — Overdue!' : status === 'today' ? ' — Due Today' : ''
                        return (
                            <div className={styles.dueDateDisplay} style={statusStyles[status]}>
                                <Calendar size={14} />
                                <span>
                                    {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {statusLabel && <strong>{statusLabel}</strong>}
                                </span>
                            </div>
                        )
                    })()}

                    {/* Members Display */}
                    {members.length > 0 && (
                        <div className={styles.membersDisplay}>
                            {members.map(m => (
                                <div key={m.id} className={styles.memberChip} title={m.email}>
                                    {(m.full_name || m.email || 'U').charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.mainContent}>
                    <div className={styles.mainCol}>
                        {/* Description Section */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <AlignLeft size={20} className={styles.icon} />
                                <h3 className={styles.sectionTitle}>Description</h3>
                            </div>
                            {isEditingDesc ? (
                                <div>
                                    <textarea
                                        className={styles.descriptionInput}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a more detailed description..."
                                        autoFocus
                                    />
                                    <div className={styles.actions}>
                                        <button className={styles.saveButton} onClick={saveDescription} disabled={isLoading}>Save</button>
                                        <button className={styles.cancelButton} onClick={() => { setDescription(initialDescription || ''); setIsEditingDesc(false) }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.descriptionInput} style={{ minHeight: description ? 'auto' : 40, cursor: 'pointer' }} onClick={() => setIsEditingDesc(true)}>
                                    {description || "Add a more detailed description..."}
                                </div>
                            )}
                        </div>

                        {/* Checklist Section */}
                        {showChecklist && (
                            <ChecklistSection cardId={cardId} boardId={boardId} initialItems={checklistItems} />
                        )}

                        {/* Expenses Section */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader} style={{ justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <CreditCard size={20} className={styles.icon} />
                                    <h3 className={styles.sectionTitle}>Expenses</h3>
                                </div>
                                <button className={styles.sidebarButton} style={{ width: 'auto', marginBottom: 0 }} onClick={() => setIsAddingExpense(!isAddingExpense)}>
                                    {isAddingExpense ? 'Cancel' : 'Add Expense'}
                                </button>
                            </div>

                            {isAddingExpense && (
                                <div className={styles.addExpenseForm}>
                                    <div className={styles.formRow}>
                                        <input className={styles.formInput} placeholder="Title" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} />
                                        <input className={styles.formInput} type="number" placeholder="Amount" style={{ width: '120px' }} value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                                    </div>
                                    <div className={styles.formRow}>
                                        <select className={styles.formInput} value={newExpense.type} onChange={e => setNewExpense({ ...newExpense, type: e.target.value as any })}>
                                            <option value="credit">Credit (+)</option>
                                            <option value="debit">Debit (-)</option>
                                        </select>
                                        <input className={styles.formInput} type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
                                    </div>
                                    <button className={styles.saveButton} onClick={handleAddExpense}>Add Transaction</button>
                                </div>
                            )}

                            <div className={styles.expenseList}>
                                {expenses.length > 0 && (
                                    <div className={styles.expenseHeader}>
                                        <span>Title</span>
                                        <span>Amount</span>
                                    </div>
                                )}
                                {expenses.map(exp => (
                                    <div key={exp.id} className={styles.expenseItem}>
                                        {editingExpenseId === exp.id ? (
                                            <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
                                                <input className={styles.formInput} value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} style={{ flex: 2 }} />
                                                <input className={styles.formInput} type="number" value={editFormData.amount} onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })} style={{ width: 80 }} />
                                                <select className={styles.formInput} value={editFormData.type} onChange={e => setEditFormData({ ...editFormData, type: e.target.value as any })} style={{ width: 90 }}>
                                                    <option value="credit">Cr (+)</option>
                                                    <option value="debit">Dr (-)</option>
                                                </select>
                                                <button onClick={saveEditedExpense} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }}><Save size={16} /></button>
                                                <button onClick={cancelEditing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle size={16} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <div className={styles.expenseTitle}>{exp.title}</div>
                                                    <div className={styles.expenseDate}>{exp.date}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div className={`${styles.expenseAmount} ${exp.type === 'credit' ? styles.amountCredit : styles.amountDebit}`}>
                                                        {exp.type === 'credit' ? '+' : '-'} ₹ {exp.amount.toLocaleString()}
                                                    </div>
                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => startEditing(exp)}><Edit2 size={14} /></button>
                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleDeleteExpense(exp.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {expenses.length === 0 && !isAddingExpense && (
                                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        No transactions yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className={styles.sidebar}>
                        <CommentsSection cardId={cardId} boardId={boardId} initialComments={comments} />

                        <div className={styles.sidebarActions}>
                            <h3 className={styles.sidebarActionsTitle}>Actions</h3>
                            <button className={`${styles.sidebarButton} ${styles.deleteButton}`} onClick={handleDeleteCard} disabled={isLoading}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Trash2 size={16} /> Delete
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
