export default function AdminSistemaPage() {
  const baseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  return (
    <main className="mx-auto max-w-4xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Admin do sistema</h1>
        <p className="mt-2 text-sm text-ink/70">
          Acesso direto ao Django Admin para gestao e suporte.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => window.open(`${baseUrl}/admin/`, "_blank", "noopener,noreferrer")}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-graphite"
          >
            Abrir Django Admin
          </button>
        </div>
      </section>
    </main>
  );
}

