export default function PerfilResumo() {
  return (
    <section className="mt-6 rounded-2xl border border-graphite/10 bg-paper p-4">
      <h2 className="text-base font-bold text-ink">Dados do usuario</h2>
      <div className="mt-3 grid gap-3 grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Nome</p>
          <p className="mt-1 text-sm font-semibold text-ink">Nao informado</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">E-mail</p>
          <p className="mt-1 text-sm font-semibold text-ink">Nao informado</p>
        </div>
      </div>
    </section>
  );
}



