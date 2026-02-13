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

    // DEBUG: Log due_date values to trace persistence issue
    if (cards && cards.length > 0) {
        console.log('[getCards] Sample card keys:', Object.keys(cards[0]))
        cards.forEach((c: any) => console.log(`[getCards] Card "${c.title}" due_date=${c.due_date}`))
    }

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

export async function updateCard(cardId: string, boardId: string, data: { title?: string; description?: string; budget?: number; payment_status?: 'pending' | 'paid' | 'overdue'; due_date?: string | null }) {
    const supabase = await createClient()

    console.log('[updateCard] Updating card:', cardId, 'with data:', JSON.stringify(data))

    const { data: result, error } = await supabase
        .from('cards')
        .update(data)
        .eq('id', cardId)
        .select()

    if (error) {
        console.error('[updateCard] ERROR:', error.message, error.code, error.details, error.hint)
        throw new Error(error.message)
    }

    console.log('[updateCard] Success. Rows updated:', result?.length, 'Result:', JSON.stringify(result))
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

// ============================================
// LABELS
// ============================================

export async function getLabels(cardId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('card_labels')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: true })
    if (error) {
        console.error('[getLabels] ERROR:', error.message, error.code)
        throw new Error(error.message)
    }
    console.log('[getLabels] Card:', cardId, 'Found:', data?.length || 0)
    return data || []
}

export async function getLabelsForCards(cardIds: string[]) {
    if (cardIds.length === 0) return []
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('card_labels')
        .select('*')
        .in('card_id', cardIds)
        .order('created_at', { ascending: true })
    if (error) return []
    return data || []
}

export async function addLabel(cardId: string, boardId: string, color: string, text: string = '') {
    const supabase = await createClient()
    const { error } = await supabase
        .from('card_labels')
        .insert({ card_id: cardId, color, text })
    if (error) throw new Error(error.message)
    revalidatePath(`/boards/${boardId}`)
}

export async function removeLabel(labelId: string, boardId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('card_labels')
        .delete()
        .eq('id', labelId)
    if (error) throw new Error(error.message)
    revalidatePath(`/boards/${boardId}`)
}

// ============================================
// CHECKLIST
// ============================================

export async function getChecklist(cardId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('card_checklists')
        .select('*')
        .eq('card_id', cardId)
        .order('position', { ascending: true })
    if (error) {
        console.error('[getChecklist] ERROR:', error.message, error.code)
        throw new Error(error.message)
    }
    console.log('[getChecklist] Card:', cardId, 'Found:', data?.length || 0)
    return data || []
}

export async function addChecklistItem(cardId: string, boardId: string, text: string) {
    const supabase = await createClient()
    const { data: existing } = await supabase
        .from('card_checklists')
        .select('position')
        .eq('card_id', cardId)
        .order('position', { ascending: false })
        .limit(1)
    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0

    const { error } = await supabase
        .from('card_checklists')
        .insert({ card_id: cardId, text, position: nextPos })
    if (error) throw new Error(error.message)
    revalidatePath(`/boards/${boardId}`)
}

export async function toggleChecklistItem(itemId: string, boardId: string, isChecked: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('card_checklists')
        .update({ is_checked: isChecked })
        .eq('id', itemId)
    if (error) throw new Error(error.message)
    revalidatePath(`/boards/${boardId}`)
}

export async function deleteChecklistItem(itemId: string, boardId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('card_checklists')
        .delete()
        .eq('id', itemId)
    if (error) throw new Error(error.message)
    revalidatePath(`/boards/${boardId}`)
}

// ============================================
// MEMBERS
// ============================================

export async function getCardMembers(cardId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('card_members')
        .select('*')
        .eq('card_id', cardId)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return []

    // Fetch profile info separately
    const userIds = data.map((m: any) => m.user_id)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('id', userIds)
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    return data.map((m: any) => {
        const profile = profileMap.get(m.user_id)
        return {
            ...m,
            email: profile?.email || '',
            full_name: profile?.full_name || '',
        }
    })
}

export async function getBoardMembers() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .is('deleted_at', null)
        .order('email')
    if (error) throw new Error(error.message)
    return data || []
}

export async function addCardMember(cardId: string, boardId: string, userId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('card_members')
        .insert({ card_id: cardId, user_id: userId })
    if (error) {
        if (error.code === '23505') return // Duplicate, ignore
        throw new Error(error.message)
    }
    revalidatePath(`/boards/${boardId}`)
}

export async function removeCardMember(memberId: string, boardId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('card_members')
        .delete()
        .eq('id', memberId)
    if (error) throw new Error(error.message)
    revalidatePath(`/boards/${boardId}`)
}

// ============================================
// COMMENTS
// ============================================

export async function getComments(cardId: string) {
    const supabase = await createClient()
    console.log('[getComments] Fetching for card:', cardId)

    const { data, error } = await supabase
        .from('card_comments')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getComments] ERROR:', error.message, error.code, error.details, error.hint)
        return [] // Don't throw — return empty so other data still loads
    }

    console.log('[getComments] Found', data?.length || 0, 'comments')
    if (!data || data.length === 0) return []

    // Fetch profile info separately (don't let this crash the function)
    let profileMap = new Map()
    try {
        const userIds = [...new Set(data.map((c: any) => c.user_id).filter(Boolean))]
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email, role')
                .in('id', userIds)
            profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
        }
    } catch (e) {
        console.error('[getComments] Profile lookup failed:', e)
    }

    return data.map((c: any) => {
        const profile = profileMap.get(c.user_id)
        return {
            ...c,
            email: profile?.email || '',
            full_name: profile?.full_name || '',
        }
    })
}

export async function addComment(cardId: string, boardId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('[addComment] Not authenticated - no user found')
        throw new Error('Not authenticated')
    }

    const { data: result, error } = await supabase
        .from('card_comments')
        .insert({ card_id: cardId, user_id: user.id, content })
        .select()
        .single()

    if (error) {
        console.error('[addComment] ERROR:', error.message, error.code, error.details, error.hint)
        throw new Error(error.message)
    }

    // Get the user's profile info
    let email = user.email || ''
    let full_name = ''
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single()
        if (profile) {
            email = profile.email || email
            full_name = profile.full_name || ''
        }
    } catch (_) { }

    revalidatePath(`/boards/${boardId}`)
    return { ...result, email, full_name }
}

export async function deleteComment(commentId: string, boardId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('card_comments')
        .delete()
        .eq('id', commentId)
    if (error) {
        console.error('[deleteComment] ERROR:', error.message)
        throw new Error(error.message)
    }
    revalidatePath(`/boards/${boardId}`)
}
