'use client'

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { ListType, CardType } from '@/types/board'
import styles from '@/app/boards/[id]/page.module.css'
import listStyles from '@/components/Board/List.module.css'
import cardStyles from '@/components/Board/Card.module.css'
import CreateList from '@/components/Board/CreateList'
import CreateCard from '@/components/Board/CreateCard'
import Card from '@/components/Board/Card'
import ListMenu from '@/components/Board/ListMenu'
import { updateListOrder, updateCardOrder } from '@/app/boards/actions'

interface BoardCanvasProps {
    boardId: string
    initialLists: ListType[]
}

export default function BoardCanvas({ boardId, initialLists }: BoardCanvasProps) {
    const [lists, setLists] = useState<ListType[]>(initialLists)

    // Sync state if server data changes (e.g. initial load or revalidate)
    useEffect(() => {
        setLists(initialLists)
    }, [initialLists])

    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return null
    }

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, type } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        // Moving Lists
        if (type === 'list') {
            try {
                const newLists = Array.from(lists)
                const [removed] = newLists.splice(source.index, 1)

                if (!removed) {
                    console.error('List not found at index', source.index)
                    return
                }

                newLists.splice(destination.index, 0, removed)

                setLists(newLists)

                // Calculate new positions and update server
                // Simplified position logic: just send index-based updates
                const updates = newLists.map((list, index) => ({
                    id: list.id,
                    position: (index + 1) * 65535, // Basic spacing
                }))

                try {
                    await updateListOrder(boardId, updates)
                } catch (error) {
                    console.error("Failed to update list order", error)
                    setLists(lists) // Revert on error
                }
            } catch (error) {
                console.error("Error moving list:", error)
                setLists(lists)
            }
            return
        }

        try {
            // Moving Cards
            const startList = lists.find(l => l.id === source.droppableId)
            const finishList = lists.find(l => l.id === destination.droppableId)

            if (!startList || !finishList) return

            // Moving within the same list
            if (startList === finishList) {
                const newCards = Array.from(startList.cards)
                const [removed] = newCards.splice(source.index, 1)

                if (!removed) {
                    console.error("Card not found at index", source.index)
                    return
                }

                newCards.splice(destination.index, 0, removed)

                const newList = {
                    ...startList,
                    cards: newCards,
                }

                const newLists = lists.map(l => (l.id === newList.id ? newList : l))

                setLists(newLists)

                const updates = newCards.map((card, index) => ({
                    id: card.id,
                    position: (index + 1) * 65535,
                    list_id: startList.id
                }))

                try {
                    await updateCardOrder(boardId, updates)
                } catch (error) {
                    console.error("Failed to update card order", error)
                    setLists(lists)
                }

            } else {
                // Moving from one list to another
                const startCards = Array.from(startList.cards)
                const [removed] = startCards.splice(source.index, 1)

                if (!removed) {
                    console.error("Card not found at source index", source.index)
                    return
                }

                const newStartList = {
                    ...startList,
                    cards: startCards,
                }

                const finishCards = Array.from(finishList.cards)
                finishCards.splice(destination.index, 0, removed)
                const newFinishList = {
                    ...finishList,
                    cards: finishCards,
                }

                const newLists = lists.map(l => {
                    if (l.id === newStartList.id) return newStartList
                    if (l.id === newFinishList.id) return newFinishList
                    return l
                })

                setLists(newLists)

                const updates = finishCards.map((card, index) => ({
                    id: card.id,
                    position: (index + 1) * 65535,
                    list_id: finishList.id
                }))

                try {
                    await updateCardOrder(boardId, updates)
                } catch (error) {
                    console.error("Failed to update card order", error)
                    setLists(lists)
                }
            }
        } catch (error) {
            console.error("Error moving card:", error)
            setLists(lists)
        }
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="all-lists" direction="horizontal" type="list">
                {(provided) => (
                    <div
                        className={styles.boardCanvas}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {lists.map((list, index) => (
                            <Draggable key={list.id} draggableId={list.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={listStyles.listWrapper}
                                    >
                                        <div className={listStyles.listContent}>
                                            <div
                                                className={listStyles.listHeader}
                                                {...provided.dragHandleProps}
                                            >
                                                <h2 className={listStyles.listTitle}>{list.title}</h2>
                                                <ListMenu listId={list.id} boardId={boardId} />
                                            </div>

                                            <Droppable droppableId={list.id} type="card">
                                                {(provided) => (
                                                    <div
                                                        className={listStyles.cardContainer}
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                    >
                                                        {list.cards.map((card, index) => (
                                                            <Draggable key={card.id} draggableId={card.id} index={index}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            marginBottom: '8px'
                                                                        }}
                                                                    >
                                                                        <Card
                                                                            id={card.id}
                                                                            title={card.title}
                                                                            description={card.description}
                                                                            listId={list.id}
                                                                            listName={list.title}
                                                                            boardId={boardId}
                                                                            expense_summary={card.expense_summary}
                                                                            expense_credits={card.expense_credits}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>

                                            <div className={listStyles.listFooter}>
                                                <CreateCard listId={list.id} boardId={boardId} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        <CreateList boardId={boardId} />
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )
}
