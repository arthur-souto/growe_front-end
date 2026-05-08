import * as React from "react"
import { format, parseISO, isValid, set } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateTimePickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function parseValue(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const d = parseISO(value)
  return isValid(d) ? d : undefined
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Selecione data e hora",
  className,
  disabled,
}: DateTimePickerProps) {

  const [open, setOpen] = React.useState(false)
  const [localHours, setLocalHours] = React.useState("00")
  const [localMinutes, setLocalMinutes] = React.useState("00")

  const selected = parseValue(value)

  React.useEffect(() => {
    if (open) {
      setLocalHours(selected ? String(selected.getHours()).padStart(2, "0") : "00")
      setLocalMinutes(selected ? String(selected.getMinutes()).padStart(2, "0") : "00")
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function emit(date: Date, h: number, m: number) {
    const combined = set(date, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
    onChange?.(format(combined, "yyyy-MM-dd'T'HH:mm"))
  }

  function handleDaySelect(date: Date | undefined) {
    if (!date) return
    emit(date, clamp(parseInt(localHours, 10) || 0, 0, 23), clamp(parseInt(localMinutes, 10) || 0, 0, 59))
  }

  function handleHoursBlur() {
    const h = clamp(parseInt(localHours, 10) || 0, 0, 23)
    const padded = String(h).padStart(2, "0")
    setLocalHours(padded)
    if (selected) emit(selected, h, clamp(parseInt(localMinutes, 10) || 0, 0, 59))
  }

  function handleMinutesBlur() {
    const m = clamp(parseInt(localMinutes, 10) || 0, 0, 59)
    const padded = String(m).padStart(2, "0")
    setLocalMinutes(padded)
    if (selected) emit(selected, clamp(parseInt(localHours, 10) || 0, 0, 23), m)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start rounded-none font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? format(selected, "dd/MM/yyyy HH:mm", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          captionLayout="dropdown"
          locale={ptBR}
        />
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="number"
            min={0}
            max={23}
            value={localHours}
            onChange={(e) => setLocalHours(e.target.value)}
            onBlur={handleHoursBlur}
            className="w-20 border border-input bg-background px-2 py-1 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Horas"
          />
          <span className="select-none text-muted-foreground">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={localMinutes}
            onChange={(e) => setLocalMinutes(e.target.value)}
            onBlur={handleMinutesBlur}
            className="w-20 border border-input bg-background px-2 py-1 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Minutos"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
