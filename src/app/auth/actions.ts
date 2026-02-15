'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function loginWithGoogle() {
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    console.log('Google Sign-In Initiated. Origin:', origin)

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error('Google Sign-In Error:', error)
        redirect('/login?error=Could not authenticate with Google. Please try again.')
    }

    if (data.url) {
        console.log('Redirecting to Supabase OAuth URL:', data.url)
        redirect(data.url)
    }
}


export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect('/login?error=Please enter both email and password.')
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        console.error('Login Error:', error.message)

        // Map Supabase error messages to user-friendly messages
        let message = 'An unexpected error occurred. Please try again.'
        if (error.message === 'Invalid login credentials') {
            message = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message === 'Email not confirmed') {
            message = 'Your email is not confirmed. Please check your inbox for a confirmation link.'
        } else if (error.message.includes('rate limit')) {
            message = 'Too many login attempts. Please wait a moment and try again.'
        }

        redirect(`/login?error=${encodeURIComponent(message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect('/signup?error=Please enter both email and password.')
    }

    if (password.length < 6) {
        redirect('/signup?error=Password must be at least 6 characters long.')
    }

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
        console.error('Signup Error:', error.message)

        let message = 'Could not create account. Please try again.'
        if (error.message.includes('already registered')) {
            message = 'An account with this email already exists. Please log in instead.'
        } else if (error.message.includes('valid email')) {
            message = 'Please enter a valid email address.'
        } else if (error.message.includes('password')) {
            message = error.message
        } else if (error.message.includes('rate limit')) {
            message = 'Too many signup attempts. Please wait a moment and try again.'
        }

        redirect(`/signup?error=${encodeURIComponent(message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const email = formData.get('email') as string

    if (!email) {
        redirect('/forgot-password?error=Please enter your email address.')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
        console.error('Forgot Password Error:', error.message)

        let message = 'Could not send reset email. Please try again.'
        if (error.message.includes('rate limit')) {
            message = 'Too many requests. Please wait a moment before trying again.'
        }

        redirect(`/forgot-password?error=${encodeURIComponent(message)}`)
    }

    redirect('/forgot-password?success=Check your email for a password reset link.')
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
        redirect('/reset-password?error=Please fill in both password fields.')
    }

    if (password !== confirmPassword) {
        redirect('/reset-password?error=Passwords do not match.')
    }

    if (password.length < 6) {
        redirect('/reset-password?error=Password must be at least 6 characters long.')
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        console.error('Reset Password Error:', error.message)
        redirect(`/reset-password?error=${encodeURIComponent('Could not reset password. Please try again or request a new reset link.')}`)
    }

    redirect('/login?success=Password has been reset successfully. Please log in.')
}
