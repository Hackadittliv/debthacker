import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { ACHIEVEMENTS, LEVELS, getLevel } from '../../utils/achievements'
import { formatSEK } from '../../utils/math'

const MILESTONE_DAYS = { 7: '#F4A261', 30: '#4A9ECC', 50: '#C77B2A', 100: '#8B5CF6' }

const todayKey = () => new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

export const ProgressView = ({
  achievements, behaviorProof, setBehaviorProof, debts, subscriptions, consolidationUnlocked, buckets
}) => {
  const { S, C } = useTheme()
  const unlockedIds = achievements.map(a => a.id)
  const level = getLevel(unlockedIds.length)
  const nextLevel = LEVELS.find(l => l.min > unlockedIds.length)
  const days = Math.min(behaviorProof.noCreditDays, 100)

  const lastLoggedDay = (() => { try { return localStorage.getItem('dh_last_day_log') } catch { return null } })()
  const alreadyLoggedToday = lastLoggedDay === todayKey()

  const logDay = () => {
    if (alreadyLoggedToday) return
    setBehaviorProof(p => ({ ...p, noCreditDays: (p.noCreditDays || 0) + 1 }))
    try { localStorage.setItem('dh_last_day_log', todayKey()) } catch {}
  }

  // Debt progress
  const totalDebts = debts.length
  const paidDebts = debts.filter(d => d.paid_off).length
  const totalOriginalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalRemaining = debts.filter(d => !d.paid_off).reduce((s, d) => s + d.balance, 0)
  const totalPaidOff = totalOriginalDebt - totalRemaining
  const paidOffPct = totalOriginalDebt > 0 ? Math.round((totalPaidOff / totalOriginalDebt) * 100) : 0

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#8B5CF6' }}>Framsteg 🏆</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Varje steg räknas</div>
      </div>

      {/* Level card */}
      <div style={{ ...S.card, background: `linear-gradient(135deg, ${level.color}18, ${C.bgCard})`, border: `1px solid ${level.color}44`, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Din nivå</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: level.color }}>{level.label}</div>
            {nextLevel && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
                {nextLevel.min - unlockedIds.length} st kvar till{' '}
                <span style={{ color: nextLevel.color, fontWeight: 600 }}>{nextLevel.label}</span>
              </div>
            )}
            {!nextLevel && (
              <div style={{ fontSize: 12, color: level.color, marginTop: 3, fontWeight: 600 }}>Max nivå uppnådd 🎉</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: level.color, lineHeight: 1 }}>{unlockedIds.length}</div>
            <div style={{ fontSize: 11, color: C.textSecondary }}>av {ACHIEVEMENTS.length} badges</div>
          </div>
        </div>
        <div style={{ ...S.progBar, marginTop: 14 }}>
          <div style={S.progFill(Math.round((unlockedIds.length / ACHIEVEMENTS.length) * 100), level.color)} />
        </div>
      </div>

      {/* Debt progress */}
      {totalDebts > 0 && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Skuldfrihetsmätaren</div>
              <div style={{ fontSize: 12, color: C.textSecondary }}>{paidDebts} av {totalDebts} skulder avbetalade</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#40916C' }}>{paidOffPct}%</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{formatSEK(totalPaidOff)} borta</div>
            </div>
          </div>
          <div style={{ ...S.progBar }}>
            <div style={S.progFill(paidOffPct, '#40916C')} />
          </div>
          {totalRemaining > 0 && (
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
              {formatSEK(totalRemaining)} återstår
            </div>
          )}
        </div>
      )}

      {/* 100-day challenge */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>100-dagarschallenge</div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>Dagar utan ny kredit</div>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: days >= 100 ? '#8B5CF6' : days >= 30 ? '#4A9ECC' : '#F4A261' }}>
            {days}/100
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, marginBottom: 12 }}>
          {Array.from({ length: 100 }, (_, i) => {
            const dayNum = i + 1
            const done = dayNum <= days
            const milestoneColor = MILESTONE_DAYS[dayNum]
            return (
              <div
                key={i}
                title={`Dag ${dayNum}${milestoneColor ? ` ★` : ''}`}
                style={{
                  height: 18,
                  borderRadius: 3,
                  background: done
                    ? (milestoneColor || '#40916C')
                    : (milestoneColor ? `${milestoneColor}28` : C.bgElevated),
                  border: milestoneColor ? `1px solid ${milestoneColor}${done ? 'cc' : '55'}` : 'none',
                  transition: 'background 0.3s',
                }}
              />
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          {Object.entries(MILESTONE_DAYS).map(([d, color]) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: days >= Number(d) ? color : `${color}30`, border: `1px solid ${color}` }} />
              <span style={{ fontSize: 11, color: days >= Number(d) ? color : C.textMuted, fontWeight: days >= Number(d) ? 600 : 400 }}>
                Dag {d}
              </span>
            </div>
          ))}
        </div>

        {days < 100 && (
          <button
            onClick={logDay}
            disabled={alreadyLoggedToday}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
              background: alreadyLoggedToday ? C.bgSunken : 'linear-gradient(135deg, #40916C, #2D6A4F)',
              color: alreadyLoggedToday ? C.textMuted : '#fff',
              fontSize: 14, fontWeight: 700, cursor: alreadyLoggedToday ? 'default' : 'pointer',
            }}
          >
            {alreadyLoggedToday ? `✅ Dag ${behaviorProof.noCreditDays} loggad idag` : `✊ Logga dag ${(behaviorProof.noCreditDays || 0) + 1} - ingen ny kredit idag`}
          </button>
        )}
        {days >= 100 && (
          <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 14, color: '#8B5CF6', fontWeight: 700 }}>
            🎉 100-dagarschallengen klarad!
          </div>
        )}
      </div>

      {/* Achievement badges */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Achievements{' '}
          <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 400 }}>{unlockedIds.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ACHIEVEMENTS.map(ach => {
            const unlocked = unlockedIds.includes(ach.id)
            const entry = achievements.find(a => a.id === ach.id)
            return (
              <div
                key={ach.id}
                style={{
                  background: unlocked ? `${ach.color}12` : C.bgSunken,
                  border: `1px solid ${unlocked ? ach.color + '44' : C.border}`,
                  borderRadius: 14,
                  padding: '14px 12px',
                  opacity: unlocked ? 1 : 0.45,
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6, filter: unlocked ? 'none' : 'grayscale(1)' }}>{ach.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: unlocked ? ach.color : C.textSecondary, marginBottom: 2, lineHeight: 1.3 }}>{ach.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>{ach.desc}</div>
                {unlocked && entry?.unlockedAt && (
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>
                    {new Date(entry.unlockedAt).toLocaleDateString('sv-SE')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
