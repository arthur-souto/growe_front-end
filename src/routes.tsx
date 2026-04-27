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
            Component: lazy(() => import("./features/home/home.tsx"))
          },
          {
            path: "companies",
            Component: lazy(() => import("./features/companies/companies-space.tsx")),
          },
        ],
      },
    ],
  },
])
