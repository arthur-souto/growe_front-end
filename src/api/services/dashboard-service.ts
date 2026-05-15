import { instance } from "../instance"
import type { PersonalDashboardResponse, TeamMemberSummaryResponse } from "../model"

const BASE = "/companies"

export class DashboardService {
  getPersonalDashboard(slug: string) {
    return instance.get<PersonalDashboardResponse>(`${BASE}/${slug}/dashboard`)
  }

  getMemberDashboard(slug: string, memberId: string) {
    return instance.get<PersonalDashboardResponse>(`${BASE}/${slug}/dashboard/${memberId}`)
  }

  getTeamDashboard(slug: string) {
    return instance.get<TeamMemberSummaryResponse[]>(`${BASE}/${slug}/dashboard/team`)
  }
}

export const dashboardService = new DashboardService()
