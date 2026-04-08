export default function CartoesFormulario({ editandoId, form, setForm, salvando, onSubmit, onCancel }) {
  return (
    <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
      <h2 className="text-base font-bold text-ink">{editandoId ? `Editar cartao #${editandoId}` : "Novo cartao"}</h2>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Nome do cartão</span>
          <input
            value={form.name}
            onChange={(e) => setForm((atual) => ({ ...atual, name: e.target.value }))}
            placeholder="Ex.: Nubank Ultravioleta"
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Bandeira</span>
          <input
            value={form.brand}
            onChange={(e) => setForm((atual) => ({ ...atual, brand: e.target.value }))}
            placeholder="Ex.: Mastercard"
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Limite</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.limit_amount}
            onChange={(e) => setForm((atual) => ({ ...atual, limit_amount: e.target.value }))}
            className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Fechamento</span>
            <input
              type="number"
              min="1"
              max="31"
              value={form.closing_day}
              onChange={(e) => setForm((atual) => ({ ...atual, closing_day: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Vencimento</span>
            <input
              type="number"
              min="1"
              max="31"
              value={form.due_day}
              onChange={(e) => setForm((atual) => ({ ...atual, due_day: e.target.value }))}
              className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((atual) => ({ ...atual, is_active: e.target.checked }))}
            className="h-4 w-4"
          />
          Cartao ativo
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar cartão"}
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


