import { useRef, useState } from "react"
import { toast } from "sonner"
import { CalendarRange } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CycleService } from "@/api/services/cycle-service"
import { getApiErrorMessage } from "@/api/api-error"
import type { CreateEvaluationCycleRequest, CycleResumeResponse } from "@/api/model"

const cycleService = new CycleService()

const DEFAULT_COLOR = "#6366f1"

interface FormState {
  name: string
  startDate: string
  endDate: string
  description: string
  color: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const EMPTY_FORM: FormState = {
  name: "",
  startDate: "",
  endDate: "",
  description: "",
  color: DEFAULT_COLOR,
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleHexInput(raw: string) {
    const normalized = raw.startsWith("#") ? raw : `#${raw}`
    onChange(normalized)
  }

  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="size-9 shrink-0 border border-input"
        style={{ backgroundColor: isValidHex ? value : DEFAULT_COLOR }}
        aria-label="Abrir seletor de cor"
      />
      <input
        ref={inputRef}
        type="color"
        value={isValidHex ? value : DEFAULT_COLOR}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
      <Input
        value={value}
        onChange={(e) => handleHexInput(e.target.value)}
        placeholder="#6366f1"
        className="rounded-none font-mono"
        maxLength={7}
      />
    </div>
  )
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = "Nome obrigatório"
  if (!form.description.trim()) errors.description = "Descrição obrigatória"
  if (!form.startDate) errors.startDate = "Data de início obrigatória"
  if (!form.endDate) {
    errors.endDate = "Data de fim obrigatória"
  } else if (form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
    errors.endDate = "Data de fim deve ser posterior à data de início"
  }
  return errors
}

function toPayload(form: FormState): CreateEvaluationCycleRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    color: form.color,
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
  }
}

interface Props {
  open: boolean
  slug: string
  onClose: () => void
  onCreated: (cycle: CycleResumeResponse) => void
}

export function CreateCycleDialog({ open, slug, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  function reset() {
    setForm(EMPTY_FORM)
    setErrors({})
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = toPayload(form)
    setSaving(true)
    try {
      const res = await cycleService.createCycle(slug, payload)
      toast.success(`Ciclo "${payload.name}" criado com sucesso.`)
      onCreated({
        id: res.data.id,
        name: payload.name,
        description: payload.description,
        color: payload.color,
        isActive: false,
        startDate: payload.startDate,
        endDate: payload.endDate,
        createdAt: new Date().toISOString(),
        creatorName: "",
        creatorProfile: "",
        creatorRole: "OWNER",
      })
      reset()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao criar ciclo."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="size-4" />
            Novo ciclo de avaliação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <Field id="cc-name" label="Nome" error={errors.name}>
            <Input
              id="cc-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Ex: Avaliação Q1 2025"
              autoComplete="off"
              className="rounded-none"
            />
          </Field>

          <Field id="cc-description" label="Descrição" error={errors.description}>
            <Textarea
              id="cc-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Descreva o objetivo deste ciclo de avaliação"
              className="rounded-none resize-none"
              rows={3}
            />
          </Field>

          <Field label="Cor" error={errors.color}>
            <ColorPicker
              value={form.color}
              onChange={(v) => setField("color", v)}
            />
          </Field>

          <Field id="cc-start" label="Data de Início" error={errors.startDate}>
            <Input
              id="cc-start"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              className="rounded-none"
            />
          </Field>

          <Field id="cc-end" label="Data de Fim" error={errors.endDate}>
            <Input
              id="cc-end"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
              className="rounded-none"
            />
          </Field>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Criando…" : "Criar ciclo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
