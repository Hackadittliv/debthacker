// Math utilities for DebtHacker

export function calculateDOLPOrder(debts) {
  return [...debts].filter(d => !d.paid_off).sort((a, b) => a.balance - b.balance).map((d, i) => ({ ...d, dolp_order: i + 1 }));
}

export function calculatePayoffPlan(debts, extraPayment) {
  let simulatedDebts = debts.filter(d => !d.paid_off).map(d => ({ ...d }));
  if (simulatedDebts.length === 0) return null;
  
  let months = 0;
  let history = simulatedDebts.map(d => ({ id: d.id, remaining: d.balance, months_to_payoff: 0 }));

  while (simulatedDebts.length > 0 && months < 1200) {
    months++;
    let totalMinPayments = simulatedDebts.reduce((s, d) => s + d.min_payment, 0);
    let topPriority = calculateDOLPOrder(simulatedDebts)[0];
    
    // Sort so top priority gets the extra
    simulatedDebts.sort((a, b) => (a.id === topPriority?.id ? -1 : b.id === topPriority?.id ? 1 : 0));
    
    let extraAvailable = extraPayment;

    for (let i = 0; i < simulatedDebts.length; i++) {
        let debt = simulatedDebts[i];
        let interest = debt.balance * ((debt.interest_rate / 100) / 12);
        debt.balance += interest;
        
        let payment = debt.min_payment;
        if (i === 0) payment += extraAvailable;
        
        if (debt.balance <= payment) {
            let overpayment = payment - debt.balance;
            extraAvailable += overpayment; // Cascade to next
            debt.balance = 0;
        } else {
            debt.balance -= payment;
        }
        
        // Update history
        let h = history.find(x => x.id === debt.id);
        if (h && h.remaining > 0) {
            h.remaining = debt.balance;
            if (debt.balance === 0) h.months_to_payoff = months;
        }
    }
    simulatedDebts = simulatedDebts.filter(d => d.balance > 0);
  }
  
  return { history, total_months: months };
}

export function monthsToText(m) {
  if (!m || m <= 0) return "0 mån";
  if (m >= 1200) return "100+ år";
  const y = Math.floor(m / 12);
  const mo = Math.round(m % 12);
  if (y > 0 && mo > 0) return `${y} år ${mo} mån`;
  if (y > 0) return `${y} år`;
  return `${mo} mån`;
}

export function formatSEK(n) {
  if (typeof n !== "number" || isNaN(n)) return "0 kr";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M kr`;
  if (n < 0) return `-${Math.round(-n).toLocaleString("sv-SE")} kr`;
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

// Beräknar räntebesparing: DOLP med extrabetalning vs bara minimumbetalningar
export function calculateInterestComparison(debts, extraPayment) {
  const simulate = (extra) => {
    const sims = debts.filter(d => !d.paid_off).map(d => ({ ...d }))
    if (sims.length === 0) return { months: 0, interest: 0 }
    let months = 0, totalInterest = 0
    while (sims.length > 0 && months < 1200) {
      months++
      sims.sort((a, b) => a.balance - b.balance)
      let extraLeft = extra
      for (let i = 0; i < sims.length; i++) {
        const d = sims[i]
        const interest = d.balance * ((d.interest_rate / 100) / 12)
        totalInterest += interest
        d.balance += interest
        const payment = d.min_payment + (i === 0 ? extraLeft : 0)
        if (d.balance <= payment) {
          extraLeft += payment - d.balance
          d.balance = 0
        } else {
          d.balance -= payment
          extraLeft = 0
        }
      }
      sims.splice(0, sims.length, ...sims.filter(d => d.balance > 0.01))
    }
    return { months, interest: Math.round(totalInterest) }
  }
  const dolp = simulate(extraPayment)
  const minimum = simulate(0)
  return {
    interestSaved: Math.max(0, minimum.interest - dolp.interest),
    monthsSaved: Math.max(0, minimum.months - dolp.months),
  }
}

export function exportDOLPCSV(debts, dolpPlan, extraPayment, debtFreeMonths) {
  const now = new Date();
  const debtFreeDate = new Date(now.getFullYear(), now.getMonth() + (debtFreeMonths || 0), 1);
  const fmtDate = (d) => d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });

  const TYPE_LABELS = { kreditkort: 'Kreditkort', csn: 'CSN-lån', konsument: 'Konsumentlån', bil: 'Billån', bostad: 'Bostadslån', ovrig: 'Övrigt' };

  const sorted = calculateDOLPOrder(debts);
  const rows = [
    ['DebtHacker – DOLP-plan'],
    [`Exporterad: ${fmtDate(now)}`],
    [`Extra betalning/mån: ${Math.round(extraPayment)} kr`],
    [`Skuldfri om: ${monthsToText(debtFreeMonths)} (ungefär ${fmtDate(debtFreeDate)})`],
    [],
    ['#', 'Skuld', 'Typ', 'Saldo (kr)', 'Ränta (%)', 'Minbetalning (kr/mån)', 'Skuldfri om', 'Betalad'],
    ...sorted.map((d, i) => {
      const plan = dolpPlan?.history?.find(h => h.id === d.id);
      return [i + 1, d.name, TYPE_LABELS[d.type] || '', Math.round(d.balance), d.interest_rate, d.min_payment, plan ? monthsToText(plan.months_to_payoff) : '–', d.paid_off ? 'Ja' : 'Nej'];
    }),
    [],
    ['Total skuld', Math.round(debts.filter(d => !d.paid_off).reduce((s, d) => s + d.balance, 0))],
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debthacker-dolp-${now.toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function calculateCompoundGrowth(monthlyContribution, years, annualRate = 0.08, initialBalance = 0) {
  let balance = initialBalance;
  let history = [];
  const monthlyRate = annualRate / 12;

  for (let i = 1; i <= years; i++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
    history.push({ year: i, amount: Math.round(balance) });
  }
  return history;
}
