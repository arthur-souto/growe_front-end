import { createContext } from "react";
import type { InfoHeaderUser } from "@/shared/model";


interface AuthContext {
    user: InfoHeaderUser | null
    setUser: (user: InfoHeaderUser | null) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
}


export const AuthContext = createContext<AuthContext>({
    user: null,
    setUser: () => {},
    isLoading: true,
    setIsLoading: () => {}
})