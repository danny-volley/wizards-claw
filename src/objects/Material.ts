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
    body.setCircle(14); // 14 pixel radius
    body.setBounce(0); // Zero restitution prevents energy reintroduction
    body.setDrag(80); // Higher drag for natural settling
    body.setMaxVelocity(200);
    body.setCollideWorldBounds(true);
    body.setMass(1);
    
    // Discrete collision detection for stability
    body.debugBodyColor = 0x00ff00;
    
    // Visual appearance - 28x28 to match physics body (14 radius * 2)
    this.setDisplaySize(28, 28);
    this.setTint(Material.COLORS[type]);
    
    // Create material texture with colorblind-friendly shapes
    this.createMaterialTexture();
  }
  
  private createMaterialTexture() {
    const textureKey = `material-${this.materialType}`;
    
    // Check if texture already exists to avoid recreating
    if (!this.scene.textures.exists(textureKey)) {
      const graphics = this.scene.add.graphics();
      
      // Base circle with material color - 14 pixel radius
      graphics.fillStyle(Material.COLORS[this.materialType]);
      graphics.fillCircle(14, 14, 14); // 14 pixel radius, centered in 28x28 texture
      
      // Add colorblind-friendly shape overlay with lighter color
      graphics.fillStyle(0x000000, 0.3); // Much lighter semi-transparent black
      
      switch (this.materialType) {
        case MaterialType.FIRE:
          // Triangle pointing up (flame shape) - adjusted for 28x28
          graphics.fillTriangle(14, 7, 9, 20, 19, 20);
          break;
          
        case MaterialType.LEAF:
          // Diamond/rhombus shape - adjusted for 28x28
          graphics.fillPoints([
            { x: 14, y: 8 },   // top
            { x: 20, y: 14 },  // right
            { x: 14, y: 20 },  // bottom
            { x: 8, y: 14 }    // left
          ]);
          break;
          
        case MaterialType.ROCK:
          // Square shape - adjusted for 28x28
          graphics.fillRect(9, 9, 10, 10);
          break;
      }
      
      graphics.generateTexture(textureKey, 28, 28); // 28x28 texture for 14 radius circle
      graphics.destroy();
    }
    
    this.setTexture(textureKey);
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