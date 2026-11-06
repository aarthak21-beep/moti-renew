import { BillingCycle } from '../types';

export function formatCurrency(amount: number, _currency: 'INR' = 'INR'): string {
  return `₹${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount)}`;
}

export function getMonthlyEquivalent(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'Weekly':
      return amount * (52 / 12);
    case 'Monthly':
      return amount;
    case 'Quarterly':
      return amount / 3;
    case 'Yearly':
      return amount / 12;
  }
}

export function getYearlyEquivalent(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'Weekly':
      return amount * 52;
    case 'Monthly':
      return amount * 12;
    case 'Quarterly':
      return amount * 4;
    case 'Yearly':
      return amount;
  }
}
