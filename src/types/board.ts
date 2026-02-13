export interface CardType {
    id: string
    list_id: string
    title: string
    description?: string
    position: number
    budget?: number
    payment_status?: 'pending' | 'paid' | 'overdue'
    expense_summary?: number
    expense_credits?: number
    due_date?: string
}

export interface ListType {
    id: string
    board_id: string
    title: string
    position: number
    cards: CardType[]
}

export interface BoardType {
    id: string
    title: string
    background: string
    owner_id: string
}
