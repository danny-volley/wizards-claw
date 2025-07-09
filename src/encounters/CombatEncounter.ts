import { BaseEncounter, EncounterState, EncounterResult } from './BaseEncounter';
import { GameScene } from '../scenes/GameScene';
import { EnemyData, EnemyDatabase } from '../data/EnemyData';
import { SpellRecipe } from '../systems/SpellDatabase';

export enum CombatPhase {
  PLAYER_TURN = 'player_turn',
  ENEMY_TURN = 'enemy_turn',
  WAITING = 'waiting'
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
    // Apply defense to reduce incoming damage
    let damage = this.enemyData.damage;
    let actualDamage = Math.max(0, damage - this.playerDefense);
    
    // Apply damage to player
    this.playerCurrentHealth = Math.max(0, this.playerCurrentHealth - actualDamage);
    
    if (this.playerDefense > 0) {
      const defenseUsed = Math.min(this.playerDefense, damage);
      console.log(`${this.enemyData.displayName} attacks for ${damage} damage! Defense blocks ${defenseUsed} damage. ${actualDamage} damage taken.`);
      this.playerDefense = Math.max(0, this.playerDefense - damage); // Use up defense
    } else {
      console.log(`${this.enemyData.displayName} attacks for ${actualDamage} damage!`);
    }
    
    // Update player health bar
    this.scene.setPlayerHealth(this.playerCurrentHealth, this.playerMaxHealth);
    
    // Show enemy attack effect
    this.scene.showEnemyAttackEffect(actualDamage);
    this.scene.showDamageEffect(actualDamage, false); // false = damage to player
  }
  
  // Called by GameScene when player casts a spell
  public handlePlayerSpell(spell: SpellRecipe): void {
    console.log(`Combat phase: ${this.combatPhase}, handling spell: ${spell.name}`);
    if (this.combatPhase !== CombatPhase.PLAYER_TURN) {
      console.log(`Not player's turn - ignoring spell cast`);
      return; // Not player's turn
    }
    
    // Apply spell effect
    const damage = this.calculateSpellDamage(spell);
    const healing = this.calculateSpellHealing(spell);
    const defense = this.calculateSpellDefense(spell);
    
    if (damage > 0) {
      this.enemyCurrentHealth = Math.max(0, this.enemyCurrentHealth - damage);
      this.scene.setEnemyHealth(this.enemyCurrentHealth, this.enemyData.maxHealth);
      this.scene.showPlayerAttackEffect(damage);
      this.scene.showDamageEffect(damage, true); // true = damage to enemy
      console.log(`${spell.name} deals ${damage} damage to ${this.enemyData.displayName}!`);
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
      console.log(`${spell.name} heals ${healing} health!`);
    }
    
    if (defense > 0) {
      this.playerDefense += defense;
      this.scene.showDefenseEffect(defense);
      console.log(`${spell.name} provides ${defense} defense for next attack!`);
    }
    
    // End player turn
    this.combatPhase = CombatPhase.ENEMY_TURN;
    this.scene.setPlayerTurn(false);
    this.turnTimer = 0;
    this.lastUpdateTime = 0; // Reset timing for enemy turn
    console.log('Combat phase: Moving to ENEMY_TURN');
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