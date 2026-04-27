import { useAuth } from "@/hooks/useAuth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Header() {
  const { user, logout } = useAuth()

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-8">
        {/* Logo/Brand Section */}
       

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
