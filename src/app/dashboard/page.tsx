
import React from 'react'
import { getFinancialStats } from './actions'
import StatsCard from '@/components/Dashboard/StatsCard'
import RevenueChart from '@/components/Dashboard/RevenueChart'
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import styles from './Dashboard.module.css'

export default async function DashboardPage() {
    const stats = await getFinancialStats()

    if (!stats) {
        return <div className={styles.error}>Error loading dashboard data.</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>

                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Financial Overview</h1>
                        <p className={styles.subtitle}>Track your project revenue and expenses</p>
                    </div>
                    {/* Date Picker or Filters could go here */}
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <StatsCard
                        title="Total Revenue"
                        value={`₹ ${stats.totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        variant="success"
                        trend={{ value: 12, label: "vs last month" }} // Dummy trend for now
                    />
                    <StatsCard
                        title="Total Expenses"
                        value={`₹ ${stats.totalExpenses.toLocaleString()}`}
                        icon={TrendingDown}
                        variant="danger"
                    />
                    <StatsCard
                        title="Net Profit"
                        value={`₹ ${stats.netProfit.toLocaleString()}`}
                        icon={TrendingUp}
                        variant={stats.netProfit >= 0 ? "default" : "warning"}
                        trend={{ value: Number(stats.profitMargin.toFixed(1)), label: "margin" }}
                    />
                    <StatsCard
                        title="Transactions"
                        value={stats.transactionCount}
                        icon={Activity}
                    />
                </div>

                {/* Charts Area Placeholder */}
                <div className={styles.chartsGrid}>
                    <div className={`${styles.chartCard} ${styles.chartCardLg}`}>
                        <h3 className={styles.cardTitle}>Financial Trends</h3>
                        <RevenueChart data={stats.chartData} />
                    </div>

                    <div className={styles.chartCard}>
                        <h3 className={styles.cardTitle}>Recent Activity</h3>
                        <div className={styles.activityList}>
                            {stats.recentTransactions?.map((t: any) => (
                                <div key={t.id} className={styles.activityItem}>
                                    <div className={styles.activityLeft}>
                                        <div className={`${styles.dot} ${t.type === 'credit' ? styles.dotGreen : styles.dotRed}`} />
                                        <div className={styles.activityText}>
                                            <p className={styles.activityTitle}>
                                                {t.type === 'credit' ? 'Income' : 'Expense'}
                                            </p>
                                            <p className={styles.activityDate}>{new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`${styles.amount} ${t.type === 'credit' ? styles.textGreen : styles.textRed}`}>
                                        {t.type === 'credit' ? '+' : '-'} ₹ {Number(t.amount).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {(!stats.recentTransactions || stats.recentTransactions.length === 0) && (
                                <p className={styles.emptyState}>No recent transactions</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
