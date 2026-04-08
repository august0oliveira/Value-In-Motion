import { useEffect, useMemo, useState } from "react";
import RecorrenciasFormulario from "../components/RecorrenciasFormulario";
import RecorrenciasLista from "../components/RecorrenciasLista";
import RecorrenciasResumo from "../components/RecorrenciasResumo";
import useConfirmDialog from "../../../hooks/useConfirmDialog";
import {
  atualizarRecorrencia,
  buscarCartoes,
  buscarCategorias,
  buscarContas,
  buscarRecorrencias,
  criarRecorrencia,
  excluirRecorrencia,
  gerarRecorrencias,
} from "../../../lib/api";

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function paraMensal(item) {
  const valor = Number(item.amount || 0);
  if (item.frequency === "weekly") return valor * 4.33;
  if (item.frequency === "yearly") return valor / 12;
  return valor;
}

export default function RecorrenciasPage() {
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);

  const [recorrencias, setRecorrencias] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { confirmar, dialogo } = useConfirmDialog();

  const [form, setForm] = useState({
    description: "",
    transaction_type: "expense",
    source: "account",
    account: "",
    credit_card: "",
    category: "",
    amount: "",
    frequency: "monthly",
    start_date: hojeIso(),
    end_date: "",
    active: true,
  });

  useEffect(() => {
    async function carregarBase() {
      try {
        const [contasApi, cartoesApi, categoriasApi] = await Promise.all([
          buscarContas(),
          buscarCartoes(),
          buscarCategorias(),
        ]);
        const recorrenciasApi = await buscarRecorrencias();
        setContas(contasApi);
        setCartoes(cartoesApi.filter((item) => item.is_active));
        setCategorias(categoriasApi);
        setRecorrencias(recorrenciasApi);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregarBase();
  }, []);

  const nomeContaPorId = useMemo(
    () => Object.fromEntries(contas.map((item) => [item.id, item.name])),
    [contas]
  );
  const nomeCartaoPorId = useMemo(
    () => Object.fromEntries(cartoes.map((item) => [item.id, item.name])),
    [cartoes]
  );
  const nomeCategoriaPorId = useMemo(
    () => Object.fromEntries(categorias.map((item) => [item.id, item.name])),
    [categorias]
  );

  const categoriasDoTipo = useMemo(
    () => categorias.filter((item) => item.transaction_type === form.transaction_type),
    [categorias, form.transaction_type]
  );

  const recorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return recorrencias.filter((item) => {
      const nomeOk = !termo || item.description.toLowerCase().includes(termo);
      const statusOk = filtroStatus === "all" || (filtroStatus === "active" ? item.active : !item.active);
      return nomeOk && statusOk;
    });
  }, [recorrencias, busca, filtroStatus]);

  const resumo = useMemo(() => {
    const ativas = recorrencias.filter((item) => item.active);
    const receitasAtivas = ativas
      .filter((item) => item.transaction_type === "income")
      .reduce((total, item) => total + paraMensal(item), 0);
    const despesasAtivas = ativas
      .filter((item) => item.transaction_type === "expense")
      .reduce((total, item) => total + paraMensal(item), 0);
    return {
      total: recorrencias.length,
      ativas: ativas.length,
      receitasAtivas,
      despesasAtivas,
    };
  }, [recorrencias]);

  function limparFormulario() {
    setEditandoId(null);
    setForm({
      description: "",
      transaction_type: "expense",
      source: "account",
      account: contas[0]?.id ? String(contas[0].id) : "",
      credit_card: cartoes[0]?.id ? String(cartoes[0].id) : "",
      category: "",
      amount: "",
      frequency: "monthly",
      start_date: hojeIso(),
      end_date: "",
      active: true,
    });
  }

  function editarRecorrencia(item) {
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setForm({
      description: item.description || "",
      transaction_type: item.transaction_type || "expense",
      source: item.source || "account",
      account: item.account ? String(item.account) : "",
      credit_card: item.credit_card ? String(item.credit_card) : "",
      category: item.category ? String(item.category) : "",
      amount: String(item.amount || ""),
      frequency: item.frequency || "monthly",
      start_date: item.start_date || hojeIso(),
      end_date: item.end_date || "",
      active: Boolean(item.active),
    });
  }

  async function salvarRecorrencia(evento) {
    evento.preventDefault();
    setSucesso("");
    if (!form.description.trim()) {
      setErro("Informe a descrição da recorrência.");
      return;
    }
    if (!form.category || !form.amount || Number(form.amount) <= 0) {
      setErro("Informe categoria e valor válido.");
      return;
    }
    if (form.transaction_type === "income" && !form.account) {
      setErro("Receita recorrente deve estar vinculada a uma conta.");
      return;
    }
    if (form.transaction_type === "expense" && form.source === "account" && !form.account) {
      setErro("Despesa recorrente por conta precisa de conta.");
      return;
    }
    if (form.transaction_type === "expense" && form.source === "credit_card" && !form.credit_card) {
      setErro("Despesa recorrente por cartão precisa de cartão.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      const payload = {
        description: form.description.trim(),
        transaction_type: form.transaction_type,
        source: form.transaction_type === "income" ? "account" : form.source,
        account: form.account ? Number(form.account) : null,
        credit_card:
          form.transaction_type === "expense" && form.source === "credit_card" && form.credit_card
            ? Number(form.credit_card)
            : null,
        category: Number(form.category),
        amount: Number(form.amount),
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
        active: form.active,
      };

      if (editandoId) {
        const atualizada = await atualizarRecorrencia(editandoId, payload);
        setRecorrencias((atual) => atual.map((item) => (item.id === editandoId ? atualizada : item)));
      } else {
        const criada = await criarRecorrencia(payload);
        setRecorrencias((atual) => [criada, ...atual]);
      }
      limparFormulario();
      setMostrarFormulario(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerRecorrencia(item) {
    const confirmou = await confirmar({
      titulo: "Excluir reccorrência",
      mensagem: `Remover a recorrência "${item.description}"?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    setSucesso("");
    try {
      await excluirRecorrencia(item.id);
      setRecorrencias((atual) => atual.filter((r) => r.id !== item.id));
      if (editandoId === item.id) {
        limparFormulario();
        setMostrarFormulario(false);
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  async function alternarStatus(item) {
    setSucesso("");
    try {
      const atualizada = await atualizarRecorrencia(item.id, { active: !item.active });
      setRecorrencias((atual) => atual.map((r) => (r.id === item.id ? atualizada : r)));
    } catch (e) {
      setErro(e.message);
    }
  }

  async function gerarTransacoes() {
    setGerando(true);
    setErro("");
    setSucesso("");
    try {
      const resposta = await gerarRecorrencias();
      const criadas = resposta?.created ?? 0;
      setSucesso(`Transacoes geradas: ${criadas}.`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Módulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Recorrências</h1>
        <p className="mt-2 text-sm text-ink/70">
          Defina regras recorrentes para despesas e receitas fixas e gere automaticamente as transacoes.
        </p>

        <RecorrenciasResumo resumo={resumo} />
        {sucesso ? (
          <p className="mt-4 rounded-xl border border-graphite/10 bg-paper px-4 py-3 text-sm text-ink/70">{sucesso}</p>
        ) : null}
        {erro ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}

        {carregando ? (
          <div className="mt-6 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-graphite/5" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={gerarTransacoes}
                disabled={gerando}
                className="rounded-xl border border-graphite/20 bg-paper px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5 disabled:opacity-60"
              >
                {gerando ? "Gerando..." : "Gerar transacoes (60 dias)"}
              </button>
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
                {mostrarFormulario ? "Fechar painel" : "Nova recorrência"}
              </button>
            </div>

            <div className={`mt-4 ${mostrarFormulario ? "grid gap-4 grid-cols-3" : ""}`}>
              {mostrarFormulario ? (
                <RecorrenciasFormulario
                  editandoId={editandoId}
                  form={form}
                  setForm={setForm}
                  contas={contas}
                  cartoes={cartoes}
                  categoriasDoTipo={categoriasDoTipo}
                  salvando={salvando}
                  onSubmit={salvarRecorrencia}
                  onCancel={() => {
                    limparFormulario();
                    setMostrarFormulario(false);
                  }}
                />
              ) : null}
            <RecorrenciasLista
              recorrenciasFiltradas={recorrenciasFiltradas}
              busca={busca}
              setBusca={setBusca}
              filtroStatus={filtroStatus}
              setFiltroStatus={setFiltroStatus}
              nomeContaPorId={nomeContaPorId}
              nomeCartaoPorId={nomeCartaoPorId}
              nomeCategoriaPorId={nomeCategoriaPorId}
              onEdit={editarRecorrencia}
              onToggleAtivo={alternarStatus}
              onDelete={removerRecorrencia}
            />
            </div>
          </>
        )}
      </section>
      {dialogo}
    </main>
  );
}



