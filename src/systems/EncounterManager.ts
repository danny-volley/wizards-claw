import { GameScene } from '../scenes/GameScene';
import { BaseEncounter, EncounterState, EncounterResult } from '../encounters/BaseEncounter';
import { CombatEncounter } from '../encounters/CombatEncounter';
import { PuzzleEncounter } from '../encounters/PuzzleEncounter';
import { PuzzleType } from '../data/PuzzleData';

export enum EncounterType {
  COMBAT = 'combat',
  TRAP = 'trap',
  PUZZLE = 'puzzle',
  PREY_HUNT = 'prey_hunt'
}

export interface EncounterConfig {
  type: EncounterType;
  enemyId?: string; // For combat encounters
  difficultyLevel?: number; // For puzzle encounters
  puzzleType?: PuzzleType; // For puzzle encounters
  data?: any; // Additional encounter-specific data
}

export class EncounterManager {
  private scene: GameScene;
  private currentEncounter: BaseEncounter | null;
  private encounterQueue: EncounterConfig[];
  private completedEncounters: string[];
  private isActive: boolean;
  
  constructor(scene: GameScene) {
    this.scene = scene;
    this.currentEncounter = null;
    this.encounterQueue = [];
    this.completedEncounters = [];
    this.isActive = false;
  }
  
  public initialize(): void {
    console.log('EncounterManager initialized');
    
    // Set up initial encounter queue (for testing)
    this.encounterQueue = [
      { type: EncounterType.COMBAT, enemyId: 'lizard' },
      { type: EncounterType.PUZZLE, difficultyLevel: 1, puzzleType: PuzzleType.DAMAGE },
      { type: EncounterType.COMBAT, enemyId: 'fox' },
      { type: EncounterType.PUZZLE, difficultyLevel: 2, puzzleType: PuzzleType.BLOCKING },
      { type: EncounterType.COMBAT, enemyId: 'crane' }
    ];
  }
  
  public startNextEncounter(): void {
    if (this.currentEncounter) {
      console.warn('Cannot start new encounter while one is active');
      return;
    }
    
    if (this.encounterQueue.length === 0) {
      console.log('No more encounters in queue');
      return;
    }
    
    const config = this.encounterQueue.shift()!;
    this.currentEncounter = this.createEncounter(config);
    this.isActive = true;
    
    console.log(`Starting ${config.type} encounter`);
    this.currentEncounter.start();
  }
  
  public update(time: number, delta: number): void {
    if (!this.currentEncounter || !this.isActive) {
      return;
    }
    
    this.currentEncounter.updateEncounter(time, delta);
    
    // Check if encounter moved to resolution phase
    if (this.currentEncounter.getState() === EncounterState.RESOLUTION) {
      console.log('EncounterManager: Encounter moved to RESOLUTION, handling...');
      this.handleEncounterResolution();
    }
  }
  
  private createEncounter(config: EncounterConfig): BaseEncounter {
    switch (config.type) {
      case EncounterType.COMBAT:
        if (!config.enemyId) {
          throw new Error('Combat encounter requires enemyId');
        }
        return new CombatEncounter(this.scene, config.enemyId);
      
      case EncounterType.TRAP:
        // TODO: Implement TrapEncounter
        throw new Error('Trap encounters not yet implemented');
      
      case EncounterType.PUZZLE:
        return new PuzzleEncounter(this.scene, config.difficultyLevel || 1, config.puzzleType);
      
      case EncounterType.PREY_HUNT:
        // TODO: Implement PreyHuntEncounter
        throw new Error('Prey hunt encounters not yet implemented');
      
      default:
        throw new Error(`Unknown encounter type: ${config.type}`);
    }
  }
  
  private handleEncounterResolution(): void {
    if (!this.currentEncounter) return;
    
    const result = this.currentEncounter.getResult();
    console.log(`Encounter resolved with result: ${result}`);
    
    // Show result UI
    this.scene.showEncounterResult(result);
    
    // Mark encounter as completed
    this.completedEncounters.push(this.currentEncounter.constructor.name);
    
    // Complete the encounter but don't start next one yet
    this.currentEncounter.complete();
    
    // Handle full healing after encounter
    if (result === EncounterResult.VICTORY) {
      this.scene.fullHealPlayer();
    }
    
    // Don't clear currentEncounter and isActive yet - wait for player to close result window
    // This prevents the next encounter from starting immediately
  }
  
