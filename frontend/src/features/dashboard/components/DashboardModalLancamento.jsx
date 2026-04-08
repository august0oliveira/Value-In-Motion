export default function DashboardModalLancamento({
  aberto,
  tipoLancamento,
  erroModal,
  salvandoModal,
  formTransacao,
  contas,
  cartoes,
  categoriasDoTipo,
  onFechar,
  onSalvar,
  setFormTransacao,
}) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(19,20,23,0.55)" }}>
      <section className="w-full max-w-lg rounded-[24px] border border-graphite/10 bg-white/90 p-6 shadow-[0_20px_50px_rgba(19,20,23,0.25)]">
        <h2 className="text-xl font-semibold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          {tipoLancamento === "income" ? "Nova receita" : "Nova despesa"}
        </h2>
        <p className="mt-1 text-sm text-ink/70">Preencha os campos para registrar a transacao.</p>

        <form className="mt-5 space-y-3" onSubmit={onSalvar}>
          {tipoLancamento === "expense" ? (
            <fieldset className="block text-sm font-medium text-ink/80">
              <legend>Origem da despesa</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${
                    (formTransacao.source || "account") === "account"
                      ? "border-ink/40 bg-ink/5 text-ink"
                      : "border-graphite/20 bg-paper text-ink/80 hover:border-graphite/40"
                  } ${!contas.length ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-graphite/20"
                    checked={(formTransacao.source || "account") === "account"}
                    disabled={!contas.length}
                    onChange={(e) => {
                      if (!e.target.checked) return;
                      setFormTransacao((atual) => ({ ...atual, source: "account" }));
                    }}
                  />
                  <span className="text-sm font-semibold">Conta corrente</span>
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${
                    formTransacao.source === "credit_card"
                      ? "border-ink/40 bg-ink/5 text-ink"
                      : "border-graphite/20 bg-paper text-ink/80 hover:border-graphite/40"
                  } ${!cartoes.length ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-graphite/20"
                    checked={formTransacao.source === "credit_card"}
                    disabled={!cartoes.length}
                    onChange={(e) => {
                      if (!e.target.checked) return;
                      setFormTransacao((atual) => ({ ...atual, source: "credit_card" }));
                    }}
                  />
                  <span className="text-sm font-semibold">Cartao de credito</span>
                </label>
              </div>
            </fieldset>
          ) : null}

          {tipoLancamento === "income" || formTransacao.source !== "credit_card" ? (
            <label className="block text-sm font-medium text-ink/80">
              Conta
              <select
                className="mt-1 w-full rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm"
                value={formTransacao.account}
                onChange={(e) => setFormTransacao((atual) => ({ ...atual, account: e.target.value }))}
                required={tipoLancamento === "income" || formTransacao.source !== "credit_card"}
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

          {tipoLancamento === "expense" && formTransacao.source === "credit_card" ? (
            <label className="block text-sm font-medium text-ink/80">
              Cartao de credito
              <select
                className="mt-1 w-full rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm"
                value={formTransacao.credit_card || ""}
                onChange={(e) => setFormTransacao((atual) => ({ ...atual, credit_card: e.target.value }))}
                required
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

          <label className="block text-sm font-medium text-ink/80">
            Categoria
            <select
              className="mt-1 w-full rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm"
              value={formTransacao.category}
              onChange={(e) => setFormTransacao((atual) => ({ ...atual, category: e.target.value }))}
              required
            >
              <option value="">Selecione</option>
              {categoriasDoTipo.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-ink/80">
            Descricao
            <input
              className="mt-1 w-full rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm"
              value={formTransacao.description}
              onChange={(e) => setFormTransacao((atual) => ({ ...atual, description: e.target.value }))}
              placeholder="Ex: salario, mercado, aluguel..."
            />
          </label>

          <div className="grid gap-3 grid-cols-2">
            <label className="block text-sm font-medium text-ink/80">
              Valor
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm"
                value={formTransacao.amount}
                onChange={(e) => setFormTransacao((atual) => ({ ...atual, amount: e.target.value }))}
                required
              />
            </label>

            <label className="block text-sm font-medium text-ink/80">
              Data
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm"
                value={formTransacao.occurred_on}
                onChange={(e) => setFormTransacao((atual) => ({ ...atual, occurred_on: e.target.value }))}
                required
              />
            </label>
          </div>

          {erroModal ? (
            <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-ink/80 border border-coral/20">
              {erroModal}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-graphite/20 bg-paper px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoModal}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-graphite disabled:opacity-70"
            >
              {salvandoModal ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
