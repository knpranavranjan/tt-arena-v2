'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------- cards */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('rounded-2xl border border-line bg-panel shadow-[0_1px_2px_rgba(16,20,26,0.04)]', className)}>
      {children}
    </section>
  )
}

export function CardHead({
  title,
  desc,
  children,
  small,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  children?: React.ReactNode
  small?: boolean
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-4">
      <div className="min-w-0">
        <h2 className={cn('font-semibold tracking-[-0.011em]', small ? 'text-[15px]' : 'text-[17px]')}>{title}</h2>
        {desc ? <p className="mt-0.5 text-xs text-ink-faint">{desc}</p> : null}
      </div>
      {children ? <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardFoot({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <footer className={cn('flex flex-wrap items-center gap-2 rounded-b-2xl border-t border-line-soft bg-subtle px-5 py-3.5', className)}>
      {children}
    </footer>
  )
}

/* ----------------------------------------------------------------- buttons */

type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm' | 'xs'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default: 'border-line bg-panel text-ink hover:bg-subtle',
  primary: 'border-brand bg-brand text-white hover:bg-brand-hover',
  ghost: 'border-transparent bg-transparent text-ink-muted hover:bg-subtle hover:text-ink',
  danger: 'border-line bg-panel text-bad hover:border-bad/25 hover:bg-bad-soft',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'rounded-[10px] px-3.5 py-2 text-[13px]',
  sm: 'rounded-md px-2.5 py-1.5 text-xs',
  xs: 'rounded-md px-2 py-1 text-[11.5px]',
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap border font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40',
        'disabled:cursor-not-allowed disabled:opacity-40',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    />
  )
}

/* ------------------------------------------------------------------ inputs */

const FIELD_BASE =
  'w-full rounded-[10px] border border-line bg-panel px-2.5 py-2 text-[13.5px] text-ink outline-none transition ' +
  'placeholder:text-ink-faint focus:border-focus focus:ring-[3px] focus:ring-focus-soft ' +
  'disabled:bg-subtle disabled:text-ink-faint'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(FIELD_BASE, className)} />
}

/** Borderless cell input for editable tables — reveals its border on hover. */
export function CellInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-ink outline-none',
        'hover:border-line hover:bg-raised focus:border-focus focus:bg-raised focus:ring-[3px] focus:ring-focus-soft',
        className,
      )}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(FIELD_BASE, 'min-h-[74px] resize-y', className)} />
}

export interface Option<T extends string = string> {
  value: T
  label: string
  hint?: string
}

export function Select<T extends string>({
  options,
  value,
  onChange,
  className,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
  options: ReadonlyArray<Option<T> | string>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <select
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        FIELD_BASE,
        "appearance-none bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2.5 4.5L6 8l3.5-3.5' fill='none' stroke='%238b95a3' stroke-width='1.5' stroke-linecap='round'/></svg>\")] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-7",
        className,
      )}
    >
      {options.map((o) =>
        typeof o === 'string' ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  )
}

export function Field({
  label,
  help,
  children,
  className,
}: {
  label?: React.ReactNode
  help?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label ? <label className="text-xs font-medium text-ink-muted">{label}</label> : null}
      {children}
      {help ? <p className="text-[11.5px] text-ink-faint">{help}</p> : null}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  title,
  hint,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  title: React.ReactNode
  hint?: React.ReactNode
  disabled?: boolean
}) {
  return (
    <label className={cn('flex cursor-pointer select-none items-start gap-2.5', disabled && 'cursor-not-allowed opacity-50')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[15px] w-[15px] shrink-0 cursor-pointer brand-brand"
      />
      <span>
        <span className="text-[13px]">{title}</span>
        {hint ? <span className="block text-[11.5px] text-ink-faint">{hint}</span> : null}
      </span>
    </label>
  )
}

/* ------------------------------------------------------------- indicators */

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'gold' | 'solid' | 'outline'

const TONES: Record<Tone, string> = {
  neutral: 'bg-subtle text-ink-muted',
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  gold: 'bg-gold-soft text-gold',
  solid: 'bg-brand text-white',
  outline: 'border border-line bg-transparent text-ink-muted',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium', TONES[tone], className)}
    >
      {children}
    </span>
  )
}

const NOTE_TONES: Record<'neutral' | 'info' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'border-line-soft bg-subtle text-ink-muted',
  info: 'border-focus/20 bg-focus-soft text-brand-text',
  good: 'border-good/20 bg-good-soft text-good',
  warn: 'border-warn/25 bg-warn-soft text-warn',
  bad: 'border-bad/20 bg-bad-soft text-bad',
}

export function Note({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: keyof typeof NOTE_TONES
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('rounded-[10px] border px-3.5 py-2.5 text-[12.5px]', NOTE_TONES[tone], className)}>{children}</div>
}

export function Stat({ k, v, h }: { k: React.ReactNode; v: React.ReactNode; h?: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-line bg-panel px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">{k}</div>
      <div className="tabular mt-1 text-[22px] font-semibold tracking-[-0.02em]">{v}</div>
      {h ? <div className="mt-0.5 text-[11.5px] text-ink-faint">{h}</div> : null}
    </div>
  )
}