  public handlePlayerSpell(castResult: any): void {
    if (this.currentEncounter && this.currentEncounter instanceof CombatEncounter) {
      this.currentEncounter.handlePlayerSpell(castResult);
    } else if (this.currentEncounter && this.currentEncounter instanceof PuzzleEncounter) {
      this.currentEncounter.handlePlayerSpell(castResult);
    }
  }

  public getEnemyActionHint(): string | null {
    if (this.currentEncounter && this.currentEncounter instanceof CombatEncounter) {
      return this.currentEncounter.getEnemyActionHint();
    }
    return null;
  }

  public getEnemyActionText(): string | null {
    if (this.currentEncounter && this.currentEncounter instanceof CombatEncounter) {
      return this.currentEncounter.getEnemyActionText();
    }
    return null;
  }
  
  public onEncounterResultClosed(): void {
    // Called when player closes the result window
    console.log('EncounterManager: onEncounterResultClosed called');
    
    // Check if this was a map encounter before clearing
    const wasMapEncounter = this.isMapEncounter;
    const encounterResult = this.currentEncounter?.getResult();
    
    // Clear the current encounter now that the result window is closed
    this.currentEncounter = null;
    this.isActive = false;
    
    // Handle map encounter completion
    if (wasMapEncounter && encounterResult === EncounterResult.VICTORY) {
      console.log('Map encounter completed successfully');
      this.scene.onMapEncounterComplete();
      this.isMapEncounter = false;
      return;
    }
    
    if (this.encounterQueue.length > 0) {
      // Start next encounter
      console.log('Starting next encounter...');
      this.startNextEncounter();
    } else {
      // No more encounters - return to normal game state
      console.log('All encounters completed');
      this.scene.returnToNormalState();
    }
  }
  
  public startSingleEncounter(enemyId: string): void {
    console.log(`EncounterManager: Starting single encounter with ${enemyId}`);
    
    if (this.currentEncounter) {
      console.warn('Cannot start new encounter while one is active');
      return;
    }
    
    // Clear any existing queue for map encounters
    this.encounterQueue = [];
    
    // Create and start the encounter
    this.currentEncounter = new CombatEncounter(this.scene, enemyId);
    this.isActive = true;
    this.isMapEncounter = true;
    
    console.log(`Starting map encounter with ${enemyId}`);
    this.currentEncounter.start();
  }
  
  public startSinglePuzzleEncounter(difficultyLevel: number = 1, puzzleType?: PuzzleType): void {
    console.log(`EncounterManager: Starting single puzzle encounter (difficulty: ${difficultyLevel})`);
    
    if (this.currentEncounter) {
      console.warn('Cannot start new encounter while one is active');
      return;
    }
    
    // Clear any existing queue for map encounters
    this.encounterQueue = [];
    
    // Create and start the puzzle encounter
    this.currentEncounter = new PuzzleEncounter(this.scene, difficultyLevel, puzzleType);
    this.isActive = true;
    this.isMapEncounter = true;
    
    console.log(`Starting map puzzle encounter`);
    this.currentEncounter.start();
  }
  
  private isMapEncounter: boolean = false;
  
  public restartCurrentEncounter(): void {
    if (!this.currentEncounter) return;
    
    // Clean up current encounter
    this.currentEncounter.cleanup();
    
    // Create new encounter of same type
    const currentType = this.getCurrentEncounterType();
    if (currentType) {
      this.currentEncounter = this.createEncounter(currentType);
      this.currentEncounter.start();
    }
  }
  
  private getCurrentEncounterType(): EncounterConfig | null {
    if (this.currentEncounter instanceof CombatEncounter) {
      // Need to store enemy ID to recreate combat encounter
      // For now, restart with lizard
      return { type: EncounterType.COMBAT, enemyId: 'lizard' };
    }
    return null;
  }
  
  // Getters
  public getCurrentEncounter(): BaseEncounter | null {
    return this.currentEncounter;
  }
  
  public isEncounterActive(): boolean {
    return this.isActive;
  }
  
  public getCompletedEncounters(): string[] {
    return [...this.completedEncounters];
  }
  
  public getRemainingEncounters(): number {
    return this.encounterQueue.length;
  }
}