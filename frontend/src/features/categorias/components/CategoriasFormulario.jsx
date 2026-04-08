export default function CategoriasFormulario({
  editandoId,
  form,
  setForm,
  salvando,
  onSubmit,
  onCancel,
}) {
  return (
    <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
      <h2 className="text-base font-bold text-ink">{editandoId ? `Editar categoria #${editandoId}` : "Nova categoria"}</h2>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Nome</span>
          <input
            value={form.name}
            onChange={(e) => setForm((atual) => ({ ...atual, name: e.target.value }))}
            placeholder="Ex.: Moradia"
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Tipo</span>
          <select
            value={form.transaction_type}
            onChange={(e) => setForm((atual) => ({ ...atual, transaction_type: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Criar categoria"}
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


