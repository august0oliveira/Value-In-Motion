export default function PaginaModuloBase({ titulo, descricao }) {
  return (
    <div className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
      <h1 className="mt-2 text-2xl font-bold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
        {titulo}
      </h1>
      <p className="mt-1 text-sm text-ink/70">{descricao}</p>

      <div className="mt-6 rounded-2xl border border-dashed border-graphite/10 bg-paper p-6">
        <p className="text-sm text-ink/60 text-center">
          Este modulo esta disponivel no menu. Em breve o CRUD completo sera implementado aqui.
        </p>
      </div>
    </div>
  );
}
