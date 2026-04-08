const OPCOES_PERIODO = [
  { valor: "mes", label: "Mês" },
  { valor: "7d", label: "7 dias" },
  { valor: "30d", label: "30 dias" },
  { valor: "90d", label: "90 dias" },
  { valor: "ano", label: "Ano" },
];

function tipoContaLabel(tipo) {
  if (tipo === "checking") return "Conta corrente";
  if (tipo === "savings") return "Poupanca";
  if (tipo === "wallet") return "Carteira";
  if (tipo === "credit_card") return "Cartao";
  return tipo;
}

export default function DashboardFiltros({ periodo, setPeriodo, filtroConta, setFiltroConta, contas }) {
  return (
    <section className="mt-4 rounded-[24px] border border-graphite/10 bg-white/70 p-3 shadow-[0_12px_28px_rgba(19,20,23,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {OPCOES_PERIODO.map((item) => (
            <button
              key={item.valor}
              onClick={() => setPeriodo(item.valor)}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                periodo === item.valor
                  ? "bg-ink text-paper"
                  : "border border-graphite/10 bg-paper text-ink/70 hover:bg-ink/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Conta
          <select
            className="rounded-full border border-graphite/20 bg-paper px-3 py-1.5 text-xs uppercase tracking-[0.12em]"
            value={filtroConta}
            onChange={(e) => setFiltroConta(e.target.value)}
          >
            <option value="all">Todas</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.name} ({tipoContaLabel(conta.account_type)})
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}