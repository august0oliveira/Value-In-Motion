export default function RelatoriosPainelExportacao({
  filtros,
  contas,
  categorias,
  carregando,
  onFiltroChange,
  onGerar,
  onExportarCsv,
  onExportarPdf,
  onRecarregarDados,
}) {
  return (
    <section className="mt-4 rounded-xl border border-graphite/10 bg-white p-4">
      <h2 className="text-base font-bold text-ink">Filtros e exportacao</h2>
      <p className="mt-1 text-sm text-ink/70">
        Selecione periodo, conta e categoria para gerar os relatorios e exportar os dados.
      </p>

      <div className="mt-4 grid gap-2 grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Data inicial</span>
          <input
            type="date"
            value={filtros.inicio}
            onChange={(e) => onFiltroChange("inicio", e.target.value)}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Data final</span>
          <input
            type="date"
            value={filtros.fim}
            onChange={(e) => onFiltroChange("fim", e.target.value)}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Tipo</span>
          <select
            value={filtros.tipo}
            onChange={(e) => onFiltroChange("tipo", e.target.value)}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 outline-none focus:border-ink"
          >
            <option value="all">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Conta</span>
          <select
            value={filtros.conta}
            onChange={(e) => onFiltroChange("conta", e.target.value)}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 outline-none focus:border-ink"
          >
            <option value="all">Todas</option>
            {contas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Categoria</span>
          <select
            value={filtros.categoria}
            onChange={(e) => onFiltroChange("categoria", e.target.value)}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 outline-none focus:border-ink"
          >
            <option value="all">Todas</option>
            {categorias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Buscar descricao</span>
          <input
            value={filtros.termo}
            onChange={(e) => onFiltroChange("termo", e.target.value)}
            placeholder="Ex.: mercado"
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 outline-none focus:border-ink"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          disabled={carregando}
          onClick={onGerar}
        >
          Gerar relatorio
        </button>
        <button
          className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80 disabled:opacity-70"
          disabled={carregando}
          onClick={onExportarCsv}
        >
          Exportar CSV
        </button>
        <button
          className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80 disabled:opacity-70"
          disabled={carregando}
          onClick={onExportarPdf}
        >
          Exportar PDF
        </button>
        <button
          className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80 disabled:opacity-70"
          disabled={carregando}
          onClick={onRecarregarDados}
        >
          Recarregar dados
        </button>
      </div>
    </section>
  );
}


