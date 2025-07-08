export enum MaterialType {
  FIRE = 'fire',
  LEAF = 'leaf',
  ROCK = 'rock'
}

export class Material extends Phaser.Physics.Arcade.Sprite {
  public materialType: MaterialType;
  public isBeingGrabbed: boolean = false;
  private static readonly COLORS = {
    [MaterialType.FIRE]: 0xff4444,
    [MaterialType.LEAF]: 0x44ff44,
    [MaterialType.ROCK]: 0xffff44
  };
  
  constructor(scene: Phaser.Scene, x: number, y: number, type: MaterialType) {
    super(scene, x, y, 'material');
    this.materialType = type;
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up physics properties with zero restitution for stability
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(12);
    body.setBounce(0); // Zero restitution prevents energy reintroduction
    body.setDrag(80); // Higher drag for natural settling
    body.setMaxVelocity(200);
    body.setCollideWorldBounds(true);
    body.setMass(1);
    
    // Discrete collision detection for stability
    body.debugBodyColor = 0x00ff00;
    
    // Visual appearance
    this.setDisplaySize(24, 24);
    this.setTint(Material.COLORS[type]);
    
    // Create a simple circle graphic
    this.createCircleTexture();
  }
  
  private createCircleTexture() {
    // Check if texture already exists to avoid recreating
    if (!this.scene.textures.exists('material')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(12, 12, 12);
      graphics.generateTexture('material', 24, 24);
      graphics.destroy();
    }
    
    this.setTexture('material');
  }
  
  public static createRandom(scene: Phaser.Scene, x: number, y: number): Material {
    const types = Object.values(MaterialType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Material(scene, x, y, randomType);
  }
  
  public getColor(): number {
    return Material.COLORS[this.materialType];
  }
  
  public getName(): string {
    return this.materialType.charAt(0).toUpperCase() + this.materialType.slice(1);
  }
}