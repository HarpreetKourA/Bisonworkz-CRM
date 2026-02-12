
import React from 'react'
import styles from './List.module.css'
import { getCards } from '@/app/boards/actions'
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
                            boardId={boardId}
                            expense_summary={card.expense_summary}
                            expense_credits={card.expense_credits}
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
