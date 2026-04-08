import { useEffect, useMemo, useState } from "react";
import useConfirmDialog from "../../../hooks/useConfirmDialog";
import InvestimentosFormulario from "../components/InvestimentosFormulario";
import InvestimentosLista from "../components/InvestimentosLista";
import InvestimentosResumo from "../components/InvestimentosResumo";
import {
  atualizarInvestimento,
  buscarInvestimentos,
  criarInvestimento,
  excluirInvestimento,
} from "../../../lib/api";

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function novoForm() {
  return {
    nome: "",
    tipo: "renda_fixa",
    instituicao: "",
    valorInvestido: "",
    valorAtual: "",
    dataAporte: hojeIso(),
  };
}

function normalizarInvestimento(item) {
  return {
    id: item.id,
    nome: item.nome ?? item.name ?? "",
    tipo: item.tipo ?? item.investment_type ?? "renda_fixa",
    instituicao: item.instituicao ?? item.institution ?? "",
    valorInvestido: Number(item.valorInvestido ?? item.invested_amount ?? 0),
    valorAtual: Number(item.valorAtual ?? item.current_amount ?? 0),
    dataAporte: item.dataAporte ?? item.contribution_date ?? hojeIso(),
  };
}

export default function InvestimentosPage() {
  const [investimentos, setInvestimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState(novoForm());
  const { confirmar, dialogo } = useConfirmDialog();

  useEffect(() => {
    async function carregar() {
      try {
        const lista = await buscarInvestimentos();
        setInvestimentos(Array.isArray(lista) ? lista.map(normalizarInvestimento) : []);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const investimentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return investimentos.filter((item) => {
      const tipoOk = filtroTipo === "all" || item.tipo === filtroTipo;
      const nomeOk =
        !termo ||
        item.nome.toLowerCase().includes(termo) ||
        (item.instituicao || "").toLowerCase().includes(termo);
      return tipoOk && nomeOk;
    });
  }, [investimentos, busca, filtroTipo]);

  const resumo = useMemo(() => {
    const ativos = investimentos.length;
    const totalInvestido = investimentos.reduce((acc, item) => acc + Number(item.valorInvestido || 0), 0);
    const totalAtual = investimentos.reduce((acc, item) => acc + Number(item.valorAtual || 0), 0);
    const retorno = totalAtual - totalInvestido;
    return { ativos, totalInvestido, totalAtual, retorno };
  }, [investimentos]);

  function iniciarCriacao() {
    setEditandoId(null);
    setForm(novoForm());
    setErro("");
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setForm({
      nome: item.nome || "",
      tipo: item.tipo || "renda_fixa",
      instituicao: item.instituicao || "",
      valorInvestido: String(item.valorInvestido ?? ""),
      valorAtual: String(item.valorAtual ?? ""),
      dataAporte: item.dataAporte || hojeIso(),
    });
    setErro("");
  }

  async function salvarInvestimento(evento) {
    evento.preventDefault();
    if (!form.nome.trim()) {
      setErro("Informe o nome do investimento.");
      return;
    }
    if (Number(form.valorInvestido) < 0 || Number(form.valorAtual) < 0) {
      setErro("Valores nao podem ser negativos.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const payload = {
        name: form.nome.trim(),
        investment_type: form.tipo,
        institution: form.instituicao.trim(),
        invested_amount: Number(form.valorInvestido || 0),
        current_amount: Number(form.valorAtual || 0),
        contribution_date: form.dataAporte,
      };
      if (editandoId) {
        const atualizado = await atualizarInvestimento(editandoId, payload);
        setInvestimentos((atual) =>
          atual.map((item) => (item.id === editandoId ? normalizarInvestimento(atualizado) : item))
        );
      } else {
        const criado = await criarInvestimento(payload);
        setInvestimentos((atual) => [normalizarInvestimento(criado), ...atual]);
      }
      iniciarCriacao();
      setMostrarFormulario(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerInvestimento(item) {
    const confirmou = await confirmar({
      titulo: "Excluir investimento",
      mensagem: `Remover o investimento "${item.nome}"?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    setErro("");
    try {
      await excluirInvestimento(item.id);
      setInvestimentos((atual) => atual.filter((registro) => registro.id !== item.id));
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Investimentos</h1>
        <p className="mt-2 text-sm text-ink/70">
          Registre aportes e acompanhe o retorno da carteira por tipo de ativo e instituicao.
        </p>

        <InvestimentosResumo resumo={resumo} />

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
            {mostrarFormulario ? "Fechar painel" : "Novo investimento"}
          </button>
        </div>

        <div className={`mt-4 ${mostrarFormulario ? "grid gap-4 grid-cols-3" : ""}`}>
          {mostrarFormulario ? (
            <InvestimentosFormulario
              editandoId={editandoId}
              form={form}
              setForm={setForm}
              salvando={salvando}
              onSubmit={salvarInvestimento}
              onCancel={() => {
                iniciarCriacao();
                setMostrarFormulario(false);
              }}
            />
          ) : null}
          <InvestimentosLista
            carregando={carregando}
            investimentosFiltrados={investimentosFiltrados}
            busca={busca}
            setBusca={setBusca}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            onEdit={iniciarEdicao}
            onDelete={removerInvestimento}
          />
        </div>
      </section>
      {dialogo}
    </main>
  );
}



