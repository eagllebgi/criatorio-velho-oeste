"use client";

function formatDiaMes(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export interface PosturaSeriesPoint {
  /** "YYYY-MM-DD" */
  data: string;
  quantidade: number;
}

/** Gráfico de barras simples (SVG puro, sem biblioteca externa) mostrando
 * quantidade de ovos postos por dia — passa o mouse ou toca numa barra pra
 * ver a data e a quantidade exata (tooltip nativo do navegador, via
 * `<title>`). Feito de propósito sem dependência nova, pra manter o site
 * leve e simples de manter. */
export function PosturaBarChart({ data }: { data: PosturaSeriesPoint[] }) {
  if (data.length === 0) return null;

  const max = Math.max(1, ...data.map((d) => d.quantidade));
  const barWidth = 10;
  const totalWidth = data.length * barWidth;

  // Só alguns rótulos de data (primeiro, meio, último) pra não lotar o eixo
  // quando o período tem muitos dias.
  const labelIndexes = new Set(
    [0, Math.floor(data.length / 2), data.length - 1].filter((i) => i >= 0 && i < data.length),
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${totalWidth} 100`}
        preserveAspectRatio="none"
        className="h-36 w-full overflow-visible"
      >
        {data.map((d, i) => {
          const h = d.quantidade > 0 ? Math.max(3, (d.quantidade / max) * 94) : 0;
          return (
            <rect
              key={d.data}
              x={i * barWidth + barWidth * 0.2}
              y={100 - h}
              width={barWidth * 0.6}
              height={h}
              rx={1}
              className={d.quantidade > 0 ? "fill-brand-green" : "fill-brand-sand"}
            >
              <title>{`${formatDiaMes(d.data)}: ${d.quantidade} ovo${d.quantidade === 1 ? "" : "s"}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1.5 flex justify-between text-[0.65rem] text-brand-ink/40">
        {data.map((d, i) =>
          labelIndexes.has(i) ? <span key={d.data}>{formatDiaMes(d.data)}</span> : null,
        )}
      </div>
    </div>
  );
}