export function Empty({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="px-5 py-12 text-center text-ink-faint">
      <h3 className="mb-1.5 text-[15px] font-semibold text-ink-muted">{title}</h3>
      {children ? <p className="mx-auto max-w-prose">{children}</p> : null}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<Option<T>>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-[10px] bg-subtle p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.hint}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-[12.5px] transition',
            value === o.value ? 'bg-raised font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.4)]' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * A row of value chips plus a "＋" chip that reveals an inline input — so any
 * setting can take a value the presets don't offer. A `value` outside `options`
 * shows as its own selected chip.
 */
export function ChipPicker({
  options,
  value,
  onChange,
  numeric = true,
  min,
  max,
  className,
}: {
  options: ReadonlyArray<number | string>
  value: number | string
  onChange: (value: number | string) => void
  numeric?: boolean
  min?: number
  max?: number
  className?: string
}) {
  const [customOpen, setCustomOpen] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const isCustom = !options.some((o) => String(o) === String(value))

  const commit = () => {
    const raw = draft.trim()
    if (raw === '') {
      setCustomOpen(false)
      return
    }
    let next: number | string = raw
    if (numeric) {
      let n = Math.round(Number(raw))
      if (Number.isNaN(n)) {
        setCustomOpen(false)
        return
      }
      if (min !== undefined) n = Math.max(min, n)
      if (max !== undefined) n = Math.min(max, n)
      next = n
    }
    onChange(next)
    setDraft('')
    setCustomOpen(false)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            'tabular min-w-[30px] rounded-full px-2.5 py-1 text-[12.5px] transition',
            String(o) === String(value)
              ? 'bg-brand font-semibold text-white'
              : 'bg-subtle text-ink-muted hover:bg-raised hover:text-ink',
          )}
        >
          {o}
        </button>
      ))}

      {isCustom ? (
        <span className="tabular rounded-full bg-brand px-2.5 py-1 text-[12.5px] font-semibold text-white">
          {value}
        </span>
      ) : null}

      {customOpen ? (
        <input
          autoFocus
          inputMode={numeric ? 'numeric' : 'text'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setCustomOpen(false)
          }}
          placeholder={isCustom ? String(value) : 'custom'}
          className="tabular w-16 rounded-full border border-line bg-panel px-2.5 py-1 text-[12.5px] text-ink outline-none focus:border-focus focus:ring-[3px] focus:ring-focus-soft"
        />
      ) : (
        <button
          type="button"
          title="Enter a custom value"
          onClick={() => {
            setDraft(isCustom ? String(value) : '')
            setCustomOpen(true)
          }}
          className="rounded-full bg-subtle px-2.5 py-1 text-[12.5px] text-ink-muted transition hover:bg-raised hover:text-ink"
        >
          ＋
        </button>
      )}
    </div>
  )
}

export function Progress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-subtle">
      <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SeedPill({ seed, className }: { seed: number | string; className?: string }) {
  const top = typeof seed === 'number' && seed <= 4
  return (
    <span
      className={cn(
        'tabular inline-grid h-[22px] min-w-[24px] place-items-center rounded-md px-1.5 text-[11.5px] font-semibold',
        top ? 'bg-brand text-white' : 'bg-subtle text-ink-muted',
        className,
      )}
    >
      {seed}
    </span>
  )
}

export function RankPill({ rank, highlight }: { rank: number; highlight?: boolean }) {
  return (
    <span
      className={cn(
        'tabular inline-grid h-[22px] w-[22px] place-items-center rounded-full text-[11.5px] font-semibold',
        highlight ? 'bg-good-soft text-good' : 'bg-subtle text-ink-muted',
      )}
    >
      {rank}
    </span>
  )
}

/* ------------------------------------------------------------------ tables */

export function TableWrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('w-full overflow-x-auto', className)}>{children}</div>
}

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full border-collapse text-[13px]">{children}</table>
}

