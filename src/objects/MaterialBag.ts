import { Material, MaterialType } from './Material';

export class MaterialBag extends Phaser.GameObjects.Container {
  private materials: Material[] = [];
  private maxCapacity: number = 15;
  private bagWidth: number = 160;
  private bagHeight: number = 120;
  private bagWalls: Phaser.Physics.Arcade.StaticGroup;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    // Add to scene
    scene.add.existing(this);
    
    // Create visual representation
    this.createBagVisual();
    
    // Create invisible walls for physics containment
    this.createBagWalls();
    
    // Initialize with some materials
    this.addRandomMaterials(8);
  }
  
  private createBagVisual() {
    // Create bag container visual
    const bagGraphics = this.scene.add.graphics();
    bagGraphics.fillStyle(0x654321);
    bagGraphics.fillRoundedRect(-this.bagWidth/2, -this.bagHeight/2, this.bagWidth, this.bagHeight, 10);
    bagGraphics.lineStyle(3, 0x3d2817);
    bagGraphics.strokeRoundedRect(-this.bagWidth/2, -this.bagHeight/2, this.bagWidth, this.bagHeight, 10);
    
    this.add(bagGraphics);
    
    // Create bag opening (top part)
    const opening = this.scene.add.graphics();
    opening.fillStyle(0x2c3e50);
    opening.fillRoundedRect(-this.bagWidth/2 + 10, -this.bagHeight/2 - 5, this.bagWidth - 20, 10, 5);
    
    this.add(opening);
  }
  
  private createBagWalls() {
    // Create physics walls to contain materials
    this.bagWalls = this.scene.physics.add.staticGroup();
    
    const wallThickness = 5;
    
    // Bottom wall
    const bottomWall = this.scene.add.rectangle(
      this.x, 
      this.y + this.bagHeight/2 - wallThickness/2, 
      this.bagWidth, 
      wallThickness, 
      0x000000, 
      0
    );
    this.scene.physics.add.existing(bottomWall, true);
    this.bagWalls.add(bottomWall);
    
    // Left wall
    const leftWall = this.scene.add.rectangle(
      this.x - this.bagWidth/2 + wallThickness/2, 
      this.y, 
      wallThickness, 
      this.bagHeight, 
      0x000000, 
      0
    );
    this.scene.physics.add.existing(leftWall, true);
    this.bagWalls.add(leftWall);
    
    // Right wall
    const rightWall = this.scene.add.rectangle(
      this.x + this.bagWidth/2 - wallThickness/2, 
      this.y, 
      wallThickness, 
      this.bagHeight, 
      0x000000, 
      0
    );
    this.scene.physics.add.existing(rightWall, true);
    this.bagWalls.add(rightWall);
  }
  
  public addMaterial(material: Material): boolean {
    if (this.materials.length >= this.maxCapacity) {
      return false;
    }
    
    this.materials.push(material);
    
    // Position material randomly within bag bounds with better spacing
    const bagBounds = this.getBounds();
    const dropZoneWidth = this.bagWidth - 60; // More margin for spacing
    const randomX = bagBounds.x + (bagBounds.width - dropZoneWidth) / 2 + Math.random() * dropZoneWidth;
    const dropY = bagBounds.y + 10; // Drop from just inside the top of the bag
    
    material.setPosition(randomX, dropY);
    
    // Add to materials group for automatic collision handling
    const gameScene = this.scene as any;
    if (gameScene.getMaterialsGroup) {
      gameScene.getMaterialsGroup().add(material);
    }
    
    // Add natural falling velocity with less horizontal randomness
    const body = material.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      (Math.random() - 0.5) * 15, // Less horizontal variance
      Math.random() * 20 + 30 // Consistent downward velocity
    );
    
    // Notify scene that a material was dropped
    this.scene.events.emit('materialDropped');
    
    return true;
  }
  
  public addRandomMaterials(count: number): number {
    const materialTypes = [MaterialType.FIRE, MaterialType.LEAF, MaterialType.ROCK];
    let added = 0;
    
    for (let i = 0; i < count && this.materials.length < this.maxCapacity; i++) {
      // Ensure balanced distribution of material types
      const typeIndex = i % materialTypes.length;
      const materialType = materialTypes[typeIndex];
      
      // Add materials with staggered timing to prevent mid-air collisions
      this.scene.time.delayedCall(i * 300, () => {
        if (this.materials.length < this.maxCapacity) {
          const material = new Material(
            this.scene,
            0, // Position will be set in addMaterial
            0,
            materialType
          );
          
          this.addMaterialWithTiming(material);
        }
      });
      
      added++;
    }
    return added;
  }
  
  private addMaterialWithTiming(material: Material): boolean {
    if (this.materials.length >= this.maxCapacity) {
      material.destroy();
      return false;
    }
    
    this.materials.push(material);
    
    // Position material inside bag bounds with better spacing
    const bagBounds = this.getBounds();
    const dropZoneWidth = this.bagWidth - 60; // More margin for spacing
    const randomX = bagBounds.x + (bagBounds.width - dropZoneWidth) / 2 + Math.random() * dropZoneWidth;
    const dropY = bagBounds.y + 5; // Drop from just inside the top of the bag
    
    material.setPosition(randomX, dropY);
    
    // Add to materials group for automatic collision handling
    const gameScene = this.scene as any;
    if (gameScene.getMaterialsGroup) {
      gameScene.getMaterialsGroup().add(material);
    }
    
    // Add natural falling velocity with minimal horizontal variance
    const body = material.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      (Math.random() - 0.5) * 10, // Minimal horizontal variance
      Math.random() * 20 + 40 // Stronger downward velocity
    );
    
    // Notify scene that a material was dropped
    this.scene.events.emit('materialDropped');
    
    return true;
  }
  
  public removeMaterial(material: Material): boolean {
    const index = this.materials.indexOf(material);
    if (index > -1) {
      this.materials.splice(index, 1);
      return true;
    }
    return false;
  }
  
  public getMaterials(): Material[] {
    return [...this.materials];
  }
  
  public getCapacity(): { current: number; max: number } {
    return {
      current: this.materials.length,
      max: this.maxCapacity
    };
  }
  
  public isFull(): boolean {
    return this.materials.length >= this.maxCapacity;
  }
  
  public getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.bagWidth/2,
      this.y - this.bagHeight/2,
      this.bagWidth,
      this.bagHeight
    );
  }
  
  public getMaterialsInBounds(): Material[] {
    const bounds = this.getBounds();
    return this.materials.filter(material => {
      return Phaser.Geom.Rectangle.Contains(bounds, material.x, material.y);
    });
  }
  
  public getBagWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.bagWalls;
  }
  
  public addGatherMaterials(count: number = 4): number {
    // Add 4 random materials for Gather action
    const materialTypes = [MaterialType.FIRE, MaterialType.LEAF, MaterialType.ROCK];
    let added = 0;
    
    for (let i = 0; i < count && this.materials.length < this.maxCapacity; i++) {
      // Random material type for Gather
      const randomType = materialTypes[Math.floor(Math.random() * materialTypes.length)];
      
      // Stagger the drops
      this.scene.time.delayedCall(i * 200, () => {
        if (this.materials.length < this.maxCapacity) {
          const material = new Material(
            this.scene,
            0,
            0,
            randomType
          );
          
          this.addMaterialWithTiming(material);
        }
      });
      
      added++;
    }
    
    return added;
  }
}