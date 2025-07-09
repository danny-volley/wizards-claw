import { CampfireSceneData } from '../scenes/CampfireScene';
import { openingSceneDialogue, sceneMetadata as openingMetadata } from '../scenes/campfire-story/wiz_campfire_01';
import { secondCampfireDialogue, sceneMetadata as secondMetadata } from '../scenes/campfire-story/wiz_campfire_02';
import { lizardCampfireDialogue, sceneMetadata as lizardMetadata } from '../scenes/campfire-story/wiz_campfire_03';

export class CampfireManager {
  private static instance: CampfireManager;
  private campfireScenes: Map<string, CampfireSceneData> = new Map();
  private currentStoryProgress: number = 0;
  private completedScenes: Set<string> = new Set();
  
  private constructor() {
    this.loadCampfireScenes();
  }
  
  public static getInstance(): CampfireManager {
    if (!CampfireManager.instance) {
      CampfireManager.instance = new CampfireManager();
    }
    return CampfireManager.instance;
  }
  
  private loadCampfireScenes() {
    // Load opening campfire scene
    this.campfireScenes.set('opening_campfire', {
      sceneId: openingMetadata.sceneId,
      location: openingMetadata.location,
      timeOfDay: openingMetadata.timeOfDay,
      characters: openingMetadata.characters,
      dialogue: openingSceneDialogue,
      nextScene: openingMetadata.nextScene,
      backgroundMusic: openingMetadata.backgroundMusic,
      environmentSound: openingMetadata.environmentSound
    });
    
    // Load second campfire scene
    this.campfireScenes.set('second_campfire', {
      sceneId: secondMetadata.sceneId,
      location: secondMetadata.location,
      timeOfDay: secondMetadata.timeOfDay,
      characters: secondMetadata.characters,
      dialogue: secondCampfireDialogue,
      nextScene: secondMetadata.nextScene,
      backgroundMusic: secondMetadata.backgroundMusic,
      environmentSound: secondMetadata.environmentSound
    });
    
    // Load lizard campfire scene
    this.campfireScenes.set('lizard_campfire', {
      sceneId: lizardMetadata.sceneId,
      location: lizardMetadata.location,
      timeOfDay: lizardMetadata.timeOfDay,
      characters: lizardMetadata.characters,
      dialogue: lizardCampfireDialogue,
      nextScene: lizardMetadata.nextScene,
      backgroundMusic: lizardMetadata.backgroundMusic,
      environmentSound: lizardMetadata.environmentSound
    });
    
    console.log(`CampfireManager: Loaded ${this.campfireScenes.size} campfire scenes`);
  }
  
  public getCampfireScene(sceneId: string): CampfireSceneData | null {
    return this.campfireScenes.get(sceneId) || null;
  }
  
  public getAvailableCampfireScenes(): string[] {
    return Array.from(this.campfireScenes.keys());
  }
  
  public startCampfireScene(scene: Phaser.Scene, sceneId: string): boolean {
    const campfireData = this.getCampfireScene(sceneId);
    if (!campfireData) {
      console.error(`CampfireManager: Scene ${sceneId} not found`);
      return false;
    }
    
    console.log(`CampfireManager: Starting campfire scene ${sceneId}`);
    scene.scene.start('CampfireScene', campfireData);
    return true;
  }
  
  public markSceneComplete(sceneId: string): void {
    this.completedScenes.add(sceneId);
    console.log(`CampfireManager: Marked scene ${sceneId} as complete`);
  }
  
  public isSceneComplete(sceneId: string): boolean {
    return this.completedScenes.has(sceneId);
  }
  
  public getStoryProgress(): number {
    return this.currentStoryProgress;
  }
  
  public advanceStoryProgress(): void {
    this.currentStoryProgress++;
    console.log(`CampfireManager: Story progress advanced to ${this.currentStoryProgress}`);
  }
  
  public getNextCampfireScene(): string | null {
    // Determine next campfire scene based on story progression
    const sceneOrder = ['opening_campfire', 'second_campfire', 'lizard_campfire'];
    
    for (const sceneId of sceneOrder) {
      if (!this.isSceneComplete(sceneId)) {
        return sceneId;
      }
    }
    
    return null; // All scenes completed
  }
  
  public resetProgress(): void {
    this.currentStoryProgress = 0;
    this.completedScenes.clear();
    console.log('CampfireManager: Progress reset');
  }
  
  // Save/Load functionality for checkpoints
  public saveProgress(): any {
    return {
      currentStoryProgress: this.currentStoryProgress,
      completedScenes: Array.from(this.completedScenes)
    };
  }
  
  public loadProgress(saveData: any): void {
    if (saveData) {
      this.currentStoryProgress = saveData.currentStoryProgress || 0;
      this.completedScenes = new Set(saveData.completedScenes || []);
      console.log(`CampfireManager: Progress loaded - Story: ${this.currentStoryProgress}, Completed: ${this.completedScenes.size}`);
    }
  }
}