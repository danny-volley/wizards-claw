// Second Campfire Scene Script Data
// Evening at the Thornwood Edge Campfire

export interface DialogueLine {
  speaker: string;
  text: string;
  action?: string; // Optional stage direction
}

export const secondCampfireDialogue: DialogueLine[] = [
  {
    speaker: "THURM",
    text: "Another badger! And a wizard by the looks of that hat. I'm Thurm - been traveling these paths for seasons now.",
    action: "standing up from the campfire with a welcoming gesture"
  },
  {
    speaker: "YUVOR",
    text: "Yuvor. Just escaped some nasty thornlings back there. Nearly lost my pouch to their vines.",
    action: "settling down by the fire, checking her material pouch"
  },
  {
    speaker: "THURM",
    text: "Thornlings, eh? I just bash 'em with my walking stick. But you wizards... you can burn them away, can't you?",
    action: "hefting a thick wooden staff with curiosity"
  },
  {
    speaker: "YUVOR",
    text: "An Ember spell works well on them. Though I'm still learning - the timing on grabbing materials takes practice.",
    action: "demonstrating by pulling materials from her pouch"
  },
  {
    speaker: "THURM",
    text: "The Exalted Anima blessed some of us with magic, others with strong backs. Always wondered what it feels like to shape the world with your will.",
    action: "leaning forward with genuine interest"
  },
  {
    speaker: "YUVOR",
    text: "It's... like reaching into a flowing river and pulling out exactly what you need. When it works. When it doesn't, well...",
    action: "rubbing a small burn mark on her paw with a rueful smile"
  }
];

export const sceneMetadata = {
  sceneId: "second_campfire",
  location: "Thornwood Edge Campfire",
  timeOfDay: "Evening",
  characters: ["YUVOR", "THURM"],
  nextScene: "continue_journey",
  backgroundMusic: "peaceful_evening",
  environmentSound: "distant_forest_sounds"
};