export function Th({
  className,
  num,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { num?: boolean }) {
  return (
    <th
      {...props}
      className={cn(
        'whitespace-nowrap border-b border-line bg-panel px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-faint',
        num ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  className,
  num,
  mono,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { num?: boolean; mono?: boolean }) {
  return (
    <td
      {...props}
      className={cn(
        'border-b border-line-soft px-3 py-2.5 align-middle',
        num && 'tabular text-right',
        mono && 'font-mono text-[12.5px]',
        className,
      )}
    >
      {children}
    </td>
  )
}

/** Sticky action bar pinned to the bottom of each wizard step. */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel/95 px-4 py-3 shadow-[0_8px_28px_rgba(16,20,26,0.09)] backdrop-blur">
      {children}
    </div>
  )
}

export function PageHead({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-faint">{eyebrow}</div>
        ) : null}
        <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.011em]">{title}</h1>
        {sub ? <p className="mt-1.5 max-w-[68ch] text-ink-muted">{sub}</p> : null}
      </div>
      {children ? <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------ console bits */

/** Two-letter category chip used in breakdown tables. */
export function CodeChip({ code }: { code: string }) {
  return (
    <span className="inline-grid h-6 min-w-[26px] place-items-center rounded bg-subtle px-1.5 text-[10.5px] font-semibold tracking-wide text-ink-muted">
      {code}
    </span>
  )
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const letter = name.trim()[0]?.toUpperCase() ?? '?'
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full bg-raised font-semibold text-ink-muted"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </span>
  )
}

/**
 * One competitor slot — a single player, or a doubles pair. A pair renders both
 * names; `stacked` shows them on two lines with the avatars stacked (match
 * cards, podium), otherwise they sit inline with overlapping mini-avatars
 * (tables, qualifier rows). Falls back to a plain avatar + name for singles.
 */
export function Competitor({
  player,
  size = 24,
  stacked = false,
  className,
  nameClassName,
}: {
  player?: { name: string; members?: Array<{ id: string; name: string }> } | null
  size?: number
  stacked?: boolean
  className?: string
  nameClassName?: string
}) {
  const members = player?.members && player.members.length > 1 ? player.members : null

  if (!members) {
    return (
      <span className={cn('flex min-w-0 items-center gap-2', className)}>
        <Avatar name={player?.name ?? '—'} size={size} />
        <span className={cn('min-w-0 flex-1 truncate', nameClassName)}>{player?.name ?? '—'}</span>
      </span>
    )
  }

  if (stacked) {
    return (
      <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
        <span className="flex shrink-0 flex-col -space-y-1">
          {members.slice(0, 2).map((m) => (
            <Avatar key={m.id} name={m.name} size={size} />
          ))}
        </span>
        <span className={cn('flex min-w-0 flex-1 flex-col leading-tight', nameClassName)}>
          {members.slice(0, 2).map((m) => (
            <span key={m.id} className="truncate">
              {m.name}
            </span>
          ))}
        </span>
      </span>
    )
  }

  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <span className="flex shrink-0 -space-x-2">
        {members.slice(0, 2).map((m) => (
          <span key={m.id} className="rounded-full ring-2 ring-panel">
            <Avatar name={m.name} size={size} />
          </span>
        ))}
      </span>
      <span className={cn('min-w-0 flex-1 truncate', nameClassName)}>
        {members.map((m) => m.name).join(' / ')}
      </span>
    </span>
  )
}

const PILL_TONES: Record<string, string> = {
  booked: 'border-good/30 bg-good-soft text-good',
  paid: 'border-good/30 bg-good-soft text-good',
  pending: 'border-warn/30 bg-warn-soft text-warn',
  refunded: 'border-bad/30 bg-bad-soft text-bad',
  cancelled: 'border-line bg-subtle text-ink-faint',
  settled: 'border-good/30 bg-good-soft text-good',
  na: 'border-line bg-subtle text-ink-faint',
  live: 'border-brand/40 bg-brand-soft text-brand-text',
  draft: 'border-line bg-subtle text-ink-muted',
  completed: 'border-line bg-subtle text-ink-muted',
}

/** Status pill for bookings, payouts and tournament state. */
export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium capitalize',
        PILL_TONES[status] ?? PILL_TONES.na,
      )}
    >
      {label ?? status}
    </span>
  )
}

/** The four-up KPI strip: one bordered row, hairline-divided, brand on top. */
export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid divide-y divide-line rounded-2xl border border-line bg-panel sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-line">
      {children}
    </div>
  )
}

export function Kpi({
  label,
  value,
  sub,
  highlight,
}: {
  label: React.ReactNode
  value: React.ReactNode
  sub?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={cn('relative px-6 py-5', highlight && 'bg-brand-soft/25')}>
      {highlight ? <span className="absolute inset-x-0 top-0 h-[3px] rounded-t bg-brand" /> : null}
      <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-faint">{label}</div>
      <div className="tabular mt-1.5 text-[30px] font-bold leading-none tracking-[-0.03em]">{value}</div>
      {sub ? <div className="tabular mt-2 text-[11.5px] text-ink-faint">{sub}</div> : null}
    </div>
  )
}

/** Fill-rate bar. Colour follows the band, not the raw number. */
export function FillBar({ pct, tone }: { pct: number; tone: 'full' | 'high' | 'normal' }) {
  const colour = tone === 'full' ? 'bg-brand' : tone === 'high' ? 'bg-good' : 'bg-ink-faint'
  const text = tone === 'full' ? 'text-brand-text' : tone === 'high' ? 'text-good' : 'text-ink-faint'
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-full max-w-[320px] flex-1 overflow-hidden rounded-full bg-subtle">
        <div className={cn('h-full rounded-full transition-[width] duration-300', colour)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('tabular w-10 shrink-0 text-right text-[12px] font-semibold', text)}>{pct}%</span>
    </div>
  )
}

/**
 * A titled block on the Tournaments settings page: heading on the left, one
 * action on the right, content below.
 */
export function SettingsSection({
  title,
  action,
  children,
}: {
  title: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-5">
      <div className="mb-2.5 flex items-center gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      <div className="rounded-2xl border border-line bg-panel">{children}</div>
    </section>
  )
}

/** Compact icon-only button for header utilities. */
export function IconButton({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-subtle hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}
