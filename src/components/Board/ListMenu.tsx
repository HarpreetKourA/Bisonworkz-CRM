'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, X } from 'lucide-react'
import { deleteList } from '@/app/boards/actions'
import styles from './ListMenu.module.css'

interface ListMenuProps {
    listId: string
    boardId: string
}

export default function ListMenu({ listId, boardId }: ListMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this list?')) {
            try {
                await deleteList(listId, boardId)
            } catch (error) {
                console.error('Failed to delete list', error)
                alert('Failed to delete list')
            }
        }
        setIsOpen(false)
    }

    return (
        <div className={styles.menuContainer} ref={menuRef}>
            <button
                className={styles.menuButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className={styles.menuDropdown}>
                    <div className={styles.menuHeader}>
                        List Actions
                        <button className={styles.closeMenu} onClick={() => setIsOpen(false)}>
                            <X size={14} />
                        </button>
                    </div>
                    <button
                        className={`${styles.menuItem} ${styles.danger}`}
                        onClick={handleDelete}
                    >
                        Delete List
                    </button>
                </div>
            )}
        </div>
    )
}
