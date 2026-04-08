const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const TIPO_LABEL = {
  income: "Receita",
  expense: "Despesa",
};

export default function TransacoesLista({
  carregando,
  transacoesFiltradas,
  busca,
  setBusca,
  filtroTipo,
  setFiltroTipo,
  filtroConta,
  setFiltroConta,
  filtroCategoria,
  setFiltroCategoria,
  contas,
  categorias,
  nomeContaPorId,
  nomeCartaoPorId,
  nomeCategoriaPorId,
  onEdit,
  onDelete,
}) {
  return (
    <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-4 shadow-[0_12px_28px_rgba(19,20,23,0.08)] col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Histórico de transações</h2>
          <p className="mt-1 text-xs text-ink/60">Filtre por conta, categoria, tipo e descrição.</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 grid-cols-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar descrição"
          className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
        >
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
        <select
          value={filtroConta}
          onChange={(e) => setFiltroConta(e.target.value)}
          className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
        >
          <option value="all">Todas as contas</option>
          {contas.map((conta) => (
            <option key={conta.id} value={String(conta.id)}>
              {conta.name}
            </option>
          ))}
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
        >
          <option value="all">Todas as categorias</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={String(categoria.id)}>
              {categoria.name}
            </option>
          ))}
        </select>
      </div>

      {carregando ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-graphite/5" />
          ))}
        </div>
      ) : transacoesFiltradas.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink/70">
          Nenhuma transação encontrada para esse filtro.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {transacoesFiltradas.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-graphite/10 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{item.description || "Sem descrição"}</p>
                <p className="text-xs text-ink/60">
                  {item.occurred_on} |{" "}
                  {item.credit_card
                    ? nomeCartaoPorId[item.credit_card] || `Cartão #${item.credit_card}`
                    : nomeContaPorId[item.account] || `Conta #${item.account}`}{" "}
                  |{" "}
                  {nomeCategoriaPorId[item.category] || `Categoria #${item.category}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    item.transaction_type === "income" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {TIPO_LABEL[item.transaction_type] || item.transaction_type}
                </span>
                <span
                  className={`text-sm font-bold ${
                    item.transaction_type === "income" ? "text-green-700" : "text-rose-700"
                  }`}
                >
                  {item.transaction_type === "income" ? "+" : "-"}
                  {formatoMoeda.format(Number(item.amount || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="rounded-md border border-graphite/20 px-2 py-1 text-xs font-semibold text-ink/80"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}


