import { Crane } from '../../objects/Crane';
import { Material, MaterialType } from '../../objects/Material';

describe('Crane', () => {
  let mockScene: any;
  let crane: Crane;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
    crane = new Crane(mockScene, 400, 200, 350);
  });

  describe('initialization', () => {
    test('should create Crane with correct position', () => {
      expect(crane.x).toBe(400);
      expect(crane.y).toBe(200);
      expect(mockScene.add.existing).toHaveBeenCalledWith(crane);
    });

    test('should start in swinging state', () => {
      expect(crane.isActive()).toBe(false); // Not descending or ascending
      expect(crane['isSwinging']).toBe(true);
    });

    test('should initialize with correct default values', () => {
      expect(crane['swingRange']).toBe(100);
      expect(crane['swingSpeed']).toBe(0.02);
      expect(crane['cableLength']).toBe(50);
      expect(crane['clawOpen']).toBe(true);
      expect(crane['grabbedMaterial']).toBe(null);
    });
  });

  describe('swing mechanics', () => {
    test('should calculate swing position correctly', () => {
      crane['currentSwingAngle'] = 0;
      expect(crane.getCurrentSwingPosition()).toBe(0);

      crane['currentSwingAngle'] = Math.PI / 2;
      expect(crane.getCurrentSwingPosition()).toBe(100); // swingRange
    });

    test('should return swing progress as 0-1', () => {
      crane['currentSwingAngle'] = 0;
      expect(crane.getSwingProgress()).toBe(0);

      crane['currentSwingAngle'] = Math.PI;
      expect(crane.getSwingProgress()).toBe(0.5);

      crane['currentSwingAngle'] = Math.PI * 2;
      expect(crane.getSwingProgress()).toBe(0);
    });

    test('should update swing angle when swinging', () => {
      const initialAngle = crane['currentSwingAngle'];
      crane.update();
      expect(crane['currentSwingAngle']).not.toBe(initialAngle);
    });

    test('should stop swinging when descent starts', () => {
      crane.startDescent();
      expect(crane['isSwinging']).toBe(false);
      expect(crane['isDescending']).toBe(true);
    });

    test('should resume swinging after action complete', () => {
      crane.startDescent();
      crane['completeCraneAction']();
      expect(crane['isSwinging']).toBe(true);
    });
  });

  describe('claw world position', () => {
    test('should calculate claw position correctly', () => {
      crane['currentSwingAngle'] = 0;
      const pos = crane.getClawWorldPosition();
      
      expect(pos.x).toBe(400); // crane.x + 0 swing
      expect(pos.y).toBe(250); // crane.y + cableLength (50)
    });

    test('should account for swing angle in position', () => {
      crane['currentSwingAngle'] = Math.PI / 2;
      const pos = crane.getClawWorldPosition();
      
      expect(pos.x).toBe(500); // crane.x + swingRange (100)
      expect(pos.y).toBe(250); // crane.y + cableLength
    });
  });

  describe('descent mechanics', () => {
    test('should start descent correctly', () => {
      crane.startDescent();
      
      expect(crane['isDescending']).toBe(true);
      expect(crane['isSwinging']).toBe(false);
      expect(crane.isActive()).toBe(true);
    });

    test('should not start descent if already active', () => {
      crane['isDescending'] = true;
      const spy = jest.spyOn(mockScene.tweens, 'add');
      
      crane.startDescent();
      
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('material grabbing', () => {
    test('should grab material within range', () => {
      const material = new Material(mockScene, 400, 250, MaterialType.FIRE);
      mockScene.children.list = [material];
      
      crane['checkForMaterialGrab']();
      
      expect(crane['grabbedMaterial']).toBe(material);
      expect(material.isBeingGrabbed).toBe(true);
      expect(crane['clawOpen']).toBe(false);
    });

    test('should not grab material outside range', () => {
      const material = new Material(mockScene, 500, 250, MaterialType.FIRE);
      mockScene.children.list = [material];
      
      crane['checkForMaterialGrab']();
      
      expect(crane['grabbedMaterial']).toBe(null);
      expect(material.isBeingGrabbed).toBe(false);
    });

    test('should grab closest material when multiple in range', () => {
      const material1 = new Material(mockScene, 410, 250, MaterialType.FIRE);
      const material2 = new Material(mockScene, 405, 250, MaterialType.LEAF);
      mockScene.children.list = [material1, material2];
      
      crane['checkForMaterialGrab']();
      
      expect(crane['grabbedMaterial']).toBe(material2); // Closer one
    });
  });

  describe('collision detection during descent', () => {
    test('should stop descent when hitting material', () => {
      const material = new Material(mockScene, 400, 240, MaterialType.FIRE);
      mockScene.children.list = [material];
      
      crane['isDescending'] = true;
      crane['checkForMaterialCollisionDuringDescent']();
      
      expect(mockScene.tweens.killTweensOf).toHaveBeenCalledWith(crane);
    });

    test('should not stop descent for distant materials', () => {
      const material = new Material(mockScene, 450, 250, MaterialType.FIRE);
      mockScene.children.list = [material];
      
      crane['isDescending'] = true;
      crane['checkForMaterialCollisionDuringDescent']();
      
      expect(mockScene.tweens.killTweensOf).not.toHaveBeenCalled();
    });
  });

  describe('action completion', () => {
    test('should emit events when action completes', () => {
      const material = new Material(mockScene, 400, 250, MaterialType.FIRE);
      crane['grabbedMaterial'] = material;
      material.isBeingGrabbed = true;
      
      crane['completeCraneAction']();
      
      expect(mockScene.events.emit).toHaveBeenCalledWith('materialGrabbed', material);
      expect(mockScene.events.emit).toHaveBeenCalledWith('craneActionComplete');
      expect(material.isBeingGrabbed).toBe(false);
    });

    test('should reset crane state after completion', () => {
      crane['grabbedMaterial'] = new Material(mockScene, 400, 250, MaterialType.FIRE);
      crane['isAscending'] = true;
      
      crane['completeCraneAction']();
      
      expect(crane['grabbedMaterial']).toBe(null);
      expect(crane['clawOpen']).toBe(true);
      expect(crane['isAscending']).toBe(false);
      expect(crane['isSwinging']).toBe(true);
    });
  });

  describe('precision grabbing', () => {
    test('should have small grab radius for precision', () => {
      // This tests the grab radius is appropriately small for precision
      const material = new Material(mockScene, 417, 250, MaterialType.FIRE); // 17px away
      mockScene.children.list = [material];
      
      crane['checkForMaterialGrab']();
      
      expect(crane['grabbedMaterial']).toBe(null); // Should not grab at 17px distance
    });

    test('should grab material within precise range', () => {
      const material = new Material(mockScene, 415, 250, MaterialType.FIRE); // 15px away
      mockScene.children.list = [material];
      
      crane['checkForMaterialGrab']();
      
      expect(crane['grabbedMaterial']).toBe(material); // Should grab at 15px distance
    });
  });
});