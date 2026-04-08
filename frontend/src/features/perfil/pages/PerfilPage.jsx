import PerfilAcoes from "../components/PerfilAcoes";
import PerfilResumo from "../components/PerfilResumo";

export default function PerfilPage() {
  return (
    <main className="rounded-[24px] border border-graphite/10 bg-white/80 p-8 shadow-[0_14px_30px_rgba(19,20,23,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Modulo</p>
      <h1 className="mt-2 text-2xl font-bold text-ink font-editorial">Perfil</h1>
      <p className="mt-2 text-sm text-ink/70">Gerencie seus dados pessoais e informacoes principais da conta.</p>

      <PerfilResumo />
      <PerfilAcoes />
    </main>
  );
}



