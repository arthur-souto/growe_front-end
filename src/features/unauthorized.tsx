import { useNavigate } from "react-router"
import { ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center border border-destructive/30 bg-destructive/10">
          <ShieldOff className="size-6 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-base font-semibold">Acesso negado</h1>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="rounded-none"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
        <Button
          className="rounded-none"
          onClick={() => navigate("/home", { replace: true })}
        >
          Ir para o início
        </Button>
      </div>
    </div>
  )
}
