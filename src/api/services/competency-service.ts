import { instance } from "../instance"
import type {
  CreateCompetencyRequest,
  IdResponse,
  LinkCompetencyRequest,
  PagedModelCompetencyResponse,
} from "../model"

const BASE = "/competencies"

export class CompetencyService {
  listByCompany(slug: string, page = 0, size = 20) {
    return instance.get<PagedModelCompetencyResponse>(`${BASE}/${slug}`, {
      params: { page, size },
    })
  }

  create(slug: string, payload: CreateCompetencyRequest) {
    return instance.post<IdResponse>(`${BASE}/${slug}`, payload)
  }

  delete(slug: string, competencyId: string) {
    return instance.delete(`${BASE}/${slug}/${competencyId}`)
  }

  listByCycle(cycleId: string, page = 0, size = 100) {
    return instance.get<PagedModelCompetencyResponse>(`${BASE}/cycle/${cycleId}`, {
      params: { page, size },
    })
  }

  linkToCycle(cycleId: string, payload: LinkCompetencyRequest) {
    return instance.post<IdResponse>(`${BASE}/cycle/${cycleId}`, payload)
  }

  unlinkFromCycle(cycleId: string, competencyId: string) {
    return instance.delete(`${BASE}/cycle/${cycleId}/${competencyId}`)
  }
}
