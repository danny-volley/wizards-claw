// Lizard Campfire Scene Script Data
// Night at the Craglands Rest Campfire

export interface DialogueLine {
  speaker: string;
  text: string;
  action?: string; // Optional stage direction
}

export const lizardCampfireDialogue: DialogueLine[] = [
  {
    speaker: "SYTHARA",
    text: "A badger wizard approaches my fire. Please, sit - the flames welcome all who seek warmth and rest.",
    action: "gesturing gracefully to a spot by the fire, golden scales glinting"
  },
  {
    speaker: "YUVOR",
    text: "Thank you. I... wasn't sure. The other lizards I've met weren't so welcoming.",
    action: "cautiously settling by the fire, hand near her pouch"
  },
  {
    speaker: "SYTHARA",
    text: "Many of my people guard their territories fiercely. But campfires are sacred - neutral ground where old grudges rest.",
    action: "stirring the flames with a long claw, making them dance higher"
  },
  {
    speaker: "YUVOR",
    text: "You tend fire so skillfully. Are you a wizard too?",
    action: "watching the dancing flames with wonder"
  },
  {
    speaker: "SYTHARA",
    text: "No magic in me, young badger. But the Sun Disk blessed all lizards with understanding of flame and warmth - wizard or not.",
    action: "looking up at the stars with a contemplative expression"
  },
  {
    speaker: "YUVOR",
    text: "Maybe that's what the Grand Mound masters mean about understanding all paths. Even different ones can lead to the same light.",
    action: "relaxing visibly, moving closer to the shared warmth"
  }
];

export const sceneMetadata = {
  sceneId: "lizard_campfire",
  location: "Craglands Rest Campfire",
  timeOfDay: "Night",
  characters: ["YUVOR", "SYTHARA"],
  nextScene: "craglands_exploration",
  backgroundMusic: "mystical_fire",
  environmentSound: "crackling_flames_wind"
};