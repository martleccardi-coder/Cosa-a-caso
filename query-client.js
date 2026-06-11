{
  "name": "PartyInventory",
  "type": "object",
  "properties": {
    "group_id": { "type": "string" },
    "name": { "type": "string" },
    "description": { "type": "string" },
    "quantity": { "type": "number", "default": 1 },
    "weight_kg": { "type": "number", "default": 0 },
    "value_gp": { "type": "number", "default": 0 },
    "category": {
      "type": "string",
      "enum": ["weapon", "armor", "gear", "consumable", "magic_item", "currency", "quest_item", "other"],
      "default": "gear"
    },
    "status": {
      "type": "string",
      "enum": ["shared", "owned", "loaned", "missing", "destroyed"],
      "default": "shared"
    },
    "owner_character_name": { "type": "string" },
    "loaned_to_character_name": { "type": "string" },
    "notes": { "type": "string" },
    "is_attuned": { "type": "boolean", "default": false },
    "added_by_user_id": { "type": "string" }
  },
  "required": ["name", "group_id"]
}