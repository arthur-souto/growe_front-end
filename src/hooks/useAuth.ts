import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useUser } from "./useUser"
import { instance } from "@/api/instance"
import type { InfoHeaderUser } from "@/shared/model"

export const useAuth = () => {
  const { user, addUser, removeUser, isLoading, setIsLoading } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    instance
      .get<InfoHeaderUser>("/users/me")
      .then((res) => addUser(res.data))
      .catch(() => {
        removeUser()
        navigate("/sign-in") 
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = (user: InfoHeaderUser) => {
    addUser(user)
  }

  const logout = async () => {
    await instance.post("/auth/logout")
    removeUser()
    navigate("/sign-in") 
  }

  return { user, login, logout, isLoading }
}