import type { FormDefinition, FormId } from '../../../model';
import { FORM_A_DEXTERITY, FORM_A_STRENGTH, FORM_B_DRAW_BONUS, TORTOISE_DEXTERITY, TORTOISE_STRENGTH } from '../../tunables';

// The Druid's forms (user, 2026-10-13). A form is not a different character: it is an effect that adds or
// removes stats and swaps the hero's picture (src/data/art.ts HERO_ART.druid.forms). One form at a time;
// it ends at the start of the player's next turn or when another form is entered. Tortoise is the user's
// name; "Form A" and "Form B" are placeholder names (the animals are undecided). Numbers: tunables.ts.

export const FORMS: Readonly<Record<FormId, FormDefinition>> = {
  tortoise: { id: 'tortoise', name: 'Tortoise', stats: { dexterity: TORTOISE_DEXTERITY, strength: TORTOISE_STRENGTH } },
  formA: { id: 'formA', name: 'Form A', stats: { strength: FORM_A_STRENGTH, dexterity: FORM_A_DEXTERITY } },
  formB: { id: 'formB', name: 'Form B', stats: {}, drawBonus: FORM_B_DRAW_BONUS },
};

export const FORM_IDS = Object.keys(FORMS) as FormId[];

/** The form's name as a phrase: "Tortoise form", but "Form A" (not "Form A form"). */
export const formLabel = (form: FormDefinition): string => (/form/i.test(form.name) ? form.name : `${form.name} form`);

const signed = (n: number): string => `${n > 0 ? '+' : ''}${n}`;

/** What a form does, as a short phrase: "+3 Dexterity, -2 Strength" / "card and hero power draws draw 1 more card". */
export function describeForm(form: FormDefinition): string {
  // what the form gives before what it takes away
  const stats = (['strength', 'dexterity'] as const)
    .filter((id) => form.stats[id])
    .map((id) => ({ amount: form.stats[id]!, name: id === 'strength' ? 'Strength' : 'Dexterity' }))
    .sort((a, b) => b.amount - a.amount);
  const parts: string[] = stats.map((s) => `${signed(s.amount)} ${s.name}`);
  if (form.drawBonus) parts.push(`your card and hero power draws draw ${form.drawBonus} more`);
  return parts.join(', ');
}
