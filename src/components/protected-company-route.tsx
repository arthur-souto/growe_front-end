import { useMemo } from "react"
import { Navigate, Outlet, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { CompanyService } from "@/api/services/company-service"
import type { CompanyMemberRole } from "@/api/model"

const companyService = new CompanyService()

const ALLOWED_ROLES: CompanyMemberRole[] = ["OWNER", "RH", "MANAGER", "ADMIN", "EMPLOYEE"]

export default function ProtectedCompanyRoute() {
  const { slug } = useParams<{ slug: string }>()
  // useAuth ensures session is hydrated even on direct navigation to company routes
  const { user, isLoading: authLoading } = useAuth()

  const { data: members, isLoading: membersLoading, isError } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 500).then((r) => r.data.content),
    enabled: !!slug && !authLoading && !!user,
  })

  const status = useMemo(() => {
    if (authLoading || !user || !slug || membersLoading) return "loading"
    // 401 → axios interceptor redirects to /sign-in; other errors → deny
    if (isError || !members) return "denied"
    const member = members.find((m) => m.email === user.email)
    if (!member || !ALLOWED_ROLES.includes(member.role)) return "denied"
    return "allowed"
  }, [authLoading, membersLoading, isError, members, user, slug])

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center text-muted-foreground">
        <Spinner />
      </div>
    )
  }

  if (status === "denied") {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
