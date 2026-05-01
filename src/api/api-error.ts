type AxiosError = {
  response?: { status?: number; data?: { message?: string } }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Dados inválidos",
  401: "Sessão expirada. Faça login novamente",
  403: "Você não tem permissão para realizar esta ação",
  404: "Recurso não encontrado",
  409: "Conflito com dados existentes",
  422: "Dados inválidos",
  500: "Erro interno do servidor",
}

export function getApiErrorMessage(err: unknown, fallback = "Ocorreu um erro inesperado"): string {
  const e = err as AxiosError
  const apiMessage = e?.response?.data?.message
  if (apiMessage) return apiMessage
  const status = e?.response?.status
  if (status !== undefined && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]
  return fallback
}
