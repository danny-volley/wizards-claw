import Phaser from 'phaser';
import { MapManager } from '../systems/MapManager';

export class MapScene extends Phaser.Scene {
  private backgroundImage!: Phaser.GameObjects.Image;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private mapManager!: MapManager;
  
  constructor() {
    super({ key: 'MapScene' });
  }
  
  preload() {
    // Load map background
    this.load.image('map_background', 'src/assets/environment/wiz_map_01.jpg');
    
    // Load map node icons (will be used later)
    this.load.image('map_campfire', 'src/assets/icons/wiz_map_campfire.png');
    this.load.image('map_encounter', 'src/assets/icons/wiz_map_encounter.png');
    this.load.image('map_shop', 'src/assets/icons/wiz_map_shop.png');
    this.load.image('map_treasure', 'src/assets/icons/wiz_map_treasure.png');
    this.load.image('map_hazard', 'src/assets/icons/wiz_map_hazard.png');
    this.load.image('map_boss', 'src/assets/icons/wiz_map_boss.png');
    
    // Load character position indicator
    this.load.image('map_yuvor', 'src/assets/icons/wiz_map_yuvor.png');
    
    // Load selection arrow
    this.load.image('map_arrow', 'src/assets/icons/wiz_map_arrow2.png');
    
    console.log('MapScene: Assets loaded');
  }
  
  create(data?: any) {
    console.log('MapScene: Creating map scene');
    
    // Create and position background
    this.createBackground();
    
    // Setup input
    this.setupInput();
    
    // Initialize map manager
    this.mapManager = new MapManager(this);
    
    // Create map nodes
    this.mapManager.createMapNodes();
    
    // Handle encounter completion if returning from GameScene
    if (data && data.completeNodeId) {
      console.log('MapScene: Completing node from encounter:', data.completeNodeId);
      
      // Set the player position to the completed encounter node before completing it
      this.mapManager.setCurrentPlayerNode(data.completeNodeId);
      this.mapManager.completeEncounterNode(data.completeNodeId);
      
      // Fade in from GameScene transition
      this.cameras.main.fadeIn(800, 0, 0, 0);
    }
    
    // Add instruction text
    this.add.text(this.scale.width / 2, 50, 'Map Scene - Click nodes to interact, Press ESC to return to game', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    
    console.log('MapScene: Map scene created');
  }
  
  private createBackground() {
    // Create background image
    this.backgroundImage = this.add.image(0, 0, 'map_background');
    this.backgroundImage.setOrigin(0, 0);
    
    // Scale background to fill screen while maintaining aspect ratio
    const scaleX = this.scale.width / this.backgroundImage.width;
    const scaleY = this.scale.height / this.backgroundImage.height;
    const scale = Math.max(scaleX, scaleY); // Use max to ensure full coverage
    
    this.backgroundImage.setScale(scale);
    
    // Center the background if needed
    if (scale === scaleX) {
      // Background scaled to width, center vertically
      this.backgroundImage.setY((this.scale.height - this.backgroundImage.height * scale) / 2);
    } else {
      // Background scaled to height, center horizontally
      this.backgroundImage.setX((this.scale.width - this.backgroundImage.width * scale) / 2);
    }
    
    console.log(`MapScene: Background scaled by ${scale.toFixed(2)} and positioned`);
  }
  
  private setupInput() {
    // Setup escape key to return to game
    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escapeKey.on('down', () => {
      console.log('ESC pressed - returning to GameScene');
      this.scene.start('GameScene');
    });
    
    // Setup space key for node selection
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', () => {
      this.mapManager.handleArrowSelection();
    });
  }
  
  update() {
    // Handle any continuous updates
    // Currently no continuous updates needed for map
  }
  
  shutdown() {
    console.log('MapScene: Shutting down...');
    
    // Clean up map manager
    if (this.mapManager) {
      this.mapManager.destroy();
    }
    
    // Clean up any resources
    if (this.backgroundImage) {
      this.backgroundImage.destroy();
    }
    
    console.log('MapScene: Shutdown complete');
  }
}