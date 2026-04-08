export default function ConfirmDialog({
  aberto,
  titulo = "Confirmar acao",
  mensagem = "Deseja continuar?",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(19,20,23,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div className="w-full max-w-sm rounded-[24px] border border-graphite/10 bg-white/90 p-6 shadow-[0_20px_50px_rgba(19,20,23,0.25)]">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-coral/10 border border-coral/20 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-coral"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
              {titulo}
            </h2>
            <p className="mt-1 text-sm text-ink/70">{mensagem}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-graphite/20 bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-graphite"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
