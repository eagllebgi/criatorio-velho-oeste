import { Badge } from "@/components/ui/Badge";
import { getStockStatus } from "@/lib/types/domain";

export function StockBadge({
  stock,
  lowStockThreshold,
}: {
  stock: number;
  lowStockThreshold: number;
}) {
  const status = getStockStatus({ stock, lowStockThreshold });
  const tone = status.level === "available" ? "available" : status.level === "low" ? "low" : "out";

  return <Badge tone={tone}>{status.label}</Badge>;
}
