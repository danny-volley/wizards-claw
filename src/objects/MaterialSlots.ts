import { Material, MaterialType } from './Material';

export class MaterialSlots extends Phaser.GameObjects.Container {
  private slots: MaterialSlot[] = [];
  private maxSlots: number = 2;
  private slotWidth: number = 50;
  private slotHeight: number = 50;
  private slotSpacing: number = 60;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    scene.add.existing(this);
    
    this.createSlots();
  }
  
  private createSlots() {
    for (let i = 0; i < this.maxSlots; i++) {
      const slotX = (i - (this.maxSlots - 1) / 2) * this.slotSpacing;
      const slot = new MaterialSlot(this.scene, slotX, 0, i);
      this.add(slot);
      this.slots.push(slot);
    }
  }
  
  public addMaterial(material: Material): boolean {
    // Find first empty slot
    const emptySlot = this.slots.find(slot => !slot.hasMaterial());
    console.log('Empty slot found:', !!emptySlot);
    if (emptySlot) {
      const result = emptySlot.setMaterial(material);
      console.log('Material set in slot:', result);
      console.log('Total filled slots after add:', this.getFilledCount());
      return result;
    }
    return false;
  }
  
  public removeMaterial(slotIndex: number): Material | null {
    if (slotIndex >= 0 && slotIndex < this.slots.length) {
      return this.slots[slotIndex].removeMaterial();
    }
    return null;
  }
  
  public getMaterials(): (Material | null)[] {
    return this.slots.map(slot => slot.getMaterial());
  }
  
  public getFilledMaterials(): Material[] {
    return this.slots
      .map(slot => slot.getMaterial())
      .filter(material => material !== null) as Material[];
  }
  
  public isFull(): boolean {
    return this.slots.every(slot => slot.hasMaterial());
  }
  
  public isEmpty(): boolean {
    return this.slots.every(slot => !slot.hasMaterial());
  }
  
  public getFilledCount(): number {
    return this.slots.filter(slot => slot.hasMaterial()).length;
  }
  
  public clear() {
    this.slots.forEach(slot => slot.clearMaterial());
  }
  
  public getSlotBounds(slotIndex: number): Phaser.Geom.Rectangle | null {
    if (slotIndex >= 0 && slotIndex < this.slots.length) {
      return this.slots[slotIndex].getBounds();
    }
    return null;
  }
}

class MaterialSlot extends Phaser.GameObjects.Container {
  private slotIndex: number;
  private material: Material | null = null;
  private slotBackground: Phaser.GameObjects.Graphics;
  private slotWidth: number = 50;
  private slotHeight: number = 50;
  
  constructor(scene: Phaser.Scene, x: number, y: number, index: number) {
    super(scene, x, y);
    
    this.slotIndex = index;
    
    // Create slot background
    this.slotBackground = scene.add.graphics();
    this.createSlotVisual();
    this.add(this.slotBackground);
    
    scene.add.existing(this);
  }
  
  private createSlotVisual() {
    this.slotBackground.clear();
    
    if (this.material) {
      // Filled slot
      this.slotBackground.fillStyle(0x4a4a4a);
      this.slotBackground.lineStyle(2, 0x666666);
    } else {
      // Empty slot
      this.slotBackground.fillStyle(0x2a2a2a);
      this.slotBackground.lineStyle(2, 0x666666, 1, 0.5);
      this.slotBackground.setAlpha(0.7);
    }
    
    this.slotBackground.fillRoundedRect(
      -this.slotWidth/2, 
      -this.slotHeight/2, 
      this.slotWidth, 
      this.slotHeight, 
      8
    );
    
    this.slotBackground.strokeRoundedRect(
      -this.slotWidth/2, 
      -this.slotHeight/2, 
      this.slotWidth, 
      this.slotHeight, 
      8
    );
    
    // Add dashed border for empty slots
    if (!this.material) {
      this.slotBackground.lineStyle(2, 0x888888, 1, 0.5);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const startX = Math.cos(angle) * 20;
        const startY = Math.sin(angle) * 20;
        const endX = Math.cos(angle) * 25;
        const endY = Math.sin(angle) * 25;
        this.slotBackground.lineBetween(startX, startY, endX, endY);
      }
    }
  }
  
  public setMaterial(material: Material): boolean {
    console.log('Setting material in slot, current material:', this.material);
    if (this.material) {
      console.log('Slot already occupied!');
      return false; // Slot already occupied
    }
    
    this.material = material;
    console.log('Material set successfully in slot');
    
    // Position material in slot center
    material.setPosition(this.x + this.parentContainer.x, this.y + this.parentContainer.y);
    
    // Completely disable physics for slotted material
    const body = material.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.setImmovable(true);
    body.enable = false; // Disable physics body entirely
    
    // Remove from materials group to prevent further collisions
    const gameScene = material.scene as any;
    if (gameScene.getMaterialsGroup) {
      gameScene.getMaterialsGroup().remove(material);
    }
    
    // Update visual
    this.createSlotVisual();
    
    return true;
  }
  
  public removeMaterial(): Material | null {
    if (!this.material) {
      return null;
    }
    
    const removedMaterial = this.material;
    this.material = null;
    
    // Re-enable physics
    const body = removedMaterial.body as Phaser.Physics.Arcade.Body;
    body.enable = true; // Re-enable physics body
    body.setImmovable(false);
    body.setAcceleration(0, 0);
    
    // Add back to materials group for collisions
    const gameScene = removedMaterial.scene as any;
    if (gameScene.getMaterialsGroup) {
      gameScene.getMaterialsGroup().add(removedMaterial);
    }
    
    // Update visual
    this.createSlotVisual();
    
    return removedMaterial;
  }
  
  public getMaterial(): Material | null {
    return this.material;
  }
  
  public hasMaterial(): boolean {
    return this.material !== null;
  }
  
  public getSlotIndex(): number {
    return this.slotIndex;
  }
  
  public getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x + this.parentContainer.x - this.slotWidth/2,
      this.y + this.parentContainer.y - this.slotHeight/2,
      this.slotWidth,
      this.slotHeight
    );
  }
  
  public clearMaterial(): void {
    // Clear material reference without trying to re-enable physics
    // (used when materials are destroyed externally)
    this.material = null;
    this.createSlotVisual();
  }
}