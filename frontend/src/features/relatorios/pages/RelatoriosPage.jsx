import { useEffect, useMemo, useState } from "react";
import RelatoriosPainelExportacao from "../components/RelatoriosPainelExportacao";
import RelatoriosResumo from "../components/RelatoriosResumo";
import { buscarFluxoCaixa } from "../../../lib/api";
import {
  carregarDadosRelatorios,
  exportarRelatorioCsv,
  exportarRelatorioPdf,
  filtrarTransacoesRelatorio,
  montarRelatorio,
} from "../../../lib/relatorios";

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function diffMeses(inicio, fim) {
  const start = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const end = new Date(fim.getFullYear(), fim.getMonth(), 1);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

export default function RelatoriosPage() {
  const [dados, setDados] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [fluxo, setFluxo] = useState(null);
  const [fluxoDias, setFluxoDias] = useState(90);
  const [fluxoErro, setFluxoErro] = useState("");
  const [fluxoCarregando, setFluxoCarregando] = useState(false);
  const [filtros, setFiltros] = useState({
    inicio: `${hojeIso().slice(0, 7)}-01`,
    fim: hojeIso(),
    tipo: "all",
    conta: "all",
    categoria: "all",
    termo: "",
  });

  async function carregarBase() {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await carregarDadosRelatorios();
      setDados(resultado);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    async function carregarFluxo() {
      setFluxoCarregando(true);
      setFluxoErro("");
      try {
        const resultado = await buscarFluxoCaixa({ dias: fluxoDias });
        setFluxo(resultado);
      } catch (e) {
        setFluxoErro(e.message);
      } finally {
        setFluxoCarregando(false);
      }
    }
    carregarFluxo();
  }, [fluxoDias]);

  const resumoAtual = useMemo(() => {
    if (!relatorio) {
      return { receitas: 0, despesas: 0, saldo: 0, quantidadeTransacoes: 0 };
    }
    return relatorio.resumo;
  }, [relatorio]);

  const planejamento = useMemo(() => {
    if (!dados) return { metas: [], orcamentos: [], saldoMensalRecorrente: 0 };
    const hoje = new Date();
    const mesAtual = hojeIso().slice(0, 7);
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const diaAtual = hoje.getDate();

    const recorrenciasAtivas = dados.recorrencias.filter((item) => item.active);
    const saldoMensalRecorrente = recorrenciasAtivas.reduce((saldo, item) => {
      const valor = Number(item.amount || 0);
      let mensal = valor;
      if (item.frequency === "weekly") mensal = valor * 4.33;
      if (item.frequency === "yearly") mensal = valor / 12;
      return saldo + (item.transaction_type === "income" ? mensal : -mensal);
    }, 0);

    const metas = dados.metas
      .filter((item) => item.active)
      .map((meta) => {
        const alvo = Number(meta.target_amount || 0);
        const atual = Number(meta.current_amount || 0);
        const restante = Math.max(0, alvo - atual);
        const vencimento = meta.due_date ? new Date(meta.due_date) : null;
        const mesesRestantes = vencimento ? Math.max(1, diffMeses(hoje, vencimento)) : null;
        const aporteMensal = mesesRestantes ? restante / mesesRestantes : null;
        const atrasada = vencimento ? hoje > vencimento && restante > 0 : false;
        const risco = aporteMensal !== null ? aporteMensal > Math.max(0, saldoMensalRecorrente) : false;
        return {
          ...meta,
          alvo,
          atual,
          restante,
          vencimento,
          mesesRestantes,
          aporteMensal,
          atrasada,
          risco,
        };
      });

    const transacoesMes = dados.transacoes.filter((item) => item.occurred_on_iso?.startsWith(mesAtual));
    const gastosPorCategoria = {};
    transacoesMes
      .filter((item) => item.transaction_type === "expense")
      .forEach((item) => {
        const chave = String(item.category);
        gastosPorCategoria[chave] = (gastosPorCategoria[chave] || 0) + Number(item.amount_num || 0);
      });

    const orcamentos = dados.orcamentos
      .filter((item) => item.month_ref === mesAtual && item.active)
      .map((orc) => {
        const gastoAtual = gastosPorCategoria[String(orc.category)] || 0;
        const limite = Number(orc.limit_amount || 0);
        const projeção = diaAtual > 0 ? (gastoAtual / diaAtual) * diasNoMes : gastoAtual;
        const risco = projeção > limite;
        return {
          ...orc,
          gastoAtual,
          limite,
          projetado: projeção,
          risco,
        };
      });

    return { metas, orcamentos, saldoMensalRecorrente };
  }, [dados]);

  const alertas = useMemo(() => {
    if (!dados || !planejamento || !fluxo) return [];
    const lista = [];
    const saldoFinal = fluxo.points?.length ? fluxo.points[fluxo.points.length - 1].balance : null;
    if (saldoFinal !== null && saldoFinal < 0) {
      lista.push("Projecao indica saldo negativo no fim do periodo.");
    }
    if (planejamento.saldoMensalRecorrente < 0) {
      lista.push("Recorrencias mensais negativas: ajuste despesas fixas.");
    }
    const metasRisco = planejamento.metas.filter((m) => m.risco || m.atrasada).length;
    if (metasRisco > 0) {
      lista.push(`Metas em risco: ${metasRisco}.`);
    }
    const orcamentosRisco = planejamento.orcamentos.filter((o) => o.risco).length;
    if (orcamentosRisco > 0) {
      lista.push(`Orcamentos com risco de estourar: ${orcamentosRisco}.`);
    }
    return lista;
  }, [dados, planejamento, fluxo]);

  function atualizarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  function gerarRelatorio() {
    if (!dados) return;
    const transacoes = filtrarTransacoesRelatorio(dados.transacoes, filtros);
    const novoRelatorio = montarRelatorio(dados, filtros, transacoes);
    setRelatorio(novoRelatorio);
    setMensagem(`Relatorio gerado com ${novoRelatorio.resumo.quantidadeTransacoes} transacoes.`);
    setErro("");
  }

  function exportarCsv() {
    if (!relatorio) {
      setErro("Gere o relatorio antes de exportar.");
      return;
    }
    exportarRelatorioCsv(relatorio);
  }

  function exportarPdf() {
    if (!relatorio) {
      setErro("Gere o relatorio antes de exportar.");
      return;
    }
    try {
      exportarRelatorioPdf(relatorio);
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <main className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
      <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Relatorios</h1>
      <p className="mt-2 text-sm text-ink/70">
        Analise resultados por periodo, categoria, conta e centro de custo.
      </p>

      {erro ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}
      {mensagem ? <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</p> : null}

      <section className="mt-6 rounded-2xl border border-graphite/10 bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink font-editorial">Fluxo de caixa projetado</h2>
            <p className="mt-1 text-xs text-ink/60">Considera apenas movimentacoes em contas.</p>
          </div>
          <select
            value={fluxoDias}
            onChange={(e) => setFluxoDias(Number(e.target.value))}
            className="rounded-xl border border-graphite/20 bg-white px-3 py-2 text-sm"
          >
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </div>

        {fluxoErro ? (
          <p className="mt-3 rounded-xl border border-graphite/10 bg-white px-3 py-2 text-sm text-ink/70">
            {fluxoErro}
          </p>
        ) : null}

        {fluxoCarregando ? (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-graphite/5" />
            ))}
          </div>
        ) : fluxo ? (
          <>
            <div className="mt-4 grid gap-3 grid-cols-3">
              <article className="rounded-xl border border-graphite/10 bg-white p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Receitas</p>
                <p className="mt-1 text-sm text-ink/80">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(fluxo.totals.incomes)}
                </p>
              </article>
              <article className="rounded-xl border border-graphite/10 bg-white p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Despesas</p>
                <p className="mt-1 text-sm text-ink/80">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(fluxo.totals.expenses)}
                </p>
              </article>
              <article className="rounded-xl border border-graphite/10 bg-white p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Saldo projetado</p>
                <p className="mt-1 text-sm text-ink/80">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(fluxo.totals.net)}
                </p>
              </article>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-graphite/10 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-graphite/5 text-left text-xs uppercase tracking-[0.08em] text-ink/70">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2 text-right">Entradas</th>
                    <th className="px-3 py-2 text-right">Saidas</th>
                    <th className="px-3 py-2 text-right">Saldo do dia</th>
                    <th className="px-3 py-2 text-right">Saldo acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {fluxo.points.map((item) => (
                    <tr key={item.date} className="border-t border-graphite/10">
                      <td className="px-3 py-2">{item.date}</td>
                      <td className="px-3 py-2 text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.incomes)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.expenses)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.net)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <RelatoriosResumo resumo={resumoAtual} />
      <RelatoriosPainelExportacao
        filtros={filtros}
        contas={dados?.contas || []}
        categorias={dados?.categorias || []}
        carregando={carregando}
        onFiltroChange={atualizarFiltro}
        onGerar={gerarRelatorio}
        onExportarCsv={exportarCsv}
        onExportarPdf={exportarPdf}
        onRecarregarDados={carregarBase}
      />

      {relatorio ? (
        <section className="mt-4 rounded-2xl border border-graphite/10 bg-paper p-4">
          <h2 className="text-base font-bold text-ink">Resumo integrado do sistema</h2>
          <div className="mt-3 grid gap-3 grid-cols-4">
            <article className="rounded-lg border border-graphite/10 bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Investimentos</p>
              <p className="mt-1 text-sm text-ink/80">
                Patrimonio: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(relatorio.modulos.investimentos.totalAtual)}
              </p>
            </article>
            <article className="rounded-lg border border-graphite/10 bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Metas</p>
              <p className="mt-1 text-sm text-ink/80">
                {relatorio.modulos.metas.concluidas}/{relatorio.modulos.metas.total} concluidas
              </p>
            </article>
            <article className="rounded-lg border border-graphite/10 bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Recorrencias</p>
              <p className="mt-1 text-sm text-ink/80">
                Saldo mensal: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(relatorio.modulos.recorrencias.saldoMensal)}
              </p>
            </article>
            <article className="rounded-lg border border-graphite/10 bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">Orcamentos (mes)</p>
              <p className="mt-1 text-sm text-ink/80">
                Limite: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(relatorio.modulos.orcamentos.limiteMes)}
              </p>
            </article>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-graphite/10 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-graphite/5 text-left text-xs uppercase tracking-[0.08em] text-ink/70">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Conta/Cartao</th>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2">Descricao</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.transacoes.slice(0, 100).map((item) => (
                  <tr key={item.id} className="border-t border-graphite/10">
                    <td className="px-3 py-2">{item.occurred_on_iso}</td>
                    <td className="px-3 py-2">{item.tipo_label}</td>
                    <td className="px-3 py-2">{item.conta_nome || item.cartao_nome || "-"}</td>
                    <td className="px-3 py-2">{item.categoria_nome || "-"}</td>
                    <td className="px-3 py-2">{item.description || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount_num)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-graphite/10 bg-paper p-4">
        <h2 className="text-base font-bold text-ink font-editorial">Alertas inteligentes</h2>
        <p className="mt-1 text-xs text-ink/60">Sinais de risco para o periodo atual.</p>
        {alertas.length === 0 ? (
          <p className="mt-3 rounded-xl border border-graphite/10 bg-white px-3 py-2 text-sm text-ink/70">
            Nenhum alerta critico por enquanto.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {alertas.map((item, idx) => (
              <li key={`${item}-${idx}`} className="rounded-xl border border-coral/20 bg-coral/10 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      {dados ? (
        <section className="mt-6 rounded-2xl border border-graphite/10 bg-paper p-4">
          <h2 className="text-base font-bold text-ink font-editorial">Planejamento financeiro</h2>
          <p className="mt-1 text-xs text-ink/60">Risco por metas e orcamentos do mes atual.</p>

          <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
            <article className="rounded-2xl border border-graphite/10 bg-white/80 p-4">
              <h3 className="text-sm font-semibold text-ink">Metas</h3>
              {planejamento.metas.length === 0 ? (
                <p className="mt-3 text-sm text-ink/60">Nenhuma meta ativa.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {planejamento.metas.map((meta) => (
                    <li key={meta.id} className="rounded-xl border border-graphite/10 bg-paper p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{meta.title}</p>
                          <p className="text-[11px] text-ink/60">
                            Alvo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(meta.alvo)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            meta.atrasada || meta.risco ? "bg-coral/20 text-coral" : "bg-paper text-ink/70 border border-graphite/20"
                          }`}
                        >
                          {meta.atrasada ? "Atrasada" : meta.risco ? "Risco" : "Ok"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-ink/70">
                        Restante: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(meta.restante)}
                      </div>
                      {meta.aporteMensal !== null ? (
                        <div className="mt-1 text-xs text-ink/60">
                          Aporte mensal sugerido: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(meta.aporteMensal)} ({meta.mesesRestantes} meses)
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-ink/50">Sem data de vencimento.</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-2xl border border-graphite/10 bg-white/80 p-4">
              <h3 className="text-sm font-semibold text-ink">Orcamentos do mes</h3>
              {planejamento.orcamentos.length === 0 ? (
                <p className="mt-3 text-sm text-ink/60">Nenhum orcamento ativo para este mes.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {planejamento.orcamentos.map((orc) => (
                    <li key={orc.id} className="rounded-xl border border-graphite/10 bg-paper p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {dados.categorias.find((c) => c.id === orc.category)?.name || `Categoria #${orc.category}`}
                          </p>
                          <p className="text-[11px] text-ink/60">
                            Limite: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orc.limite)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            orc.risco ? "bg-coral/20 text-coral" : "bg-paper text-ink/70 border border-graphite/20"
                          }`}
                        >
                          {orc.risco ? "Risco" : "Ok"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-ink/70">
                        Gasto atual: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orc.gastoAtual)}
                      </div>
                      <div className="mt-1 text-xs text-ink/60">
                        Projecao: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orc.projetado)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}




