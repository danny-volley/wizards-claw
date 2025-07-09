import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { EncounterResult } from '../encounters/BaseEncounter';

export class EncounterResultWindow {
  private scene: GameScene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private continueButton: Phaser.GameObjects.Container;
  private restartButton: Phaser.GameObjects.Container;
  private isVisible: boolean;
  
  constructor(scene: GameScene) {
    this.scene = scene;
    this.isVisible = false;
    this.createWindow();
  }
  
  private createWindow(): void {
    // Create main container
    this.container = this.scene.add.container(640, 360); // Center of screen
    this.container.setDepth(1000); // High depth to appear above everything
    this.container.setVisible(false);
    
    // Create background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.8); // Semi-transparent black
    this.background.fillRect(-300, -200, 600, 400); // 600x400 window
    this.background.lineStyle(4, 0xffffff, 1); // White border
    this.background.strokeRect(-300, -200, 600, 400);
    this.container.add(this.background);
    
    // Create title text
    this.titleText = this.scene.add.text(0, -120, 'VICTORY!', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.container.add(this.titleText);
    
    // Create message text
    this.messageText = this.scene.add.text(0, -40, 'You have defeated the enemy!', {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 500 }
    });
    this.messageText.setOrigin(0.5, 0.5);
    this.container.add(this.messageText);
    
    // Create continue button
    this.continueButton = this.createButton(0, 60, 'Continue', 0x00aa00, () => {
      this.hide();
      this.scene.onEncounterResultClosed();
    });
    this.container.add(this.continueButton);
    
    // Create restart button (hidden by default)
    this.restartButton = this.createButton(0, 120, 'Restart', 0xaa0000, () => {
      this.hide();
      this.scene.restartCurrentEncounter();
    });
    this.container.add(this.restartButton);
  }
  
  private createButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(x, y);
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(color, 1);
    buttonBg.fillRoundedRect(-100, -25, 200, 50, 10);
    buttonBg.lineStyle(2, 0xffffff, 1);
    buttonBg.strokeRoundedRect(-100, -25, 200, 50, 10);
    buttonContainer.add(buttonBg);
    
    // Button text
    const buttonText = this.scene.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    buttonContainer.add(buttonText);
    
    // Make button interactive
    buttonContainer.setSize(200, 50);
    buttonContainer.setInteractive();
    
    // Button hover effects
    buttonContainer.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(color, 0.8);
      buttonBg.fillRoundedRect(-100, -25, 200, 50, 10);
      buttonBg.lineStyle(2, 0xffffff, 1);
      buttonBg.strokeRoundedRect(-100, -25, 200, 50, 10);
      buttonContainer.setScale(1.05);
    });
    
    buttonContainer.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(color, 1);
      buttonBg.fillRoundedRect(-100, -25, 200, 50, 10);
      buttonBg.lineStyle(2, 0xffffff, 1);
      buttonBg.strokeRoundedRect(-100, -25, 200, 50, 10);
      buttonContainer.setScale(1);
    });
    
    buttonContainer.on('pointerdown', callback);
    
    return buttonContainer;
  }
  
  public show(result: EncounterResult): void {
    this.isVisible = true;
    
    // Update text based on result
    if (result === EncounterResult.VICTORY) {
      this.titleText.setText('VICTORY!');
      this.titleText.setColor('#00ff00');
      this.messageText.setText('You have defeated the enemy!\nYour health has been fully restored.');
      this.continueButton.setVisible(true);
      this.restartButton.setVisible(false);
    } else if (result === EncounterResult.DEFEAT) {
      this.titleText.setText('DEFEAT');
      this.titleText.setColor('#ff0000');
      this.messageText.setText('You have been defeated!\nWould you like to try again?');
      this.continueButton.setVisible(false);
      this.restartButton.setVisible(true);
    }
    
    // Show the window with animation
    this.container.setVisible(true);
    this.container.setScale(0.5);
    this.container.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Pause the game
    this.scene.physics.pause();
  }
  
  public hide(): void {
    this.isVisible = false;
    
    // Hide with animation
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
        // Resume the game
        this.scene.physics.resume();
      }
    });
  }
  
  public getIsVisible(): boolean {
    return this.isVisible;
  }
  
  public destroy(): void {
    this.container.destroy();
  }
}