export const GAME_CATEGORIES = {
  minecraft: [
    { id: "plugins", name: "Plugins" },
    { id: "server-setups", name: "Server setups" },
    { id: "builds", name: "Builds" },
    { id: "configs", name: "Configs" },
    { id: "graphics", name: "Graphics" },
    { id: "textures", name: "Textures" },
    { id: "models", name: "Models" },
    { id: "server-jars", name: "Server jars" },
    { id: "skripts", name: "Skripts" },
    { id: "other", name: "Other" }
  ],
  roblox: [
    { id: "game-setups", name: "Game setups" },
    { id: "maps", name: "Maps" },
    { id: "scripts", name: "Scripts" },
    { id: "vehicles", name: "Vehicles" },
    { id: "weapons", name: "Weapons" },
    { id: "models", name: "Models" },
    { id: "clothing", name: "Clothing" },
    { id: "graphics-ui", name: "Graphics & UI" },
    { id: "animations-vfx", name: "Animations & VFX" },
    { id: "audio", name: "Audio" }
  ],
  hytale: [
    { id: "plugins", name: "Plugins" },
    { id: "data-assets", name: "Data assets" },
    { id: "server-setups", name: "Server setups" },
    { id: "builds", name: "Builds" },
    { id: "graphics", name: "Graphics" },
    { id: "textures", name: "Textures" },
    { id: "models", name: "Models" },
    { id: "audio", name: "Audio" },
    { id: "other", name: "Other" }
  ],
  discord: [
    { id: "bots", name: "Bots" },
    { id: "graphics", name: "Graphics" },
    { id: "other", name: "Other" }
  ]
};

export const getCategoryName = (game, id) => {
  const cats = GAME_CATEGORIES[game];
  if (!cats) return id;
  const found = cats.find(c => c.id === id);
  return found ? found.name : id;
};
