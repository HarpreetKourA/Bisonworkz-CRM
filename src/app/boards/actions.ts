'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getBoards() {
    const supabase = await createClient()

    // RLS Policy "View boards" ensures users only see what they have access to
    const { data: boards, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return boards
}

export async function getBoard(id: string) {
    const supabase = await createClient()

    // Check access via RLS
    const { data: board, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null;
    return board;
}

export async function getLists(boardId: string) {
    const supabase = await createClient()

    const { data: lists, error } = await supabase
        .from('lists')
        .select(`
            *,
            cards (*)
        `)
        .eq('board_id', boardId)
        .order('position', { ascending: true })

    if (error) throw new Error(error.message)

    // Sort cards by position for each list (Supabase join sorting is tricky, easier in JS here)
    const listsWithSortedCards = lists.map((list: any) => ({
        ...list,
        cards: (list.cards || []).sort((a: any, b: any) => a.position - b.position)
    }))

    return listsWithSortedCards
}

export async function createList(boardId: string, title: string) {
    const supabase = await createClient()

    // Get current max position to append to end
    const { data: maxPosData } = await supabase
        .from('lists')
        .select('position')
        .eq('board_id', boardId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosData?.position || 0) + 65535 // Large gap for reordering

    const { error } = await supabase
        .from('lists')
        .insert({
            board_id: boardId,
            title,
            position: newPosition
        })

    if (error) throw new Error(error.message)

    revalidatePath(`/boards/${boardId}`)
}

export async function getCards(listId: string) {
    const supabase = await createClient()

    const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true })

    if (error) throw new Error(error.message)
    return cards
}

export async function createCard(listId: string, boardId: string, title: string) {
    const supabase = await createClient()

    // Get current max position
    const { data: maxPosData } = await supabase
        .from('cards')
        .select('position')
        .eq('list_id', listId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosData?.position || 0) + 65535

    const { error } = await supabase
        .from('cards')
        .insert({
            list_id: listId,
            title,
            position: newPosition
        })

    if (error) throw new Error(error.message)

    revalidatePath(`/boards/${boardId}`)
}

export async function createBoard(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const background = formData.get('background') as string || 'linear-gradient(135deg, #0079bf, #5067c5)' // Default blue theme

    if (!title) throw new Error('Title is required')

    console.log('Attempting to create board for user:', user.id)

    const { data, error } = await supabase
        .from('boards')
        .insert({
            title,
            background,
            owner_id: user.id
        })
        .select('id')
        .single()

    if (error) {
        console.error('FULL CREATE BOARD ERROR:', JSON.stringify(error, null, 2))
        throw new Error(`Failed to create board: ${error.message} (Code: ${error.code})`)
    }

    console.log('Board created successfully:', data.id)

    revalidatePath('/boards')
    redirect(`/boards/${data!.id}`)
    revalidatePath('/boards')
    redirect(`/boards/${data!.id}`)
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient()

    // Verify owner? Or RLS handles it?
    // "delete" policy on boards table usually checks owner_id = auth.uid()
    // To be safe, we rely on RLS, but if RLS isn't strict, we might want to check here.
    // Assuming RLS is set up properly for "DELETE" policy.

    /* 
       Note: If we don't have ON DELETE CASCADE in SQL, we must delete children manually.
       Since I don't recall adding CASCADE to all relationships, I will do a manual cleanup to be safe.
       Order: Expenses -> Cards -> Lists -> Board
    */

    // 1. Get all lists
    const { data: lists } = await supabase.from('lists').select('id').eq('board_id', boardId)
    const listIds = lists?.map(l => l.id) || []

    if (listIds.length > 0) {
        // 2. Get all cards
        const { data: cards } = await supabase.from('cards').select('id').in('list_id', listIds)
        const cardIds = cards?.map(c => c.id) || []

        if (cardIds.length > 0) {
            // 3. Delete Expenses
            await supabase.from('expenses').delete().in('card_id', cardIds)
            // 4. Delete Cards
            await supabase.from('cards').delete().in('list_id', listIds)
        }
        // 5. Delete Lists
        await supabase.from('lists').delete().eq('board_id', boardId)
    }

    // 6. Delete Board
    const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId)

    if (error) throw new Error(error.message)

    revalidatePath('/boards')
    return { success: true }
}

