export default function ConfiguracoesPreferencias() {
  return (
    <section className="mt-6 rounded-2xl border border-graphite/10 bg-paper p-4">
      <h2 className="text-base font-bold text-ink">Preferencias</h2>
      <p className="mt-1 text-sm text-ink/70">Idioma, formato de moeda, fuso e parametros gerais do sistema.</p>

      <div className="mt-4 grid gap-3 grid-cols-2">
        <div className="rounded-lg border border-graphite/10 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Idioma</p>
          <p className="mt-1 text-sm font-semibold text-ink">Portugues (Brasil)</p>
        </div>
        <div className="rounded-lg border border-graphite/10 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Moeda</p>
          <p className="mt-1 text-sm font-semibold text-ink">BRL (R$)</p>
        </div>
      </div>
    </section>
  );
}



