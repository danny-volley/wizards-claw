import { InputSystem } from '../../systems/InputSystem';

describe('InputSystem', () => {
  let mockScene: any;
  let inputSystem: InputSystem;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
    inputSystem = new InputSystem(mockScene);
  });

  describe('initialization', () => {
    test('should create InputSystem with scene', () => {
      expect(inputSystem).toBeDefined();
      expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith(32); // SPACE key
    });

    test('should set up input handlers', () => {
      const mockKey = mockScene.input.keyboard.addKey();
      expect(mockKey.on).toHaveBeenCalledWith('down', expect.any(Function));
      expect(mockKey.on).toHaveBeenCalledWith('up', expect.any(Function));
    });
  });

  describe('input detection', () => {
    test('should detect when input is available', () => {
      expect(inputSystem.hasUnprocessedInput()).toBe(false);
      
      // Simulate key press
      inputSystem['addInputToBuffer']('press');
      expect(inputSystem.hasUnprocessedInput()).toBe(true);
    });

    test('should consume input', () => {
      inputSystem['addInputToBuffer']('press');
      expect(inputSystem.hasUnprocessedInput()).toBe(true);
      
      inputSystem.consumeInput();
      expect(inputSystem.hasUnprocessedInput()).toBe(false);
    });

    test('should handle input buffering', () => {
      inputSystem['addInputToBuffer']('press');
      inputSystem['addInputToBuffer']('release');
      
      expect(inputSystem.hasUnprocessedInput()).toBe(true);
      
      inputSystem.consumeInput();
      expect(inputSystem.hasUnprocessedInput()).toBe(true); // Still has release event
      
      inputSystem.consumeInput();
      expect(inputSystem.hasUnprocessedInput()).toBe(false);
    });
  });

  describe('timing calculations', () => {
    test('should track input timing', () => {
      const startTime = Date.now();
      inputSystem['addInputToBuffer']('press');
      
      const inputBuffer = inputSystem['inputBuffer'];
      expect(inputBuffer.length).toBe(1);
      expect(inputBuffer[0].timestamp).toBeGreaterThanOrEqual(startTime);
    });

    test('should clear old inputs from buffer', () => {
      // Add old input
      inputSystem['addInputToBuffer']('press');
      
      // Mock time passing
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 200);
      
      inputSystem.update();
      
      // Should still have input within buffer time
      expect(inputSystem.hasUnprocessedInput()).toBe(true);
      
      // Mock more time passing
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 500);
      
      inputSystem.update();
      
      // Should clear old input
      expect(inputSystem.hasUnprocessedInput()).toBe(false);
    });
  });

  describe('input blocking', () => {
    test('should block input when requested', () => {
      inputSystem.blockInput();
      inputSystem['addInputToBuffer']('press');
      
      expect(inputSystem.hasUnprocessedInput()).toBe(false);
    });

    test('should unblock input', () => {
      inputSystem.blockInput();
      inputSystem.unblockInput();
      inputSystem['addInputToBuffer']('press');
      
      expect(inputSystem.hasUnprocessedInput()).toBe(true);
    });
  });
});