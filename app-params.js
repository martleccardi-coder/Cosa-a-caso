{
  "name": "CampaignCalendar",
  "type": "object",
  "properties": {
    "group_id": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "event_type": {
      "type": "string",
      "enum": ["session", "holiday", "festival", "lunar", "world_event", "plot_beat", "custom"],
      "default": "custom"
    },
    "in_game_date": { "type": "string" },
    "real_date": { "type": "string" },
    "is_gm_only": { "type": "boolean", "default": false },
    "recurring": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "created_by_user_id": { "type": "string" }
  },
  "required": ["title", "group_id"]
}