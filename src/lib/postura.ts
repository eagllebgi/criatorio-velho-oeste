import type { LotePostura } from "@/lib/types/domain";
import type { PosturaSeriesPoint } from "@/components/admin/PosturaBarChart";

/** Soma a quantidade postada por dia (todos os destinos juntos) nos últimos
 * `dias`, preenchendo com zero os dias sem coleta — assim o gráfico sempre
 * mostra o período inteiro, não só os dias com lançamento. Compartilhado
 * entre o gráfico por baia (BaiasManager) e o gráfico geral do Dashboard
 * (DashboardPosturaChart), pra manter os dois sempre calculando do mesmo
 * jeito. */
export function buildDailySeries(lotes: LotePostura[], dias: number): PosturaSeriesPoint[] {
  const totals = new Map<string, number>();
  for (const lote of lotes) {
    totals.set(lote.dataPostura, (totals.get(lote.dataPostura) ?? 0) + lote.quantidade);
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const serie: PosturaSeriesPoint[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    serie.push({ data: key, quantidade: totals.get(key) ?? 0 });
  }
  return serie;
}
