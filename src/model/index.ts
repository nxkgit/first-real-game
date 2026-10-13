// The game's schema: one file per entity. Types only (plus PLAYER_ID); no logic and no imports from game/ or data/.
export type * from './card';
export type * from './combat';
export { PLAYER_ID } from './combat';
export type * from './effect';
export type * from './enemy';
export type * from './event';
export type * from './form';
export type * from './hero';
export type * from './relic';
export type * from './status';
export type * from './trigger';
