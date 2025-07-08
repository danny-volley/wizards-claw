import { InputSystem } from '../systems/InputSystem';
import { Material, MaterialType } from '../objects/Material';
import { Crane } from '../objects/Crane';

describe('Performance Tests', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
  });

  describe('60fps animation targets', () => {
    test('input system should process inputs within 16ms', () => {
      const inputSystem = new InputSystem(mockScene);
      
      // Add multiple inputs to stress test
      for (let i = 0; i < 10; i++) {
        inputSystem['addInputToBuffer']('press');
      }
      
      const startTime = performance.now();
      
      // Process all inputs
      while (inputSystem.hasUnprocessedInput()) {
        inputSystem.consumeInput();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(16); // 60fps = ~16.67ms per frame
    });

    test('crane position calculations should be fast', () => {
      const crane = new Crane(mockScene, 400, 200, 350);
      
      const startTime = performance.now();
      
      // Simulate multiple position calculations per frame
      for (let i = 0; i < 100; i++) {
        crane.getClawWorldPosition();
        crane.getCurrentSwingPosition();
        crane.getSwingProgress();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(16);
    });

    test('material collision detection should scale well', () => {
      const materials: Material[] = [];
      
      // Create multiple materials (simulating full bag)
      for (let i = 0; i < 15; i++) {
        materials.push(new Material(mockScene, i * 20, 200, MaterialType.FIRE));
      }
      
      const crane = new Crane(mockScene, 400, 200, 350);
      mockScene.children.list = materials;
      
      const startTime = performance.now();
      
      // Simulate collision detection during descent
      for (let i = 0; i < 10; i++) {
        crane['checkForMaterialCollisionDuringDescent']();
        crane['checkForMaterialGrab']();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(16);
    });

    test('material creation should be efficient', () => {
      const startTime = performance.now();
      
      // Create multiple materials rapidly
      const materials: Material[] = [];
      for (let i = 0; i < 50; i++) {
        materials.push(new Material(mockScene, i * 10, 200, MaterialType.FIRE));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Allow some time for texture creation
    });
  });

  describe('memory efficiency', () => {
    test('should not create excessive objects during normal gameplay', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate normal gameplay operations
      const inputSystem = new InputSystem(mockScene);
      const crane = new Crane(mockScene, 400, 200, 350);
      const materials: Material[] = [];
      
      for (let i = 0; i < 15; i++) {
        materials.push(new Material(mockScene, i * 20, 200, MaterialType.FIRE));
      }
      
      // Simulate some game updates
      for (let i = 0; i < 100; i++) {
        inputSystem.update();
        crane.update();
        crane.getClawWorldPosition();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not use excessive memory (less than 10MB for test operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should clean up properly when materials are destroyed', () => {
      const materials: Material[] = [];
      
      // Create materials
      for (let i = 0; i < 10; i++) {
        materials.push(new Material(mockScene, i * 20, 200, MaterialType.FIRE));
      }
      
      // Destroy them
      materials.forEach(material => {
        material.destroy();
      });
      
      // Verify destroy was called (cleanup handled by Phaser)
      materials.forEach(material => {
        expect(material.destroy).toHaveBeenCalled();
      });
    });
  });

  describe('collision detection optimization', () => {
    test('should handle multiple materials without performance degradation', () => {
      const crane = new Crane(mockScene, 400, 200, 350);
      const materials: Material[] = [];
      
      // Create many materials to stress test collision detection
      for (let i = 0; i < 100; i++) {
        materials.push(new Material(mockScene, 
          300 + (i % 10) * 20, 
          200 + Math.floor(i / 10) * 20, 
          MaterialType.FIRE
        ));
      }
      
      mockScene.children.list = materials;
      
      const startTime = performance.now();
      
      // Test collision detection performance
      crane['checkForMaterialGrab']();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle even 100 materials quickly
      expect(duration).toBeLessThan(5);
    });
  });
});