import { BaseEncounter, EncounterState, EncounterResult } from './BaseEncounter';
import { GameScene } from '../scenes/GameScene';
import { EnemyData, EnemyDatabase } from '../data/EnemyData';
import { SpellRecipe } from '../systems/SpellDatabase';

export enum CombatPhase {
  PLAYER_TURN = 'player_turn',
  ENEMY_TURN = 'enemy_turn',
  WAITING = 'waiting'
}

export enum EnemyAction {
  ATTACK = 'attack',
  HEAVY_ATTACK = 'heavy_attack',
  BLOCK = 'block',
  PARRY = 'parry'
}

export interface EnemyActionPreferences {
  attack: number;      // Base preference weight
  heavyAttack: number; // Base preference weight
  block: number;       // Base preference weight
  parry: number;       // Base preference weight
}

export interface EnemyActionCooldowns {
  heavyAttack: number; // 2 turn cooldown
  block: number;       // 1 turn cooldown
  parry: number;       // 2 turn cooldown
}

export class CombatEncounter extends BaseEncounter {
  private enemyData: EnemyData;
  private enemyCurrentHealth: number;
  private playerCurrentHealth: number;
  private playerMaxHealth: number;
  private playerDefense: number = 0; // Defense reduces next attack damage
  private combatPhase: CombatPhase;
  private turnTimer: number;
  private lastUpdateTime: number = 0;
  private readonly TURN_DELAY = 1000; // 1 second delay between turns
  
  // Enemy action system
  private nextEnemyAction: EnemyAction | null = null;
  private enemyActionCooldowns: EnemyActionCooldowns = {
    heavyAttack: 0,
    block: 0,
    parry: 0
  };
  private enemyIsBlocking: boolean = false;
  private enemyIsParrying: boolean = false;
  private wasPlayerAttackedThisTurn: boolean = false;
  
  constructor(scene: GameScene, enemyId: string) {
    super(scene);
    
    const enemy = EnemyDatabase.getEnemy(enemyId);
    if (!enemy) {
      throw new Error(`Enemy not found: ${enemyId}`);
    }
    
    this.enemyData = enemy;
    this.enemyCurrentHealth = enemy.maxHealth;
    this.playerMaxHealth = 100; // TODO: Get from player data
    this.playerCurrentHealth = this.playerMaxHealth;
    this.combatPhase = CombatPhase.PLAYER_TURN;
    this.turnTimer = 0;
  }
  
  setup(): void {
    console.log(`Combat encounter started against ${this.enemyData.displayName}`);
    
    // Set up enemy visual
    this.scene.setEnemyData(this.enemyData);
    
    // Set up health bars
    this.scene.setEnemyHealth(this.enemyCurrentHealth, this.enemyData.maxHealth);
    this.scene.setPlayerHealth(this.playerCurrentHealth, this.playerMaxHealth);
    
    // Set up combat UI
    this.scene.showCombatUI(true);
    
    // Start with player turn
    this.combatPhase = CombatPhase.PLAYER_TURN;
    this.scene.setPlayerTurn(true);
  }
  
  update(time: number, delta: number): void {
    // Use actual time for more reliable timing
    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = time;
    }
    
    const actualDelta = time - this.lastUpdateTime;
    this.lastUpdateTime = time;
    
