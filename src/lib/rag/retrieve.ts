import { db, type Article } from "@/lib/mock-db";

export interface KnowledgeProvider {
  search(query: string, category?: string): Article[];
}

function score(article: Article, q: string) {
  const hay = `${article.title} ${article.content} ${article.keywords.join(" ")}`.toLowerCase();
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  return words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
}

export const knowledgeProvider: KnowledgeProvider = {
  search(query, category) {
    return db.articles
      .filter((a) => !category || a.category === category)
      .map((a) => ({ a, s: score(a, query) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, 3)
      .map((x) => x.a);
  },
};

export function matchSignals(text: string) {
  const lower = text.toLowerCase();
  return db.signals.filter((s) => s.examples.some((ex) => lower.includes(ex.toLowerCase())));
}

export function matchTransaction(text: string) {
  const lower = text.toLowerCase();
  return (
    db.transactions.find(
      (t) =>
        lower.includes(t.merchant.toLowerCase()) ||
        lower.includes(String(t.amount)) ||
        lower.includes(t.reference.toLowerCase()),
    ) ?? db.transactions.find((t) => t.transaction_id === "TXN-10482")
  );
}
