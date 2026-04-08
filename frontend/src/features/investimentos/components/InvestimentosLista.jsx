const TIPO_LABEL = {
  renda_fixa: "Renda fixa",
  acao: "Acoes",
  fii: "FII",
  etf: "ETF",
  cripto: "Cripto",
  outro: "Outro",
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function retorno(item) {
  return Number(item.valorAtual || 0) - Number(item.valorInvestido || 0);
}

export default function InvestimentosLista({
  carregando,
  investimentosFiltrados,
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
          <h2 className="text-base font-bold text-ink">Carteira</h2>
          <p className="mt-1 text-xs text-ink/60">Acompanhe performance e diversificacao da carteira.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar ativo"
            className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="all">Todos os tipos</option>
            <option value="renda_fixa">Renda fixa</option>
            <option value="acao">Acoes</option>
            <option value="fii">FII</option>
            <option value="etf">ETF</option>
            <option value="cripto">Cripto</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      {carregando ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-graphite/5" />
          ))}
        </div>
      ) : investimentosFiltrados.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink/70">
          Nenhum investimento encontrado para esse filtro.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {investimentosFiltrados.map((item) => {
            const resultado = retorno(item);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-graphite/10 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-ink">{item.nome}</p>
                  <p className="text-xs text-ink/60">
                    {TIPO_LABEL[item.tipo] || item.tipo} | {item.instituicao || "Sem instituicao"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink/60">Investido: {moeda.format(Number(item.valorInvestido || 0))}</p>
                  <p className="text-xs text-ink/60">Atual: {moeda.format(Number(item.valorAtual || 0))}</p>
                  <p className={`text-xs font-semibold ${resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    Retorno: {moeda.format(resultado)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
            );
          })}
        </ul>
      )}
    </article>
  );
}


