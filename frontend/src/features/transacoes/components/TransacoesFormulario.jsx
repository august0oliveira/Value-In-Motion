export default function TransacoesFormulario({
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
      <h2 className="text-base font-bold text-ink">{editandoId ? `Editar transação #${editandoId}` : "Nova transação"}</h2>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Tipo</span>
          <select
            value={form.transaction_type}
            onChange={(e) =>
              setForm((atual) => ({
                ...atual,
                transaction_type: e.target.value,
                category: "",
                source: e.target.value === "income" ? "account" : atual.source || "account",
              }))
            }
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </label>

        {form.transaction_type === "expense" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Origem da despesa</span>
            <select
              value={form.source || "account"}
              onChange={(e) => setForm((atual) => ({ ...atual, source: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            >
              <option value="account">Saldo da conta</option>
              <option value="credit_card">Cartão de crédito</option>
            </select>
          </label>
        ) : null}

        {form.transaction_type === "income" || form.source !== "credit_card" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Conta</span>
            <select
              value={form.account}
              onChange={(e) => setForm((atual) => ({ ...atual, account: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            >
              <option value="">Selecione</option>
              {contas.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {form.transaction_type === "expense" && form.source === "credit_card" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Cartão de crédito</span>
            <select
              value={form.credit_card || ""}
              onChange={(e) => setForm((atual) => ({ ...atual, credit_card: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            >
              <option value="">Selecione</option>
              {cartoes.map((cartao) => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Categoria</span>
          <select
            value={form.category}
            onChange={(e) => setForm((atual) => ({ ...atual, category: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="">Selecione</option>
            {categoriasDoTipo.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Descrição</span>
          <input
            value={form.description}
            onChange={(e) => setForm((atual) => ({ ...atual, description: e.target.value }))}
            placeholder="Ex.: supermercado"
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
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
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Data</span>
            <input
              type="date"
              value={form.occurred_on}
              onChange={(e) => setForm((atual) => ({ ...atual, occurred_on: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar transação"}
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


