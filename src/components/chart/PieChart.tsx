import { useEffect, useRef, useState } from 'react'

interface HoverInfo {
  variant: 'enabled' | 'disabled'
  value: number
  percent: number
  x: number
  y: number
}

export default function PieChart({
  enabled,
  disabled,
  size = 150,
  stroke = 30,
  enabledLabel = 'Enabled',
  disabledLabel = 'Disabled',
}: {
  enabled: number
  disabled: number
  size?: number
  stroke?: number
  enabledLabel?: string
  disabledLabel?: string
}) {
  const total = enabled + disabled
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const targetEnabledLength = total === 0 ? 0 : circumference * (enabled / total)
  const [animatedLength, setAnimatedLength] = useState(0)
  const raf = useRef<number|undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  useEffect(() => {
    setAnimatedLength(0)
    raf.current = requestAnimationFrame(() => {
      raf.current = requestAnimationFrame(() => {
        setAnimatedLength(targetEnabledLength)
      })
    })
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [targetEnabledLength])

  const enabledPct = total === 0 ? 0 : Math.round((enabled / total) * 100)
  const disabledPct = total === 0 ? 0 : 100 - enabledPct

  const handleMove = (variant: 'enabled' | 'disabled', value: number, percent: number) =>
    (e: React.MouseEvent<SVGCircleElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setHover({
        variant,
        value,
        percent,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

  return (
    <div ref={containerRef} className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        {total > 0 && (
          <>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth={stroke}
              strokeDasharray={`${animatedLength} ${circumference - animatedLength}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dasharray 0.8s ease-out', cursor: 'pointer' }}
              onMouseMove={handleMove('enabled', enabled, enabledPct)}
              onMouseLeave={() => setHover(null)}
            />
            {disabled > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#EF4444"
                strokeWidth={stroke}
                strokeDasharray={`${circumference - animatedLength} ${animatedLength}`}
                strokeDashoffset={-animatedLength}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{
                  transition: 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out',
                  cursor: 'pointer',
                }}
                onMouseMove={handleMove('disabled', disabled, disabledPct)}
                onMouseLeave={() => setHover(null)}
              />
            )}
          </>
        )}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <p className="font-semibold">
            {hover.variant === 'enabled' ? enabledLabel : disabledLabel}
          </p>
          <p className="text-gray-300">
            {hover.value} ({hover.percent}%)
          </p>
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}