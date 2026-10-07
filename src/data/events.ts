import type { EventDefinition } from '../game/types';

// PLACEHOLDER events: generic text and rough numbers, only to exercise the event system and its
// outcomes. Real event writing is the user's (see CLAUDE.md).

export const EVENT_A: EventDefinition = {
  id: 'event-a',
  title: 'Event A',
  text: 'Placeholder event. Something is lying on the path.',
  choices: [
    { label: 'Take it', outcomes: [{ kind: 'gold', value: 60 }, { kind: 'hp', value: -8 }] },
    { label: 'Leave it', outcomes: [] },
  ],
};

export const EVENT_B: EventDefinition = {
  id: 'event-b',
  title: 'Event B',
  text: 'Placeholder event. A quiet place offers two things, and you can have one.',
  choices: [
    { label: 'Rest here', outcomes: [{ kind: 'hp', value: 15 }] },
    { label: 'Study here', outcomes: [{ kind: 'randomCard' }] },
    { label: 'Move on', outcomes: [] },
  ],
};

export const EVENT_C: EventDefinition = {
  id: 'event-c',
  title: 'Event C',
  text: 'Placeholder event. Something guards a prize.',
  choices: [
    { label: 'Fight for it', outcomes: [{ kind: 'fight', enemies: ['enemy-b'] }, { kind: 'relic' }] },
    { label: 'Walk away', outcomes: [] },
  ],
};

export const EVENT_D: EventDefinition = {
  id: 'event-d',
  title: 'Event D',
  text: 'Placeholder event. A bargain is offered.',
  choices: [
    { label: 'Pay for strength', outcomes: [{ kind: 'gold', value: -50 }, { kind: 'maxHp', value: 8 }] },
    { label: 'Decline', outcomes: [] },
  ],
};

const ALL_EVENTS: EventDefinition[] = [EVENT_A, EVENT_B, EVENT_C, EVENT_D];

export const EVENTS: Readonly<Record<string, EventDefinition>> = Object.fromEntries(
  ALL_EVENTS.map((event): [string, EventDefinition] => [event.id, event])
);

if (Object.keys(EVENTS).length !== ALL_EVENTS.length) throw new Error('duplicate event id');

export function getEvent(id: string): EventDefinition {
  const event = EVENTS[id];
  if (!event) throw new Error(`unknown event id: ${id}`);
  return event;
}
