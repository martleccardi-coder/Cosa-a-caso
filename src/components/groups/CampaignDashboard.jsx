import { useEffect, useMemo, useState } from 'react';
import { Download, Upload, Printer, Save, Sparkles, Sword, MessageSquare, Dice6, Map, Layers3, ShieldCheck, HeartPulse, LibraryBig, CalendarDays, BookOpen, Star, Users, Tag, Search, RefreshCcw, Copy, AlertTriangle, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown, Check, X, Plus } from 'lucide-react';
import { createSnapshot, defaultCampaignWorkspace, diceRoll, exportCampaignWorkspace, importCampaignWorkspaceFromFile, loadCampaignWorkspace, makeLocalDuplicate, reorderArray, saveCampaignWorkspace } from '@/utils/campaignWorkspace';

const UI_LABELS = {
  en: {
    dashboard: 'Campaign Dashboard', notes: 'Session notes', combat: 'Combat', chat: 'Group chat', dice: 'Dice roller', map: 'Battle map', compendium: 'Compendium', history: 'Version history', calendar: 'Calendar', resources: 'Resources', homebrew: 'Homebrew', favorites: 'Favorites', print: 'Print summary', export: 'Export JSON', import: 'Import JSON', recover: 'Recover', snapshot: 'Save point', settings: 'Accessibility', search: 'Search', add: 'Add', save: 'Save', send: 'Send', approve: 'Approve', reject: 'Reject', visible: 'Visible', hidden: 'Hidden', public: 'Public', private: 'Private', group: 'Group', privateMsg: 'Private messages', initiative: 'Initiative tracker', loot: 'Loot', bestiary: 'Bestiary', reminders: 'Rule reminders', templates: 'Templates', layers: 'Layers', minis: 'Miniatures', sessions: 'Sessions', quests: 'Quests', notesAttach: 'Notes / lore / reminders', roles: 'Party roles', inventory: 'Inventory', spellPrep: 'Spell prep', encumbrance: 'Encumbrance', conditions: 'Conditions', healthBars: 'Health bars', autoSave: 'Autosave', reduceMotion: 'Reduced motion', highContrast: 'High contrast', largerText: 'Larger text', language: 'UI language', addThread: 'New thread', addLayer: 'Add layer', addNote: 'Add note', duplicate: 'Duplicate', moderate: 'Moderate', recoverFrom: 'Recover from snapshot', restore: 'Restore', currentMap: 'Current map', reveal: 'Reveal', grid: 'Grid', fog: 'Fog of war', annotations: 'Annotations', summary: 'Summary report', partySize: 'Party size', difficulty: 'Difficulty', encounter: 'Encounter builder', partyMembers: 'Party members', questStatus: 'Quest status', uploadAudio: 'Session audio', handouts: 'Handouts', portraits: 'Portraits', lootChest: 'Loot chest', favoritesQuick: 'Quick access', ui: 'Interface', resourcesCounters: 'Resource counters', concentration: 'Concentration', spellSlots: 'Spell slots', prepared: 'Prepared spells', resets: 'Daily resets', manage: 'Manage', tags: 'Tags', filter: 'Filter', visibility: 'Visibility', notesPanel: 'Notes panel', duplicateTemplate: 'Template copy', noteTarget: 'Attach to', homebrewQueue: 'Moderation queue', allContent: 'All uploaded content', noData: 'No data yet', gmOnly: 'GM only', observer: 'Read-only observer', assistant: 'Assistant', coGM: 'Co-GM', tank: 'Tank', healer: 'Healer', damage: 'Damage dealer', support: 'Support', total: 'Total', roll: 'Roll', advantage: 'Advantage', disadvantage: 'Disadvantage', critical: 'Critical', customPool: 'Custom pool', privateThread: 'Private message thread', groupThread: 'Group thread', addPlayer: 'Add player', assignedRole: 'Assigned role', visibilityNote: 'Sheet and profile visibility is controlled here', sheetLang: 'Sheets remain in English', localeInfo: 'UI only', recoverHint: 'Recovery point for accidental edits', autosaved: 'Autosaved', recoverNow: 'Recover now', annotationsHint: 'Labels, icons, arrows, hidden layers', mapTools: 'Map tools', bars: 'Token HP bars', statusEffects: 'Status effects', publicSheet: 'Public sheet', privateSheet: 'Private sheet', lore: 'Lore', reminder: 'Reminder', pin: 'Pin', unpin: 'Unpin', create: 'Create', approveReject: 'Approve or reject homebrew', loadSaved: 'Load saved data', sessionReport: 'Printable campaign report', handoutLibrary: 'Handout library', questBoard: 'Quest board', audioLibrary: 'Audio library', quickLinks: 'Quick links', reviewers: 'Reviewers', observers: 'Observers', assistantGM: 'Assistant GM', coGm: 'Co-GM', duplicateChar: 'Duplicate character', duplicateNpc: 'Duplicate NPC', duplicateMonster: 'Duplicate monster', recoverText: 'Recovered from snapshot', ruleReminders: 'Rule reminders', encounterNotes: 'Encounter notes', treasureManager: 'Treasure manager', diceHistory: 'Dice history', sessionLog: 'Session log', shareSheet: 'Share sheet', privateNotes: 'Private notes', publicNotes: 'Public notes', creatureProfiles: 'Creature profiles', characterSheets: 'Character sheets', itemNotes: 'Item notes', locationNotes: 'Location notes', selectThread: 'Select thread', noThread: 'No thread selected', noMap: 'No active map selected', showHealth: 'Show health', hideHealth: 'Hide health', markComplete: 'Complete', markFailed: 'Failed', markHidden: 'Hidden', markActive: 'Active', markOpen: 'Open', markApproved: 'Approved', markRejected: 'Rejected', markPending: 'Pending', noteType: 'Type', attachToAny: 'Attach to any record', recoverLatest: 'Recover latest snapshot', savePoint: 'Save point', resetDaily: 'Daily reset', clearAll: 'Clear all', searchCompendium: 'Search compendium', contentType: 'Content type', sort: 'Sort', reorder: 'Reorder', mapLayerSystem: 'Map layer system', combatTurnOrder: 'Combat turn order', sessionNotes: 'Session notes', initiativeCard: 'Initiative cards', privateMessages: 'Private messages', sharedChat: 'Shared group chat', autoRules: 'Automatic rule reminders', sheetVersions: 'Character and NPC versions', importExport: 'Import / export', favoriteQuickAccess: 'Favorite quick access', visibleToGroup: 'Visible to group', gmApproval: 'GM approval', settingsPanel: 'Settings', languageUi: 'Language', off: 'Off', on: 'On', addReminder: 'Add reminder', addEvent: 'Add event', addLoot: 'Add loot', addQuest: 'Add quest', addHomebrew: 'Add homebrew', addTemplate: 'Add template', addLayerBtn: 'Layer', addNoteBtn: 'Note', addRoll: 'Roll dice', addEntry: 'Add entry', addMiniature: 'Miniature', addEventBtn: 'Event', addCounter: 'Counter', addCondition: 'Condition', addMessage: 'Message', addReward: 'Reward', addFilter: 'Filter', resetView: 'Reset view', revealArea: 'Reveal area', hideArea: 'Hide area', fogArea: 'Fog area', toggleGrid: 'Toggle grid', openSummary: 'Open summary', battleMap: 'Battle map', searchAll: 'Search all', partyRoles: 'Party roles', characters: 'Characters', npcs: 'NPCs', monsters: 'Monsters', items: 'Items', maps: 'Maps', questsType: 'Quests', other: 'Other', clean: 'Clean', saveSnapshot: 'Save snapshot', versionLabel: 'Version history', recoverLabel: 'Recovery', max: 'Max', current: 'Current', addConditionBtn: 'Add condition', addStatus: 'Add status', health: 'Health', label: 'Label', privateThreadHint: 'GM can message each player privately.', groupThreadHint: 'Shared group chat is visible to all members.', noteHint: 'Any content can store notes, lore, or reminders.', spellReminder: 'Concentration and spell-slot tracking', inventoryReminder: 'Inventory categories and encumbrance', calendarReminder: 'In-game time, rests, travel, events', lootReminder: 'Treasure distribution and loot chest', compendiumReminder: 'Search across uploaded group content', mapReminder: 'Layers, grids, fog, and reveal tools', moderatorHint: 'Approve or reject homebrew content here.', uiHint: 'Sheet content stays in English.', quickAccess: 'Pinned favorites', privateVisibility: 'Private visibility', publicVisibility: 'Public visibility', sessionAudio: 'Session audio and ambient tracks', handoutDocs: 'Handouts, letters, clues, and lore documents', portraitsGallery: 'Portrait gallery', questStatusLabel: 'Quest status system', timeTracker: 'In-game time', restTracker: 'Rest tracker', travelTracker: 'Travel tracker', scheduledEvents: 'Scheduled events', partyRoleMarkers: 'Party role markers', monsterStats: 'Monster stats', encounterBuilder: 'Encounter builder', difficultyByParty: 'Difficulty by party size', initiativeCards: 'Initiative cards', diceLog: 'Dice log history', accessibilityOptions: 'Accessibility options', multilingual: 'Multilingual UI', favourites: 'Favorites', moderation: 'Moderation', summaryReport: 'Campaign summary report', battleTools: 'Battle tools', characterTools: 'Character tools', records: 'Records', quickSearch: 'Quick search', quickActions: 'Quick actions', publicPrivate: 'Public / private', assignRoles: 'Assign roles', addThread: 'Add thread', addSnapshot: 'Add snapshot', noSnapshot: 'No snapshots yet', recoverSnapshot: 'Recover snapshot', turnOrder: 'Turn order', addToCompendium: 'Add to compendium', pinned: 'Pinned', unpinned: 'Unpinned', maximize: 'Maximize', minimize: 'Minimize', hiddenLayer: 'Hidden layer', showLayer: 'Show layer', layerOpacity: 'Opacity', layerName: 'Layer name', layerType: 'Layer type', revealSpot: 'Reveal spot', miniSummary: 'Miniature summary', clickToEdit: 'Click to edit', noResults: 'No results', searchResults: 'Search results', manageRoles: 'Manage roles', partyOverview: 'Party overview', encounterList: 'Encounter list', quickNotes: 'Quick notes', notesAndLore: 'Notes and lore', partySheetVisibility: 'Sheet visibility', homebrewReview: 'Homebrew review', publicChat: 'Public chat', privateChat: 'Private chat', gmTools: 'GM tools', playerTools: 'Player tools', sheetTools: 'Sheet tools', campaignCalendar: 'Campaign calendar', schedule: 'Schedule', rests: 'Rests', travel: 'Travel', events: 'Events', rewards: 'Rewards', handoutGallery: 'Handout gallery', saveChanges: 'Save changes', noteSaved: 'Note saved', importWorkspace: 'Import workspace', exportWorkspace: 'Export workspace'
  },
  it: {
    dashboard: 'Cruscotto campagna', notes: 'Note sessione', combat: 'Combattimento', chat: 'Chat gruppo', dice: 'Dadi', map: 'Mappa', compendium: 'Compendio', history: 'Cronologia', calendar: 'Calendario', resources: 'Risorse', homebrew: 'Homebrew', favorites: 'Preferiti', print: 'Stampa riepilogo', export: 'Esporta JSON', import: 'Importa JSON', recover: 'Recupera', snapshot: 'Punto di salvataggio', settings: 'Accessibilità', search: 'Cerca', add: 'Aggiungi', save: 'Salva', send: 'Invia', approve: 'Approva', reject: 'Rifiuta', visible: 'Visibile', hidden: 'Nascosto', public: 'Pubblico', private: 'Privato', group: 'Gruppo', privateMsg: 'Messaggi privati', initiative: 'Ordine di iniziativa', loot: 'Bottino', bestiary: 'Bestiario', reminders: 'Promemoria regole', templates: 'Template', layers: 'Livelli', minis: 'Miniature', sessions: 'Sessioni', quests: 'Missioni', notesAttach: 'Note / lore / promemoria', roles: 'Ruoli del party', inventory: 'Inventario', spellPrep: 'Preparazione incantesimi', encumbrance: 'Incarico', conditions: 'Condizioni', healthBars: 'Barre salute', autoSave: 'Salvataggio automatico', reduceMotion: 'Riduci movimento', highContrast: 'Alto contrasto', largerText: 'Testo grande', language: 'Lingua UI', addThread: 'Nuovo thread', addLayer: 'Nuovo livello', addNote: 'Nuova nota', duplicate: 'Duplica', moderate: 'Modera', recoverFrom: 'Recupera da salvataggio', restore: 'Ripristina', currentMap: 'Mappa corrente', reveal: 'Rivela', grid: 'Griglia', fogOfWar: 'Nebbia di guerra', annotations: 'Annotazioni', summary: 'Riepilogo stampabile', partySize: 'Dimensione party', difficulty: 'Difficoltà', encounter: 'Generatore incontro', partyMembers: 'Membri party', questStatus: 'Stato missioni', uploadAudio: 'Audio sessione', handouts: 'Handout', portraits: 'Ritratti', lootChest: 'Cassa bottino', favoritesQuick: 'Accesso rapido', ui: 'Interfaccia', resourcesCounters: 'Contatori risorse', concentration: 'Concentrazione', spellSlots: 'Slot incantesimi', prepared: 'Incantesimi preparati', resets: 'Reset giornalieri', manage: 'Gestisci', tags: 'Tag', filter: 'Filtro', visibility: 'Visibilità', notesPanel: 'Pannello note', duplicateTemplate: 'Copia template', noteTarget: 'Collega a', homebrewQueue: 'Coda moderazione', allContent: 'Tutto il contenuto caricato', noData: 'Nessun dato', gmOnly: 'Solo GM', observer: 'Osservatore sola lettura', assistant: 'Assistente', coGM: 'Co-GM', tank: 'Tank', healer: 'Guaritore', damage: 'Danno', support: 'Supporto', total: 'Totale', roll: 'Lancia', advantage: 'Vantaggio', disadvantage: 'Svantaggio', critical: 'Critico', customPool: 'Pool personalizzato', privateThread: 'Thread privato', groupThread: 'Thread gruppo', addPlayer: 'Aggiungi giocatore', assignedRole: 'Ruolo assegnato', visibilityNote: 'Qui controlli la visibilità di schede e profili', sheetLang: 'Le schede restano in inglese', localeInfo: 'Solo UI', recoverHint: 'Punto di recupero per modifiche accidentali', autosaved: 'Salvato automaticamente', recoverNow: 'Recupera ora', annotationsHint: 'Etichette, icone, frecce, livelli nascosti', mapTools: 'Strumenti mappa', bars: 'Barre HP token', statusEffects: 'Effetti di stato', publicSheet: 'Scheda pubblica', privateSheet: 'Scheda privata', lore: 'Lore', reminder: 'Promemoria', pin: 'Fissa', unpin: 'Rimuovi', create: 'Crea', approveReject: 'Approva o rifiuta homebrew', loadSaved: 'Carica dati salvati', sessionReport: 'Rapporto stampabile campagna', handoutLibrary: 'Libreria handout', questBoard: 'Bacheca missioni', audioLibrary: 'Libreria audio', quickLinks: 'Collegamenti rapidi', reviewers: 'Revisori', observers: 'Osservatori', assistantGM: 'GM assistente', coGm: 'Co-GM', duplicateChar: 'Duplica personaggio', duplicateNpc: 'Duplica NPC', duplicateMonster: 'Duplica mostro', recoverText: 'Ripristinato da snapshot', ruleReminders: 'Promemoria regole', encounterNotes: 'Note incontro', treasureManager: 'Gestione tesoro', diceHistory: 'Cronologia dadi', sessionLog: 'Log sessione', shareSheet: 'Condividi scheda', privateNotes: 'Note private', publicNotes: 'Note pubbliche', creatureProfiles: 'Profili creature', characterSheets: 'Schede personaggio', itemNotes: 'Note oggetto', locationNotes: 'Note luogo', selectThread: 'Seleziona thread', noThread: 'Nessun thread selezionato', noMap: 'Nessuna mappa attiva', showHealth: 'Mostra salute', hideHealth: 'Nascondi salute', markComplete: 'Completa', markFailed: 'Fallita', markHidden: 'Nascosta', markActive: 'Attiva', markOpen: 'Aperta', markApproved: 'Approvata', markRejected: 'Rifiutata', markPending: 'In attesa', noteType: 'Tipo', attachToAny: 'Allega a qualsiasi record', recoverLatest: 'Recupera ultimo snapshot', savePoint: 'Punto di salvataggio', resetDaily: 'Reset giornaliero', clearAll: 'Svuota tutto', searchCompendium: 'Cerca nel compendio', contentType: 'Tipo contenuto', sort: 'Ordina', reorder: 'Riordina', mapLayerSystem: 'Sistema livelli mappa', combatTurnOrder: 'Turni combattimento', sessionNotes: 'Note sessione', initiativeCard: 'Carte iniziativa', privateMessages: 'Messaggi privati', sharedChat: 'Chat gruppo condivisa', autoRules: 'Promemoria automatici regole', sheetVersions: 'Versioni schede e NPC', importExport: 'Importa / esporta', favoriteQuickAccess: 'Accesso rapido preferiti', visibleToGroup: 'Visibile al gruppo', gmApproval: 'Approvazione GM', settingsPanel: 'Impostazioni', languageUi: 'Lingua', off: 'Off', on: 'On', addReminder: 'Aggiungi promemoria', addEvent: 'Aggiungi evento', addLoot: 'Aggiungi bottino', addQuest: 'Aggiungi missione', addHomebrew: 'Aggiungi homebrew', addTemplate: 'Aggiungi template', addLayerBtn: 'Livello', addNoteBtn: 'Nota', addRoll: 'Lancia dadi', addEntry: 'Aggiungi voce', addMiniature: 'Miniatura', addEventBtn: 'Evento', addCounter: 'Contatore', addCondition: 'Condizione', addMessage: 'Messaggio', addReward: 'Ricompensa', addFilter: 'Filtro', resetView: 'Reset vista', revealArea: 'Rivela area', hideArea: 'Nascondi area', fogArea: 'Area nebbia', toggleGrid: 'Mostra griglia', openSummary: 'Apri riepilogo', battleMap: 'Mappa battaglia', searchAll: 'Cerca tutto', partyRoles: 'Ruoli party', characters: 'Personaggi', npcs: 'NPC', monsters: 'Mostri', items: 'Oggetti', maps: 'Mappe', questsType: 'Missioni', other: 'Altro', clean: 'Pulisci', saveSnapshot: 'Salva snapshot', versionLabel: 'Cronologia versioni', recoverLabel: 'Recupero', max: 'Massimo', current: 'Corrente', addConditionBtn: 'Aggiungi condizione', addStatus: 'Aggiungi stato', health: 'Salute', label: 'Etichetta', privateThreadHint: 'Il GM può inviare messaggi privati a ogni giocatore.', groupThreadHint: 'La chat condivisa è visibile a tutti i membri.', noteHint: 'Qualsiasi contenuto può avere note, lore o promemoria.', spellReminder: 'Traccia concentrazione e slot', inventoryReminder: 'Categorie inventario e incarico', calendarReminder: 'Tempo in gioco, riposi, viaggi, eventi', lootReminder: 'Distribuzione tesoro e cassa bottino', compendiumReminder: 'Cerca tra il contenuto caricato del gruppo', mapReminder: 'Livelli, griglie, nebbia e strumenti di rivelazione', moderatorHint: 'Approva o rifiuta il contenuto homebrew qui.', uiHint: 'Il contenuto delle schede resta in inglese.', quickAccess: 'Preferiti fissati', privateVisibility: 'Visibilità privata', publicVisibility: 'Visibilità pubblica', sessionAudio: 'Audio sessione e tracce ambientali', handoutDocs: 'Handout, lettere, indizi e documenti di lore', portraitsGallery: 'Galleria ritratti', questStatusLabel: 'Stato missioni', timeTracker: 'Tempo in gioco', restTracker: 'Tracker riposi', travelTracker: 'Tracker viaggi', scheduledEvents: 'Eventi pianificati', partyRoleMarkers: 'Marcatori ruoli party', monsterStats: 'Statistiche mostri', encounterBuilder: 'Costruttore incontri', difficultyByParty: 'Difficoltà per dimensione party', initiativeCards: 'Carte iniziativa', diceLog: 'Cronologia dadi', accessibilityOptions: 'Opzioni accessibilità', multilingual: 'UI multilingua', favourites: 'Preferiti', moderation: 'Moderazione', summaryReport: 'Report riepilogativo campagna', battleTools: 'Strumenti battaglia', characterTools: 'Strumenti personaggi', records: 'Record', quickSearch: 'Ricerca rapida', quickActions: 'Azioni rapide', publicPrivate: 'Pubblico / privato', assignRoles: 'Assegna ruoli', addThread: 'Aggiungi thread', addSnapshot: 'Aggiungi snapshot', noSnapshot: 'Nessuno snapshot', recoverSnapshot: 'Ripristina snapshot', turnOrder: 'Ordine turni', addToCompendium: 'Aggiungi al compendio', pinned: 'Fissato', unpinned: 'Rimosso', maximize: 'Massimizza', minimize: 'Riduci', hiddenLayer: 'Livello nascosto', showLayer: 'Mostra livello', layerOpacity: 'Opacità', layerName: 'Nome livello', layerType: 'Tipo livello', revealSpot: 'Punto rivelazione', miniSummary: 'Sommario miniatura', clickToEdit: 'Clicca per modificare', noResults: 'Nessun risultato', searchResults: 'Risultati ricerca', manageRoles: 'Gestisci ruoli', partyOverview: 'Panoramica party', encounterList: 'Lista incontri', quickNotes: 'Note rapide', notesAndLore: 'Note e lore', partySheetVisibility: 'Visibilità schede', homebrewReview: 'Revisione homebrew', publicChat: 'Chat pubblica', privateChat: 'Chat privata', gmTools: 'Strumenti GM', playerTools: 'Strumenti giocatore', sheetTools: 'Strumenti scheda', campaignCalendar: 'Calendario campagna', schedule: 'Programma', rests: 'Riposi', travel: 'Viaggi', events: 'Eventi', rewards: 'Ricompense', handoutGallery: 'Galleria handout', saveChanges: 'Salva modifiche', noteSaved: 'Nota salvata', importWorkspace: 'Importa workspace', exportWorkspace: 'Esporta workspace'
  }
};

