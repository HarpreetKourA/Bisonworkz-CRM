export interface ExpenseType {
    id: string
    card_id: string
    title: string
    amount: number
    type: 'credit' | 'debit'
    assignee?: string
    date: string
    created_at: string
}
