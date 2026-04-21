import { createBrowserRouter, redirect } from "react-router";
import { lazy } from "react";

export const routes = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/sign-in"),
  },
  {
    path: "/sign-in",
    Component: lazy(() => import("./features/sign-in.tsx")),
  },
]);