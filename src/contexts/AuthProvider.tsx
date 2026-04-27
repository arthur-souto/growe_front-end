import { useState } from "react"
import { AuthContext } from "./AuthContext"
import type { InfoHeaderUser } from "@/shared/model"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<InfoHeaderUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, setIsLoading }}>
      {children}
    </AuthContext.Provider>
  )
}