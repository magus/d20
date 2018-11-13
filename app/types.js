// @flow
export type DieRollType = { d: number, result: number, mod: number };

// Socket events
export type RollEvent = { id: string, userId: string, dieRolls: DieRollType[], time: number };
export type UserIdentity = { id: string, name: string, image: string | null };
export type ActiveUsers = { [userId: string]: UserIdentity | null };

export const userFromId = (userId: string): UserIdentity => ({
  id: userId,
  name: userId.slice(0, 4),
  image: null,
});
