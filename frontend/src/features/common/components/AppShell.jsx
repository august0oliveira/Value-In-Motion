import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { sair } from "../../../lib/api";
import { getFirstUsername } from "../../../lib/auth";

function Icone({ nome, className = "h-4 w-4" }) {
  const icones = {
    dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
    transacoes: "M4 7h13m0 0-3-3m3 3-3 3M20 17H7m0 0 3-3m-3 3 3 3",
    contas: "M3 7.5 12 3l9 4.5M4 10h16M6 10v8m4-8v8m4-8v8m4-8v8M3 21h18",
    cartoes: "M3 7h18v10H3V7Zm0 4h18M7 15h3",
    categorias: "m4 7 6-4 10 7-6 4L4 7Zm0 0v8l10 7v-8",
    orcamentos: "M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z",
    metas: "m9 9 6-6m0 0h-4m4 0v4M5 21l7-7",
    recorrencias: "M3 11a8 8 0 0 1 14-5m4-2v6h-6M21 13a8 8 0 0 1-14 5m-4 2v-6h6",
    calendario: "M8 2v4m8-4v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2Z",
    relatorios: "M4 19V5m5 14V9m5 10V12m5 7V7",
    investimentos: "M4 18 10 12l4 4 6-8M4 5h16",
    perfil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
    admin: "m12 3 8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4Z",
    sair: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1",
    chevron: "m15 18-6-6 6-6",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={icones[nome] || icones.dashboard} />
    </svg>
  );
}

const itensMenu = [
  { to: "/", label: "Dashboard", icone: "dashboard" },
  { to: "/contas", label: "Contas", icone: "contas" },
  { to: "/cartoes", label: "Cartões", icone: "cartoes" },
  { to: "/transacoes", label: "Transações", icone: "transacoes" },
  { to: "/categorias", label: "Categorias", icone: "categorias" },
  { to: "/orcamentos", label: "Orçamentos", icone: "orcamentos" },
  { to: "/metas", label: "Metas", icone: "metas" },
  { to: "/recorrencias", label: "Recorrências", icone: "recorrencias" },
  { to: "/investimentos", label: "Investimentos", icone: "investimentos" },
  { to: "/calendario", label: "Calendário", icone: "calendario" },
  { to: "/relatorios", label: "Relatórios", icone: "relatorios" },
  { to: "/perfil-configuracoes", label: "Perfil", icone: "perfil" },
  { to: "/admin-sistema", label: "Admin", icone: "admin" },
];

export default function AppShell() {
  const navigate = useNavigate();
  const [minimizado, setMinimizado] = useState(false);
  const nomeUsuario = getFirstUsername() || "Usuário";

  useEffect(() => {
    const salvo = localStorage.getItem("vimo_menu_minimizado");
    setMinimizado(salvo === "true");
  }, []);

  function alternarMenu() {
    setMinimizado((atual) => {
      const proximo = !atual;
      localStorage.setItem("vimo_menu_minimizado", String(proximo));
      return proximo;
    });
  }

  function encerrarSessao() {
    sair();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-[1480px] gap-6 p-6">

        {/* Sidebar */}
        <aside
          className={`shrink-0 flex flex-col rounded-[28px] bg-graphite text-white shadow-[0_20px_60px_rgba(19,20,23,0.28)] transition-all duration-300 ${
            minimizado ? "w-16" : "w-64"
          }`}
          style={{ minHeight: "calc(100vh - 3rem)", padding: "1.5rem 0.9rem" }}
        >
          {/* Topo */}
          <div className="flex items-center justify-between mb-7 px-1">
            {!minimizado && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-lime">VIMO</p>
                <p className="text-sm font-semibold text-white/90 leading-tight">Value in Motion</p>
              </div>
            )}
            <button
              onClick={alternarMenu}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition ml-auto"
              title={minimizado ? "Expandir" : "Minimizar"}
            >
              <Icone
                nome="chevron"
                className={`h-3.5 w-3.5 transition-transform duration-300 ${minimizado ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Saudação */}
          {!minimizado && (
            <div className="mb-5 px-3 py-3 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 uppercase tracking-[0.18em]">Bem-vindo</p>
              <p className="text-sm font-semibold text-white truncate">{nomeUsuario}</p>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {itensMenu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                title={minimizado ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-lime/15 text-lime border border-lime/40 shadow-[0_6px_16px_rgba(183,255,60,0.2)]"
                      : "text-white/60 hover:bg-white/10 hover:text-white border border-transparent"
                  }`
                }
              >
                <Icone nome={item.icone} className="h-4 w-4 shrink-0" />
                {!minimizado && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Rodapé */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={encerrarSessao}
              className={`flex items-center gap-2.5 w-full rounded-xl px-2.5 py-2 text-sm font-medium text-white/60 hover:bg-coral/10 hover:text-coral border border-transparent hover:border-coral/30 transition-all ${
                minimizado ? "justify-center" : ""
              }`}
              title="Sair"
            >
              <Icone nome="sair" className="h-4 w-4 shrink-0" />
              {!minimizado && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
