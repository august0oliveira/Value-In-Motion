function KpiCard({ titulo, valor, detalhe = "", destaque = "text-ink", className = "" }) {
  return (
    <article
      className={`h-full min-h-[118px] rounded-2xl border border-graphite/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(19,20,23,0.08)] ${className}`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">{titulo}</p>
      <p className={`mt-2 text-2xl font-bold ${destaque}`} style={{ fontFamily: "Fraunces, serif" }}>
        {valor}
      </p>
      {detalhe ? <p className="mt-1 text-xs text-ink/60">{detalhe}</p> : null}
    </article>
  );
}

export default function DashboardResumoKpis({ totais, saldoContas, formatoMoeda }) {
  return (
    <section className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">Resumo</p>
      </div>
      <div className="grid gap-3 grid-cols-6">
        <KpiCard
          className="col-span-6"
          titulo="Saldo em conta atual"
          valor={formatoMoeda.format(saldoContas)}
          destaque="text-ink"
        />
        <KpiCard
          className="col-span-2"
          titulo="Receitas"
          valor={formatoMoeda.format(totais.receitas)}
          destaque="text-ink"
        />
        <KpiCard
          className="col-span-2"
          titulo="Despesas"
          valor={formatoMoeda.format(totais.despesas)}
          destaque="text-ink"
        />
        <KpiCard
          className="col-span-2"
          titulo="Taxa poupança (30 dias)"
          valor={totais.taxaPoupanca === null ? "-" : `${totais.taxaPoupanca.toFixed(1)}%`}
          destaque="text-ink"
        />
      </div>
    </section>
  );
}