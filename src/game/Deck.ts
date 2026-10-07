import type { CardDefinition, CardInstance } from './types';

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
      if (card) this.hand.push(card);
    }
  }

  playCard(instanceId: string): CardInstance | undefined {
    const index = this.hand.findIndex((c) => c.instanceId === instanceId);
    if (index === -1) return undefined;
    const [card] = this.hand.splice(index, 1);
    this.discardPile.push(card);
    return card;
  }

  discardHand(): void {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }
}
