import { useEffect, useState } from "react"
import { Navigate, Outlet, useParams } from "react-router"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { CompanyService } from "@/api/services/company-service"
import type { CompanyMemberRole } from "@/api/model"

const companyService = new CompanyService()

const ALLOWED_ROLES: CompanyMemberRole[] = ["OWNER", "RH", "MANAGER", "ADMIN"]

type Status = "loading" | "allowed" | "denied"

export default function ProtectedCompanyRoute() {
  const { slug } = useParams<{ slug: string }>()
  // useAuth ensures session is hydrated even on direct navigation to company routes
  const { user, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState<Status>("loading")

  useEffect(() => {
    // Wait until session check is done and we have a user + slug
    if (authLoading || !user || !slug) return

    companyService
      .getMembers(slug, 0, 500)
      .then((res) => {
        const member = res.data.content.find((m) => m.email === user.email)
        if (!member || !ALLOWED_ROLES.includes(member.role)) {
          setStatus("denied")
        } else {
          setStatus("allowed")
        }
      })
      .catch(() => {
        // 401 → axios interceptor redirects to /sign-in
        // other errors → deny access
        setStatus("denied")
      })
  }, [slug, user, authLoading])

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
