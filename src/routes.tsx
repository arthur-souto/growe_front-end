import { createBrowserRouter, redirect } from "react-router"
import { lazy } from "react"

export const routes = createBrowserRouter([
  {
    path: "/",
    Component: lazy(() => import("./layouts/root-layout.tsx")),
    children: [
      {
        index: true,
        loader: () => redirect("/sign-in"),
      },
      {
        path: "/sign-in",
        Component: lazy(() => import("./features/auth/sign-in.tsx")),
      },
      {
        path: "/home",
        Component: lazy(() => import("./layouts/home-layout.tsx")),
        children: [
          {
            index: true,
            Component: lazy(() => import("./features/home/home.tsx")),
          },
          {
            path: "companies",
            Component: lazy(
              () => import("./features/companies/companies-space.tsx")
            ),
          },
        ],
      },
      {
        path: "my-company/:slug",
        Component: lazy(() => import("./layouts/company-layout.tsx")),
        children: [
          {
            Component: lazy(() => import("./components/protected-company-route.tsx")),
            children: [
              {
                index: true,
                Component: lazy(
                  () => import("./features/companies/company-space.tsx")
                ),
              },
              {
                path: "configuracoes",
                Component: lazy(
                  () => import("./features/companies/company-settings.tsx")
                ),
              },
              {
                path: "membros",
                Component: lazy(
                  () => import("./features/companies/members/members-page.tsx")
                ),
              },
              {
                path: "ciclos",
                Component: lazy(
                  () => import("./features/companies/cycles/cycles-page.tsx")
                ),
              },
              {
                path: "ciclos/:cycleId/tarefas",
                Component: lazy(
                  () => import("./features/companies/tasks/tasks-page.tsx")
                ),
              },
              {
                path: "competencias",
                Component: lazy(
                  () => import("./features/companies/competencies/competencies-page.tsx")
                ),
              },
              {
                path: "avaliacoes",
                Component: lazy(
                  () => import("./features/companies/assessments/assessments-page.tsx")
                ),
              },
              {
                path: "minhas-tarefas",
                Component: lazy(
                  () => import("./features/companies/tasks/my-tasks-page.tsx")
                ),
              },
              {
                path: "meu-dashboard",
                Component: lazy(
                  () => import("./features/companies/dashboard/personal-dashboard-page.tsx")
                ),
              },
              {
                path: "dashboard-equipe",
                Component: lazy(
                  () => import("./features/companies/dashboard/team-dashboard-page.tsx")
                ),
              },
              {
                path: "dashboard-equipe/:memberId",
                Component: lazy(
                  () => import("./features/companies/dashboard/personal-dashboard-page.tsx")
                ),
              },
            ],
          },
        ],
      },
      {
        path: "/unauthorized",
        Component: lazy(() => import("./features/unauthorized.tsx")),
      },
    ],
  },
])
