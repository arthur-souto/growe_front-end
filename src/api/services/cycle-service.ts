import { instance } from "../instance"
import type {
  CreateEvaluationCycleRequest,
  CycleStatusSummary,
  IdResponse,
  PagedModelCycleResumeResponse,
} from "../model"

const BASE = "/cycles"

export class CycleService {
  getCycles(slug: string, page = 0, size = 500) {
    return instance.get<PagedModelCycleResumeResponse>(`${BASE}/${slug}`, {
      params: { page, size },
    })
  }

  createCycle(slug: string, payload: CreateEvaluationCycleRequest) {
    return instance.post<IdResponse>(`${BASE}/create/${slug}`, payload)
  }

  refreshCycles(slug: string) {
    return instance.post<CycleStatusSummary>(`${BASE}/${slug}/refresh`)
  }
}
