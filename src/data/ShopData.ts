import { ShopItem } from '../scenes/ShopScene';

export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'spell_scroll',
    name: 'Spell Scroll',
    description: 'Unlocks a new spell for your spell list',
    price: 50,
    assetKey: 'item_scroll',
    type: 'spell',
    purchased: false
  },
  {
    id: 'magic_quill',
    name: 'Magic Quill',
    description: 'Enhances the power of an existing spell',
    price: 75,
    assetKey: 'item_quill',
    type: 'upgrade',
    purchased: false
  },
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Increases your maximum health',
    price: 30,
    assetKey: 'item_potion',
    type: 'potion',
    purchased: false
  }
];

export interface PlayerInventory {
  saltCrystals: number;
  purchasedItems: ShopItem[];
}

export const DEFAULT_PLAYER_INVENTORY: PlayerInventory = {
  saltCrystals: 100, // Starting amount for testing
  purchasedItems: []
};