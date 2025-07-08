import { Material } from './Material';

export class Crane extends Phaser.GameObjects.Container {
  private arm: Phaser.GameObjects.Graphics;
  private claw: Phaser.GameObjects.Graphics;
  private cable: Phaser.GameObjects.Graphics;
  private clawImage: Phaser.GameObjects.Image;
  private debugGraphics: Phaser.GameObjects.Graphics;
  
  private armLength: number = 100;
  private swingSpeed: number = 0.02;
  private swingRange: number = 150;
  private currentSwingAngle: number = 0;
  private swingDirection: number = 1;
  private isSwinging: boolean = true;
  
  private isDescending: boolean = false;
  private isAscending: boolean = false;
  private descentSpeed: number = 150;
  private cableLength: number = 20;
  private maxCableLength: number = 400; // Increased to allow reaching bag bottom
  private bagBottomY: number = 0;
  
  private grabbedMaterial: Material | null = null;
  private clawOpen: boolean = true;
  
  constructor(scene: Phaser.Scene, x: number, y: number, bagBottomY: number = 400) {
    super(scene, x, y);
    
    scene.add.existing(this);
    
    this.bagBottomY = bagBottomY;
    
    this.createCraneVisual();
    
    // Start swinging
    this.startSwinging();
  }
  
  private createCraneVisual() {
    // Create arm (horizontal bar) - hidden
    this.arm = this.scene.add.graphics();
    this.arm.setVisible(false);
    this.add(this.arm);
    
    // Create cable - hidden
    this.cable = this.scene.add.graphics();
    this.cable.setVisible(false);
    this.add(this.cable);
    
    // Create placeholder claw (for alignment) - hidden
    this.claw = this.scene.add.graphics();
    this.claw.setVisible(false);
    this.add(this.claw);
    
    // Create claw image
    this.clawImage = this.scene.add.image(0, 0, 'claw');
    this.clawImage.setOrigin(0.5, 0.5); // Center the image
    this.clawImage.setScale(0.3); // 50% bigger than 0.2 (was 0.2, now 0.3)
    this.add(this.clawImage);
    
    // Create debug graphics for collision visualization
    this.debugGraphics = this.scene.add.graphics();
    this.add(this.debugGraphics);
    
    this.updateCranePosition();
  }
  
  private updateCranePosition() {
    // Calculate current position along the arm
    const armPosition = Math.sin(this.currentSwingAngle) * this.swingRange;
    
    // Update cable (hidden but still needed for calculations)
    this.cable.clear();
    
    // Update placeholder claw (hidden but still needed for calculations)
    this.claw.clear();
    this.claw.setPosition(armPosition, this.cableLength);
    
    // Update claw image position
    // The collision point in the asset is at x:460 y:980
    // We need to offset the image so this point aligns with where the arrow tip was (armPosition, cableLength)
    const collisionOffsetX = -460 * this.clawImage.scaleX; // Offset to align collision point horizontally
    const collisionOffsetY = -980 * this.clawImage.scaleY; // Offset to align collision point vertically
    
    // MANUAL ADJUSTMENT VALUES - modify these to fine-tune positioning:
    const manualAdjustX = 155; // Positive moves right, negative moves left
    const manualAdjustY = 160; // Positive moves down, negative moves up
    
    // Position the image so that the collision point (460, 980) aligns with the arrow tip
    this.clawImage.setPosition(
      armPosition + collisionOffsetX + manualAdjustX, 
      this.cableLength + collisionOffsetY + manualAdjustY
    );
    
    // Show/hide claw image based on game state
    const gameScene = this.scene as any;
    const isSelectingMaterials = gameScene.gameState === 'selecting';
    this.clawImage.setVisible(isSelectingMaterials);
    
    // Update debug visualization
    this.updateDebugVisualization();
  }
  
  private updateDebugVisualization() {
    this.debugGraphics.clear();
    // Debug visualization removed
  }
  
  private startSwinging() {
    // Remove tween-based swinging - we'll handle it manually in update
    this.isSwinging = true;
  }
  
  public update() {
    if (this.isSwinging && !this.isDescending && !this.isAscending) {
      // Pendulum-like movement: faster in middle, slower at edges
      // Use sine wave for smooth pendulum motion
      this.currentSwingAngle += this.swingSpeed;
      
      // Reset angle to prevent overflow
      if (this.currentSwingAngle >= Math.PI * 2) {
        this.currentSwingAngle -= Math.PI * 2;
      }
      
      this.updateCranePosition();
    }
    
    // Update grabbed material position during movement
    if (this.grabbedMaterial && (this.isDescending || this.isAscending)) {
      const clawWorldPos = this.getClawWorldPosition();
      this.grabbedMaterial.setPosition(clawWorldPos.x, clawWorldPos.y);
    }
  }
  
  public stopSwinging() {
    this.isSwinging = false;
  }
  
  public resumeSwinging() {
    this.isSwinging = true;
  }
  
