// The playable heroes' ids: the primary keys other tables point at (`card.owner`, `HeroPowerDefinition.owner`, saves).
// Kept in a module of their own, depending on nothing, so any file can import them without a circular import.
// Cards that belong to no hero use the owner 'neutral' (see src/data/neutral/).

export const MAGE = 'mage';
export const PALADIN = 'paladin';
export const DRUID = 'druid';
