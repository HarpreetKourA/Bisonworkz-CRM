export interface LabelType {
    id: string
    card_id: string
    color: string
    text: string
    created_at: string
}

export interface ChecklistItemType {
    id: string
    card_id: string
    text: string
    is_checked: boolean
    position: number
    created_at: string
}

export interface CardMemberType {
    id: string
    card_id: string
    user_id: string
    created_at: string
    // Joined from profiles
    email?: string
    full_name?: string
    avatar_url?: string
}

export interface CommentType {
    id: string
    card_id: string
    user_id: string
    content: string
    created_at: string
    // Joined from profiles
    email?: string
    full_name?: string
    avatar_url?: string
}