  public startDescent(): boolean {
    if (this.isDescending || this.isAscending) {
      return false;
    }
    
    // Stop swinging when descent starts
    this.isSwinging = false;
    this.isDescending = true;
    this.clawOpen = true;
    
    // Calculate how far to descend (to bottom of bag)
    // Get the actual bag bounds from the MaterialBag
    const gameScene = this.scene as any;
    const materialBag = gameScene.materialBag;
    const bagBounds = materialBag.getBounds();
    const bagBottom = bagBounds.y + bagBounds.height - 10; // 10px margin from bottom
    
    const targetCableLength = bagBottom - this.y;
    const clampedLength = Math.min(targetCableLength, this.maxCableLength);
    
    // Debug: Show descent calculations
    console.log('Crane descent debug:');
    console.log('  Crane Y position:', this.y);
    console.log('  Bag bounds:', bagBounds);
    console.log('  Bag bottom calculated:', bagBottom);
    console.log('  Target cable length:', targetCableLength);
    console.log('  Max cable length:', this.maxCableLength);
    console.log('  Clamped length (final):', clampedLength);
    
    // Animate cable extension to bag bottom with subtle natural movement
    this.scene.tweens.add({
      targets: this,
      cableLength: clampedLength,
      duration: 1200, // Slower for more controlled movement
      ease: 'Back.easeOut', // Gentle overshoot (up slightly, then down)
      onUpdate: () => {
        this.updateCranePosition();
        this.checkForMaterialCollisionDuringDescent();
      },
      onComplete: () => {
        this.checkForMaterialGrab();
      }
    });
    
    return true;
  }
  
  private checkForMaterialCollisionDuringDescent() {
    if (!this.isDescending) return;
    
    const clawWorldPos = this.getClawWorldPosition();
    const contactRadius = 28; // Increased to better match material size and prevent passing through
    
    // Get all materials in the scene
    const materials = this.scene.children.list.filter(child => 
      child instanceof Material
    ) as Material[];
    
    // Check if claw tip is actually touching any material
    materials.forEach(material => {
      const distance = Phaser.Math.Distance.Between(
        clawWorldPos.x, clawWorldPos.y,
        material.x, material.y
      );
      
      if (distance < contactRadius) {
        // Stop descent - we're in contact with a material
        this.scene.tweens.killTweensOf(this);
        this.checkForMaterialGrab();
      }
    });
  }
  
  private checkForMaterialGrab() {
    if (!this.isDescending) return;
    
    const clawWorldPos = this.getClawWorldPosition();
    const grabRadius = 29; // Increased to match contact radius for better collision detection
    
    // Get all materials in the scene
    const materials = this.scene.children.list.filter(child => 
      child instanceof Material
    ) as Material[];
    
    // Find closest material within grab radius
    let closestMaterial: Material | null = null;
    let closestDistance = grabRadius;
    
    materials.forEach(material => {
      const distance = Phaser.Math.Distance.Between(
        clawWorldPos.x, clawWorldPos.y,
        material.x, material.y
      );
      
      if (distance < closestDistance) {
        closestMaterial = material;
        closestDistance = distance;
      }
    });
    
    if (closestMaterial) {
      this.grabMaterial(closestMaterial);
      // Pause briefly after grabbing, then ascend
      this.scene.time.delayedCall(150, () => {
        this.startAscent();
      });
    } else {
      // No material found, ascend immediately (faster)
      this.startAscent();
    }
  }
  
  private grabMaterial(material: Material) {
    this.grabbedMaterial = material;
    this.clawOpen = false;
    
    // Mark material as being grabbed to exclude from collisions
    material.isBeingGrabbed = true;
    
    // Completely disable physics for grabbed material
    const body = material.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.setImmovable(true);
    body.enable = false; // Disable physics body entirely
    
    // Remove from materials group during transport
    const gameScene = material.scene as any;
    if (gameScene.getMaterialsGroup) {
      gameScene.getMaterialsGroup().remove(material);
    }
    
    this.updateCranePosition();
  }
  
  private startAscent() {
    this.isDescending = false;
    this.isAscending = true;
    
    // Determine ascent speed based on whether we grabbed something
    const hasGrabbedMaterial = this.grabbedMaterial !== null;
    const ascentDuration = hasGrabbedMaterial ? 1000 : 600; // Faster when empty
    
    // Animate cable retraction with subtle natural movement
    this.scene.tweens.add({
      targets: this,
      cableLength: 20,
      duration: ascentDuration,
      ease: 'Back.easeOut', // Gentle overshoot (down slightly, then up)
      onUpdate: () => {
        this.updateCranePosition();
        
        // Move grabbed material with claw
        if (this.grabbedMaterial) {
          const clawWorldPos = this.getClawWorldPosition();
          this.grabbedMaterial.setPosition(clawWorldPos.x, clawWorldPos.y);
        }
      },
      onComplete: () => {
        this.completeCraneAction();
      }
    });
  }
  
  private completeCraneAction() {
    this.isAscending = false;
    
    // Emit event with grabbed material
    if (this.grabbedMaterial) {
      // Clear the grabbed flag before emitting the event
      this.grabbedMaterial.isBeingGrabbed = false;
      this.scene.events.emit('materialGrabbed', this.grabbedMaterial);
    }
    
    this.scene.events.emit('craneActionComplete');
    
    // Reset for next use
    this.grabbedMaterial = null;
    this.clawOpen = true;
    
    // Resume swinging
    this.isSwinging = true;
    
    this.updateCranePosition();
  }
  
  public getClawWorldPosition(): { x: number; y: number } {
    const armPosition = Math.sin(this.currentSwingAngle) * this.swingRange;
    return {
      x: this.x + armPosition,
      y: this.y + this.cableLength
    };
  }
  
  public isActive(): boolean {
    return this.isDescending || this.isAscending;
  }
  
  public getCurrentSwingPosition(): number {
    return Math.sin(this.currentSwingAngle) * this.swingRange;
  }
  
  public getSwingProgress(): number {
    // Returns 0-1 representing position in swing cycle
    return (this.currentSwingAngle % (Math.PI * 2)) / (Math.PI * 2);
  }
}