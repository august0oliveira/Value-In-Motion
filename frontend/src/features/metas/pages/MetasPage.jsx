import { useEffect, useMemo, useState } from "react";
import useConfirmDialog from "../../../hooks/useConfirmDialog";
import { atualizarMeta, buscarMetas, criarMeta, excluirMeta } from "../../../lib/api";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function diasAte(dataIso) {
  if (!dataIso) return null;
  const hoje = new Date(hojeIso());
  const destino = new Date(`${dataIso}T00:00:00`);
  const diff = Math.ceil((destino - hoje) / (1000 * 60 * 60 * 24));
  return diff;
}

function percentualMeta(atual, alvo) {
  if (!alvo || Number(alvo) <= 0) return 0;
  return (Number(atual) / Number(alvo)) * 100;
}

export default function MetasPage() {
  const [metas, setMetas] = useState([]);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { confirmar, dialogo } = useConfirmDialog();

  const [form, setForm] = useState({
    title: "",
    target_amount: "",
    current_amount: "",
    due_date: "",
    priority: "medium",
    active: true,
    notes: "",
  });

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarMetas();
        if (Array.isArray(dados)) setMetas(dados);
      } catch (e) {
        setErro(e.message);
      }
    }
    carregar();
  }, []);

  const metasComStatus = useMemo(() => {
    return metas
      .map((item) => {
        const alvo = Number(item.target_amount || 0);
        const atual = Number(item.current_amount || 0);
        const pct = percentualMeta(atual, alvo);
        const restante = Math.max(0, alvo - atual);
        const prazoDias = diasAte(item.due_date);

        let status = "in_progress";
        if (pct >= 100) status = "completed";
        else if (!item.active) status = "paused";

        return {
          ...item,
          alvo,
          atual,
          restante,
          percentual: pct,
          prazoDias,
          status,
        };
      })
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
  }, [metas]);

  const metasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return metasComStatus.filter((item) => {
      const nomeOk = !termo || (item.title || "").toLowerCase().includes(termo);
      const statusOk = filtroStatus === "all" || item.status === filtroStatus;
      return nomeOk && statusOk;
    });
  }, [metasComStatus, busca, filtroStatus]);

  const resumo = useMemo(() => {
    const total = metasComStatus.length;
    const concluidas = metasComStatus.filter((item) => item.status === "completed").length;
    const pausadas = metasComStatus.filter((item) => item.status === "paused").length;
    const progressoMedio =
      total > 0 ? metasComStatus.reduce((soma, item) => soma + Math.min(100, item.percentual), 0) / total : 0;
    const faltanteTotal = metasComStatus.reduce((soma, item) => soma + item.restante, 0);
    return { total, concluidas, pausadas, progressoMedio, faltanteTotal };
  }, [metasComStatus]);

  function limparFormulario() {
    setEditandoId(null);
    setForm({
      title: "",
      target_amount: "",
      current_amount: "",
      due_date: "",
      priority: "medium",
      active: true,
      notes: "",
    });
    setErro("");
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setForm({
      title: item.title || "",
      target_amount: String(item.target_amount || ""),
      current_amount: String(item.current_amount || ""),
      due_date: item.due_date || "",
      priority: item.priority || "medium",
      active: Boolean(item.active),
      notes: item.notes || "",
    });
    setErro("");
  }

  async function salvarMeta(evento) {
    evento.preventDefault();
    if (!form.title.trim()) {
      setErro("Informe um nome para a meta.");
      return;
    }
    if (Number(form.target_amount) <= 0) {
      setErro("O valor alvo deve ser maior que zero.");
      return;
    }
    if (Number(form.current_amount || 0) < 0) {
      setErro("O valor atual não pode ser negativo.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount || 0),
      due_date: form.due_date || null,
      priority: form.priority,
      active: Boolean(form.active),
      notes: form.notes.trim(),
    };

    try {
      if (editandoId) {
        const atualizada = await atualizarMeta(editandoId, payload);
        setMetas((atual) => atual.map((item) => (item.id === editandoId ? atualizada : item)));
      } else {
        const criada = await criarMeta(payload);
        setMetas((atual) => [criada, ...atual]);
      }
      limparFormulario();
      setMostrarFormulario(false);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function removerMeta(item) {
    const confirmou = await confirmar({
      titulo: "Excluir meta",
      mensagem: `Remover a meta "${item.title}"?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    try {
      await excluirMeta(item.id);
      setMetas((atual) => atual.filter((meta) => meta.id !== item.id));
      if (editandoId === item.id) {
        limparFormulario();
        setMostrarFormulario(false);
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  async function alternarStatusMeta(item) {
    try {
      const atualizada = await atualizarMeta(item.id, {
        active: item.status === "completed" ? item.active : !item.active,
      });
      setMetas((atual) => atual.map((meta) => (meta.id === item.id ? atualizada : meta)));
    } catch (e) {
      setErro(e.message);
    }
  }

  async function concluirMeta(item) {
    try {
      const atualizada = await atualizarMeta(item.id, {
        current_amount: Number(item.target_amount),
        active: true,
      });
      setMetas((atual) => atual.map((meta) => (meta.id === item.id ? atualizada : meta)));
    } catch (e) {
      setErro(e.message);
    }
  }

  function classeStatus(status) {
    if (status === "completed") return "bg-emerald-100 text-emerald-700";
    if (status === "paused") return "bg-graphite/5 text-ink/80";
    return "bg-paper text-ink/70";
  }

  function labelStatus(status) {
    if (status === "completed") return "Concluida";
    if (status === "paused") return "Pausada";
    return "Em andamento";
  }

  function classePrioridade(prioridade) {
    if (prioridade === "high") return "bg-rose-100 text-rose-700";
    if (prioridade === "low") return "bg-emerald-100 text-emerald-700";
    return "bg-amber-100 text-amber-700";
  }

  function labelPrioridade(prioridade) {
    if (prioridade === "high") return "Alta";
    if (prioridade === "low") return "Baixa";
    return "Media";
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Módulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Metas</h1>
        <p className="mt-2 text-sm text-ink/70">
          Defina objetivos financeiros com prazo e acompanhe o progresso de cada meta.
        </p>

        <div className="mt-6 grid gap-3 grid-cols-5">
          <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Total</p>
            <p className="mt-1 text-xl font-semibold text-ink font-editorial">{resumo.total}</p>
          </div>
          <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Concluídas</p>
            <p className="mt-1 text-xl font-black text-emerald-700">{resumo.concluidas}</p>
          </div>
          <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Pausadas</p>
            <p className="mt-1 text-xl font-semibold text-ink font-editorial/80">{resumo.pausadas}</p>
          </div>
          <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Progresso médio</p>
            <p className="mt-1 text-xl font-semibold text-ink font-editorial">{Math.round(resumo.progressoMedio)}%</p>
          </div>
          <div className="rounded-2xl border border-graphite/10 bg-paper p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Faltante total</p>
            <p className="mt-1 text-xl font-semibold text-ink font-editorial">{formatoMoeda.format(resumo.faltanteTotal)}</p>
          </div>
        </div>

        {erro ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar meta"
              className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
            >
              <option value="all">Todos os status</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluídas</option>
              <option value="paused">Pausadas</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              if (mostrarFormulario) {
                setMostrarFormulario(false);
                limparFormulario();
              } else {
                limparFormulario();
                setMostrarFormulario(true);
              }
            }}
            className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80"
          >
            {mostrarFormulario ? "Fechar painel" : "Nova meta"}
          </button>
        </div>

        <div className={`mt-4 ${mostrarFormulario ? "grid gap-4 grid-cols-3" : ""}`}>
          {mostrarFormulario ? (
            <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
              <h2 className="text-base font-bold text-ink">{editandoId ? `Editar meta #${editandoId}` : "Nova meta"}</h2>
              <form className="mt-3 space-y-3" onSubmit={salvarMeta}>
                <label className="block text-sm">
                  <span className="mb-1 block text-ink/70">Nome da meta</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((atual) => ({ ...atual, title: e.target.value }))}
                    placeholder="Ex.: Reserva de emergência"
                    className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                </label>

                <div className="grid gap-2 grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-ink/70">Valor alvo</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.target_amount}
                      onChange={(e) => setForm((atual) => ({ ...atual, target_amount: e.target.value }))}
                      className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-ink/70">Valor atual</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.current_amount}
                      onChange={(e) => setForm((atual) => ({ ...atual, current_amount: e.target.value }))}
                      className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                    />
                  </label>
                </div>

                <div className="grid gap-2 grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-ink/70">Prazo</span>
                    <input
                      type="date"
                      value={form.due_date || ""}
                      min={hojeIso()}
                      onChange={(e) => setForm((atual) => ({ ...atual, due_date: e.target.value }))}
                      className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-ink/70">Prioridade</span>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((atual) => ({ ...atual, priority: e.target.value }))}
                      className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Média</option>
                      <option value="low">Baixa</option>
                    </select>
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="mb-1 block text-ink/70">Observações</span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((atual) => ({ ...atual, notes: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-ink/80">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((atual) => ({ ...atual, active: e.target.checked }))}
                  />
                  Meta ativa
                </label>

                <div className="flex gap-2">
                  <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
                    {editandoId ? "Salvar alterações" : "Salvar meta"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      limparFormulario();
                      setMostrarFormulario(false);
                    }}
                    className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </article>
          ) : null}

          <article className="rounded-[24px] border border-graphite/10 bg-white/80 p-4 shadow-[0_12px_28px_rgba(19,20,23,0.08)] col-span-2">
            <h2 className="text-base font-bold text-ink">Lista de metas</h2>
            <p className="mt-1 text-xs text-ink/60">Visualize progresso, prazo e prioridade.</p>

            {metasFiltradas.length === 0 ? (
              <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink/70">
                Nenhuma meta encontrada para os filtros selecionados.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {metasFiltradas.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-graphite/10 bg-paper p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">{item.title}</p>
                        <p className="text-xs text-ink/60">
                          {item.due_date
                            ? item.prazoDias >= 0
                              ? `${item.prazoDias} dias para o prazo`
                              : `Prazo vencido a ${Math.abs(item.prazoDias)} dias`
                            : "Sem prazo definido"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${classePrioridade(item.priority)}`}>
                          Prioridade {labelPrioridade(item.priority)}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${classeStatus(item.status)}`}>
                          {labelStatus(item.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-graphite/5">
                      <div
                        className="h-2 rounded-full bg-ink"
                        style={{ width: `${Math.min(100, Math.max(0, item.percentual))}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/70">
                      <span>
                        Atual: <strong>{formatoMoeda.format(item.atual)}</strong>
                      </span>
                      <span>
                        Alvo: <strong>{formatoMoeda.format(item.alvo)}</strong>
                      </span>
                      <span>
                        Faltante: <strong>{formatoMoeda.format(item.restante)}</strong>
                      </span>
                    </div>

                    {item.notes ? <p className="mt-2 text-xs text-ink/60">{item.notes}</p> : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(item)}
                        className="rounded-md border border-graphite/20 px-2 py-1 text-xs font-semibold text-ink/80"
                      >
                        Editar
                      </button>
                      {item.status !== "completed" ? (
                        <button
                          type="button"
                          onClick={() => concluirMeta(item)}
                          className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700"
                        >
                          Concluir
                        </button>
                      ) : null}
                      {item.status !== "completed" ? (
                        <button
                          type="button"
                          onClick={() => alternarStatusMeta(item)}
                          className="rounded-md border border-graphite/20 px-2 py-1 text-xs font-semibold text-ink/80"
                        >
                          {item.active ? "Pausar" : "Reativar"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removerMeta(item)}
                        className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
      {dialogo}
    </main>
  );
}




