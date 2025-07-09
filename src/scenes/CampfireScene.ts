import Phaser from 'phaser';
import { DialogueLine } from './campfire-story/wiz_campfire_01';

export interface CampfireSceneData {
  sceneId: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  dialogue: DialogueLine[];
  nextScene: string;
  backgroundMusic?: string;
  environmentSound?: string;
}

export class CampfireScene extends Phaser.Scene {
  private currentDialogue: DialogueLine[] = [];
  private currentDialogueIndex: number = 0;
  private isDialogueActive: boolean = false;
  private sceneData: CampfireSceneData | null = null;
  
  // UI Elements
  private backgroundLayer!: Phaser.GameObjects.Container;
  private characterLayer!: Phaser.GameObjects.Container;
  private dialogueLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;
  
  // Dialogue UI
  private dialogueBox!: Phaser.GameObjects.Container;
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private continuePrompt!: Phaser.GameObjects.Text;
  
  // Character portraits
  private characterPortraits: Map<string, Phaser.GameObjects.Image> = new Map();
  
  // Campfire atmosphere
  private ambientParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  // Input
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  
  constructor() {
    super({ key: 'CampfireScene' });
  }
  
  init(data: CampfireSceneData) {
    this.sceneData = data;
    this.currentDialogue = data.dialogue;
    this.currentDialogueIndex = 0;
    this.isDialogueActive = false;
    
    console.log(`CampfireScene: Initializing ${data.sceneId} at ${data.location}`);
  }
  
  preload() {
    // Load campfire assets
    this.load.image('campfire_bg', 'src/assets/screens/wiz_screen_campfire.png'); // Proper campfire background
    
    // Load character portraits
    this.load.image('char_yuvor', 'src/assets/characters/wiz_char_yuvor.png');
    this.load.image('char_burok', 'src/assets/characters/wiz_char_burok.png');
    this.load.image('char_thurm', 'src/assets/characters/wiz_char_thrum.png');
    this.load.image('char_sythara', 'src/assets/characters/wiz_char_ sythara.png');
    
    console.log('CampfireScene: Assets loaded');
  }
  
  create() {
    // Create layers in rendering order
    this.createLayers();
    
    // Setup input
    this.setupInput();
    
    // Create atmospheric campfire scene
    this.createCampfireAtmosphere();
    
    // Create dialogue UI
    this.createDialogueUI();
    
    // Start the scene
    this.startScene();
    
    console.log('CampfireScene: Scene created and ready');
  }
  
  private createLayers() {
    this.backgroundLayer = this.add.container(0, 0).setDepth(-100);
    this.characterLayer = this.add.container(0, 0).setDepth(0);
    this.dialogueLayer = this.add.container(0, 0).setDepth(100);
    this.uiLayer = this.add.container(0, 0).setDepth(200);
  }
  
  private setupInput() {
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    // Handle dialogue advancement
    this.spaceKey.on('down', () => this.advanceDialogue());
    this.enterKey.on('down', () => this.advanceDialogue());
    
    // Click to advance dialogue
    this.input.on('pointerdown', () => this.advanceDialogue());
  }
  
