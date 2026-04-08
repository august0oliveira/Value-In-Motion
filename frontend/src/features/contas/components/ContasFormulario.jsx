const TIPOS_CONTA = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Carteira / Dinheiro" },
  { value: "investment", label: "Investimento" },
];

export default function ContasFormulario({ editandoId, form, setForm, salvando, onSubmit, onCancel }) {
  return (
    <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
      <h2 className="text-base font-bold text-ink">{editandoId ? `Editar conta #${editandoId}` : "Nova conta"}</h2>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Nome</span>
          <input
            value={form.name}
            onChange={(e) => setForm((atual) => ({ ...atual, name: e.target.value }))}
            placeholder="Ex.: Nubank principal"
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Tipo</span>
          <select
            value={form.account_type}
            onChange={(e) => setForm((atual) => ({ ...atual, account_type: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          >
            {TIPOS_CONTA.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Saldo inicial</span>
          <input
            type="number"
            step="0.01"
            value={form.initial_balance}
            onChange={(e) => setForm((atual) => ({ ...atual, initial_balance: e.target.value }))}
            placeholder="0,00"
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar conta"}
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


