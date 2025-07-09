import Phaser from 'phaser';
import { InputSystem } from '../systems/InputSystem';
import { MaterialBag } from '../objects/MaterialBag';
import { MaterialSlots } from '../objects/MaterialSlots';
import { Crane } from '../objects/Crane';
import { Material, MaterialType } from '../objects/Material';
import { SpellArrow } from '../systems/SpellArrow';
import { SpellDatabase, SpellRecipe } from '../systems/SpellDatabase';
import { SpellEffectsSystem } from '../systems/SpellEffectsSystem';
import { RecipeHintSystem } from '../systems/RecipeHintSystem';
import { UIManager } from '../systems/UIManager';
import { EncounterManager } from '../systems/EncounterManager';
import { EncounterResultWindow } from '../ui/EncounterResultWindow';
import { EncounterResult } from '../encounters/BaseEncounter';
import { EnemyData } from '../data/EnemyData';
import { CampfireManager } from '../systems/CampfireManager';

export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private materialBag!: MaterialBag;
  private materialSlots!: MaterialSlots;
  private crane!: Crane;
  private spellArrow!: SpellArrow;
  private gameState: 'selecting' | 'casting' | 'processing' = 'selecting';
  private materialsGroup!: Phaser.Physics.Arcade.Group;
  private spellModeText: Phaser.GameObjects.Text | null = null;
  private availableSpells: SpellRecipe[] = [];
  private globalSettleTimer: number = 0;
  private materialsAreFrozen: boolean = false;
  private lastMaterialDropTime: number = 0;
  private spellEffectsSystem!: SpellEffectsSystem;
  private recipeHintSystem!: RecipeHintSystem;
  private uiManager!: UIManager;
  private spellWindowX!: number;
  private spellDisplayElements: Phaser.GameObjects.GameObject[] = []; // Track spell elements for clearing
  
  // Encounter system
  private encounterManager!: EncounterManager;
  private encounterResultWindow!: EncounterResultWindow;
  private currentEnemyImage: Phaser.GameObjects.Image | null = null;
  private turnIndicatorText: Phaser.GameObjects.Text | null = null;
  
  // Campfire system
  private campfireManager!: CampfireManager;
  private campfireDebugButton!: Phaser.GameObjects.Container;
  
  // Map system
  private mapDebugButton!: Phaser.GameObjects.Container;
  
  // Health bar components
  private enemyHealthBack!: Phaser.GameObjects.Image;
  private enemyHealthFront!: Phaser.GameObjects.Image;
  private enemyHealthText!: Phaser.GameObjects.Text;
  private enemyHealthNumber!: Phaser.GameObjects.Text;
  private playerHealthBack!: Phaser.GameObjects.Image;
  private playerHealthFront!: Phaser.GameObjects.Image;
  private playerHealthText!: Phaser.GameObjects.Text;
  private playerHealthNumber!: Phaser.GameObjects.Text;
  
  // Health values
  private enemyMaxHealth: number = 100;
  private enemyCurrentHealth: number = 100;
  private playerMaxHealth: number = 100;
  private playerCurrentHealth: number = 100;
  
  // Spell window dimensions - shared constants
  private readonly SPELL_WINDOW_WIDTH = 300;
  private readonly SPELL_WINDOW_PADDING = 20;
  private readonly SPELL_ITEM_WIDTH = this.SPELL_WINDOW_WIDTH - (this.SPELL_WINDOW_PADDING * 2);
  
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load UI assets
    this.load.image('background', 'src/assets/screens/wiz_screen_background.png');
    this.load.image('robe', 'src/assets/ui/wiz_ui_robe.png');
    this.load.image('bag', 'src/assets/ui/wiz_ui_bag.png');
    this.load.image('pouch', 'src/assets/ui/wiz_ui_pouch.png');
    this.load.image('slot', 'src/assets/ui/wiz_ui_slot.png');
    this.load.image('scroll', 'src/assets/ui/wiz_ui_scroll.png');
    
    // Load material assets
    this.load.image('material_fire', 'src/assets/ui/wiz_material_fire.png');
    this.load.image('material_leaf', 'src/assets/ui/wiz_material_leaf.png');
    this.load.image('material_rock', 'src/assets/ui/wiz_material_rock.png');
    
    // Load small material icons for spell lists
    this.load.image('material_fire_small', 'src/assets/ui/wiz_material_fire_small.png');
    this.load.image('material_leaf_small', 'src/assets/ui/wiz_material_leaf_small.png');
    this.load.image('material_rock_small', 'src/assets/ui/wiz_material_rock_small.png');
    
    // Load Gather spell icon
    this.load.image('gather_icon', 'src/assets/ui/wiz_ui_gather.png');
    this.load.image('claw', 'src/assets/ui/wiz_ui_claw_materials.png');
    this.load.image('claw_spells', 'src/assets/ui/wiz_ui_claw_spells.png');
    
    // Load character assets
    this.load.image('char_burok', 'src/assets/characters/wiz_char_burok.png');
    this.load.image('char_yuvor', 'src/assets/characters/wiz_char_yuvor.png');
    
    // Load enemy assets
    this.load.image('battle_lizard', 'src/assets/enemies/wiz_battle_lizard.png');
    this.load.image('battle_fox', 'src/assets/enemies/wiz_battle_fox.png');
    this.load.image('battle_crane', 'src/assets/enemies/wiz_battle_crane.png');
    
    // Load health bar assets
    this.load.image('health_back', 'src/assets/ui/wiz_ui_health_back.png');
    this.load.image('health_front', 'src/assets/ui/wiz_ui_health_front.png');
    
    console.log('GameScene: Loading UI assets');
  }

  create(data?: any) {
    console.log('GameScene create() started');
    
    try {
      // Initialize spell database
      SpellDatabase.initialize();
      console.log('SpellDatabase initialized');
      
      // Set world bounds for new resolution
      this.physics.world.setBounds(0, 0, 1280, 720);
      console.log('World bounds set to 1280x720');
      
      // Initialize UI Manager
      this.uiManager = new UIManager(this);
      console.log('UIManager initialized');
      
      // Create background first
      this.uiManager.createBackground();
      
      // Create robe overlay (75% screen coverage, right-aligned)
      this.uiManager.createRobeOverlay();
      
      // Create materials group for collision management
      this.materialsGroup = this.physics.add.group();
      console.log('Materials group created');
      
      // Initialize input system
      this.inputSystem = new InputSystem(this);
      console.log('Input system created');
      
      // Initialize campfire system
      this.campfireManager = CampfireManager.getInstance();
      console.log('Campfire system initialized');
      
      // Create debug campfire button
      this.createCampfireDebugButton();
      
      // Create debug map button
      this.createMapDebugButton();
      
      // Initialize spell effects system
      this.spellEffectsSystem = new SpellEffectsSystem(this);
      console.log('Spell effects system created');
      
      // Initialize recipe hint system
      this.recipeHintSystem = new RecipeHintSystem(this);
      console.log('Recipe hint system created');
      
      // Create main game areas based on mockup layout
      this.createGameLayout();
      console.log('Game layout created');
      
      // Set up physics collisions
      this.setupPhysics();
      console.log('Physics setup complete');
      
      // Set up event listeners
      this.setupEventHandlers();
      console.log('Event handlers setup');
      
      // Initialize encounter system
      this.encounterManager = new EncounterManager(this);
      this.encounterManager.initialize();
      console.log('Encounter manager initialized');
      
      // Initialize result window
      this.encounterResultWindow = new EncounterResultWindow(this);
      console.log('Encounter result window initialized');
      
      // Initial game state
      this.gameState = 'selecting';
      
      // Check if we have encounter data from map
      if (data && data.encounterData) {
        console.log('GameScene: Starting encounter from map data', data.encounterData);
        this.startMapEncounter(data.encounterData);
        
        // Fade in from map transition
        this.cameras.main.fadeIn(800, 0, 0, 0);
      } else {
        // Start first encounter automatically (default behavior)
        this.encounterManager.startNextEncounter();
      }
      
      // Add instructions - positioned in right bottom corner
      this.add.text(1250, 696, 'Spacebar to make a selection', {
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(1, 1); // Right-aligned to bottom-right corner
      
      
      console.log('GameScene create() completed successfully');
      
      // Initialize the brute force timer for materials that were created during setup
      this.lastMaterialDropTime = this.time.now;
      this.materialsAreFrozen = false;
      console.log('BRUTE FORCE: Initial materials loaded - starting 3-second timer');
      
    } catch (error) {
      console.error('Error in GameScene create():', error);
    }
  }
  
  private createGameLayout() {
    // Based on 1280x720 layout with new UI positioning
    
    // Create material bag using UIManager (center area, slightly below center)
    this.uiManager.createMaterialBag(640, 464); // Moved down 64px
    
    // Create material slots using UIManager (top of screen with padding)
    const topPadding = 60; // Padding from top of screen
    this.uiManager.createMaterialSlots(640, topPadding);
    
    // Create material slots (top of screen with padding)
    this.materialSlots = new MaterialSlots(this, 640, topPadding);
    
    // Create spell window using UIManager (right side with 3% padding from screen edge)
    const screenWidth = this.scale.width;
    const rightPadding = screenWidth * 0.03; // 3% of screen width
    this.spellWindowX = screenWidth - rightPadding - this.SPELL_WINDOW_WIDTH;
    this.uiManager.createSpellWindow(this.spellWindowX, 200);
    
    // TEMPORARILY HIDDEN - Create crane using UIManager (above bag)
    // this.uiManager.createCrane(640, 350);
    
    // Create character area (left side for combat)
    this.uiManager.createCharacterArea(200, 360);
    
    // Initialize existing systems with new positions
    this.materialBag = new MaterialBag(this, 640, 464); // Moved down 64px
    const bagBottomY = 464 + 185; // bag Y + half bag height (now 185 for larger bag)
    this.crane = new Crane(this, 640, 264, bagBottomY); // Moved down 64px
    
    // Create spell selection system (positioned with spell window)
    this.spellArrow = new SpellArrow(this, this.spellWindowX, 360);
    this.createSpellMenu();
    
    // Create combat area with enemy
    this.createCombatArea();
  }
  
  private createCombatArea() {
    // Create enemy health bar above the enemy
    this.createEnemyHealthBar();
    
    // Create player health bar at the bottom
    this.createPlayerHealthBar();
    
    // Create turn indicator text
    this.turnIndicatorText = this.add.text(200, 40, 'Your Turn', {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.turnIndicatorText.setOrigin(0.5, 0.5);
    this.turnIndicatorText.setVisible(false);
    
    // Enemy image will be created dynamically by encounter system
  }
  
  private createEnemyHealthBar() {
    // Position higher on the screen toward the top, centered with enemy
    const healthBarX = 200; // Centered with enemy character
    const healthBarY = 100; // Much higher, toward the top
    
    // Create background (back asset)
    this.enemyHealthBack = this.add.image(healthBarX, healthBarY, 'health_back');
    this.enemyHealthBack.setOrigin(0.5, 0.5);
    this.enemyHealthBack.setScale(0.25); // Scaled down to ~200px wide
    
    // Create foreground (front asset) - this will scale with health
    this.enemyHealthFront = this.add.image(healthBarX, healthBarY, 'health_front');
    this.enemyHealthFront.setOrigin(0.5, 0.5);
    this.enemyHealthFront.setScale(0.25); // Match background scale
    
    // Add "Opponent" text in the middle of the health bar
    this.enemyHealthText = this.add.text(healthBarX, healthBarY, 'Opponent', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.enemyHealthText.setOrigin(0.5, 0.5);
    
    // Add health number display
    this.enemyHealthNumber = this.add.text(healthBarX + 80, healthBarY, '100', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.enemyHealthNumber.setOrigin(0.5, 0.5);
    
    // Update health display
    this.updateEnemyHealthBar();
  }
  
  private createPlayerHealthBar() {
    // Position at the bottom of the screen, centered with enemy
    const healthBarX = 200; // Centered with enemy character
    const healthBarY = 680; // Bottom of screen
    
    // Create background (back asset)
    this.playerHealthBack = this.add.image(healthBarX, healthBarY, 'health_back');
    this.playerHealthBack.setOrigin(0.5, 0.5);
    this.playerHealthBack.setScale(0.25); // Scaled down to ~200px wide
    
    // Create foreground (front asset) - this will scale with health
    this.playerHealthFront = this.add.image(healthBarX, healthBarY, 'health_front');
    this.playerHealthFront.setOrigin(0.5, 0.5);
    this.playerHealthFront.setScale(0.25); // Match background scale
    
    // Add "Yuvor" text in the middle of the health bar
    this.playerHealthText = this.add.text(healthBarX, healthBarY, 'Yuvor', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.playerHealthText.setOrigin(0.5, 0.5);
    
    // Add health number display
    this.playerHealthNumber = this.add.text(healthBarX + 80, healthBarY, '100', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.playerHealthNumber.setOrigin(0.5, 0.5);
    
    // Update health display
    this.updatePlayerHealthBar();
  }
  
  private updateEnemyHealthBar() {
    if (this.enemyHealthFront) {
      // Scale the front image based on current health percentage
      const healthPercentage = this.enemyCurrentHealth / this.enemyMaxHealth;
      this.enemyHealthFront.setScale(0.25 * healthPercentage, 0.25); // Scale width only
      
      // Adjust position to scale from right to left
      const healthBarBack = this.enemyHealthBack;
      const fullWidth = healthBarBack.width * healthBarBack.scaleX;
      const currentWidth = fullWidth * healthPercentage;
      const offsetX = (fullWidth - currentWidth) / 2;
      this.enemyHealthFront.setPosition(healthBarBack.x - offsetX, healthBarBack.y);
    }
    
    // Update the health number display
    if (this.enemyHealthNumber) {
      this.enemyHealthNumber.setText(this.enemyCurrentHealth.toString());
    }
  }
  
  private updatePlayerHealthBar() {
    if (this.playerHealthFront) {
      // Scale the front image based on current health percentage
      const healthPercentage = this.playerCurrentHealth / this.playerMaxHealth;
      this.playerHealthFront.setScale(0.25 * healthPercentage, 0.25); // Scale width only
      
      // Adjust position to scale from right to left
      const healthBarBack = this.playerHealthBack;
      const fullWidth = healthBarBack.width * healthBarBack.scaleX;
      const currentWidth = fullWidth * healthPercentage;
      const offsetX = (fullWidth - currentWidth) / 2;
      this.playerHealthFront.setPosition(healthBarBack.x - offsetX, healthBarBack.y);
    }
    
    // Update the health number display
    if (this.playerHealthNumber) {
      this.playerHealthNumber.setText(this.playerCurrentHealth.toString());
    }
  }
  
  private createSpellMenu() {
    // Spell menu background will be created dynamically in updateAvailableSpells
    // to match the number of spells
    
    // Update available spells based on current materials
    this.updateAvailableSpells();
  }
  
  private updateAvailableSpells() {
    // Get current materials in slots
    const materials = this.materialSlots.getFilledMaterials().map(m => m.materialType);
    
    if (this.gameState === 'selecting') {
      // During material selection: show all discovered spells with costs
      const allDiscoveredSpells = SpellDatabase.getDiscoveredRecipes();
      this.drawAllSpells(allDiscoveredSpells, materials);
    } else {
      // During spell selection: get available spells for casting
      const availableSpells = SpellDatabase.getAvailableSpells(materials);
      const allDiscoveredSpells = SpellDatabase.getDiscoveredRecipes();
      const unavailableSpells = allDiscoveredSpells.filter(spell => 
        !availableSpells.some(available => available.id === spell.id)
      );
      
      this.availableSpells = availableSpells;
      this.drawSpellSelection(availableSpells, unavailableSpells);
      
      // Update spell arrow with available spells for timing zones
      if (this.spellArrow) {
        this.spellArrow.setAvailableSpells(availableSpells);
      }
    }
  }
  
  private clearSpellDisplay() {
    // Clear all tracked spell elements
    this.spellDisplayElements.forEach(element => {
      if (element && element.active) {
        element.destroy();
      }
    });
    
    // Clear the tracking array
    this.spellDisplayElements = [];
    
    console.log(`Cleared ${this.spellDisplayElements.length} tracked spell display elements`);
  }
  
  private createDynamicSpellMenu(spellCount: number): number {
    // Calculate dynamic height based on number of spells
    const spellSpacing = 45;
    const topPadding = 40; // Space for any header
    const bottomPadding = 20;
    const menuHeight = topPadding + (spellCount * spellSpacing) + bottomPadding;
    
    // Ensure menu fits on screen (max height based on screen size)
    const maxHeight = 400; // Leave space for other UI elements
    const finalHeight = Math.min(menuHeight, maxHeight);
    
    // Adjust starting Y position if menu is too tall
    const menuStartY = 200;
    const menuEndY = menuStartY + finalHeight;
    const screenHeight = 600; // Game height
    
    let adjustedStartY = menuStartY;
    if (menuEndY > screenHeight - 50) { // 50px margin from bottom
      adjustedStartY = screenHeight - finalHeight - 50;
    }
    
    // TEMPORARILY HIDDEN - Create spell menu background
    // const menuBg = this.add.graphics();
    // menuBg.fillStyle(0x3a3a3a);
    // menuBg.fillRoundedRect(640, adjustedStartY, 150, finalHeight, 10);
    // menuBg.lineStyle(2, 0x555555);
    // menuBg.strokeRoundedRect(640, adjustedStartY, 150, finalHeight, 10);
    
    // Update scroll background to match spell window size
    this.uiManager.updateSpellWindowSize(this.SPELL_WINDOW_WIDTH, finalHeight, adjustedStartY);
    
    // Return the first spell Y position (menu start + top padding)
    return adjustedStartY + 30; // 30px from top of menu to first spell
  }
  
  private drawAllSpells(spells: SpellRecipe[], materials: MaterialType[]) {
    this.clearSpellDisplay();
    
    // Create dynamic spell menu background and get start Y position
    const startY = this.createDynamicSpellMenu(spells.length);
    
    spells.forEach((spell, index) => {
      const yPos = startY + (index * 45); // 45px spacing from dynamic start
      const available = SpellDatabase.canCastSpell(spell.materials, materials);
      this.drawSpellItem(spell, yPos, false, available); // false = not selection mode
    });
  }
  
  private drawSpellSelection(availableSpells: SpellRecipe[], unavailableSpells: SpellRecipe[]) {
    this.clearSpellDisplay();
    
    const totalSpells = availableSpells.length + unavailableSpells.length;
    
    // Create dynamic spell menu background and get start Y position
    const startY = this.createDynamicSpellMenu(totalSpells);
    
    let yPos = startY;
    
    // Draw available spells first
    availableSpells.forEach((spell, index) => {
      this.drawSpellItem(spell, yPos, true, true); // true = selection mode, true = available
      yPos += 45;
    });
    
    // Draw unavailable spells at bottom (darkened)
    unavailableSpells.forEach((spell, index) => {
      this.drawSpellItem(spell, yPos, true, false); // true = selection mode, false = unavailable
      yPos += 45;
    });
    
    // Update spell arrow bounds (only for available spells)
    if (this.spellArrow) {
      this.spellArrow.setSpellCount(availableSpells.length);
      this.spellArrow.setSpellMenuBounds(startY, availableSpells.length * 45);
    }
  }
  
  private drawSpellItem(spell: SpellRecipe, yPos: number, isSelectionMode: boolean, available: boolean) {
    // Determine colors and alpha based on availability and mode
    const bgColor = available ? 0x4a4a4a : 0x2a2a2a;
    // Use black text for spell names and descriptions on the scroll background
    const textColor = (isSelectionMode && !available) ? '#666666' : '#000000';
    const descColor = (isSelectionMode && !available) ? '#555555' : '#333333';
    const alpha = available ? 1.0 : (isSelectionMode ? 0.3 : 1.0); // Much lower opacity for unavailable spells
    
    // Spell background - mostly transparent and fitting within scroll bounds
    const spellBg = this.add.graphics();
    spellBg.fillStyle(bgColor);
    spellBg.fillRoundedRect(this.spellWindowX + this.SPELL_WINDOW_PADDING, yPos - 18, this.SPELL_ITEM_WIDTH, 36, 5);
    spellBg.setAlpha(0.1); // Make mostly transparent
    if (!available && isSelectionMode) {
      spellBg.setAlpha(0.02); // Much more transparent for unavailable spells
    }
    this.spellDisplayElements.push(spellBg); // Track for clearing
    
    // Material cost area - centered on left side with padding
    const materialAreaX = this.spellWindowX + this.SPELL_WINDOW_PADDING + 8; // 8px padding from spell background edge
    const materialAreaWidth = 24; // Space for materials
    
    // Cost materials using small material icons - first two stacked vertically, third on right
    if (spell.materials.length > 0) {
      spell.materials.forEach((materialType, matIndex) => {
        const materialAssetKey = this.getMaterialAssetKey(materialType);
        const materialIcon = this.add.image(0, 0, materialAssetKey);
        
        const iconSize = 16; // Size of small material icons
        const padding = 3; // Reduced padding between materials
        
        let materialX, materialY;
        
        if (matIndex < 2) {
          // First two materials: stack vertically on left side
          materialX = materialAreaX + (materialAreaWidth / 2); // Centered in material area
          
          if (spell.materials.length === 1) {
            // Single material: center vertically
            materialY = yPos;
          } else {
            // Multiple materials: stack with padding, centered around yPos
            const totalHeight = (iconSize * 2) + padding; // Height of two materials with padding
            const startY = yPos - (totalHeight / 2);
            materialY = startY + (iconSize / 2) + (matIndex * (iconSize + padding));
          }
        } else {
          // Third material: positioned on the right, centered vertically
          materialX = materialAreaX + materialAreaWidth + (iconSize / 2) + 2; // To the right of the area
          materialY = yPos; // Centered vertically
        }
        
        // Position and scale the material icon
        materialIcon.setPosition(materialX, materialY);
        materialIcon.setScale(iconSize / materialIcon.width); // Scale to desired size
        materialIcon.setOrigin(0.5, 0.5);
        materialIcon.setDepth(5); // Above scroll UI but behind crane arm
        
        // Darken materials during selection mode if spell is unavailable
        if (isSelectionMode && !available) {
          materialIcon.setAlpha(0.2); // Much lower opacity for unavailable spells
        }
        
        // Track material icon for clearing
        this.spellDisplayElements.push(materialIcon);
      });
    } else {
      // Gather spell - show a special icon in material area
      const gatherIcon = this.add.graphics();
      const iconColor = (isSelectionMode && !available) ? 0x444444 : 0x88ff88;
      gatherIcon.lineStyle(1.5, iconColor);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 6, yPos - 3);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 6, yPos + 3);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 8, yPos);
      // Darken icon during selection mode if spell is unavailable
      if (isSelectionMode && !available) {
        gatherIcon.setAlpha(0.2); // Much lower opacity for unavailable spells
      }
      
      // Track gather icon for clearing
      this.spellDisplayElements.push(gatherIcon);
    }
    
    // Calculate available space for text layout
    const textStartX = materialAreaX + materialAreaWidth + 4; // 4px gap after material area
    const totalTextWidth = this.SPELL_ITEM_WIDTH - (textStartX - (this.spellWindowX + this.SPELL_WINDOW_PADDING));
    const nameWidth = Math.floor(totalTextWidth * 0.4); // 40% of available space for name
    const descWidth = Math.floor(totalTextWidth * 0.55); // 55% of available space for description (5% gap)
    
    // Spell name - positioned to the right of materials (left side)
    const spellText = this.add.text(textStartX, yPos, spell.name, {
      fontSize: '14px', // 30% bigger than 11px
      color: textColor,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: nameWidth, useAdvancedWrap: true }
    });
    spellText.setOrigin(0, 0.5); // Center vertically at yPos (middle of spell UI)
    if (isSelectionMode && !available) {
      spellText.setAlpha(alpha); // Apply lower opacity for unavailable spells
    }
    this.spellDisplayElements.push(spellText); // Track for clearing
    
    // Spell description - positioned to the right of name (right side)
    const descStartX = textStartX + nameWidth + 8; // 8px gap between name and description
    const descText = this.add.text(descStartX, yPos, spell.effect.description, {
      fontSize: '12px', // 30% bigger than 9px
      color: descColor,
      align: 'center',
      wordWrap: { width: descWidth, useAdvancedWrap: true }
    });
    descText.setOrigin(0, 0.5); // Center vertically at yPos (middle of spell UI)
    if (isSelectionMode && !available) {
      descText.setAlpha(alpha); // Apply lower opacity for unavailable spells
    }
    this.spellDisplayElements.push(descText); // Track for clearing
  }
  

  private getMaterialColor(type: MaterialType): number {
    switch(type) {
      case MaterialType.FIRE: return 0xff4444;
      case MaterialType.LEAF: return 0x44ff44;
      case MaterialType.ROCK: return 0xffff44;
      default: return 0xffffff;
    }
  }
  
  private getMaterialAssetKey(materialType: MaterialType): string {
    switch (materialType) {
      case MaterialType.FIRE:
        return 'material_fire_small';
      case MaterialType.LEAF:
        return 'material_leaf_small';
      case MaterialType.ROCK:
        return 'material_rock_small';
      default:
        return 'material_fire_small'; // Fallback
    }
  }
  
  private setupPhysics() {
    // Add collision between materials in the group with separation callback
    this.physics.add.collider(this.materialsGroup, this.materialsGroup, this.handleMaterialCollision, undefined, this);
    
    // Add collision between materials and bag walls
    this.physics.add.collider(this.materialsGroup, this.materialBag.getBagWalls());
  }
  
  private handleMaterialCollision(material1: Phaser.Physics.Arcade.Sprite, material2: Phaser.Physics.Arcade.Sprite) {
    // Skip collision handling if either object is being grabbed by crane
    if ((material1 as any).isBeingGrabbed || (material2 as any).isBeingGrabbed) {
      return;
    }
    
    // Wake up both objects from sleep
    this.wakeObject(material1);
    this.wakeObject(material2);
    
    const body1 = material1.body as Phaser.Physics.Arcade.Body;
    const body2 = material2.body as Phaser.Physics.Arcade.Body;
    
    const deltaX = material1.x - material2.x;
    const deltaY = material1.y - material2.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 0 && distance < 60) { // Updated for 30 radius materials (60 diameter)
      const normalX = deltaX / distance;
      const normalY = deltaY / distance;
      const overlap = 60 - distance;
      
      // Apply separation force scaled by overlap
      const separationForce = overlap * 3;
      body1.setVelocityX(body1.velocity.x + normalX * separationForce);
      body2.setVelocityX(body2.velocity.x - normalX * separationForce);
      
      // Add horizontal sliding force to prevent sticking
      const slideForce = 15;
      body1.setVelocityX(body1.velocity.x + Math.sign(normalX) * slideForce);
      body2.setVelocityX(body2.velocity.x - Math.sign(normalX) * slideForce);
      
      // Vertical separation only if side-by-side
      if (Math.abs(normalY) < 0.7) {
        body1.setVelocityY(body1.velocity.y + normalY * separationForce * 0.5);
        body2.setVelocityY(body2.velocity.y - normalY * separationForce * 0.5);
      }
    }
  }
  
  public getMaterialsGroup(): Phaser.Physics.Arcade.Group {
    return this.materialsGroup;
  }
  
  private sleepObject(sprite: Phaser.Physics.Arcade.Sprite) {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    (sprite as any).isAsleep = true;
    (sprite as any).settlingTimer = 0;
  }
  
  private wakeObject(sprite: Phaser.Physics.Arcade.Sprite) {
    (sprite as any).isAsleep = false;
    (sprite as any).settlingTimer = 0;
  }
  
  public wakeAllMaterials() {
    // Wake all materials when something significant happens (like object removal)
    this.materialsGroup.children.entries.forEach((material) => {
      this.wakeObject(material as Phaser.Physics.Arcade.Sprite);
    });
  }
  
  private reenableAllPhysics() {
    // Unfreeze materials and re-enable physics for all materials
    this.materialsAreFrozen = false;
    console.log('BRUTE FORCE: Unfreezing materials and re-enabling physics');
    
    this.materialsGroup.children.entries.forEach((material) => {
      const sprite = material as Phaser.Physics.Arcade.Sprite;
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (body && !body.enable) {
        body.setEnable(true);
      }
      this.wakeObject(sprite);
    });
    
    // Restart the settle timer after re-enabling physics
    this.lastMaterialDropTime = this.time.now;
  }
  
  private setupEventHandlers() {
    // Handle material grabbed by crane
    this.events.on('materialGrabbed', (material: Material) => {
      this.handleMaterialGrabbed(material);
    });
    
    // Handle crane action complete
    this.events.on('craneActionComplete', () => {
      this.handleCraneActionComplete();
    });
    
    // Handle material dropped
    this.events.on('materialDropped', () => {
      console.log('BRUTE FORCE: Material dropped - starting 3-second timer');
      this.lastMaterialDropTime = this.time.now;
      // Re-enable physics for all materials when new ones are added
      this.reenableAllPhysics();
    });
    
    // Handle third slot unlock
    this.events.on('unlockThirdSlot', () => {
      this.handleThirdSlotUnlock();
    });
    
    // Handle hint toggle
    this.events.on('toggleHints', () => {
      const currentMaterials = this.materialSlots.getFilledMaterials().map(m => m.materialType);
      this.recipeHintSystem.toggleHints(currentMaterials);
    });
  }
  
  private handleMaterialGrabbed(material: Material) {
    console.log('Material grabbed:', material.materialType);
    
    // Re-enable physics for all materials and wake them (this will restart the timer)
    this.reenableAllPhysics();
    
    // Remove material from bag
    this.materialBag.removeMaterial(material);
    
    // Add to slots
    const added = this.materialSlots.addMaterial(material);
    console.log('Material added to slot:', added);
    console.log('Slots filled count:', this.materialSlots.getFilledCount());
    console.log('Is full:', this.materialSlots.isFull());
    
    // Check if slots are full for spell casting (minimum 2 slots, maximum available slots)
    const minSlotsForCasting = 2;
    const filledCount = this.materialSlots.getFilledCount();
    
    if (added && filledCount >= minSlotsForCasting && this.gameState === 'selecting') {
      // Check if user wants to continue adding materials or cast spell
      if (this.materialSlots.isThirdSlotUnlocked() && filledCount < 3) {
        // Third slot is unlocked but not full - show option to continue or cast
        console.log(`${filledCount} slots filled. You can add more materials or cast a spell.`);
        // For now, continue to material gathering - could add UI choice later
      } else if (this.materialSlots.isFull()) {
        // All available slots filled, switch to casting state
        console.log('SWITCHING TO SPELL SELECTION MODE - All slots filled');
        this.gameState = 'casting';
        this.crane.stopSwinging();
        
        // Update available spells and start spell selection
        this.updateAvailableSpells();
        console.log('Starting spell selection arrow');
        this.spellArrow.startSelection();
        
        // Visual indicator removed - no longer needed
      }
    }
  }
  
  private handleCraneActionComplete() {
    // Reset to selecting state if not full
    if (!this.materialSlots.isFull()) {
      this.gameState = 'selecting';
    }
  }
  
  private handleSpellSelection(spellName: string, timingAccuracy: number = 1.0) {
    console.log(`Selected spell: ${spellName} with ${(timingAccuracy * 100).toFixed(1)}% accuracy`);
    
    // Stop spell selection
    console.log('Stopping spell selection arrow');
    this.spellArrow.stopSelection();
    
    // Visual indicator cleanup removed - no longer needed
    
    // Get materials from slots before clearing them
    const usedMaterials = this.materialSlots.getFilledMaterials();
    
    // Find the spell recipe for effects
    const spellRecipe = SpellDatabase.getDiscoveredRecipes().find(recipe => recipe.name === spellName);
    
    if (spellRecipe) {
      // Cast the spell with effects
      const castResult = this.spellEffectsSystem.castSpell(spellRecipe, timingAccuracy);
      console.log(castResult.message);
      
      // Show effects summary
      if (castResult.effects.length > 0) {
        castResult.effects.forEach(effect => {
          console.log(`Active effect: ${effect.name} for ${effect.remainingTurns} turns`);
        });
      }
      
      // Handle encounter spell casting
      if (this.encounterManager.isEncounterActive()) {
        this.encounterManager.handlePlayerSpell(spellRecipe);
      }
    }
    
    // Destroy the used materials (make them disappear)
    usedMaterials.forEach(material => {
      if (material && material.destroy) {
        try {
          material.destroy();
        } catch (error) {
          console.warn('Error destroying material during spell casting:', error);
        }
      }
    });
    
    // Clear slots and return to material selection
    this.materialSlots.clear();
    this.gameState = 'selecting';
    this.crane.resumeSwinging();
    
    // Reset spell menu to show all spells
    this.updateAvailableSpells();
    
    // Handle Gather action
    if (spellName === 'Gather') {
      // Re-enable physics when new materials are added (this will restart the timer)
      this.reenableAllPhysics();
      this.materialBag.addGatherMaterials(4);
    }
    
    // Note: Spell discovery happens in shop, not during combat
  }
  

  update() {
    this.inputSystem.update();
    
    // Update encounter system
    this.encounterManager.update(this.time.now, this.time.delta);
    
    // Update encounter result window for spacebar input
    this.encounterResultWindow.update();
    
    // Update crane movement (only when selecting materials)
    if (this.gameState === 'selecting') {
      this.crane.update();
    }
    
    // Update spell arrow (only when casting spells)
    if (this.gameState === 'casting') {
      this.spellArrow.update();
    }
    
    // Apply settling physics to materials (simple sleep system)
    this.updateMaterialSettling();
    
    // Global settle timer - freeze all materials 3 seconds after dropping starts
    if (!this.materialsAreFrozen && this.lastMaterialDropTime > 0) {
      const timeSinceLastDrop = this.time.now - this.lastMaterialDropTime;
      
      
      // Freeze materials exactly 3 seconds after dropping starts, regardless of crane state
      if (timeSinceLastDrop >= 3000) { // 3 seconds
        this.materialsAreFrozen = true;
        console.log('BRUTE FORCE: Materials physics DISABLED after 3 seconds from drop start. Time elapsed:', timeSinceLastDrop, 'ms');
        
        // Immediately stop all material movement and disable physics
        this.materialsGroup.children.entries.forEach((material) => {
          const sprite = material as Phaser.Physics.Arcade.Sprite;
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          if (body && body.enable) {
            body.setVelocity(0, 0);
            body.setEnable(false);
          }
        });
      }
    }
    
    // Handle input based on current state
    if (this.gameState === 'selecting' && this.inputSystem.hasUnprocessedInput()) {
      this.inputSystem.consumeInput();
      
      if (!this.crane.isActive()) {
        this.crane.startDescent();
      }
    }
    
    // Handle spell casting input
    if (this.gameState === 'casting' && this.inputSystem.hasUnprocessedInput()) {
      this.inputSystem.consumeInput();
      
      const selectedSpellIndex = this.spellArrow.getCurrentSpellIndex();
      if (selectedSpellIndex >= 0 && selectedSpellIndex < this.availableSpells.length) {
        const selectedSpell = this.availableSpells[selectedSpellIndex];
        const timingAccuracy = this.spellArrow.getTimingAccuracy();
        
        console.log('Selected spell:', selectedSpell.name);
        console.log('Timing accuracy:', timingAccuracy.toFixed(2));
        
        this.handleSpellSelection(selectedSpell.name, timingAccuracy);
      }
    }
  }
  
  private updateMaterialSettling() {
    // Brute force physics stopping system - completely disable physics when frozen
    this.materialsGroup.children.entries.forEach((material) => {
      const sprite = material as Phaser.Physics.Arcade.Sprite;
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      
      if (body) {
        if (this.materialsAreFrozen) {
          // Completely disable physics body when frozen
          if (body.enable) {
            body.setVelocity(0, 0); // Stop all movement
            body.setEnable(false); // Disable physics simulation
          }
        } else {
          // Re-enable physics body if it was disabled
          if (!body.enable) {
            body.setEnable(true);
          }
        }
      }
    });
  }
  
  
  private handleThirdSlotUnlock() {
    const unlocked = this.materialSlots.unlockThirdSlot();
    
    if (unlocked) {
      // Show unlock notification
      const notification = this.add.container(400, 200);
      
      // Background
      const notificationBg = this.add.graphics();
      notificationBg.fillStyle(0x000000, 0.8);
      notificationBg.fillRoundedRect(-150, -40, 300, 80, 10);
      notificationBg.lineStyle(3, 0x00ff00);
      notificationBg.strokeRoundedRect(-150, -40, 300, 80, 10);
      notification.add(notificationBg);
      
      // Title
      const titleText = this.add.text(0, -15, 'THIRD SLOT UNLOCKED!', {
        fontSize: '16px',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      notification.add(titleText);
      
      // Description
      const descText = this.add.text(0, 10, 'You can now use 3 materials for powerful spells!', {
        fontSize: '12px',
        color: '#cccccc'
      }).setOrigin(0.5);
      notification.add(descText);
      
      // Animate notification
      notification.setScale(0);
      this.tweens.add({
        targets: notification,
        scale: 1,
        duration: 400,
        ease: 'Back.easeOut'
      });
      
      // Auto-hide after 4 seconds
      this.time.delayedCall(4000, () => {
        this.tweens.add({
          targets: notification,
          scale: 0,
          alpha: 0,
          duration: 300,
          ease: 'Power2.easeIn',
          onComplete: () => notification.destroy()
        });
      });
    }
  }
  
  // === ENCOUNTER SYSTEM INTERFACE METHODS ===
  
  public setEnemyData(enemyData: EnemyData): void {
    // Remove existing enemy image if any
    if (this.currentEnemyImage) {
      this.currentEnemyImage.destroy();
    }
    
    // Create new enemy image
    this.currentEnemyImage = this.add.image(200, 360, enemyData.assetKey);
    this.currentEnemyImage.setOrigin(0.5, 0.5);
    this.currentEnemyImage.setScale(enemyData.scale);
    
    // Update health bar text
    this.enemyHealthText.setText(enemyData.displayName);
  }
  
  public setEnemyHealth(current: number, max: number): void {
    this.enemyCurrentHealth = current;
    this.enemyMaxHealth = max;
    this.updateEnemyHealthBar();
  }
  
  public setPlayerHealth(current: number, max: number): void {
    this.playerCurrentHealth = current;
    this.playerMaxHealth = max;
    this.updatePlayerHealthBar();
  }
  
  public showCombatUI(show: boolean): void {
    if (this.turnIndicatorText) {
      this.turnIndicatorText.setVisible(show);
    }
  }
  
  public setPlayerTurn(isPlayerTurn: boolean): void {
    if (this.turnIndicatorText) {
      if (isPlayerTurn) {
        this.turnIndicatorText.setText('Your Turn');
        this.turnIndicatorText.setColor('#ffff00');
        // Show crane during player turn
        this.crane.setVisible(true);
      } else {
        this.turnIndicatorText.setText('Enemy Turn');
        this.turnIndicatorText.setColor('#ff8800');
        // Hide crane during enemy turn
        this.crane.setVisible(false);
      }
      this.turnIndicatorText.setVisible(true);
    }
  }
  
  public showDamageEffect(damage: number, toEnemy: boolean): void {
    const targetX = toEnemy ? 200 : 200;
    const targetY = toEnemy ? 100 : 680; // Enemy damage appears near enemy health bar
    
    const damageText = this.add.text(targetX, targetY, `-${damage}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    damageText.setOrigin(0.5, 0.5);
    
    // Animate damage text
    this.tweens.add({
      targets: damageText,
      y: targetY - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => damageText.destroy()
    });
  }
  
  public showHealingEffect(healing: number): void {
    const healingText = this.add.text(200, 680, `+${healing}`, {
      fontSize: '32px',
      color: '#00ff00',
      fontStyle: 'bold'
    });
    healingText.setOrigin(0.5, 0.5);
    
    // Animate healing text
    this.tweens.add({
      targets: healingText,
      y: 630,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => healingText.destroy()
    });
  }
  
  public showDefenseEffect(defense: number): void {
    const defenseText = this.add.text(200, 680, `+${defense} DEF`, {
      fontSize: '32px',
      color: '#0088ff',
      fontStyle: 'bold'
    });
    defenseText.setOrigin(0.5, 0.5);
    
    // Animate defense text
    this.tweens.add({
      targets: defenseText,
      y: 630,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => defenseText.destroy()
    });
  }
  
  public showEnemyAttackEffect(damage: number): void {
    // Create a simple impact effect near the player health bar
    const effectX = 200;
    const effectY = 680;
    
    // Create red impact circle - start bigger and make it more visible
    const impactCircle = this.add.graphics();
    impactCircle.fillStyle(0xff0000, 0.9);
    impactCircle.fillCircle(0, 0, 40); // Start with 40px radius
    impactCircle.setPosition(effectX, effectY);
    
    // Create impact animation - slower and more visible
    this.tweens.add({
      targets: impactCircle,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => impactCircle.destroy()
    });
    
    // Create screen shake effect
    this.cameras.main.shake(200, 0.01);
    
    // Create attack particles
    for (let i = 0; i < 5; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0xff6600, 1);
      particle.fillCircle(effectX, effectY, 3);
      
      const angle = (Math.PI * 2 * i) / 5;
      const distance = 30 + Math.random() * 20;
      const targetX = effectX + Math.cos(angle) * distance;
      const targetY = effectY + Math.sin(angle) * distance;
      
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 300 + Math.random() * 200,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
  
  public showPlayerAttackEffect(damage: number): void {
    // Create impact effect on the enemy character
    const effectX = 200;
    const effectY = 360;
    
    // Create blue/yellow impact circle for player attacks
    const impactCircle = this.add.graphics();
    impactCircle.fillStyle(0xffaa00, 0.9); // Orange/yellow color
    impactCircle.fillCircle(0, 0, 40);
    impactCircle.setPosition(effectX, effectY);
    
    // Create impact animation
    this.tweens.add({
      targets: impactCircle,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => impactCircle.destroy()
    });
    
    // Make enemy shake when hit
    if (this.currentEnemyImage) {
      const originalX = this.currentEnemyImage.x;
      this.tweens.add({
        targets: this.currentEnemyImage,
        x: originalX + 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.currentEnemyImage!.setX(originalX);
        }
      });
    }
    
    // Create attack particles (blue/yellow theme)
    for (let i = 0; i < 5; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0xffff00, 1); // Yellow particles
      particle.fillCircle(effectX, effectY, 3);
      
      const angle = (Math.PI * 2 * i) / 5;
      const distance = 30 + Math.random() * 20;
      const targetX = effectX + Math.cos(angle) * distance;
      const targetY = effectY + Math.sin(angle) * distance;
      
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 300 + Math.random() * 200,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
  
  public showEncounterResult(result: EncounterResult): void {
    console.log(`GameScene: showEncounterResult called with result: ${result}`);
    this.encounterResultWindow.show(result);
  }
  
  public onEncounterResultClosed(): void {
    this.encounterManager.onEncounterResultClosed();
  }
  
  public restartCurrentEncounter(): void {
    this.encounterManager.restartCurrentEncounter();
  }
  
  public fullHealPlayer(): void {
    this.playerCurrentHealth = this.playerMaxHealth;
    this.updatePlayerHealthBar();
  }
  
  public returnToNormalState(): void {
    console.log('All encounters completed - returning to normal state');
    // For now, just log - in future this would return to world map
  }
  
  shutdown(): void {
    console.log('GameScene: Shutting down...');
    
    // Safely clean up materials
    if (this.materialsGroup) {
      this.materialsGroup.children.entries.forEach((material: any) => {
        if (material && material.destroy) {
          try {
            material.destroy();
          } catch (error) {
            console.warn('Error destroying material during shutdown:', error);
          }
        }
      });
      this.materialsGroup.clear();
    }
    
    // Clean up any other game objects that might have event listeners
    if (this.campfireDebugButton) {
      this.campfireDebugButton.destroy();
    }
    
    if (this.mapDebugButton) {
      this.mapDebugButton.destroy();
    }
    
    console.log('GameScene: Shutdown complete');
  }
  
  private createCampfireDebugButton(): void {
    // Create debug button container
    this.campfireDebugButton = this.add.container(50, 50);
    
    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x8B4513, 0.8); // Brown color for campfire theme
    buttonBg.fillRoundedRect(0, 0, 120, 40, 8);
    buttonBg.lineStyle(2, 0xFFD700); // Gold border
    buttonBg.strokeRoundedRect(0, 0, 120, 40, 8);
    
    // Button text
    const buttonText = this.add.text(60, 20, '🔥 Campfire', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add to container
    this.campfireDebugButton.add([buttonBg, buttonText]);
    
    // Make it interactive
    this.campfireDebugButton.setSize(120, 40);
    this.campfireDebugButton.setInteractive();
    
    // Add hover effects
    this.campfireDebugButton.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0xA0522D, 0.9); // Slightly lighter brown on hover
      buttonBg.fillRoundedRect(0, 0, 120, 40, 8);
      buttonBg.lineStyle(2, 0xFFD700);
      buttonBg.strokeRoundedRect(0, 0, 120, 40, 8);
    });
    
    this.campfireDebugButton.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x8B4513, 0.8); // Back to original brown
      buttonBg.fillRoundedRect(0, 0, 120, 40, 8);
      buttonBg.lineStyle(2, 0xFFD700);
      buttonBg.strokeRoundedRect(0, 0, 120, 40, 8);
    });
    
    // Click handler - opens campfire scene selection
    this.campfireDebugButton.on('pointerdown', () => {
      this.showCampfireSelectionMenu();
    });
    
    // Add to UI layer with high depth
    this.campfireDebugButton.setDepth(1000);
    
    console.log('Campfire debug button created at top-left');
  }
  
  private showCampfireSelectionMenu(): void {
    // Create selection menu overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setDepth(1500);
    
    // Menu background
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x2C1810, 0.95); // Dark brown background
    menuBg.fillRoundedRect(this.scale.width/2 - 200, this.scale.height/2 - 150, 400, 300, 15);
    menuBg.lineStyle(3, 0xFFD700);
    menuBg.strokeRoundedRect(this.scale.width/2 - 200, this.scale.height/2 - 150, 400, 300, 15);
    menuBg.setDepth(1510);
    
    // Menu title
    const menuTitle = this.add.text(this.scale.width/2, this.scale.height/2 - 100, 'Select Campfire Scene', {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1520);
    
    // Campfire scene options
    const campfireScenes = [
      { id: 'opening_campfire', name: '1. Opening - Dawn with Burok', description: 'Yuvor begins her journey' },
      { id: 'second_campfire', name: '2. Thornwood - Evening with Thurm', description: 'Meeting a fellow traveler' },
      { id: 'lizard_campfire', name: '3. Craglands - Night with Sythara', description: 'Wisdom from a lizard sage' }
    ];
    
    const menuItems: Phaser.GameObjects.Container[] = [];
    
    campfireScenes.forEach((scene, index) => {
      const yPos = this.scale.height/2 - 40 + (index * 60);
      
      // Button container
      const buttonContainer = this.add.container(this.scale.width/2, yPos);
      
      // Button background
      const sceneBg = this.add.graphics();
      sceneBg.fillStyle(0x8B4513, 0.8);
      sceneBg.fillRoundedRect(-180, -20, 360, 40, 8);
      sceneBg.lineStyle(1, 0xFFD700, 0.5);
      sceneBg.strokeRoundedRect(-180, -20, 360, 40, 8);
      
      // Scene name
      const sceneName = this.add.text(0, -5, scene.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Scene description
      const sceneDesc = this.add.text(0, 10, scene.description, {
        fontSize: '12px',
        color: '#cccccc',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      
      buttonContainer.add([sceneBg, sceneName, sceneDesc]);
      buttonContainer.setSize(360, 40);
      buttonContainer.setInteractive();
      buttonContainer.setDepth(1520);
      
      // Hover effects
      buttonContainer.on('pointerover', () => {
        sceneBg.clear();
        sceneBg.fillStyle(0xA0522D, 0.9);
        sceneBg.fillRoundedRect(-180, -20, 360, 40, 8);
        sceneBg.lineStyle(2, 0xFFD700);
        sceneBg.strokeRoundedRect(-180, -20, 360, 40, 8);
      });
      
      buttonContainer.on('pointerout', () => {
        sceneBg.clear();
        sceneBg.fillStyle(0x8B4513, 0.8);
        sceneBg.fillRoundedRect(-180, -20, 360, 40, 8);
        sceneBg.lineStyle(1, 0xFFD700, 0.5);
        sceneBg.strokeRoundedRect(-180, -20, 360, 40, 8);
      });
      
      // Click handler
      buttonContainer.on('pointerdown', () => {
        console.log(`Starting campfire scene: ${scene.id}`);
        this.campfireManager.startCampfireScene(this, scene.id);
        // Clean up menu
        this.cleanupCampfireMenu(overlay, menuBg, menuTitle, menuItems);
      });
      
      menuItems.push(buttonContainer);
    });
    
    // Close button
    const closeButton = this.add.text(this.scale.width/2, this.scale.height/2 + 120, 'Close', {
      fontSize: '16px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1520);
    
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      this.cleanupCampfireMenu(overlay, menuBg, menuTitle, menuItems);
    });
    
    // Store references for cleanup
    (overlay as any).menuItems = menuItems;
    (overlay as any).closeButton = closeButton;
  }
  
  private cleanupCampfireMenu(overlay: Phaser.GameObjects.Graphics, menuBg: Phaser.GameObjects.Graphics, 
                              menuTitle: Phaser.GameObjects.Text, menuItems: Phaser.GameObjects.Container[]): void {
    overlay.destroy();
    menuBg.destroy();
    menuTitle.destroy();
    menuItems.forEach(item => item.destroy());
    
    // Clean up close button if it exists
    if ((overlay as any).closeButton) {
      (overlay as any).closeButton.destroy();
    }
  }
  
  private createMapDebugButton(): void {
    // Create debug button container positioned below campfire button
    this.mapDebugButton = this.add.container(50, 100);
    
    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x4A5D3A, 0.8); // Green color for map theme
    buttonBg.fillRoundedRect(0, 0, 120, 40, 8);
    buttonBg.lineStyle(2, 0xD4B03A); // Gold border
    buttonBg.strokeRoundedRect(0, 0, 120, 40, 8);
    
    // Button text
    const buttonText = this.add.text(60, 20, '🗺️ Map', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add to container
    this.mapDebugButton.add([buttonBg, buttonText]);
    
    // Make it interactive
    this.mapDebugButton.setSize(120, 40);
    this.mapDebugButton.setInteractive();
    
    // Add hover effects
    this.mapDebugButton.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x5B7A4A, 0.9); // Slightly lighter green on hover
      buttonBg.fillRoundedRect(0, 0, 120, 40, 8);
      buttonBg.lineStyle(2, 0xD4B03A);
      buttonBg.strokeRoundedRect(0, 0, 120, 40, 8);
    });
    
    this.mapDebugButton.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4A5D3A, 0.8); // Back to original green
      buttonBg.fillRoundedRect(0, 0, 120, 40, 8);
      buttonBg.lineStyle(2, 0xD4B03A);
      buttonBg.strokeRoundedRect(0, 0, 120, 40, 8);
    });
    
    // Click handler - opens map scene
    this.mapDebugButton.on('pointerdown', () => {
      console.log('Map button pressed - starting map scene');
      this.scene.start('MapScene');
    });
    
    // Add to UI layer with high depth
    this.mapDebugButton.setDepth(1000);
    
    console.log('Map debug button created below campfire button');
  }
  
  private startMapEncounter(encounterData: any): void {
    console.log('GameScene: Starting map encounter', encounterData);
    
    // Store the encounter data for later use
    this.mapEncounterData = encounterData;
    
    // Create a single encounter for the map node
    this.encounterManager.startSingleEncounter(encounterData.enemyId);
  }
  
  public onMapEncounterComplete(): void {
    console.log('GameScene: Map encounter completed');
    
    if (this.mapEncounterData) {
      console.log('GameScene: Fading out and returning to map');
      
      // Fade out and return to map scene
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.time.delayedCall(800, () => {
        this.scene.start('MapScene', {
          completeNodeId: this.mapEncounterData.nodeId
        });
      });
    }
  }
  
  private mapEncounterData: any = null;
}