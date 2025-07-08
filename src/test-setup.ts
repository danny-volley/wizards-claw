// Mock Phaser for testing
global.Phaser = {
  Scene: class MockScene {
    add = {
      existing: jest.fn(),
      graphics: jest.fn(() => ({
        fillStyle: jest.fn(),
        fillCircle: jest.fn(),
        fillTriangle: jest.fn(),
        fillPoints: jest.fn(),
        fillRect: jest.fn(),
        fillRoundedRect: jest.fn(),
        lineStyle: jest.fn(),
        lineBetween: jest.fn(),
        strokeRoundedRect: jest.fn(),
        generateTexture: jest.fn(),
        destroy: jest.fn(),
      })),
      text: jest.fn(),
      rectangle: jest.fn(),
      container: jest.fn(),
    };
    physics = {
      add: {
        existing: jest.fn(),
        staticGroup: jest.fn(),
        group: jest.fn(),
        collider: jest.fn(),
      },
      world: {
        setBounds: jest.fn(),
      },
    };
    input = {
      keyboard: {
        addKey: jest.fn(() => ({
          on: jest.fn(),
        })),
      },
    };
    time = {
      delayedCall: jest.fn(),
      now: 0,
    };
    events = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    tweens = {
      add: jest.fn(),
      killTweensOf: jest.fn(),
    };
    children = {
      list: [],
    };
    textures = {
      exists: jest.fn(() => false),
    };
  },
  Physics: {
    Arcade: {
      Sprite: class MockSprite {
        scene: any;
        x: number = 0;
        y: number = 0;
        body: any = {
          setCircle: jest.fn(),
          setBounce: jest.fn(),
          setDrag: jest.fn(),
          setMaxVelocity: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          setMass: jest.fn(),
          setVelocity: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          setAcceleration: jest.fn(),
          setAngularVelocity: jest.fn(),
          setGravity: jest.fn(),
          setEnable: jest.fn(),
          setImmovable: jest.fn(),
          velocity: { x: 0, y: 0 },
          touching: { down: false, left: false, right: false },
          blocked: { down: false, left: false, right: false },
          enable: true,
        };
        
        constructor(scene: any, x: number, y: number, texture?: string) {
          this.scene = scene;
          this.x = x;
          this.y = y;
        }
        
        setDisplaySize = jest.fn();
        setTint = jest.fn();
        setTexture = jest.fn();
        setPosition = jest.fn((x: number, y: number) => {
          this.x = x;
          this.y = y;
        });
        destroy = jest.fn();
      },
      Body: class MockBody {
        velocity = { x: 0, y: 0 };
        touching = { down: false, left: false, right: false };
        blocked = { down: false, left: false, right: false };
        enable = true;
      },
    },
  },
  GameObjects: {
    Container: class MockContainer {
      scene: any;
      x: number = 0;
      y: number = 0;
      
      constructor(scene: any, x: number, y: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
      }
      
      add = jest.fn();
      getBounds = jest.fn(() => ({
        x: this.x - 80,
        y: this.y - 60,
        width: 160,
        height: 120,
      }));
    },
    Sprite: class MockSprite {
      scene: any;
      x: number = 0;
      y: number = 0;
      
      constructor(scene: any, x: number, y: number, texture?: string) {
        this.scene = scene;
        this.x = x;
        this.y = y;
      }
      
      setDisplaySize = jest.fn();
      setTint = jest.fn();
      setTexture = jest.fn();
      setPosition = jest.fn();
      destroy = jest.fn();
    },
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        SPACE: 32,
      },
    },
  },
  Math: {
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) => 
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    },
    Vector2: class MockVector2 {
      x: number;
      y: number;
      constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
      }
    },
  },
} as any;

// Mock global functions
global.jest = require('jest');