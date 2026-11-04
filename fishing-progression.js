/** Pure fishing progression rules. No network, browser storage or payments. */
export const MAX_LEVEL = 99;
export const STARTER_EQUIPMENT = Object.freeze({
  rod: 'Cần cơ bản 4,5 m', line: 'Dây thường', hook: 'Số 5',
  float: 'Phao cơ bản', bag: 'Bộ khởi đầu'
});
export function xpNeeded(level) {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) throw new RangeError('Invalid level');
  return level === MAX_LEVEL ? 0 : 120 + (level - 1) * 40;
}
export function initialProgress() {
  return { level: 1, xp: 0, catches: 0, totalKg: 0, biggestKg: 0, medals: {gold: 0, silver: 0, bronze: 0}, equipment: {...STARTER_EQUIPMENT} };
}
export function awardCatch(previous, weightKg) {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) throw new RangeError('Invalid fish weight');
  const state = structuredClone(previous);
  if (!Number.isInteger(state.level) || state.level < 1 || state.level > MAX_LEVEL) throw new RangeError('Invalid profile');
  const gained = Math.max(10, Math.round(weightKg * 12));
  state.catches += 1;
  state.totalKg = Math.round((state.totalKg + weightKg) * 100) / 100;
  state.biggestKg = Math.max(state.biggestKg, weightKg);
  state.xp += gained;
  while (state.level < MAX_LEVEL && state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level += 1;
  }
  if (state.level === MAX_LEVEL) state.xp = 0;
  return {profile: state, xpGained: gained};
}
