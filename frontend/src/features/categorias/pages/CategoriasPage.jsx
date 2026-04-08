import { useEffect, useMemo, useState } from "react";
import { atualizarCategoria, buscarCategorias, criarCategoria, excluirCategoria } from "../../../lib/api";
import CategoriasFormulario from "../components/CategoriasFormulario";
import CategoriasLista from "../components/CategoriasLista";
import CategoriasResumo from "../components/CategoriasResumo";
import useConfirmDialog from "../../../hooks/useConfirmDialog";

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState({ name: "", transaction_type: "expense" });
  const { confirmar, dialogo } = useConfirmDialog();

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarCategorias();
        setCategorias(dados);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return categorias.filter((item) => {
      const tipoOk = filtroTipo === "all" || item.transaction_type === filtroTipo;
      const nomeOk = !termo || item.name.toLowerCase().includes(termo);
      return tipoOk && nomeOk;
    });
  }, [categorias, busca, filtroTipo]);

  const resumo = useMemo(() => {
    const total = categorias.length;
    const receitas = categorias.filter((item) => item.transaction_type === "income").length;
    const despesas = categorias.filter((item) => item.transaction_type === "expense").length;
    return { total, receitas, despesas };
  }, [categorias]);

  function iniciarCriacao(tipo = "expense") {
    setEditandoId(null);
    setForm({ name: "", transaction_type: tipo });
    setErro("");
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setForm({ name: item.name, transaction_type: item.transaction_type });
    setErro("");
  }

  async function salvarCategoria(evento) {
    evento.preventDefault();
    if (!form.name.trim()) {
      setErro("Informe um nome para a categoria.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      if (editandoId) {
        const atualizada = await atualizarCategoria(editandoId, {
          name: form.name.trim(),
          transaction_type: form.transaction_type,
        });
        setCategorias((atual) => atual.map((item) => (item.id === editandoId ? atualizada : item)));
      } else {
        const criada = await criarCategoria({
          name: form.name.trim(),
          transaction_type: form.transaction_type,
        });
        setCategorias((atual) => [criada, ...atual]);
      }
      iniciarCriacao(form.transaction_type);
      setMostrarFormulario(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerCategoria(item) {
    const confirmou = await confirmar({
      titulo: "Excluir categoria",
      mensagem: `Remover a categoria "${item.name}"?`,
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    setErro("");
    try {
      await excluirCategoria(item.id);
      setCategorias((atual) => atual.filter((categoria) => categoria.id !== item.id));
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
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Categorias</h1>
        <p className="mt-2 text-sm text-ink/70">
          Organize receitas e despesas por categoria para melhorar analises no dashboard e relatorios.
        </p>

        <CategoriasResumo resumo={resumo} />

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
            {mostrarFormulario ? "Fechar painel" : "Nova categoria"}
          </button>
        </div>

        <div className={`mt-4 ${mostrarFormulario ? "grid gap-4 grid-cols-3" : ""}`}>
          {mostrarFormulario ? (
            <CategoriasFormulario
              editandoId={editandoId}
              form={form}
              setForm={setForm}
              salvando={salvando}
              onSubmit={salvarCategoria}
              onCancel={() => {
                iniciarCriacao(form.transaction_type);
                setMostrarFormulario(false);
              }}
            />
          ) : null}
          <CategoriasLista
            carregando={carregando}
            categoriasFiltradas={categoriasFiltradas}
            busca={busca}
            setBusca={setBusca}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            onEdit={iniciarEdicao}
            onDelete={removerCategoria}
          />
        </div>
      </section>
      {dialogo}
    </main>
  );
}



