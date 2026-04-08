export default function OrcamentosFormulario({
  editandoId,
  form,
  setForm,
  categoriasDespesa,
  onSubmit,
  onCancel,
}) {
  return (
    <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
      <h2 className="text-base font-bold text-ink">{editandoId ? `Editar orcamento #${editandoId}` : "Novo orcamento"}</h2>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Categoria de despesa</span>
          <select
            value={form.category}
            onChange={(e) => setForm((atual) => ({ ...atual, category: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="">Selecione</option>
            {categoriasDespesa.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Mes de referencia</span>
          <input
            type="month"
            value={form.month_ref}
            onChange={(e) => setForm((atual) => ({ ...atual, month_ref: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Limite</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.limit_amount}
            onChange={(e) => setForm((atual) => ({ ...atual, limit_amount: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Alerta (%)</span>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={form.alert_percent}
            onChange={(e) => setForm((atual) => ({ ...atual, alert_percent: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((atual) => ({ ...atual, active: e.target.checked }))}
          />
          Orcamento ativo
        </label>

        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
            {editandoId ? "Salvar alteracoes" : "Salvar orcamento"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80"
          >
            Cancelar
          </button>
        </div>
      </form>
    </article>
  );
}


