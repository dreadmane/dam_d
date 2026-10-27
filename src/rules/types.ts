/* eslint-disable */
// Generated from data/rules/schemas by `npm run gen-types` (sync-data runs it
// too). Do not edit: change the schema in the workspace, then re-sync.

export type Meta = {
  dataVersion: string
  extractedOn: string
  /**
   * Honest: a deliberate slice says false, and notes states both sides of the line.
   */
  complete: boolean
  /**
   * srd ships in the app's repo and site; books never does (dnd-rules CONTEXT, Two tiers).
   */
  tier: 'srd' | 'books'
  /**
   * srd-verbatim only with tier srd.
   */
  textPolicy: 'srd-verbatim' | 'restated'
  /**
   * The SRD's required attribution statement, carried by every srd file.
   */
  attribution?: string
  notes?: string
  /**
   * Compute-tree or effect nodes this file needed beyond this vocabulary, each with the printed rule that forced it. Agents propose; the orchestrator adds the node here, so the vocabulary never grows silently.
   */
  expressionExtensions?: {
    node: string
    why: string
  }[]
}
/**
 * A compute tree. App code never hardcodes a formula, so every printed formula is a display string plus one of these. Deliberately small; a new node is declared in meta.expressionExtensions.
 */
export type Expression =
  | ExprConstant
  | ExprAbilityScore
  | ExprAbilityMod
  | ExprProficiencyBonus
  | ExprLevel
  | ExprClassLevel
  | ExprClassColumn
  | ExprByLevel
  | ExprSum
  | ExprProduct
  | ExprMax
  | ExprMin
  | ExprFloorDiv
/**
 * Where a record came from: the cite-the-book rule. The SRD is cited by page, which equals the PDF page (calibrated 2026-10-18). Every other book is the user's clippings, which have no page numbers, so it is cited by chapter and section, and a page is never guessed: the PHB, the DMG, and since 2026-10-24 locathah-rising (the Locathah species, which D&D Beyond's sheet cites as LR) and arcana-unleashed (the Arcana Domain, cited AU). Each ref is a folder of clippings in reference/books/.
 */
export type Source = {
  ref: 'srd-5.2.1' | 'phb-2024' | 'dmg-2024' | 'locathah-rising' | 'arcana-unleashed'
  section: string
  page?: number
  table?: string
}
/**
 * A statement of rule that is not itself a catalogue record (resting, death saves, multiclass prerequisites). The standard shape in every file.
 */
export type Rule = {
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  name: string
  /**
   * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
   */
  text: string
  compute?: Expression
  dependsOn?: string[]
  effects?: Effect[]
  source: Source
  /**
   * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
   */
  confidence: 'printed' | 'derived' | 'inferred' | 'house'
  note?: string
}
/**
 * What a feature, trait, feat, item, condition or toggle does, in one closed vocabulary (d-amp-d spec §5.1). Anything it cannot say goes in a text effect and stays the table's. when holds a printed condition the app shows and never decides ('while you aren't wearing armor').
 */
export type Effect =
  | EffBonus
  | EffAcFormula
  | EffSpeed
  | EffProficiency
  | EffExpertise
  | EffAdvantage
  | EffDefense
  | EffConditionImmunity
  | EffSense
  | EffResource
  | EffGrantSpell
  | EffAbilityIncrease
  | EffChoice
  | EffAttackCount
  | EffCritRange
  | EffAttackOption
  | EffSaveDc
  | EffSetScore
  | EffText
/**
 * A place the source is unclear or conflicts with itself. Recorded with every reading, never ruled by an agent: status open until the user rules.
 */
export type Ambiguity = {
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  question: string
  /**
   * @minItems 2
   */
  readings: [
    {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id: string
      text: string
      recommended?: boolean
    },
    {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id: string
      text: string
      recommended?: boolean
    },
    ...{
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id: string
      text: string
      recommended?: boolean
    }[]
  ]
  status: 'open' | 'ruled'
  ruling?: Ruling
  /**
   * Items: A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
   */
  affects?: string[]
  source: Source
}
export type Class = {
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  name: string
  /**
   * Every listed ability; primaryAbilitiesMode says whether one or all are needed (Fighter: Strength or Dexterity).
   *
   * @minItems 1
   *
   * Items: The six abilities (SRD 5.2.1 p.5).
   */
  primaryAbilities: [
    'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
    ...('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')[]
  ]
  primaryAbilitiesMode?: 'all' | 'any'
  hitDie: 6 | 8 | 10 | 12
  /**
   * @minItems 2
   * @maxItems 2
   *
   * Items: The six abilities (SRD 5.2.1 p.5).
   */
  savingThrows: [
    'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
    'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  ]
  skillChoice: {
    count: number
    /**
     * The listed skills, or ['any'] where the class may choose any.
     */
    options: (
      | (
          | 'acrobatics'
          | 'animal-handling'
          | 'arcana'
          | 'athletics'
          | 'deception'
          | 'history'
          | 'insight'
          | 'intimidation'
          | 'investigation'
          | 'medicine'
          | 'nature'
          | 'perception'
          | 'performance'
          | 'persuasion'
          | 'religion'
          | 'sleight-of-hand'
          | 'stealth'
          | 'survival'
        )
      | 'any'
    )[]
  }
  /**
   * simple, martial, or weapon ids from equipment.json. A printed qualifier ('Martial weapons that have the Light property') is listed as the ids it covers in the Weapons table, and its printed words stay in weaponProficienciesNote (2026-10-24, the rules audit's finding 3).
   */
  weaponProficiencies: string[]
  weaponProficienciesNote?: string
  armorTraining: ('light' | 'medium' | 'heavy' | 'shields')[]
  /**
   * Fixed tools by id, and/or a choice.
   */
  toolProficiencies?: {
    /**
     * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    ids?: string[]
    choice?: EffChoice
  }
  /**
   * The printed options (A, B, sometimes C). items lists equipment ids with quantities where the option is a list; gp where it is coin.
   *
   * @minItems 1
   */
  startingEquipment: [
    {
      id: 'a' | 'b' | 'c'
      text: string
      items?: {
        /**
         * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
         */
        item: string
        quantity: number
      }[]
      gp?: number
    },
    ...{
      id: 'a' | 'b' | 'c'
      text: string
      items?: {
        /**
         * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
         */
        item: string
        quantity: number
      }[]
      gp?: number
    }[]
  ]
  /**
   * As a Multiclass: what a character gains taking this class after level 1 (the class's Core traits table and the Multiclassing rules).
   */
  multiclass: {
    gains: Effect[]
    text?: string
  }
  spellcasting?: Spellcasting
  /**
   * The class's features table. columns name every column beyond Level, Proficiency Bonus and Class Features; rows carry each level's value for each.
   */
  table: {
    columns: {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id: string
      name: string
    }[]
    /**
     * @minItems 20
     * @maxItems 20
     */
    rows: [
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      },
      {
        level: number
        /**
         * Feature ids, or subclass-feature for the levels the table prints 'Subclass feature'.
         */
        features: string[]
        /**
         * Column id to the printed value: an integer, a die (d6), or a string such as 'Unlimited' or '—'.
         */
        values: {
          [k: string]: number | string
        }
      }
    ]
    source?: Source
  }
  features: Feature[]
  /**
   * Lists a feature chooses from: Eldritch Invocations, Metamagic Options, Fighting Styles printed in the class (if any).
   */
  optionLists?: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    options: Feature[]
  }[]
  /**
   * The class's spell list, as spell ids, from the class's own list (SRD prints it per class). spells.json's classes field must agree; the cross-file check holds them together.
   *
   * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  spellList?: string[]
  subclassLevel: number
  subclasses: Subclass[]
  source: Source
  /**
   * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
   */
  confidence: 'printed' | 'derived' | 'inferred' | 'house'
  note?: string
}
/**
 * A named benefit: a class or subclass feature, a species trait, a feat's benefit, an invocation, a Metamagic option. text is the rule; effects are what the sheet applies of it.
 */
