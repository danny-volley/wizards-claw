import { Material, MaterialType } from './Material';

export class MaterialSlots extends Phaser.GameObjects.Container {
  private slots: MaterialSlot[] = [];
  private maxSlots: number = 2;
  private slotWidth: number = 70; // 40% bigger than 50
  private slotHeight: number = 70; // 40% bigger than 50
  private slotSpacing: number = 80; // Increased spacing from 60 to 80
  private thirdSlotUnlocked: boolean = false;
  
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
  
  public unlockThirdSlot(): boolean {
    if (!this.thirdSlotUnlocked) {
      this.thirdSlotUnlocked = true;
      this.maxSlots = 3;
      
      // Create the third slot
      const slotX = (2 - (this.maxSlots - 1) / 2) * this.slotSpacing;
      const slot = new MaterialSlot(this.scene, slotX, 0, 2);
      this.add(slot);
      this.slots.push(slot);
      
      // Reposition existing slots to center the 3-slot layout
      this.repositionSlots();
      
      console.log('Third material slot unlocked!');
      return true;
    }
    return false;
  }
  
  public isThirdSlotUnlocked(): boolean {
    return this.thirdSlotUnlocked;
  }
  
  private repositionSlots(): void {
    // Reposition all slots to center them properly
    this.slots.forEach((slot, index) => {
      const slotX = (index - (this.maxSlots - 1) / 2) * this.slotSpacing;
      slot.setPosition(slotX, 0);
    });
  }
}

class MaterialSlot extends Phaser.GameObjects.Container {
  private slotIndex: number;
  private material: Material | null = null;
  private slotBackground: Phaser.GameObjects.Graphics;
  private slotWidth: number = 70; // 40% bigger than 50
  private slotHeight: number = 70; // 40% bigger than 50
  
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
    // Clear any existing graphics
    this.slotBackground.clear();
    
    // Remove existing slot image if any
    const existingImage = this.list.find(child => child.type === 'Image' && (child as any).texture?.key === 'slot');
    if (existingImage) {
      this.remove(existingImage);
      existingImage.destroy();
    }
    
    // Add slot artwork
    const slotImage = this.scene.add.image(0, 0, 'slot');
    
    // Scale slot to fit the slot dimensions (70x70)
    const targetSize = 70;
    const scale = targetSize / Math.max(slotImage.width, slotImage.height);
    slotImage.setScale(scale);
    
    // Adjust opacity based on slot state
    if (this.material) {
      slotImage.setAlpha(1.0); // Full opacity when filled
    } else {
      slotImage.setAlpha(0.7); // Slightly transparent when empty
    }
    
    this.add(slotImage);
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