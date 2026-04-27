import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import { Rocket, Users, BarChart3, Settings } from "lucide-react"

const TUTORIALS = [
  {
    id: 1,
    title: "Getting Started",
    description: "Learn the basics of managing your companies and projects",
    Icon: Rocket,
  },
  {
    id: 2,
    title: "User Management",
    description: "Understand how to manage team members and permissions",
    Icon: Users,
  },
  {
    id: 3,
    title: "Analytics & Reports",
    description: "Track your business metrics and generate reports",
    Icon: BarChart3,
  },
  {
    id: 4,
    title: "API Integration",
    description: "Integrate with third-party services using our API",
    Icon: Settings,
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <section className="w-full flex-1">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Tutorials Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Tutorials</h2>
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
              View All Tutorials
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}