    switch (this.combatPhase) {
      case CombatPhase.PLAYER_TURN:
        this.updatePlayerTurn(time, actualDelta);
        break;
      case CombatPhase.ENEMY_TURN:
        this.updateEnemyTurn(time, actualDelta);
        break;
      case CombatPhase.WAITING:
        this.updateWaitingPhase(time, actualDelta);
        break;
    }
  }
  
  private updatePlayerTurn(time: number, delta: number): void {
    // Player turn is handled by GameScene spell casting
    // This will be called when player casts a spell
  }
  
  private updateEnemyTurn(time: number, delta: number): void {
    this.turnTimer += delta;
    
    if (this.turnTimer >= this.TURN_DELAY) {
      this.executeEnemyAttack();
      this.turnTimer = 0;
      this.combatPhase = CombatPhase.WAITING;
      console.log('Combat phase: Enemy attacked, moving to WAITING');
    }
  }
  
  private updateWaitingPhase(time: number, delta: number): void {
    this.turnTimer += delta;
    
    if (this.turnTimer >= this.TURN_DELAY) {
      this.turnTimer = 0;
      this.combatPhase = CombatPhase.PLAYER_TURN;
      this.scene.setPlayerTurn(true);
      console.log('Combat phase: Back to PLAYER_TURN');
    }
  }
  
  private executeEnemyAttack(): void {
    // Execute the planned action
    if (!this.nextEnemyAction) {
      this.nextEnemyAction = this.decideNextEnemyAction();
    }
    
    this.executeEnemyAction(this.nextEnemyAction);
    
    // Update cooldowns
    this.updateEnemyCooldowns();
    
    // Reset states
    this.enemyIsBlocking = false;
    this.enemyIsParrying = false;
    this.wasPlayerAttackedThisTurn = false;
    
    // Clear the planned action so a new one is decided next turn
    this.nextEnemyAction = null;
  }

  private executeEnemyAction(action: EnemyAction): void {
    switch (action) {
      case EnemyAction.ATTACK:
        this.executeRegularAttack();
        break;
      case EnemyAction.HEAVY_ATTACK:
        this.executeHeavyAttack();
        break;
      case EnemyAction.BLOCK:
        this.executeBlock();
        break;
      case EnemyAction.PARRY:
        this.executeParry();
        break;
    }
  }

  private executeRegularAttack(): void {
    const damage = this.enemyData.damage;
    const actualDamage = this.calculateDamageToPlayer(damage);
    
    this.playerCurrentHealth = Math.max(0, this.playerCurrentHealth - actualDamage);
    
    console.log(`${this.enemyData.displayName} attacks for ${actualDamage} damage!`);
    
    this.scene.setPlayerHealth(this.playerCurrentHealth, this.playerMaxHealth);
    this.scene.showEnemyAttackEffect(actualDamage);
    this.scene.showDamageEffect(actualDamage, false);
  }

  private executeHeavyAttack(): void {
    const damage = Math.round(this.enemyData.damage * 1.5); // 50% more damage
    const actualDamage = this.calculateDamageToPlayer(damage);
    
    this.playerCurrentHealth = Math.max(0, this.playerCurrentHealth - actualDamage);
    this.enemyActionCooldowns.heavyAttack = 2; // 2 turn cooldown
    
    console.log(`${this.enemyData.displayName} unleashes a heavy attack for ${actualDamage} damage!`);
    
    this.scene.setPlayerHealth(this.playerCurrentHealth, this.playerMaxHealth);
    this.scene.showEnemyAttackEffect(actualDamage);
    this.scene.showDamageEffect(actualDamage, false);
  }

  private executeBlock(): void {
    this.enemyIsBlocking = true;
    this.enemyActionCooldowns.block = 1; // 1 turn cooldown
    
    console.log(`${this.enemyData.displayName} raises their guard!`);
  }

  private executeParry(): void {
    this.enemyIsParrying = true;
    this.enemyActionCooldowns.parry = 2; // 2 turn cooldown
    
    console.log(`${this.enemyData.displayName} prepares to counter-attack!`);
  }

  private calculateDamageToPlayer(baseDamage: number): number {
    // Apply player defense
    let actualDamage = Math.max(0, baseDamage - this.playerDefense);
    
    // Use up defense
    if (this.playerDefense > 0) {
      const defenseUsed = Math.min(this.playerDefense, baseDamage);
      console.log(`Defense blocks ${defenseUsed} damage.`);
      this.playerDefense = Math.max(0, this.playerDefense - baseDamage);
    }
    
    return actualDamage;
  }

  private updateEnemyCooldowns(): void {
    this.enemyActionCooldowns.heavyAttack = Math.max(0, this.enemyActionCooldowns.heavyAttack - 1);
    this.enemyActionCooldowns.block = Math.max(0, this.enemyActionCooldowns.block - 1);
    this.enemyActionCooldowns.parry = Math.max(0, this.enemyActionCooldowns.parry - 1);
  }

  public getEnemyActionText(): string {
    if (!this.nextEnemyAction) {
      return 'Opponent is thinking...';
    }
    
    switch (this.nextEnemyAction) {
      case EnemyAction.ATTACK:
        return 'Opponent attacked';
      case EnemyAction.HEAVY_ATTACK:
        return 'Opponent unleashed a heavy attack';
      case EnemyAction.BLOCK:
        return 'Opponent blocked';
      case EnemyAction.PARRY:
        return 'Opponent prepared to counter';
      default:
        return 'Opponent acted';
    }
  }
  
  // Called by GameScene when player casts a spell
  public handlePlayerSpell(castResult: any): void {
    console.log(`Combat phase: ${this.combatPhase}, handling spell: ${castResult.spell.name}`);
    if (this.combatPhase !== CombatPhase.PLAYER_TURN) {
      console.log(`Not player's turn - ignoring spell cast`);
      return; // Not player's turn
    }
    
    // Use timing-modified spell effects from SpellEffectsSystem
    const damage = castResult.damage || 0;
    const healing = castResult.healing || 0;
    const defense = castResult.defense || 0;
    
    if (damage > 0) {
      this.enemyCurrentHealth = Math.max(0, this.enemyCurrentHealth - damage);
      this.scene.setEnemyHealth(this.enemyCurrentHealth, this.enemyData.maxHealth);
      this.scene.showPlayerAttackEffect(damage);
      this.scene.showDamageEffect(damage, true); // true = damage to enemy
      console.log(`${castResult.spell.name} deals ${damage} damage to ${this.enemyData.displayName}!`);
      console.log(`Enemy health: ${this.enemyCurrentHealth}/${this.enemyData.maxHealth}`);
      
      // Check victory immediately after damage
      if (this.enemyCurrentHealth <= 0) {
        console.log('Enemy defeated! Should trigger victory...');
      }
    }
    
    if (healing > 0) {
      this.playerCurrentHealth = Math.min(this.playerMaxHealth, this.playerCurrentHealth + healing);
      this.scene.setPlayerHealth(this.playerCurrentHealth, this.playerMaxHealth);
      this.scene.showHealingEffect(healing);
      console.log(`${castResult.spell.name} heals ${healing} health!`);
    }
    
    if (defense > 0) {
      this.playerDefense += defense;
      this.scene.showDefenseEffect(defense);
      console.log(`${castResult.spell.name} provides ${defense} defense for next attack!`);
    }
    
    // End player turn
    this.combatPhase = CombatPhase.ENEMY_TURN;
    this.scene.setPlayerTurn(false);
    this.turnTimer = 0;
    this.lastUpdateTime = 0; // Reset timing for enemy turn
    console.log('Combat phase: Moving to ENEMY_TURN');
  }
  
  // Enemy Action System Methods
  private getEnemyActionPreferences(): EnemyActionPreferences {
    // Different enemies have different behavior patterns
    const basePreferences: EnemyActionPreferences = {
      attack: 40,
      heavyAttack: 20,
      block: 20,
      parry: 20
    };

    // Modify based on enemy type
    switch (this.enemyData.id) {
      case 'lizard':
        // Swamp Lizard: More aggressive
        return { attack: 50, heavyAttack: 30, block: 10, parry: 10 };
      case 'fox':
        // Cunning Fox: Balanced with more parrying
        return { attack: 35, heavyAttack: 15, block: 25, parry: 25 };
      case 'crane':
        // Sky Crane: More defensive when injured
        return { attack: 30, heavyAttack: 25, block: 25, parry: 20 };
      default:
        return basePreferences;
    }
  }

  private decideNextEnemyAction(): EnemyAction {
    const preferences = this.getEnemyActionPreferences();
    const healthPercent = this.enemyCurrentHealth / this.enemyData.maxHealth;
    
    // Calculate available actions (filter out those on cooldown)
    const availableActions: { action: EnemyAction; weight: number }[] = [];
    
    // Attack is always available
    availableActions.push({ action: EnemyAction.ATTACK, weight: preferences.attack });
    
    // Heavy attack (if not on cooldown)
    if (this.enemyActionCooldowns.heavyAttack <= 0) {
      availableActions.push({ action: EnemyAction.HEAVY_ATTACK, weight: preferences.heavyAttack });
    }
    
    // Block (if not on cooldown)
    if (this.enemyActionCooldowns.block <= 0) {
      // Increase block preference when low on health
      const blockWeight = preferences.block + (healthPercent < 0.3 ? 30 : 0);
      availableActions.push({ action: EnemyAction.BLOCK, weight: blockWeight });
    }
    
    // Parry (if not on cooldown)
    if (this.enemyActionCooldowns.parry <= 0) {
      // Increase parry preference when low on health
      const parryWeight = preferences.parry + (healthPercent < 0.3 ? 25 : 0);
      availableActions.push({ action: EnemyAction.PARRY, weight: parryWeight });
    }
    
    // Weighted random selection
    const totalWeight = availableActions.reduce((sum, action) => sum + action.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const actionOption of availableActions) {
      random -= actionOption.weight;
      if (random <= 0) {
        return actionOption.action;
      }
    }
    
    // Fallback to attack
    return EnemyAction.ATTACK;
  }

  public getEnemyActionHint(): string {
    if (!this.nextEnemyAction) {
      this.nextEnemyAction = this.decideNextEnemyAction();
    }
    
    // Check certainty based on enemy difficulty
    const certaintyRate = this.getEnemyCertaintyRate();
    const isCertain = Math.random() < certaintyRate;
    
    if (!isCertain) {
      // Enemy is unreadable - return uncertain hint
      return this.getUncertainHint();
    }
    
    // Generate hints that are sometimes accurate, sometimes vague, sometimes wrong
    const hintAccuracy = Math.random();
    
    if (hintAccuracy < 0.15) {
      // 15% chance: No hint
      return this.getRandomVagueHint();
    } else if (hintAccuracy < 0.3) {
      // 15% chance: Wrong hint
      return this.getWrongActionHint();
    } else if (hintAccuracy < 0.7) {
      // 40% chance: Vague but correct hint
      return this.getVagueActionHint(this.nextEnemyAction);
    } else {
      // 30% chance: Accurate hint
      return this.getAccurateActionHint(this.nextEnemyAction);
    }
  }

  private getEnemyCertaintyRate(): number {
    // Different enemies have different certainty rates based on difficulty
    switch (this.enemyData.difficulty) {
      case 'easy':
        return 0.8; // 80% certainty - simple enemies are predictable
      case 'medium':
        return 0.6; // 60% certainty - moderate unpredictability
      case 'hard':
        return 0.4; // 40% certainty - hard enemies are harder to read
      default:
        return 0.6; // Default to medium
    }
  }

  private getUncertainHint(): string {
    const uncertainHints = [
      'Opponent is unreadable',
      'Not sure what they\'re up to',
      'Opponent\'s intentions are unclear',
      'Can\'t tell what they\'re planning',
      'Opponent is being unpredictable',
      'Their next move is a mystery',
      'Opponent is hard to read',
      'Something feels off about their stance'
    ];
    return uncertainHints[Math.floor(Math.random() * uncertainHints.length)];
  }

  private getAccurateActionHint(action: EnemyAction): string {
    switch (action) {
      case EnemyAction.ATTACK:
        return 'Opponent is preparing to attack';
      case EnemyAction.HEAVY_ATTACK:
        return 'Opponent is winding up for a heavy attack';
      case EnemyAction.BLOCK:
        return 'Opponent is getting ready to block';
      case EnemyAction.PARRY:
        return 'Opponent is preparing to parry';
    }
  }

  private getVagueActionHint(action: EnemyAction): string {
    switch (action) {
      case EnemyAction.ATTACK:
        return 'Opponent looks aggressive';
      case EnemyAction.HEAVY_ATTACK:
        return 'Opponent seems to be charging up';
      case EnemyAction.BLOCK:
        return 'Opponent looks defensive';
      case EnemyAction.PARRY:
        return 'Opponent is watching you carefully';
    }
  }

  private getWrongActionHint(): string {
    const wrongHints = [
      'Opponent might try to flee',
      'Opponent seems confused',
      'Opponent is looking around',
      'Opponent appears distracted',
      'Opponent is hesitating'
    ];
    return wrongHints[Math.floor(Math.random() * wrongHints.length)];
  }

  private getRandomVagueHint(): string {
    const vagueHints = [
      'Opponent is planning something',
      'Something is about to happen',
      'Opponent is focused',
      'The air feels tense',
      'Opponent is ready to move'
    ];
    return vagueHints[Math.floor(Math.random() * vagueHints.length)];
  }

  private calculateSpellDamage(spell: SpellRecipe): number {
    // Fire-based spells deal damage
    const fireCount = spell.materials.filter(m => m === 'fire').length;
    const rockCount = spell.materials.filter(m => m === 'rock').length;
    return (fireCount * 25) + (rockCount * 10); // 25 damage per fire, 10 damage per rock
  }
  
  private calculateSpellHealing(spell: SpellRecipe): number {
    // Leaf-based spells heal
    const leafCount = spell.materials.filter(m => m === 'leaf').length;
    return leafCount * 20; // 20 healing per leaf material
  }
  
  private calculateSpellDefense(spell: SpellRecipe): number {
    // Rock-based spells provide defense
    const rockCount = spell.materials.filter(m => m === 'rock').length;
    return rockCount * 15; // 15 defense per rock material
  }
  
  checkVictoryCondition(): boolean {
    const victory = this.enemyCurrentHealth <= 0;
    if (victory) {
      console.log('checkVictoryCondition: Victory condition met!');
    }
    return victory;
  }
  
  checkDefeatCondition(): boolean {
    return this.playerCurrentHealth <= 0;
  }
  
  cleanup(): void {
    console.log(`Combat encounter ended with result: ${this.result}`);
    this.scene.showCombatUI(false);
  }
  
  // Getters for current state
  public getEnemyHealth(): { current: number; max: number } {
    return { current: this.enemyCurrentHealth, max: this.enemyData.maxHealth };
  }
  
  public getPlayerHealth(): { current: number; max: number } {
    return { current: this.playerCurrentHealth, max: this.playerMaxHealth };
  }
  
  public getCurrentPhase(): CombatPhase {
    return this.combatPhase;
  }
}