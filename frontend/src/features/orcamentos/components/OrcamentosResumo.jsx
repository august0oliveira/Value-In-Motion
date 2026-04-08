const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function OrcamentosResumo({ resumo }) {
  return (
    <div className="mt-6 grid gap-3 grid-cols-5">
      <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Ativos</p>
        <p className="mt-1 text-xl font-semibold text-ink font-editorial">{resumo.ativos}</p>
      </div>
      <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Alertas</p>
        <p className="mt-1 text-xl font-black text-amber-700">{resumo.alertas}</p>
      </div>
      <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Estourados</p>
        <p className="mt-1 text-xl font-black text-rose-700">{resumo.estourados}</p>
      </div>
      <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Limite total</p>
        <p className="mt-1 text-xl font-semibold text-ink font-editorial">{formatoMoeda.format(resumo.limiteTotal)}</p>
      </div>
      <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Gasto total</p>
        <p className="mt-1 text-xl font-semibold text-ink font-editorial">{formatoMoeda.format(resumo.gastoTotal)}</p>
      </div>
    </div>
  );
}



