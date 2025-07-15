import Phaser from 'phaser';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  assetKey: string;
  type: 'spell' | 'upgrade' | 'potion';
  purchased: boolean;
}

export interface ShopSceneData {
  fromScene: string;
  shopItems: ShopItem[];
  playerSaltCrystals: number;
  currentNodeId?: string;
}

export class ShopScene extends Phaser.Scene {
  private sceneData: ShopSceneData | null = null;
  
  // UI Layers
  private backgroundLayer!: Phaser.GameObjects.Container;
  private characterLayer!: Phaser.GameObjects.Container;
  private itemsLayer!: Phaser.GameObjects.Container;
  private clawLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;
  private popupLayer!: Phaser.GameObjects.Container;
  
  // Shop Items
  private shopItems: ShopItem[] = [];
  private itemSlots: Phaser.GameObjects.Container[] = [];
  private exitButton!: Phaser.GameObjects.Container;
  
  // Claw Selection
  private claw!: Phaser.GameObjects.Image;
  private currentSelection: number = 0; // 0-2 for items, 3 for exit
  private maxSelections: number = 4; // 3 items + 1 exit
  
  // Claw Oscillation
  private isClawOscillating: boolean = true;
  private clawSwingSpeed: number = 0.01; 
  private currentClawAngle: number = 0;
  private clawY: number = 0; // Fixed Y position
  private clawMinX: number = 0; // Left boundary
  private clawMaxX: number = 0; // Right boundary
  
  // Currency Display
  private saltCrystalDisplay!: Phaser.GameObjects.Text;
  private saltCrystalIcon!: Phaser.GameObjects.Image;
  
  // Confirmation Popup
  private confirmationPopup!: Phaser.GameObjects.Container;
  private confirmationClaw!: Phaser.GameObjects.Image;
  private confirmationText!: Phaser.GameObjects.Text;
  private confirmationDescription!: Phaser.GameObjects.Text;
  private confirmationSelection: number = 0; // 0 for NO, 1 for YES
  private isConfirmationActive: boolean = false;
  
  // Confirmation Claw Oscillation
  private confirmationClawOscillating: boolean = false;
  private confirmationClawSpeed: number = 0.02;
  private confirmationClawAngle: number = 0;
  private confirmationClawY: number = 0;
  private confirmationClawMinX: number = 0;
  private confirmationClawMaxX: number = 0;
  
  // Input
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  
  constructor() {
    super({ key: 'ShopScene' });
  }
  
  init(data: ShopSceneData) {
    this.sceneData = data;
    this.shopItems = data.shopItems;
    this.currentSelection = 0;
    this.confirmationSelection = 0;
    this.isConfirmationActive = false;
    
    console.log('ShopScene: Initialized with', this.shopItems.length, 'items');
  }
  
  preload() {
    // Load shop assets
    this.load.image('shop_bg', 'src/assets/screens/wiz_screen_shop.png');
    this.load.image('shop_keeper', 'src/assets/characters/wiz_character_kitar.png');
    
    // Load shop items
    this.load.image('item_scroll', 'src/assets/ui/wiz_item_scroll.png');
    this.load.image('item_quill', 'src/assets/ui/wiz_item_quill.png');
    this.load.image('item_potion', 'src/assets/ui/wiz_item_potion.png');
    
    // Load claw (use materials claw)
    this.load.image('claw', 'src/assets/ui/wiz_ui_claw_materials.png');
    
    // Load salt crystal icon
    this.load.image('salt_crystal', 'src/assets/ui/wiz_ui_salt.png');
    
    console.log('ShopScene: Assets loaded');
  }
  
  create() {
    // Create layers
    this.createLayers();
    
    // Setup input
    this.setupInput();
    
    // Create shop background and keeper
    this.createShopBackground();
    
    // Create currency display
    this.createCurrencyDisplay();
    
    // Create item slots
    this.createItemSlots();
    
    // Create claw
    this.createClaw();
    
    // Create confirmation popup (hidden initially)
    this.createConfirmationPopup();
    
    // Setup claw boundaries
    this.setupClawBoundaries();
    
    console.log('ShopScene: Scene created');
  }
  
