import { NavLink } from "react-router"
import { useAuth } from "@/hooks/useAuth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Home, Building2 } from "lucide-react"

const NAV_LINKS = [
  { to: "/home", label: "Início", Icon: Home },
  { to: "/home/companies", label: "Empresas", Icon: Building2 },
]

export default function Header() {
  const { user, logout } = useAuth()

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/home"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end sm:flex">
            <p className="text-sm font-medium text-foreground">
              {user?.fullName}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <Avatar size="default">
            <AvatarImage src={user?.profileImage!} alt={user?.fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <Button
            variant="outline"
            size="sm"
            onClick={() => logout?.()}
            className="ml-2"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}
