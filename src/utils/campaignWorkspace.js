const STORAGE_PREFIX = 'dnd_forge_campaign_workspace_v1';

function makeId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultCampaignWorkspace() {
  return {
    sessionNotes: '',
    sessionLog: [],
    initiative: [],
    chatThreads: { group: [] },
    privateThreads: {},
    diceLog: [],
    diceInput: { formula: '1d20', advantage: false, disadvantage: false, critical: false, bonus: 0, label: '' },
    map: {
      showGrid: true,
      gridSize: 50,
      fogOpacity: 0.55,
      revealRadius: 120,
      layers: [],
      annotations: [],
      activeLayerId: '',
    },
    miniatures: {},
    notes: [],
    compendiumSearch: '',
    compendiumFilters: { tags: [], type: 'all' },
    versionHistory: [],
    recovery: null,
    templates: [],
    favorites: [],
    partyRoles: {},
    calendar: [],
    spellPrep: {},
    resourceCounters: {},
    inventory: {},
    loot: [],
    homebrew: [],
    moderationQueue: [],
    accessibility: { fontScale: 1, highContrast: false, reducedMotion: false, locale: 'en' },
    ruleReminders: [
      'Start turn: apply ongoing conditions and concentration checks.',
      'Critical hits usually double damage dice, not static bonuses.',
      'Opportunity attacks trigger when a creature leaves reach without disengaging.',
    ],
    searchTerm: '',
    lastSavedAt: null,
  };
}

export function workspaceKey(groupId) {
  return `${STORAGE_PREFIX}:${groupId || 'global'}`;
}

export function loadCampaignWorkspace(groupId) {
  if (typeof window === 'undefined') return defaultCampaignWorkspace();
  try {
    const raw = window.localStorage.getItem(workspaceKey(groupId));
    if (!raw) return defaultCampaignWorkspace();
    const parsed = JSON.parse(raw);
    return { ...defaultCampaignWorkspace(), ...parsed };
  } catch {
    return defaultCampaignWorkspace();
  }
}

export function saveCampaignWorkspace(groupId, workspace) {
  if (typeof window === 'undefined') return workspace;
  const next = { ...defaultCampaignWorkspace(), ...workspace, lastSavedAt: new Date().toISOString() };
  window.localStorage.setItem(workspaceKey(groupId), JSON.stringify(next));
  return next;
}

export function exportCampaignWorkspace(groupId, workspace) {
  const data = JSON.stringify({ groupId, exportedAt: new Date().toISOString(), workspace }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campaign_${String(groupId || 'workspace')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importCampaignWorkspaceFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (parsed?.workspace) return { groupId: parsed.groupId || null, workspace: parsed.workspace };
  return { groupId: null, workspace: parsed };
}

export function createSnapshot(workspace, label = 'Snapshot') {
  return {
    id: makeId('snapshot'),
    label,
    createdAt: new Date().toISOString(),
    workspace: JSON.parse(JSON.stringify(workspace)),
  };
}

export function diceRoll(expression, { advantage = false, disadvantage = false, critical = false } = {}) {
  const cleaned = String(expression || '1d20').trim().toLowerCase();
  const match = cleaned.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
  if (!match) return null;
  const count = Math.max(1, Number(match[1] || 1));
  const sides = Math.max(1, Number(match[2] || 20));
  const bonus = Number(match[3] || 0);
  const rolls = [];

  const totalDice = critical ? count * 2 : count;
  for (let i = 0; i < totalDice; i += 1) {
    rolls.push(1 + Math.floor(Math.random() * sides));
  }

  let selected = rolls;
  if (count === 1 && sides === 20 && (advantage || disadvantage)) {
    selected = advantage ? [Math.max(...rolls.slice(0, 2))] : [Math.min(...rolls.slice(0, 2))];
  }

  return {
    expression: cleaned,
    rolls,
    selected,
    bonus,
    total: selected.reduce((sum, value) => sum + value, 0) + bonus,
  };
}

export function reorderArray(items, fromIndex, toIndex) {
  const copy = [...items];
  if (fromIndex < 0 || fromIndex >= copy.length || toIndex < 0 || toIndex >= copy.length) return copy;
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function makeLocalDuplicate(source, kind = 'template') {
  const clone = JSON.parse(JSON.stringify(source || {}));
  return { ...clone, id: makeId(kind), duplicatedAt: new Date().toISOString() };
}
