export enum MaterialType {
  FIRE = 'fire',
  LEAF = 'leaf',
  ROCK = 'rock'
}

export class Material extends Phaser.Physics.Arcade.Sprite {
  public materialType: MaterialType;
  public isBeingGrabbed: boolean = false;
  
  // Material size constant - change this to resize all materials  
  private static readonly MATERIAL_RADIUS = 30; // Base radius - 20% bigger than 25
  private static readonly MATERIAL_SIZE = Material.MATERIAL_RADIUS * 2; // 60x60 physics size
  private static readonly ART_SIZE = Material.MATERIAL_SIZE + 19; // Art is 19px bigger (16 * 1.2) to match physics size
  
  private static readonly COLORS = {
    [MaterialType.FIRE]: 0xff4444,
    [MaterialType.LEAF]: 0x44ff44,
    [MaterialType.ROCK]: 0xffff44
  };
  
  constructor(scene: Phaser.Scene, x: number, y: number, type: MaterialType) {
    // Use the appropriate material texture based on type
    const textureKey = `material_${type}`;
    super(scene, x, y, textureKey);
    this.materialType = type;
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up physics properties with zero restitution for stability
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    // Set circular physics body to match display size  
    const physicsRadius = this.displayWidth / 2; // Half of display width for radius
    body.setCircle(physicsRadius);
    
    console.log(`PHYSICS DEBUG: Set radius to 100, actual body radius: ${body.radius}`);
    console.log(`PHYSICS DEBUG: Body dimensions: ${body.width}x${body.height}`);
    body.setBounce(0); // Zero restitution prevents energy reintroduction
    body.setDrag(80); // Higher drag for natural settling
    body.setMaxVelocity(200);
    body.setCollideWorldBounds(true);
    body.setMass(1);
    
    // Discrete collision detection for stability
    body.debugBodyColor = 0x00ff00;
    body.debugShowBody = true; // Show physics collision area
    
    // Set sprite to invisible - we'll use a separate image for visuals
    this.setDisplaySize(Material.ART_SIZE, Material.ART_SIZE);
    this.setVisible(false);
    
    // Create separate visual image that's bigger than physics
    const visualImage = this.scene.add.image(this.x, this.y, `material_${this.materialType}`);
    visualImage.setDisplaySize(Material.ART_SIZE + 18, Material.ART_SIZE + 18); // Bigger visual (15 * 1.2 = 18)
    visualImage.setOrigin(0.5, 0.5);
    
    // Store reference to update position
    (this as any).visualImage = visualImage;
    
    // Set up update event to sync positions every frame
    this.scene.events.on('update', this.updateVisualPosition, this);
    
    // Debug logging to see actual sizes
    console.log(`Material ${this.materialType}:`);
    console.log(`  Original texture size: ${this.texture.source[0].width}x${this.texture.source[0].height}`);
    console.log(`  Display size set to: ${Material.ART_SIZE}x${Material.ART_SIZE}`);
    console.log(`  Actual display size: ${this.displayWidth}x${this.displayHeight}`);
    console.log(`  Physics radius: ${Material.MATERIAL_RADIUS}`);
    console.log(`  Physics body size: ${body.width}x${body.height}`);
  }
  
  // Update visual position every frame to match physics
  private updateVisualPosition(): void {
    if ((this as any).visualImage) {
      (this as any).visualImage.setPosition(this.x - 3, this.y);
    }
  }
  
  // Override setPosition to move both physics and visual
  public setPosition(x?: number, y?: number): this {
    super.setPosition(x, y);
    if ((this as any).visualImage) {
      (this as any).visualImage.setPosition(this.x - 3, this.y); // Apply offset here (scaled down 50%)
    }
    return this;
  }
  
  // Override destroy to clean up visual image
  public destroy(): void {
    // Remove update listener
    this.scene.events.off('update', this.updateVisualPosition, this);
    
    if ((this as any).visualImage) {
      (this as any).visualImage.destroy();
    }
    super.destroy();
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