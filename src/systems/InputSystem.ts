export class InputSystem {
  private scene: Phaser.Scene;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private hKey: Phaser.Input.Keyboard.Key;
  private inputBuffer: InputEvent[] = [];
  private bufferTimeMs: number = 100;
  private isInputBlocked: boolean = false;
  private timingWindow: number = 500;
  private lastInputTime: number = 0;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.hKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.setupInputHandlers();
  }
  
  private setupInputHandlers() {
    this.spaceKey.on('down', () => {
      if (!this.isInputBlocked) {
        this.addInputToBuffer('press');
      }
    });
    
    this.spaceKey.on('up', () => {
      if (!this.isInputBlocked) {
        this.addInputToBuffer('release');
      }
    });
    
    this.hKey.on('down', () => {
      this.scene.events.emit('toggleHints');
    });
  }
  
  private addInputToBuffer(type: 'press' | 'release') {
    const now = Date.now();
    this.inputBuffer.push({
      type,
      timestamp: now,
      processed: false
    });
    
    this.lastInputTime = now;
    
    // Clean old inputs from buffer
    this.inputBuffer = this.inputBuffer.filter(
      input => now - input.timestamp <= this.bufferTimeMs
    );
  }
  
  public consumeInput(type: 'press' | 'release' = 'press'): InputEvent | null {
    const input = this.inputBuffer.find(
      input => input.type === type && !input.processed
    );
    
    if (input) {
      input.processed = true;
      return input;
    }
    
    return null;
  }
  
  public hasUnprocessedInput(type: 'press' | 'release' = 'press'): boolean {
    return this.inputBuffer.some(
      input => input.type === type && !input.processed
    );
  }
  
  public isWithinTimingWindow(): boolean {
    const now = Date.now();
    return now - this.lastInputTime <= this.timingWindow;
  }
  
  public blockInput() {
    this.isInputBlocked = true;
  }
  
  public unblockInput() {
    this.isInputBlocked = false;
  }
  
  public setTimingWindow(ms: number) {
    this.timingWindow = ms;
  }
  
  public clearBuffer() {
    this.inputBuffer = [];
  }
  
  public update() {
    // Clean old inputs
    const now = Date.now();
    this.inputBuffer = this.inputBuffer.filter(
      input => now - input.timestamp <= this.bufferTimeMs
    );
  }
}

interface InputEvent {
  type: 'press' | 'release';
  timestamp: number;
  processed: boolean;
}