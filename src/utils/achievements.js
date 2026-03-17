export const ACHIEVEMENTS = [
  { id: 'first_debt',             emoji: '🏁', title: 'Första steget',          desc: 'Lade till din första skuld',                        color: '#F4A261' },
  { id: 'first_sub_killed',       emoji: '✂️', title: 'Prenumerationsmördaren', desc: 'Avbröt din första prenumeration',                    color: '#C77B2A' },
  { id: 'card_closed',            emoji: '💳', title: 'Kortklipparen',          desc: 'Klippte eller sade upp kreditkortet',                color: '#E63946' },
  { id: 'first_extra_payment',    emoji: '💰', title: 'Overkill',               desc: 'Gjorde din första extra amortering',                 color: '#F4A261' },
  { id: 'consolidation_unlocked', emoji: '🔓', title: 'Beteendesegern',         desc: 'Ändrade beteendet — samlånslåset upplåst',           color: '#40916C' },
  { id: 'day_7',                  emoji: '🗓️', title: 'En veckas styrka',       desc: '7 dagar utan ny kredit',                            color: '#4A9ECC' },
  { id: 'day_30',                 emoji: '🌙', title: 'Månadshjälten',          desc: '30 dagar utan ny kredit',                           color: '#4A9ECC' },
  { id: 'day_100',                emoji: '💯', title: '100-dagarshjälten',      desc: '100 dagar utan ny kredit',                          color: '#8B5CF6' },
  { id: 'buckets_set',            emoji: '🪣', title: 'Trefintaren',            desc: 'Satte mål för alla tre hinkarna',                   color: '#40916C' },
  { id: 'first_debt_paid',        emoji: '🔥', title: 'Första lågan',           desc: 'Betalade av din första skuld helt',                 color: '#F4A261' },
  { id: 'halfway_there',          emoji: '⚡', title: 'Halvtid',                desc: 'Betalat av minst 50% av totalskulden',              color: '#C77B2A' },
  { id: 'all_debts_paid',         emoji: '🎊', title: 'Skuldfri',               desc: 'Alla skulder är avbetalade — du klarade det!',      color: '#40916C' },
]

export const LEVELS = [
  { min: 0,  label: 'Nybörjaren',     color: '#8B949E' },
  { min: 2,  label: 'Medveten',       color: '#F4A261' },
  { min: 5,  label: 'Skuldhackaren',  color: '#E63946' },
  { min: 8,  label: 'Finansmästaren', color: '#4A9ECC' },
  { min: 11, label: 'DebtHacker Pro', color: '#8B5CF6' },
]

export function getLevel(count) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (count >= l.min) level = l
  }
  return level
}

export function checkAchievements(state, existingIds) {
  const { debts, subscriptions, behaviorProof, consolidationUnlocked, buckets } = state
  const toUnlock = []
  const check = (id, condition) => {
    if (condition && !existingIds.includes(id)) toUnlock.push(id)
  }

  const originalTotal = debts.reduce((s, d) => s + d.balance, 0)
  const currentTotal = debts.filter(d => !d.paid_off).reduce((s, d) => s + d.balance, 0)

  check('first_debt',             debts.length > 0)
  check('first_sub_killed',       subscriptions.some(s => !s.active))
  check('card_closed',            behaviorProof.cardClosed)
  check('first_extra_payment',    behaviorProof.extraPayments >= 1)
  check('consolidation_unlocked', consolidationUnlocked)
  check('day_7',                  behaviorProof.noCreditDays >= 7)
  check('day_30',                 behaviorProof.noCreditDays >= 30)
  check('day_100',                behaviorProof.noCreditDays >= 100)
  check('buckets_set',            buckets.every(b => b.goal > 0 && b.current > 0))
  check('first_debt_paid',        debts.some(d => d.paid_off))
  check('halfway_there',          originalTotal > 0 && currentTotal / originalTotal <= 0.5)
  check('all_debts_paid',         debts.length > 0 && debts.every(d => d.paid_off))

  return toUnlock
}
