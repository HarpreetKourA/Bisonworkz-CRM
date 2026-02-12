'use client'

import React, { useState, useEffect } from 'react'
import { updateCard, deleteCard, getExpenses, createExpense, deleteExpense, updateExpense } from '@/app/boards/actions'
import styles from './CardModal.module.css'
import { AlignLeft, Trash2, X, CreditCard, Plus, Calendar, Edit2, Save, XCircle } from 'lucide-react'
import { ExpenseType } from '@/types/expense'

interface CardModalProps {
    cardId: string
    boardId: string
    listId: string
    initialTitle: string
    initialDescription?: string
    onClose: () => void
}

export default function CardModal({ cardId, boardId, listId, initialTitle, initialDescription, onClose }: CardModalProps) {
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription || '')
    const [isEditingDesc, setIsEditingDesc] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

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

    // Fetch Expenses on Load
    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const data = await getExpenses(cardId)
                if (data) {
                    setExpenses(data)
                    calculateSummary(data)
                }
            } catch (error) {
                console.error("Failed to fetch expenses", error)
            }
        }
        fetchExpenses()
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
        if (!title.trim()) {
            setTitle(initialTitle)
            return
        }
        try {
            await updateCard(cardId, boardId, { title })
        } catch (error) {
            console.error('Failed to update title', error)
            setTitle(initialTitle)
        }
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
        }
    }

    // Save Description
    const saveDescription = async () => {
        if (description === initialDescription) {
            setIsEditingDesc(false)
            return
        }
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

    // Add Expense
    const handleAddExpense = async () => {
        if (!newExpense.title || !newExpense.amount) return

        try {
            const amount = parseFloat(newExpense.amount)
            await createExpense(cardId, boardId, {
                title: newExpense.title,
                amount,
                type: newExpense.type,
                date: newExpense.date
            })

            // Refresh local state (optimistic or re-fetch)
            const updatedExpenses = await getExpenses(cardId)
            setExpenses(updatedExpenses)
            calculateSummary(updatedExpenses)

            setIsAddingExpense(false)
            setNewExpense({ ...newExpense, title: '', amount: '' })
        } catch (error) {
            console.error("Failed to create expense", error)
        }
    }

    // Start Editing
    const startEditing = (exp: ExpenseType) => {
        setEditingExpenseId(exp.id)
        setEditFormData({
            title: exp.title,
            amount: exp.amount.toString(),
            type: exp.type,
            date: exp.date
        })
    }

    // Cancel Editing
    const cancelEditing = () => {
        setEditingExpenseId(null)
        setEditFormData({ title: '', amount: '', type: 'credit', date: '' })
    }

    // Save Edited Expense
    const saveEditedExpense = async () => {
        if (!editingExpenseId || !editFormData.title || !editFormData.amount) return

        try {
            await updateExpense(editingExpenseId, boardId, {
                title: editFormData.title,
                amount: parseFloat(editFormData.amount),
                type: editFormData.type,
                date: editFormData.date
            })

            // Refresh
            const updatedExpenses = await getExpenses(cardId)
            setExpenses(updatedExpenses)
            calculateSummary(updatedExpenses)

            cancelEditing()
        } catch (error) {
            console.error("Failed to update expense", error)
        }
    }

    // Delete Expense
    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm('Delete this expense?')) return
        try {
            await deleteExpense(expenseId, boardId)
            // Refresh
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
        <div className={styles.overlay} onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
        }}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Ledger Dashboard */}
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

                    <div className={styles.sectionHeader}>
                        <AlignLeft size={20} className={styles.icon} />
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
                    <div style={{ marginLeft: 32, fontSize: 14, color: '#5e6c84' }}>
                        in list <span style={{ textDecoration: 'underline' }}>...</span>
                    </div>
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
                                        <input
                                            className={styles.formInput}
                                            placeholder="Title"
                                            value={newExpense.title}
                                            onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                                        />
                                        <input
                                            className={styles.formInput}
                                            type="number"
                                            placeholder="Amount"
                                            style={{ width: '120px' }}
                                            value={newExpense.amount}
                                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formRow}>
                                        <select
                                            className={styles.formInput}
                                            value={newExpense.type}
                                            onChange={e => setNewExpense({ ...newExpense, type: e.target.value as any })}
                                        >
                                            <option value="credit">Credit (+)</option>
                                            <option value="debit">Debit (-)</option>
                                        </select>
                                        <input
                                            className={styles.formInput}
                                            type="date"
                                            value={newExpense.date}
                                            onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                        />
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
                                                <input
                                                    className={styles.formInput}
                                                    value={editFormData.title}
                                                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                                    style={{ flex: 2 }}
                                                />
                                                <input
                                                    className={styles.formInput}
                                                    type="number"
                                                    value={editFormData.amount}
                                                    onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
                                                    style={{ width: 80 }}
                                                />
                                                <select
                                                    className={styles.formInput}
                                                    value={editFormData.type}
                                                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value as any })}
                                                    style={{ width: 90 }}
                                                >
                                                    <option value="credit">Cr (+)</option>
                                                    <option value="debit">Dr (-)</option>
                                                </select>
                                                <button onClick={saveEditedExpense} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#006644' }}>
                                                    <Save size={16} />
                                                </button>
                                                <button onClick={cancelEditing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c' }}>
                                                    <XCircle size={16} />
                                                </button>
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
                                                    <button
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c' }}
                                                        onClick={() => startEditing(exp)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c' }}
                                                        onClick={() => handleDeleteExpense(exp.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {expenses.length === 0 && !isAddingExpense && (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#5e6c84', fontStyle: 'italic' }}>
                                        No transactions yet.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className={styles.sidebar}>
                        <h3 className={styles.sectionTitle} style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 8, color: '#5e6c84' }}>Actions</h3>
                        <button className={`${styles.sidebarButton} ${styles.deleteButton}`} onClick={handleDeleteCard} disabled={isLoading}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Trash2 size={16} /> Delete
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
