import { useContext } from "react"
import type { InfoHeaderUser } from "@/shared/model"
import { AuthContext } from "@/contexts/AuthContext"

export const useUser = () => {
  const { user, setUser, isLoading, setIsLoading } = useContext(AuthContext)

  const addUser = (user: InfoHeaderUser) => setUser(user)
  const removeUser = () => setUser(null)

  return { user, addUser, removeUser, isLoading, setIsLoading }
}
