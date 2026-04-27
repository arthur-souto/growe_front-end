import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { routes } from "./routes"
import {Toaster} from "@/components/ui/sonner"
import "./index.css"
import { AuthProvider } from "./contexts/AuthProvider"


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster  position="top-right" />
      <AuthProvider>
        <RouterProvider router={routes} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
