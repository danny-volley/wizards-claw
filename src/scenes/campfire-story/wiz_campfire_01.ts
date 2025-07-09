// Opening Scene Script Data
// Dawn at the Wayward Campfire

export interface DialogueLine {
  speaker: string;
  text: string;
  action?: string; // Optional stage direction
}

export const openingSceneDialogue: DialogueLine[] = [
  {
    speaker: "BUROK",
    text: "The Grand Mound, eh? That's an ambitious trek, even for a wizard.",
    action: "stirring the fire with a stick"
  },
  {
    speaker: "YUVOR",
    text: "Every great badger wizard has made the journey, Burok. The masters at the monastery hold secrets I can't learn anywhere else.",
    action: "adjusting her pointed hat with determination"
  },
  {
    speaker: "BUROK",
    text: "The path ahead is dangerous - foxes, lizards, and worse. But if any badger can make it, it's one with your spirit.",
    action: "gesturing toward the darkened landscape beyond the fire"
  },
  {
    speaker: "YUVOR",
    text: "I've been practicing my spells. Watch this!",
    action: "patting her material pouch confidently"
  },
  {
    speaker: "",
    text: "(Yuvor reaches into her pouch and pulls out a pebble and pinecone, making them glow with magical energy)",
    action: "spell demonstration"
  },
  {
    speaker: "BUROK",
    text: "Not bad. The Exalted Anima expects us to grow stronger through every challenge.",
    action: "standing and stretching"
  },
  {
    speaker: "BUROK",
    text: "The sun's coming up. Time for your adventure to begin.",
    action: "looking toward the lightening horizon"
  },
  {
    speaker: "YUVOR",
    text: "Fire, Leaf, Rock... let's see what the world has to teach me.",
    action: "begins walking toward the sunrise"
  }
];

export const sceneMetadata = {
  sceneId: "opening_campfire",
  location: "Lowland Meadows Campfire",
  timeOfDay: "Pre-dawn",
  characters: ["YUVOR", "BUROK"],
  nextScene: "tutorial_material_gathering",
  backgroundMusic: "campfire_ambient",
  environmentSound: "crackling_fire"
};