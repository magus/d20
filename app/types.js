// @flow
export type DieRollType = { d: number, result: number, mod: number };
export type DieRollType2 = { original: string, d: string[], result: number[], error?: Error };

// Socket events
export type RollEvent = {
  id: string,
  userId: string,
  dieRolls: DieRollType[],
  time: number,
};
export type UserIdentity = {
  id: string,
  name: string,
  image: string | null,
  active: boolean,
};
export type UserLookup = { [userId: string]: UserIdentity | null };
export type RollsByUser = { [userId: string]: RollEvent[] };

export const userFromId = (userId: string): UserIdentity => ({
  id: userId,
  name: userId.slice(0, 4),
  image: null,
  active: false,
});
