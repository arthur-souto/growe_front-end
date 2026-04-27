import { useAuth } from "@/hooks/useAuth"
import Header from "@/components/header"
import { Outlet } from "react-router"
import { Spinner } from "@/components/ui/spinner"

export default function RootLayout() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}