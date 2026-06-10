import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, Users, Shield, Image as ImageIcon, MapPinned, FileText, ScrollText, Swords, GripVertical, Download, Edit3, Save, Trash2, UserPlus, Crown, MessageSquareText, LayoutDashboard } from 'lucide-react';
import { buildDiceFormula, characterName, CREATURE_TYPES, GROUP_MATERIAL_KINDS, hpAverageFromFormula, loadAllRecords, memberName, MINIATURE_SOURCE_TYPES, rollDiceFormula } from '@/utils/groupHelpers';
import CampaignDashboard from '@/components/groups/CampaignDashboard';

const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ list:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

const DEFAULT_GROUP = { name: '', description: '' };
const DEFAULT_CREATURE = {
  name: '',
  creature_type: 'npc',
  summary: '',
  hp_dice_count: 1,
  hp_dice_sides: 8,
  hp_bonus: 0,
  ac: 10,
  speed: 30,
  notes: '',
  share_with_group: true,
};

const DEFAULT_MATERIAL = {
  title: '',
  kind: 'map',
  notes: '',
};

const DEFAULT_MINIATURE = {
  source_type: 'character',
  source_id: '',
  name: '',
  summary: '',
  x: 20,
  y: 20,
};

function prettyKind(kind) {
  return GROUP_MATERIAL_KINDS.find(item => item.value === kind)?.label || kind || 'Material';
}

function prettyCreatureType(type) {
  return CREATURE_TYPES.find(item => item.value === type)?.label || type || 'Creature';
}

function getSelectedMemberSheet(member, sheets) {
  return sheets.find(sheet => sheet.id === member.selected_character_sheet_id) || null;
}

function getMemberSheets(member, sheets) {
  return sheets
    .filter(sheet => sheet.owner_user_id === member.user_id)
    .sort((a, b) => String(b.updated_date || '').localeCompare(String(a.updated_date || '')));
}

function getUserAccessibleSheetOptions(member, sheets) {
  return getMemberSheets(member, sheets);
}

function resolveSummaryFromMiniature(miniature, sheets, creatures) {
  if (miniature.summary) return miniature.summary;
  if (miniature.source_type === 'character') {
    const sheet = sheets.find(item => item.id === miniature.source_id);
    if (!sheet) return miniature.name || 'Character';
    return [
      sheet.character_name || 'Unnamed character',
      sheet.class_id ? `Class ID: ${sheet.class_id}` : null,
      sheet.level ? `Level ${sheet.level}` : null,
    ].filter(Boolean).join(' · ');
  }
  const creature = creatures.find(item => item.id === miniature.source_id);
  if (!creature) return miniature.name || 'Creature';
  return [
    creature.summary || creature.notes || null,
    creature.hp_formula ? `HP ${creature.hp_formula}` : null,
    creature.ac ? `AC ${creature.ac}` : null,
  ].filter(Boolean).join(' · ') || (miniature.name || creature.name || 'Creature');
}

