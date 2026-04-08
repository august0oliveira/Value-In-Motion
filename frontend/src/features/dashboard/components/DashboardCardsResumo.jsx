export default function DashboardCardsResumo({ insights, previsao30Dias, formatoMoeda }) {
  return (
    <section className="mt-4 grid gap-4 grid-cols-2">
      <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-5 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <h2 className="text-base font-semibold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          Insights
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-ink/70">
          {insights.map((item) => (
            <li key={item} className="rounded-xl border border-graphite/10 bg-paper px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-5 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <h2 className="text-base font-semibold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          Projeção 30 dias
        </h2>
        <div className="mt-3 space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span>Entradas previstas</span>
            <span className="font-semibold text-ink">{formatoMoeda.format(previsao30Dias.entradas)}</span>
          </p>
          <p className="flex items-center justify-between">
            <span>Saídas previstas</span>
            <span className="font-semibold text-ink">{formatoMoeda.format(previsao30Dias.saidas)}</span>
          </p>
          <p className="flex items-center justify-between border-t border-graphite/10 pt-2">
            <span>Saldo projetado</span>
            <span className="font-semibold text-ink">{formatoMoeda.format(previsao30Dias.saldo)}</span>
          </p>
        </div>
      </article>
    </section>
  );
}