  private createCampfireAtmosphere() {
    if (!this.sceneData) return;
    
    // Background
    const background = this.add.image(0, 0, 'campfire_bg');
    background.setOrigin(0, 0);
    background.setDisplaySize(this.scale.width, this.scale.height);
    this.backgroundLayer.add(background);
    
    // Location display
    const locationText = this.add.text(this.scale.width / 2, 50, this.sceneData.location, {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.uiLayer.add(locationText);
    
    console.log(`CampfireScene: Atmosphere created for ${this.sceneData.location}`);
  }
  
  private createDialogueUI() {
    const dialogueBoxHeight = 200;
    const dialogueBoxY = this.scale.height - dialogueBoxHeight - 20;
    
    // Dialogue box background
    const dialogueBg = this.add.graphics();
    dialogueBg.fillStyle(0x000000, 0.8);
    dialogueBg.fillRoundedRect(20, dialogueBoxY, this.scale.width - 40, dialogueBoxHeight, 10);
    dialogueBg.lineStyle(2, 0x8B4513); // Brown border for campfire theme
    dialogueBg.strokeRoundedRect(20, dialogueBoxY, this.scale.width - 40, dialogueBoxHeight, 10);
    
    // Speaker name
    this.speakerText = this.add.text(40, dialogueBoxY + 20, '', {
      fontSize: '30px', // Increased from 20px to 30px (50% bigger)
      color: '#ffd700',
      fontStyle: 'bold'
    });
    
    // Dialogue text
    this.dialogueText = this.add.text(40, dialogueBoxY + 60, '', {
      fontSize: '24px', // Increased from 16px to 24px (50% bigger)
      color: '#ffffff',
      wordWrap: { width: this.scale.width - 80 },
      lineSpacing: 6 // Increased line spacing proportionally
    });
    
    // Action text removed - no longer displayed in campfire scenes
    
    // Continue prompt
    this.continuePrompt = this.add.text(this.scale.width - 60, dialogueBoxY + dialogueBoxHeight - 30, 
      'Press SPACE to continue', {
      fontSize: '12px',
      color: '#999999',
      fontStyle: 'italic'
    }).setOrigin(1, 0);
    
    // Create dialogue container
    this.dialogueBox = this.add.container(0, 0);
    this.dialogueBox.add([dialogueBg, this.speakerText, this.dialogueText, this.continuePrompt]);
    this.dialogueLayer.add(this.dialogueBox);
    
    // Initially hide dialogue UI
    this.dialogueBox.setVisible(false);
    
    console.log('CampfireScene: Dialogue UI created');
  }
  
  private startScene() {
    if (!this.sceneData) return;
    
    // Show characters present in this scene
    this.showCharacters();
    
    // Start dialogue after a brief pause
    this.time.delayedCall(1000, () => {
      this.isDialogueActive = true;
      this.showCurrentDialogue();
    });
    
    console.log('CampfireScene: Scene started');
  }
  
  private showCharacters() {
    if (!this.sceneData) return;
    
    // Position characters around the campfire - tops at 10% from top of screen
    const characterTopY = this.scale.height * 0.1; // 10% from top
    const characterPositions = [
      { x: this.scale.width / 2 - 300, y: characterTopY }, // Left - increased spacing
      { x: this.scale.width / 2 + 300, y: characterTopY }  // Right - increased spacing
    ];
    
    this.sceneData.characters.forEach((character, index) => {
      const charKey = `char_${character.toLowerCase()}`;
      const position = characterPositions[index] || characterPositions[0];
      
      const characterSprite = this.add.image(position.x, position.y, charKey);
      characterSprite.setScale(0.9); // Reduced from 1.5 to 0.9 (40% reduction)
      characterSprite.setOrigin(0.5, 0); // Top center origin so tops are at 40% from top
      
      this.characterPortraits.set(character, characterSprite);
      this.characterLayer.add(characterSprite);
      
      // Add subtle idle animation
      this.tweens.add({
        targets: characterSprite,
        y: position.y + 10, // Slight downward movement since origin is now at top
        duration: 2000 + (index * 500), // Stagger the animations
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
    
    console.log(`CampfireScene: Displayed ${this.sceneData.characters.length} characters`);
  }
  
  private showCurrentDialogue() {
    if (!this.isDialogueActive || !this.currentDialogue || this.currentDialogueIndex >= this.currentDialogue.length) {
      this.endScene();
      return;
    }
    
    const dialogue = this.currentDialogue[this.currentDialogueIndex];
    
    // Update dialogue UI
    this.speakerText.setText(dialogue.speaker);
    this.dialogueText.setText(dialogue.text);
    // Action text removed - no longer displayed
    
    // Highlight speaking character
    this.highlightSpeaker(dialogue.speaker);
    
    // Show dialogue box
    this.dialogueBox.setVisible(true);
    
    // Update continue prompt
    const isLastDialogue = this.currentDialogueIndex >= this.currentDialogue.length - 1;
    this.continuePrompt.setText(isLastDialogue ? 'Press SPACE to continue journey' : 'Press SPACE to continue');
    
    console.log(`CampfireScene: Showing dialogue ${this.currentDialogueIndex + 1}/${this.currentDialogue.length}`);
  }
  
  private highlightSpeaker(speaker: string) {
    // Reset all character tints - darken non-active characters
    this.characterPortraits.forEach((sprite, name) => {
      if (speaker === name) {
        sprite.clearTint(); // Active speaker has normal colors
      } else {
        sprite.setTint(0x666666); // Non-active characters are darkened
      }
    });
  }
  
  private advanceDialogue() {
    if (!this.isDialogueActive) return;
    
    this.currentDialogueIndex++;
    this.showCurrentDialogue();
  }
  
  private endScene() {
    this.isDialogueActive = false;
    this.dialogueBox.setVisible(false);
    
    if (this.sceneData) {
      console.log(`CampfireScene: Scene complete, transitioning to ${this.sceneData.nextScene}`);
      
      // Fade out and transition
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.time.delayedCall(1000, () => {
        // Use scene.restart instead of scene.start to avoid cleanup issues
        this.scene.stop('CampfireScene');
        this.scene.start(this.sceneData.nextScene);
      });
    }
  }
  
  update() {
    // Handle any continuous updates needed
    // Currently no continuous updates required
  }
  
  shutdown(): void {
    console.log('CampfireScene: Shutting down...');
    
    // Clean up character portraits
    this.characterPortraits.forEach((sprite, name) => {
      if (sprite) {
        sprite.destroy();
      }
    });
    this.characterPortraits.clear();
    
    // Clean up dialogue state
    this.isDialogueActive = false;
    this.currentDialogueIndex = 0;
    this.currentDialogue = [];
    this.sceneData = null;
    
    console.log('CampfireScene: Shutdown complete');
  }
}