import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';

export enum EncounterState {
  SETUP = 'setup',
  ACTION = 'action', 
  RESOLUTION = 'resolution',
  COMPLETE = 'complete'
}

export enum EncounterResult {
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  ONGOING = 'ongoing'
}

export abstract class BaseEncounter {
  protected scene: GameScene;
  protected state: EncounterState;
  protected result: EncounterResult;
  
  constructor(scene: GameScene) {
    this.scene = scene;
    this.state = EncounterState.SETUP;
    this.result = EncounterResult.ONGOING;
  }
  
  // Abstract methods that each encounter type must implement
  abstract setup(): void;
  abstract update(time: number, delta: number): void;
  abstract checkVictoryCondition(): boolean;
  abstract checkDefeatCondition(): boolean;
  abstract cleanup(): void;
  
  // Common encounter flow methods
  public start(): void {
    this.setup();
    this.state = EncounterState.ACTION;
  }
  
  public getState(): EncounterState {
    return this.state;
  }
  
  public getResult(): EncounterResult {
    return this.result;
  }
  
  public updateEncounter(time: number, delta: number): void {
    if (this.state === EncounterState.ACTION) {
      this.update(time, delta);
      
      // Check victory/defeat conditions
      if (this.checkVictoryCondition()) {
        this.result = EncounterResult.VICTORY;
        this.state = EncounterState.RESOLUTION;
      } else if (this.checkDefeatCondition()) {
        this.result = EncounterResult.DEFEAT;
        this.state = EncounterState.RESOLUTION;
      }
    }
  }
  
  public complete(): void {
    this.state = EncounterState.COMPLETE;
    this.cleanup();
  }
  
  // Helper method to transition to resolution phase
  protected transitionToResolution(): void {
    this.state = EncounterState.RESOLUTION;
  }
}