const TYPE_OPTIONS = ['all','characters','npcs','monsters','items','maps','quests','other'];
const QUEST_STATUS = ['active', 'completed', 'failed', 'hidden'];
const VISIBILITY_OPTIONS = ['public', 'private'];
const ROLE_OPTIONS = ['tank', 'healer', 'damage', 'support', 'leader', 'scout', 'controller', 'none'];
const STATUS_OPTIONS = ['blinded', 'charmed', 'dead', 'deafened', 'frightened', 'grappled', 'incapacitated', 'invisible', 'paralyzed', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious'];

function cn(...parts) { return parts.filter(Boolean).join(' '); }
function uid(prefix = 'id') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function asList(value) { return Array.isArray(value) ? value : []; }
function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  return String(value || '').split(/[,\n]/).map(v => v.trim()).filter(Boolean);
}
function prettyDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleString(); } catch { return String(value); }
}
function percentToOpacity(n) { return Math.min(1, Math.max(0, Number(n) || 0)); }

function panelClass(dashboardStyle) {
  return cn('parchment-box p-4 md:p-5 space-y-3', dashboardStyle);
}

export default function CampaignDashboard({
  group,
  currentMembership,
  currentGroupMembers = [],
  usersById = {},
  sheets = [],
  materials = [],
  creatures = [],
  miniatures = [],
  canManageGroup = false,
}) {
  const groupId = group?.id || 'global';
  const [workspace, setWorkspace] = useState(() => loadCampaignWorkspace(groupId));
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [activeThread, setActiveThread] = useState('group');
  const [activeThreadTarget, setActiveThreadTarget] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [initiativeDragId, setInitiativeDragId] = useState('');
  const [diceAdv, setDiceAdv] = useState(false);
  const [diceDis, setDiceDis] = useState(false);
  const [diceCritical, setDiceCritical] = useState(false);
  const [diceLabel, setDiceLabel] = useState('');
  const [diceFormula, setDiceFormula] = useState('1d20');
  const [diceBonus, setDiceBonus] = useState(0);
  const [dicePool, setDicePool] = useState('');
  const [diceSides, setDiceSides] = useState(6);
  const [noteDraft, setNoteDraft] = useState({ targetType: 'character', targetId: '', title: '', body: '', tags: '', visibility: 'private' });
  const [homebrewDraft, setHomebrewDraft] = useState({ type: 'race', name: '', notes: '', status: 'pending', tags: '' });
  const [importError, setImportError] = useState('');

  const t = (key) => UI_LABELS[workspace.accessibility.locale]?.[key] || UI_LABELS.en[key] || key;
  const isGM = canManageGroup || currentMembership?.role === 'master';

  useEffect(() => {
    const loaded = loadCampaignWorkspace(groupId);
    setWorkspace(loaded);
    setReady(true);
    setSearch('');
    setActiveThread('group');
    setActiveThreadTarget('');
    setDraftMessage('');
    setImportError('');
  }, [groupId]);

  useEffect(() => {
    if (!ready) return;
    saveCampaignWorkspace(groupId, workspace);
  }, [groupId, ready, workspace]);

  const memberOptions = useMemo(() => currentGroupMembers.map(member => ({ id: member.user_id, label: usersById?.[member.user_id]?.name || usersById?.[member.user_id]?.email || member.display_name || 'Member', role: member.role || 'player' })), [currentGroupMembers, usersById]);

  const selectedSheet = useMemo(() => {
    const id = currentGroupMembers.find(member => member.user_id === currentMembership?.user_id)?.selected_character_sheet_id;
    return sheets.find(sheet => sheet.id === id) || sheets.find(sheet => sheet.owner_user_id === currentMembership?.user_id) || null;
  }, [currentGroupMembers, currentMembership, sheets]);

  const visibleMaterials = useMemo(() => materials.filter(item => item.group_id === groupId), [materials, groupId]);
  const visibleCreatures = useMemo(() => creatures.filter(item => Array.isArray(item.group_ids) ? item.group_ids.includes(groupId) : true), [creatures, groupId]);
  const visibleMiniatures = useMemo(() => miniatures.filter(item => item.group_id === groupId), [miniatures, groupId]);

  const compendium = useMemo(() => {
    const entries = [];
    sheets.forEach(sheet => entries.push({ kind: 'character', id: sheet.id, name: sheet.character_name || 'Unnamed character', tags: normalizeTags(sheet.tags), visibility: sheet.visibility || 'private', data: sheet }));
    visibleCreatures.forEach(creature => entries.push({ kind: creature.creature_type || 'creature', id: creature.id, name: creature.name || 'Creature', tags: normalizeTags(creature.tags), visibility: creature.visibility || 'public', data: creature }));
    visibleMaterials.forEach(material => entries.push({ kind: material.kind || 'other', id: material.id, name: material.title || 'Material', tags: normalizeTags(material.tags), visibility: material.visibility || 'group', data: material }));
    visibleMiniatures.forEach(mini => entries.push({ kind: 'miniature', id: mini.id, name: mini.name || 'Miniature', tags: normalizeTags(mini.tags), visibility: mini.is_visible === false ? 'hidden' : 'visible', data: mini }));
    workspace.notes.forEach(note => entries.push({ kind: note.targetType, id: note.id, name: note.title || note.targetName || 'Note', tags: normalizeTags(note.tags), visibility: note.visibility || 'private', data: note }));
    workspace.homebrew.forEach(entry => entries.push({ kind: `homebrew-${entry.type}`, id: entry.id, name: entry.name || 'Homebrew', tags: normalizeTags(entry.tags), visibility: entry.status || 'pending', data: entry }));
    return entries;
  }, [sheets, visibleCreatures, visibleMaterials, visibleMiniatures, workspace.notes, workspace.homebrew]);

  const filteredCompendium = useMemo(() => {
    const q = search.trim().toLowerCase();
    return compendium.filter(entry => {
      const typeMatch = workspace.compendiumFilters.type === 'all' || entry.kind === workspace.compendiumFilters.type || (workspace.compendiumFilters.type === 'characters' && entry.kind === 'character') || (workspace.compendiumFilters.type === 'npcs' && entry.kind === 'npc') || (workspace.compendiumFilters.type === 'monsters' && entry.kind === 'enemy') || (workspace.compendiumFilters.type === 'items' && ['map','music','main_quest','side_quest','task','other','item'].includes(entry.kind)) || (workspace.compendiumFilters.type === 'maps' && entry.kind === 'map') || (workspace.compendiumFilters.type === 'quests' && ['main_quest','side_quest','task'].includes(entry.kind)) || (workspace.compendiumFilters.type === 'other' && !['character','npc','enemy','map','main_quest','side_quest','task'].includes(entry.kind));
      const searchText = `${entry.name} ${entry.kind} ${entry.tags.join(' ')} ${JSON.stringify(entry.data || {})}`.toLowerCase();
      return typeMatch && (!q || searchText.includes(q));
    });
  }, [compendium, search, workspace.compendiumFilters.type]);

  const initiativeSorted = useMemo(() => [...workspace.initiative].sort((a, b) => (Number(b.initiative) || 0) - (Number(a.initiative) || 0)), [workspace.initiative]);

  const activeThreadMessages = useMemo(() => {
    if (activeThread === 'group') return workspace.chatThreads.group || [];
    const thread = workspace.privateThreads[activeThreadTarget] || [];
    return thread;
  }, [activeThread, activeThreadTarget, workspace.chatThreads.group, workspace.privateThreads]);

  const snapshotCount = workspace.versionHistory.length;
  const currentQuestStats = workspace.calendar.filter(evt => evt.kind === 'quest').length;
  const currentLootCount = workspace.loot.length;
  const totalKnownEntries = filteredCompendium.length;
  const currentPartySize = currentGroupMembers.length;

  const selectedMiniState = selectedSheet ? workspace.resourceCounters[selectedSheet.id] || {} : {};

  function updateWorkspace(patch) {
    setWorkspace(prev => ({ ...prev, ...patch }));
  }

  function updateMiniatureState(miniId, patch) {
    setWorkspace(prev => ({
      ...prev,
      miniatures: {
        ...prev.miniatures,
        [miniId]: { ...(prev.miniatures[miniId] || {}), ...patch },
      },
    }));
  }

  function addChatMessage(target = 'group') {
    if (!draftMessage.trim()) return;
    const payload = { id: uid('msg'), text: draftMessage.trim(), authorId: currentMembership?.user_id || 'gm', authorName: usersById?.[currentMembership?.user_id]?.name || currentMembership?.display_name || 'GM', createdAt: new Date().toISOString() };
    if (target === 'group') {
      updateWorkspace({ chatThreads: { ...workspace.chatThreads, group: [...workspace.chatThreads.group, payload] } });
    } else {
      updateWorkspace({ privateThreads: { ...workspace.privateThreads, [target]: [...(workspace.privateThreads[target] || []), payload] } });
    }
    setDraftMessage('');
  }

  function addInitiativeRow() {
    updateWorkspace({ initiative: [...workspace.initiative, { id: uid('init'), name: 'New combatant', initiative: 10, bonus: 0, conditions: '', hpCurrent: '', hpMax: '', sourceId: '', visible: true }] });
  }

  function addSessionSnapshot(label = 'Session point') {
    const snapshot = createSnapshot(workspace, label);
    updateWorkspace({ versionHistory: [snapshot, ...workspace.versionHistory].slice(0, 25), recovery: snapshot });
  }

  function recoverSnapshot(snapshot) {
    if (!snapshot?.workspace) return;
    setWorkspace({ ...snapshot.workspace, lastSavedAt: new Date().toISOString() });
  }

  function exportWorkspace() {
    exportCampaignWorkspace(groupId, workspace);
  }

  async function importWorkspace(file) {
    const result = await importCampaignWorkspaceFromFile(file);
    if (result.workspace) {
      setWorkspace({ ...defaultCampaignWorkspace(), ...result.workspace });
      if (result.groupId && result.groupId !== groupId) {
        setImportError('Imported workspace belongs to another group, loaded locally only.');
      }
    }
  }

  function saveNote() {
    if (!noteDraft.title.trim() && !noteDraft.body.trim()) return;
    updateWorkspace({ notes: [
      { id: uid('note'), ...noteDraft, tags: normalizeTags(noteDraft.tags), title: noteDraft.title.trim(), body: noteDraft.body.trim(), createdAt: new Date().toISOString(), targetName: getTargetName(noteDraft.targetType, noteDraft.targetId) },
      ...workspace.notes,
    ] });
    setNoteDraft({ targetType: 'character', targetId: '', title: '', body: '', tags: '', visibility: 'private' });
  }

  function getTargetName(targetType, targetId) {
    if (targetType === 'character') return sheets.find(item => item.id === targetId)?.character_name || 'Character';
    if (targetType === 'npc' || targetType === 'enemy' || targetType === 'creature') return visibleCreatures.find(item => item.id === targetId)?.name || 'Creature';
    if (targetType === 'item') return visibleMaterials.find(item => item.id === targetId)?.title || 'Item';
    if (targetType === 'location') return visibleMaterials.find(item => item.id === targetId)?.title || 'Location';
    return 'Record';
  }

  function toggleFavorite(kind, id) {
    const key = `${kind}:${id}`;
    const exists = workspace.favorites.includes(key);
    updateWorkspace({ favorites: exists ? workspace.favorites.filter(item => item !== key) : [key, ...workspace.favorites] });
  }

  function duplicateEntry(entry) {
    updateWorkspace({ templates: [makeLocalDuplicate(entry, entry.kind || 'template'), ...workspace.templates] });
  }

  function addHomebrew() {
    if (!homebrewDraft.name.trim()) return;
    updateWorkspace({ homebrew: [{ id: uid('hb'), ...homebrewDraft, tags: normalizeTags(homebrewDraft.tags), createdAt: new Date().toISOString(), status: homebrewDraft.status || 'pending' }, ...workspace.homebrew] });
    setHomebrewDraft({ type: 'race', name: '', notes: '', status: 'pending', tags: '' });
  }

  function updateMemberRole(memberId, role) {
    updateWorkspace({ partyRoles: { ...workspace.partyRoles, [memberId]: role } });
  }

  function setPartyVisibility(sheetId, visibility) {
    updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [`vis_${sheetId}`]: visibility } });
  }

  function handleDragStart(id) { setInitiativeDragId(id); }
  function handleDrop(targetId) {
    if (!initiativeDragId || initiativeDragId === targetId) return;
    const fromIndex = workspace.initiative.findIndex(item => item.id === initiativeDragId);
    const toIndex = workspace.initiative.findIndex(item => item.id === targetId);
    updateWorkspace({ initiative: reorderArray(workspace.initiative, fromIndex, toIndex) });
    setInitiativeDragId('');
  }

  function rollDice() {
    const formula = diceFormula || `1d${diceSides}`;
    const result = diceRoll(formula, { advantage: diceAdv, disadvantage: diceDis, critical: diceCritical });
    if (!result) return;
    updateWorkspace({ diceLog: [{ id: uid('roll'), label: diceLabel || formula, ...result, createdAt: new Date().toISOString() }, ...workspace.diceLog].slice(0, 100) });
  }

  function rollPool() {
    const parts = String(dicePool || '').split(/\s+/).filter(Boolean);
    const parsed = parts.map((part) => {
      const m = part.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
      if (!m) return null;
      const count = Number(m[1]);
      const sides = Number(m[2]);
      const bonus = Number(m[3] || 0);
      let total = bonus;
      const rolls = [];
      for (let i = 0; i < count; i += 1) {
        const r = 1 + Math.floor(Math.random() * sides);
        rolls.push(r);
        total += r;
      }
      return { part, rolls, total };
    }).filter(Boolean);
    const total = parsed.reduce((sum, item) => sum + item.total, 0);
    updateWorkspace({ diceLog: [{ id: uid('pool'), label: dicePool || 'Custom pool', expression: dicePool, total, rolls: parsed.map(item => item.total), createdAt: new Date().toISOString() }, ...workspace.diceLog].slice(0, 100) });
  }

  function toggleLayer(layerId) {
    updateWorkspace({ map: { ...workspace.map, layers: workspace.map.layers.map(layer => layer.id === layerId ? { ...layer, visible: !layer.visible } : layer) } });
  }

  function addLayer() {
    updateWorkspace({ map: { ...workspace.map, layers: [{ id: uid('layer'), name: 'New layer', type: 'general', visible: true, opacity: 1, hidden: false, notes: '' }, ...workspace.map.layers], activeLayerId: workspace.map.activeLayerId || '' } });
  }

  function addRevealPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    updateWorkspace({ map: { ...workspace.map, annotations: [...workspace.map.annotations, { id: uid('reveal'), type: 'reveal', x, y, label: 'Reveal spot', hidden: false }] } });
  }

  function addCalendarEvent(kind = 'event') {
    updateWorkspace({ calendar: [{ id: uid('cal'), kind, title: `${kind.toUpperCase()} ${workspace.calendar.length + 1}`, date: new Date().toISOString(), notes: '' }, ...workspace.calendar] });
  }

  function addLoot() {
    updateWorkspace({ loot: [{ id: uid('loot'), name: 'New reward', qty: 1, recipientId: '', notes: '' }, ...workspace.loot] });
  }

  function addQuest() {
    updateWorkspace({ calendar: [{ id: uid('quest'), kind: 'quest', title: 'New quest', status: 'active', notes: '', date: new Date().toISOString() }, ...workspace.calendar] });
  }

  function setAccessibility(patch) {
    updateWorkspace({ accessibility: { ...workspace.accessibility, ...patch } });
  }

  const fontScaleStyle = { fontSize: `${workspace.accessibility.fontScale || 1}rem` };
  const dashboardClass = cn(workspace.accessibility.highContrast && 'high-contrast-dashboard', workspace.accessibility.reducedMotion && 'reduced-motion-dashboard');

  return (
    <div className={`dashboard-wrap ${dashboardClass}`.trim()} style={fontScaleStyle}>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <section className={panelClass()}>
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><Sparkles size={18} /> {t('dashboard')}</div>
              <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>{t('uiHint')} {t('sheetLang')}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="scroll-btn" type="button" onClick={() => addSessionSnapshot('Manual save point')}><Save size={14} /> {t('snapshot')}</button>
              <button className="scroll-btn" type="button" onClick={exportWorkspace}><Download size={14} /> {t('export')}</button>
              <label className="scroll-btn cursor-pointer">
                <Upload size={14} /> {t('import')}
                <input type="file" className="hidden" accept="application/json" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setImportError(''); try { await importWorkspace(file); } catch (err) { setImportError(err.message || 'Import failed'); } finally { e.target.value = ''; } }} />
              </label>
              <button className="scroll-btn" type="button" onClick={() => window.print()}><Printer size={14} /> {t('print')}</button>
            </div>
          </div>
          {importError && <div className="text-sm" style={{ color: 'var(--ink-red)' }}>{importError}</div>}
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <div className="rounded border p-3" style={{ borderColor: 'var(--parchment-dark)' }}><div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--ink-mid)' }}>{t('sessions')}</div><div className="text-2xl font-bold" style={{ color: 'var(--ink-dark)' }}>{workspace.sessionLog.length}</div><div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('sessionNotes')}</div></div>
            <div className="rounded border p-3" style={{ borderColor: 'var(--parchment-dark)' }}><div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--ink-mid)' }}>{t('combat')}</div><div className="text-2xl font-bold" style={{ color: 'var(--ink-dark)' }}>{workspace.initiative.length}</div><div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('initiative')}</div></div>
            <div className="rounded border p-3" style={{ borderColor: 'var(--parchment-dark)' }}><div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--ink-mid)' }}>{t('compendium')}</div><div className="text-2xl font-bold" style={{ color: 'var(--ink-dark)' }}>{totalKnownEntries}</div><div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('searchCompendium')}</div></div>
            <div className="rounded border p-3" style={{ borderColor: 'var(--parchment-dark)' }}><div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--ink-mid)' }}>{t('history')}</div><div className="text-2xl font-bold" style={{ color: 'var(--ink-dark)' }}>{snapshotCount}</div><div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{workspace.recovery ? t('recoverNow') : t('noSnapshot')}</div></div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ink-dark)' }}><BookOpen size={16} /> {t('notes')}</div>
              <textarea className="parchment-input min-h-[180px] text-sm" value={workspace.sessionNotes} onChange={e => updateWorkspace({ sessionNotes: e.target.value })} placeholder={t('quickNotes')} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="scroll-btn" onClick={() => addSessionSnapshot('Session notes')}>{t('saveSnapshot')}</button>
                {workspace.recovery && <button type="button" className="scroll-btn" onClick={() => recoverSnapshot(workspace.recovery)}>{t('recoverLatest')}</button>}
                <button type="button" className="scroll-btn" onClick={() => updateWorkspace({ sessionNotes: '' })}>{t('clearAll')}</button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ink-dark)' }}><Users size={16} /> {t('partyRoles')}</div>
              <div className="grid gap-2">
                {memberOptions.map(member => (
                  <div key={member.id} className="rounded border p-2 flex flex-wrap items-center gap-2" style={{ borderColor: 'var(--parchment-dark)' }}>
                    <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{member.label}</div>
                    <select className="parchment-select min-h-[44px]" value={workspace.partyRoles[member.id] || member.role || 'none'} onChange={e => updateMemberRole(member.id, e.target.value)}>
                      {ROLE_OPTIONS.map(role => <option key={role} value={role}>{t(role) || role}</option>)}
                    </select>
                    <span className="text-xs" style={{ color: 'var(--ink-mid)' }}>{member.role}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('partyRoleMarkers')}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="scroll-btn" onClick={addInitiativeRow}><Plus size={14} /> {t('initiativeCard')}</button>
                <button type="button" className="scroll-btn" onClick={addQuest}><BookOpen size={14} /> {t('quests')}</button>
                <button type="button" className="scroll-btn" onClick={addLoot}><Star size={14} /> {t('loot')}</button>
                <button type="button" className="scroll-btn" onClick={() => addCalendarEvent('event')}><CalendarDays size={14} /> {t('addEvent')}</button>
              </div>
            </div>
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><Sword size={18} /> {t('initiative')}</div>
          <div className="flex flex-wrap gap-2 items-center">
            <button className="scroll-btn" type="button" onClick={addInitiativeRow}><Plus size={14} /> {t('addEntry')}</button>
            <button className="scroll-btn" type="button" onClick={() => updateWorkspace({ initiative: [] })}>{t('clearAll')}</button>
          </div>
          <div className="space-y-2 max-h-[620px] overflow-auto pr-1">
            {initiativeSorted.map((entry, index) => (
              <div key={entry.id} draggable onDragStart={() => handleDragStart(entry.id)} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(entry.id)} className="rounded border p-3 bg-white/40" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <GripVertical size={16} />
                  <input className="parchment-input min-h-[44px] flex-1" value={entry.name} onChange={e => updateWorkspace({ initiative: workspace.initiative.map(item => item.id === entry.id ? { ...item, name: e.target.value } : item) })} />
                  <input type="number" className="parchment-input min-h-[44px] w-20" value={entry.initiative} onChange={e => updateWorkspace({ initiative: workspace.initiative.map(item => item.id === entry.id ? { ...item, initiative: e.target.value } : item) })} />
                  <input type="number" className="parchment-input min-h-[44px] w-20" value={entry.hpCurrent} onChange={e => updateWorkspace({ initiative: workspace.initiative.map(item => item.id === entry.id ? { ...item, hpCurrent: e.target.value } : item) })} placeholder={t('current')} />
                  <input type="number" className="parchment-input min-h-[44px] w-20" value={entry.hpMax} onChange={e => updateWorkspace({ initiative: workspace.initiative.map(item => item.id === entry.id ? { ...item, hpMax: e.target.value } : item) })} placeholder={t('max')} />
                </div>
                <div className="grid gap-2 md:grid-cols-2 mt-2">
                  <input className="parchment-input min-h-[44px]" value={entry.conditions || ''} onChange={e => updateWorkspace({ initiative: workspace.initiative.map(item => item.id === entry.id ? { ...item, conditions: e.target.value } : item) })} placeholder={t('conditions')} />
                  <div className="flex gap-2 justify-end">
                    <button type="button" className="icon-action-btn" onClick={() => updateWorkspace({ initiative: workspace.initiative.filter(item => item.id !== entry.id) })}><X size={16} /></button>
                    <button type="button" className="icon-action-btn" onClick={() => updateWorkspace({ initiative: reorderArray(workspace.initiative, index, Math.max(0, index - 1)) })}><ChevronUp size={16} /></button>
                    <button type="button" className="icon-action-btn" onClick={() => updateWorkspace({ initiative: reorderArray(workspace.initiative, index, Math.min(workspace.initiative.length - 1, index + 1)) })}><ChevronDown size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><Dice6 size={18} /> {t('dice')}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="parchment-input min-h-[44px]" value={diceLabel} onChange={e => setDiceLabel(e.target.value)} placeholder={t('label')} />
            <input className="parchment-input min-h-[44px]" value={diceFormula} onChange={e => setDiceFormula(e.target.value)} placeholder="1d20" />
            <input type="number" className="parchment-input min-h-[44px]" value={diceBonus} onChange={e => setDiceBonus(e.target.value)} placeholder="+0" />
            <input type="number" className="parchment-input min-h-[44px]" value={diceSides} onChange={e => setDiceSides(e.target.value)} placeholder="Sides" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cn('scroll-btn', diceAdv && 'ring-2 ring-offset-2')} onClick={() => { setDiceAdv(v => !v); setDiceDis(false); }}>{t('advantage')}</button>
            <button type="button" className={cn('scroll-btn', diceDis && 'ring-2 ring-offset-2')} onClick={() => { setDiceDis(v => !v); setDiceAdv(false); }}>{t('disadvantage')}</button>
            <button type="button" className={cn('scroll-btn', diceCritical && 'ring-2 ring-offset-2')} onClick={() => setDiceCritical(v => !v)}>{t('critical')}</button>
            <button type="button" className="scroll-btn" onClick={rollDice}>{t('roll')}</button>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold" style={{ color: 'var(--ink-dark)' }}>{t('customPool')}</div>
            <div className="flex flex-wrap gap-2">
              <input className="parchment-input min-h-[44px] flex-1" value={dicePool} onChange={e => setDicePool(e.target.value)} placeholder="4d6 1d10+2" />
              <button type="button" className="scroll-btn" onClick={rollPool}>{t('addRoll')}</button>
            </div>
          </div>
          <div className="max-h-[220px] overflow-auto space-y-2">
            {workspace.diceLog.map(entry => (
              <div key={entry.id} className="rounded border p-2 text-sm" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{entry.label}</div>
                  <div className="font-bold" style={{ color: 'var(--ink-dark)' }}>{t('total')}: {entry.total}</div>
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{entry.expression || entry.label} · {prettyDate(entry.createdAt)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><MessageSquare size={18} /> {t('chat')}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cn('scroll-btn', activeThread === 'group' && 'ring-2 ring-offset-2')} onClick={() => setActiveThread('group')}>{t('groupThread')}</button>
            {isGM && memberOptions.map(member => (
              <button key={member.id} type="button" className={cn('scroll-btn', activeThread === 'private' && activeThreadTarget === member.id && 'ring-2 ring-offset-2')} onClick={() => { setActiveThread('private'); setActiveThreadTarget(member.id); }}>{member.label}</button>
            ))}
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{activeThread === 'group' ? t('groupThreadHint') : t('privateThreadHint')}</div>
          <div className="max-h-[260px] overflow-auto space-y-2 rounded border p-2" style={{ borderColor: 'var(--parchment-dark)' }}>
            {activeThreadMessages.length === 0 ? <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>{t('noThread')}</div> : activeThreadMessages.map(message => (
              <div key={message.id} className="rounded border bg-white/50 p-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--ink-mid)' }}><span>{message.authorName}</span><span>{prettyDate(message.createdAt)}</span></div>
                <div className="text-sm" style={{ color: 'var(--ink-dark)' }}>{message.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea className="parchment-input min-h-[80px] flex-1" value={draftMessage} onChange={e => setDraftMessage(e.target.value)} placeholder={activeThread === 'group' ? t('publicChat') : t('privateChat')} />
            <button type="button" className="scroll-btn" onClick={() => addChatMessage(activeThread === 'group' ? 'group' : activeThreadTarget)}>{t('send')}</button>
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><Map size={18} /> {t('map')}</div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('mapReminder')}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <button type="button" className="scroll-btn" onClick={addLayer}><Layers3 size={14} /> {t('addLayer')}</button>
              <div className="space-y-2 max-h-[220px] overflow-auto">
                {workspace.map.layers.map(layer => (
                  <div key={layer.id} className="rounded border p-2" style={{ borderColor: 'var(--parchment-dark)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input className="parchment-input min-h-[44px] flex-1" value={layer.name} onChange={e => updateWorkspace({ map: { ...workspace.map, layers: workspace.map.layers.map(item => item.id === layer.id ? { ...item, name: e.target.value } : item) } })} />
                      <button type="button" className="icon-action-btn" onClick={() => toggleLayer(layer.id)}>{layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 mt-2">
                      <input type="range" min="0" max="1" step="0.05" value={layer.opacity ?? 1} onChange={e => updateWorkspace({ map: { ...workspace.map, layers: workspace.map.layers.map(item => item.id === layer.id ? { ...item, opacity: Number(e.target.value) } : item) } })} />
                      <input className="parchment-input min-h-[44px]" value={layer.notes || ''} onChange={e => updateWorkspace({ map: { ...workspace.map, layers: workspace.map.layers.map(item => item.id === layer.id ? { ...item, notes: e.target.value } : item) } })} placeholder={t('notes')} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!workspace.map.showGrid} onChange={e => updateWorkspace({ map: { ...workspace.map, showGrid: e.target.checked } })} /> {t('grid')}</label>
                <div className="flex items-center gap-2 text-sm"><span>{t('fogOfWar')}</span><input type="range" min="0" max="1" step="0.05" value={workspace.map.fogOpacity} onChange={e => updateWorkspace({ map: { ...workspace.map, fogOpacity: Number(e.target.value) } })} /></div>
                <div className="flex items-center gap-2 text-sm"><span>{t('reveal')}</span><input type="range" min="40" max="220" step="5" value={workspace.map.revealRadius} onChange={e => updateWorkspace({ map: { ...workspace.map, revealRadius: Number(e.target.value) } })} /></div>
                <button type="button" className="scroll-btn" onClick={() => updateWorkspace({ map: { ...workspace.map, annotations: [] } })}>{t('resetView')}</button>
              </div>
              <div onClick={addRevealPoint} className="relative overflow-hidden rounded border min-h-[240px] bg-black/10" style={{ borderColor: 'var(--parchment-dark)' }}>
                {workspace.map.layers.filter(layer => layer.visible).map(layer => (
                  <div key={layer.id} className="absolute inset-0" style={{ opacity: percentToOpacity(layer.opacity) }}>
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(transparent 95%, rgba(0,0,0,0.08) 100%), linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.08) 100%)', backgroundSize: `${workspace.map.gridSize}px ${workspace.map.gridSize}px` }} />
                  </div>
                ))}
                {workspace.map.showGrid && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)', backgroundSize: `${workspace.map.gridSize}px ${workspace.map.gridSize}px` }} />}
                {workspace.map.fogOpacity > 0 && <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: workspace.map.fogOpacity }} />}
                {workspace.map.annotations.filter(item => item.type === 'reveal').map(point => (
                  <div key={point.id} className="absolute pointer-events-none" style={{ left: `${point.x}%`, top: `${point.y}%`, width: workspace.map.revealRadius * 2, height: workspace.map.revealRadius * 2, transform: 'translate(-50%, -50%)', borderRadius: '50%', boxShadow: `0 0 0 9999px rgba(0,0,0,${workspace.map.fogOpacity})` }} />
                ))}
                <div className="absolute bottom-2 left-2 text-xs bg-white/80 px-2 py-1 rounded">{t('currentMap')}: {group?.name || t('noMap')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><LibraryBig size={18} /> {t('compendium')}</div>
          <div className="flex flex-wrap gap-2 items-center">
            <input className="parchment-input min-h-[44px] flex-1" value={search} onChange={e => { setSearch(e.target.value); updateWorkspace({ compendiumSearch: e.target.value }); }} placeholder={t('searchAll')} />
            <select className="parchment-select min-h-[44px]" value={workspace.compendiumFilters.type} onChange={e => updateWorkspace({ compendiumFilters: { ...workspace.compendiumFilters, type: e.target.value } })}>
              {TYPE_OPTIONS.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="grid gap-2 max-h-[320px] overflow-auto">
            {filteredCompendium.map(entry => (
              <div key={`${entry.kind}:${entry.id}`} className="rounded border p-2 bg-white/50" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{entry.name}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{entry.kind} · {entry.visibility}</div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="icon-action-btn" onClick={() => toggleFavorite(entry.kind, entry.id)} title={workspace.favorites.includes(`${entry.kind}:${entry.id}`) ? t('unpin') : t('pin')}><Star size={16} /></button>
                    <button type="button" className="icon-action-btn" onClick={() => duplicateEntry(entry)} title={t('duplicate')}><Copy size={16} /></button>
                  </div>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>{normalizeTags(entry.tags).join(' · ') || t('noData')}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><HeartPulse size={18} /> {t('resources')}</div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('concentration')} · {t('spellSlots')} · {t('inventory')}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{t('spellPrep')}</div>
              <input className="parchment-input min-h-[44px]" placeholder={t('prepared')} value={selectedSheet?.id ? selectedMiniState.preparedSpells || '' : ''} onChange={e => selectedSheet?.id && updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [selectedSheet.id]: { ...selectedMiniState, preparedSpells: e.target.value } } })} />
              <input className="parchment-input min-h-[44px]" placeholder={t('concentration')} value={selectedSheet?.id ? selectedMiniState.concentration || '' : ''} onChange={e => selectedSheet?.id && updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [selectedSheet.id]: { ...selectedMiniState, concentration: e.target.value } } })} />
              <input className="parchment-input min-h-[44px]" placeholder={t('spellSlots')} value={selectedSheet?.id ? selectedMiniState.spellSlots || '' : ''} onChange={e => selectedSheet?.id && updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [selectedSheet.id]: { ...selectedMiniState, spellSlots: e.target.value } } })} />
              <textarea className="parchment-input min-h-[90px]" placeholder={t('resourcesCounters')} value={selectedSheet?.id ? selectedMiniState.resourceCounters || '' : ''} onChange={e => selectedSheet?.id && updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [selectedSheet.id]: { ...selectedMiniState, resourceCounters: e.target.value } } })} />
            </div>
            <div className="space-y-2">
              <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{t('inventory')}</div>
              {selectedSheet ? (
                <div className="text-sm rounded border p-3 space-y-2" style={{ borderColor: 'var(--parchment-dark)' }}>
                  <div>{t('encumbrance')}: {selectedMiniState.encumbrance || '—'}</div>
                  <div>{t('current')}: {selectedMiniState.weight || '—'} / {selectedMiniState.capacity || '—'}</div>
                  <input className="parchment-input min-h-[44px]" placeholder={t('encumbrance')} value={selectedMiniState.encumbrance || ''} onChange={e => updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [selectedSheet.id]: { ...selectedMiniState, encumbrance: e.target.value } } })} />
                  <input className="parchment-input min-h-[44px]" placeholder={t('current')} value={selectedMiniState.weight || ''} onChange={e => updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [selectedSheet.id]: { ...selectedMiniState, weight: e.target.value } } })} />
                  <input className="parchment-input min-h-[44px]" placeholder={t('max')} value={selectedMiniState.capacity || ''} onChange={e => updateWorkspace({ resourceCounters: { ...workspace.resourceCounters, [selectedSheet.id]: { ...selectedMiniState, capacity: e.target.value } } })} />
                </div>
              ) : <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>{t('noData')}</div>}
            </div>
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><ShieldCheck size={18} /> {t('homebrew')}</div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('moderatorHint')}</div>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="parchment-input min-h-[44px]" value={homebrewDraft.name} onChange={e => setHomebrewDraft(prev => ({ ...prev, name: e.target.value }))} placeholder={t('name')} />
            <select className="parchment-select min-h-[44px]" value={homebrewDraft.type} onChange={e => setHomebrewDraft(prev => ({ ...prev, type: e.target.value }))}>
              {['race','class','feat','spell','item','monster'].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <textarea className="parchment-input min-h-[90px] md:col-span-2" value={homebrewDraft.notes} onChange={e => setHomebrewDraft(prev => ({ ...prev, notes: e.target.value }))} placeholder={t('notes')} />
            <input className="parchment-input min-h-[44px] md:col-span-2" value={homebrewDraft.tags} onChange={e => setHomebrewDraft(prev => ({ ...prev, tags: e.target.value }))} placeholder={t('tags')} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="scroll-btn" onClick={addHomebrew}><Plus size={14} /> {t('create')}</button>
          </div>
          <div className="max-h-[260px] overflow-auto space-y-2">
            {workspace.homebrew.map(entry => (
              <div key={entry.id} className="rounded border p-2 bg-white/40" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{entry.name}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{entry.type} · {entry.status}</div>
                  </div>
                  {isGM && (
                    <div className="flex gap-1">
                      <button type="button" className="icon-action-btn" onClick={() => updateWorkspace({ homebrew: workspace.homebrew.map(item => item.id === entry.id ? { ...item, status: 'approved' } : item) })}><Check size={16} /></button>
                      <button type="button" className="icon-action-btn" onClick={() => updateWorkspace({ homebrew: workspace.homebrew.map(item => item.id === entry.id ? { ...item, status: 'rejected' } : item) })}><X size={16} /></button>
                    </div>
                  )}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>{entry.notes}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><CalendarDays size={18} /> {t('calendar')}</div>
          <div className="flex flex-wrap gap-2">
            <button className="scroll-btn" type="button" onClick={() => addCalendarEvent('rest')}>{t('rests')}</button>
            <button className="scroll-btn" type="button" onClick={() => addCalendarEvent('travel')}>{t('travel')}</button>
            <button className="scroll-btn" type="button" onClick={() => addCalendarEvent('event')}>{t('events')}</button>
            <button className="scroll-btn" type="button" onClick={() => addCalendarEvent('quest')}>{t('quests')}</button>
          </div>
          <div className="max-h-[220px] overflow-auto space-y-2">
            {workspace.calendar.map(evt => (
              <div key={evt.id} className="rounded border p-2 bg-white/40" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{evt.title}</div>
                  <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{evt.kind}</div>
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{prettyDate(evt.date)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><Star size={18} /> {t('favorites')}</div>
          <div className="grid gap-2 md:grid-cols-2">
            {workspace.favorites.length === 0 && <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>{t('noData')}</div>}
            {workspace.favorites.map(item => <div key={item} className="rounded border p-2 text-sm" style={{ borderColor: 'var(--parchment-dark)' }}>{item}</div>)}
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('quickAccess')}</div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><AlertTriangle size={18} /> {t('reminders')}</div>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--ink-mid)' }}>
            {workspace.ruleReminders.map((line, index) => <li key={index} className="rounded border p-2" style={{ borderColor: 'var(--parchment-dark)' }}>{line}</li>)}
          </ul>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><Upload size={18} /> {t('importExport')}</div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="scroll-btn cursor-pointer">
              <Upload size={14} /> {t('importWorkspace')}
              <input type="file" className="hidden" accept="application/json" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { await importWorkspace(file); } catch (err) { setImportError(err.message || 'Import failed'); } finally { e.target.value = ''; } }} />
            </label>
            <button type="button" className="scroll-btn" onClick={exportWorkspace}><Download size={14} /> {t('exportWorkspace')}</button>
            <button type="button" className="scroll-btn" onClick={() => addSessionSnapshot('Manual snapshot')}><RefreshCcw size={14} /> {t('snapshot')}</button>
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{prettyDate(workspace.lastSavedAt) === '—' ? t('autosave') : `${t('autosaved')} · ${prettyDate(workspace.lastSavedAt)}`}</div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><BookOpen size={18} /> {t('sheetVersions')}</div>
          <div className="space-y-2 max-h-[260px] overflow-auto">
            {workspace.versionHistory.length === 0 && <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>{t('noSnapshot')}</div>}
            {workspace.versionHistory.map(snapshot => (
              <div key={snapshot.id} className="rounded border p-2 bg-white/40" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{snapshot.label}</div>
                  <button type="button" className="scroll-btn" onClick={() => recoverSnapshot(snapshot)}>{t('restore')}</button>
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{prettyDate(snapshot.createdAt)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><Tag size={18} /> {t('notesAndLore')}</div>
          <div className="grid gap-2 md:grid-cols-2">
            <select className="parchment-select min-h-[44px]" value={noteDraft.targetType} onChange={e => setNoteDraft(prev => ({ ...prev, targetType: e.target.value }))}>
              {['character','npc','enemy','creature','item','location'].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <input className="parchment-input min-h-[44px]" value={noteDraft.targetId} onChange={e => setNoteDraft(prev => ({ ...prev, targetId: e.target.value }))} placeholder={t('noteTarget')} />
            <input className="parchment-input min-h-[44px] md:col-span-2" value={noteDraft.title} onChange={e => setNoteDraft(prev => ({ ...prev, title: e.target.value }))} placeholder={t('label')} />
            <textarea className="parchment-input min-h-[90px] md:col-span-2" value={noteDraft.body} onChange={e => setNoteDraft(prev => ({ ...prev, body: e.target.value }))} placeholder={t('notes')} />
            <input className="parchment-input min-h-[44px]" value={noteDraft.tags} onChange={e => setNoteDraft(prev => ({ ...prev, tags: e.target.value }))} placeholder={t('tags')} />
            <select className="parchment-select min-h-[44px]" value={noteDraft.visibility} onChange={e => setNoteDraft(prev => ({ ...prev, visibility: e.target.value }))}>
              {VISIBILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <button type="button" className="scroll-btn" onClick={saveNote}><Plus size={14} /> {t('addNote')}</button>
          <div className="max-h-[220px] overflow-auto space-y-2">
            {workspace.notes.map(note => (
              <div key={note.id} className="rounded border p-2 bg-white/40" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{note.title}</div>
                  <span className="text-xs" style={{ color: 'var(--ink-mid)' }}>{note.visibility}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{note.targetType} · {note.targetName} · {normalizeTags(note.tags).join(', ')}</div>
                <div className="text-sm whitespace-pre-wrap mt-1" style={{ color: 'var(--ink-dark)' }}>{note.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--ink-dark)' }}><ShieldCheck size={18} /> {t('accessibilityOptions')}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={workspace.accessibility.highContrast} onChange={e => setAccessibility({ highContrast: e.target.checked })} /> {t('highContrast')}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={workspace.accessibility.reducedMotion} onChange={e => setAccessibility({ reducedMotion: e.target.checked })} /> {t('reduceMotion')}</label>
            <label className="flex items-center gap-2"><span>{t('largerText')}</span><input type="range" min="0.9" max="1.4" step="0.05" value={workspace.accessibility.fontScale || 1} onChange={e => setAccessibility({ fontScale: Number(e.target.value) })} /></label>
            <select className="parchment-select min-h-[44px]" value={workspace.accessibility.locale} onChange={e => setAccessibility({ locale: e.target.value })}>
              <option value="en">English</option>
              <option value="it">Italiano</option>
            </select>
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{t('sheetLang')}</div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(workspace.accessibility.showHealthBars)} onChange={e => setAccessibility({ showHealthBars: e.target.checked })} /> {t('healthBars')}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(workspace.accessibility.showGrid)} onChange={e => setAccessibility({ showGrid: e.target.checked })} /> {t('grid')}</label>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold"><Users size={18} /> {t('minis')}</div>
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {visibleMiniatures.map(mini => {
              const state = workspace.miniatures[mini.id] || {};
              const source = mini.source_type === 'character' ? sheets.find(sheet => sheet.id === mini.source_id) : visibleCreatures.find(creature => creature.id === mini.source_id);
              return (
                <div key={mini.id} className="rounded border p-2 bg-white/40" style={{ borderColor: 'var(--parchment-dark)' }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--ink-dark)' }}>{mini.name}</div>
                      <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{state.summary || mini.summary || source?.summary || source?.notes || mini.name}</div>
                    </div>
                    <button type="button" className="icon-action-btn" onClick={() => updateMiniatureState(mini.id, { showHealthBar: !state.showHealthBar })}>{state.showHealthBar ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 mt-2">
                    <input className="parchment-input min-h-[44px]" value={state.conditions || ''} onChange={e => updateMiniatureState(mini.id, { conditions: e.target.value })} placeholder={t('conditions')} />
                    <input className="parchment-input min-h-[44px]" value={state.status || ''} onChange={e => updateMiniatureState(mini.id, { status: e.target.value })} placeholder={t('statusEffects')} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold"><Map size={18} /> {t('battleMap')}</div>
          <div className="space-y-2 text-sm" style={{ color: 'var(--ink-mid)' }}>
            <div>{t('grid')} / {t('fogOfWar')} / {t('reveal')}</div>
            <div>{t('annotationsHint')}</div>
          </div>
          <div className="grid gap-2 max-h-[220px] overflow-auto">
            {workspace.map.annotations.map(annotation => (
              <div key={annotation.id} className="rounded border p-2" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{annotation.label}</div>
                  <span className="text-xs">{annotation.type}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{annotation.x?.toFixed?.(1) || 0}%, {annotation.y?.toFixed?.(1) || 0}%</div>
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass()}>
          <div className="flex items-center gap-2 text-lg font-bold"><BookOpen size={18} /> {t('questBoard')}</div>
          <div className="space-y-2 max-h-[320px] overflow-auto">
            {workspace.calendar.filter(evt => evt.kind === 'quest').map(evt => (
              <div key={evt.id} className="rounded border p-2 bg-white/40" style={{ borderColor: 'var(--parchment-dark)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{evt.title}</div>
                  <select className="parchment-select min-h-[40px]" value={evt.status || 'active'} onChange={e => updateWorkspace({ calendar: workspace.calendar.map(item => item.id === evt.id ? { ...item, status: e.target.value } : item) })}>
                    {QUEST_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{evt.notes || t('quickNotes')}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
