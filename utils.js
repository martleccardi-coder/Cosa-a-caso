{
  "name": "Quest",
  "type": "object",
  "properties": {
    "group_id": { "type": "string" },
    "title": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["active", "completed", "failed", "hidden", "rumored"],
      "default": "hidden"
    },
    "type": {
      "type": "string",
      "enum": ["main", "side", "personal", "faction", "secret"],
      "default": "side"
    },
    "player_description": { "type": "string" },
    "gm_notes": { "type": "string" },
    "objectives": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "completed": { "type": "boolean", "default": false },
          "gm_only": { "type": "boolean", "default": false }
        }
      }
    },
    "reward": { "type": "string" },
    "giver_npc": { "type": "string" },
    "location": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "created_by_user_id": { "type": "string" }
  },
  "required": ["title", "group_id"]
}