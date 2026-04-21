import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { routes } from "./routes"
import {Toaster} from "@/components/ui/sonner"
import "./index.css"


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster  position="top-right" />
      <RouterProvider router={routes} />
    </ThemeProvider>
  </StrictMode>
)
