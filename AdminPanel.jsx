{
  "name": "Rumor",
  "type": "object",
  "properties": {
    "group_id": { "type": "string" },
    "title": { "type": "string" },
    "content": { "type": "string" },
    "source": { "type": "string" },
    "location": { "type": "string" },
    "veracity": {
      "type": "string",
      "enum": ["true", "false", "partial", "unknown"],
      "default": "unknown"
    },
    "status": {
      "type": "string",
      "enum": ["published", "draft", "resolved"],
      "default": "draft"
    },
    "tags": { "type": "array", "items": { "type": "string" } },
    "gm_truth": { "type": "string" },
    "created_by_user_id": { "type": "string" }
  },
  "required": ["title", "group_id"]
}