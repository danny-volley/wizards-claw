import { BaseEncounter, EncounterState, EncounterResult } from './BaseEncounter';
import { GameScene } from '../scenes/GameScene';
import { PuzzleConfig, PuzzleType, PuzzleGenerator } from '../data/PuzzleData';

export class PuzzleEncounter extends BaseEncounter {
  private puzzleConfig: PuzzleConfig;
  private currentProgress: number = 0;
  private timeRemaining: number;
  private lastUpdateTime: number = 0;
  private isCompleted: boolean = false;
  
  constructor(scene: GameScene, difficultyLevel: number = 1, forceType?: PuzzleType) {
    super(scene);
    
    this.puzzleConfig = PuzzleGenerator.generatePuzzle(difficultyLevel, forceType);
    this.timeRemaining = this.puzzleConfig.timeLimit;
    
    console.log(`Generated puzzle: ${this.puzzleConfig.hazard.displayName}`);
    console.log(`Target: ${this.puzzleConfig.target}, Time: ${this.puzzleConfig.timeLimit}s`);
  }
  
  setup(): void {
    console.log(`Puzzle encounter started: ${this.puzzleConfig.hazard.displayName}`);
    
    // Set up hazard visual (reuse enemy display system)
    const hazardEnemyData = {
      id: this.puzzleConfig.hazard.id,
      name: this.puzzleConfig.hazard.id,
      displayName: this.puzzleConfig.hazard.displayName,
      description: this.puzzleConfig.hazard.description,
      maxHealth: this.puzzleConfig.target,
      damage: 0,
      assetKey: this.puzzleConfig.hazard.assetKey,
      scale: 0.4,
      difficulty: 'easy' as const,
      encounterTypes: ['puzzle']
    };
    
    this.scene.setEnemyData(hazardEnemyData);
    
    // Set up progress tracking using health bar system
    this.scene.setEnemyHealth(this.puzzleConfig.target - this.currentProgress, this.puzzleConfig.target);
    
    // Hide player health for puzzles or set to full
    this.scene.setPlayerHealth(100, 100);
    
    // Set up puzzle UI
    this.scene.showCombatUI(true);
    this.scene.setPlayerTurn(true);
    
    // Set up timer display
    this.scene.setPuzzleTimer(this.timeRemaining);
    
    // Set puzzle goal text (where enemy hint normally goes)
    this.setPuzzleGoalText();
  }
  
  update(time: number, delta: number): void {
    if (this.isCompleted) return;
    
    // Use actual time for reliable timing
    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = time;
    }
    
    const actualDelta = time - this.lastUpdateTime;
    this.lastUpdateTime = time;
    
    // Update timer
    this.timeRemaining -= actualDelta / 1000; // Convert to seconds
    this.scene.setPuzzleTimer(Math.max(0, this.timeRemaining));
    
    // Update progress display
    this.updateProgressDisplay();
  }
  
  private updateProgressDisplay(): void {
    // Use enemy health bar to show progress
    const remaining = Math.max(0, this.puzzleConfig.target - this.currentProgress);
    this.scene.setEnemyHealth(remaining, this.puzzleConfig.target);
  }
  
  private setPuzzleGoalText(): void {
    const goalText = this.getPuzzleGoalText();
    this.scene.setPuzzleGoal(goalText);
  }
  
  private getPuzzleGoalText(): string {
    const remaining = this.puzzleConfig.target - this.currentProgress;
    const timeLeft = Math.ceil(this.timeRemaining);
    
    switch (this.puzzleConfig.hazard.type) {
      case PuzzleType.DAMAGE:
        return `Deal ${remaining} damage in ${timeLeft}s`;
      case PuzzleType.BLOCKING:
        return `Block ${remaining} damage in ${timeLeft}s`;
      default:
        return `Complete puzzle in ${timeLeft}s`;
    }
  }
  
  public handlePlayerSpell(castResult: any): void {
    if (this.isCompleted) return;
    
    console.log(`Puzzle handling spell: ${castResult.spell.name}`);
    
    // Apply spell effects based on puzzle type
    switch (this.puzzleConfig.hazard.type) {
      case PuzzleType.DAMAGE:
        this.handleDamageSpell(castResult);
        break;
      case PuzzleType.BLOCKING:
        this.handleBlockingSpell(castResult);
        break;
    }
    
    // Update progress display
    this.updateProgressDisplay();
    this.setPuzzleGoalText();
    
    // Show spell effects
    this.showSpellEffects(castResult);
  }
  
  private handleDamageSpell(castResult: any): void {
    const damage = castResult.damage || 0;
    
    if (damage > 0) {
      this.currentProgress += damage;
      console.log(`Damage applied: ${damage}, Progress: ${this.currentProgress}/${this.puzzleConfig.target}`);
      
      // Show damage effect
      this.scene.showPlayerAttackEffect(damage);
      this.scene.showDamageEffect(damage, true);
    }
  }
  
  private handleBlockingSpell(castResult: any): void {
    const defense = castResult.defense || 0;
    
    if (defense > 0) {
      this.currentProgress += defense;
      console.log(`Blocking applied: ${defense}, Progress: ${this.currentProgress}/${this.puzzleConfig.target}`);
      
      // Show defense effect
      this.scene.showDefenseEffect(defense);
    }
  }
  
  private showSpellEffects(castResult: any): void {
    // Show healing effect if applicable (can be used for utility)
    const healing = castResult.healing || 0;
    if (healing > 0) {
      this.scene.showHealingEffect(healing);
    }
  }
  
  checkVictoryCondition(): boolean {
    const victory = this.currentProgress >= this.puzzleConfig.target;
    if (victory && !this.isCompleted) {
      console.log('Puzzle completed successfully!');
      this.isCompleted = true;
    }
    return victory;
  }
  
  checkDefeatCondition(): boolean {
    const defeat = this.timeRemaining <= 0 && !this.checkVictoryCondition();
    if (defeat && !this.isCompleted) {
      console.log('Puzzle failed - time ran out!');
      this.isCompleted = true;
    }
    return defeat;
  }
  
  cleanup(): void {
    console.log(`Puzzle encounter ended: ${this.puzzleConfig.hazard.displayName}`);
    console.log(`Final progress: ${this.currentProgress}/${this.puzzleConfig.target}`);
    console.log(`Time remaining: ${this.timeRemaining.toFixed(1)}s`);
    
    // Hide puzzle UI
    this.scene.showCombatUI(false);
    this.scene.clearPuzzleTimer();
    this.scene.clearPuzzleGoal();
  }
  
  // Getters for puzzle state
  public getPuzzleProgress(): { current: number; target: number; percentage: number } {
    return {
      current: this.currentProgress,
      target: this.puzzleConfig.target,
      percentage: Math.min(100, (this.currentProgress / this.puzzleConfig.target) * 100)
    };
  }
  
  public getTimeRemaining(): number {
    return Math.max(0, this.timeRemaining);
  }
  
  public getPuzzleConfig(): PuzzleConfig {
    return this.puzzleConfig;
  }
  
  public getPuzzleType(): PuzzleType {
    return this.puzzleConfig.hazard.type;
  }
  
  public getHazardName(): string {
    return this.puzzleConfig.hazard.displayName;
  }
}