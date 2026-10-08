import type { CardDefinition, CardInstance } from './types';
import { MAX_HAND_SIZE } from '../data/tunables';

let instanceCounter = 0;
function nextInstanceId(): string {
  instanceCounter += 1;
  return `card-${instanceCounter}`;
}

/** Draw pile / hand / discard pile, with StS-style draw-and-reshuffle. */
export class Deck {
  drawPile: CardInstance[] = [];
  hand: CardInstance[] = [];
  discardPile: CardInstance[] = [];
  /** Cards removed for the rest of this combat. Never reshuffled. */
  exhaustPile: CardInstance[] = [];
  /** Power cards played this combat. They stay in play for the rest of the fight (never reshuffled), as in StS. */
  powerPile: CardInstance[] = [];

  private readonly random: () => number;

  constructor(cards: CardDefinition[], random: () => number = Math.random) {
    this.random = random;
    this.drawPile = cards.map((definition) => ({ instanceId: nextInstanceId(), definition }));
    this.shuffleDrawPile();
  }

  shuffleDrawPile(): void {
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }
  }

  draw(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) return; // nothing left anywhere
        this.drawPile = this.discardPile;
        this.discardPile = [];
        this.shuffleDrawPile();
      }
      const card = this.drawPile.pop();
      if (!card) continue;
      if (this.hand.length >= MAX_HAND_SIZE) this.discardPile.push(card);
      else this.hand.push(card);
    }
  }

  playCard(instanceId: string): CardInstance | undefined {
    const index = this.hand.findIndex((c) => c.instanceId === instanceId);
    if (index === -1) return undefined;
    const [card] = this.hand.splice(index, 1);
    // a power stays in play for the rest of the fight instead of coming back around
    if (card.definition.type === 'power') this.powerPile.push(card);
    else this.discardPile.push(card);
    return card;
  }

  /** Removes a card from wherever it is (hand, discard or draw pile) and puts it in the exhaust pile. */
  exhaustCard(instanceId: string): CardInstance | undefined {
    for (const pile of [this.hand, this.discardPile, this.drawPile]) {
      const index = pile.findIndex((c) => c.instanceId === instanceId);
      if (index === -1) continue;
      const [card] = pile.splice(index, 1);
      this.exhaustPile.push(card);
      return card;
    }
    return undefined;
  }

  /** Exhausts one random card from the hand (using the deck's own random source); undefined if the hand is empty. */
  exhaustRandomFromHand(): CardInstance | undefined {
    if (this.hand.length === 0) return undefined;
    const pick = this.hand[Math.floor(this.random() * this.hand.length)];
    return this.exhaustCard(pick.instanceId);
  }

  /** Discards one random card from the hand to the discard pile (so it can be reshuffled, unlike exhausting);
   *  undefined if the hand is empty. */
  discardRandomFromHand(): CardInstance | undefined {
    if (this.hand.length === 0) return undefined;
    const index = Math.floor(this.random() * this.hand.length);
    const [card] = this.hand.splice(index, 1);
    this.discardPile.push(card);
    return card;
  }

  /** Puts up to `count` new instances of `definition` straight into the hand (not drawn from any
   *  pile); overflow past the hand cap goes to the discard pile, as with a normal draw. Returns how
   *  many actually landed in the hand. */
  addCopiesToHand(definition: CardDefinition, count: number): number {
    let added = 0;
    for (let i = 0; i < count; i++) {
      const card: CardInstance = { instanceId: nextInstanceId(), definition };
      if (this.hand.length >= MAX_HAND_SIZE) this.discardPile.push(card);
      else {
        this.hand.push(card);
        added += 1;
      }
    }
    return added;
  }

  /**
   * Replaces every pile with exactly these cards (new instances, so instance ids are not the ones
   * a captured fight had). `draw` is listed in the order the cards will be drawn (index 0 comes
   * out first); `discard`, `exhaust` and `powers` in the order they got there. Draws nothing and
   * shuffles nothing, so it uses no randomness.
   */
  loadPiles(piles: {
    draw: CardDefinition[];
    hand: CardDefinition[];
    discard: CardDefinition[];
    exhaust: CardDefinition[];
    powers: CardDefinition[];
  }): void {
    const make = (list: CardDefinition[]): CardInstance[] => list.map((definition) => ({ instanceId: nextInstanceId(), definition }));
    this.drawPile = make(piles.draw).reverse(); // the top of the pile is the end of the array
    this.hand = make(piles.hand);
    this.discardPile = make(piles.discard);
    this.exhaustPile = make(piles.exhaust);
    this.powerPile = make(piles.powers);
  }

  discardHand(): void {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }
}
