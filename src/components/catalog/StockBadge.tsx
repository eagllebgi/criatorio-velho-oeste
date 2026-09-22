import { Badge } from "@/components/ui/Badge";
import { getStockStatus } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

// Este selo fica em cima da foto do produto (fundo variável: pode ser claro,
// escuro, colorido...). As cores "translúcidas" do Badge padrão (pensadas
// pra ficar sobre fundo branco/creme, como na tabela do admin) quase somem
// dependendo da foto — mesmo problema de contraste do menu mobile, só que
// aqui a causa é opacidade baixa em vez de containing-block. Por isso aqui
// usamos fundo sólido + sombra, garantindo leitura em qualquer foto.
const overlayClasses: Record<"available" | "low" | "out", string> = {
  available: "bg-brand-green text-white shadow-md shadow-black/10",
  low: "bg-brand-gold text-brand-ink shadow-md shadow-black/10",
  out: "bg-brand-ink text-white shadow-md shadow-black/10",
};

// No celular a grade agora tem 2 colunas, então a foto (e o selo em cima
// dela) fica bem mais estreita. O texto "Indisponível no momento" não cabe
// nesse espaço — por isso usamos uma versão curta só na tela pequena, com
// a frase completa continuando a aparecer a partir do tablet/desktop.
const shortLabel: Record<"available" | "low" | "out", string> = {
  available: "Disponível",
  low: "Últimas unid.",
  out: "Indisponível",
};

export function StockBadge({
  stock,
  lowStockThreshold,
}: {
  stock: number;
  lowStockThreshold: number;
}) {
  const status = getStockStatus({ stock, lowStockThreshold });
  const tone = status.level === "available" ? "available" : status.level === "low" ? "low" : "out";

  return (
    <Badge tone={tone} className={cn(overlayClasses[tone], "max-w-full truncate")}>
      <span className="sm:hidden">{shortLabel[tone]}</span>
      <span className="hidden sm:inline">{status.label}</span>
    </Badge>
  );
}
