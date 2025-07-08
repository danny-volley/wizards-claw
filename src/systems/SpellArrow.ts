import { SpellDatabase, SpellRecipe } from './SpellDatabase';

export class SpellArrow extends Phaser.GameObjects.Container {
  private isActive: boolean = false;
  private arrowSpeed: number = 0.02; // Similar to crane speed
  private currentAngle: number = 0;
  private spellMenuHeight: number = 200; // Height of the spell selection area
  private spellMenuY: number = 250; // Starting Y position of spells
  private spellCount: number = 4; // Number of available spells
  private baseX: number; // Store the initial X position
  private availableSpells: SpellRecipe[] = []; // Store available spells for timing zones
  private timingZones: Map<number, { centerY: number, zoneSize: number }> = new Map();
  private clawImage: Phaser.GameObjects.Image;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.baseX = x; // Store the X position
    scene.add.existing(this);
    
    this.createArrow();
    this.setVisible(false);
  }
  
  private createArrow() {
    // Clear any existing elements
    this.removeAll(true);
    
    // Create claw image
    this.clawImage = this.scene.add.image(0, 0, 'claw_spells');
    
    // Scale down the image (it's quite large)
    this.clawImage.setScale(0.3); // Adjust this value as needed
    
    // Set the origin to the selection point (x:980, y:365 in the original image)
    // Convert to normalized coordinates (0-1) based on image size
    const imageWidth = this.clawImage.width;
    const imageHeight = this.clawImage.height;
    const originX = 980 / imageWidth;
    const originY = 365 / imageHeight;
    
    this.clawImage.setOrigin(originX, originY);
    
    // Add to container
    this.add(this.clawImage);
  }
  
  public startSelection() {
    console.log('SpellArrow startSelection called');
    this.isActive = true;
    this.currentAngle = 0;
    
    // Recreate the arrow graphics to ensure they exist
    this.createArrow();
    this.createTimingZones();
    
    this.setVisible(true);
    // Ensure arrow is brought to front
    this.setDepth(1000);
    console.log('Arrow visibility set to:', this.visible);
    console.log('Arrow position:', this.x, this.y);
  }
  
  public stopSelection() {
    this.isActive = false;
    this.setVisible(false);
  }
  
  public update() {
    if (!this.isActive) return;
    
    // Pendulum-like movement similar to crane
    this.currentAngle += this.arrowSpeed;
    
    // Reset angle to prevent overflow
    if (this.currentAngle >= Math.PI * 2) {
      this.currentAngle -= Math.PI * 2;
    }
    
    // Calculate vertical position using sine wave (pendulum motion)
    // Map sine wave (-1 to 1) to full range with buffers
    const sineValue = Math.sin(this.currentAngle);
    const normalizedPosition = (sineValue + 1) / 2; // Convert to 0-1 range
    
    // Calculate position with buffers at top and bottom
    const spellSpacing = 45;
    const buffer = 30; // Buffer distance beyond first/last spell
    const firstSpellOffset = 0; // First spell is at spellMenuY
    const lastSpellOffset = (this.spellCount - 1) * spellSpacing; // Last spell position
    const totalRange = lastSpellOffset + (buffer * 2); // Full range including buffers
    
    // Position arrow from buffer above first spell to buffer below last spell
    const yOffset = (normalizedPosition * totalRange) - buffer;
    
    // Position arrow vertically, keeping X position fixed
    this.setPosition(this.baseX, this.spellMenuY + yOffset);
  }
  
  public getCurrentSpellIndex(): number {
    if (!this.isActive) return -1;
    
    // Check timing zones for precise spell selection
    const currentY = this.y;
    
    for (const [spellIndex, zone] of this.timingZones.entries()) {
      const distance = Math.abs(currentY - zone.centerY);
      if (distance <= zone.zoneSize / 2) {
        return spellIndex;
      }
    }
    
    return -1; // Arrow is not in any timing zone
  }
  
  public getTimingAccuracy(): number {
    if (!this.isActive) return 0;
    
    const currentY = this.y;
    let bestAccuracy = 0;
    
    for (const [spellIndex, zone] of this.timingZones.entries()) {
      const distance = Math.abs(currentY - zone.centerY);
      if (distance <= zone.zoneSize / 2) {
        // Calculate accuracy as percentage (1.0 = perfect center, 0.0 = edge of zone)
        const accuracy = 1.0 - (distance / (zone.zoneSize / 2));
        bestAccuracy = Math.max(bestAccuracy, accuracy);
      }
    }
    
    return bestAccuracy;
  }
  
  public setSpellCount(count: number) {
    this.spellCount = count;
  }
  
  public setSpellMenuBounds(startY: number, height: number) {
    this.spellMenuY = startY;
    this.spellMenuHeight = height;
  }
  
  public setAvailableSpells(spells: SpellRecipe[]) {
    this.availableSpells = spells;
    this.spellCount = spells.length;
  }
  
  private createTimingZones() {
    this.timingZones.clear();
    
    // Create timing zones based on spell difficulty
    this.availableSpells.forEach((spell, index) => {
      const spellCenterY = this.spellMenuY + (index * 45);
      const zoneSize = SpellDatabase.getTimingWindowSize(spell.difficulty);
      
      this.timingZones.set(index, {
        centerY: spellCenterY,
        zoneSize: zoneSize
      });
    });
  }
  
  public isSelectionActive(): boolean {
    return this.isActive;
  }
}