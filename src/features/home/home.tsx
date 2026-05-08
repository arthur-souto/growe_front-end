import { useNavigate } from "react-router"
import { Building2, ChevronRight, ClipboardCheck, ListTodo, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Ciclos de Avaliação",
    description:
      "Crie períodos de avaliação estruturados com datas de início e fim. Organize quem avalia quem dentro de cada ciclo.",
  },
  {
    icon: Users,
    title: "Avaliação 360°",
    description:
      "Combine autoavaliação, avaliação por pares e avaliação por gestores para uma visão completa do desempenho.",
  },
  {
    icon: ListTodo,
    title: "Tarefas de Avaliação",
    description:
      "Cada membro recebe suas tarefas com prazo definido. Acompanhe pendências e garanta que nenhuma avaliação fique em aberto.",
  },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.fullName?.split(" ")[0] ?? "Usuário"

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <div className="border-b px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Growe — Gestão de Desempenho
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Olá, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Bem-vindo de volta. Acesse sua empresa para ver ciclos de avaliação, gerenciar equipes
            e acompanhar o desenvolvimento da sua organização.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => navigate("/home/companies")} className="gap-2">
              <Building2 className="size-4" />
              Minhas Empresas
            </Button>
            <Button variant="outline" onClick={() => navigate("/home/companies")} className="gap-1.5">
              Ver tudo
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            Como funciona
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="border px-4 py-4 space-y-2.5">
                <div className="flex size-8 items-center justify-center border bg-muted/50">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold leading-none">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
