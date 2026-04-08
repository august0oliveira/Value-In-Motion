export default function ConfiguracoesSeguranca() {
  return (
    <section className="mt-4 rounded-xl border border-graphite/10 bg-white p-4">
      <h2 className="text-base font-bold text-ink">Seguranca e notificacoes</h2>
      <p className="mt-1 text-sm text-ink/70">
        Controle senha, autenticacao e preferencias de envio de notificacoes.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">Alterar senha</button>
        <button className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80">
          Configurar notificacoes
        </button>
      </div>
    </section>
  );
}

