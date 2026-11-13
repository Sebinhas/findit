import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeftRight, X } from 'lucide-react'
import type { Match } from '../lib/types'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { ItemImage, TypeBadge } from './ItemCard'
import { Card } from './ui'

const breakdown = (m: Match) => [
  { label: 'Categoría', value: m.category_score, max: 30 },
  { label: 'Palabras clave', value: m.keyword_score, max: 30 },
  { label: 'Ubicación', value: m.location_score, max: 25 },
  { label: 'Fecha', value: m.date_score, max: 15 },
]

/** Muestra una posible coincidencia desde el punto de vista del usuario: "tu objeto" ↔ "el otro". */
export function MatchCard({ match, userId, onDismiss }: { match: Match; userId: string; onDismiss?: () => void }) {
  const [showDetail, setShowDetail] = useState(false)
  const mine = match.lost!.user_id === userId ? match.lost! : match.found!
  const other = mine.id === match.lost!.id ? match.found! : match.lost!
  const tone = match.score >= 75 ? 'text-success' : match.score >= 60 ? 'text-primary' : 'text-warning'

  async function dismiss() {
    await supabase.rpc('dismiss_match', { p_match_id: match.id })
    onDismiss?.()
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{match.score}%</div>
        <div className="min-w-0 flex-1 text-xs text-muted">
          Posible coincidencia con tu reporte <span className="font-medium text-ink">"{mine.title}"</span>
        </div>
        {onDismiss && (
          <button onClick={dismiss} className="rounded-md p-1 text-muted hover:bg-slate-100" title="Descartar" aria-label="Descartar coincidencia">
            <X className="size-4" />
          </button>
        )}
      </div>
      <Link to={`/objetos/${other.id}`} className="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 p-2 hover:bg-slate-100">
        <ItemImage item={other} className="size-14 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><TypeBadge type={other.type} /><span className="truncate text-sm font-medium">{other.title}</span></div>
          <p className="mt-1 text-xs text-muted">{other.location?.name} · {formatDate(other.incident_date)}</p>
        </div>
        <ArrowLeftRight className="size-4 shrink-0 text-muted" />
      </Link>
      <button onClick={() => setShowDetail(!showDetail)} className="mt-2 text-xs font-medium text-primary hover:underline">
        {showDetail ? 'Ocultar' : 'Ver'} cómo se calculó
      </button>
      {showDetail && (
        <div className="mt-2 space-y-1.5">
          {breakdown(match).map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-muted">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(b.value / b.max) * 100}%` }} />
              </div>
              <span className="w-12 text-right tabular-nums">{b.value}/{b.max}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
