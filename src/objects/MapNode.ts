import { MapNodeType, MapNodeConfig, getNodeConfig } from '../data/MapNodeConfig';

export enum MapNodeState {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  COMPLETED = 'completed',
  CURRENT = 'current'
}

export interface MapNodeData {
  id: string;
  type: MapNodeType;
  x: number;
  y: number;
  state: MapNodeState;
  config: MapNodeConfig;
  connectedNodes: string[]; // IDs of connected nodes
  customName?: string; // Optional custom name override
  customDifficulty?: number; // Optional difficulty override
  customReward?: number; // Optional reward override
}

export class MapNode extends Phaser.GameObjects.Container {
  private nodeData: MapNodeData;
  private nodeIcon: Phaser.GameObjects.Image;
  private nodeText: Phaser.GameObjects.Text;
  private isHovered: boolean = false;
  private baseScale: number = 1;
  
  constructor(scene: Phaser.Scene, nodeData: MapNodeData) {
    super(scene, nodeData.x, nodeData.y);
    
    this.nodeData = nodeData;
    
    // Add to scene
    scene.add.existing(this);
    
    // Set container depth to be above path lines
    this.setDepth(10);
    
    this.createNodeVisuals();
    this.updateNodeState();
    this.setupInteraction();
    
    console.log(`MapNode created: ${nodeData.id} (${nodeData.type}) at (${nodeData.x}, ${nodeData.y})`);
  }
  
  private createNodeVisuals() {
    // Create node icon
    this.nodeIcon = this.scene.add.image(0, 0, this.nodeData.config.iconAsset);
    
    // Scale to 90px height (50% smaller)
    const targetHeight = 90;
    this.baseScale = targetHeight / this.nodeIcon.height;
    this.nodeIcon.setScale(this.baseScale);
    
    this.add(this.nodeIcon);
    
    // Create node text label (initially hidden)
    this.nodeText = this.scene.add.text(0, 65, this.getDisplayName(), {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    this.nodeText.setOrigin(0.5);
    this.nodeText.setVisible(false);
    this.add(this.nodeText);
  }
  
  private updateNodeState() {
    switch (this.nodeData.state) {
      case MapNodeState.LOCKED:
        this.nodeIcon.setTint(0x666666); // Dark gray
        this.nodeIcon.setAlpha(0.5);
        this.setInteractive(false);
        break;
        
      case MapNodeState.AVAILABLE:
        this.nodeIcon.clearTint();
        this.nodeIcon.setAlpha(1.0);
        this.setInteractive(true);
        break;
        
      case MapNodeState.COMPLETED:
        this.nodeIcon.setTint(0x00ff00); // Green tint
        this.nodeIcon.setAlpha(0.8);
        this.setInteractive(true);
        break;
        
      case MapNodeState.CURRENT:
        this.nodeIcon.clearTint();
        this.nodeIcon.setAlpha(1.0);
        this.setInteractive(true);
        break;
    }
  }
  
  
  private setupInteraction() {
    this.setSize(90, 90); // Interaction area matches icon size
    
    this.on('pointerover', () => {
      if (this.nodeData.state !== MapNodeState.LOCKED) {
        this.isHovered = true;
        this.nodeText.setVisible(true);
        this.nodeIcon.setScale(this.baseScale * 1.1); // Slightly bigger on hover
      }
    });
    
    this.on('pointerout', () => {
      this.isHovered = false;
      this.nodeText.setVisible(false);
      this.nodeIcon.setScale(this.baseScale); // Back to normal size
    });
    
    this.on('pointerdown', () => {
      if (this.nodeData.state === MapNodeState.AVAILABLE || 
          this.nodeData.state === MapNodeState.CURRENT) {
        this.handleNodeClick();
      }
    });
  }
  
  private handleNodeClick() {
    console.log(`Node clicked: ${this.nodeData.id} (${this.nodeData.type})`);
    
    // Emit event for the scene to handle
    this.scene.events.emit('nodeClicked', this.nodeData);
  }
  
  public getNodeData(): MapNodeData {
    return this.nodeData;
  }
  
  public setState(newState: MapNodeState) {
    this.nodeData.state = newState;
    this.updateNodeState();
  }
  
  public getDisplayName(): string {
    return this.nodeData.customName || this.nodeData.config.name;
  }
  
  public getDifficulty(): number {
    return this.nodeData.customDifficulty || this.nodeData.config.difficultyModifier;
  }
  
  public getReward(): number {
    return this.nodeData.customReward || this.nodeData.config.rewardAmount;
  }
  
  public isClickable(): boolean {
    return this.nodeData.state === MapNodeState.AVAILABLE || 
           this.nodeData.state === MapNodeState.CURRENT;
  }
  
  public destroy(): void {
    super.destroy();
  }
}