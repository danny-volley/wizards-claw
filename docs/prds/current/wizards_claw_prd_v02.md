
# Product Requirements Document (PRD)

## Product Title: Wizard's Claw

---

## 1. Overview
**Wizard's Claw** is a narrative-driven, action-adventure RPG for PC (with future TV release goals) that uses crane-game mechanics as a one-button control system. Players guide a wizard badger named Yuvor through a mystical animal world, selecting magical materials and casting spells through timing-based interactions. The game aims to replicate the emotional highs and unpredictability of arcade claw machines while offering strategic depth and RPG progression.

---

## 2. Goals & Objectives
- Deliver a unique one-button action-RPG mechanic that balances control with unpredictability.
- Create a vibrant, narrative-rich fantasy world populated entirely by anthropomorphic animals.
- Provide accessible gameplay with optional timing and visual assistance.
- Offer a 30–60 minute linear campaign with a post-game roguelike mode.
- Evoke emotional tension through timed selection mechanics that blend skill and luck.
- Ensure game accessibility through simplified controls and visual/audio support.

---

## 3. Target Audience
- **Demographic:** Young adults and adults, mid-core gamers
- **Player Types:** Fans of timing-based mechanics, narrative adventure, unique control schemes
- **Accessibility Focus:** One-button input, colorblind UI modes, timing assist options
- **Tone:** Similar to a young adult novel — generally light and optimistic with occasional serious themes

---

## 4. Platforms
- Primary: PC (prototype)
- Secondary: Smart TVs, consoles (future goal)

---

## 5. Core Gameplay Loops
### 1. Exploration (Map Navigation)
- Player selects direction at branching nodes.
- Each path shows encounter type and materials likely to be found.
- Materials are collected automatically during travel.
- Player reaches encounter node and transitions to encounter screen.

### 2. Encounter Phase
#### A. Material Selection
- One-button claw mechanic:
  - Claw swings back and forth horizontally at the top of the bag.
  - Pressing the button lowers the claw and attempts to grab a material.
  - The claw returns the grabbed item (may miss or grab wrong material).
- Repeat until required material slots are filled.
- Bag displayed as a side cross-section.

#### B. Spell Selection
- Shows spells that can be created from collected materials.
- One-button vertical selector scrolls through valid spell list.
- Player presses button to cast spell.
- Spells include critical, standard, and low zones (timing-based effects).
- Combo zone: risky timing window that allows multiple spells at once.
- Player can return materials to bag and refresh inventory at cost.

#### C. Opponent Turn
- Enemy performs action: attack, defend, cast spell, activate hazard.
- Hazards: passive damage if not disabled in set number of turns.
- Prey enemies: may escape instead of fighting.

### 3. Encounter Results
- Win screen: rewards, currency, encounter summary.
- Lose screen: return to last checkpoint (Campfire).
- Character regains HP fully after each encounter.
- Then, return to map for next route selection.

---

## 6. Key Features
- **One-Button Input:** All gameplay uses timing-based one-button presses.
- **Crane Game Selection:** Both material gathering and spell selection simulate crane tension.
- **Spell Crafting:** Combines 2 or 3 materials (e.g., Fire + Leaf = Smoke Cloud).
- **Multiple Encounter Types:** Combat, traps, puzzles, prey hunts.
- **Map Exploration:** Branching paths, visible encounter types, material previews.
- **Progression Systems:** RPG-style growth; permanent character upgrades.
- **Unlockable Roguelike Mode:** Procedural challenge after story completion.

---

## 7. Materials & Spells
### Base Materials
- **Fire**: Offensive (damage)
- **Leaf**: Healing & buffs
- **Rock**: Defense & modifiers
- Special materials act as spell modifiers (e.g., poison, stun)

### Spell Recipes
#### Single Material
- Fire = Ember (damage)
- Leaf = Vigor (attack buff)
- Rock = Shard (defense + damage)

#### Two Material Spells
- Fire + Fire = Strong Ember
- Leaf + Leaf = Strong Vigor
- Rock + Rock = Strong Shard
- Fire + Leaf = Smoke Cloud (damage + disrupt)
- Leaf + Rock = Healing Stone (heal)
- Fire + Rock = Molten Shard (damage + debuff)

#### Three Material Spells (unlocked later)
- AAA, AAB, ABB, ABC, etc. — stronger and more complex effects
- Spell strength scales with material size and uniqueness

---

## 8. Starting State & Progression
### Starting State
- 2 Material slots for spells
- Access to 3 base materials (Fire, Leaf, Rock)
- Only base spells available:
  - Fire, Fire+Fire
  - Leaf, Leaf+Leaf
  - Rock, Rock+Rock
- Small amount of HP (more than opponents)
- Fully restore HP after every encounter
- Access to spell shop early in game

### Progression
- **Permanent Upgrades:**
  - Health increases
  - Bag size (more materials stored)
  - Material potency
  - Spell unlocks (new recipes become available)
  - Gain 3rd material slot later in story

- **Shops (Merchants):**
  - Appear every few nodes
  - Limited inventory with refresh option
  - Items: spell scrolls, potion ingredients, gear

- **Checkpoints (Campfires):**
  - Save progress, restore health
  - Narrative interludes with other characters

---

## 9. UI/UX
- **Three-Window Layout:**
  - Encounter screen (character, enemy, actions)
  - Material bag (side-view, animated)
  - Spell list (vertical, dynamic)

- **Visual Style:**
  - Bold lines, stylized animals, expressive visuals
  - Natural shapes and textures (tree rings, wind swirls)

- **Accessibility Options:**
  - Colorblind-safe palettes & icons
  - Timing Assist mode (slows claw swing, enlarges zones)
  - Audio cues for critical timings

---

## 10. World & Character
- **World:** Ancient, mystical wilderness. No humans. Magic discovered by some animals.
- **Society:** Early spiritual cultures; different beliefs and conflicts between species.
- **Protagonist:** Yuvor, a brave, playful badger wizard
  - Descendant of American badgers
  - Believes in a badger deity of courage and legacy
  - Travels to Grand Mound to train at the Badger Monastery
  - Stout, expressive, upright with robe and pouch

---

## 11. Accessibility Features
- One-button control for all mechanics
- Timing Assist toggle to ease swing and selection
- High-contrast UI with optional icon sets
- Clear visual/auditory feedback cues

---

## 12. Metrics for Success
- Story mode completion rate of 50–70%
- Player feedback indicates tension, excitement, and skill expression
- Accessibility modes used without decreasing satisfaction
- Engagement in post-game roguelike content

---

## 13. Future Expansion (Post-MVP)
- Procedural roguelike mode with randomized map + enemies
- Additional material types (e.g., Water, Wind, Spirit)
- Visual customizations (robes, claws, hats)
- Branching story arcs or moral choice nodes
- Console and Smart TV support

---

## 14. Open Design Questions (Next Phase)
1. What unique spell effects enhance the emotional payoff of claw timing?
2. Should visual customization impact gameplay stats?
3. Procedural rules for roguelike: new biomes or shuffled core map?
4. Should the story include branching based on encounter performance?
5. How should difficulty scale: skill expression or stat scaling?

---

## 15. Next Steps
- Prototype crane mechanic: material selection and spellcasting
- Implement early encounter system
- Design 2–3 spells per material pair as MVP set
- Build basic map UI and path selection logic
- Develop UI mockups with accessibility options
- Conduct initial playtesting for tension, clarity, timing feel
