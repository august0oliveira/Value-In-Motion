const TIPO_LABEL = {
  income: "Receita",
  expense: "Despesa",
};

const FREQ_LABEL = {
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
};

export default function RecorrenciasLista({
  recorrenciasFiltradas,
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
  nomeContaPorId,
  nomeCartaoPorId,
  nomeCategoriaPorId,
  onEdit,
  onToggleAtivo,
  onDelete,
}) {
  return (
    <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-4 shadow-[0_12px_28px_rgba(19,20,23,0.08)] col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Recorrências cadastradas</h2>
          <p className="mt-1 text-xs text-ink/60">Regras automáticas para receitas e despesas recorrentes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar recorrência"
            className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
          >
            <option value="all">Todas</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>
      </div>

      {recorrenciasFiltradas.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink/70">
          Nenhuma recorrência encontrada para esse filtro.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {recorrenciasFiltradas.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-graphite/10 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{item.description}</p>
                <p className="text-xs text-ink/60">
                  {TIPO_LABEL[item.transaction_type]} | {FREQ_LABEL[item.frequency]} |{" "}
                  {item.source === "credit_card"
                    ? nomeCartaoPorId[item.credit_card] || `Cartao #${item.credit_card}`
                    : nomeContaPorId[item.account] || `Conta #${item.account}`}{" "}
                  | {nomeCategoriaPorId[item.category] || `Categoria #${item.category}`}
                </p>
                <p className="text-xs text-ink/60">
                  Início {item.start_date}
                  {item.end_date ? ` | Fim ${item.end_date}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    item.active ? "bg-emerald-100 text-emerald-700" : "bg-graphite/10 text-ink/80"
                  }`}
                >
                  {item.active ? "Ativa" : "Inativa"}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleAtivo(item)}
                  className="rounded-md border border-graphite/20 px-2 py-1 text-xs font-semibold text-ink/80"
                >
                  {item.active ? "Pausar" : "Ativar"}
                </button>
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



