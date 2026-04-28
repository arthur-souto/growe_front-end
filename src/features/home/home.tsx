import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import { Rocket, Users, BarChart3, Settings, Building2, Hand } from "lucide-react"

const TUTORIALS = [
  {
    id: 1,
    title: "Primeiros Passos",
    description: "Aprenda o básico sobre como gerenciar suas empresas e projetos",
    Icon: Rocket,
  },
  {
    id: 2,
    title: "Gestão de Usuários",
    description: "Entenda como gerenciar membros da equipe e permissões",
    Icon: Users,
  },
  {
    id: 3,
    title: "Análises e Relatórios",
    description: "Acompanhe suas métricas de negócio e gere relatórios",
    Icon: BarChart3,
  },
  {
    id: 4,
    title: "Integração via API",
    description: "Integre com serviços de terceiros usando nossa API",
    Icon: Settings,
  },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <section className="w-full flex-1">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <Hand className="size-6 text-primary" />
              Olá, {user?.fullName?.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo de volta ao Growe. O que vamos fazer hoje?
            </p>
          </div>
          <Button onClick={() => navigate("/home/companies")}>
            <Building2 className="mr-2 size-4" />
            Minhas empresas
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Tutorials Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Tutoriais</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {TUTORIALS.map((tutorial) => (
                <Card
                  key={tutorial.id}
                  size="sm"
                  className="group cursor-pointer transition-all hover:ring-accent/50 hover:shadow-md"
                >
                  <CardHeader>
                    <div className="space-y-2">
                      <tutorial.Icon className="size-6 text-primary" />
                      <CardTitle className="text-sm">{tutorial.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {tutorial.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Button variant="secondary" className="w-full">
              Ver todos os tutoriais
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}