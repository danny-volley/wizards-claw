import { MapNode, MapNodeData, MapNodeState } from '../objects/MapNode';
import { MapNodeType, getNodeConfig, createCustomNodeConfig, ENCOUNTER_VARIANTS } from '../data/MapNodeConfig';

export class MapManager {
  private scene: Phaser.Scene;
  private mapNodes: Map<string, MapNode> = new Map();
  private nodeConnections: Map<string, string[]> = new Map();
  private currentPlayerNode: string | null = null;
  private completedNodes: Set<string> = new Set();
  private pathLines: Phaser.GameObjects.Graphics[] = [];
  private characterIndicator: Phaser.GameObjects.Image | null = null;
  private selectionArrow: Phaser.GameObjects.Image | null = null;
  private arrowTween: Phaser.Tweens.Tween | null = null;
  private availableNodeAngles: { nodeId: string; angle: number }[] = [];
  private currentArrowDirection: number = 0;
  private isMoving: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Listen for node click events
    this.scene.events.on('nodeClicked', this.handleNodeClick, this);
  }
  
  public createMapNodes(): void {
    // Clear existing nodes
    this.clearAllNodes();
    
    // Create the map layout based on the example
    // This creates a specific layout that matches the example image
    const nodeLayout = this.getExampleMapLayout();
    
    // Create nodes
    nodeLayout.forEach(nodeConfig => {
      const nodeData: MapNodeData = {
        id: nodeConfig.id,
        type: nodeConfig.type,
        x: nodeConfig.x,
        y: nodeConfig.y,
        state: nodeConfig.state || MapNodeState.LOCKED,
        config: getNodeConfig(nodeConfig.type),
        connectedNodes: nodeConfig.connectedNodes || [],
        customName: nodeConfig.customName,
        customDifficulty: nodeConfig.customDifficulty,
        customReward: nodeConfig.customReward
      };
      
      const mapNode = new MapNode(this.scene, nodeData);
      this.mapNodes.set(nodeData.id, mapNode);
      
      // Store connections
      if (nodeConfig.connectedNodes) {
        this.nodeConnections.set(nodeData.id, nodeConfig.connectedNodes);
      }
    });
    
    // Set initial state
    this.setInitialState();
    
    // Create character position indicator
    this.createCharacterIndicator();
    
    // Create selection arrow (delay to ensure assets are loaded)
    this.scene.time.delayedCall(100, () => {
      this.createSelectionArrow();
    });
    
    console.log(`MapManager: Created ${this.mapNodes.size} map nodes`);
  }
  
  private getExampleMapLayout() {
    // Based on the example image, create a layout that follows the visual pattern
    // Increased spacing both horizontally and vertically
    return [
      // Starting campfire (left side)
      {
        id: 'start_campfire',
        type: MapNodeType.CAMPFIRE,
        x: 180,
        y: 360,
        state: MapNodeState.CURRENT,
        connectedNodes: ['encounter_1', 'encounter_2']
      },
      
      // First encounter (upper path)
      {
        id: 'encounter_1',
        type: MapNodeType.ENCOUNTER,
        x: 450,
        y: 250,
        customName: 'Forest Patrol',
        customDifficulty: ENCOUNTER_VARIANTS.EASY.difficultyModifier,
        customReward: ENCOUNTER_VARIANTS.EASY.rewardAmount,
        connectedNodes: ['shop_1']
      },
      
      // Second encounter (lower path)
      {
        id: 'encounter_2',
        type: MapNodeType.ENCOUNTER,
        x: 450,
        y: 470,
        customName: 'River Crossing',
        customDifficulty: ENCOUNTER_VARIANTS.NORMAL.difficultyModifier,
        customReward: ENCOUNTER_VARIANTS.NORMAL.rewardAmount,
        connectedNodes: ['shop_1']
      },
      
      // Shop in the middle
      {
        id: 'shop_1',
        type: MapNodeType.SHOP,
        x: 720,
        y: 360,
        customName: 'Traveling Merchant',
        connectedNodes: ['encounter_3', 'treasure_1']
      },
      
      // Treasure node (optional path)
      {
        id: 'treasure_1',
        type: MapNodeType.TREASURE,
        x: 990,
        y: 250,
        customName: 'Hidden Cache',
        connectedNodes: ['end_campfire']
      },
      
      // Third encounter (main path)
      {
        id: 'encounter_3',
        type: MapNodeType.ENCOUNTER,
        x: 990,
        y: 470,
        customName: 'Guard Post',
        customDifficulty: ENCOUNTER_VARIANTS.HARD.difficultyModifier,
        customReward: ENCOUNTER_VARIANTS.HARD.rewardAmount,
        connectedNodes: ['end_campfire']
      },
      
      // End campfire (right side)
      {
        id: 'end_campfire',
        type: MapNodeType.CAMPFIRE,
        x: 1100,
        y: 360,
        customName: 'Rest Stop',
        connectedNodes: []
      }
    ];
  }
  
  private setInitialState(): void {
    // Set the starting campfire as current
    const startNode = this.mapNodes.get('start_campfire');
    if (startNode) {
      startNode.setState(MapNodeState.CURRENT);
      this.currentPlayerNode = 'start_campfire';
      
      // Make connected nodes available and draw path lines
      this.updateAvailableNodes();
    }
  }
  
  private updateAvailableNodes(): void {
    if (!this.currentPlayerNode) return;
    
    const connections = this.nodeConnections.get(this.currentPlayerNode) || [];
    
    connections.forEach(nodeId => {
      const node = this.mapNodes.get(nodeId);
      if (node && node.getNodeData().state === MapNodeState.LOCKED) {
        node.setState(MapNodeState.AVAILABLE);
      }
    });
    
    // Update path lines
    this.updatePathLines();
  }
  
  private updatePathLines(): void {
    // Clear existing path lines
    this.clearPathLines();
    
    if (!this.currentPlayerNode) {
      return;
    }
    
    const currentNode = this.mapNodes.get(this.currentPlayerNode);
    if (!currentNode) {
      return;
    }
    
    const connections = this.nodeConnections.get(this.currentPlayerNode) || [];
    
    connections.forEach(targetNodeId => {
      const targetNode = this.mapNodes.get(targetNodeId);
      if (targetNode && targetNode.getNodeData().state === MapNodeState.AVAILABLE) {
        this.drawPathLine(currentNode, targetNode);
      }
    });
  }
  
  private drawPathLine(fromNode: MapNode, toNode: MapNode): void {
    const fromData = fromNode.getNodeData();
    const toData = toNode.getNodeData();
    
    // Create graphics object for the path line
    const pathLine = this.scene.add.graphics();
    pathLine.setDepth(5); // Above background, below nodes
    
    // Draw black stroke (outer line)
    pathLine.lineStyle(16, 0x000000, 1); // 12px + 2px border on each side = 16px total
    pathLine.beginPath();
    pathLine.moveTo(fromData.x, fromData.y);
    pathLine.lineTo(toData.x, toData.y);
    pathLine.strokePath();
    
    // Draw yellow fill (inner line)
    pathLine.lineStyle(12, 0xFFD700, 1); // 12px yellow line
    pathLine.beginPath();
    pathLine.moveTo(fromData.x, fromData.y);
    pathLine.lineTo(toData.x, toData.y);
    pathLine.strokePath();
    
    // Store the path line for cleanup
    this.pathLines.push(pathLine);
  }
  
  private clearPathLines(): void {
    this.pathLines.forEach(line => line.destroy());
    this.pathLines = [];
  }
  
  private createCharacterIndicator(): void {
    if (this.characterIndicator) {
      this.characterIndicator.destroy();
    }
    
    this.characterIndicator = this.scene.add.image(0, 0, 'map_yuvor');
    
    // Scale to 90px width
    const targetWidth = 128;
    const scale = targetWidth / this.characterIndicator.width;
    this.characterIndicator.setScale(scale);
    
    // Set depth to be above nodes
    this.characterIndicator.setDepth(15);
    
    // Position at current node
    this.updateCharacterPosition();
  }
  
  private updateCharacterPosition(): void {
    if (!this.characterIndicator || !this.currentPlayerNode) {
      return;
    }
    
    const currentNode = this.mapNodes.get(this.currentPlayerNode);
    if (!currentNode) {
      return;
    }
    
    const nodeData = currentNode.getNodeData();
    
    // Position slightly down and to the right of the node
    const offsetX = -38;
    const offsetY = 10;
    
    this.characterIndicator.setPosition(nodeData.x + offsetX, nodeData.y + offsetY);
  }
  
  private createSelectionArrow(): void {
    if (this.selectionArrow) {
      this.selectionArrow.destroy();
    }
    
    if (this.arrowTween) {
      this.arrowTween.destroy();
    }
    
    this.selectionArrow = this.scene.add.image(0, 0, 'map_arrow');
    this.selectionArrow.setDepth(12); // Above path lines, below character indicator
    
    // Position at current node
    this.updateArrowPosition();
    
    // Calculate angles to available nodes
    this.calculateAvailableNodeAngles();
    
    // Start rotation animation
    this.startArrowRotation();
  }
  
  private updateArrowPosition(): void {
    if (!this.selectionArrow || !this.currentPlayerNode) {
      return;
    }
    
    const currentNode = this.mapNodes.get(this.currentPlayerNode);
    if (!currentNode) {
      return;
    }
    
    const nodeData = currentNode.getNodeData();
    this.selectionArrow.setPosition(nodeData.x, nodeData.y);
  }
  
  private calculateAvailableNodeAngles(): void {
    this.availableNodeAngles = [];
    
    if (!this.currentPlayerNode) {
      return;
    }
    
    const currentNode = this.mapNodes.get(this.currentPlayerNode);
    if (!currentNode) {
      return;
    }
    
    const currentNodeData = currentNode.getNodeData();
    const connections = this.nodeConnections.get(this.currentPlayerNode) || [];
    
    connections.forEach(nodeId => {
      const targetNode = this.mapNodes.get(nodeId);
      if (targetNode && targetNode.getNodeData().state === MapNodeState.AVAILABLE) {
        const targetNodeData = targetNode.getNodeData();
        
        // Calculate angle from current node to target node
        const deltaX = targetNodeData.x - currentNodeData.x;
        const deltaY = targetNodeData.y - currentNodeData.y;
        const angle = Math.atan2(deltaY, deltaX);
        
        this.availableNodeAngles.push({ nodeId, angle });
      }
    });
  }
  
  private startArrowRotation(): void {
    if (this.availableNodeAngles.length === 0) {
      return;
    }
    
    // Find the range of angles
    let minAngle = this.availableNodeAngles[0].angle;
    let maxAngle = this.availableNodeAngles[0].angle;
    
    this.availableNodeAngles.forEach(item => {
      if (item.angle < minAngle) minAngle = item.angle;
      if (item.angle > maxAngle) maxAngle = item.angle;
    });
    
    // Limit to 45 degree range (π/4 radians)
    const maxRange = Math.PI / 4;
    const actualRange = maxAngle - minAngle;
    
    if (actualRange > maxRange) {
      const center = (minAngle + maxAngle) / 2;
      minAngle = center - maxRange / 2;
      maxAngle = center + maxRange / 2;
    }
    
    // Start rotation animation
    this.arrowTween = this.scene.tweens.add({
      targets: this.selectionArrow,
      rotation: { from: minAngle, to: maxAngle },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (this.selectionArrow) {
          this.currentArrowDirection = this.selectionArrow.rotation;
        }
      }
    });
  }
  
  public handleArrowSelection(): void {
    if (!this.selectionArrow || this.availableNodeAngles.length === 0 || this.isMoving) {
      return;
    }
    
    // Get the current arrow direction
    const currentDirection = this.currentArrowDirection;
    
    // Find the closest available node based on arrow direction
    let selectedNodeId: string | null = null;
    
    if (this.availableNodeAngles.length === 1) {
      // Only one option, select it
      selectedNodeId = this.availableNodeAngles[0].nodeId;
    } else if (this.availableNodeAngles.length === 2) {
      // Simple positive/negative angle selection
      const upperNode = this.availableNodeAngles.find(item => item.angle < 0);
      const lowerNode = this.availableNodeAngles.find(item => item.angle > 0);
      
      if (currentDirection < 0 && upperNode) {
        selectedNodeId = upperNode.nodeId;
      } else if (currentDirection > 0 && lowerNode) {
        selectedNodeId = lowerNode.nodeId;
      } else {
        // Fallback: select the first available
        selectedNodeId = this.availableNodeAngles[0].nodeId;
      }
    } else {
      // Multiple nodes: find the closest angle
      let closestNode = this.availableNodeAngles[0];
      let smallestDiff = Math.abs(currentDirection - closestNode.angle);
      
      this.availableNodeAngles.forEach(item => {
        const diff = Math.abs(currentDirection - item.angle);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestNode = item;
        }
      });
      
      selectedNodeId = closestNode.nodeId;
    }
    
    if (selectedNodeId) {
      console.log(`MapManager: Selected node ${selectedNodeId} via arrow selection`);
      
      // Hide the selection arrow
      this.hideSelectionArrow();
      
      // Get the node data to determine how to handle it
      const selectedNode = this.mapNodes.get(selectedNodeId);
      if (selectedNode) {
        const nodeData = selectedNode.getNodeData();
        
        // Handle different node types
        if (nodeData.type === MapNodeType.ENCOUNTER) {
          console.log(`MapManager: Arrow selected encounter node ${selectedNodeId}`);
          // Move to the node first, then start encounter after animation
          this.moveToNodeWithAnimation(selectedNodeId, () => {
            console.log(`MapManager: Animation complete, starting encounter for ${selectedNodeId}`);
            this.startEncounter(nodeData);
          });
        } else {
          // For non-encounter nodes, just move normally
          this.moveToNodeWithAnimation(selectedNodeId);
        }
      }
    }
  }
  
  private hideSelectionArrow(): void {
    if (this.selectionArrow) {
      this.selectionArrow.setVisible(false);
    }
    
    if (this.arrowTween) {
      this.arrowTween.pause();
    }
  }
  
  private moveToNodeWithAnimation(nodeId: string, onComplete?: () => void): void {
    if (this.isMoving || !this.characterIndicator) {
      return;
    }
    
    const targetNode = this.mapNodes.get(nodeId);
    if (!targetNode) {
      return;
    }
    
    const targetNodeData = targetNode.getNodeData();
    
    // Calculate target position with offset
    const offsetX = -38;
    const offsetY = 10;
    const targetX = targetNodeData.x + offsetX;
    const targetY = targetNodeData.y + offsetY;
    
    this.isMoving = true;
    
    // Animate character to new position
    this.scene.tweens.add({
      targets: this.characterIndicator,
      x: targetX,
      y: targetY,
      duration: 800,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        console.log(`MapManager: Animation complete for node ${nodeId}`);
        
        // Update game state after animation completes
        this.moveToNode(nodeId);
        this.isMoving = false;
        
        // Execute callback if provided (for encounters)
        if (onComplete) {
          console.log(`MapManager: Executing callback for node ${nodeId}`);
          onComplete();
        } else {
          console.log(`MapManager: No callback, creating selection arrow for node ${nodeId}`);
          // Create selection arrow after movement is complete (normal movement)
          this.updateArrowPosition();
          this.scene.time.delayedCall(100, () => {
            this.createSelectionArrow();
          });
        }
      }
    });
  }
  
  private handleNodeClick = (nodeData: MapNodeData) => {
    console.log(`MapManager: Handling click on node ${nodeData.id}`);
    
    switch (nodeData.type) {
      case MapNodeType.CAMPFIRE:
        this.handleCampfireNode(nodeData);
        break;
        
      case MapNodeType.ENCOUNTER:
        this.handleEncounterNode(nodeData);
        break;
        
      case MapNodeType.SHOP:
        this.handleShopNode(nodeData);
        break;
        
      case MapNodeType.TREASURE:
        this.handleTreasureNode(nodeData);
        break;
        
      case MapNodeType.HAZARD:
        this.handleHazardNode(nodeData);
        break;
        
      case MapNodeType.BOSS:
        this.handleBossNode(nodeData);
        break;
    }
  };
  
  private handleCampfireNode(nodeData: MapNodeData): void {
    console.log(`Activating campfire: ${nodeData.id}`);
    
    // For now, just move to the node
    this.moveToNode(nodeData.id);
    
    // TODO: Integrate with campfire system
    // this.scene.scene.start('CampfireScene', campfireData);
  }
  
  private handleEncounterNode(nodeData: MapNodeData): void {
    console.log(`Starting encounter: ${nodeData.id} (Difficulty: ${nodeData.config.difficultyModifier})`);
    
    // Move to the node first, then start encounter after animation
    this.moveToNodeWithAnimation(nodeData.id, () => {
      console.log(`MapManager: Animation complete, starting encounter for ${nodeData.id}`);
      this.startEncounter(nodeData);
    });
  }
  
  private startEncounter(nodeData: MapNodeData): void {
    // Get random enemy for the encounter based on difficulty
    const enemyId = this.getRandomEnemyForDifficulty(nodeData.config.difficultyModifier);
    
    console.log(`MapManager: Starting encounter with enemy: ${enemyId} for node: ${nodeData.id}`);
    console.log(`MapManager: Setting current player node to ${nodeData.id}`);
    
    // Update current player node to the encounter node before starting encounter
    this.currentPlayerNode = nodeData.id;
    
    console.log(`MapManager: Fading out and switching to GameScene`);
    
    // Fade out and transition to GameScene
    this.scene.cameras.main.fadeOut(800, 0, 0, 0);
    this.scene.time.delayedCall(800, () => {
      this.scene.scene.start('GameScene', {
        encounterData: {
          enemyId: enemyId,
          nodeId: nodeData.id,
          returnToMap: true
        }
      });
    });
  }
  
  private getRandomEnemyForDifficulty(difficultyModifier: number): string {
    // Simple enemy selection based on difficulty
    if (difficultyModifier <= 0.8) {
      // Easy encounters
      const easyEnemies = ['lizard', 'fox'];
      return easyEnemies[Math.floor(Math.random() * easyEnemies.length)];
    } else if (difficultyModifier <= 1.2) {
      // Normal encounters  
      const normalEnemies = ['fox', 'crane', 'lizard'];
      return normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
    } else {
      // Hard encounters
      const hardEnemies = ['crane', 'fox'];
      return hardEnemies[Math.floor(Math.random() * hardEnemies.length)];
    }
  }
  
  private handleShopNode(nodeData: MapNodeData): void {
    console.log(`Opening shop: ${nodeData.id}`);
    
    // TODO: Integrate with shop system
    // For now, just move to the node
    this.moveToNode(nodeData.id);
  }
  
  private handleTreasureNode(nodeData: MapNodeData): void {
    console.log(`Opening treasure: ${nodeData.id} (Reward: ${nodeData.config.rewardAmount})`);
    
    // TODO: Integrate with treasure system
    // For now, just move to the node and mark as completed
    this.moveToNode(nodeData.id);
    this.completeNode(nodeData.id);
  }
  
  private handleHazardNode(nodeData: MapNodeData): void {
    console.log(`Navigating hazard: ${nodeData.id}`);
    
    // TODO: Integrate with hazard system
    this.moveToNode(nodeData.id);
    this.completeNode(nodeData.id);
  }
  
  private handleBossNode(nodeData: MapNodeData): void {
    console.log(`Challenging boss: ${nodeData.id}`);
    
    // TODO: Integrate with boss encounter system
    this.moveToNode(nodeData.id);
  }
  
  private moveToNode(nodeId: string): void {
    // Update current player position
    if (this.currentPlayerNode) {
      const oldNode = this.mapNodes.get(this.currentPlayerNode);
      if (oldNode && !this.completedNodes.has(this.currentPlayerNode)) {
        oldNode.setState(MapNodeState.AVAILABLE);
      }
    }
    
    this.currentPlayerNode = nodeId;
    const currentNode = this.mapNodes.get(nodeId);
    if (currentNode) {
      currentNode.setState(MapNodeState.CURRENT);
    }
    
    // Update available nodes and path lines
    this.updateAvailableNodes();
    
    // Update selection arrow (only if not moving via animation)
    if (!this.isMoving) {
      this.updateArrowPosition();
      this.scene.time.delayedCall(100, () => {
        this.createSelectionArrow();
      });
    }
  }
  
  private completeNode(nodeId: string): void {
    this.completedNodes.add(nodeId);
    const node = this.mapNodes.get(nodeId);
    if (node) {
      node.setState(MapNodeState.COMPLETED);
    }
  }
  
  public getCurrentNode(): string | null {
    return this.currentPlayerNode;
  }
  
  public getCompletedNodes(): string[] {
    return Array.from(this.completedNodes);
  }
  
  public getNode(nodeId: string): MapNode | undefined {
    return this.mapNodes.get(nodeId);
  }
  
  public getAllNodes(): MapNode[] {
    return Array.from(this.mapNodes.values());
  }
  
  public setCurrentPlayerNode(nodeId: string): void {
    console.log(`MapManager: Setting current player node to ${nodeId}`);
    
    // Update the old current node state if it exists
    if (this.currentPlayerNode) {
      const oldNode = this.mapNodes.get(this.currentPlayerNode);
      if (oldNode && !this.completedNodes.has(this.currentPlayerNode)) {
        oldNode.setState(MapNodeState.AVAILABLE);
      }
    }
    
    // Set new current node
    this.currentPlayerNode = nodeId;
    const currentNode = this.mapNodes.get(nodeId);
    if (currentNode) {
      currentNode.setState(MapNodeState.CURRENT);
    }
    
    // Update character position and available nodes
    this.updateCharacterPosition();
    this.updateAvailableNodes();
  }

  public completeEncounterNode(nodeId: string): void {
    console.log(`MapManager: Completing encounter node ${nodeId}`);
    console.log(`MapManager: Current player node is: ${this.currentPlayerNode}`);
    
    this.completeNode(nodeId);
    
    // Update character position to the completed node
    console.log(`MapManager: Updating character position to current node: ${this.currentPlayerNode}`);
    this.updateCharacterPosition();
  }
  
  private clearAllNodes(): void {
    this.clearPathLines();
    this.mapNodes.forEach(node => node.destroy());
    this.mapNodes.clear();
    this.nodeConnections.clear();
    this.completedNodes.clear();
    this.currentPlayerNode = null;
    
    // Clean up character indicator
    if (this.characterIndicator) {
      this.characterIndicator.destroy();
      this.characterIndicator = null;
    }
    
    // Clean up selection arrow
    if (this.selectionArrow) {
      this.selectionArrow.destroy();
      this.selectionArrow = null;
    }
    
    if (this.arrowTween) {
      this.arrowTween.destroy();
      this.arrowTween = null;
    }
  }
  
  public destroy(): void {
    this.scene.events.off('nodeClicked', this.handleNodeClick, this);
    this.clearAllNodes();
  }
}