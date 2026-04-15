/** Mirrors frontend `fieldPermissions.__resourceAccess` (JSON on PermissionSetting). */
export const RESOURCE_ACCESS_KEY = '__resourceAccess' as const;

/** Per-action allowlists: canWrite, canEdit, canDelete, … */
export const ACTION_RESOURCE_ACCESS_KEY = '__actionResourceAccess' as const;

export type ResourceAccessMode = 'all' | 'users_items' | 'deny';

export interface ResourceAccessMeta {
  mode: ResourceAccessMode;
  allowedUserIds?: number[];
}

export type ActionResourceAccessKey =
  | 'canWrite'
  | 'canEdit'
  | 'canDelete'
  | 'canManage'
  | 'canExport'
  | 'canImport';

export function getResourceAccessMeta(fieldPermissions: unknown): ResourceAccessMeta | null {
  if (!fieldPermissions || typeof fieldPermissions !== 'object') return null;
  const raw = (fieldPermissions as Record<string, unknown>)[RESOURCE_ACCESS_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const mode = m.mode;
  if (mode !== 'all' && mode !== 'users_items' && mode !== 'deny') return null;
  const allowedUserIds = Array.isArray(m.allowedUserIds)
    ? (m.allowedUserIds as unknown[]).filter((x): x is number => typeof x === 'number')
    : [];
  return { mode, allowedUserIds };
}

function parseAccessMeta(raw: unknown): ResourceAccessMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const mode = m.mode;
  if (mode !== 'all' && mode !== 'users_items' && mode !== 'deny') return null;
  const allowedUserIds = Array.isArray(m.allowedUserIds)
    ? (m.allowedUserIds as unknown[]).filter((x): x is number => typeof x === 'number')
    : [];
  return { mode, allowedUserIds };
}

export function getActionResourceAccessMeta(
  fieldPermissions: unknown,
  permKey: ActionResourceAccessKey
): ResourceAccessMeta | null {
  if (!fieldPermissions || typeof fieldPermissions !== 'object') return null;
  const bucket = (fieldPermissions as Record<string, unknown>)[ACTION_RESOURCE_ACCESS_KEY];
  if (!bucket || typeof bucket !== 'object') return null;
  return parseAccessMeta((bucket as Record<string, unknown>)[permKey]);
}

function userAllowedByMeta(meta: ResourceAccessMeta | null, userId: number | undefined): boolean {
  if (!meta) return true;
  if (meta.mode === 'deny') return false;
  if (meta.mode === 'all') return true;
  if (meta.mode === 'users_items') {
    if (userId == null) return false;
    return (meta.allowedUserIds ?? []).includes(userId);
  }
  return true;
}

/** If false, the role row does not grant this user access (e.g. users_items allowlist). */
export function userAllowedByResourceAccess(
  fieldPermissions: unknown,
  userId: number | undefined
): boolean {
  return userAllowedByMeta(getResourceAccessMeta(fieldPermissions), userId);
}

/** Non-read capabilities: missing meta ⇒ whole role (backward compatible). */
export function userAllowedByActionResourceAccess(
  fieldPermissions: unknown,
  userId: number | undefined,
  permKey: ActionResourceAccessKey
): boolean {
  return userAllowedByMeta(getActionResourceAccessMeta(fieldPermissions, permKey), userId);
}

export type PermissionCapabilityFlags = {
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  canExport: boolean;
  canImport: boolean;
};

/** When `action` is set, checks that capability + its allowlist. When omitted, any granted capability whose allowlist passes. */
export function userAllowedByResourceAccessForAction(
  fieldPermissions: unknown,
  userId: number | undefined,
  action: string | undefined,
  p: PermissionCapabilityFlags
): boolean {
  const a = action?.toLowerCase();

  if (a === 'read') {
    if (!p.canRead) return false;
    return userAllowedByResourceAccess(fieldPermissions, userId);
  }
  if (a === 'write' || a === 'add') {
    if (!p.canWrite) return false;
    return userAllowedByActionResourceAccess(fieldPermissions, userId, 'canWrite');
  }
  if (a === 'edit') {
    if (!p.canEdit) return false;
    return userAllowedByActionResourceAccess(fieldPermissions, userId, 'canEdit');
  }
  if (a === 'delete') {
    if (!p.canDelete) return false;
    return userAllowedByActionResourceAccess(fieldPermissions, userId, 'canDelete');
  }
  if (a === 'manage') {
    if (!p.canManage) return false;
    return userAllowedByActionResourceAccess(fieldPermissions, userId, 'canManage');
  }
  if (a === 'export') {
    if (!p.canExport) return false;
    return userAllowedByActionResourceAccess(fieldPermissions, userId, 'canExport');
  }
  if (a === 'import') {
    if (!p.canImport) return false;
    return userAllowedByActionResourceAccess(fieldPermissions, userId, 'canImport');
  }

  if (
    p.canRead &&
    userAllowedByResourceAccess(fieldPermissions, userId)
  ) {
    return true;
  }
  const keys: ActionResourceAccessKey[] = [
    'canWrite',
    'canEdit',
    'canDelete',
    'canManage',
    'canExport',
    'canImport'
  ];
  for (const k of keys) {
    if (p[k] && userAllowedByActionResourceAccess(fieldPermissions, userId, k)) {
      return true;
    }
  }
  return false;
}
