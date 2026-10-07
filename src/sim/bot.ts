import type { CombatState } from '../game/CombatState';
import type { CardInstance, EnemyState } from '../game/types';

/**
 * A deliberately simple, greedy player used to measure the game, not to win it. Its results are
 * only meaningful as comparisons ("did this change make fights shorter?"), never as "a player
 * would win X% of the time". It spends energy each turn on the best-scoring playable card until
 * nothing worth playing is left:
 *   powers first, then status cards (so Vulnerable lands before the hits), then draws, then
 *   attacks (aimed at whatever it can kill, else the weakest enemy), with block taking priority
 *   when the enemies would otherwise hurt.
 */

function incomingDamage(combat: CombatState): number {
  return combat.livingEnemies.reduce((sum, e) => sum + (combat.intentDamage(e) ?? 0), 0);
}

function scoreCard(combat: CombatState, card: CardInstance): number {
  const def = card.definition;
  if (def.type === 'power') return 100;
  const effects = def.effects ?? [];
  const damage = effects.filter((e) => e.kind === 'damage').reduce((n, e) => n + e.value, 0);
  const block = effects.filter((e) => e.kind === 'block').reduce((n, e) => n + e.value, 0);
  const draws = effects.some((e) => e.kind === 'draw');
  const status = effects.some((e) => e.kind === 'applyStatus');

  let score = 0;
  if (status) score += 80;
  if (draws) score += 70;
  if (damage > 0) score += 40 + damage;
  if (block > 0) {
    const needed = Math.max(0, incomingDamage(combat) - combat.player.block);
    score += needed > 0 ? 60 + Math.min(block, needed) : 5;
  }
  // a cheaper card wins ties: more plays per energy
  return score - def.cost * 0.5;
}

function chooseTarget(combat: CombatState, card: CardInstance): EnemyState | undefined {
  if (!card.definition.target) return undefined;
  const damage = (card.definition.effects ?? []).filter((e) => e.kind === 'damage').reduce((n, e) => n + e.value, 0);
  const living = combat.livingEnemies;
  const killable = living.filter((e) => e.hp + e.block <= combat.calcDamage(damage, combat.player, e));
  const pool = killable.length > 0 ? killable : living;
  return pool.reduce((best, e) => (e.hp + e.block < best.hp + best.block ? e : best), pool[0]);
}

/** Plays out one player turn (not including ending it). */
export function playBotTurn(combat: CombatState): void {
  for (let guard = 0; guard < 50 && combat.phase === 'playerTurn'; guard++) {
    const options = combat.deck.hand
      .filter((c) => combat.canPlay(c))
      .map((c) => ({ card: c, score: scoreCard(combat, c) }))
      .filter((o) => o.score > 0)
      .sort((a, b) => b.score - a.score);
    const pick = options[0];
    if (!pick) return;
    const target = chooseTarget(combat, pick.card);
    if (!combat.playCard(pick.card.instanceId, target?.id)) return;
  }
}
