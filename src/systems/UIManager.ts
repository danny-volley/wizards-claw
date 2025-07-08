export class UIManager {
  private scene: Phaser.Scene;
  private baseWidth: number = 1280;
  private baseHeight: number = 720;
  private scaleX: number = 1;
  private scaleY: number = 1;
  
  // UI Containers
  private backgroundLayer!: Phaser.GameObjects.Container;
  private gameAreaLayer!: Phaser.GameObjects.Container;
  private overlayLayer!: Phaser.GameObjects.Container;
  
  // UI Components
  private backgroundImage!: Phaser.GameObjects.Image;
  private robeOverlay!: Phaser.GameObjects.Image;
  private materialBagContainer!: Phaser.GameObjects.Container;
  private materialSlotsContainer!: Phaser.GameObjects.Container;
  private spellWindowContainer!: Phaser.GameObjects.Container;
  private craneContainer!: Phaser.GameObjects.Container;
  private characterAreaContainer!: Phaser.GameObjects.Container;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.calculateScale();
    this.createLayers();
  }
  
  private calculateScale(): void {
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;
    
    this.scaleX = gameWidth / this.baseWidth;
    this.scaleY = gameHeight / this.baseHeight;
    
    console.log(`UIManager: Scaling from ${this.baseWidth}x${this.baseHeight} to ${gameWidth}x${gameHeight}`);
    console.log(`Scale factors: X=${this.scaleX.toFixed(2)}, Y=${this.scaleY.toFixed(2)}`);
  }
  
  private createLayers(): void {
    // Create main layers in rendering order
    this.backgroundLayer = this.scene.add.container(0, 0).setDepth(-100);
    this.gameAreaLayer = this.scene.add.container(0, 0).setDepth(0);
    this.overlayLayer = this.scene.add.container(0, 0).setDepth(100);
    
    console.log('UIManager: Created UI layers');
  }
  
  public createBackground(): void {
    console.log('UIManager: Creating background');
    
    // Load and position background image
    this.backgroundImage = this.scene.add.image(0, 0, 'background');
    
    // Scale background to fill screen while maintaining aspect ratio
    const bgScaleX = this.scene.scale.width / this.backgroundImage.width;
    const bgScaleY = this.scene.scale.height / this.backgroundImage.height;
    const bgScale = Math.max(bgScaleX, bgScaleY);
    
    this.backgroundImage.setScale(bgScale);
    this.backgroundImage.setOrigin(0, 0);
    
    this.backgroundLayer.add(this.backgroundImage);
    
    console.log(`Background scaled by ${bgScale.toFixed(2)} to cover ${this.scene.scale.width}x${this.scene.scale.height}`);
  }
  
  public createRobeOverlay(): void {
    console.log('UIManager: Creating robe overlay');
    
    // Load robe overlay image
    this.robeOverlay = this.scene.add.image(0, 0, 'robe');
    
    // Scale to full screen height
    const targetHeight = this.scene.scale.height;
    const robeScale = targetHeight / this.robeOverlay.height;
    
    // Position to extend 8% more to the left from right edge
    const scaledWidth = this.robeOverlay.width * robeScale;
    const robeX = this.scene.scale.width - (scaledWidth * 0.5) + (this.scene.scale.width * 0.08);
    const robeY = this.scene.scale.height * 0.5;
    
    this.robeOverlay.setScale(robeScale);
    this.robeOverlay.setPosition(robeX, robeY);
    
    // Add to background layer but above the main background
    this.backgroundLayer.add(this.robeOverlay);
    this.robeOverlay.setDepth(this.backgroundImage.depth + 1);
    
    console.log(`Robe overlay scaled by ${robeScale.toFixed(2)} and positioned at (${robeX.toFixed(0)}, ${robeY.toFixed(0)})`);
  }
  
  public createMaterialBag(x: number, y: number): Phaser.GameObjects.Container {
    console.log(`UIManager: Creating material bag at (${x}, ${y})`);
    
    this.materialBagContainer = this.scene.add.container(
      x * this.scaleX, 
      y * this.scaleY
    );
    
    // Add bag artwork - scale to match physics area dimensions (160x120)
    const bagImage = this.scene.add.image(0, 0, 'bag');
    
    // Calculate scale to match physics area size (160x120)
    const targetWidth = 160;
    const targetHeight = 120;
    const scaleX = targetWidth / bagImage.width;
    const scaleY = targetHeight / bagImage.height;
    
    // Use the smaller scale to maintain aspect ratio while fitting within physics area
    // Add much more scale since the bag asset doesn't fill the image frame
    const bagScale = Math.min(scaleX, scaleY) * 2.2;
    bagImage.setScale(bagScale);
    
    // Debug logging
    console.log(`Bag image dimensions: ${bagImage.width}x${bagImage.height}`);
    console.log(`Physics area dimensions: ${targetWidth}x${targetHeight}`);
    console.log(`Calculated scale: ${bagScale}`);
    console.log(`Final scaled size: ${bagImage.width * bagScale}x${bagImage.height * bagScale}`);
    
    this.materialBagContainer.add(bagImage);
    
    this.gameAreaLayer.add(this.materialBagContainer);
    
    return this.materialBagContainer;
  }
  
  public createMaterialSlots(x: number, y: number): Phaser.GameObjects.Container {
    console.log(`UIManager: Creating material slots at (${x}, ${y})`);
    
    this.materialSlotsContainer = this.scene.add.container(
      x * this.scaleX, 
      y * this.scaleY
    );
    
    // Add pouch artwork
    const pouchImage = this.scene.add.image(0, 18, 'pouch'); // Moved down 18px (back up 12px from 30px)
    pouchImage.setScale(this.scaleX * 0.35, this.scaleY * 0.35); // 40% bigger than previous 25% size
    this.materialSlotsContainer.add(pouchImage);
    
    this.gameAreaLayer.add(this.materialSlotsContainer);
    
    return this.materialSlotsContainer;
  }
  
  public createSpellWindow(x: number, y: number): Phaser.GameObjects.Container {
    console.log(`UIManager: Creating spell window at (${x}, ${y})`);
    
    this.spellWindowContainer = this.scene.add.container(
      x * this.scaleX, 
      y * this.scaleY
    );
    
    // Add scroll artwork - will be sized dynamically when spells are drawn
    const scrollImage = this.scene.add.image(0, 0, 'scroll');
    this.spellWindowContainer.add(scrollImage);
    
    // Add "Spells" header text - positioned to center on the spell window width
    const headerText = this.scene.add.text(150, -80, 'Spells', {
      fontSize: '24px',
      color: '#000000',
      fontStyle: 'bold',
      align: 'center'
    });
    headerText.setOrigin(0.5, 0.5); // Center the text
    this.spellWindowContainer.add(headerText);
    
    this.gameAreaLayer.add(this.spellWindowContainer);
    
    return this.spellWindowContainer;
  }
  
  public updateSpellWindowSize(width: number, height: number, startY: number): void {
    if (!this.spellWindowContainer) return;
    
    // Get the scroll image from the container
    const scrollImage = this.spellWindowContainer.list[0] as Phaser.GameObjects.Image;
    if (!scrollImage) return;
    
    // Use the passed width parameter and add height for padding
    const scrollWidth = width * 1.4; // Make 40% wider since art doesn't fill entire size and spells extend out
    const scrollHeight = height + 220; // Slightly taller to accommodate larger text
    
    // Scale scroll to match the actual spell window dimensions
    const scaleX = (scrollWidth / scrollImage.width) * this.scaleX;
    const scaleY = (scrollHeight / scrollImage.height) * this.scaleY;
    scrollImage.setScale(scaleX, scaleY);
    
    // Position scroll to be centered within the spell window container
    // The container is already positioned at the correct spellWindowX location
    // Center the scroll on the original width, not the expanded width
    const scrollCenterX = (width * 0.5) * this.scaleX; // Center on original spell window width
    const scrollCenterY = (startY + height * 0.5 - 200 + 20) * this.scaleY; // Center vertically on spell area
    
    scrollImage.setPosition(scrollCenterX, scrollCenterY);
    
    console.log(`Scroll resized to ${scrollWidth}x${scrollHeight} and positioned at (${scrollCenterX}, ${scrollCenterY})`);
  }
  
  public createCrane(x: number, y: number): Phaser.GameObjects.Container {
    console.log(`UIManager: Creating crane at (${x}, ${y})`);
    
    this.craneContainer = this.scene.add.container(
      x * this.scaleX, 
      y * this.scaleY
    );
    
    // Add crane artwork
    const craneImage = this.scene.add.image(0, 0, 'claw');
    craneImage.setScale(this.scaleX, this.scaleY);
    this.craneContainer.add(craneImage);
    
    this.gameAreaLayer.add(this.craneContainer);
    
    return this.craneContainer;
  }
  
  public createCharacterArea(x: number, y: number): Phaser.GameObjects.Container {
    console.log(`UIManager: Creating character area at (${x}, ${y})`);
    
    this.characterAreaContainer = this.scene.add.container(
      x * this.scaleX, 
      y * this.scaleY
    );
    
    this.gameAreaLayer.add(this.characterAreaContainer);
    
    return this.characterAreaContainer;
  }
  
  // Utility methods for repositioning elements
  public moveElement(container: Phaser.GameObjects.Container, x: number, y: number): void {
    container.setPosition(x * this.scaleX, y * this.scaleY);
  }
  
  public scaleElement(container: Phaser.GameObjects.Container, scale: number): void {
    container.setScale(scale * this.scaleX, scale * this.scaleY);
  }
  
  // Convert screen coordinates to base coordinates
  public screenToBase(screenX: number, screenY: number): { x: number, y: number } {
    return {
      x: screenX / this.scaleX,
      y: screenY / this.scaleY
    };
  }
  
  // Convert base coordinates to screen coordinates
  public baseToScreen(baseX: number, baseY: number): { x: number, y: number } {
    return {
      x: baseX * this.scaleX,
      y: baseY * this.scaleY
    };
  }
  
  // Getters for UI containers
  public getMaterialBagContainer(): Phaser.GameObjects.Container {
    return this.materialBagContainer;
  }
  
  public getSpellWindowContainer(): Phaser.GameObjects.Container {
    return this.spellWindowContainer;
  }
  
  public getCraneContainer(): Phaser.GameObjects.Container {
    return this.craneContainer;
  }
  
  public getCharacterAreaContainer(): Phaser.GameObjects.Container {
    return this.characterAreaContainer;
  }
  
  public getOverlayLayer(): Phaser.GameObjects.Container {
    return this.overlayLayer;
  }
  
  public getRobeOverlay(): Phaser.GameObjects.Image {
    return this.robeOverlay;
  }
  
  // Animation methods for robe and UI elements
  public animateRobeIn(duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      if (!this.robeOverlay) {
        resolve();
        return;
      }
      
      // Start off-screen to the right
      const startX = this.scene.scale.width + (this.robeOverlay.displayWidth * 0.5);
      const targetX = this.scene.scale.width - (this.robeOverlay.displayWidth * 0.5);
      
      this.robeOverlay.setX(startX);
      
      this.scene.tweens.add({
        targets: this.robeOverlay,
        x: targetX,
        duration: duration,
        ease: 'Power2.easeOut',
        onComplete: () => resolve()
      });
    });
  }
  
  public animateRobeOut(duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      if (!this.robeOverlay) {
        resolve();
        return;
      }
      
      const targetX = this.scene.scale.width + (this.robeOverlay.displayWidth * 0.5);
      
      this.scene.tweens.add({
        targets: this.robeOverlay,
        x: targetX,
        duration: duration,
        ease: 'Power2.easeIn',
        onComplete: () => resolve()
      });
    });
  }
  
  // Group animate robe with bag and spell window
  public animateUIGroup(direction: 'in' | 'out', duration: number = 500): Promise<void> {
    const elements = [this.robeOverlay, this.materialBagContainer, this.spellWindowContainer].filter(Boolean);
    
    return new Promise((resolve) => {
      if (elements.length === 0) {
        resolve();
        return;
      }
      
      const startOffsetX = direction === 'in' ? this.scene.scale.width : -this.scene.scale.width;
      const targetOffsetX = direction === 'in' ? 0 : this.scene.scale.width;
      
      if (direction === 'in') {
        elements.forEach(element => {
          const currentX = element.x;
          element.setX(currentX + startOffsetX);
        });
      }
      
      this.scene.tweens.add({
        targets: elements,
        x: direction === 'in' ? (target: any) => target.x - startOffsetX : (target: any) => target.x + targetOffsetX,
        duration: duration,
        ease: direction === 'in' ? 'Power2.easeOut' : 'Power2.easeIn',
        onComplete: () => resolve()
      });
    });
  }
  
  // Handle screen resize
  public onResize(): void {
    this.calculateScale();
    // TODO: Reposition all elements based on new scale
    console.log('UIManager: Screen resized, recalculating layout');
  }
}