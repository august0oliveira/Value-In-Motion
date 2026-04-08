import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  saveTokens,
  saveUsername,
} from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const ROTAS_PUBLICAS = ["/api/auth/token/", "/api/usuarios/cadastro/"];

let refreshPromise = null;

function normalizarParTokens(data) {
  const access = data?.access || data?.access_token || data?.token || "";
  const refresh = data?.refresh || data?.refresh_token || "";
  return {
    access: typeof access === "string" ? access : "",
    refresh: typeof refresh === "string" ? refresh : "",
  };
}

async function garantirRefreshToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = atualizarToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function requisicao(caminho, opcoes = {}, tentouRefresh = false) {
  const precisaAuth = !ROTAS_PUBLICAS.some((r) => caminho.startsWith(r));

  if (precisaAuth && !tentouRefresh && isAccessTokenExpired() && getRefreshToken()) {
    const refreshed = await garantirRefreshToken();
    if (refreshed) return requisicao(caminho, opcoes, true);
  }

  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opcoes.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers,
  });

  if (response.status === 401 && !tentouRefresh) {
    const refreshed = await garantirRefreshToken();
    if (refreshed) return requisicao(caminho, opcoes, true);
  }

  if (response.status === 401) {
    clearTokens();
    if (window.location.pathname !== "/login") window.location.href = "/login";
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || data.error || "Erro na requisicao");
  }

  if (response.status === 204) return null;
  const data = await response.json();
  // Se DRF estiver com paginação ativa, use a lista dentro de "results".
  if (data && Array.isArray(data.results)) return data.results;
  return data;
}

export async function login(username, password, lastName = "") {
  const response = await fetch(`${API_BASE_URL}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) throw new Error("Usuario ou senha invalidos");

  const data = await response.json();
  const tokens = normalizarParTokens(data);
  if (!tokens.access || !tokens.refresh) {
    throw new Error("Resposta de autenticacao invalida: token ausente.");
  }
  saveTokens(tokens);

  try {
    const usuario = await requisicao("/api/usuarios/eu/");
    saveUsername(usuario.first_name || username, usuario.last_name || lastName);
  } catch {
    saveUsername(username, lastName);
  }

  return data;
}

export async function register(payload) {
  return requisicao("/api/usuarios/cadastro/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function atualizarToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    const tokens = normalizarParTokens(data);
    if (!tokens.access) {
      clearTokens();
      return false;
    }

    saveTokens({ access: tokens.access, refresh });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar token:", error);
    return false;
  }
}

export function logout() {
  clearTokens();
  window.location.href = "/login";
}

export const fazerLogin = login;
export const sair = logout;

// Contas
export const buscarContas = () => requisicao("/api/financas/contas/");
export const criarConta = (p) => requisicao("/api/financas/contas/", { method: "POST", body: JSON.stringify(p) });
export const atualizarConta = (id, p) => requisicao(`/api/financas/contas/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirConta = (id) => requisicao(`/api/financas/contas/${id}/`, { method: "DELETE" });

// Cartões
export const buscarCartoes = () => requisicao("/api/financas/cartoes/");
export const criarCartao = (p) => requisicao("/api/financas/cartoes/", { method: "POST", body: JSON.stringify(p) });
export const atualizarCartao = (id, p) => requisicao(`/api/financas/cartoes/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirCartao = (id) => requisicao(`/api/financas/cartoes/${id}/`, { method: "DELETE" });

// Parcelamentos
export const buscarParcelamentosCartao = () => requisicao("/api/financas/parcelamentos/");
export const criarParcelamentoCartao = (p) => requisicao("/api/financas/parcelamentos/", { method: "POST", body: JSON.stringify(p) });
export const atualizarParcelamentoCartao = (id, p) => requisicao(`/api/financas/parcelamentos/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirParcelamentoCartao = (id) => requisicao(`/api/financas/parcelamentos/${id}/`, { method: "DELETE" });

// Faturas de cartao
export const buscarFaturasCartao = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return requisicao(`/api/financas/faturas-cartao/${query ? "?" + query : ""}`);
};
export const fecharFaturaCartao = (id) =>
  requisicao(`/api/financas/faturas-cartao/${id}/fechar/`, { method: "POST" });
export const pagarFaturaCartao = (id, p) =>
  requisicao(`/api/financas/faturas-cartao/${id}/pagar/`, { method: "POST", body: JSON.stringify(p) });

// Categorias
export const buscarCategorias = () => requisicao("/api/financas/categorias/");
export const criarCategoria = (p) => requisicao("/api/financas/categorias/", { method: "POST", body: JSON.stringify(p) });
export const atualizarCategoria = (id, p) => requisicao(`/api/financas/categorias/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirCategoria = (id) => requisicao(`/api/financas/categorias/${id}/`, { method: "DELETE" });

// Transações — agora com filtros e paginação
export const buscarTransacoes = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return requisicao(`/api/financas/transacoes/${query ? "?" + query : ""}`);
};
export const criarTransacao = (p) => requisicao("/api/financas/transacoes/", { method: "POST", body: JSON.stringify(p) });
export const atualizarTransacao = (id, p) => requisicao(`/api/financas/transacoes/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirTransacao = (id) => requisicao(`/api/financas/transacoes/${id}/`, { method: "DELETE" });

// Metas
export const buscarMetas = () => requisicao("/api/financas/metas/");
export const criarMeta = (p) => requisicao("/api/financas/metas/", { method: "POST", body: JSON.stringify(p) });
export const atualizarMeta = (id, p) => requisicao(`/api/financas/metas/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirMeta = (id) => requisicao(`/api/financas/metas/${id}/`, { method: "DELETE" });

// Orçamentos
export const buscarOrcamentos = () => requisicao("/api/financas/orcamentos/");
export const criarOrcamento = (p) => requisicao("/api/financas/orcamentos/", { method: "POST", body: JSON.stringify(p) });
export const atualizarOrcamento = (id, p) => requisicao(`/api/financas/orcamentos/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirOrcamento = (id) => requisicao(`/api/financas/orcamentos/${id}/`, { method: "DELETE" });

// Recorrências
export const buscarRecorrencias = () => requisicao("/api/financas/recorrencias/");
export const criarRecorrencia = (p) => requisicao("/api/financas/recorrencias/", { method: "POST", body: JSON.stringify(p) });
export const atualizarRecorrencia = (id, p) => requisicao(`/api/financas/recorrencias/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirRecorrencia = (id) => requisicao(`/api/financas/recorrencias/${id}/`, { method: "DELETE" });
export const gerarRecorrencias = (ate) =>
  requisicao("/api/financas/recorrencias/gerar/", {
    method: "POST",
    body: JSON.stringify(ate ? { ate } : {}),
  });

// Investimentos
export const buscarInvestimentos = () => requisicao("/api/financas/investimentos/");
export const criarInvestimento = (p) => requisicao("/api/financas/investimentos/", { method: "POST", body: JSON.stringify(p) });
export const atualizarInvestimento = (id, p) => requisicao(`/api/financas/investimentos/${id}/`, { method: "PATCH", body: JSON.stringify(p) });
export const excluirInvestimento = (id) => requisicao(`/api/financas/investimentos/${id}/`, { method: "DELETE" });

export const buscarVisaoFinancas = () => requisicao("/api/financas/");

// Fluxo de caixa projetado
export const buscarFluxoCaixa = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return requisicao(`/api/financas/fluxo-caixa/${query ? "?" + query : ""}`);
};
