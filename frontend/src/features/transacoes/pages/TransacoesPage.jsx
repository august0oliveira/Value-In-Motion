import { useEffect, useMemo, useState } from "react";
import TransacoesFormulario from "../components/TransacoesFormulario";
import TransacoesLista from "../components/TransacoesLista";
import TransacoesResumo from "../components/TransacoesResumo";
import useConfirmDialog from "../../../hooks/useConfirmDialog";
import {
  atualizarTransacao,
  buscarCartoes,
  buscarCategorias,
  buscarContas,
  buscarTransacoes,
  criarTransacao,
  excluirTransacao,
} from "../../../lib/api";

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransacoesPage() {
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [importErros, setImportErros] = useState([]);
  const [importSucesso, setImportSucesso] = useState("");
  const [importPreview, setImportPreview] = useState([]);
  const [importDelimiter, setImportDelimiter] = useState(";");

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroConta, setFiltroConta] = useState("all");
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarPainelEdicao, setMostrarPainelEdicao] = useState(false);
  const { confirmar, dialogo } = useConfirmDialog();
  const [form, setForm] = useState({
    transaction_type: "expense",
    source: "account",
    account: "",
    credit_card: "",
    category: "",
    description: "",
    amount: "",
    occurred_on: hojeIso(),
  });

  useEffect(() => {
    async function carregar() {
      try {
        const [contasApi, cartoesApi, categoriasApi, transacoesApi] = await Promise.all([
          buscarContas(),
          buscarCartoes(),
          buscarCategorias(),
          buscarTransacoes(),
        ]);
        setContas(contasApi);
        setCartoes(cartoesApi);
        setCategorias(categoriasApi);
        setTransacoes(transacoesApi);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
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
  const nomeContaPorNome = useMemo(
    () => Object.fromEntries(contas.map((item) => [item.name.toLowerCase(), item.id])),
    [contas]
  );
  const nomeCartaoPorNome = useMemo(
    () => Object.fromEntries(cartoes.map((item) => [item.name.toLowerCase(), item.id])),
    [cartoes]
  );
  const nomeCategoriaPorNome = useMemo(
    () => Object.fromEntries(categorias.map((item) => [item.name.toLowerCase(), item.id])),
    [categorias]
  );
  const categoriasDoTipo = useMemo(
    () => categorias.filter((item) => item.transaction_type === form.transaction_type),
    [categorias, form.transaction_type]
  );

  const transacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return transacoes.filter((item) => {
      const tipoOk = filtroTipo === "all" || item.transaction_type === filtroTipo;
      const contaOk = filtroConta === "all" || String(item.account) === String(filtroConta);
      const categoriaOk = filtroCategoria === "all" || String(item.category) === String(filtroCategoria);
      const descricaoOk = !termo || (item.description || "").toLowerCase().includes(termo);
      return tipoOk && contaOk && categoriaOk && descricaoOk;
    });
  }, [transacoes, busca, filtroTipo, filtroConta, filtroCategoria]);

  const resumo = useMemo(() => {
    const receitas = transacoesFiltradas
      .filter((item) => item.transaction_type === "income")
      .reduce((total, item) => total + Number(item.amount), 0);
    const despesas = transacoesFiltradas
      .filter((item) => item.transaction_type === "expense")
      .reduce((total, item) => total + Number(item.amount), 0);
    return {
      quantidade: transacoesFiltradas.length,
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  }, [transacoesFiltradas]);

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setMostrarPainelEdicao(true);
    setForm({
      transaction_type: item.transaction_type,
      source: item.credit_card ? "credit_card" : "account",
      account: item.account ? String(item.account) : "",
      credit_card: item.credit_card ? String(item.credit_card) : "",
      category: String(item.category),
      description: item.description || "",
      amount: String(item.amount),
      occurred_on: item.occurred_on,
    });
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setMostrarPainelEdicao(false);
    setForm({
      transaction_type: "expense",
      source: "account",
      account: "",
      credit_card: "",
      category: "",
      description: "",
      amount: "",
      occurred_on: hojeIso(),
    });
  }

  async function salvarEdicao(evento) {
    evento.preventDefault();
    if (!editandoId) return;
    if (!form.category || !form.amount || !form.occurred_on) {
      setErro("Preencha categoria, valor e data.");
      return;
    }
    if (form.transaction_type === "income" && !form.account) {
      setErro("Selecione uma conta para receita.");
      return;
    }
    if (form.transaction_type === "expense" && form.source === "credit_card" && !form.credit_card) {
      setErro("Selecione um cartão para despesa.");
      return;
    }
    if (form.transaction_type === "expense" && form.source !== "credit_card" && !form.account) {
      setErro("Selecione uma conta para despesa.");
      return;
    }
    if (Number(form.amount) <= 0) {
      setErro("Valor deve ser maior que zero.");
      return;
    }

    const payload = {
      transaction_type: form.transaction_type,
      category: Number(form.category),
      description: form.description,
      amount: Number(form.amount),
      occurred_on: form.occurred_on,
    };
    if (form.transaction_type === "income") {
      payload.account = Number(form.account);
      payload.credit_card = null;
    } else if (form.source === "credit_card") {
      payload.account = null;
      payload.credit_card = Number(form.credit_card);
    } else {
      payload.account = Number(form.account);
      payload.credit_card = null;
    }

    setSalvando(true);
    setErro("");
    try {
      const atualizada = await atualizarTransacao(editandoId, payload);
      setTransacoes((atual) => atual.map((item) => (item.id === editandoId ? atualizada : item)));
      cancelarEdicao();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerTransacao(item) {
    const confirmou = await confirmar({
      titulo: "Excluir transação",
      mensagem: "Remover esta transação?",
      textoConfirmar: "Excluir",
    });
    if (!confirmou) return;
    setErro("");
    try {
      await excluirTransacao(item.id);
      setTransacoes((atual) => atual.filter((transacao) => transacao.id !== item.id));
      if (editandoId === item.id) cancelarEdicao();
    } catch (e) {
      setErro(e.message);
    }
  }

  function normalizarTipo(valor) {
    const texto = String(valor || "").trim().toLowerCase();
    if (["income", "receita", "entrada"].includes(texto)) return "income";
    if (["expense", "despesa", "saida", "sa�da"].includes(texto)) return "expense";
    return "";
  }

  function normalizarValor(valor) {
    if (valor === null || valor === undefined) return NaN;
    let texto = String(valor).trim();
    if (!texto) return NaN;
    if (texto.includes(".") && texto.includes(",")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (texto.includes(",")) {
      texto = texto.replace(",", ".");
    }
    const num = Number(texto);
    return Number.isFinite(num) ? num : NaN;
  }

  function normalizarData(valor) {
    const texto = String(valor || "").trim();
    if (!texto) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    return "";
  }

  function parseCsv(texto, delimiter) {
    const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (linhas.length < 2) return { rows: [], errors: ["CSV vazio ou sem linhas."] };
    const headers = linhas[0].split(delimiter).map((h) => h.trim().toLowerCase());
    const rows = [];
    const errors = [];
    for (let i = 1; i < linhas.length; i += 1) {
      const valores = linhas[i].split(delimiter);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = valores[idx] !== undefined ? valores[idx].trim() : "";
      });
      rows.push({ index: i + 1, data: row });
    }
    return { rows, errors };
  }

  async function handleImportArquivo(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    const texto = await arquivo.text();
    const { rows, errors } = parseCsv(texto, importDelimiter);
    setImportErros(errors);
    setImportPreview(rows.slice(0, 5));
  }

  async function importarCsv() {
    setImportando(true);
    setImportErros([]);
    setImportSucesso("");

    const input = document.getElementById("csv-import-input");
    const arquivo = input?.files?.[0];
    if (!arquivo) {
      setImportErros(["Selecione um arquivo CSV."]);
      setImportando(false);
      return;
    }
    const texto = await arquivo.text();
    const { rows, errors } = parseCsv(texto, importDelimiter);
    if (errors.length) {
      setImportErros(errors);
      setImportando(false);
      return;
    }

    let criadas = 0;
    const falhas = [];
    for (const row of rows) {
      const data = row.data;
      const tipo = normalizarTipo(data.type || data.tipo);
      const valor = normalizarValor(data.amount || data.valor);
      const dataIso = normalizarData(data.date || data.data);
      const categoriaNome = (data.category || data.categoria || "").toLowerCase();
      const contaNome = (data.account || data.conta || "").toLowerCase();
      const cartaoNome = (data.credit_card || data.cartao || data.cartão || "").toLowerCase();

      if (!tipo || !dataIso || !Number.isFinite(valor) || !categoriaNome) {
        falhas.push(`Linha ${row.index}: dados obrigatorios ausentes.`);
        continue;
      }

      const categoryId = nomeCategoriaPorNome[categoriaNome];
      if (!categoryId) {
        falhas.push(`Linha ${row.index}: categoria nao encontrada (${categoriaNome}).`);
        continue;
      }

      let accountId = null;
      let cardId = null;
      if (tipo === "income") {
        accountId = nomeContaPorNome[contaNome];
        if (!accountId) {
          falhas.push(`Linha ${row.index}: conta nao encontrada (${contaNome}).`);
          continue;
        }
      } else {
        if (cartaoNome) {
          cardId = nomeCartaoPorNome[cartaoNome];
          if (!cardId) {
            falhas.push(`Linha ${row.index}: cartao nao encontrado (${cartaoNome}).`);
            continue;
          }
        } else {
          accountId = nomeContaPorNome[contaNome];
          if (!accountId) {
            falhas.push(`Linha ${row.index}: conta nao encontrada (${contaNome}).`);
            continue;
          }
        }
      }

      const payload = {
        transaction_type: tipo,
        category: Number(categoryId),
        description: data.description || data.descricao || "",
        amount: Number(valor),
        occurred_on: dataIso,
        account: accountId ? Number(accountId) : null,
        credit_card: cardId ? Number(cardId) : null,
      };

      try {
        const criada = await criarTransacao(payload);
        setTransacoes((atual) => [criada, ...atual]);
        criadas += 1;
      } catch (e) {
        falhas.push(`Linha ${row.index}: ${e.message}`);
      }
    }

    setImportErros(falhas);
    setImportSucesso(`Importadas: ${criadas}.`);
    setImportando(false);
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
        <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Transações</h1>
        <p className="mt-2 text-sm text-ink/70">
          Consulte e filtre suas movimentações em um único lugar, com separacao por conta, categoria e tipo.
        </p>
        <p className="mt-2 rounded-xl border border-graphite/10 bg-paper px-3 py-2 text-sm text-ink/70">
          Novas transações devem ser lançadas no Dashboard pelos botoes "Nova receita" e "Nova despesa".
        </p>
        <section className="mt-4 rounded-2xl border border-graphite/10 bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink font-editorial">Importar CSV</h2>
              <p className="mt-1 text-xs text-ink/60">
                Cabecalhos esperados: date, description, amount, type, category, account, credit_card.
              </p>
            </div>
            <select
              value={importDelimiter}
              onChange={(e) => setImportDelimiter(e.target.value)}
              className="rounded-xl border border-graphite/20 bg-white px-3 py-2 text-xs"
            >
              <option value=";">Separador ;</option>
              <option value=",">Separador ,</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              id="csv-import-input"
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportArquivo}
              className="text-sm"
            />
            <button
              type="button"
              onClick={importarCsv}
              disabled={importando}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-graphite disabled:opacity-60"
            >
              {importando ? "Importando..." : "Importar"}
            </button>
          </div>

          {importSucesso ? (
            <p className="mt-3 rounded-xl border border-graphite/10 bg-white px-3 py-2 text-sm text-ink/70">
              {importSucesso}
            </p>
          ) : null}

          {importErros.length ? (
            <div className="mt-3 rounded-xl border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-ink/80">
              {importErros.slice(0, 5).map((msg) => (
                <p key={msg}>{msg}</p>
              ))}
              {importErros.length > 5 ? <p>...{importErros.length - 5} erros adicionais</p> : null}
            </div>
          ) : null}

          {importPreview.length ? (
            <div className="mt-3 rounded-xl border border-graphite/10 bg-white/80 p-3 text-xs text-ink/70">
              <p className="text-[11px] uppercase tracking-[0.16em] text-ink/50">Preview</p>
              <ul className="mt-2 space-y-1">
                {importPreview.map((row) => (
                  <li key={row.index}>
                    {row.data.date || row.data.data} | {row.data.description || row.data.descricao} | {row.data.amount || row.data.valor} | {row.data.type || row.data.tipo}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <TransacoesResumo resumo={resumo} />

        {erro ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (mostrarPainelEdicao) {
                cancelarEdicao();
              } else {
                setMostrarPainelEdicao(true);
              }
            }}
            className="rounded-lg border border-graphite/20 px-4 py-2 text-sm font-semibold text-ink/80"
          >
            {mostrarPainelEdicao ? "Fechar painel de edição" : "Abrir painel de edição"}
          </button>
        </div>

        <div className={`mt-4 ${mostrarPainelEdicao ? "grid gap-4 grid-cols-3" : ""}`}>
          {mostrarPainelEdicao && editandoId ? (
            <TransacoesFormulario
              editandoId={editandoId}
              form={form}
              setForm={setForm}
              contas={contas}
              cartoes={cartoes.filter((item) => item.is_active)}
              categoriasDoTipo={categoriasDoTipo}
              salvando={salvando}
              onSubmit={salvarEdicao}
              onCancel={cancelarEdicao}
            />
          ) : mostrarPainelEdicao ? (
            <article className="rounded-2xl border border-graphite/10 bg-paper p-4 col-span-1">
              <h2 className="text-base font-bold text-ink">Edição de transação</h2>
              <p className="mt-2 text-sm text-ink/70">
                Clique em "Editar" em uma transação da lista para carregar os dados neste painel.
              </p>
            </article>
          ) : (
            null
          )}
          <TransacoesLista
            carregando={carregando}
            transacoesFiltradas={transacoesFiltradas}
            busca={busca}
            setBusca={setBusca}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            filtroConta={filtroConta}
            setFiltroConta={setFiltroConta}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            contas={contas}
            categorias={categorias}
            nomeContaPorId={nomeContaPorId}
            nomeCartaoPorId={nomeCartaoPorId}
            nomeCategoriaPorId={nomeCategoriaPorId}
            onEdit={iniciarEdicao}
            onDelete={removerTransacao}
          />
        </div>
      </section>
      {dialogo}
    </main>
  );
}









