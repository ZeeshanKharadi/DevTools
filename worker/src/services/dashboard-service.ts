import type { Repositories } from "../db/repositories";

export type DashboardSummary = {
  signatures: number;
  cards: number;
  activeQr: number;
  invoices: number;
};

export function createDashboardService(repos: Repositories) {
  return {
    async summary(userId: string): Promise<DashboardSummary> {
      const [signatures, cards, activeQr, invoices] = await Promise.all([
        repos.signatures.countByUser(userId),
        repos.cards.countByUser(userId),
        repos.qrCodes.countActiveByUser(userId),
        repos.invoices.countByUser(userId),
      ]);
      return { signatures, cards, activeQr, invoices };
    },
  };
}
