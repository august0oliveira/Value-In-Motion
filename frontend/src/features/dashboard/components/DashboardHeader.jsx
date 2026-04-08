export default function DashboardHeader({ nomeUsuario, onNovaReceita, onNovaDespesa }) {
  return (
    <header className="flex items-center justify-between gap-6 rounded-[28px] border border-graphite/10 bg-white/70 px-7 py-6 text-ink shadow-[0_18px_40px_rgba(19,20,23,0.12)] backdrop-blur">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink/60">Painel financeiro</p>
        <h1 className="mt-2 text-3xl font-bold uppercase" style={{ fontFamily: "Fraunces, serif" }}>
          {nomeUsuario || "Usuário"}
        </h1>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onNovaReceita}
          className="rounded-xl border border-graphite/30 bg-paper px-4 py-2 text-sm font-semibold text-ink shadow-[0_6px_14px_rgba(19,20,23,0.08)] transition hover:-translate-y-0.5 hover:bg-lime/15"
        >
          Nova receita
        </button>
        <button
          onClick={onNovaDespesa}
          className="rounded-xl border border-graphite/30 bg-paper px-4 py-2 text-sm font-semibold text-ink shadow-[0_6px_14px_rgba(19,20,23,0.08)] transition hover:-translate-y-0.5 hover:bg-coral/10"
        >
          Nova despesa
        </button>
      </div>
    </header>
  );
}
