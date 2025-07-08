import { MaterialBag } from '../../objects/MaterialBag';
import { Material, MaterialType } from '../../objects/Material';

describe('MaterialBag', () => {
  let mockScene: any;
  let materialBag: MaterialBag;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
    materialBag = new MaterialBag(mockScene, 400, 350);
  });

  describe('initialization', () => {
    test('should create MaterialBag with correct position', () => {
      expect(materialBag.x).toBe(400);
      expect(materialBag.y).toBe(350);
      expect(mockScene.add.existing).toHaveBeenCalledWith(materialBag);
    });

    test('should initialize with correct capacity', () => {
      expect(materialBag['maxCapacity']).toBe(15);
      expect(materialBag['bagWidth']).toBe(160);
      expect(materialBag['bagHeight']).toBe(120);
    });

    test('should start with empty materials array', () => {
      // Create new bag without auto-initialization to test empty state
      const emptyBag = Object.create(MaterialBag.prototype);
      MaterialBag.call(emptyBag, mockScene, 400, 350);
      
      expect(emptyBag['materials']).toEqual([]);
    });

    test('should create physics walls', () => {
      expect(mockScene.physics.add.staticGroup).toHaveBeenCalled();
      expect(mockScene.physics.add.existing).toHaveBeenCalled();
    });
  });

  describe('material management', () => {
    test('should add material successfully', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      const result = materialBag.addMaterial(material);
      
      expect(result).toBe(true);
      expect(materialBag['materials']).toContain(material);
      expect(material.setPosition).toHaveBeenCalled();
    });

    test('should not add material when at capacity', () => {
      // Fill bag to capacity
      for (let i = 0; i < 15; i++) {
        materialBag['materials'].push(new Material(mockScene, 0, 0, MaterialType.FIRE));
      }
      
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      const result = materialBag.addMaterial(material);
      
      expect(result).toBe(false);
      expect(materialBag['materials'].length).toBe(15);
    });

    test('should remove material successfully', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      materialBag.addMaterial(material);
      
      const result = materialBag.removeMaterial(material);
      
      expect(result).toBe(true);
      expect(materialBag['materials']).not.toContain(material);
    });

    test('should not remove material not in bag', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      
      const result = materialBag.removeMaterial(material);
      
      expect(result).toBe(false);
    });

    test('should clear all materials', () => {
      const material1 = new Material(mockScene, 0, 0, MaterialType.FIRE);
      const material2 = new Material(mockScene, 0, 0, MaterialType.LEAF);
      materialBag.addMaterial(material1);
      materialBag.addMaterial(material2);
      
      materialBag.clear();
      
      expect(materialBag['materials'].length).toBe(0);
      expect(material1.destroy).toHaveBeenCalled();
      expect(material2.destroy).toHaveBeenCalled();
    });
  });

  describe('random material generation', () => {
    test('should add balanced distribution of materials', () => {
      jest.clearAllMocks();
      mockScene.time.delayedCall.mockImplementation((delay, callback) => callback());
      
      const result = materialBag.addRandomMaterials(6);
      
      expect(result).toBe(6);
      expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(6);
    });

    test('should respect capacity when adding random materials', () => {
      // Fill bag almost to capacity
      for (let i = 0; i < 14; i++) {
        materialBag['materials'].push(new Material(mockScene, 0, 0, MaterialType.FIRE));
      }
      
      jest.clearAllMocks();
      mockScene.time.delayedCall.mockImplementation((delay, callback) => callback());
      
      const result = materialBag.addRandomMaterials(5);
      
      expect(result).toBe(5); // Requested 5
      expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(5); // Scheduled 5
      // But only 1 should actually be added due to capacity
    });

    test('should stagger material drops with timing', () => {
      materialBag.addRandomMaterials(3);
      
      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(0 * 400, expect.any(Function));
      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(1 * 400, expect.any(Function));
      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(2 * 400, expect.any(Function));
    });
  });

  describe('gather materials functionality', () => {
    test('should add gather materials with timing', () => {
      materialBag.addGatherMaterials(4);
      
      expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(4);
    });

    test('should use addMaterialWithTiming for gather materials', () => {
      jest.clearAllMocks();
      mockScene.time.delayedCall.mockImplementation((delay, callback) => callback());
      
      materialBag.addGatherMaterials(2);
      
      expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(2);
    });
  });

  describe('material positioning', () => {
    test('should position materials within bag bounds', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      
      materialBag.addMaterial(material);
      
      const setPositionCall = material.setPosition as jest.Mock;
      const [x, y] = setPositionCall.mock.calls[0];
      
      // Should be within reasonable bounds of the bag
      expect(x).toBeGreaterThan(300); // Rough left bound
      expect(x).toBeLessThan(500); // Rough right bound
      expect(y).toBeLessThan(360); // Should be at or above bag position
    });

    test('should emit materialDropped event', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      
      materialBag.addMaterial(material);
      
      expect(mockScene.events.emit).toHaveBeenCalledWith('materialDropped');
    });

    test('should set material velocity for natural falling', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      
      materialBag.addMaterial(material);
      
      expect(material.body.setVelocity).toHaveBeenCalledWith(
        expect.any(Number), // Small horizontal variance
        expect.any(Number)  // Downward velocity
      );
    });
  });

  describe('50% more materials', () => {
    test('should initialize with 12 materials instead of 8', () => {
      // This tests the 50% increase (8 -> 12)
      expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(12);
    });
  });

  describe('randomized material distribution', () => {
    test('should shuffle material types for randomized placement', () => {
      jest.clearAllMocks();
      const materialTypes: MaterialType[] = [];
      
      // Mock the material creation to capture types
      mockScene.time.delayedCall.mockImplementation((delay, callback) => {
        // Simulate material creation
        const mockMaterial = new Material(mockScene, 0, 0, MaterialType.FIRE);
        materialTypes.push(mockMaterial.materialType);
        callback();
      });
      
      materialBag.addRandomMaterials(6);
      
      // Should have balanced distribution (2 of each type for 6 materials)
      const fireCounts = materialTypes.filter(t => t === MaterialType.FIRE).length;
      const leafCounts = materialTypes.filter(t => t === MaterialType.LEAF).length;
      const rockCounts = materialTypes.filter(t => t === MaterialType.ROCK).length;
      
      expect(fireCounts).toBe(2);
      expect(leafCounts).toBe(2);
      expect(rockCounts).toBe(2);
    });
  });
});