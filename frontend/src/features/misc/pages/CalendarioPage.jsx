import { useEffect, useMemo, useState } from "react";
import {
  buscarCartoes,
  buscarCategorias,
  buscarContas,
  buscarTransacoes,
} from "../../../lib/api";

function isoDate(data) {
  return data.toISOString().slice(0, 10);
}

function isoMonth(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarDays(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startIndex = (firstDay.getDay() + 6) % 7; // Monday = 0
  const totalCells = Math.ceil((startIndex + daysInMonth) / 7) * 7;
  const cells = [];

  for (let i = 0; i < totalCells; i += 1) {
    const dayNumber = i - startIndex + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayNumber));
    }
  }
  return cells;
}

export default function CalendarioPage() {
  const [mesBase, setMesBase] = useState(() => new Date());
  const [selecionado, setSelecionado] = useState(() => isoDate(new Date()));
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const [categoriasApi, contasApi, cartoesApi, transacoesApi] = await Promise.all([
          buscarCategorias(),
          buscarContas(),
          buscarCartoes(),
          buscarTransacoes({ mes: isoMonth(mesBase) }),
        ]);
        setCategorias(categoriasApi);
        setContas(contasApi);
        setCartoes(cartoesApi);
        setTransacoes(transacoesApi);

        const primeiroDia = new Date(mesBase.getFullYear(), mesBase.getMonth(), 1);
        setSelecionado(isoDate(primeiroDia));
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [mesBase]);

  const formatoMes = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }),
    []
  );
  const formatoDia = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }),
    []
  );
  const formatoMoeda = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const nomeCategoriaPorId = useMemo(
    () => Object.fromEntries(categorias.map((item) => [item.id, item.name])),
    [categorias]
  );
  const nomeContaPorId = useMemo(
    () => Object.fromEntries(contas.map((item) => [item.id, item.name])),
    [contas]
  );
  const nomeCartaoPorId = useMemo(
    () => Object.fromEntries(cartoes.map((item) => [item.id, item.name])),
    [cartoes]
  );

  const transacoesPorDia = useMemo(() => {
    const mapa = {};
    transacoes.forEach((item) => {
      if (!item.occurred_on) return;
      if (!mapa[item.occurred_on]) mapa[item.occurred_on] = [];
      mapa[item.occurred_on].push(item);
    });
    return mapa;
  }, [transacoes]);

  const resumoMes = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    transacoes.forEach((item) => {
      const valor = Number(item.amount || 0);
      if (item.transaction_type === "income") receitas += valor;
      if (item.transaction_type === "expense") despesas += valor;
    });
    return { receitas, despesas, saldo: receitas - despesas };
  }, [transacoes]);

  const transacoesSelecionadas = useMemo(
    () => transacoesPorDia[selecionado] || [],
    [transacoesPorDia, selecionado]
  );

  const dias = useMemo(() => buildCalendarDays(mesBase), [mesBase]);

  function voltarMes() {
    setMesBase((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1));
  }

  function avancarMes() {
    setMesBase((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1));
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
            <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Calendario</h1>
            <p className="mt-2 text-sm text-ink/70">
              Visao cronologica de entradas, saidas e vencimentos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={voltarMes}
              className="rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5"
            >
              Mes anterior
            </button>
            <button
              type="button"
              onClick={avancarMes}
              className="rounded-xl border border-graphite/20 bg-paper px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5"
            >
              Proximo mes
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-graphite/10 bg-paper px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            {formatoMes.format(mesBase)}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink/70">
            <span>Receitas: {formatoMoeda.format(resumoMes.receitas)}</span>
            <span>Despesas: {formatoMoeda.format(resumoMes.despesas)}</span>
            <span>Saldo: {formatoMoeda.format(resumoMes.saldo)}</span>
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
          <div className="mt-6 grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-graphite/10 bg-white/80 p-4">
              <div className="grid grid-cols-7 gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/50">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((label) => (
                  <div key={label} className="text-center">
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {dias.map((dia, idx) => {
                  if (!dia) {
                    return <div key={`vazio-${idx}`} className="h-20 rounded-xl border border-transparent" />;
                  }
                  const chave = isoDate(dia);
                  const lista = transacoesPorDia[chave] || [];
                  const receitas = lista
                    .filter((item) => item.transaction_type === "income")
                    .reduce((soma, item) => soma + Number(item.amount || 0), 0);
                  const despesas = lista
                    .filter((item) => item.transaction_type === "expense")
                    .reduce((soma, item) => soma + Number(item.amount || 0), 0);
                  const saldo = receitas - despesas;
                  const ativo = chave === selecionado;
                  return (
                    <button
                      type="button"
                      key={chave}
                      onClick={() => setSelecionado(chave)}
                      className={`h-20 rounded-xl border p-2 text-left transition ${
                        ativo
                          ? "border-ink/40 bg-ink/5"
                          : "border-graphite/10 bg-paper hover:border-graphite/30"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-ink">
                        <span>{dia.getDate()}</span>
                        {lista.length > 0 ? (
                          <span className="text-[10px] text-ink/60">{lista.length}</span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-lime" />
                        <span className="h-2 w-2 rounded-full bg-coral" />
                      </div>
                      <p className={`mt-2 text-[11px] font-semibold ${saldo < 0 ? "text-coral" : "text-ink"}`}>
                        {formatoMoeda.format(saldo)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-graphite/10 bg-white/80 p-4">
              <h2 className="text-base font-semibold text-ink font-editorial">Dia selecionado</h2>
              <p className="mt-1 text-xs text-ink/60">{formatoDia.format(new Date(selecionado))}</p>

              {transacoesSelecionadas.length === 0 ? (
                <p className="mt-4 rounded-xl border border-graphite/10 bg-paper px-3 py-2 text-sm text-ink/60">
                  Sem movimentos neste dia.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {transacoesSelecionadas.map((item) => (
                    <li key={item.id} className="rounded-xl border border-graphite/10 bg-paper p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {item.description || "Sem descricao"}
                          </p>
                          <p className="text-[11px] text-ink/60">
                            {nomeCategoriaPorId[item.category] || `Categoria #${item.category}`}
                          </p>
                          <p className="text-[11px] text-ink/50">
                            {item.account ? `Conta: ${nomeContaPorId[item.account] || item.account}` : ""}
                            {item.credit_card
                              ? `Cartao: ${nomeCartaoPorId[item.credit_card] || item.credit_card}`
                              : ""}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${item.transaction_type === "expense" ? "text-coral" : "text-ink"}`}>
                          {item.transaction_type === "expense" ? "-" : "+"}
                          {formatoMoeda.format(Number(item.amount))}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
