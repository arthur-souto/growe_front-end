import { useState, useRef } from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, FileText, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CompanyService } from "@/api/services/company-service"
import type { ImportSummaryResponse } from "@/api/model"

const companyService = new CompanyService()

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type State = "idle" | "loading" | "success" | "error"

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  onImported: () => void
}

export function ImportMembersDialog({ open, onClose, slug, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>("idle")
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    if (state === "loading") return
    setFile(null)
    setState("idle")
    setSummary(null)
    setErrorMessage(null)
    onClose()
  }

  function acceptFile(f: File) {
    const ext = "." + f.name.split(".").pop()?.toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error(`Formato não suportado. Use ${ACCEPTED_EXTENSIONS.join(", ")}`)
      return
    }
    setFile(f)
    setState("idle")
    setSummary(null)
    setErrorMessage(null)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) acceptFile(f)
    e.target.value = ""
  }

  async function handleImport() {
    if (!file) return
    setState("loading")
    try {
      const res = await companyService.importMembers(slug, file)
      const data = res.data
      setSummary(data)
      setState("success")
      toast.success(`Importação concluída: ${data.created} criados, ${data.skipped} ignorados.`)
      onImported()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Erro ao importar membros."
      setErrorMessage(msg)
      setState("error")
      toast.error(msg)
    }
  }

  const isDone = state === "success" || state === "error"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-4" />
            Importar membros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {!isDone && state !== "loading" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 cursor-pointer transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/20"
              }`}
            >
              <div className="flex size-10 items-center justify-center border bg-muted">
                <Upload className="size-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {dragging ? "Solte o arquivo aqui" : "Arraste ou clique para selecionar"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">PDF, DOCX ou TXT</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                className="hidden"
                onChange={onInputChange}
              />
            </div>
          )}

          {file && !isDone && state !== "loading" && (
            <div className="flex items-center gap-3 border bg-muted/30 px-4 py-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="size-8 border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Analisando arquivo…</p>
            </div>
          )}

          {state === "success" && summary && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">
                  {summary.created} {summary.created === 1 ? "membro criado" : "membros criados"}
                </p>
              </div>
              {summary.skipped > 0 && (
                <div className="flex items-center gap-3 border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                  <p className="text-sm font-medium text-amber-300">
                    {summary.skipped} ignorados (email já existe)
                  </p>
                </div>
              )}
              {summary.erros?.length > 0 && (
                <div className="space-y-1">
                  {summary.erros.map((e, i) => (
                    <div key={i} className="border border-destructive/30 bg-destructive/10 px-4 py-2">
                      <p className="text-xs text-destructive">{e}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {state === "error" && errorMessage && (
            <div className="flex items-center gap-3 border border-destructive/30 bg-destructive/10 px-4 py-3">
              <X className="size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={state === "loading"}>
            {isDone ? "Fechar" : "Cancelar"}
          </Button>
          {!isDone && (
            <Button onClick={handleImport} disabled={!file || state === "loading"}>
              {state === "loading" ? "Importando…" : "Importar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
