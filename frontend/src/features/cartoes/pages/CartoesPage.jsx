import { useEffect, useMemo, useState } from "react";
import CartoesFormulario from "../components/CartoesFormulario";
import CartoesLista from "../components/CartoesLista";
import CartoesResumo from "../components/CartoesResumo";
import useConfirmDialog from "../../../hooks/useConfirmDialog";
import {
  atualizarCartao,
  atualizarParcelamentoCartao,
  buscarContas,
  buscarCartoes,
  buscarCategorias,
  buscarFaturasCartao,
  buscarParcelamentosCartao,
  buscarTransacoes,
  criarCartao,
  criarParcelamentoCartao,
  excluirCartao,
  excluirParcelamentoCartao,
  fecharFaturaCartao,
  pagarFaturaCartao,
} from "../../../lib/api";

function dataIso(data) {
  return data.toISOString().slice(0, 10);
}

function ajustarDia(ano, mesBaseZero, dia) {
  const ultimoDia = new Date(ano, mesBaseZero + 1, 0).getDate();
  return Math.min(dia, ultimoDia);
}

function proximaDataDia(dia) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diaHoje = hoje.getDate();
  const diaAtualMes = ajustarDia(ano, mes, dia);
  if (diaHoje <= diaAtualMes) return new Date(ano, mes, diaAtualMes);
  const proximoMes = mes + 1;
  const anoProximo = ano + Math.floor(proximoMes / 12);
  const mesProximo = proximoMes % 12;
  const diaProximoMes = ajustarDia(anoProximo, mesProximo, dia);
  return new Date(anoProximo, mesProximo, diaProximoMes);
}

function periodoFaturaAtual(cartao) {
  const fechamento = Number(cartao.closing_day || 25);
  const proximoFechamento = proximaDataDia(fechamento);
  const inicio = new Date(proximoFechamento.getFullYear(), proximoFechamento.getMonth() - 1, proximoFechamento.getDate() + 1);
  return { inicio: dataIso(inicio), fim: dataIso(proximoFechamento), proximoFechamento };
}

