import { useEffect, useState } from "react"
import { NavLink, useNavigate, useParams } from "react-router"
import {
  Building2,
  ChevronDown,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Settings,
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
import type { ResumeCompanyResponse } from "@/api/model"

const companyService = new CompanyService()

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "" },
  { label: "Membros", icon: Users, path: "/membros" },
  { label: "Configurações", icon: Settings, path: "/configuracoes" }
]

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
  const navigate = useNavigate()
  const { user } = useUser()
  const { logout } = useAuth()
  const [companies, setCompanies] = useState<ResumeCompanyResponse[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  const activeCompany = companies.find((c) => c.slug === slug)

  useEffect(() => {
    companyService
      .getMyCompanies()
      .then((res) => setCompanies(res.data.content))
      .finally(() => setLoadingCompanies(false))
  }, [])

  return (
    <Sidebar collapsible="icon">
      {/* Workspace switcher */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                    {activeCompany?.companyImage ? (
                      <img
                        src={activeCompany.companyImage}
                        alt={activeCompany.name}
                        className="size-full rounded-md object-cover"
                      />
                    ) : (
                      <Building2 className="size-4" />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    {loadingCompanies ? (
                      <Skeleton className="h-3.5 w-24" />
                    ) : (
                      <>
                        <span className="truncate font-semibold">
                          {activeCompany?.name ?? "Empresa"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground capitalize">
                          {activeCompany?.plan.toLowerCase() ?? "—"}
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                {companies.map((company) => (
                  <DropdownMenuItem
                    key={company.slug}
                    onSelect={() => navigate(`/my-company/${company.slug}`)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border bg-background shrink-0">
                      {company.companyImage ? (
                        <img
                          src={company.companyImage}
                          alt={company.name}
                          className="size-full rounded-sm object-cover"
                        />
                      ) : (
                        <Building2 className="size-3.5 shrink-0" />
                      )}
                    </div>
                    <span className="truncate">{company.name}</span>
                    {company.slug === slug && (
                      <ChevronDown className="ml-auto size-3 -rotate-90 opacity-60" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
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
