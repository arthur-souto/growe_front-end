import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function CompanyLayout() {
  return (
    <TooltipProvider>
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center h-10 border-b px-2 md:hidden shrink-0">
          <SidebarTrigger />
        </div>
        <Outlet />
      </main>
    </SidebarProvider>
    </TooltipProvider>
  )
}