  private createLayers() {
    this.backgroundLayer = this.add.container(0, 0).setDepth(-100);
    this.characterLayer = this.add.container(0, 0).setDepth(0);
    this.itemsLayer = this.add.container(0, 0).setDepth(10);
    this.clawLayer = this.add.container(0, 0).setDepth(20);
    this.uiLayer = this.add.container(0, 0).setDepth(50);
    this.popupLayer = this.add.container(0, 0).setDepth(100);
  }
  
  private setupInput() {
    this.leftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Only spacebar is used - claw moves automatically
    this.spaceKey.on('down', () => this.selectItem());
  }
  
  private createShopBackground() {
    // Background
    const background = this.add.image(0, 0, 'shop_bg');
    background.setOrigin(0, 0);
    background.setDisplaySize(this.scale.width, this.scale.height);
    this.backgroundLayer.add(background);
    
    // Shop keeper
    const shopKeeper = this.add.image(this.scale.width / 6 - 20 - 30, this.scale.height / 2 + 150, 'shop_keeper');
    shopKeeper.setOrigin(0.5, 0.5);
    shopKeeper.setScale(1.0); // Increased from 0.8 to 1.0 (25% bigger)
    this.characterLayer.add(shopKeeper);
    
    // Shop title
    const shopTitle = this.add.text(this.scale.width / 2, 50, 'Traveling Merchant', {
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.uiLayer.add(shopTitle);
  }
  
  private createCurrencyDisplay() {
    if (!this.sceneData) return;
    
    const currencyX = this.scale.width - 120;
    const currencyY = 50;
    
    // Create UI box background
    const boxGraphics = this.add.graphics();
    boxGraphics.fillStyle(0x000000, 0.7); // Dark background
    boxGraphics.fillRoundedRect(currencyX - 60, currencyY - 25, 120, 50, 10);
    boxGraphics.lineStyle(2, 0xffd700, 1); // Gold border
    boxGraphics.strokeRoundedRect(currencyX - 60, currencyY - 25, 120, 50, 10);
    this.uiLayer.add(boxGraphics);
    
    // Salt crystal icon (60% smaller)
    this.saltCrystalIcon = this.add.image(currencyX - 25, currencyY, 'salt_crystal');
    this.saltCrystalIcon.setScale(0.2); // Reduced from 0.5 to 0.2 (60% smaller)
    this.uiLayer.add(this.saltCrystalIcon);
    
    // Salt crystal amount
    this.saltCrystalDisplay = this.add.text(currencyX + 5, currencyY, this.sceneData.playerSaltCrystals.toString(), {
      fontSize: '18px', // Reduced from 24px
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.uiLayer.add(this.saltCrystalDisplay);
  }
  
  private createItemSlots() {
    const startX = this.scale.width / 2 - 300 + 50; // Moved right by 50px
    const slotY = this.scale.height / 2 - 140; // Moved up by 170px + 50px more - 10px down + 10px down
    const slotSpacing = 200;
    
    // Create 3 item slots
    for (let i = 0; i < 3; i++) {
      const slotX = startX + (i * slotSpacing);
      const slot = this.add.container(slotX, slotY);
      
      // Slot background (170px height)
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x8B4513, 0.3);
      slotBg.fillRoundedRect(-75, -75, 150, 170, 10);
      slotBg.lineStyle(2, 0x8B4513);
      slotBg.strokeRoundedRect(-75, -75, 150, 170, 10);
      slot.add(slotBg);
      
      // Add item if it exists and isn't purchased
      if (i < this.shopItems.length && !this.shopItems[i].purchased) {
        const item = this.shopItems[i];
        
        // Item sprite
        const itemSprite = this.add.image(0, -20 - 20, item.assetKey); // Moved up 20px
        itemSprite.setScale(0.25); // Reduced scale to fit better in 150x150 slot
        slot.add(itemSprite);
        
        // Item price box
        const priceBoxY = 50; // Moved down 15px from 35
        const priceBoxWidth = 70;
        const priceBoxHeight = 20;
        
        // Price box background
        const priceBoxGraphics = this.add.graphics();
        priceBoxGraphics.fillStyle(0x000000, 0.7); // Dark background
        priceBoxGraphics.fillRoundedRect(-priceBoxWidth/2, priceBoxY - priceBoxHeight/2, priceBoxWidth, priceBoxHeight, 5);
        priceBoxGraphics.lineStyle(1, 0xffd700, 1); // Gold border
        priceBoxGraphics.strokeRoundedRect(-priceBoxWidth/2, priceBoxY - priceBoxHeight/2, priceBoxWidth, priceBoxHeight, 5);
        slot.add(priceBoxGraphics);
        
        // Small salt crystal icon
        const saltIcon = this.add.image(-15, priceBoxY, 'salt_crystal');
        saltIcon.setScale(0.12); // Small icon
        slot.add(saltIcon);
        
        // Item price text
        const priceText = this.add.text(5, priceBoxY, item.price.toString(), {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        slot.add(priceText);
        
        // Item name (moved below price)
        const itemName = this.add.text(0, 80, item.name, {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        slot.add(itemName);
      }
      
      this.itemSlots.push(slot);
      this.itemsLayer.add(slot);
    }
    
    // Create exit button
    const exitX = startX + (3 * slotSpacing);
    this.exitButton = this.add.container(exitX, slotY);
    
    const exitBg = this.add.graphics();
    exitBg.fillStyle(0x8B0000, 0.3);
    exitBg.fillRoundedRect(-75, -75, 150, 170, 10);
    exitBg.lineStyle(2, 0x8B0000);
    exitBg.strokeRoundedRect(-75, -75, 150, 170, 10);
    this.exitButton.add(exitBg);
    
    const exitText = this.add.text(0, 0, 'EXIT', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.exitButton.add(exitText);
    
    this.itemsLayer.add(this.exitButton);
  }
  
  private createClaw() {
    this.claw = this.add.image(0, 0, 'claw');
    this.claw.setScale(0.32); // 100% bigger than 0.16 (0.16 * 2 = 0.32)
    this.claw.setRotation(Math.PI); // Rotate 180 degrees
    this.clawLayer.add(this.claw);
  }
  
  private createConfirmationPopup() {
    this.confirmationPopup = this.add.container(this.scale.width / 2, this.scale.height / 2);
    
    // Popup background
    const popupBg = this.add.graphics();
    popupBg.fillStyle(0x000000, 0.8);
    popupBg.fillRoundedRect(-200, -100, 400, 200, 20);
    popupBg.lineStyle(3, 0xffd700);
    popupBg.strokeRoundedRect(-200, -100, 400, 200, 20);
    this.confirmationPopup.add(popupBg);
    
    // Confirmation text
    this.confirmationText = this.add.text(0, -50, 'Purchase this item?', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.confirmationPopup.add(this.confirmationText);
    
    // Item description text
    this.confirmationDescription = this.add.text(0, -20, '', {
      fontSize: '14px',
      color: '#cccccc',
      fontStyle: 'italic',
      wordWrap: { width: 350 }
    }).setOrigin(0.5);
    this.confirmationPopup.add(this.confirmationDescription);
    
    // NO button
    const noButton = this.add.container(-80, 30);
    const noBg = this.add.graphics();
    noBg.fillStyle(0x8B0000, 0.7);
    noBg.fillRoundedRect(-40, -20, 80, 40, 10);
    noBg.lineStyle(2, 0x8B0000);
    noBg.strokeRoundedRect(-40, -20, 80, 40, 10);
    noButton.add(noBg);
    
    const noText = this.add.text(0, 0, 'NO', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    noButton.add(noText);
    this.confirmationPopup.add(noButton);
    
    // YES button
    const yesButton = this.add.container(80, 30);
    const yesBg = this.add.graphics();
    yesBg.fillStyle(0x006400, 0.7);
    yesBg.fillRoundedRect(-40, -20, 80, 40, 10);
    yesBg.lineStyle(2, 0x006400);
    yesBg.strokeRoundedRect(-40, -20, 80, 40, 10);
    yesButton.add(yesBg);
    
    const yesText = this.add.text(0, 0, 'YES', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    yesButton.add(yesText);
    this.confirmationPopup.add(yesButton);
    
    // Confirmation claw (positioned below buttons)
    this.confirmationClaw = this.add.image(0, 140, 'claw'); 
    this.confirmationClaw.setScale(0.25); // 25% larger than 0.2 (0.2 * 1.25 = 0.25)
    this.confirmationClaw.setRotation(Math.PI); // Point up
    this.confirmationPopup.add(this.confirmationClaw);
    
    // Initially hide popup
    this.confirmationPopup.setVisible(false);
    this.popupLayer.add(this.confirmationPopup);
  }
  
  private moveSelection(direction: number) {
    // All movement is automatic now - selections are based on claw positions
    if (this.isConfirmationActive) {
      this.updateConfirmationSelection();
    } else {
      this.updateCurrentSelection();
    }
  }
  
  private selectItem() {
    if (this.isConfirmationActive) {
      this.handleConfirmationSelection();
    } else {
      this.handleMainSelection();
    }
  }
  
  private handleMainSelection() {
    // Update selection based on current claw position
    this.updateCurrentSelection();
    
    if (this.currentSelection === 3) {
      // Exit selected
      this.exitShop();
    } else {
      // Item selected
      const item = this.shopItems[this.currentSelection];
      if (item && !item.purchased) {
        this.showConfirmationPopup(item);
      }
    }
  }
  
  private handleConfirmationSelection() {
    // Update selection based on claw position
    this.updateConfirmationSelection();
    
    if (this.confirmationSelection === 1) {
      // YES selected - purchase item
      this.purchaseItem(this.shopItems[this.currentSelection]);
    }
    // Hide popup regardless of selection
    this.hideConfirmationPopup();
  }
  
  private showConfirmationPopup(item: ShopItem) {
    if (!this.sceneData) return;
    
    // Check if player has enough salt crystals
    if (this.sceneData.playerSaltCrystals < item.price) {
      // Show insufficient funds message
      this.showInsufficientFundsMessage();
      return;
    }
    
    this.isConfirmationActive = true;
    this.confirmationSelection = 0;
    
    // Update confirmation text with item name and description
    this.confirmationText.setText(`Purchase ${item.name}?`);
    this.confirmationDescription.setText(item.description);
    
    this.confirmationPopup.setVisible(true);
    
    // Setup confirmation claw oscillation
    this.confirmationClawOscillating = true;
    this.confirmationClawAngle = 0;
    this.confirmationClawY = 140; // Position below buttons (moved to match line 359)
    this.confirmationClawMinX = -80; // NO button position
    this.confirmationClawMaxX = 80; // YES button position
  }
  
  private hideConfirmationPopup() {
    this.isConfirmationActive = false;
    this.confirmationClawOscillating = false;
    this.confirmationPopup.setVisible(false);
  }
  
  private setupClawBoundaries() {
    // Set Y position below items (moved down 80px)
    this.clawY = this.scale.height / 2 + 50 - 170 + 100 + 80; // Below the item slots
    
    // Set horizontal boundaries to span all items plus exit (moved right by 50px)
    this.clawMinX = this.itemSlots[0].x - 75; // Start before first item
    this.clawMaxX = this.exitButton.x + 75; // End after exit button
  }
  
  private updateCurrentSelection() {
    // Determine which item the claw is currently over
    const currentX = this.claw.x;
    
    // Check each item slot
    for (let i = 0; i < this.itemSlots.length; i++) {
      const slot = this.itemSlots[i];
      if (Math.abs(currentX - slot.x) < 100) { // Within 100px range
        this.currentSelection = i;
        return;
      }
    }
    
    // Check exit button
    if (Math.abs(currentX - this.exitButton.x) < 100) {
      this.currentSelection = 3;
      return;
    }
    
    // Default to first item if no match
    this.currentSelection = 0;
  }
  
  private updateConfirmationSelection() {
    // Determine which option the confirmation claw is over
    const currentX = this.confirmationClaw.x;
    
    if (currentX < 0) {
      this.confirmationSelection = 0; // NO
    } else {
      this.confirmationSelection = 1; // YES
    }
  }
  
  private purchaseItem(item: ShopItem) {
    if (!this.sceneData) return;
    
    // Deduct salt crystals
    this.sceneData.playerSaltCrystals -= item.price;
    this.saltCrystalDisplay.setText(this.sceneData.playerSaltCrystals.toString());
    
    // Mark item as purchased
    item.purchased = true;
    
    // Remove item from display
    this.removeItemFromSlot(this.currentSelection);
    
    // Apply item effects (placeholder for now)
    this.applyItemEffects(item);
    
    console.log(`ShopScene: Purchased ${item.name} for ${item.price} salt crystals`);
  }
  
  private removeItemFromSlot(slotIndex: number) {
    const slot = this.itemSlots[slotIndex];
    // Remove all children except the background (first child)
    const children = slot.getAll();
    for (let i = 1; i < children.length; i++) {
      (children[i] as Phaser.GameObjects.GameObject).destroy();
    }
    slot.removeAll(true);
    
    // Re-add just the background
    const slotBg = this.add.graphics();
    slotBg.fillStyle(0x8B4513, 0.3);
    slotBg.fillRoundedRect(-75, -75, 150, 170, 10);
    slotBg.lineStyle(2, 0x8B4513);
    slotBg.strokeRoundedRect(-75, -75, 150, 170, 10);
    slot.add(slotBg);
  }
  
  private applyItemEffects(item: ShopItem) {
    // TODO: Implement item effects
    // This will be implemented later when we integrate with player systems
    console.log(`ShopScene: Applied effects for ${item.name}`);
  }
  
  private showInsufficientFundsMessage() {
    // Create temporary message
    const message = this.add.text(this.scale.width / 2, this.scale.height / 2 - 150, 'Insufficient Salt Crystals!', {
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.uiLayer.add(message);
    
    // Remove message after 2 seconds
    this.time.delayedCall(2000, () => {
      message.destroy();
    });
  }
  
  private exitShop() {
    console.log('ShopScene: Exiting shop');
    
    // Determine which scene to return to
    const returnScene = this.sceneData?.fromScene || 'MapScene';
    
    // Prepare data to pass back to map scene
    const returnData = {
      currentNodeId: this.sceneData?.currentNodeId
    };
    
    // Fade out and return to previous scene
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.stop('ShopScene');
      this.scene.start(returnScene, returnData);
    });
  }
  
  update() {
    // Handle main claw oscillation across all items
    if (this.isClawOscillating && !this.isConfirmationActive) {
      // Pendulum-like movement across full range
      this.currentClawAngle += this.clawSwingSpeed;
      
      // Reset angle to prevent overflow
      if (this.currentClawAngle >= Math.PI * 2) {
        this.currentClawAngle -= Math.PI * 2;
      }
      
      // Calculate position across full range using sine wave
      const sineValue = Math.sin(this.currentClawAngle);
      const normalizedPosition = (sineValue + 1) / 2; // Convert to 0-1 range
      
      // Map to horizontal range
      const clawX = this.clawMinX + (normalizedPosition * (this.clawMaxX - this.clawMinX));
      
      // Update claw position
      this.claw.setPosition(clawX, this.clawY);
      
      // Update selection based on current position
      this.updateCurrentSelection();
    }
    
    // Handle confirmation claw oscillation
    if (this.confirmationClawOscillating && this.isConfirmationActive) {
      // Pendulum-like movement between NO and YES
      this.confirmationClawAngle += this.confirmationClawSpeed;
      
      // Reset angle to prevent overflow
      if (this.confirmationClawAngle >= Math.PI * 2) {
        this.confirmationClawAngle -= Math.PI * 2;
      }
      
      // Calculate position between NO and YES using sine wave
      const sineValue = Math.sin(this.confirmationClawAngle);
      const normalizedPosition = (sineValue + 1) / 2; // Convert to 0-1 range
      
      // Map to horizontal range between NO and YES
      const clawX = this.confirmationClawMinX + (normalizedPosition * (this.confirmationClawMaxX - this.confirmationClawMinX));
      
      // Update confirmation claw position
      this.confirmationClaw.setPosition(clawX, this.confirmationClawY);
      
      // Update selection based on current position
      this.updateConfirmationSelection();
    }
  }
  
  shutdown() {
    console.log('ShopScene: Shutting down');
    
    // Clean up
    this.itemSlots = [];
    this.shopItems = [];
    this.sceneData = null;
    this.currentSelection = 0;
    this.confirmationSelection = 0;
    this.isConfirmationActive = false;
  }
}