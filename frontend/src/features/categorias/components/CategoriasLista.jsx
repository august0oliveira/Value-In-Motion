const TIPO_LABEL = {
  income: "Receita",
  expense: "Despesa",
};

export default function CategoriasLista({
  carregando,
  categoriasFiltradas,
  busca,
  setBusca,
  filtroTipo,
  setFiltroTipo,
  onEdit,
  onDelete,
}) {
  return (
    <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-4 shadow-[0_12px_28px_rgba(19,20,23,0.08)] col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Lista de categorias</h2>
          <p className="mt-1 text-xs text-ink/60">Filtre por tipo ou pesquise por nome.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar categoria"
            className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="all">Todos os tipos</option>
            <option value="expense">Somente despesas</option>
            <option value="income">Somente receitas</option>
          </select>
        </div>
      </div>

      {carregando ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-graphite/5" />
          ))}
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink/70">
          Nenhuma categoria encontrada para esse filtro.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {categoriasFiltradas.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-graphite/10 px-3 py-2"
            >
              <div>
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-ink/60">{TIPO_LABEL[item.transaction_type] || item.transaction_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    item.transaction_type === "income" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {TIPO_LABEL[item.transaction_type] || item.transaction_type}
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


