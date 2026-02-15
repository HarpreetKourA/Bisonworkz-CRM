
import React from 'react'
import styles from './List.module.css'
import { getCards, getLabelsForCards } from '@/app/boards/actions'
import Card from './Card'
import CreateCard from './CreateCard'
import ListMenu from './ListMenu'

interface ListProps {
    id: string
    title: string
    boardId: string
}

export default async function List({ id, title, boardId }: ListProps) {
    const cards = await getCards(id)

    // Batch-fetch labels for all cards in this list
    const cardIds = cards.map((c: any) => c.id)
    let allLabels: any[] = []
    try {
        allLabels = await getLabelsForCards(cardIds)
    } catch (e) { /* table might not exist yet */ }

    // Group labels by card_id
    const labelsByCard = new Map<string, any[]>()
    allLabels.forEach((label: any) => {
        const existing = labelsByCard.get(label.card_id) || []
        existing.push(label)
        labelsByCard.set(label.card_id, existing)
    })

    return (
        <div className={styles.listWrapper}>
            <div className={styles.listContent}>
                <div className={styles.listHeader}>
                    <h2 className={styles.listTitle}>{title}</h2>
                    <ListMenu listId={id} boardId={boardId} />
                </div>

                <div className={styles.cardContainer}>
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            description={card.description}
                            listId={id}
                            listName={title}
                            boardId={boardId}
                            expense_summary={card.expense_summary}
                            expense_credits={card.expense_credits}
                            due_date={card.due_date}
                            labels={labelsByCard.get(card.id) || []}
                        />
                    ))}
                </div>

                <div className={styles.listFooter}>
                    <CreateCard listId={id} boardId={boardId} />
                </div>
            </div>
        </div>
    )
}
