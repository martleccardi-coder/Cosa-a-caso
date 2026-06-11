{
  "name": "NpcSheet",
  "type": "object",
  "properties": {
    "group_id": { "type": "string" },
    "name": { "type": "string" },
    "race": { "type": "string" },
    "occupation": { "type": "string" },
    "location": { "type": "string" },
    "attitude": {
      "type": "string",
      "enum": ["friendly", "neutral", "unfriendly", "hostile", "unknown"],
      "default": "neutral"
    },
    "goals": { "type": "string" },
    "fears": { "type": "string" },
    "secrets": { "type": "string" },
    "speech_patterns": { "type": "string" },
    "voice_notes": { "type": "string" },
    "conversation_triggers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "topic": { "type": "string" },
          "response": { "type": "string" },
          "is_gm_only": { "type": "boolean", "default": true }
        }
      }
    },
    "faction_affiliations": { "type": "string" },
    "relationship_to_party": { "type": "string" },
    "notes": { "type": "string" },
    "is_gm_only": { "type": "boolean", "default": true },
    "created_by_user_id": { "type": "string" }
  },
  "required": ["name", "group_id"]
}