import { type NavigateFunction } from "react-router"


// A Global navigator service to allow navigation from non-component files
class NavigationService {
  private navigator: NavigateFunction | null = null

  setNavigator(navigate: NavigateFunction) {
    this.navigator = navigate
  }

  navigate(path: string, options?: { replace?: boolean; state?: unknown }) {
    if (!this.navigator) {
      console.warn("Navigator not initialized")
      return
    }
    this.navigator(path, options)
  }

  back() {
    this.navigator?.(-1)
  }
  forward() {
    this.navigator?.(1)
  }
}

export const navigationService = new NavigationService()
