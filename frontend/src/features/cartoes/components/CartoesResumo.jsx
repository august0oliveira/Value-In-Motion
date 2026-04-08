const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CartoesResumo({ resumo }) {
  return (
    <div className="mt-5 grid gap-3 grid-cols-5">
      <article className="rounded-2xl border border-graphite/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(19,20,23,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60">Ativos</p>
        <p className="mt-2 text-xl font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          {resumo.ativos}
        </p>
      </article>

      <article className="rounded-2xl border border-graphite/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(19,20,23,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60">Limite total</p>
        <p className="mt-2 text-xl font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          {formatoMoeda.format(resumo.limiteTotal)}
        </p>
      </article>

      <article className="rounded-2xl border border-graphite/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(19,20,23,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60">Usado</p>
        <p className="mt-2 text-xl font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          {formatoMoeda.format(resumo.usadoTotal)}
        </p>
      </article>

      <article className="rounded-2xl border border-graphite/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(19,20,23,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60">Disponivel</p>
        <p className="mt-2 text-xl font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          {formatoMoeda.format(resumo.disponivelTotal)}
        </p>
      </article>

      <article className="rounded-2xl border border-graphite/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(19,20,23,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60">Media de limite</p>
        <p className="mt-2 text-xl font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
          {formatoMoeda.format(resumo.mediaLimite)}
        </p>
      </article>
    </div>
  );
}
