import Link from "next/link";
import {
  Egg,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Bird,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFinanceiroMesAdmin } from "@/lib/data/admin";
import { formatBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("stock, low_stock_threshold, active");

  if (error || !data) {
    return { total: 0, available: 0, outOfStock: 0, lowStock: 0 };
  }

  let available = 0;
  let outOfStock = 0;
  let lowStock = 0;

  for (const p of data) {
    if (p.stock <= 0) outOfStock += 1;
    else if (p.stock <= p.low_stock_threshold) lowStock += 1;
    if (p.active && p.stock > 0) available += 1;
  }

  return { total: data.length, available, outOfStock, lowStock };
}

export default async function AdminDashboardPage() {
  const [stats, financeiroMes] = await Promise.all([getDashboardStats(), getFinanceiroMesAdmin()]);

  const vendasDoMes = financeiroMes
    .filter((f) => f.tipo === "entrada")
    .reduce((sum, f) => sum + f.valor, 0);
  const gastosDoMes = financeiroMes
    .filter((f) => f.tipo === "saida")
    .reduce((sum, f) => sum + f.valor, 0);
  const caixaDoMes = vendasDoMes - gastosDoMes;

  const cards = [
    {
      label: "Produtos cadastrados",
      value: stats.total,
      icon: Egg,
      tone: "text-brand-green bg-brand-green/10",
    },
    {
      label: "Produtos disponíveis",
      value: stats.available,
      icon: CheckCircle2,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Sem estoque",
      value: stats.outOfStock,
      icon: XCircle,
      tone: "text-red-700 bg-red-50",
    },
    {
      label: "Estoque baixo",
      value: stats.lowStock,
      icon: AlertTriangle,
      tone: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Visão geral do catálogo e da produção do Criatório Velho Oeste.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/financeiro"
          className="rounded-2xl border border-brand-sand/70 bg-white p-5 hover:border-brand-green/50"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-2xl font-semibold text-brand-ink">{formatBRL(caixaDoMes)}</p>
          <p className="text-sm text-brand-ink/60">Caixa do mês</p>
        </Link>
        <Link
          href="/admin/financeiro"
          className="rounded-2xl border border-brand-sand/70 bg-white p-5 hover:border-brand-green/50"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-2xl font-semibold text-brand-ink">{formatBRL(vendasDoMes)}</p>
          <p className="text-sm text-brand-ink/60">Vendas do mês</p>
        </Link>
        <Link
          href="/admin/aves"
          className="rounded-2xl border border-brand-sand/70 bg-white p-5 hover:border-brand-green/50"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/15 text-brand-brown-dark">
            <Bird className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-2xl font-semibold text-brand-ink">Plantel</p>
          <p className="text-sm text-brand-ink/60">Ver baias, aves e posturas</p>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-brand-sand/70 bg-white p-5"
          >
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${card.tone}`}>
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-2xl font-semibold text-brand-ink">{card.value}</p>
            <p className="text-sm text-brand-ink/60">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/produtos"
          className="rounded-2xl border border-brand-sand/70 bg-white p-5 hover:border-brand-green/50"
        >
          <h2 className="font-serif text-lg font-semibold text-brand-ink">Produtos</h2>
          <p className="mt-1 text-sm text-brand-ink/60">
            Veja tudo (ovos e aves), filtre por tipo e edite preço e estoque direto na lista.
          </p>
        </Link>
        <Link
          href="/admin/produtos/novo"
          className="rounded-2xl border border-brand-sand/70 bg-white p-5 hover:border-brand-green/50"
        >
          <h2 className="font-serif text-lg font-semibold text-brand-ink">Cadastrar novo item</h2>
          <p className="mt-1 text-sm text-brand-ink/60">
            Adicione um ovo fértil ou ave viva ao catálogo sem mexer em código.
          </p>
        </Link>
      </div>
    </div>
  );
}
