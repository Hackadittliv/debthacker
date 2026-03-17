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

export function calculateCompoundGrowth(monthlyContribution, years, annualRate = 0.08) {
  let balance = 0;
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
