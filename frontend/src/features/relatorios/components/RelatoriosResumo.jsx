const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function RelatoriosResumo({ resumo }) {
  const cards = [
    { titulo: "Receitas no periodo", valor: formatoMoeda.format(resumo?.receitas || 0) },
    { titulo: "Despesas no periodo", valor: formatoMoeda.format(resumo?.despesas || 0) },
    { titulo: "Saldo consolidado", valor: formatoMoeda.format(resumo?.saldo || 0) },
    { titulo: "Transacoes no periodo", valor: String(resumo?.quantidadeTransacoes || 0) },
  ];

  return (
    <section className="mt-6 grid gap-3 grid-cols-4">
      {cards.map((card) => (
        <article key={card.titulo} className="rounded-2xl border border-graphite/10 bg-paper p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">{card.titulo}</p>
          <p className="mt-2 text-xl font-semibold text-ink font-editorial">{card.valor}</p>
        </article>
      ))}
    </section>
  );
}