export type Feature = {
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  name: string
  /**
   * The class level that grants it; absent outside classes.
   */
  level?: number
  /**
   * What using it costs on a turn.
   */
  action?: 'action' | 'bonus-action' | 'reaction' | 'free' | 'none' | 'minute' | 'hour' | 'special'
  /**
   * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
   */
  text: string
  effects: Effect[]
  /**
   * An ongoing state the player switches on and off (Rage), whose effects apply only while on (spec C4).
   */
  toggle?: boolean
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  replaces?: string
  /**
   * Added 2026-10-18: what using it spends from a resource ('Cost: 1 Sorcery Point', Metamagic, SRD p.66).
   */
  cost?: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    resource: string
    amount: number | string
  }
  prerequisite?: Prerequisite
  source: Source
  /**
   * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
   */
  confidence: 'printed' | 'derived' | 'inferred' | 'house'
  note?: string
}
export type Subclass = {
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  classId: string
  name: string
  /**
   * The subclass's one-line identity, if printed.
   */
  text?: string
  features: Feature[]
  /**
   * Spells the subclass always has prepared, by class level (Domain Spells, Circle Spells, Oath Spells). Added 2026-10-26: choice, where a group comes only with one pick of one of the subclass's choices, names the choice's id and the value (Circle of the Land Spells, SRD p.46: a land's table only while that land is chosen).
   */
  spells?: {
    level: number
    /**
     * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    spells: string[]
    choice?: {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id: string
      value: string
    }
  }[]
  source: Source
  /**
   * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
   */
  confidence: 'printed' | 'derived' | 'inferred' | 'house'
  note?: string
}

/**
 * Every rules data file in data/rules/, keyed by file name without .json.
 */
export interface RulesData {
  backgrounds: BackgroundsData
  classes: ClassesData
  conditions: ConditionsData
  core: CoreData
  derivations: DerivationsData
  equipment: EquipmentData
  feats: FeatsData
  'magic-items': MagicItemsData
  monsters: MonstersData
  skills: SkillsData
  species: SpeciesData
  spellcasting: SpellcastingData
  spells: SpellsData
}
/**
 * Each background's three abilities (+2/+1 or +1/+1/+1, the rule in rules), Origin feat, two skills, tool, and equipment choice.
 */
export interface BackgroundsData {
  meta: Meta
  backgrounds: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    /**
     * @minItems 3
     * @maxItems 3
     *
     * Items: The six abilities (SRD 5.2.1 p.5).
     */
    abilities: [
      'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
      'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
      'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
    ]
    feat: {
      /**
       * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
       */
      feat: string
      /**
       * A printed choice inside the feat: Magic Initiate (Cleric).
       */
      choice?: string
      text?: string
    }
    /**
     * @minItems 2
     * @maxItems 2
     *
     * Items: The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
     */
    skills: [
      (
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      ),
      (
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      )
    ]
    tool: {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id?: string
      choice?: EffChoice
      text: string
    }
    /**
     * @minItems 1
     */
    equipment: [
      {
        id: 'a' | 'b'
        text: string
        items?: {
          /**
           * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
           */
          item: string
          quantity: number
          note?: string
        }[]
        gp?: number
      },
      ...{
        id: 'a' | 'b'
        text: string
        items?: {
          /**
           * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
           */
          item: string
          quantity: number
          note?: string
        }[]
        gp?: number
      }[]
    ]
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * A choice the player makes, whose answer is stored on the character (choices[]). Options are refs, ids, or a query: from holds 'skills:any', 'feats:origin' and the like.
 */
export interface EffChoice {
  type: 'choice'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  label?: string
  /**
   * An expression added 2026-10-18 for counts read from a table column: Weapon Mastery (SRD p.47), Eldritch Invocations (p.71).
   */
  count: number | Expression
  /**
   * Added 2026-10-18: a choice a feature gains at a later class level ('At Rogue level 6, you gain Expertise in two more', SRD p.61).
   */
  atLevel?: number
  kind?:
    | 'skill'
    | 'tool'
    | 'language'
    | 'feat'
    | 'spell'
    | 'ability'
    | 'fighting-style'
    | 'weapon-mastery'
    | 'invocation'
    | 'option'
    | 'other'
  options?: string[]
  from?: string
  /**
   * What the chosen option gives: proficiency, expertise, feat, spell, and so on.
   */
  grants?: string
  /**
   * Added 2026-10-22: limits on a monsters query's list, each read for the character. For Wild Shape's Known Forms (SRD p.42, the Beast Shapes table): maxCr, the highest Challenge Rating; fly, 1 where a form with a Fly Speed may be chosen and 0 where not; swarm, whether a swarm's stat block counts (false by the user's ruling, classes.json ambiguity wild-shape-swarms).
   */
  where?: {
    maxCr?: Expression
    fly?: Expression
    swarm?: boolean
  }
}
export interface ExprConstant {
  type: 'constant'
  value: number
  unit?: 'feet' | 'pounds' | 'hours' | 'minutes' | 'rounds' | 'hp' | 'gp'
}
export interface ExprAbilityScore {
  type: 'abilityScore'
  /**
   * The six abilities (SRD 5.2.1 p.5).
   */
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
}
/**
 * The ability's modifier, floor((score - 10) / 2) (SRD p.5). ability may be spellcasting: the class's spellcasting ability, resolved per class.
 */
export interface ExprAbilityMod {
  type: 'abilityMod'
  ability: ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') | 'spellcasting'
}
/**
 * The proficiency bonus by character level (core.json's table).
 */
export interface ExprProficiencyBonus {
  type: 'proficiencyBonus'
}
/**
 * The character level: the sum of every class's level.
 */
export interface ExprLevel {
  type: 'level'
}
/**
 * One class's level. class 'self' means the class whose feature this is.
 */
export interface ExprClassLevel {
  type: 'classLevel'
  class: string | 'self'
}
/**
 * A column of a class's features table at its current class level, e.g. the Barbarian's Rages or the Monk's Martial Arts die.
 */
export interface ExprClassColumn {
  type: 'classColumn'
  class: string | 'self'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  column: string
}
/**
 * A value that steps at printed levels: the highest entry whose level is at or below the given level. of is character or self (the feature's class level).
 */
export interface ExprByLevel {
  type: 'byLevel'
  of: 'character' | 'self'
  /**
   * @minItems 1
   */
  steps: [
    {
      level: number
      value: number | string
    },
    ...{
      level: number
      value: number | string
    }[]
  ]
}
export interface ExprSum {
  type: 'sum'
  /**
   * @minItems 2
   */
  terms: [Expression, Expression, ...Expression[]]
}
export interface ExprProduct {
  type: 'product'
  /**
   * @minItems 2
   */
  terms: [Expression, Expression, ...Expression[]]
}
export interface ExprMax {
  type: 'max'
  /**
   * @minItems 2
   */
  terms: [Expression, Expression, ...Expression[]]
}
export interface ExprMin {
  type: 'min'
  /**
   * @minItems 2
   */
  terms: [Expression, Expression, ...Expression[]]
}
/**
 * floor(of / by). The 2024 rules round down (SRD p.5, 'Round Down').
 */
export interface ExprFloorDiv {
  type: 'floorDiv'
  of: Expression
  by: number
}
/**
 * Adds a number to a target. value is a number or an expression. Negative for a penalty.
 */
export interface EffBonus {
  type: 'bonus'
  /**
   * What an effect changes. ability:<a>, save:<a>|save:all, save:vs-<condition>, death-save, skill:<s>|check:<a>|check:all, attack:<kind>, damage:<kind>, speed:<mode>, ac, hp-max, initiative, spell-dc, spell-attack, passive:<skill>, d20:all (every d20 Test). attack:this and damage:this, added 2026-10-18, mean rolls made with the item that carries the effect ('+1 bonus to attack rolls and damage rolls made with this magic weapon', Weapon, +1, +2, or +3, SRD p.253). proficiency-bonus added 2026-10-18 for the Ioun Stone of Mastery (SRD p.227). death-save added 2026-10-18 for Beacon of Hope and Survivor (SRD p.112, p.49); save:vs-<condition> for Protection from Poison ('saving throws to avoid or end the Poisoned condition', p.157). attunement added 2026-10-27: the number of magic items you can attune to at once (Use Magic Device, 'up to four', p.64).
   */
  target: string
  value: number | Expression
  /**
   * A die added rather than a flat number (Bless's 1d4).
   */
  dice?: string
  when?: string
  /**
   * Added 2026-10-19: the part of a when that the app can decide from the character itself, so the effect applies while it holds and not otherwise. armor: wearing Light, Medium or Heavy armor (Defense, SRD p.88). no-armor: not wearing armor (Barbarian Unarmored Defense, p.29; Draconic Resilience, p.67). no-armor-no-shield: neither armor nor a Shield (Monk Unarmored Defense and Unarmored Movement, p.50). no-heavy-armor (Fast Movement, p.30; Roving, p.58). not-incapacitated: without the Incapacitated condition (Aura of Protection, p.55; Danger Sense, p.29). worn, added 2026-10-19 for magic items: the item carrying the effect is worn or held (Armor, +1, 'while wearing this armor', p.210). strength-attack, added 2026-10-22: the attack it is added to uses Strength, decided per attack (Rage Damage, 'When you make an attack using Strength—with either a weapon or an Unarmed Strike', p.28). skill-not-proficient, added 2026-10-26: the check it is added to uses a skill the character lacks proficiency in, so adds no Proficiency Bonus of its own, decided per skill (Jack of All Trades, 'any ability check you make that uses a skill proficiency you lack and that doesn’t otherwise use your Proficiency Bonus', p.32). The when stays for display.
   */
  requires?:
    | 'armor'
    | 'no-armor'
    | 'no-armor-no-shield'
    | 'no-heavy-armor'
    | 'not-incapacitated'
    | 'skill-not-proficient'
    | 'strength-attack'
    | 'worn'
  spells?: SpellFilter
}
/**
 * Added 2026-10-27 for damage:spell: which spells a bonus reaches, each field narrowing it, so the sheet adds it to those spells' damage and no others ('Add your Wisdom modifier to the damage you deal with any Cleric cantrip', Potent Spellcasting, SRD p.38). castAs self: cast with the spellcasting of the class whose feature it is. cantrip: level 0 only. school: one school. chosen: the spell picked in the named choice beside it (Agonizing Blast's cantrip, p.72). damageTypes: only a damage entry of these types, or damageTypeChosen: of the type picked in the named choice (Elemental Affinity, p.70). oneRoll: it goes on one damage roll of a casting, not every one ('one damage roll of that spell', Empowered Evocation, p.82), which the sheet says beside it. A condition the filter can't decide stays in when, and the bonus shows as a note on those spells.
 */
export interface SpellFilter {
  castAs?: 'self'
  cantrip?: true
  school?:
    | 'abjuration'
    | 'conjuration'
    | 'divination'
    | 'enchantment'
    | 'evocation'
    | 'illusion'
    | 'necromancy'
    | 'transmutation'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  chosen?: string
  /**
   * @minItems 1
   *
   * Items: The 13 damage types (SRD 5.2.1 p.16-17).
   */
  damageTypes?: [
    (
      | 'acid'
      | 'bludgeoning'
      | 'cold'
      | 'fire'
      | 'force'
      | 'lightning'
      | 'necrotic'
      | 'piercing'
      | 'poison'
      | 'psychic'
      | 'radiant'
      | 'slashing'
      | 'thunder'
    ),
    ...(
      | 'acid'
      | 'bludgeoning'
      | 'cold'
      | 'fire'
      | 'force'
      | 'lightning'
      | 'necrotic'
      | 'piercing'
      | 'poison'
      | 'psychic'
      | 'radiant'
      | 'slashing'
      | 'thunder'
    )[]
  ]
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  damageTypeChosen?: string
  oneRoll?: true
}
/**
 * An alternative way to compute Armor Class; the character uses the highest available (SRD p.177, Armor Class). base plus the listed abilities' modifiers, dex capped by maxDex.
 */
export interface EffAcFormula {
  type: 'acFormula'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  base: number
  /**
   * Items: The six abilities (SRD 5.2.1 p.5).
   */
  abilities: ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')[]
  maxDex?: number
  allowsShield?: boolean
  when?: string
  /**
   * Added 2026-10-19: the part of a when that the app can decide from the character itself, so the effect applies while it holds and not otherwise. armor: wearing Light, Medium or Heavy armor (Defense, SRD p.88). no-armor: not wearing armor (Barbarian Unarmored Defense, p.29; Draconic Resilience, p.67). no-armor-no-shield: neither armor nor a Shield (Monk Unarmored Defense and Unarmored Movement, p.50). no-heavy-armor (Fast Movement, p.30; Roving, p.58). not-incapacitated: without the Incapacitated condition (Aura of Protection, p.55; Danger Sense, p.29). worn, added 2026-10-19 for magic items: the item carrying the effect is worn or held (Armor, +1, 'while wearing this armor', p.210). strength-attack, added 2026-10-22: the attack it is added to uses Strength, decided per attack (Rage Damage, 'When you make an attack using Strength—with either a weapon or an Unarmed Strike', p.28). skill-not-proficient, added 2026-10-26: the check it is added to uses a skill the character lacks proficiency in, so adds no Proficiency Bonus of its own, decided per skill (Jack of All Trades, 'any ability check you make that uses a skill proficiency you lack and that doesn’t otherwise use your Proficiency Bonus', p.32). The when stays for display.
   */
  requires?:
    | 'armor'
    | 'no-armor'
    | 'no-armor-no-shield'
    | 'no-heavy-armor'
    | 'not-incapacitated'
    | 'skill-not-proficient'
    | 'strength-attack'
    | 'worn'
}
/**
 * Gives a speed mode a value: equal to the Speed (equalsWalk) or a fixed number of feet.
 */
export interface EffSpeed {
  type: 'speed'
  mode: 'walk' | 'fly' | 'swim' | 'climb' | 'burrow'
  feet?: number
  equalsWalk?: boolean
  /**
   * Added 2026-10-18: the Speed is at least this (Boots of Striding and Springing, SRD p.214).
   */
  minimum?: number
  /**
   * Added 2026-10-18 for Haste: 'the target's Speed is doubled' (SRD p.139).
   */
  multiplier?: number
  when?: string
  /**
   * Added 2026-10-19: the part of a when that the app can decide from the character itself, so the effect applies while it holds and not otherwise. armor: wearing Light, Medium or Heavy armor (Defense, SRD p.88). no-armor: not wearing armor (Barbarian Unarmored Defense, p.29; Draconic Resilience, p.67). no-armor-no-shield: neither armor nor a Shield (Monk Unarmored Defense and Unarmored Movement, p.50). no-heavy-armor (Fast Movement, p.30; Roving, p.58). not-incapacitated: without the Incapacitated condition (Aura of Protection, p.55; Danger Sense, p.29). worn, added 2026-10-19 for magic items: the item carrying the effect is worn or held (Armor, +1, 'while wearing this armor', p.210). strength-attack, added 2026-10-22: the attack it is added to uses Strength, decided per attack (Rage Damage, 'When you make an attack using Strength—with either a weapon or an Unarmed Strike', p.28). skill-not-proficient, added 2026-10-26: the check it is added to uses a skill the character lacks proficiency in, so adds no Proficiency Bonus of its own, decided per skill (Jack of All Trades, 'any ability check you make that uses a skill proficiency you lack and that doesn’t otherwise use your Proficiency Bonus', p.32). The when stays for display.
   */
  requires?:
    | 'armor'
    | 'no-armor'
    | 'no-armor-no-shield'
    | 'no-heavy-armor'
    | 'not-incapacitated'
    | 'skill-not-proficient'
    | 'strength-attack'
    | 'worn'
}
/**
 * Grants proficiency. ids are skills, abilities (saves), tool or item ids, armor categories (light, medium, heavy, shields), weapon categories (simple, martial) or weapon ids, or languages.
 */
export interface EffProficiency {
  type: 'proficiency'
  category: 'save' | 'skill' | 'tool' | 'armor' | 'weapon' | 'language'
  /**
   * @minItems 1
   */
  ids: [string, ...string[]]
}
export interface EffExpertise {
  type: 'expertise'
  ids: string[]
}
export interface EffAdvantage {
  type: 'advantage'
  mode: 'advantage' | 'disadvantage'
  /**
   * What an effect changes. ability:<a>, save:<a>|save:all, save:vs-<condition>, death-save, skill:<s>|check:<a>|check:all, attack:<kind>, damage:<kind>, speed:<mode>, ac, hp-max, initiative, spell-dc, spell-attack, passive:<skill>, d20:all (every d20 Test). attack:this and damage:this, added 2026-10-18, mean rolls made with the item that carries the effect ('+1 bonus to attack rolls and damage rolls made with this magic weapon', Weapon, +1, +2, or +3, SRD p.253). proficiency-bonus added 2026-10-18 for the Ioun Stone of Mastery (SRD p.227). death-save added 2026-10-18 for Beacon of Hope and Survivor (SRD p.112, p.49); save:vs-<condition> for Protection from Poison ('saving throws to avoid or end the Poisoned condition', p.157). attunement added 2026-10-27: the number of magic items you can attune to at once (Use Magic Device, 'up to four', p.64).
   */
  on: string
  /**
   * attackers: rolls made against this creature (Prone, Invisible).
   */
  who?: 'self' | 'attackers'
  when?: string
  /**
   * Added 2026-10-19: the part of a when that the app can decide from the character itself, so the effect applies while it holds and not otherwise. armor: wearing Light, Medium or Heavy armor (Defense, SRD p.88). no-armor: not wearing armor (Barbarian Unarmored Defense, p.29; Draconic Resilience, p.67). no-armor-no-shield: neither armor nor a Shield (Monk Unarmored Defense and Unarmored Movement, p.50). no-heavy-armor (Fast Movement, p.30; Roving, p.58). not-incapacitated: without the Incapacitated condition (Aura of Protection, p.55; Danger Sense, p.29). worn, added 2026-10-19 for magic items: the item carrying the effect is worn or held (Armor, +1, 'while wearing this armor', p.210). strength-attack, added 2026-10-22: the attack it is added to uses Strength, decided per attack (Rage Damage, 'When you make an attack using Strength—with either a weapon or an Unarmed Strike', p.28). skill-not-proficient, added 2026-10-26: the check it is added to uses a skill the character lacks proficiency in, so adds no Proficiency Bonus of its own, decided per skill (Jack of All Trades, 'any ability check you make that uses a skill proficiency you lack and that doesn’t otherwise use your Proficiency Bonus', p.32). The when stays for display.
   */
  requires?:
    | 'armor'
    | 'no-armor'
    | 'no-armor-no-shield'
    | 'no-heavy-armor'
    | 'not-incapacitated'
    | 'skill-not-proficient'
    | 'strength-attack'
    | 'worn'
}
export interface EffDefense {
  type: 'defense'
  defense: 'resistance' | 'vulnerability' | 'immunity'
  /**
   * @minItems 1
   */
  damageTypes: [
    (
      | (
          | 'acid'
          | 'bludgeoning'
          | 'cold'
          | 'fire'
          | 'force'
          | 'lightning'
          | 'necrotic'
          | 'piercing'
          | 'poison'
          | 'psychic'
          | 'radiant'
          | 'slashing'
          | 'thunder'
        )
      | 'all'
    ),
    ...(
      | (
          | 'acid'
          | 'bludgeoning'
          | 'cold'
          | 'fire'
          | 'force'
          | 'lightning'
          | 'necrotic'
          | 'piercing'
          | 'poison'
          | 'psychic'
          | 'radiant'
          | 'slashing'
          | 'thunder'
        )
      | 'all'
    )[]
  ]
  when?: string
  /**
   * Added 2026-10-19: the part of a when that the app can decide from the character itself, so the effect applies while it holds and not otherwise. armor: wearing Light, Medium or Heavy armor (Defense, SRD p.88). no-armor: not wearing armor (Barbarian Unarmored Defense, p.29; Draconic Resilience, p.67). no-armor-no-shield: neither armor nor a Shield (Monk Unarmored Defense and Unarmored Movement, p.50). no-heavy-armor (Fast Movement, p.30; Roving, p.58). not-incapacitated: without the Incapacitated condition (Aura of Protection, p.55; Danger Sense, p.29). worn, added 2026-10-19 for magic items: the item carrying the effect is worn or held (Armor, +1, 'while wearing this armor', p.210). strength-attack, added 2026-10-22: the attack it is added to uses Strength, decided per attack (Rage Damage, 'When you make an attack using Strength—with either a weapon or an Unarmed Strike', p.28). skill-not-proficient, added 2026-10-26: the check it is added to uses a skill the character lacks proficiency in, so adds no Proficiency Bonus of its own, decided per skill (Jack of All Trades, 'any ability check you make that uses a skill proficiency you lack and that doesn’t otherwise use your Proficiency Bonus', p.32). The when stays for display.
   */
  requires?:
    | 'armor'
    | 'no-armor'
    | 'no-armor-no-shield'
    | 'no-heavy-armor'
    | 'not-incapacitated'
    | 'skill-not-proficient'
    | 'strength-attack'
    | 'worn'
}
export interface EffConditionImmunity {
  type: 'conditionImmunity'
  /**
   * Items: The 15 conditions (Rules Glossary).
   */
  conditions: (
    | 'blinded'
    | 'charmed'
    | 'deafened'
    | 'exhaustion'
    | 'frightened'
    | 'grappled'
    | 'incapacitated'
    | 'invisible'
    | 'paralyzed'
    | 'petrified'
    | 'poisoned'
    | 'prone'
    | 'restrained'
    | 'stunned'
    | 'unconscious'
  )[]
  /**
   * Added 2026-10-18 for Mindless Rage ('while your Rage is active', SRD p.30) and Aura of Courage.
   */
  when?: string
}
export interface EffSense {
  type: 'sense'
  /**
   * telepathy added 2026-10-18 for the Helm of Telepathy (SRD p.226).
   */
  sense: 'darkvision' | 'blindsight' | 'tremorsense' | 'truesight' | 'telepathy'
  feet: number
  /**
   * Added 2026-10-18: adds feet to a sense already held, or grants it at feet if none (Goggles of Night, SRD p.224).
   */
  extends?: boolean
  /**
   * Added 2026-10-18 for Stonecunning's Tremorsense (SRD p.84).
   */
  when?: string
}
/**
 * A limited use this grants, tracked by the sheet: its maximum and when it comes back.
 */
export interface EffResource {
  type: 'resource'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  name: string
  max: number | Expression
  /**
   * When a limited use comes back. short-rest also means a Long Rest restores it, as every Short Rest benefit is also a Long Rest's. dawn is 'the next dawn' (SRD p.206).
   */
  recharge: 'short-rest' | 'long-rest' | 'dawn' | 'turn' | 'special' | 'never'
  /**
   * Printed partial recovery, e.g. one use on a Short Rest.
   */
  rechargePartial?: string
  /**
   * Added 2026-10-18 for Font of Inspiration: from a class level, the resource comes back on a shorter rest (SRD p.32).
   */
  rechargeFromLevel?: {
    level: number
    /**
     * When a limited use comes back. short-rest also means a Long Rest restores it, as every Short Rest benefit is also a Long Rest's. dawn is 'the next dawn' (SRD p.206).
     */
    recharge: 'short-rest' | 'long-rest' | 'dawn' | 'turn' | 'special' | 'never'
  }
}
export interface EffGrantSpell {
  type: 'grantSpell'
  /**
   * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
   */
  spell: string
  atLevel?: number
  alwaysPrepared?: boolean
  /**
   * Added 2026-10-18: cast 'without expending a spell slot', with no limit (Eldritch Invocations, SRD p.72).
   */
  atWill?: boolean
  ability?: ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') | 'choice'
  /**
   * Added 2026-10-26: the save DC the granting record prints for this spell, in place of the caster's ('cast Web (save DC 13)', Cloak of Arachnida, SRD p.215).
   */
  dc?: number
  /**
   * Added 2026-10-26: the attack bonus the granting record prints for this spell, in place of the caster's ('Scorching Ray with it (+5 to hit)', Circlet of Blasting, SRD p.215).
   */
  attack?: number
  freeCasts?: {
    /**
     * An expression added 2026-10-18 for Forest Gnome: 'a number of times equal to your Proficiency Bonus' (SRD p.85).
     */
    uses: number | Expression
    /**
     * When a limited use comes back. short-rest also means a Long Rest restores it, as every Short Rest benefit is also a Long Rest's. dawn is 'the next dawn' (SRD p.206).
     */
    recharge: 'short-rest' | 'long-rest' | 'dawn' | 'turn' | 'special' | 'never'
    slotLevel?: number
  }
}
/**
 * Raises ability scores. abilities lists those allowed; choose is how many of them to pick (absent: all listed). max is the cap (20 unless printed otherwise). patterns, added 2026-10-18, holds the printed alternatives: a background's 'one by 2 and another by 1, or all three by 1' is [[2,1],[1,1,1]] (SRD p.83), and amount is then the largest single increase.
 */
export interface EffAbilityIncrease {
  type: 'abilityIncrease'
  /**
   * Items: The six abilities (SRD 5.2.1 p.5).
   */
  abilities: ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')[]
  amount: number
  choose?: number
  max?: number
  patterns?: number[][]
}
/**
 * Added 2026-10-18: Extra Attack, 'You can attack twice instead of once whenever you take the Attack action' (SRD p.48). count is the attacks per Attack action; the highest applies, since Extra Attack doesn't stack (SRD p.25). Added 2026-10-27: pactWeapon, only with the pact weapon ('you can attack twice with your pact weapon', Thirsting Blade, p.74), counted apart.
 */
export interface EffAttackCount {
  type: 'attackCount'
  count: number
  pactWeapon?: true
}
/**
 * Added 2026-10-18: Improved Critical, 'score a Critical Hit on a roll of 19 or 20' (SRD p.49). min is the lowest d20 that crits; on names the rolls.
 */
export interface EffCritRange {
  type: 'critRange'
  min: number
  /**
   * What an effect changes. ability:<a>, save:<a>|save:all, save:vs-<condition>, death-save, skill:<s>|check:<a>|check:all, attack:<kind>, damage:<kind>, speed:<mode>, ac, hp-max, initiative, spell-dc, spell-attack, passive:<skill>, d20:all (every d20 Test). attack:this and damage:this, added 2026-10-18, mean rolls made with the item that carries the effect ('+1 bonus to attack rolls and damage rolls made with this magic weapon', Weapon, +1, +2, or +3, SRD p.253). proficiency-bonus added 2026-10-18 for the Ioun Stone of Mastery (SRD p.227). death-save added 2026-10-18 for Beacon of Hope and Survivor (SRD p.112, p.49); save:vs-<condition> for Protection from Poison ('saving throws to avoid or end the Poisoned condition', p.157). attunement added 2026-10-27: the number of magic items you can attune to at once (Use Magic Device, 'up to four', p.64).
   */
  on: string
}
/**
 * Added 2026-10-25 for Martial Arts: 'You can roll 1d6 in place of the normal damage of your Unarmed Strike or Monk weapons' and 'You can use your Dexterity modifier instead of your Strength modifier for the attack and damage rolls of your Unarmed Strikes and Monk weapons' (SRD p.50). attacks names the attacks it reaches: unarmed for the Unarmed Strike, and weapon ids. ability is one the player may use in place of the attack's own, for both rolls; die is a die they may roll in place of its damage, as dice or a class column holding them (Martial Arts'). The sheet takes whichever is better, as it does Finesse's choice. wieldingOnly: it holds only while every weapon wielded is one of attacks ('while you are unarmed or wielding only Monk weapons'). id names the set of weapons, so a DM can rule another weapon into it, saved on that item for that character (a roster item's countsAs), and name is what one of them is called (Monk weapon). Added 2026-10-26 for Pact of the Blade (p.74): bond, where the player bonds one weapon to it rather than the rules naming them, lists what may be bonded (melee: a melee weapon; magic: a magic weapon of any kind). The bonded weapon is saved as that item's countsAs, one at a time, and the character is proficient with it; attacks may then be empty. Added 2026-10-26 for Martial Arts' other benefits (p.50): bonusAction names the attacks that may also be made as a Bonus Action while the option holds ('You can make an Unarmed Strike as a Bonus Action'); grappleDc, that ability may also replace Strength in the Unarmed Strike's Grapple and Shove save DC (derivations.json unarmed-strike-save-dc).
 */
export interface EffAttackOption {
  type: 'attackOption'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id?: string
  name?: string
  /**
   * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  attacks: string[]
  /**
   * @minItems 1
   */
  bond?: ['melee' | 'magic', ...('melee' | 'magic')[]]
  /**
   * @minItems 1
   *
   * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  bonusAction?: [string, ...string[]]
  grappleDc?: boolean
  /**
   * The six abilities (SRD 5.2.1 p.5).
   */
  ability?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  die?: string | ExprClassColumn
  wieldingOnly?: boolean
  when?: string
  /**
   * Added 2026-10-19: the part of a when that the app can decide from the character itself, so the effect applies while it holds and not otherwise. armor: wearing Light, Medium or Heavy armor (Defense, SRD p.88). no-armor: not wearing armor (Barbarian Unarmored Defense, p.29; Draconic Resilience, p.67). no-armor-no-shield: neither armor nor a Shield (Monk Unarmored Defense and Unarmored Movement, p.50). no-heavy-armor (Fast Movement, p.30; Roving, p.58). not-incapacitated: without the Incapacitated condition (Aura of Protection, p.55; Danger Sense, p.29). worn, added 2026-10-19 for magic items: the item carrying the effect is worn or held (Armor, +1, 'while wearing this armor', p.210). strength-attack, added 2026-10-22: the attack it is added to uses Strength, decided per attack (Rage Damage, 'When you make an attack using Strength—with either a weapon or an Unarmed Strike', p.28). skill-not-proficient, added 2026-10-26: the check it is added to uses a skill the character lacks proficiency in, so adds no Proficiency Bonus of its own, decided per skill (Jack of All Trades, 'any ability check you make that uses a skill proficiency you lack and that doesn’t otherwise use your Proficiency Bonus', p.32). The when stays for display.
   */
  requires?:
    | 'armor'
    | 'no-armor'
    | 'no-armor-no-shield'
    | 'no-heavy-armor'
    | 'not-incapacitated'
    | 'skill-not-proficient'
    | 'strength-attack'
    | 'worn'
}
/**
 * Added 2026-10-18: a feature's own save DC, '8 plus your Wisdom modifier and Proficiency Bonus' (Monk's Focus, SRD p.50; Cunning Strike, p.62). id names it so the feature's text can be shown beside the number. Added 2026-10-26: ruling, where the feature prints no DC and the user ruled which it uses, names that ambiguity, so the sheet can say so beside the number (Open Hand Technique, p.52; classes.json ambiguity open-hand-technique-save-dc).
 */
export interface EffSaveDc {
  type: 'saveDc'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  /**
   * The six abilities (SRD 5.2.1 p.5).
   */
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  /**
   * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
   */
  ruling?: string
}
/**
 * Added 2026-10-18: an ability score becomes value while this applies, and does nothing if the score is already that high ('Your Constitution is 19 while you wear this amulet', Amulet of Health, SRD p.209; Thunderous Greatclub, p.249).
 */
export interface EffSetScore {
  type: 'setScore'
  /**
   * The six abilities (SRD 5.2.1 p.5).
   */
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  value: number
}
/**
 * Anything the vocabulary cannot say. Shown for the table, never applied.
 */
export interface EffText {
  type: 'text'
  summary: string
}
/**
 * The user's choice on an open reading, as dcc-rules records it: a house ruling with a dated sign-off.
 */
export interface Ruling {
  reading: string
  confidence: 'house'
  signedOff: string
  note: string
}
/**
 * One record per class: its core traits, multiclassing terms, spellcasting, its features table (with every column, so a resource maximum or a die is read from the table, never typed in code), its features by level, its option lists (Eldritch Invocations, Metamagic), its spell list, and its subclasses. The SRD prints one subclass per class; the books' others go in data/books/classes.json in this same shape, as subclass records whose classId names the SRD class.
 */
export interface ClassesData {
  meta: Meta
  classes: Class[]
  /**
   * Subclasses recorded apart from their class: the books tier's, whose class lives in the srd tier. In the srd tier, subclasses sit inside their class and this stays empty.
   */
  subclasses?: Subclass[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
export interface Spellcasting {
  /**
   * The six abilities (SRD 5.2.1 p.5).
   */
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  /**
   * How the class counts toward the Multiclass Spellcaster table (pact: not at all; Pact Magic is apart).
   */
  progression: 'full' | 'half' | 'third' | 'pact'
  /**
   * How a half or third caster's levels round in the multiclass caster level, as printed.
   */
  multiclassRounding?: 'down' | 'up'
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  preparedColumn?: string
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  cantripsColumn?: string
  /**
   * The table columns for slot levels 1 to 9, in order; for pact, the Spell Slots and Slot Level columns.
   *
   * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  slotColumns?: string[]
  /**
   * When the class may change its prepared list.
   */
  changesPrepared?: 'long-rest' | 'level-up' | 'special'
  ritual?: boolean
  focus: string
  /**
   * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
   */
  text: string
}
/**
 * What must be true to take a feat or an option. The machine-checkable parts are fields; text is the printed wording, always present.
 */
export interface Prerequisite {
  text: string
  /**
   * Character level, or the class level where classLevelOf names the class.
   */
  level?: number
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  classLevelOf?: string
  /**
   * Minimum scores; abilitiesMode says whether one or all must be met.
   */
  abilities?: {
    /**
     * The six abilities (SRD 5.2.1 p.5).
     */
    ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
    min: number
  }[]
  abilitiesMode?: 'all' | 'any'
  /**
   * Refs or ids of features, options or proficiencies needed (an invocation requiring another; Spellcasting or Pact Magic).
   */
  requires?: string[]
}
/**
 * Each condition's rule text and what the sheet applies of it, in the effect vocabulary. Exhaustion carries its cumulative levels. Other states the Rules Glossary defines (Bloodied, Concentration, Heroic Inspiration) are rules in core.json, not conditions.
 */
export interface ConditionsData {
  meta: Meta
  /**
   * @minItems 15
   * @maxItems 15
   */
  conditions: [
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    } & {
      /**
       * The 15 conditions (Rules Glossary).
       */
      id:
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      name: string
      /**
       * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
       */
      text: string
      effects: Effect[]
      /**
       * Conditions this one also imposes (Paralyzed includes Incapacitated).
       *
       * Items: The 15 conditions (Rules Glossary).
       */
      includes?: (
        | 'blinded'
        | 'charmed'
        | 'deafened'
        | 'exhaustion'
        | 'frightened'
        | 'grappled'
        | 'incapacitated'
        | 'invisible'
        | 'paralyzed'
        | 'petrified'
        | 'poisoned'
        | 'prone'
        | 'restrained'
        | 'stunned'
        | 'unconscious'
      )[]
      /**
       * Exhaustion only: the cumulative levels. perLevel effects multiply by the level; deathAt is the level that kills.
       */
      levels?: {
        max: number
        deathAt?: number
        perLevel: Effect[]
      }
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    }
  ]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * The rules every other file leans on: the six abilities, the Character Advancement table (XP and proficiency bonus by level), languages, sizes, and rule records for d20 Tests, Advantage, proficiency, resting, death saves, hit points, and the like. Formulas live in derivations.json.
 */
export interface CoreData {
  meta: Meta
  /**
   * @minItems 6
   * @maxItems 6
   */
  abilities: [
    {
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      id: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      name: string
      measures: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      id: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      name: string
      measures: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      id: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      name: string
      measures: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      id: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      name: string
      measures: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      id: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      name: string
      measures: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      id: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      name: string
      measures: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    }
  ]
  /**
   * The Ability Scores and Modifiers table as printed, kept beside the formula in derivations.json so a test can hold one to the other.
   */
  abilityModifiers?: {
    min: number
    max: number
    modifier: number
  }[]
  /**
   * The Character Advancement table: XP needed and the proficiency bonus at each character level.
   *
   * @minItems 20
   * @maxItems 20
   */
  advancement: [
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    },
    {
      level: number
      xp: number
      proficiencyBonus: number
    }
  ]
  advancementSource?: Source
  languages: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    kind: 'standard' | 'rare'
    origin?: string
    /**
     * Added 2026-10-26: the dialects the language includes, by the names printed (Primordial's Aquan, Auran, Ignan and Terran, SRD p.20's footnote), so a dialect named elsewhere, as D&D Beyond names Aquan, can be read as its language.
     *
     * @minItems 1
     */
    dialects?: [string, ...string[]]
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  sizes: {
    id: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'
    name: string
    space: string
    /**
     * Carrying capacity per Strength point, in pounds, where the Rules Glossary prints one per size.
     */
    carryingMultiplier?: number
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  /**
   * Added 2026-10-19 for the guided build: the three ways to generate ability scores, as printed (SRD p.21), so the build reads them rather than typing them in code. byClass is the Standard Array by Class table, the suggested assignment the build preassigns.
   */
  abilityScoreMethods?: {
    standardArray: {
      /**
       * @minItems 6
       * @maxItems 6
       */
      scores: [number, number, number, number, number, number]
      byClass: {
        [k: string]: {
          str: number
          dex: number
          con: number
          int: number
          wis: number
          cha: number
        }
      }
    }
    pointBuy: {
      budget: number
      costs: {
        score: number
        cost: number
      }[]
    }
    random: {
      /**
       * Dice notation as printed: 1d8, 2d6, 1d4+1, 10. No spaces.
       */
      dice: string
      keep: number
      times: number
    }
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }
  /**
   * Added 2026-10-19 for the guided build: the languages every character knows, and how many more it chooses and from which kind (SRD p.20, Choose Languages).
   */
  startingLanguages?: {
    /**
     * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    known: string[]
    choose: number
    kind: 'standard' | 'rare'
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }
  /**
   * Added 2026-10-19 for the play sheet: the numbers the rule records print in their text, as fields the app applies (Advantage's d20s, Resistance and Vulnerability, temporary hit points, death saves and massive damage, Short and Long Rests; Attunement's limit and coins' weight, added the same day for the inventory). Each names its rule record and page.
   */
  playRules?: {
    advantage: {
      dice: number
      keep: 'higher'
      cancel: boolean
      rule?: string
    }
    damage: {
      resistanceDivisor: number
      vulnerabilityMultiplier: number
      roundDown: boolean
      tempFirst: boolean
      tempStack: boolean
      massiveDamage?: boolean
      rule?: string
    }
    deathSaves: {
      dc: number
      toStabilize: number
      toDie: number
      naturalOneFailures: number
      naturalTwentyHp: number
      damageFailures: number
      criticalFailures: number
      rule?: string
    }
    shortRest: {
      hitDieMinimum: number
      rule?: string
    }
    concentration: {
      minimumDc: number
      damageDivisor: number
      roundDown: boolean
      maximumDc: number
      endsOnAnother: boolean
      rule?: string
    }
    attunement: {
      maxItems: number
      oneCopy: boolean
      rule?: string
    }
    carrying: {
      coinsPerPound: number
      rule?: string
    }
    longRest: {
      exhaustionReduction: number
      allHitDice: boolean
      tempHpLost: boolean
      rule?: string
    }
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }
  rules: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * The formulas the sheet computes (d-amp-d spec §5.1): ability modifier, saves, skills, passive Perception, initiative, unarmored AC, spell save DC and attack, hit points per level, carrying capacity, the Concentration DC, and the like. Each is a display string plus a compute tree, with dependsOn as the recompute edges. A formula that needs the character's choices (which armour is worn, which class casts) names its inputs in dependsOn and leaves the choosing to the app.
 */
export interface DerivationsData {
  meta: Meta
  derivations: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    /**
     * The formula as a reader sees it: 8 + your spellcasting ability modifier + your Proficiency Bonus.
     */
    display: string
    compute?: Expression
    /**
     * Required when compute is absent: why a tree cannot hold it, and what the app does instead.
     */
    computeNote?: string
    dependsOn: string[]
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * The Equipment chapter as catalogues. Mounts, vehicles, lifestyle, services and crafting are rules (or later files), not items a sheet carries. Cost is stored in its printed coin.
 */
export interface EquipmentData {
  meta: Meta
  /**
   * @minItems 5
   * @maxItems 5
   */
  coins: [
    {
      id: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
      name: string
      valueInGp: number
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      id: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
      name: string
      valueInGp: number
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      id: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
      name: string
      valueInGp: number
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      id: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
      name: string
      valueInGp: number
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      id: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
      name: string
      valueInGp: number
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    }
  ]
  weaponProperties: Definition[]
  masteryProperties: Definition[]
  weapons: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    category: 'simple' | 'martial'
    kind: 'melee' | 'ranged'
    damage: {
      /**
       * Dice notation as printed: 1d8, 2d6, 1d4+1, 10. No spaces.
       */
      dice: string
      /**
       * The 13 damage types (SRD 5.2.1 p.16-17).
       */
      type:
        | 'acid'
        | 'bludgeoning'
        | 'cold'
        | 'fire'
        | 'force'
        | 'lightning'
        | 'necrotic'
        | 'piercing'
        | 'poison'
        | 'psychic'
        | 'radiant'
        | 'slashing'
        | 'thunder'
    }
    properties: {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id: string
      range?: {
        normal: number
        long: number
      }
      /**
       * Dice notation as printed: 1d8, 2d6, 1d4+1, 10. No spaces.
       */
      versatile?: string
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      ammunition?: string
    }[]
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    mastery: string
    /**
     * Pounds; 0 where printed as —; 'varies' where printed Varies.
     */
    weight: number | 'varies'
    /**
     * A printed cost, or 'varies' where the table prints Varies (Ammunition, the foci, Gaming Set, Musical Instrument); 'varies' added 2026-10-18.
     */
    cost:
      | {
          amount: number
          coin: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
        }
      | 'varies'
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  armor: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    category: 'light' | 'medium' | 'heavy' | 'shield'
    /**
     * Armor: base plus Dexterity (full, capped at max 2, or none). Shield: bonus.
     */
    ac: {
      base?: number
      dex?: 'full' | 'max-2' | 'none'
      bonus?: number
      text?: string
    }
    /**
     * The Strength score required, if printed.
     */
    strength?: number
    stealthDisadvantage: boolean
    /**
     * Pounds; 0 where printed as —; 'varies' where printed Varies.
     */
    weight: number | 'varies'
    /**
     * A printed cost, or 'varies' where the table prints Varies (Ammunition, the foci, Gaming Set, Musical Instrument); 'varies' added 2026-10-18.
     */
    cost:
      | {
          amount: number
          coin: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
        }
      | 'varies'
    don?: string
    doff?: string
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  tools: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    kind: 'artisan' | 'gaming-set' | 'musical-instrument' | 'other'
    /**
     * The six abilities (SRD 5.2.1 p.5).
     */
    ability?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
    /**
     * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
     */
    text: string
    /**
     * Gaming sets and instruments, which come in kinds.
     */
    variants?: {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      id: string
      name: string
      /**
       * A printed cost, or 'varies' where the table prints Varies (Ammunition, the foci, Gaming Set, Musical Instrument); 'varies' added 2026-10-18.
       */
      cost?:
        | {
            amount: number
            coin: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
          }
        | 'varies'
      /**
       * Pounds; 0 where printed as —; 'varies' where printed Varies.
       */
      weight?: number | 'varies'
    }[]
    /**
     * A printed cost, or 'varies' where the table prints Varies (Ammunition, the foci, Gaming Set, Musical Instrument); 'varies' added 2026-10-18.
     */
    cost:
      | {
          amount: number
          coin: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
        }
      | 'varies'
    /**
     * Pounds; 0 where printed as —; 'varies' where printed Varies.
     */
    weight: number | 'varies'
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  gear: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    /**
     * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
     */
    text: string
    /**
     * A pack's contents.
     */
    contents?: {
      /**
       * A reference to a record in this or another data file, written <file>:<id>, e.g. spells:fireball, feats:alert, classes:fighter. The cross-file check resolves every one.
       */
      item: string
      quantity: number
    }[]
    ammunitionFor?: string
    focus?: 'arcane' | 'druidic' | 'holy'
    /**
     * A printed cost, or 'varies' where the table prints Varies (Ammunition, the foci, Gaming Set, Musical Instrument); 'varies' added 2026-10-18.
     */
    cost:
      | {
          amount: number
          coin: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
        }
      | 'varies'
    /**
     * Pounds; 0 where printed as —; 'varies' where printed Varies.
     */
    weight: number | 'varies'
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
export interface Definition {
  /**
   * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
   */
  id: string
  name: string
  /**
   * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
   */
  text: string
  source: Source
  /**
   * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
   */
  confidence: 'printed' | 'derived' | 'inferred' | 'house'
  note?: string
}
/**
 * Each feat's category, prerequisite, repeatability, text and effects. An Ability Score Increase a feat grants is an abilityIncrease effect.
 */
export interface FeatsData {
  meta: Meta
  feats: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    category: 'origin' | 'general' | 'fighting-style' | 'epic-boon'
    prerequisite?: Prerequisite
    repeatable: {
      allowed: boolean
      text?: string
    }
    /**
     * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
     */
    text: string
    effects: Effect[]
    /**
     * What using it costs on a turn.
     */
    action?:
      'action' | 'bonus-action' | 'reaction' | 'free' | 'none' | 'minute' | 'hour' | 'special'
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * Each magic item's category, rarity, attunement, text, and what the sheet applies while it is worn or wielded (and attuned, where attunement is required). An item printed as a family (Armor, +1, +2, or +3; Potion of Healing's grades) is one record per variant, each naming its family, so a character holds one exact item.
 */
export interface MagicItemsData {
  meta: Meta
  items: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    family?: string
    category:
      'armor' | 'potion' | 'ring' | 'rod' | 'scroll' | 'staff' | 'wand' | 'weapon' | 'wondrous-item'
    /**
     * The printed base: Any Simple or Martial Weapon, Plate Armor, a ref where it names one item.
     */
    baseItem?: string
    rarity: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary' | 'artifact' | 'varies'
    attunement: {
      required: boolean
      /**
       * by a Wizard, by a Spellcaster, and the like.
       */
      by?: string
    }
    /**
     * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
     */
    text: string
    effects: Effect[]
    charges?: {
      /**
       * Dice where printed so (Nine Lives Stealer: 1d8 + 1 charges, SRD p.233); added 2026-10-18.
       */
      max: number | string
      regain?: string
      /**
       * When a limited use comes back. short-rest also means a Long Rest restores it, as every Short Rest benefit is also a Long Rest's. dawn is 'the next dawn' (SRD p.206).
       */
      recharge?: 'short-rest' | 'long-rest' | 'dawn' | 'turn' | 'special' | 'never'
      text: string
    }
    consumable?: boolean
    cursed?: boolean
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * Creature stat blocks as far as a character sheet needs them. Today: the Beasts of the SRD's Animals (pp.344-364), with what Wild Shape's Known Forms choose by (SRD p.42: a Beast stat block, its Challenge Rating, whether it has a Fly Speed). The rest of each stat block (abilities, traits, actions) arrives with companions (M2).
 */
export interface MonstersData {
  meta: Meta
  monsters: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    /**
     * For a swarm, the swarm's own size (Large Swarm of Tiny Beasts: large).
     */
    size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'
    /**
     * The creature type of the stat block's type line. Only Beasts so far.
     */
    creatureType: 'beast'
    /**
     * The type line's parenthesis, as printed: Dinosaur.
     */
    subtype?: string
    /**
     * A swarm's type line (Large Swarm of Tiny Beasts): the size of the creatures it is made of.
     */
    swarm?: {
      of: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'
    }
    /**
     * As printed: Unaligned.
     */
    alignment: string
    /**
     * Challenge Rating as a number: 1/8 is 0.125, 1/4 is 0.25, 1/2 is 0.5.
     */
    cr: number
    speed: {
      walk: number
      burrow?: number
      climb?: number
      fly?: number
      swim?: number
      /**
       * A speed printed as one of two modes at the GM's choice (Swarm of Insects: 'Climb or Fly 20 ft. (GM's choice)', p.361).
       */
      either?: {
        /**
         * @minItems 2
         */
        modes: [
          'burrow' | 'climb' | 'fly' | 'swim',
          'burrow' | 'climb' | 'fly' | 'swim',
          ...('burrow' | 'climb' | 'fly' | 'swim')[]
        ]
        feet: number
        printed: string
      }
    }
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * Each skill with its ability and what it covers. A character's proficiency state (none, proficient, Expertise) is the save's, never this file's.
 */
export interface SkillsData {
  meta: Meta
  /**
   * @minItems 18
   * @maxItems 18
   */
  skills: [
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    },
    {
      /**
       * The 18 skills (SRD 5.2.1 p.6, Skills table). Their abilities live in core.json.
       */
      id:
        | 'acrobatics'
        | 'animal-handling'
        | 'arcana'
        | 'athletics'
        | 'deception'
        | 'history'
        | 'insight'
        | 'intimidation'
        | 'investigation'
        | 'medicine'
        | 'nature'
        | 'perception'
        | 'performance'
        | 'persuasion'
        | 'religion'
        | 'sleight-of-hand'
        | 'stealth'
        | 'survival'
      name: string
      /**
       * The six abilities (SRD 5.2.1 p.5).
       */
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      /**
       * The Skills table's example uses.
       */
      examples: string
      source: Source
      /**
       * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
       */
      confidence: 'printed' | 'derived' | 'inferred' | 'house'
      note?: string
    }
  ]
  rules: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * Each species' creature type, size, Speed and traits. A choice the species makes (a Dragonborn's ancestry, an Elf's lineage, a Gnome's lineage, a Goliath's giant ancestry, a Tiefling's legacy) is a lineages list; the chosen one's traits apply.
 */
export interface SpeciesData {
  meta: Meta
  species: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    creatureType: string
    /**
     * More than one where the player chooses.
     *
     * @minItems 1
     */
    sizes: [
      'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan',
      ...('tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan')[]
    ]
    sizeText?: string
    speed: number
    traits: Feature[]
    /**
     * The choice a trait offers, and each option. traitId names the trait that offers it.
     */
    lineages?: {
      /**
       * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
       */
      traitId: string
      label: string
      options: {
        /**
         * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
         */
        id: string
        name: string
        text?: string
        effects: Effect[]
        /**
         * What using it costs on a turn.
         */
        action?:
          'action' | 'bonus-action' | 'reaction' | 'free' | 'none' | 'minute' | 'hour' | 'special'
        /**
         * Added 2026-10-20: the reasoning for a value that isn't verbatim, such as a derived action.
         */
        note?: string
        /**
         * The 13 damage types (SRD 5.2.1 p.16-17).
         */
        damageType?:
          | 'acid'
          | 'bludgeoning'
          | 'cold'
          | 'fire'
          | 'force'
          | 'lightning'
          | 'necrotic'
          | 'piercing'
          | 'poison'
          | 'psychic'
          | 'radiant'
          | 'slashing'
          | 'thunder'
      }[]
    }
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
/**
 * The Spells chapter's rules (gaining and preparing spells, slots, casting time, range, components, duration, Concentration, rituals, combining effects) as rule records, and the Multiclass Spellcaster table. A single class's own slots are its features table's, in classes.json.
 */
export interface SpellcastingData {
  meta: Meta
  rules: Rule[]
  multiclassSlots: {
    /**
     * @minItems 20
     * @maxItems 20
     */
    rows: [
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      },
      {
        casterLevel: number
        /**
         * Slots of levels 1 to 9.
         *
         * @minItems 9
         * @maxItems 9
         */
        slots: [number, number, number, number, number, number, number, number, number]
      }
    ]
    source: Source
  }
  ambiguities?: Ambiguity[]
}
/**
 * Each spell's printed header (level, school, classes, casting time, range, components, duration) as fields, its description as text, and the structure the sheet acts on: Concentration, ritual, the attack or save it makes, its damage or healing dice, and what a higher slot or a cantrip's level adds. The text is the authority; the structure is what the app reads.
 */
export interface SpellsData {
  meta: Meta
  spells: {
    /**
     * A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    id: string
    name: string
    /**
     * 0 is a cantrip.
     */
    level: number
    school:
      | 'abjuration'
      | 'conjuration'
      | 'divination'
      | 'enchantment'
      | 'evocation'
      | 'illusion'
      | 'necromancy'
      | 'transmutation'
    /**
     * As the spell's header lists them.
     *
     * @minItems 1
     *
     * Items: A record id. kebab-case, permanent: saved characters reference it. A replaced record keeps its id with supersededBy.
     */
    classes: [string, ...string[]]
    castingTime: {
      text: string
      amount?: number
      unit: 'action' | 'bonus-action' | 'reaction' | 'minute' | 'hour'
      ritual?: boolean
      reactionTrigger?: string
    }
    range: {
      text: string
      kind: 'self' | 'touch' | 'feet' | 'miles' | 'sight' | 'unlimited' | 'special'
      amount?: number
      /**
       * Self (15-foot Cone) and the like.
       */
      area?: string
    }
    components: {
      v: boolean
      s: boolean
      m: boolean
      material?: string
      /**
       * A material component's printed cost.
       */
      costGp?: number
      consumed?: boolean
    }
    duration: {
      text: string
      concentration: boolean
    }
    /**
     * The rule's words, as markdown. In data/srd/ this is the SRD 5.2.1's own text, which CC-BY-4.0 permits with the attribution (d-amp-d spec §8, D1). In data/books/ it is a short restatement, never the book's prose: meta.textPolicy says which, and the validator holds books/ to restated.
     */
    text: string
    /**
     * The 'Using a Higher-Level Spell Slot' paragraph.
     */
    higherLevels?: string
    /**
     * The 'Cantrip Upgrade' paragraph.
     */
    cantripUpgrade?: string
    /**
     * A spell attack roll, if the spell makes one.
     */
    attack?: 'melee' | 'ranged'
    /**
     * The six abilities (SRD 5.2.1 p.5).
     */
    save?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
    /**
     * type is absent where the caster chooses it, from damageChoice (Chromatic Orb, SRD p.115); changed 2026-10-18.
     */
    damage?: {
      /**
       * Dice notation as printed: 1d8, 2d6, 1d4+1, 10. No spaces.
       */
      dice: string
      /**
       * The 13 damage types (SRD 5.2.1 p.16-17).
       */
      type?:
        | 'acid'
        | 'bludgeoning'
        | 'cold'
        | 'fire'
        | 'force'
        | 'lightning'
        | 'necrotic'
        | 'piercing'
        | 'poison'
        | 'psychic'
        | 'radiant'
        | 'slashing'
        | 'thunder'
      note?: string
    }[]
    /**
     * Types the caster chooses from (Chromatic Orb).
     *
     * Items: The 13 damage types (SRD 5.2.1 p.16-17).
     */
    damageChoice?: (
      | 'acid'
      | 'bludgeoning'
      | 'cold'
      | 'fire'
      | 'force'
      | 'lightning'
      | 'necrotic'
      | 'piercing'
      | 'poison'
      | 'psychic'
      | 'radiant'
      | 'slashing'
      | 'thunder'
    )[]
    /**
     * Healing as printed: 2d8 plus your spellcasting ability modifier.
     */
    healing?: string
    /**
     * What a higher slot or character level adds, where it is a die count: perSlot for leveled spells, atLevels for cantrips.
     */
    scaling?: {
      /**
       * Dice notation as printed: 1d8, 2d6, 1d4+1, 10. No spaces.
       */
      perSlot?: string
      atLevels?: {
        level: number
        /**
         * Dice notation as printed: 1d8, 2d6, 1d4+1, 10. No spaces.
         */
        dice: string
      }[]
    }
    /**
     * What the spell does to its caster's sheet while active, where the vocabulary can say it (Mage Armor's AC formula, Shield's +5 AC, Bless's 1d4). Used by the quick bar's toggles.
     */
    effects?: Effect[]
    source: Source
    /**
     * printed: stated directly in the source. derived: computed from printed text. inferred: our reading of ambiguous or unextractable text, needs confirmation. house: our own ruling filling a gap, with the user's dated sign-off. Anything other than printed carries a note; the schemas enforce it.
     */
    confidence: 'printed' | 'derived' | 'inferred' | 'house'
    note?: string
  }[]
  rules?: Rule[]
  ambiguities?: Ambiguity[]
}