export default function CartoesPage() {
  const [cartoes, setCartoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [parcelamentos, setParcelamentos] = useState([]);
  const [faturas, setFaturas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvandoParcelamento, setSalvandoParcelamento] = useState(false);
  const [pagandoId, setPagandoId] = useState(null);
  const [fechandoId, setFechandoId] = useState(null);
  const [pagamentos, setPagamentos] = useState({});
  const [faturaExpandida, setFaturaExpandida] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarParcelamento, setMostrarParcelamento] = useState(false);
  const [editandoParcelamentoId, setEditandoParcelamentoId] = useState(null);
  const { confirmar, dialogo } = useConfirmDialog();
  const [form, setForm] = useState({
    name: "",
    brand: "",
    limit_amount: "",
    closing_day: "25",
    due_day: "5",
    is_active: true,
  });
  const [formParcelamento, setFormParcelamento] = useState({
    credit_card: "",
    category: "",
    description: "",
    total_amount: "",
    installments_count: "2",
    purchase_date: dataIso(new Date()),
  });

  useEffect(() => {
    async function carregar() {
      try {
        const [cartoesApi, contasApi, categoriasApi, transacoesApi, parcelamentosApi, faturasApi] = await Promise.all([
          buscarCartoes(),
          buscarContas(),
          buscarCategorias(),
          buscarTransacoes(),
          buscarParcelamentosCartao(),
          buscarFaturasCartao(),
        ]);
        setCartoes(cartoesApi);
        setContas(contasApi);
        setCategorias(categoriasApi);
        setTransacoes(transacoesApi);
        setParcelamentos(parcelamentosApi);
        setFaturas(faturasApi);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const formatoData = useMemo(() => new Intl.DateTimeFormat("pt-BR"), []);

  async function atualizarFaturas() {
    const faturasApi = await buscarFaturasCartao();
    setFaturas(faturasApi);
  }

  const cartoesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cartoes.filter((item) => {
      const nomeOk = !termo || item.name.toLowerCase().includes(termo) || (item.brand || "").toLowerCase().includes(termo);
      const statusOk =
        filtroStatus === "all" ||
        (filtroStatus === "active" && item.is_active) ||
        (filtroStatus === "inactive" && !item.is_active);
      return nomeOk && statusOk;
    });
  }, [cartoes, busca, filtroStatus]);

  const cartoesComMetricas = useMemo(() => {
    return cartoesFiltrados.map((cartao) => {
      const limite = Number(cartao.limit_amount || 0);
      const periodo = periodoFaturaAtual(cartao);
      const comprasAvulsasNaFatura = transacoes
        .filter(
          (item) =>
            Number(item.credit_card) === Number(cartao.id) &&
            item.transaction_type === "expense" &&
            !item.installment_id &&
            item.occurred_on >= periodo.inicio &&
            item.occurred_on <= periodo.fim
        )
        .reduce((soma, item) => soma + Number(item.amount || 0), 0);
      const parcelasAbertas = parcelamentos
        .filter((purchase) => Number(purchase.credit_card) === Number(cartao.id))
        .flatMap((purchase) => purchase.installments || [])
        .filter((installment) => installment.status === "open")
        .reduce((soma, installment) => soma + Number(installment.amount || 0), 0);
      const usado = comprasAvulsasNaFatura + parcelasAbertas;
      const disponivel = Math.max(0, limite - usado);
      const percentualUso = limite > 0 ? Math.min(100, (usado / limite) * 100) : 0;
      return {
        ...cartao,
        limite,
        usado,
        disponivel,
        percentualUso,
      };
    });
  }, [cartoesFiltrados, transacoes, parcelamentos]);

  const categoriasDespesa = useMemo(
    () => categorias.filter((item) => item.transaction_type === "expense"),
    [categorias]
  );

  const resumo = useMemo(() => {
    const ativos = cartoesComMetricas.filter((item) => item.is_active).length;
    const limiteTotal = cartoesComMetricas.reduce((soma, item) => soma + item.limite, 0);
    const usadoTotal = cartoesComMetricas.reduce((soma, item) => soma + item.usado, 0);
    const disponivelTotal = Math.max(0, limiteTotal - usadoTotal);
    const mediaLimite = cartoesComMetricas.length > 0 ? limiteTotal / cartoesComMetricas.length : 0;
    return { ativos, limiteTotal, usadoTotal, disponivelTotal, mediaLimite };
  }, [cartoesComMetricas]);

  function iniciarCriacao() {
    setEditandoId(null);
    setForm({
      name: "",
      brand: "",
      limit_amount: "",
      closing_day: "25",
      due_day: "5",
      is_active: true,
    });
    setErro("");
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setForm({
      name: item.name || "",
      brand: item.brand || "",
      limit_amount: String(item.limit_amount ?? ""),
      closing_day: String(item.closing_day ?? "25"),
      due_day: String(item.due_day ?? "5"),
      is_active: Boolean(item.is_active),
    });
    setErro("");
  }

  async function salvarCartao(evento) {
    evento.preventDefault();
    if (!form.name.trim()) {
      setErro("Informe o nome do cartão.");
      return;
    }
    const fechamento = Number(form.closing_day);
    const vencimento = Number(form.due_day);
    if (fechamento < 1 || fechamento > 31 || vencimento < 1 || vencimento > 31) {
      setErro("Fechamento e vencimento devem estar entre 1 e 31.");
      return;
    }

    setSalvando(true);
    setErro("");
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      limit_amount: Number(form.limit_amount || 0),
      closing_day: fechamento,
      due_day: vencimento,
      is_active: form.is_active,
    };
    try {
      if (editandoId) {
        const atualizado = await atualizarCartao(editandoId, payload);
        setCartoes((atual) => atual.map((item) => (item.id === editandoId ? atualizado : item)));
      } else {
        const criado = await criarCartao(payload);
        setCartoes((atual) => [criado, ...atual]);
      }
      iniciarCriacao();
      setMostrarFormulario(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerCartao(item) {
    const confirmou = await confirmar({
      titulo: "Excluir cartão",
      mensagem: `Remover o cartão "${item.name}"?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    setErro("");
    try {
      await excluirCartao(item.id);
      setCartoes((atual) => atual.filter((cartao) => cartao.id !== item.id));
      if (editandoId === item.id) {
        iniciarCriacao();
        setMostrarFormulario(false);
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  async function salvarParcelamento(evento) {
    evento.preventDefault();
    if (!formParcelamento.credit_card || !formParcelamento.category || !formParcelamento.description.trim()) {
      setErro("Preencha cartão, categoria e descrição do parcelamento.");
      return;
    }
    if (Number(formParcelamento.total_amount) <= 0 || Number(formParcelamento.installments_count) < 1) {
      setErro("Informe valor total e quantidade de parcelas válidos.");
      return;
    }
    setSalvandoParcelamento(true);
    setErro("");
    try {
      const payload = {
        credit_card: Number(formParcelamento.credit_card),
        category: Number(formParcelamento.category),
        description: formParcelamento.description.trim(),
        total_amount: Number(formParcelamento.total_amount),
        installments_count: Number(formParcelamento.installments_count),
        purchase_date: formParcelamento.purchase_date,
      };
      if (editandoParcelamentoId) {
        await atualizarParcelamentoCartao(editandoParcelamentoId, payload);
      } else {
        await criarParcelamentoCartao(payload);
      }
      const parcelamentosAtualizados = await buscarParcelamentosCartao();
      setParcelamentos(parcelamentosAtualizados);
      const transacoesAtualizadas = await buscarTransacoes();
      setTransacoes(transacoesAtualizadas);
      setFormParcelamento({
        credit_card: "",
        category: "",
        description: "",
        total_amount: "",
        installments_count: "2",
        purchase_date: dataIso(new Date()),
      });
      setEditandoParcelamentoId(null);
      setMostrarParcelamento(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvandoParcelamento(false);
    }
  }

  async function removerParcelamento(item) {
    const confirmou = await confirmar({
      titulo: "Excluir parcelamento",
      mensagem: `Remover parcelamento "${item.description}"?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    setErro("");
    try {
      await excluirParcelamentoCartao(item.id);
      setParcelamentos((atual) => atual.filter((p) => p.id !== item.id));
      const transacoesAtualizadas = await buscarTransacoes();
      setTransacoes(transacoesAtualizadas);
    } catch (e) {
      setErro(e.message);
    }
  }

  function iniciarEdicaoParcelamento(item) {
    setEditandoParcelamentoId(item.id);
    setFormParcelamento({
      credit_card: String(item.credit_card || ""),
      category: String(item.category || ""),
      description: item.description || "",
      total_amount: String(item.total_amount || ""),
      installments_count: String(item.installments_count || "1"),
      purchase_date: item.purchase_date || dataIso(new Date()),
    });
    setMostrarParcelamento(true);
    setErro("");
  }

  function atualizarPagamento(invoiceId, campo, valor) {
    setPagamentos((atual) => ({
      ...atual,
      [invoiceId]: { ...(atual[invoiceId] || {}), [campo]: valor },
    }));
  }

  async function fecharFatura(invoice) {
    setFechandoId(invoice.id);
    setErro("");
    try {
      await fecharFaturaCartao(invoice.id);
      await atualizarFaturas();
    } catch (e) {
      setErro(e.message);
    } finally {
      setFechandoId(null);
    }
  }

  async function pagarFatura(invoice) {
    const pagamento = pagamentos[invoice.id] || {};
    if (!pagamento.account || !pagamento.amount) {
      setErro("Informe conta e valor para pagar a fatura.");
      return;
    }
    setPagandoId(invoice.id);
    setErro("");
    try {
      await pagarFaturaCartao(invoice.id, {
        account: pagamento.account,
        amount: Number(pagamento.amount),
        paid_on: dataIso(new Date()),
      });
      await atualizarFaturas();
      setPagamentos((atual) => ({ ...atual, [invoice.id]: { account: "", amount: "" } }));
    } catch (e) {
      setErro(e.message);
    } finally {
      setPagandoId(null);
    }
  }

  function alternarDetalheFatura(id) {
    setFaturaExpandida((atual) => (atual === id ? null : id));
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Cartões de crédito</h1>
        <p className="mt-2 text-sm text-ink/70">
          Cadastre seus cartões com limite, dia de fechamento e dia de vencimento para preparar faturas e alertas.
        </p>

        <CartoesResumo resumo={resumo} />

        {erro ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}

        <div className="mt-6 rounded-[24px] border border-graphite/10 bg-white/80 p-5 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink" style={{ fontFamily: "Fraunces, serif" }}>
                Faturas do cartao
              </h2>
              <p className="mt-1 text-xs text-ink/60">
                Acompanhe fechamento, vencimento e pagamentos.
              </p>
            </div>
          </div>

          {faturas.length === 0 ? (
            <p className="mt-4 rounded-xl border border-graphite/10 bg-paper px-4 py-3 text-sm text-ink/70">
              Nenhuma fatura encontrada ainda.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {faturas.slice(0, 8).map((invoice) => {
                const restante = Number(invoice.total_amount) - Number(invoice.paid_amount || 0);
                const pagamento = pagamentos[invoice.id] || {};
                const nomeCartao =
                  cartoes.find((item) => Number(item.id) === Number(invoice.credit_card))?.name || "Cartao";
                const aberta = invoice.status === "open";
                return (
                  <li key={invoice.id} className="rounded-2xl border border-graphite/10 bg-paper p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{nomeCartao}</p>
                        <p className="text-xs text-ink/60">
                          Periodo {formatoData.format(new Date(invoice.period_start))} -{" "}
                          {formatoData.format(new Date(invoice.period_end))} | Vencimento{" "}
                          {formatoData.format(new Date(invoice.due_date))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            invoice.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : invoice.status === "closed"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-paper text-ink/70 border border-graphite/20"
                          }`}
                        >
                          {invoice.status === "paid"
                            ? "Paga"
                            : invoice.status === "closed"
                              ? "Fechada"
                              : "Aberta"}
                        </span>
                        <span className="text-sm font-semibold text-ink">
                          R$ {Number(invoice.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alternarDetalheFatura(invoice.id)}
                        className="rounded-xl border border-graphite/20 bg-paper px-3 py-1.5 text-xs font-semibold text-ink/80 hover:bg-ink/5"
                      >
                        {faturaExpandida === invoice.id ? "Ocultar detalhes" : "Ver detalhes"}
                      </button>
                      {invoice.status !== "paid" ? (
                        <button
                          type="button"
                          onClick={() => fecharFatura(invoice)}
                          disabled={fechandoId === invoice.id}
                          className="rounded-xl border border-graphite/20 bg-paper px-3 py-1.5 text-xs font-semibold text-ink/80 hover:bg-ink/5 disabled:opacity-60"
                        >
                          {fechandoId === invoice.id ? "Fechando..." : "Fechar fatura"}
                        </button>
                      ) : null}

                      {invoice.status !== "paid" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={pagamento.account || ""}
                            onChange={(e) => atualizarPagamento(invoice.id, "account", e.target.value)}
                            className="rounded-xl border border-graphite/20 bg-white px-3 py-1.5 text-xs"
                          >
                            <option value="">Conta para pagamento</option>
                            {contas.map((conta) => (
                              <option key={conta.id} value={conta.id}>
                                {conta.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={pagamento.amount || ""}
                            onChange={(e) => atualizarPagamento(invoice.id, "amount", e.target.value)}
                            placeholder={`Valor (restante R$ ${restante.toFixed(2)})`}
                            className="rounded-xl border border-graphite/20 bg-white px-3 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => pagarFatura(invoice)}
                            disabled={pagandoId === invoice.id}
                            className="rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-paper hover:bg-graphite disabled:opacity-60"
                          >
                            {pagandoId === invoice.id ? "Pagando..." : "Pagar"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink/60">
                          Pago. Total recebido: R$ {Number(invoice.paid_amount || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {faturaExpandida === invoice.id ? (
                      <div className="mt-4 rounded-2xl border border-graphite/10 bg-white/80 p-4">
                        {aberta ? (
                          <p className="text-xs text-ink/60">
                            A fatura ainda esta aberta. Feche para travar os itens e revisar.
                          </p>
                        ) : (
                          <>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/60">
                              <span>Itens: {invoice.items?.length || 0}</span>
                              <span>Pago: R$ {Number(invoice.paid_amount || 0).toFixed(2)}</span>
                              <span>Restante: R$ {Math.max(0, restante).toFixed(2)}</span>
                            </div>
                            {invoice.items && invoice.items.length > 0 ? (
                              <ul className="space-y-2">
                                {invoice.items.map((item) => (
                                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <div className="min-w-0">
                                      <p className="truncate text-ink">{item.description || "Despesa no cartao"}</p>
                                      <p className="text-[11px] text-ink/60">
                                        {formatoData.format(new Date(item.occurred_on))}
                                      </p>
                                    </div>
                                    <span className="text-sm font-semibold text-ink">
                                      R$ {Number(item.amount).toFixed(2)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-ink/60">Nenhum item registrado para esta fatura.</p>
                            )}

                            {invoice.payments && invoice.payments.length > 0 ? (
                              <div className="mt-4 border-t border-graphite/10 pt-3">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60">Pagamentos</p>
                                <ul className="mt-2 space-y-1 text-xs text-ink/70">
                                  {invoice.payments.map((payment) => (
                                    <li key={payment.id} className="flex items-center justify-between">
                                      <span>{formatoData.format(new Date(payment.paid_on))}</span>
                                      <span>R$ {Number(payment.amount).toFixed(2)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-graphite/10 bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Parcelamentos no cartão</h2>
              <p className="mt-1 text-xs text-ink/60">
                Cada parcela gera automaticamente uma despesa futura no cartão correspondente.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMostrarParcelamento((v) => {
                  const proximo = !v;
                  if (!proximo) {
                    setEditandoParcelamentoId(null);
                  }
                  return proximo;
                })
              }
              className="rounded-lg border border-graphite/20 bg-white px-4 py-2 text-sm font-semibold text-ink/80"
            >
              {mostrarParcelamento ? "Fechar parcelamento" : "Nova compra parcelada"}
            </button>
          </div>

          {mostrarParcelamento ? (
            <form className="mt-4 grid gap-2 grid-cols-3" onSubmit={salvarParcelamento}>
              <select
                value={formParcelamento.credit_card}
                onChange={(e) => setFormParcelamento((atual) => ({ ...atual, credit_card: e.target.value }))}
                className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
              >
                <option value="">Selecione o cartão</option>
                {cartoes.filter((item) => item.is_active).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                value={formParcelamento.category}
                onChange={(e) => setFormParcelamento((atual) => ({ ...atual, category: e.target.value }))}
                className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
              >
                <option value="">Selecione a categoria</option>
                {categoriasDespesa.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                value={formParcelamento.description}
                onChange={(e) => setFormParcelamento((atual) => ({ ...atual, description: e.target.value }))}
                placeholder="Descrição da compra"
                className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formParcelamento.total_amount}
                onChange={(e) => setFormParcelamento((atual) => ({ ...atual, total_amount: e.target.value }))}
                placeholder="Valor total"
                className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                max="48"
                value={formParcelamento.installments_count}
                onChange={(e) => setFormParcelamento((atual) => ({ ...atual, installments_count: e.target.value }))}
                placeholder="Parcelas"
                className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={formParcelamento.purchase_date}
                onChange={(e) => setFormParcelamento((atual) => ({ ...atual, purchase_date: e.target.value }))}
                className="rounded-lg border border-graphite/20 px-3 py-2 text-sm"
              />
              <div className="col-span-3">
                <button
                  type="submit"
                  disabled={salvandoParcelamento}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {salvandoParcelamento
                    ? "Salvando..."
                    : editandoParcelamentoId
                      ? "Salvar alterações do parcelamento"
                      : "Salvar parcelamento"}
                </button>
              </div>
            </form>
          ) : null}

          <ul className="mt-4 space-y-2">
            {parcelamentos.slice(0, 6).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.description}</p>
                  <p className="text-xs text-ink/60">
                    {item.installments_count}x | Total R$ {Number(item.total_amount || 0).toFixed(2)} | Compra em{" "}
                    {item.purchase_date}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => iniciarEdicaoParcelamento(item)}
                  className="rounded-md border border-graphite/20 px-2 py-1 text-xs font-semibold text-ink/80"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => removerParcelamento(item)}
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (mostrarFormulario) {
                setMostrarFormulario(false);
                iniciarCriacao();
              } else {
                iniciarCriacao();
                setMostrarFormulario(true);
              }
            }}
            className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80"
          >
            {mostrarFormulario ? "Fechar painel" : "Novo cartão"}
          </button>
        </div>

        <div className={`mt-4 ${mostrarFormulario ? "grid gap-4 grid-cols-3" : ""}`}>
          {mostrarFormulario ? (
            <CartoesFormulario
              editandoId={editandoId}
              form={form}
              setForm={setForm}
              salvando={salvando}
              onSubmit={salvarCartao}
              onCancel={() => {
                iniciarCriacao();
                setMostrarFormulario(false);
              }}
            />
          ) : null}
          <CartoesLista
            carregando={carregando}
            cartoesFiltrados={cartoesComMetricas}
            busca={busca}
            setBusca={setBusca}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            onEdit={iniciarEdicao}
            onDelete={removerCartao}
          />
        </div>
      </section>
      {dialogo}
    </main>
  );
}



