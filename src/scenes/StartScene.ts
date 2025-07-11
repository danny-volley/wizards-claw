import Phaser from 'phaser';
import { CampfireManager } from '../systems/CampfireManager';

export class StartScene extends Phaser.Scene {
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private splashImage!: Phaser.GameObjects.Image;
  private instructionText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'StartScene' });
  }

  preload() {
    // Load the splash screen image
    this.load.image('splash_screen', 'assets/screens/wiz_screen_splash.jpg');
    
    console.log('StartScene: Assets loaded');
  }

  create() {
    console.log('StartScene: Creating start screen');

    // Create splash screen background
    this.splashImage = this.add.image(0, 0, 'splash_screen');
    this.splashImage.setOrigin(0, 0);

    // Scale splash screen to fill screen while maintaining aspect ratio
    const scaleX = this.scale.width / this.splashImage.width;
    const scaleY = this.scale.height / this.splashImage.height;
    const scale = Math.max(scaleX, scaleY);
    
    this.splashImage.setScale(scale);

    // Center the splash screen if needed
    if (scale === scaleX) {
      // Background scaled to width, center vertically
      this.splashImage.setY((this.scale.height - this.splashImage.height * scale) / 2);
    } else {
      // Background scaled to height, center horizontally
      this.splashImage.setX((this.scale.width - this.splashImage.width * scale) / 2);
    }

    // Add instruction text
    this.instructionText = this.add.text(this.scale.width / 2, this.scale.height - 80, 'Press SPACE to begin your journey', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    this.instructionText.setOrigin(0.5);
    this.instructionText.setDepth(1000);

    // Add pulsing animation to the instruction text
    this.tweens.add({
      targets: this.instructionText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Setup input
    this.setupInput();

    // Add fade in effect
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    console.log('StartScene: Start screen created');
  }

  private setupInput() {
    // Setup space key to start the game
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', () => {
      this.startGame();
    });
  }

  private startGame() {
    console.log('StartScene: Starting game - transitioning to first campfire scene');
    
    // Fade out and transition to first campfire scene
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.time.delayedCall(1000, () => {
      // Use CampfireManager to properly start the opening campfire scene
      const campfireManager = CampfireManager.getInstance();
      campfireManager.startCampfireScene(this, 'opening_campfire');
    });
  }

  update() {
    // No continuous updates needed for start screen
  }
}