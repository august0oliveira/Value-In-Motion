export default function DashboardTabelaStatus({
  atividadeRecente,
  buscaDescricao,
  setBuscaDescricao,
  nomeCategoriaPorId,
  formatoMoeda,
  visaoApi,
}) {
  return (
    <section className="mt-4 grid gap-4 grid-cols-1">
      <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-5 shadow-[0_14px_30px_rgba(19,20,23,0.08)] col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
            Transações recentes
          </h2>
          <input
            className="w-full rounded-full border border-graphite/20 bg-paper px-4 py-2 text-sm w-72"
            placeholder="Buscar por descricao..."
            value={buscaDescricao}
            onChange={(e) => setBuscaDescricao(e.target.value)}
          />
        </div>

        {atividadeRecente.length === 0 ? (
          <p className="mt-3 text-sm text-ink/70">Sem movimentações no período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-graphite/10 text-left text-ink/60">
                  <th className="px-2 py-2">Data</th>
                  <th className="px-2 py-2">Descrição</th>
                  <th className="px-2 py-2">Categoria</th>
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {atividadeRecente.map((item) => (
                  <tr key={item.id} className="border-b border-graphite/5">
                    <td className="px-2 py-2 text-ink/70">{item.occurred_on}</td>
                    <td className="px-2 py-2 font-medium text-ink">
                      {item.description || "Sem descrição"}
                    </td>
                    <td className="px-2 py-2 text-ink/70">
                      {nomeCategoriaPorId[item.category] || `Categoria #${item.category}`}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          item.transaction_type === "income"
                            ? "bg-lime/30 text-ink"
                            : "bg-coral/20 text-coral"
                        }`}
                      >
                        {item.transaction_type === "income" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-ink">
                      {item.transaction_type === "income" ? "+" : "-"}
                      {formatoMoeda.format(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-5 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <h2 className="text-base font-bold text-ink">Status técnico</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-paper p-3 text-xs text-ink/70">
          {JSON.stringify(visaoApi, null, 2)}
        </pre>
      </article> */}
    </section>
  );
}