export async function updateListOrder(boardId: string, items: { id: string; position: number }[]) {
    const supabase = await createClient()

    for (const item of items) {
        await supabase
            .from('lists')
            .update({ position: item.position })
            .eq('id', item.id)
    }
    revalidatePath(`/boards/${boardId}`)
}

export async function updateCardOrder(boardId: string, items: { id: string; position: number; list_id: string }[]) {
    const supabase = await createClient()

    for (const item of items) {
        await supabase
            .from('cards')
            .update({
                position: item.position,
                list_id: item.list_id
            })
            .eq('id', item.id)
    }
    revalidatePath(`/boards/${boardId}`)
}

export async function updateCard(cardId: string, boardId: string, data: { title?: string; description?: string; budget?: number; payment_status?: 'pending' | 'paid' | 'overdue' }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('cards')
        .update(data)
        .eq('id', cardId)

    if (error) throw new Error(error.message)

    revalidatePath(`/boards/${boardId}`)
}

export async function deleteCard(cardId: string, boardId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

    if (error) throw new Error(error.message)

    revalidatePath(`/boards/${boardId}`)
}

export async function deleteList(listId: string, boardId: string) {
    const supabase = await createClient()

    // Delete cards first (if cascade isn't set, this is safer)
    const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .eq('list_id', listId)

    if (cardsError) throw new Error(cardsError.message)

    // Delete the list
    const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)

    if (error) throw new Error(error.message)

    revalidatePath(`/boards/${boardId}`)
}

export async function getExpenses(cardId: string) {
    const supabase = await createClient()

    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('card_id', cardId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return expenses
}

// Helper to update card summary
async function recalculateCardBalance(cardId: string, supabase: any) {
    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount, type')
        .eq('card_id', cardId)

    if (error) {
        console.error('Error fetching expenses for recalculation:', error)
        return
    }

    let balance = 0
    let credits = 0
    expenses?.forEach((exp: any) => {
        if (exp.type === 'credit') {
            balance += exp.amount
            credits += exp.amount
        }
        else balance -= exp.amount
    })

    const { error: updateError } = await supabase
        .from('cards')
        .update({
            expense_summary: balance,
            expense_credits: credits
        })
        .eq('id', cardId)

    if (updateError) {
        console.error('Error updating card summary:', updateError)
    }
}

export async function createExpense(cardId: string, boardId: string, data: { title: string; amount: number; type: 'credit' | 'debit'; assignee?: string; date?: string }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('expenses')
        .insert({
            card_id: cardId,
            ...data
        })

    if (error) throw new Error(error.message)

    await recalculateCardBalance(cardId, supabase)
    revalidatePath(`/boards/${boardId}`)
}

export async function deleteExpense(expenseId: string, boardId: string) {
    const supabase = await createClient()

    // Get card_id before deleting to recalculate
    const { data: expense } = await supabase
        .from('expenses')
        .select('card_id')
        .eq('id', expenseId)
        .single()

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

    if (error) throw new Error(error.message)

    if (expense?.card_id) {
        await recalculateCardBalance(expense.card_id, supabase)
    }

    revalidatePath(`/boards/${boardId}`)
}

export async function updateExpense(expenseId: string, boardId: string, data: { title?: string; amount?: number; type?: 'credit' | 'debit'; date?: string }) {
    const supabase = await createClient()

    // Get card_id before updating/after updating (doesn't verify, but we need it)
    const { data: expense } = await supabase.from('expenses').select('card_id').eq('id', expenseId).single()

    const { error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', expenseId)

    if (error) throw new Error(error.message)

    if (expense?.card_id) {
        await recalculateCardBalance(expense.card_id, supabase)
    }

    revalidatePath(`/boards/${boardId}`)
}
