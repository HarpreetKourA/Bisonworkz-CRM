
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getFinancialStats() {
    const supabase = await createClient()

    // Fetch all expenses
    // In a real app with huge data, we would use Supabase aggregate queries or RPC
    // But for this scale, JS calculation is fine and flexible
    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('id, amount, type, date, created_at')
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching financial stats:', error)
        return null
    }

    let totalRevenue = 0
    let totalExpenses = 0

    // Calculate totals and group by date for chart
    const chartDataMap = new Map<string, { date: string; revenue: number; expenses: number }>()

    expenses?.forEach(exp => {
        const amount = Number(exp.amount)
        const date = exp.date // Assuming YYYY-MM-DD from DB

        if (!chartDataMap.has(date)) {
            chartDataMap.set(date, { date, revenue: 0, expenses: 0 })
        }

        const dayStats = chartDataMap.get(date)!

        if (exp.type === 'credit') {
            totalRevenue += amount
            dayStats.revenue += amount
        } else {
            totalExpenses += amount
            dayStats.expenses += amount
        }
    })

    // Convert map to sorted array
    const chartData = Array.from(chartDataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        transactionCount: expenses?.length || 0,
        recentTransactions: expenses?.slice(-5).reverse(), // Last 5 transactions
        chartData
    }
}
