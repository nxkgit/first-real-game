-- The cards table: where card designs are written down before they are built (docs/DB.md).
-- It is an INPUT for Claude, not the game's data: the game reads TypeScript (src/data/), which stays the
-- source of truth. The columns mirror the simple fields of CardDefinition (src/model/card.ts); the card's
-- behaviour (effects, triggers, upgrade) is written in plain words, because the structured form is
-- built into TypeScript from them. Structured columns can come later with the schema work.
--
-- Runs once, the first time the container starts with an empty volume. A later change to the table goes here AND in a new
-- idempotent file in db/migrations/ (which `npm run db:up` applies to a database that already exists).

CREATE TABLE cards (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- database-only key; query by name or slug
  slug            text    NOT NULL UNIQUE                              -- = CardDefinition.id: permanent, never changes on a rename
                  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),           --   lowercase words joined by hyphens
  name            text    NOT NULL UNIQUE CHECK (length(trim(name)) > 0),

  type            text    NOT NULL CHECK (type IN ('attack', 'skill', 'power')),
  cost            integer NOT NULL CHECK (cost >= 0),
  cost_resource   text    CHECK (cost_resource IN ('radiantLight')),   -- empty = paid in energy
  owner           text    NOT NULL                                     -- a hero id (mage, paladin, druid) or neutral
                  CHECK (owner ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  target          text    CHECK (target IN ('enemy')),                 -- 'enemy' = aimed at one enemy; empty = plays on click / hits all
  in_reward_pool  boolean NOT NULL DEFAULT false,
  in_starter_pool boolean NOT NULL DEFAULT false,
  exhaust         boolean NOT NULL DEFAULT false,
  innate          boolean NOT NULL DEFAULT false,
  retain          boolean NOT NULL DEFAULT false,
  ethereal        boolean NOT NULL DEFAULT false,
  unplayable      boolean NOT NULL DEFAULT false,
  tags            text[]  NOT NULL DEFAULT '{}',
  archetype       text,
  rarity          text    CHECK (rarity IN ('common', 'uncommon', 'rare')),

  effects_words   text    NOT NULL CHECK (length(trim(effects_words)) > 0),   -- what the card does, in order, with the numbers
  upgrade_words   text    NOT NULL CHECK (length(trim(upgrade_words)) > 0),   -- what the upgrade changes (write "none" if it has no upgrade)
  notes           text,                                                       -- anything unusual (edge cases, doubts)
  status          text    NOT NULL DEFAULT 'draft'                            -- see docs/CARD_WORKFLOW.md
                  CHECK (status IN ('draft', 'ready', 'built', 'blocked')),   --   draft: still designing; ready: build it; built / blocked: set by Claude
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- "Tortoise Form" -> "tortoise-form": lowercase, every run of other characters becomes one hyphen.
CREATE FUNCTION slugify(value text) RETURNS text
  LANGUAGE sql IMMUTABLE
  AS $$ SELECT trim(BOTH '-' FROM regexp_replace(lower(value), '[^a-z0-9]+', '-', 'g')) $$;

-- The slug is the game's permanent id (saves, scenarios and presets store it). It is set from the name
-- when the row is created, and a later rename does not change it.
CREATE FUNCTION cards_slug_guard() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := slugify(NEW.name);
    END IF;
  ELSIF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'a card''s slug is permanent (it is the id the game stores); to rename the card change only "name"';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER cards_slug_guard
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION cards_slug_guard();
