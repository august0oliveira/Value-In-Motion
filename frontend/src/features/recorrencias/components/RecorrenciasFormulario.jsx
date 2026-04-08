export default function RecorrenciasFormulario({
  editandoId,
  form,
  setForm,
  contas,
  cartoes,
  categoriasDoTipo,
  salvando,
  onSubmit,
  onCancel,
}) {
  return (
    <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
      <h2 className="text-base font-bold text-ink">{editandoId ? `Editar recorrencia #${editandoId}` : "Nova recorrencia"}</h2>

      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Descrição</span>
          <input
            value={form.description}
            onChange={(e) => setForm((atual) => ({ ...atual, description: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            placeholder="Ex.: Aluguel"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Tipo</span>
            <select
              value={form.transaction_type}
              onChange={(e) => setForm((atual) => ({ ...atual, transaction_type: e.target.value, category: "" }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Frequência</span>
            <select
              value={form.frequency}
              onChange={(e) => setForm((atual) => ({ ...atual, frequency: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            >
              <option value="monthly">Mensal</option>
              <option value="weekly">Semanal</option>
              <option value="yearly">Anual</option>
            </select>
          </label>
        </div>

        {form.transaction_type === "expense" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Origem</span>
            <select
              value={form.source}
              onChange={(e) => setForm((atual) => ({ ...atual, source: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            >
              <option value="account">Conta</option>
              <option value="credit_card">Cartão</option>
            </select>
          </label>
        ) : null}

        {form.transaction_type === "income" || form.source === "account" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Conta</span>
            <select
              value={form.account}
              onChange={(e) => setForm((atual) => ({ ...atual, account: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {contas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Cartão</span>
            <select
              value={form.credit_card}
              onChange={(e) => setForm((atual) => ({ ...atual, credit_card: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {cartoes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Categoria</span>
          <select
            value={form.category}
            onChange={(e) => setForm((atual) => ({ ...atual, category: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
          >
            <option value="">Selecione</option>
            {categoriasDoTipo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Valor</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((atual) => ({ ...atual, amount: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Início</span>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((atual) => ({ ...atual, start_date: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Fim (opcional)</span>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((atual) => ({ ...atual, end_date: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((atual) => ({ ...atual, active: e.target.checked }))}
          />
          Recorrência ativa
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar recorrência"}
          </button>
          {editandoId ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </article>
  );
}


