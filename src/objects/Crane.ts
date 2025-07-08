import { Material } from './Material';

export class Crane extends Phaser.GameObjects.Container {
  private arm: Phaser.GameObjects.Graphics;
  private claw: Phaser.GameObjects.Graphics;
  private cable: Phaser.GameObjects.Graphics;
  
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
  private maxCableLength: number = 180;
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
    // Create arm (horizontal bar)
    this.arm = this.scene.add.graphics();
    this.arm.lineStyle(4, 0x666666);
    this.arm.lineBetween(-this.swingRange, 0, this.swingRange, 0);
    this.add(this.arm);
    
    // Create cable
    this.cable = this.scene.add.graphics();
    this.add(this.cable);
    
    // Create claw
    this.claw = this.scene.add.graphics();
    this.add(this.claw);
    
    this.updateCranePosition();
  }
  
  private updateCranePosition() {
    // Calculate current position along the arm
    const armPosition = Math.sin(this.currentSwingAngle) * this.swingRange;
    
    // Update cable
    this.cable.clear();
    this.cable.lineStyle(2, 0x444444);
    this.cable.lineBetween(armPosition, 0, armPosition, this.cableLength);
    
    // Update claw
    this.claw.clear();
    this.claw.setPosition(armPosition, this.cableLength);
    
    if (this.clawOpen) {
      // Open claw
      this.claw.lineStyle(3, 0x888888);
      this.claw.lineBetween(-8, 0, -3, 8);
      this.claw.lineBetween(8, 0, 3, 8);
      this.claw.lineBetween(-3, 8, 3, 8);
    } else {
      // Closed claw
      this.claw.lineStyle(3, 0x888888);
      this.claw.lineBetween(-5, 0, 0, 8);
      this.claw.lineBetween(5, 0, 0, 8);
      this.claw.fillStyle(0x666666);
      this.claw.fillCircle(0, 8, 3);
    }
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
    const targetCableLength = this.bagBottomY - this.y + 10;
    const clampedLength = Math.min(targetCableLength, this.maxCableLength);
    
    // Animate cable extension to bag bottom (faster descent)
    this.scene.tweens.add({
      targets: this,
      cableLength: clampedLength,
      duration: 600, // Half the previous duration for 2x speed
      ease: 'Power2.easeOut',
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
    const contactRadius = 15; // Only stop when actually touching a material (slightly larger than material radius)
    
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
    const grabRadius = 16; // Just slightly larger than material radius for precise grabbing
    
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
    }
    
    this.startAscent();
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
    
    // Animate cable retraction
    this.scene.tweens.add({
      targets: this,
      cableLength: 20,
      duration: 800,
      ease: 'Power2.easeIn',
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