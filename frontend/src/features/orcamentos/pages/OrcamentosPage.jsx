import { useEffect, useMemo, useState } from "react";
import useConfirmDialog from "../../../hooks/useConfirmDialog";
import {
  atualizarOrcamento,
  buscarCategorias,
  buscarOrcamentos,
  buscarTransacoes,
  criarOrcamento,
  excluirOrcamento,
} from "../../../lib/api";
const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function mesAtualIso() {
  return new Date().toISOString().slice(0, 7);
}

function mesLabel(valor) {
  if (!valor || !valor.includes("-")) return valor || "";
  const [ano, mes] = valor.split("-");
  return `${mes}/${ano}`;
}

function percentualGasto(gasto, limite) {
  if (!limite || limite <= 0) return 0;
  return (Number(gasto) / Number(limite)) * 100;
}

export default function OrcamentosPage() {
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroMes, setFiltroMes] = useState(mesAtualIso());
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { confirmar, dialogo } = useConfirmDialog();

  const [form, setForm] = useState({
    category: "",
    month_ref: mesAtualIso(),
    limit_amount: "",
    alert_percent: "80",
    active: true,
  });

  useEffect(() => {
    async function carregarBase() {
      try {
        const [categoriasApi, transacoesApi, orcamentosApi] = await Promise.all([
          buscarCategorias(),
          buscarTransacoes(),
          buscarOrcamentos(),
        ]);
        setCategorias(categoriasApi);
        setTransacoes(transacoesApi);
        setOrcamentos(orcamentosApi);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregarBase();
  }, []);

  const categoriasDespesa = useMemo(
    () => categorias.filter((item) => item.transaction_type === "expense"),
    [categorias]
  );

  const nomeCategoriaPorId = useMemo(
    () => Object.fromEntries(categorias.map((item) => [item.id, item.name])),
    [categorias]
  );

  const gastosPorCategoriaMes = useMemo(() => {
    const acumulado = {};
    transacoes
      .filter((item) => item.transaction_type === "expense")
      .forEach((item) => {
        if (!item.category || !item.occurred_on) return;
        const chave = `${item.category}-${item.occurred_on.slice(0, 7)}`;
        acumulado[chave] = (acumulado[chave] || 0) + Number(item.amount || 0);
      });
    return acumulado;
  }, [transacoes]);

  const orcamentosComStatus = useMemo(() => {
    return orcamentos.map((item) => {
      const chave = `${item.category}-${item.month_ref}`;
      const gasto = Number(gastosPorCategoriaMes[chave] || 0);
      const limite = Number(item.limit_amount || 0);
      const alertaPercent = Number(item.alert_percent || 80);
      const pct = percentualGasto(gasto, limite);

      let status = "ok";
      if (!item.active) status = "paused";
      else if (gasto > limite) status = "exceeded";
      else if (pct >= alertaPercent) status = "alert";

      return {
        ...item,
        gasto,
        limite,
        restante: limite - gasto,
        percentual: pct,
        status,
      };
    });
  }, [orcamentos, gastosPorCategoriaMes]);

  const orcamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return orcamentosComStatus.filter((item) => {
      const nomeCategoria = (nomeCategoriaPorId[item.category] || "").toLowerCase();
      const nomeOk = !termo || nomeCategoria.includes(termo);
      const mesOk = !filtroMes || item.month_ref === filtroMes;
      const statusOk = filtroStatus === "all" || item.status === filtroStatus;
      return nomeOk && mesOk && statusOk;
    });
  }, [orcamentosComStatus, busca, filtroMes, filtroStatus, nomeCategoriaPorId]);

  const resumo = useMemo(() => {
    const base = orcamentosComStatus.filter((item) => !filtroMes || item.month_ref === filtroMes);
    const ativos = base.filter((item) => item.active).length;
    const estourados = base.filter((item) => item.status === "exceeded").length;
    const alertas = base.filter((item) => item.status === "alert").length;
    const limiteTotal = base.reduce((soma, item) => soma + Number(item.limite || 0), 0);
    const gastoTotal = base.reduce((soma, item) => soma + Number(item.gasto || 0), 0);
    return { ativos, estourados, alertas, limiteTotal, gastoTotal };
  }, [orcamentosComStatus, filtroMes]);

  function limparFormulario() {
    setEditandoId(null);
    setForm({
      category: categoriasDespesa[0]?.id ? String(categoriasDespesa[0].id) : "",
      month_ref: filtroMes || mesAtualIso(),
      limit_amount: "",
      alert_percent: "80",
      active: true,
    });
    setErro("");
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setForm({
      category: String(item.category),
      month_ref: item.month_ref,
      limit_amount: String(item.limit_amount),
      alert_percent: String(item.alert_percent ?? 80),
      active: Boolean(item.active),
    });
    setErro("");
  }

  async function salvarOrcamento(evento) {
    evento.preventDefault();
    if (!form.category) {
      setErro("Selecione uma categoria de despesa.");
      return;
    }
    if (!form.month_ref) {
      setErro("Selecione o mes de referencia.");
      return;
    }
    if (Number(form.limit_amount) <= 0) {
      setErro("Informe um limite maior que zero.");
      return;
    }
    if (Number(form.alert_percent) < 1 || Number(form.alert_percent) > 100) {
      setErro("O percentual de alerta deve ficar entre 1 e 100.");
      return;
    }

    const existeDuplicado = orcamentos.some(
      (item) =>
        item.id !== editandoId &&
        String(item.category) === String(form.category) &&
        item.month_ref === form.month_ref
    );
    if (existeDuplicado) {
      setErro("Ja existe um orcamento para essa categoria no mes informado.");
      return;
    }

    setErro("");
    const payload = {
      category: Number(form.category),
      month_ref: form.month_ref,
      limit_amount: Number(form.limit_amount),
      alert_percent: Number(form.alert_percent),
      active: Boolean(form.active),
    };

    try {
      if (editandoId) {
        const atualizada = await atualizarOrcamento(editandoId, payload);
        setOrcamentos((atual) => atual.map((item) => (item.id === editandoId ? atualizada : item)));
      } else {
        const criado = await criarOrcamento(payload);
        setOrcamentos((atual) => [criado, ...atual]);
      }
      limparFormulario();
      setMostrarFormulario(false);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function removerOrcamento(item) {
    const confirmou = await confirmar({
      titulo: "Excluir orcamento",
      mensagem: `Remover o orcamento de "${nomeCategoriaPorId[item.category] || item.category}" em ${mesLabel(item.month_ref)}?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    try {
      await excluirOrcamento(item.id);
      setOrcamentos((atual) => atual.filter((orcamento) => orcamento.id !== item.id));
      if (editandoId === item.id) {
        limparFormulario();
        setMostrarFormulario(false);
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  function classeBarra(status) {
    if (status === "exceeded") return "bg-rose-500";
    if (status === "alert") return "bg-amber-500";
    if (status === "paused") return "bg-slate-400";
    return "bg-emerald-500";
  }

  function classeBadge(status) {
    if (status === "exceeded") return "bg-rose-100 text-rose-700";
    if (status === "alert") return "bg-amber-100 text-amber-700";
    if (status === "paused") return "bg-graphite/5 text-ink/80";
    return "bg-emerald-100 text-emerald-700";
  }

  function labelStatus(status) {
    if (status === "exceeded") return "Estourado";
    if (status === "alert") return "Em alerta";
    if (status === "paused") return "Pausado";
    return "Dentro do limite";
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Orcamentos</h1>
        <p className="mt-2 text-sm text-ink/70">
          Defina limites por categoria e acompanhe o consumo mensal com alertas de risco.
        </p>

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

        {erro ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}

        {carregando ? (
          <div className="mt-6 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-graphite/5" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar categoria"
                  className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                />
                <input
                  type="month"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                />
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  <option value="all">Todos os status</option>
                  <option value="ok">Dentro do limite</option>
                  <option value="alert">Em alerta</option>
                  <option value="exceeded">Estourado</option>
                  <option value="paused">Pausado</option>
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
                {mostrarFormulario ? "Fechar painel" : "Novo orcamento"}
              </button>
            </div>

            <div className={`mt-4 ${mostrarFormulario ? "grid gap-4 grid-cols-3" : ""}`}>
              {mostrarFormulario ? (
                <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
                  <h2 className="text-base font-bold text-ink">
                    {editandoId ? `Editar orcamento #${editandoId}` : "Novo orcamento"}
                  </h2>
                  <form className="mt-3 space-y-3" onSubmit={salvarOrcamento}>
                    <label className="block text-sm">
                      <span className="mb-1 block text-ink/70">Categoria de despesa</span>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((atual) => ({ ...atual, category: e.target.value }))}
                        className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                      >
                        <option value="">Selecione</option>
                        {categoriasDespesa.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block text-ink/70">Mes de referencia</span>
                      <input
                        type="month"
                        value={form.month_ref}
                        onChange={(e) => setForm((atual) => ({ ...atual, month_ref: e.target.value }))}
                        className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block text-ink/70">Limite</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.limit_amount}
                        onChange={(e) => setForm((atual) => ({ ...atual, limit_amount: e.target.value }))}
                        className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block text-ink/70">Alerta (%)</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={form.alert_percent}
                        onChange={(e) => setForm((atual) => ({ ...atual, alert_percent: e.target.value }))}
                        className="w-full rounded-lg border border-graphite/20 px-3 py-2 text-sm outline-none focus:border-ink"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-ink/80">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm((atual) => ({ ...atual, active: e.target.checked }))}
                      />
                      Orcamento ativo
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
                      >
                        {editandoId ? "Salvar alteracoes" : "Salvar orcamento"}
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
                <h2 className="text-base font-bold text-ink">Lista de orcamentos</h2>
                <p className="mt-1 text-xs text-ink/60">Acompanhe consumo por categoria e ajuste limites.</p>

                {orcamentosFiltrados.length === 0 ? (
                  <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink/70">
                    Nenhum orcamento encontrado para os filtros selecionados.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {orcamentosFiltrados.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-graphite/10 bg-paper p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-ink">
                              {nomeCategoriaPorId[item.category] || `Categoria #${item.category}`}
                            </p>
                            <p className="text-xs text-ink/60">{mesLabel(item.month_ref)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${classeBadge(item.status)}`}>
                              {labelStatus(item.status)}
                            </span>
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(item)}
                              className="rounded-md border border-graphite/20 px-2 py-1 text-xs font-semibold text-ink/80"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => removerOrcamento(item)}
                              className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 h-2 rounded-full bg-graphite/5">
                          <div
                            className={`h-2 rounded-full ${classeBarra(item.status)}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.percentual))}%` }}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/70">
                          <span>
                            Gasto: <strong>{formatoMoeda.format(item.gasto)}</strong>
                          </span>
                          <span>
                            Limite: <strong>{formatoMoeda.format(item.limite)}</strong>
                          </span>
                          <span>
                            Restante:{" "}
                            <strong className={item.restante < 0 ? "text-rose-700" : "text-emerald-700"}>
                              {formatoMoeda.format(item.restante)}
                            </strong>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </>
        )}
      </section>
      {dialogo}
    </main>
  );
}



