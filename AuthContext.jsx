{
  "name": "Faction",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "alignment": { "type": "string" },
    "symbol": { "type": "string" },
    "group_id": { "type": "string" },
    "color": { "type": "string", "default": "#7A5C1E" },
    "reputation_entries": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string" },
          "character_name": { "type": "string" },
          "change": { "type": "number" },
          "current": { "type": "number" },
          "reason": { "type": "string" }
        }
      }
    },
    "created_by_user_id": { "type": "string" }
  },
  "required": ["name"]
}