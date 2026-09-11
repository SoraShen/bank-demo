import articles from "../../../data/standard-bank/knowledge/articles.json";
import signals from "../../../data/standard-bank/scam_intelligence/scam_signals.json";
import examples from "../../../data/standard-bank/scam_intelligence/scam_examples.json";
import transactions from "../../../data/standard-bank/demo_data/transactions.json";
import journeys from "../../../data/standard-bank/journeys/journeys.json";
import channels from "../../../data/standard-bank/channels/channels.json";

export type Article = (typeof articles)[number];
export type Signal = (typeof signals)[number];

export const db = {
  articles: articles as Article[],
  signals: signals as Signal[],
  examples,
  transactions,
  journeys,
  channels,
};

export function getJourney(id: keyof typeof journeys) {
  return journeys[id];
}
