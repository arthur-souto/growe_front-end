import { NavLink, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  CalendarRange,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldOff,
  Users,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/useUser"
import { useAuth } from "@/hooks/useAuth"
import { CompanyService } from "@/api/services/company-service"
import { getApiErrorMessage } from "@/api/api-error"

const companyService = new CompanyService()

const ALL_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "", roles: ["OWNER", "RH", "MANAGER", "ADMIN", "EMPLOYEE"] },
  { label: "Membros",   icon: Users,           path: "/membros",       roles: ["OWNER", "RH", "MANAGER", "ADMIN"] },
  { label: "Ciclos",    icon: CalendarRange,    path: "/ciclos",        roles: null },
  { label: "Configurações", icon: Settings,    path: "/configuracoes", roles: ["OWNER", "RH", "MANAGER", "ADMIN"] },
] as const

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function AppSidebar() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useUser()
  const { logout } = useAuth()

  const { data: company, isLoading: loadingCompany, isError, error } = useQuery({
    queryKey: ["company", slug],
    queryFn: () => companyService.getCompany(slug!).then((r) => r.data),
    enabled: !!slug,
  })
  const companyError = isError ? getApiErrorMessage(error, "Erro ao carregar empresa") : null

  const myRole = company?.members.find((m) => m.email === user?.email)?.role ?? null
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => item.roles === null || (myRole && (item.roles as readonly string[]).includes(myRole))
  )

  return (
    <Sidebar collapsible="icon">
      {/* Company header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              <div className={`flex aspect-square size-8 items-center justify-center rounded-md shrink-0 ${
                companyError
                  ? "bg-destructive/10 text-destructive"
                  : "bg-sidebar-primary text-sidebar-primary-foreground"
              }`}>
                {companyError ? (
                  <ShieldOff className="size-4" />
                ) : company?.companyImage ? (
                  <img
                    src={company.companyImage}
                    alt={company.name}
                    className="size-full rounded-md object-cover"
                  />
                ) : (
                  <Building2 className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {loadingCompany ? (
                  <Skeleton className="h-3.5 w-24" />
                ) : companyError ? (
                  <>
                    <span className="truncate font-semibold text-destructive">Sem acesso</span>
                    <span className="truncate text-xs text-destructive/70">{companyError}</span>
                  </>
                ) : (
                  <>
                    <span className="truncate font-semibold">
                      {company?.name ?? "Empresa"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground capitalize">
                      {company?.plan.toLowerCase() ?? "—"}
                    </span>
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, icon: Icon, path }) => (
                <SidebarMenuItem key={label}>
                  <NavLink
                    to={`/my-company/${slug}${path}`}
                    end={path === ""}
                  >
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild={false}
                        isActive={isActive}
                        tooltip={label}
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 rounded-md shrink-0">
                    <AvatarImage src={user?.profileImage ?? undefined} alt={user?.fullName} />
                    <AvatarFallback className="rounded-md text-xs">
                      {user ? getInitials(user.fullName) : "—"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.fullName}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 rounded-md">
                      <AvatarImage src={user?.profileImage ?? undefined} alt={user?.fullName} />
                      <AvatarFallback className="rounded-md text-xs">
                        {user ? getInitials(user.fullName) : "—"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid leading-tight">
                      <span className="truncate text-sm font-semibold">{user?.fullName}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => logout()}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
