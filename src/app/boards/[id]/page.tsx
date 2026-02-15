import { getBoard, getLists } from '../actions'
import styles from './page.module.css'
import { notFound } from 'next/navigation'
import BoardCanvas from '@/components/Board/BoardCanvas'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const board = await getBoard(id)
    if (!board) notFound()

    const lists = await getLists(id)

    return (
        <div
            className={styles.boardContainer}
            style={{ background: board.background }}
        >
            <div className={styles.boardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/boards" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', height: '32px', width: '32px', border: 'none' }} title="Back to Boards">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className={styles.boardTitle}>{board.title}</h1>
                </div>
                <div>
                    <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                        Share
                    </button>
                </div>
            </div>

            <BoardCanvas boardId={id} initialLists={lists} />
        </div>
    )
}
