import { Link } from 'react-router'
import { CalendarDays, ImageOff, MapPin } from 'lucide-react'
import type { Item } from '../lib/types'
import { formatDate, itemStatusLabel, typeLabel } from '../lib/utils'
import { Badge } from './ui'

export function TypeBadge({ type }: { type: Item['type'] }) {
  return <Badge tone={type === 'LOST' ? 'amber' : 'blue'}>{typeLabel[type]}</Badge>
}

export function StatusBadge({ item }: { item: Pick<Item, 'status' | 'is_hidden' | 'deleted_at'> }) {
  if (item.deleted_at) return <Badge tone="slate">Eliminado</Badge>
  if (item.is_hidden) return <Badge tone="red">Oculto</Badge>
  return <Badge tone={item.status === 'ACTIVE' ? 'green' : 'slate'}>{itemStatusLabel[item.status]}</Badge>
}

export function ItemImage({ item, className }: { item: Pick<Item, 'image_url' | 'title'>; className?: string }) {
  return item.image_url
    ? <img src={item.image_url} alt={item.title} className={`object-cover ${className}`} loading="lazy" />
    : <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 ${className}`}><ImageOff className="size-8" /></div>
}

export function ItemCard({ item, extra }: { item: Item; extra?: React.ReactNode }) {
  return (
    <Link to={`/objetos/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <ItemImage item={item} className="aspect-[4/3] w-full" />
        <div className="absolute left-2 top-2"><TypeBadge type={item.type} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium group-hover:text-primary">{item.title}</h3>
          <StatusBadge item={item} />
        </div>
        <p className="text-xs text-muted">{item.category?.name}</p>
        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{item.location?.name}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(item.incident_date)}</span>
        </div>
        {extra}
      </div>
    </Link>
  )
}

export function ItemGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
}
