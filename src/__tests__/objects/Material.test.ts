import { Material, MaterialType } from '../../objects/Material';

describe('Material', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
  });

  describe('initialization', () => {
    test('should create Material with correct type', () => {
      const material = new Material(mockScene, 100, 200, MaterialType.FIRE);
      
      expect(material.materialType).toBe(MaterialType.FIRE);
      expect(material.isBeingGrabbed).toBe(false);
      expect(mockScene.add.existing).toHaveBeenCalledWith(material);
      expect(mockScene.physics.add.existing).toHaveBeenCalledWith(material);
    });

    test('should set up physics properties correctly', () => {
      const material = new Material(mockScene, 100, 200, MaterialType.LEAF);
      
      expect(material.body.setCircle).toHaveBeenCalledWith(14);
      expect(material.body.setBounce).toHaveBeenCalledWith(0);
      expect(material.body.setDrag).toHaveBeenCalledWith(80);
      expect(material.body.setMaxVelocity).toHaveBeenCalledWith(200);
      expect(material.body.setCollideWorldBounds).toHaveBeenCalledWith(true);
      expect(material.body.setMass).toHaveBeenCalledWith(1);
    });

    test('should set display size correctly', () => {
      const material = new Material(mockScene, 100, 200, MaterialType.ROCK);
      
      expect(material.setDisplaySize).toHaveBeenCalledWith(28, 28);
    });
  });

  describe('material types', () => {
    test('should create different material types', () => {
      const fire = new Material(mockScene, 0, 0, MaterialType.FIRE);
      const leaf = new Material(mockScene, 0, 0, MaterialType.LEAF);
      const rock = new Material(mockScene, 0, 0, MaterialType.ROCK);

      expect(fire.materialType).toBe(MaterialType.FIRE);
      expect(leaf.materialType).toBe(MaterialType.LEAF);
      expect(rock.materialType).toBe(MaterialType.ROCK);
    });

    test('should return correct colors for material types', () => {
      const fire = new Material(mockScene, 0, 0, MaterialType.FIRE);
      const leaf = new Material(mockScene, 0, 0, MaterialType.LEAF);
      const rock = new Material(mockScene, 0, 0, MaterialType.ROCK);

      expect(fire.getColor()).toBe(0xff4444);
      expect(leaf.getColor()).toBe(0x44ff44);
      expect(rock.getColor()).toBe(0xffff44);
    });

    test('should return correct names for material types', () => {
      const fire = new Material(mockScene, 0, 0, MaterialType.FIRE);
      const leaf = new Material(mockScene, 0, 0, MaterialType.LEAF);
      const rock = new Material(mockScene, 0, 0, MaterialType.ROCK);

      expect(fire.getName()).toBe('Fire');
      expect(leaf.getName()).toBe('Leaf');
      expect(rock.getName()).toBe('Rock');
    });
  });

  describe('static methods', () => {
    test('should create random material', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const material = Material.createRandom(mockScene, 100, 200);
      
      expect(material).toBeInstanceOf(Material);
      expect(material.x).toBe(100);
      expect(material.y).toBe(200);
      expect([MaterialType.FIRE, MaterialType.LEAF, MaterialType.ROCK]).toContain(material.materialType);
    });
  });

  describe('texture creation', () => {
    test('should create unique texture for each material type', () => {
      const fire = new Material(mockScene, 0, 0, MaterialType.FIRE);
      const leaf = new Material(mockScene, 0, 0, MaterialType.LEAF);
      const rock = new Material(mockScene, 0, 0, MaterialType.ROCK);

      expect(fire.setTexture).toHaveBeenCalledWith('material-fire');
      expect(leaf.setTexture).toHaveBeenCalledWith('material-leaf');
      expect(rock.setTexture).toHaveBeenCalledWith('material-rock');
    });

    test('should not recreate existing textures', () => {
      mockScene.textures.exists.mockReturnValue(true);
      
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      
      expect(mockScene.add.graphics).not.toHaveBeenCalled();
    });
  });

  describe('grabbed state', () => {
    test('should start with isBeingGrabbed as false', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      
      expect(material.isBeingGrabbed).toBe(false);
    });

    test('should allow setting grabbed state', () => {
      const material = new Material(mockScene, 0, 0, MaterialType.FIRE);
      
      material.isBeingGrabbed = true;
      expect(material.isBeingGrabbed).toBe(true);
      
      material.isBeingGrabbed = false;
      expect(material.isBeingGrabbed).toBe(false);
    });
  });
});