/** The Druid's forms (PLACEHOLDER names except Tortoise): at most one is active; it ends at the start of the
 *  player's next turn, or when another form is entered. */
export type FormId = 'tortoise' | 'formA' | 'formB';

export interface FormDefinition {
  id: FormId;
  name: string;
  /** Stacks of Strength and Dexterity the form adds while active (negative takes them away). Removed exactly on leaving. */
  stats: { strength?: number; dexterity?: number };
  /** Extra cards drawn by every card or hero-power draw effect while in the form. */
  drawBonus?: number;
}
