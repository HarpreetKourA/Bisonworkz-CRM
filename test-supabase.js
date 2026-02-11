import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Key (first 10 chars):', supabaseKey?.substring(0, 10))

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials!')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })

    if (error) {
        console.error('Connection failed:', error.message)
    } else {
        console.log('Connection successful!')
    }
}

test()
