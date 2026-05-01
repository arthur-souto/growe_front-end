export function buildRefreshMessage(activated: number, closed: number): string {
  const parts: string[] = []
  if (activated > 0) parts.push(`${activated} ativado${activated !== 1 ? "s" : ""}`)
  if (closed > 0) parts.push(`${closed} encerrado${closed !== 1 ? "s" : ""}`)
  return parts.length > 0 ? parts.join(", ") : "Nenhuma alteração de status."
}
