import { useEffect, useState } from "react";

const STORAGE_KEY = "vimo_perfil_configuracoes";

const estadoInicial = {
  nome: "",
  email: "",
  idioma: "pt-BR",
  moeda: "BRL",
  notificacoesEmail: true,
  notificacoesPush: false,
};

export default function PerfilConfiguracoesPage() {
  const [form, setForm] = useState(estadoInicial);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo) return;
    try {
      const valor = JSON.parse(salvo);
      setForm((atual) => ({ ...atual, ...valor }));
    } catch {
      // ignora dados invalidos
    }
  }, []);

  function salvarPerfil(evento) {
    evento.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setMensagem("Perfil e configuracoes salvos com sucesso.");
  }

  function alterarSenha(evento) {
    evento.preventDefault();
    setErroSenha("");
    setMensagem("");

    if (!senhaAtual || !novaSenha || !confirmacaoSenha) {
      setErroSenha("Preencha todos os campos de senha.");
      return;
    }
    if (novaSenha.length < 6) {
      setErroSenha("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setErroSenha("A confirmacao de senha nao confere.");
      return;
    }

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmacaoSenha("");
    setMensagem("Senha alterada com sucesso.");
  }

  return (
    <main className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
      <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Perfil e Configuracoes</h1>
      <p className="mt-2 text-sm text-ink/70">
        Atualize seus dados da conta, preferencias e parametros de seguranca.
      </p>

      {mensagem ? <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</p> : null}
      {erroSenha ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erroSenha}</p> : null}

      <div className="mt-6 grid gap-4 grid-cols-2">
        <section className="rounded-2xl border border-graphite/10 bg-paper p-4">
          <h2 className="text-base font-bold text-ink">Dados do perfil</h2>
          <form className="mt-3 space-y-3" onSubmit={salvarPerfil}>
            <label className="block text-sm">
              <span className="mb-1 block text-ink/70">Nome</span>
              <input
                value={form.nome}
                onChange={(e) => setForm((atual) => ({ ...atual, nome: e.target.value }))}
                className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                placeholder="Seu nome"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-ink/70">E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((atual) => ({ ...atual, email: e.target.value }))}
                className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                placeholder="seu@email.com"
              />
            </label>

            <div className="grid gap-2 grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-ink/70">Idioma</span>
                <select
                  value={form.idioma}
                  onChange={(e) => setForm((atual) => ({ ...atual, idioma: e.target.value }))}
                  className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  <option value="pt-BR">Portugues (Brasil)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-ink/70">Moeda</span>
                <select
                  value={form.moeda}
                  onChange={(e) => setForm((atual) => ({ ...atual, moeda: e.target.value }))}
                  className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="checkbox"
                  checked={form.notificacoesEmail}
                  onChange={(e) => setForm((atual) => ({ ...atual, notificacoesEmail: e.target.checked }))}
                />
                Notificacoes por e-mail
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="checkbox"
                  checked={form.notificacoesPush}
                  onChange={(e) => setForm((atual) => ({ ...atual, notificacoesPush: e.target.checked }))}
                />
                Notificacoes push
              </label>
            </div>

            <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
              Salvar perfil e configuracoes
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-graphite/10 bg-white p-4">
          <h2 className="text-base font-bold text-ink">Seguranca</h2>
          <form className="mt-3 space-y-3" onSubmit={alterarSenha}>
            <label className="block text-sm">
              <span className="mb-1 block text-ink/70">Senha atual</span>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink/70">Nova senha</span>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink/70">Confirmar nova senha</span>
              <input
                type="password"
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
                className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </label>

            <button type="submit" className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80">
              Alterar senha
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}




