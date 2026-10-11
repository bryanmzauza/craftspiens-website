// Parcelamento no cartão (Checkout Pro). Os juros são do Mercado Pago e pagos por
// quem compra; a loja recebe o valor do produto. As taxas vêm da API de parcelas
// do Mercado Pago (GET /api/loja/parcelas) e o cálculo abaixo reproduz o dele:
// total = valor x (1 + taxa), parcela = total / número de parcelas.
// Arquivo sem dependências do servidor: usado também na página de compra.

export const MAX_INSTALLMENTS = 3;

/** Taxa do Mercado Pago para um número de parcelas */
export type InstallmentRate = {
  installments: number;
  /** Acréscimo sobre o valor, em %, para o total parcelado (9.64 = 9,64%) */
  rate: number;
  minAmount: number;
  maxAmount: number;
};

export type InstallmentPlan = {
  installments: number;
  installmentAmount: number;
  total: number;
  /** Juros em reais: total - valor à vista */
  interest: number;
  rate: number;
  /** Taxa efetiva ao mês e ao ano, em %, calculada a partir das parcelas */
  monthlyRate: number;
  annualRate: number;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Taxa mensal i tal que o valor à vista é o valor presente das parcelas
 * mensais (a primeira em 30 dias). Busca binária: o valor presente cai com i.
 */
function effectiveMonthlyRate(amount: number, installmentAmount: number, installments: number): number {
  if (installments <= 1 || installmentAmount * installments <= amount) return 0;
  const presentValue = (i: number) => installmentAmount * ((1 - (1 + i) ** -installments) / i);
  let low = 1e-9;
  let high = 1;
  for (let step = 0; step < 100; step++) {
    const mid = (low + high) / 2;
    if (presentValue(mid) > amount) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Opções de parcelamento para um valor, até MAX_INSTALLMENTS */
export function buildInstallmentPlans(amount: number, rates: InstallmentRate[]): InstallmentPlan[] {
  return rates
    .filter((r) => r.installments <= MAX_INSTALLMENTS && amount >= r.minAmount && amount <= r.maxAmount)
    .sort((a, b) => a.installments - b.installments)
    .map((r) => {
      const total = round2(amount * (1 + r.rate / 100));
      const installmentAmount = round2(total / r.installments);
      const monthly = effectiveMonthlyRate(amount, installmentAmount, r.installments);
      return {
        installments: r.installments,
        installmentAmount,
        total,
        interest: round2(total - amount),
        rate: r.rate,
        monthlyRate: monthly * 100,
        annualRate: ((1 + monthly) ** 12 - 1) * 100,
      };
    });
}

/** 9.64 -> "9,64%" */
export function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}
