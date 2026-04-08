export default function DashboardTendenciaCategoria({ gastosCategoria, formatoMoeda }) {
  const totalGastos = gastosCategoria.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  const maiorValor = Math.max(...gastosCategoria.map((item) => Number(item.valor || 0)), 1);
  const principal = gastosCategoria[0];

  return (
    <section className="mt-4">
      <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-5 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
              Gastos por categoria
            </h2>
            <p className="mt-1 text-xs text-ink/60">
              Comparativo das categorias com maior impacto no período.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-ink/50">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-ink" />
              Valor da categoria
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-graphite/20" />
              Escala relativa
            </span>
          </div>
        </div>

        {gastosCategoria.length === 0 ? (
          <p className="mt-4 text-sm text-ink/70">Nenhuma despesa para exibir.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 grid-cols-3">
              <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink/50">Total</p>
                <p className="mt-1 text-base font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
                  {formatoMoeda.format(totalGastos)}
                </p>
              </div>
              <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink/50">Categorias</p>
                <p className="mt-1 text-base font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
                  {gastosCategoria.length}
                </p>
              </div>
              <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink/50">Maior gasto</p>
                <p className="mt-1 truncate text-base font-bold text-ink" title={principal?.nome || "-"}>
                  {principal?.nome || "-"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-ink/50">
              <span>0%</span>
              <span>Escala da maior categoria</span>
              <span>100%</span>
            </div>

            <ul className="mt-2 space-y-3">
              {gastosCategoria.map((item) => {
                const largura = Math.max(4, Math.round((Number(item.valor || 0) / maiorValor) * 100));
                return (
                  <li key={item.nome} className="rounded-2xl border border-graphite/10 bg-paper p-3">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-ink" title={item.nome}>
                        {item.nome}
                      </span>
                      <span className="whitespace-nowrap text-ink/70">
                        {formatoMoeda.format(item.valor)} ({item.percentual.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-graphite/10">
                      <div
                        className="h-3 rounded-full bg-ink transition-all duration-300"
                        style={{ width: `${largura}%` }}
                        title={`${item.nome}: ${item.percentual.toFixed(1)}% do total`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </article>
    </section>
  );
}