function buildMiniatureName(sourceType, sourceItem) {
  if (sourceType === 'character') return sourceItem?.character_name || 'Character';
  return sourceItem?.name || sourceItem?.summary || 'Miniature';
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const groupIdParam = params.id || '';
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [creatures, setCreatures] = useState([]);
  const [miniatures, setMiniatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(groupIdParam);
  const [groupForm, setGroupForm] = useState(DEFAULT_GROUP);
  const [memberToAdd, setMemberToAdd] = useState('');
  const [materialForm, setMaterialForm] = useState(DEFAULT_MATERIAL);
  const [materialFile, setMaterialFile] = useState(null);
  const [creatureForm, setCreatureForm] = useState(DEFAULT_CREATURE);
  const [miniatureForm, setMiniatureForm] = useState(DEFAULT_MINIATURE);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMiniatureId, setSelectedMiniatureId] = useState(null);
  const [busy, setBusy] = useState(false);

  const currentGroup = useMemo(
    () => groups.find(group => group.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const currentMembership = useMemo(
    () => memberships.find(member => member.group_id === selectedGroupId && member.user_id === user?.id) || null,
    [memberships, selectedGroupId, user]
  );

  const currentGroupMembers = useMemo(
    () => memberships.filter(member => member.group_id === selectedGroupId),
    [memberships, selectedGroupId]
  );

  const usersById = useMemo(() => {
    const map = {};
    users.forEach(item => { map[item.id] = item; });
    return map;
  }, [users]);

  const canManageGroup = Boolean(currentGroup && (
    currentGroup.creator_user_id === user?.id ||
    currentMembership?.role === 'master'
  ));
  const canAssignRoles = Boolean(currentGroup && currentGroup.creator_user_id === user?.id);

  const activeMap = useMemo(
    () => materials.find(item => item.id === currentGroup?.active_map_material_id) || null,
    [materials, currentGroup]
  );

  const selectedMiniature = useMemo(
    () => miniatures.find(item => item.id === selectedMiniatureId) || null,
    [miniatures, selectedMiniatureId]
  );

  const groupCharacters = useMemo(() => {
    return currentGroupMembers
      .map(member => {
        const sheet = getSelectedMemberSheet(member, sheets);
        return sheet ? { member, sheet } : null;
      })
      .filter(Boolean);
  }, [currentGroupMembers, sheets]);

  const currentUserSheets = useMemo(
    () => sheets.filter(sheet => sheet.owner_user_id === user?.id),
    [sheets, user]
  );

  const currentGroupMaterials = useMemo(
    () => materials.filter(item => item.group_id === selectedGroupId),
    [materials, selectedGroupId]
  );

  const currentGroupCreatures = useMemo(
    () => creatures.filter(item => Array.isArray(item.group_ids) && item.group_ids.includes(selectedGroupId)),
    [creatures, selectedGroupId]
  );

  const currentGroupMiniatures = useMemo(
    () => miniatures.filter(item => item.group_id === selectedGroupId),
    [miniatures, selectedGroupId]
  );

  async function reloadData(preferredGroupId = null) {
    setLoading(true);
    try {
      const me = await db.auth.me().catch(() => null);
      setUser(me);

      const [userList, groupList, membershipList, sheetList, materialList, creatureList, miniatureList] = await Promise.all([
        loadAllRecords(db, 'User').catch(() => []),
        loadAllRecords(db, 'Group').catch(() => []),
        loadAllRecords(db, 'GroupMembership').catch(() => []),
        loadAllRecords(db, 'CharacterSheet').catch(() => []),
        loadAllRecords(db, 'GroupMaterial').catch(() => []),
        loadAllRecords(db, 'CreatureProfile').catch(() => []),
        loadAllRecords(db, 'Miniature').catch(() => []),
      ]);

      setUsers(userList);
      setGroups(groupList);
      setMemberships(membershipList);
      setSheets(sheetList);
      setMaterials(materialList);
      setCreatures(creatureList);
      setMiniatures(miniatureList);

      const candidateId = preferredGroupId || groupIdParam || selectedGroupId || groupList[0]?.id || '';
      setSelectedGroupId(candidateId && groupList.some(group => group.id === candidateId) ? candidateId : (groupList[0]?.id || ''));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadData(groupIdParam);
  }, [groupIdParam]);

  useEffect(() => {
    if (groupIdParam && groupIdParam !== selectedGroupId) {
      setSelectedGroupId(groupIdParam);
    }
  }, [groupIdParam, selectedGroupId]);

  useEffect(() => {
    if (!groupIdParam && selectedGroupId) {
      navigate(`/groups/${selectedGroupId}`, { replace: true });
    }
  }, [selectedGroupId, groupIdParam, navigate]);

  useEffect(() => {
    if (currentGroup && !groupForm.name) {
      setGroupForm({ name: currentGroup.name || '', description: currentGroup.description || '' });
    }
  }, [currentGroup]);

  useEffect(() => {
    if (!selectedMiniatureId && currentGroupMiniatures[0]?.id) {
      setSelectedMiniatureId(currentGroupMiniatures[0].id);
    }
  }, [currentGroupMiniatures, selectedMiniatureId]);

  async function handleCreateGroup(event) {
    event.preventDefault();
    if (!groupForm.name.trim()) return;
    setBusy(true);
    try {
      const group = await db.entities.Group.create({
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        creator_user_id: user?.id || null,
        active_map_material_id: null,
      });
      await db.entities.GroupMembership.create({
        group_id: group.id,
        user_id: user?.id || null,
        role: 'master',
        display_name: user?.name || user?.email || 'Creator',
      });
      setGroupForm(DEFAULT_GROUP);
      await reloadData(group.id);
      navigate(`/groups/${group.id}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    if (!selectedGroupId || !memberToAdd) return;
    const userRecord = users.find(item => item.id === memberToAdd);
    if (!userRecord) return;
    const existing = memberships.find(item => item.group_id === selectedGroupId && item.user_id === userRecord.id);
    if (existing) return;
    setBusy(true);
    try {
      await db.entities.GroupMembership.create({
        group_id: selectedGroupId,
        user_id: userRecord.id,
        role: 'player',
        display_name: userRecord.name || userRecord.email || 'Player',
      });
      setMemberToAdd('');
      await reloadData(selectedGroupId);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateGroup(patch) {
    if (!currentGroup) return;
    setBusy(true);
    try {
      await db.entities.Group.update(currentGroup.id, patch);
      await reloadData(currentGroup.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateMember(memberId, patch) {
    setBusy(true);
    try {
      await db.entities.GroupMembership.update(memberId, patch);
      await reloadData(selectedGroupId);
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadMaterial(event) {
    event.preventDefault();
    if (!currentGroup || !canManageGroup || !materialFile || !materialForm.title.trim()) return;
    setBusy(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file: materialFile });
      await db.entities.GroupMaterial.create({
        group_id: currentGroup.id,
        title: materialForm.title.trim(),
        kind: materialForm.kind,
        notes: materialForm.notes.trim(),
        file_url,
        file_name: materialFile.name,
        uploaded_by_user_id: user?.id || null,
      });
      setMaterialForm(DEFAULT_MATERIAL);
      setMaterialFile(null);
      await reloadData(currentGroup.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCreature(event) {
    event.preventDefault();
    if (!creatureForm.name.trim()) return;
    setBusy(true);
    try {
      const hpFormula = buildDiceFormula(creatureForm.hp_dice_count, creatureForm.hp_dice_sides, creatureForm.hp_bonus);
      const payload = {
        name: creatureForm.name.trim(),
        creature_type: creatureForm.creature_type,
        summary: creatureForm.summary.trim(),
        hp_dice_count: Number(creatureForm.hp_dice_count) || 1,
        hp_dice_sides: Number(creatureForm.hp_dice_sides) || 8,
        hp_bonus: Number(creatureForm.hp_bonus) || 0,
        hp_formula: hpFormula,
        hp_average: hpAverageFromFormula(hpFormula),
        ac: Number(creatureForm.ac) || 10,
        speed: Number(creatureForm.speed) || 30,
        notes: creatureForm.notes.trim(),
        created_by_user_id: user?.id || null,
        group_ids: creatureForm.share_with_group && currentGroup ? [currentGroup.id] : [],
      };
      await db.entities.CreatureProfile.create(payload);
      setCreatureForm(DEFAULT_CREATURE);
      await reloadData(currentGroup?.id || selectedGroupId);
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadCreatureToGroup(creatureId) {
    if (!currentGroup || !canManageGroup) return;
    setBusy(true);
    try {
      const creature = creatures.find(item => item.id === creatureId);
      if (!creature) return;
      const groupIds = Array.from(new Set([...(creature.group_ids || []), currentGroup.id]));
      await db.entities.CreatureProfile.update(creature.id, { group_ids: groupIds });
      await reloadData(currentGroup.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateMiniature(event) {
    event.preventDefault();
    if (!currentGroup || !miniatureForm.source_id) return;
    const isCharacter = miniatureForm.source_type === 'character';
    const sourceItem = isCharacter
      ? sheets.find(sheet => sheet.id === miniatureForm.source_id)
      : creatures.find(creature => creature.id === miniatureForm.source_id);
    if (!sourceItem) return;

    const derivedSummary = isCharacter
      ? [
          sourceItem.character_name || 'Character',
          sourceItem.class_id ? `Class ID ${sourceItem.class_id}` : null,
          sourceItem.level ? `Level ${sourceItem.level}` : null,
        ].filter(Boolean).join(' · ')
      : [
          sourceItem.summary || sourceItem.notes || null,
          sourceItem.hp_formula ? `HP ${sourceItem.hp_formula}` : null,
          sourceItem.ac ? `AC ${sourceItem.ac}` : null,
        ].filter(Boolean).join(' · ');

    const hpCurrent = isCharacter
      ? Number(sourceItem.hp_current || sourceItem.hp_max || 0) || null
      : rollDiceFormula(sourceItem.hp_formula);

    setBusy(true);
    try {
      await db.entities.Miniature.create({
        group_id: currentGroup.id,
        source_type: miniatureForm.source_type,
        source_id: sourceItem.id,
        name: miniatureForm.name.trim() || buildMiniatureName(miniatureForm.source_type, sourceItem),
        summary: miniatureForm.summary.trim() || derivedSummary,
        x: Number(miniatureForm.x) || 20,
        y: Number(miniatureForm.y) || 20,
        hp_current: hpCurrent,
        created_by_user_id: user?.id || null,
      });
      setMiniatureForm(DEFAULT_MINIATURE);
      await reloadData(currentGroup.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleMiniatureDrop(event) {
    if (!currentGroup || !canManageGroup) return;
    event.preventDefault();
    const miniatureId = event.dataTransfer.getData('text/plain');
    if (!miniatureId) return;
    const board = event.currentTarget;
    const rect = board.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    await db.entities.Miniature.update(miniatureId, { x, y });
    await reloadData(currentGroup.id);
  }

  async function handleSetActiveMap(materialId) {
    if (!currentGroup || !canManageGroup) return;
    await handleUpdateGroup({ active_map_material_id: materialId || null });
  }

  const selectableMaterialMaps = currentGroupMaterials.filter(item => item.kind === 'map');

  const miniatureOptions = useMemo(() => {
    const characterOptions = groupCharacters.map(({ member, sheet }) => ({
      label: `${memberName(member, usersById)} — ${characterName(sheet)}`,
      value: sheet.id,
      type: 'character',
    }));
    const creatureOptions = currentGroupCreatures.map(item => ({
      label: `${item.name} (${prettyCreatureType(item.creature_type)})`,
      value: item.id,
      type: 'creature',
    }));
    return { characterOptions, creatureOptions };
  }, [groupCharacters, currentGroupCreatures, usersById]);

  useEffect(() => {
    const available = miniatureOptions[miniatureForm.source_type === 'character' ? 'characterOptions' : 'creatureOptions'];
    if (!miniatureForm.source_id && available[0]?.value) {
      setMiniatureForm(prev => ({ ...prev, source_id: available[0].value, name: available[0].label }));
    }
  }, [miniatureOptions, miniatureForm.source_type, miniatureForm.source_id]);

  useEffect(() => {
    const available = miniatureForm.source_type === 'character'
      ? miniatureOptions.characterOptions
      : miniatureOptions.creatureOptions;
    if (!available.some(item => item.value === miniatureForm.source_id) && available[0]?.value) {
      setMiniatureForm(prev => ({ ...prev, source_id: available[0].value, name: available[0].label }));
    }
  }, [miniatureForm.source_type, miniatureOptions, miniatureForm.source_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment-light)' }}>
        <div className="w-8 h-8 border-4 border-parchment-dark border-t-ink-mid rounded-full animate-spin" />
      </div>
    );
  }

  const boardMapUrl = activeMap?.file_url || '';
  const boardTitle = activeMap?.title || 'No map selected';

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment-light)' }}>
      <header className="px-6 py-4" style={{ background: 'var(--ink-dark)', borderBottom: '3px solid var(--parchment-dark)' }}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link to="/" className="scroll-btn inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Home
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Users size={20} style={{ color: 'var(--parchment-dark)' }} />
            <div className="min-w-0">
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentGroup?.name || 'Groups'}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', color: 'var(--parchment-dark)', fontSize: '0.75rem' }}>
                Shared sessions, sheets, materials, and miniatures
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {currentGroup && (
              <button className="scroll-btn text-xs" onClick={() => reloadData(currentGroup.id)}>Refresh</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="parchment-box p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-dark)', fontWeight: 800 }}>Groups</div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(45,106,45,0.12)', color: '#2d6a2d' }}>
                {groups.length} total
              </span>
            </div>

            <form className="space-y-3" onSubmit={handleCreateGroup}>
              <div>
                <div className="sheet-label">Create group</div>
                <input className="parchment-input text-sm" value={groupForm.name} onChange={e => setGroupForm(prev => ({ ...prev, name: e.target.value }))} placeholder="New campaign group" />
              </div>
              <div>
                <div className="sheet-label">Description</div>
                <textarea className="parchment-input text-sm min-h-[90px]" value={groupForm.description} onChange={e => setGroupForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Notes for the session" />
              </div>
              <button className="scroll-btn w-full inline-flex items-center justify-center gap-2" disabled={busy}>
                <Plus size={14} /> Create group
              </button>
            </form>

            <div className="space-y-2">
              {groups.length === 0 && (
                <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>No groups yet.</div>
              )}
              {groups.map(group => {
                const memberCount = memberships.filter(item => item.group_id === group.id).length;
                return (
                  <button
                    key={group.id}
                    className="w-full text-left parchment-box p-3 hover:shadow-md transition-all"
                    style={{
                      borderColor: group.id === selectedGroupId ? 'var(--ink-gold)' : 'var(--parchment-dark)',
                      background: group.id === selectedGroupId ? 'rgba(184,134,11,0.08)' : 'var(--parchment-light)',
                    }}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      navigate(`/groups/${group.id}`);
                    }}
                  >
                    <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{group.name}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                      {memberCount} members · {group.description || 'No description'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            {!currentGroup ? (
              <div className="parchment-box p-6 text-center">
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--ink-dark)', fontWeight: 800 }}>Create or select a group</div>
                <div className="mt-2 text-sm" style={{ color: 'var(--ink-mid)' }}>
                  Registered users can create groups, assign roles, share sheets, and manage the table.
                </div>
              </div>
            ) : (
              <>
                <div className="parchment-box p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--ink-dark)', fontWeight: 900 }}>{currentGroup.name}</div>
                      <div className="text-sm mt-1" style={{ color: 'var(--ink-mid)' }}>{currentGroup.description || 'No description'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--ink-mid)' }}>Your role</div>
                      <div className="font-semibold" style={{ color: canManageGroup ? '#2d6a2d' : 'var(--ink-dark)' }}>
                        {currentMembership?.role || 'not joined'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <button className={`scroll-btn ${activeTab === 'dashboard' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={14} /> Dashboard</button>
                    <button className={`scroll-btn ${activeTab === 'overview' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`scroll-btn ${activeTab === 'members' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('members')}>Members</button>
                    <button className={`scroll-btn ${activeTab === 'sheets' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('sheets')}>Sheets</button>
                    <button className={`scroll-btn ${activeTab === 'materials' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('materials')}>Materials</button>
                    <button className={`scroll-btn ${activeTab === 'creatures' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('creatures')}>Creatures</button>
                    <button className={`scroll-btn ${activeTab === 'miniatures' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('miniatures')}>Miniatures</button>
                    <button className={`scroll-btn ${activeTab === 'map' ? '' : 'opacity-70'}`} onClick={() => setActiveTab('map')}>Map</button>
                  </div>
                </div>

                {activeTab === 'dashboard' && (
                  <CampaignDashboard
                    group={currentGroup}
                    currentMembership={currentMembership}
                    currentGroupMembers={currentGroupMembers}
                    usersById={usersById}
                    sheets={sheets}
                    materials={materials}
                    creatures={creatures}
                    miniatures={miniatures}
                    canManageGroup={canManageGroup}
                  />
                )}

                {activeTab === 'overview' && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <Crown size={16} /> Members
                      </div>
                      <div className="space-y-2">
                        {currentGroupMembers.map(member => {
                          const sheet = getSelectedMemberSheet(member, sheets);
                          return (
                            <div key={member.id} className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.35)' }}>
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{memberName(member, usersById)}</div>
                                  <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{member.role || 'player'}</div>
                                </div>
                                <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>
                                  {sheet ? characterName(sheet) : 'No character selected'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <MapPinned size={16} /> Active map
                      </div>
                      {activeMap ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium" style={{ color: 'var(--ink-dark)' }}>{activeMap.title}</div>
                          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{prettyKind(activeMap.kind)}</div>
                          <a href={activeMap.file_url} target="_blank" rel="noreferrer" className="scroll-btn inline-flex items-center gap-2">
                            <ImageIcon size={14} /> Open map
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>No map selected yet.</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="parchment-box p-4 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <Users size={16} /> Group members
                      </div>
                      {canAssignRoles && (
                        <div className="flex gap-2">
                          <button type="button" className="scroll-btn text-xs" onClick={() => Promise.all(currentGroupMembers.map(member => handleUpdateMember(member.id, { role: 'player' })))}>Set all players</button>
                          <button type="button" className="scroll-btn text-xs" onClick={() => Promise.all(currentGroupMembers.map(member => handleUpdateMember(member.id, { role: 'master' })))}>Set all masters</button>
                        </div>
                      )}
                    </div>

                    {canManageGroup && (
                      <form onSubmit={handleAddMember} className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <select className="parchment-input text-sm" value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)}>
                          <option value="">Add registered user</option>
                          {users
                            .filter(item => !currentGroupMembers.some(member => member.user_id === item.id))
                            .map(item => (
                              <option key={item.id} value={item.id}>{item.name || item.email || item.id}</option>
                            ))}
                        </select>
                        <button className="scroll-btn inline-flex items-center justify-center gap-2" disabled={!memberToAdd || busy}>
                          <UserPlus size={14} /> Add
                        </button>
                      </form>
                    )}

                    <div className="space-y-3">
                      {currentGroupMembers.map(member => {
                        const memberSheets = getUserAccessibleSheetOptions(member, sheets);
                        const selectedSheet = getSelectedMemberSheet(member, sheets);
                        const isSelf = member.user_id === user?.id;
                        const canEditMember = canManageGroup || isSelf;
                        return (
                          <div key={member.id} className="p-4 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
                            <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{memberName(member, usersById)}</div>
                                    <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{usersById[member.user_id]?.email || member.user_id}</div>
                                  </div>
                                  {currentGroup.creator_user_id === member.user_id && (
                                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(184,134,11,0.12)', color: 'var(--ink-gold)' }}>Creator</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                  <span className="text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--ink-mid)' }}>Role</span>
                                  {canAssignRoles ? (
                                    <select className="parchment-input text-sm max-w-[180px]" value={member.role || 'player'} onChange={e => handleUpdateMember(member.id, { role: e.target.value })}>
                                      <option value="player">Player</option>
                                      <option value="master">Game master</option>
                                    </select>
                                  ) : (
                                    <span className="font-medium">{member.role || 'player'}</span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="sheet-label">Selected character</div>
                                {canEditMember ? (
                                  <select
                                    className="parchment-input text-sm"
                                    value={member.selected_character_sheet_id || ''}
                                    onChange={e => handleUpdateMember(member.id, { selected_character_sheet_id: e.target.value || null })}
                                  >
                                    <option value="">No character selected</option>
                                    {memberSheets.map(sheet => (
                                      <option key={sheet.id} value={sheet.id}>
                                        {characterName(sheet)} · L{sheet.level || 1}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-sm" style={{ color: 'var(--ink-dark)' }}>
                                    {selectedSheet ? characterName(selectedSheet) : 'No character selected'}
                                  </div>
                                )}
                                {selectedSheet && (
                                  <Link to={`/sheet/${selectedSheet.id}/view`} className="scroll-btn inline-flex items-center justify-center gap-2 text-xs">
                                    <FileText size={12} /> View sheet
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'sheets' && (
                  <div className="parchment-box p-4 space-y-4">
                    <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                      <FileText size={16} /> Character sheets in this group
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {groupCharacters.map(({ member, sheet }) => (
                        <div key={sheet.id} className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
                          <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{characterName(sheet)}</div>
                          <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                            {memberName(member, usersById)} · Level {sheet.level || 1}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                            {sheet.class_id ? `Class ID ${sheet.class_id}` : 'No class selected'}
                          </div>
                          <Link to={`/sheet/${sheet.id}/view`} className="scroll-btn inline-flex items-center justify-center gap-2 mt-3 text-xs">
                            Open read-only
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <Upload size={16} /> Materials
                      </div>
                      {canManageGroup ? (
                        <form className="space-y-3" onSubmit={handleUploadMaterial}>
                          <div>
                            <div className="sheet-label">Title</div>
                            <input className="parchment-input text-sm" value={materialForm.title} onChange={e => setMaterialForm(prev => ({ ...prev, title: e.target.value }))} />
                          </div>
                          <div>
                            <div className="sheet-label">Type</div>
                            <select className="parchment-input text-sm" value={materialForm.kind} onChange={e => setMaterialForm(prev => ({ ...prev, kind: e.target.value }))}>
                              {GROUP_MATERIAL_KINDS.map(kind => (
                                <option key={kind.value} value={kind.value}>{kind.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="sheet-label">Notes</div>
                            <textarea className="parchment-input text-sm min-h-[72px]" value={materialForm.notes} onChange={e => setMaterialForm(prev => ({ ...prev, notes: e.target.value }))} />
                          </div>
                          <div>
                            <div className="sheet-label">File</div>
                            <input type="file" className="parchment-input text-sm" onChange={e => setMaterialFile(e.target.files?.[0] || null)} />
                          </div>
                          <button className="scroll-btn w-full inline-flex items-center justify-center gap-2" disabled={!materialFile || busy}>
                            <Upload size={14} /> Upload material
                          </button>
                        </form>
                      ) : (
                        <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>
                          Players can view materials uploaded by the master.
                        </div>
                      )}
                    </div>

                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <ScrollText size={16} /> Uploaded materials
                      </div>
                      <div className="space-y-2">
                        {currentGroupMaterials.map(item => (
                          <div key={item.id} className="p-3 rounded border flex items-start justify-between gap-3" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
                            <div>
                              <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{item.title}</div>
                              <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                                {prettyKind(item.kind)}{item.file_name ? ` · ${item.file_name}` : ''}
                              </div>
                              {item.notes && <div className="text-sm mt-2" style={{ color: 'var(--ink-mid)' }}>{item.notes}</div>}
                            </div>
                            <a href={item.file_url} target="_blank" rel="noreferrer" className="scroll-btn inline-flex items-center gap-2 text-xs">
                              <Download size={12} /> Open
                            </a>
                          </div>
                        ))}
                        {currentGroupMaterials.length === 0 && (
                          <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>No files uploaded yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'creatures' && (
                  <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <Swords size={16} /> Create profile
                      </div>
                      <form className="space-y-3" onSubmit={handleCreateCreature}>
                        <div>
                          <div className="sheet-label">Name</div>
                          <input className="parchment-input text-sm" value={creatureForm.name} onChange={e => setCreatureForm(prev => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div>
                          <div className="sheet-label">Type</div>
                          <select className="parchment-input text-sm" value={creatureForm.creature_type} onChange={e => setCreatureForm(prev => ({ ...prev, creature_type: e.target.value }))}>
                            {CREATURE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="sheet-label">Summary</div>
                          <textarea className="parchment-input text-sm min-h-[72px]" value={creatureForm.summary} onChange={e => setCreatureForm(prev => ({ ...prev, summary: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="sheet-label">HP dice</div>
                            <input type="number" min="1" className="parchment-input text-sm" value={creatureForm.hp_dice_count} onChange={e => setCreatureForm(prev => ({ ...prev, hp_dice_count: e.target.value }))} />
                          </div>
                          <div>
                            <div className="sheet-label">Sides</div>
                            <input type="number" min="1" className="parchment-input text-sm" value={creatureForm.hp_dice_sides} onChange={e => setCreatureForm(prev => ({ ...prev, hp_dice_sides: e.target.value }))} />
                          </div>
                          <div>
                            <div className="sheet-label">Bonus</div>
                            <input type="number" className="parchment-input text-sm" value={creatureForm.hp_bonus} onChange={e => setCreatureForm(prev => ({ ...prev, hp_bonus: e.target.value }))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="sheet-label">AC</div>
                            <input type="number" className="parchment-input text-sm" value={creatureForm.ac} onChange={e => setCreatureForm(prev => ({ ...prev, ac: e.target.value }))} />
                          </div>
                          <div>
                            <div className="sheet-label">Speed</div>
                            <input type="number" className="parchment-input text-sm" value={creatureForm.speed} onChange={e => setCreatureForm(prev => ({ ...prev, speed: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <div className="sheet-label">Notes</div>
                          <textarea className="parchment-input text-sm min-h-[72px]" value={creatureForm.notes} onChange={e => setCreatureForm(prev => ({ ...prev, notes: e.target.value }))} />
                        </div>
                        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-dark)' }}>
                          <input type="checkbox" checked={creatureForm.share_with_group} onChange={e => setCreatureForm(prev => ({ ...prev, share_with_group: e.target.checked }))} />
                          Share with this group
                        </label>
                        <button className="scroll-btn w-full inline-flex items-center justify-center gap-2" disabled={busy}>
                          <Save size={14} /> Save profile
                        </button>
                      </form>
                    </div>

                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <MessageSquareText size={16} /> Creature profiles
                      </div>
                      <div className="space-y-2">
                        {currentGroupCreatures.map(creature => (
                          <div key={creature.id} className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{creature.name}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                                  {prettyCreatureType(creature.creature_type)} · {creature.hp_formula ? `HP ${creature.hp_formula}` : 'HP not set'} · {creature.ac ? `AC ${creature.ac}` : 'AC n/a'}
                                </div>
                                {creature.summary && <div className="text-sm mt-2" style={{ color: 'var(--ink-mid)' }}>{creature.summary}</div>}
                              </div>
                              <button className="scroll-btn text-xs" onClick={() => setMiniatureForm(prev => ({ ...prev, source_type: 'creature', source_id: creature.id, name: creature.name, summary: creature.summary || '' }))}>
                                Add miniature
                              </button>
                            </div>
                          </div>
                        ))}
                        {creatures.filter(item => !Array.isArray(item.group_ids) || !item.group_ids.includes(selectedGroupId)).filter(item => item.created_by_user_id === user?.id).map(creature => (
                          <div key={creature.id} className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.32)' }}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{creature.name}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                                  {prettyCreatureType(creature.creature_type)} · {creature.hp_formula ? `HP ${creature.hp_formula}` : 'HP not set'}
                                </div>
                              </div>
                              {canManageGroup && (
                                <button className="scroll-btn text-xs" onClick={() => handleUploadCreatureToGroup(creature.id)}>Upload to group</button>
                              )}
                            </div>
                          </div>
                        ))}
                        {currentGroupCreatures.length === 0 && (
                          <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>No creature profiles in this group yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'miniatures' && (
                  <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <GripVertical size={16} /> Miniature
                      </div>
                      <form className="space-y-3" onSubmit={handleCreateMiniature}>
                        <div>
                          <div className="sheet-label">Source type</div>
                          <select
                            className="parchment-input text-sm"
                            value={miniatureForm.source_type}
                            onChange={e => setMiniatureForm(prev => ({ ...prev, source_type: e.target.value, source_id: '' }))}
                          >
                            {MINIATURE_SOURCE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                        </div>

                        <div>
                          <div className="sheet-label">Source</div>
                          <select
                            className="parchment-input text-sm"
                            value={miniatureForm.source_id}
                            onChange={e => {
                              const nextId = e.target.value;
                              const selected = miniatureForm.source_type === 'character'
                                ? sheets.find(item => item.id === nextId)
                                : creatures.find(item => item.id === nextId);
                              setMiniatureForm(prev => ({
                                ...prev,
                                source_id: nextId,
                                name: buildMiniatureName(miniatureForm.source_type, selected),
                                summary: resolveSummaryFromMiniature({ source_type: miniatureForm.source_type, source_id: nextId, name: '' }, sheets, creatures),
                              }));
                            }}
                          >
                            <option value="">Select source</option>
                            {(miniatureForm.source_type === 'character' ? miniatureOptions.characterOptions : miniatureOptions.creatureOptions).map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="sheet-label">Name</div>
                          <input className="parchment-input text-sm" value={miniatureForm.name} onChange={e => setMiniatureForm(prev => ({ ...prev, name: e.target.value }))} />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="sheet-label">X %</div>
                            <input type="number" className="parchment-input text-sm" value={miniatureForm.x} onChange={e => setMiniatureForm(prev => ({ ...prev, x: e.target.value }))} />
                          </div>
                          <div>
                            <div className="sheet-label">Y %</div>
                            <input type="number" className="parchment-input text-sm" value={miniatureForm.y} onChange={e => setMiniatureForm(prev => ({ ...prev, y: e.target.value }))} />
                          </div>
                        </div>

                        <div>
                          <div className="sheet-label">Summary</div>
                          <textarea className="parchment-input text-sm min-h-[72px]" value={miniatureForm.summary} onChange={e => setMiniatureForm(prev => ({ ...prev, summary: e.target.value }))} />
                        </div>

                        <button className="scroll-btn w-full inline-flex items-center justify-center gap-2" disabled={!miniatureForm.source_id || busy}>
                          <Plus size={14} /> Create miniature
                        </button>
                      </form>

                      {selectedMiniature && (
                        <div className="pt-3 border-t" style={{ borderColor: 'var(--parchment-dark)' }}>
                          <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{selectedMiniature.name}</div>
                          <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                            {resolveSummaryFromMiniature(selectedMiniature, sheets, creatures)}
                          </div>
                          <div className="text-xs mt-2" style={{ color: 'var(--ink-mid)' }}>
                            Position: {Math.round(selectedMiniature.x || 0)}% / {Math.round(selectedMiniature.y || 0)}%
                          </div>
                          {selectedMiniature.hp_current != null && (
                            <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>
                              HP: {selectedMiniature.hp_current}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                          <ImageIcon size={16} /> Map board
                        </div>
                        <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>{boardTitle}</div>
                      </div>
                      <div
                        className="relative rounded border overflow-hidden"
                        style={{
                          borderColor: 'var(--parchment-dark)',
                          background: boardMapUrl ? 'rgba(0,0,0,0.1)' : 'linear-gradient(135deg, rgba(255,255,255,0.5), rgba(242,230,201,0.55))',
                          minHeight: '540px',
                        }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleMiniatureDrop}
                      >
                        {boardMapUrl ? (
                          <img src={boardMapUrl} alt={boardTitle} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'var(--ink-mid)' }}>
                            Select a map to begin placing miniatures.
                          </div>
                        )}

                        {currentGroupMiniatures.map(miniature => (
                          <button
                            key={miniature.id}
                            draggable={canManageGroup}
                            onDragStart={e => e.dataTransfer.setData('text/plain', miniature.id)}
                            onClick={() => setSelectedMiniatureId(miniature.id)}
                            type="button"
                            className="absolute rounded-full shadow-md border px-2 py-1 text-xs font-semibold truncate max-w-[160px]"
                            style={{
                              left: `${Math.max(0, Math.min(100, miniature.x || 0))}%`,
                              top: `${Math.max(0, Math.min(100, miniature.y || 0))}%`,
                              transform: 'translate(-50%, -50%)',
                              borderColor: selectedMiniatureId === miniature.id ? 'var(--ink-gold)' : 'rgba(0,0,0,0.18)',
                              background: 'rgba(255,255,255,0.88)',
                              color: 'var(--ink-dark)',
                            }}
                          >
                            {miniature.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <MapPinned size={16} /> Choose active map
                      </div>
                      {canManageGroup ? (
                        <div className="space-y-2">
                          <select className="parchment-input text-sm" value={currentGroup.active_map_material_id || ''} onChange={e => handleSetActiveMap(e.target.value || null)}>
                            <option value="">No map selected</option>
                            {selectableMaterialMaps.map(item => (
                              <option key={item.id} value={item.id}>{item.title}</option>
                            ))}
                          </select>
                          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>
                            Upload a material of type Map, then select it here.
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: 'var(--ink-mid)' }}>Only the master can change the active map.</div>
                      )}

                      {activeMap && (
                        <div className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
                          <div className="font-semibold" style={{ color: 'var(--ink-dark)' }}>{activeMap.title}</div>
                          <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>{prettyKind(activeMap.kind)}</div>
                          {activeMap.notes && <div className="text-sm mt-2" style={{ color: 'var(--ink-mid)' }}>{activeMap.notes}</div>}
                        </div>
                      )}
                    </div>

                    <div className="parchment-box p-4 space-y-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-dark)', fontWeight: 700 }}>
                        <ImageIcon size={16} /> Map preview
                      </div>
                      <div className="relative rounded border overflow-hidden" style={{ borderColor: 'var(--parchment-dark)', minHeight: '560px' }}>
                        {boardMapUrl ? (
                          <img src={boardMapUrl} alt={boardTitle} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'var(--ink-mid)' }}>
                            No active map.
                          </div>
                        )}
                        {currentGroupMiniatures.map(miniature => (
                          <button
                            key={miniature.id}
                            type="button"
                            draggable={canManageGroup}
                            onDragStart={e => e.dataTransfer.setData('text/plain', miniature.id)}
                            onClick={() => setSelectedMiniatureId(miniature.id)}
                            className="absolute rounded-full shadow-md border px-2 py-1 text-xs font-semibold truncate max-w-[160px]"
                            style={{
                              left: `${Math.max(0, Math.min(100, miniature.x || 0))}%`,
                              top: `${Math.max(0, Math.min(100, miniature.y || 0))}%`,
                              transform: 'translate(-50%, -50%)',
                              borderColor: selectedMiniatureId === miniature.id ? 'var(--ink-gold)' : 'rgba(0,0,0,0.18)',
                              background: 'rgba(255,255,255,0.88)',
                              color: 'var(--ink-dark)',
                            }}
                          >
                            {miniature.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
