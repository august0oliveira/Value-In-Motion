import { useEffect, useMemo, useState } from "react";
import { atualizarConta, buscarContas, criarConta, excluirConta } from "../../../lib/api";
import ContasFormulario from "../components/ContasFormulario";
import ContasLista from "../components/ContasLista";
import ContasResumo from "../components/ContasResumo";
import useConfirmDialog from "../../../hooks/useConfirmDialog";

export default function ContasPage() {
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState({ name: "", account_type: "checking", initial_balance: "" });
  const { confirmar, dialogo } = useConfirmDialog();

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarContas();
        setContas(dados);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return contas.filter((item) => {
      const tipoOk = filtroTipo === "all" || item.account_type === filtroTipo;
      const nomeOk = !termo || item.name.toLowerCase().includes(termo);
      return tipoOk && nomeOk;
    });
  }, [contas, busca, filtroTipo]);

  const resumo = useMemo(() => {
    const total = contas.length;
    const checking = contas.filter((item) => item.account_type === "checking").length;
    const others = Math.max(0, total - checking);
    return { total, checking, others };
  }, [contas]);

  function iniciarCriacao(tipo = "checking") {
    setEditandoId(null);
    setForm({ name: "", account_type: tipo, initial_balance: "" });
    setErro("");
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setForm({
      name: item.name,
      account_type: item.account_type || "checking",
      initial_balance: item.initial_balance ?? "",
    });
    setErro("");
  }

  async function salvarConta(evento) {
    evento.preventDefault();
    if (!form.name.trim()) {
      setErro("Informe um nome para a conta.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      if (editandoId) {
        const atualizada = await atualizarConta(editandoId, {
          name: form.name.trim(),
          account_type: form.account_type,
          initial_balance: Number(form.initial_balance || 0),
        });
        setContas((atual) => atual.map((item) => (item.id === editandoId ? atualizada : item)));
      } else {
        const criada = await criarConta({
          name: form.name.trim(),
          account_type: form.account_type,
          initial_balance: Number(form.initial_balance || 0),
        });
        setContas((atual) => [criada, ...atual]);
      }
      iniciarCriacao(form.account_type);
      setMostrarFormulario(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerConta(item) {
    const confirmou = await confirmar({
      titulo: "Excluir conta",
      mensagem: `Remover a conta "${item.name}"?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    setErro("");
    try {
      await excluirConta(item.id);
      setContas((atual) => atual.filter((conta) => conta.id !== item.id));
      if (editandoId === item.id) {
        iniciarCriacao();
        setMostrarFormulario(false);
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Módulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Contas</h1>
        <p className="mt-2 text-sm text-ink/70">
          Gerencie suas contas para organizar onde as transações acontecem e consolidar o controle financeiro.
        </p>

        <ContasResumo resumo={resumo} />

        {erro ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}

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
            {mostrarFormulario ? "Fechar painel" : "Nova conta"}
          </button>
        </div>

        <div className={`mt-4 ${mostrarFormulario ? "grid gap-4 grid-cols-3" : ""}`}>
          {mostrarFormulario ? (
            <ContasFormulario
              editandoId={editandoId}
              form={form}
              setForm={setForm}
              salvando={salvando}
              onSubmit={salvarConta}
              onCancel={() => {
                iniciarCriacao(form.account_type);
                setMostrarFormulario(false);
              }}
            />
          ) : null}
          <ContasLista
            carregando={carregando}
            contasFiltradas={contasFiltradas}
            busca={busca}
            setBusca={setBusca}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            onEdit={iniciarEdicao}
            onDelete={removerConta}
          />
        </div>
      </section>
      {dialogo}
    </main>
  );
}



