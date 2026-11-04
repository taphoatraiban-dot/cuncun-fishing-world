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

/** Preview-only equipment swaps. The allowed starter items are not purchases. */
export const PRACTICE_EQUIPMENT = Object.freeze({
  rod: Object.freeze(['Cần cơ bản 4,5 m', 'Cần tập 5,4 m']),
  line: Object.freeze(['Dây thường', 'Dây tập chịu lực']),
  hook: Object.freeze(['Số 5', 'Số 6']),
  float: Object.freeze(['Phao cơ bản', 'Phao tập nhạy'])
});
export function equipPracticeItem(previous, slot, item) {
  if (!Object.hasOwn(PRACTICE_EQUIPMENT, slot) || !PRACTICE_EQUIPMENT[slot].includes(item)) {
    throw new RangeError('Invalid practice equipment');
  }
  if (!previous || !previous.equipment || typeof previous.equipment !== 'object') {
    throw new TypeError('Invalid profile equipment');
  }
  const next = structuredClone(previous);
  next.equipment[slot] = item;
  return next;
}
