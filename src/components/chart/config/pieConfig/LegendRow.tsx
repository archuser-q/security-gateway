import { CheckCheck, TriangleAlert } from 'lucide-react'

interface LegendRowProps {
  colorClass: string
  label: string
  value: number
  percent: number
  variant?: 'enabled' | 'disabled'
}

export default function LegendRow({ colorClass, label, value, percent, variant = 'enabled' }: LegendRowProps) {
  const Icon = variant === 'enabled' ? CheckCheck : TriangleAlert

  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="text-base font-bold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">{percent}%</p>
        </div>
        <span className="font-semibold text-gray-800 text-lg">{value}</span>
      </div>
    </div>
  )
}