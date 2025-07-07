export class SpellArrow extends Phaser.GameObjects.Graphics {
  private isActive: boolean = false;
  private arrowSpeed: number = 0.02; // Similar to crane speed
  private currentAngle: number = 0;
  private spellMenuHeight: number = 200; // Height of the spell selection area
  private spellMenuY: number = 250; // Starting Y position of spells
  private spellCount: number = 4; // Number of available spells
  private baseX: number; // Store the initial X position
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.baseX = x; // Store the X position
    scene.add.existing(this);
    
    this.createArrow();
    this.setVisible(false);
  }
  
  private createArrow() {
    this.clear();
    this.fillStyle(0xffffff);
    
    // Create a triangle arrow pointing right (toward spells)
    this.fillTriangle(0, -8, 12, 0, 0, 8);
    
    // Add a small outline for visibility
    this.lineStyle(1, 0x000000);
    this.strokeTriangle(0, -8, 12, 0, 0, 8);
  }
  
  public startSelection() {
    console.log('SpellArrow startSelection called');
    this.isActive = true;
    this.currentAngle = 0;
    
    // Recreate the arrow graphics to ensure they exist
    this.createArrow();
    
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
    // Map sine wave (-1 to 1) to spell menu height
    const sineValue = Math.sin(this.currentAngle);
    const normalizedPosition = (sineValue + 1) / 2; // Convert to 0-1 range
    const yOffset = normalizedPosition * this.spellMenuHeight;
    
    // Position arrow vertically within spell menu, keeping X position fixed
    this.setPosition(this.baseX, this.spellMenuY + yOffset);
  }
  
  public getCurrentSpellIndex(): number {
    if (!this.isActive) return -1;
    
    // Calculate which spell the arrow is pointing to
    const relativeY = this.y - this.spellMenuY;
    const spellHeight = this.spellMenuHeight / this.spellCount;
    const spellIndex = Math.floor(relativeY / spellHeight);
    
    // Clamp to valid range
    return Math.max(0, Math.min(this.spellCount - 1, spellIndex));
  }
  
  public setSpellCount(count: number) {
    this.spellCount = count;
  }
  
  public setSpellMenuBounds(startY: number, height: number) {
    this.spellMenuY = startY;
    this.spellMenuHeight = height;
  }
  
  public isSelectionActive(): boolean {
    return this.isActive;
  }
}