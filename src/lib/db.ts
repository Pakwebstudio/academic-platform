/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-memory data store.
 *
 * This replaces Prisma entirely: there is no database, no connection string,
 * and no client binary. It implements the same `db.<model>.<method>()` surface
 * the application already uses, backed by JavaScript collections seeded with
 * demo data at module load. All data lives in process memory, so mutations
 * reset whenever the server restarts / redeploys.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type { Role } from "@/lib/db-types";

// ============ MODEL METADATA ============

// `on` says which record holds the FK:
//  - "this": the current record has scalar field `fk` -> related row id
//  - "to":   the related model's rows have scalar field `fk` = current id
// kind "many" is always "to" (the related model holds the FK back to us).
type Relation = { to: string; kind: "one" | "many"; fk: string; on?: "this" | "to" };

const relations: Record<string, Record<string, Relation>> = {
  User: {
    department: { to: "Department", kind: "one", fk: "departmentId", on: "this" },
    profile: { to: "Profile", kind: "one", fk: "userId", on: "to" },
    researcherProfile: { to: "ResearcherProfile", kind: "one", fk: "userId", on: "to" },
    verificationRequest: { to: "VerificationRequest", kind: "one", fk: "userId", on: "to" },
    papers: { to: "ResearchPaper", kind: "many", fk: "uploaderId" },
    paperAuthors: { to: "PaperAuthor", kind: "many", fk: "userId" },
    permissionRequests: { to: "PaperPermissionRequest", kind: "many", fk: "requesterId" },
    purchases: { to: "PaperPurchase", kind: "many", fk: "buyerId" },
    paperAccesses: { to: "PaperAccess", kind: "many", fk: "userId" },
    notifications: { to: "Notification", kind: "many", fk: "userId" },
    conversations: { to: "ConversationMember", kind: "many", fk: "userId" },
    sentMessages: { to: "Message", kind: "many", fk: "senderId" },
    callRequestsMade: { to: "CallRequest", kind: "many", fk: "requesterId" },
    callRequestsReceived: { to: "CallRequest", kind: "many", fk: "researcherId" },
    collaborations: { to: "ResearchCollaboration", kind: "many", fk: "userId" },
    collaborationRequests: { to: "CollaborationRequest", kind: "many", fk: "requesterId" },
    reportsMade: { to: "Report", kind: "many", fk: "reporterId" },
    userReports: { to: "Report", kind: "many", fk: "reportedUserId" },
    qualifications: { to: "AcademicQualification", kind: "many", fk: "userId" },
    experiences: { to: "Experience", kind: "many", fk: "userId" },
    socialLinks: { to: "SocialLink", kind: "many", fk: "userId" },
    auditLogs: { to: "AuditLog", kind: "many", fk: "actorId" },
    adminInvited: { to: "AdminInvitation", kind: "many", fk: "invitedById" },
    notificationsSent: { to: "AdminNotification", kind: "many", fk: "senderId" },
    payments: { to: "Payment", kind: "many", fk: "userId" },
    earnings: { to: "Earning", kind: "many", fk: "userId" },
    uploadedFiles: { to: "FileAsset", kind: "many", fk: "uploadedById" },
    researchInterests: { to: "UserResearchInterest", kind: "many", fk: "userId" },
  },
  Profile: { user: { to: "User", kind: "one", fk: "userId", on: "this" } },
  ResearcherProfile: {
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
    university: { to: "University", kind: "one", fk: "universityId", on: "this" },
    department: { to: "Department", kind: "one", fk: "departmentId", on: "this" },
  },
  AcademicQualification: { user: { to: "User", kind: "one", fk: "userId", on: "this" } },
  Experience: { user: { to: "User", kind: "one", fk: "userId", on: "this" } },
  SocialLink: { user: { to: "User", kind: "one", fk: "userId", on: "this" } },
  University: {
    departments: { to: "UniversityDepartment", kind: "many", fk: "universityId" },
    researchers: { to: "ResearcherProfile", kind: "many", fk: "universityId" },
    papers: { to: "ResearchPaper", kind: "many", fk: "universityId" },
    adminNotifications: { to: "AdminNotification", kind: "many", fk: "universityId" },
  },
  Department: {
    universities: { to: "UniversityDepartment", kind: "many", fk: "departmentId" },
    members: { to: "User", kind: "many", fk: "departmentId" },
    researcherProfiles: { to: "ResearcherProfile", kind: "many", fk: "departmentId" },
  },
  ResearchArea: {
    papers: { to: "PaperResearchArea", kind: "many", fk: "researchAreaId" },
    users: { to: "UserResearchInterest", kind: "many", fk: "researchAreaId" },
  },
  Category: { papers: { to: "ResearchPaper", kind: "many", fk: "categoryId" } },
  ResearchPaper: {
    uploader: { to: "User", kind: "one", fk: "uploaderId", on: "this" },
    category: { to: "Category", kind: "one", fk: "categoryId", on: "this" },
    university: { to: "University", kind: "one", fk: "universityId", on: "this" },
    authors: { to: "PaperAuthor", kind: "many", fk: "paperId" },
    researchAreas: { to: "PaperResearchArea", kind: "many", fk: "paperId" },
    permissions: { to: "PaperPermissionRequest", kind: "many", fk: "paperId" },
    purchases: { to: "PaperPurchase", kind: "many", fk: "paperId" },
    fileAsset: { to: "FileAsset", kind: "one", fk: "fileAssetId", on: "to" },
    reports: { to: "Report", kind: "many", fk: "paperId" },
    accessRecords: { to: "PaperAccess", kind: "many", fk: "paperId" },
    earnings: { to: "Earning", kind: "many", fk: "paperId" },
  },
  PaperAuthor: {
    paper: { to: "ResearchPaper", kind: "one", fk: "paperId", on: "this" },
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
  },
  PaperPermissionRequest: {
    requester: { to: "User", kind: "one", fk: "requesterId", on: "this" },
    paper: { to: "ResearchPaper", kind: "one", fk: "paperId", on: "this" },
  },
  PaperAccess: {
    purchase: { to: "PaperPurchase", kind: "one", fk: "purchaseId", on: "this" },
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
    paper: { to: "ResearchPaper", kind: "one", fk: "paperId", on: "this" },
  },
  PaperPurchase: {
    buyer: { to: "User", kind: "one", fk: "buyerId", on: "this" },
    paper: { to: "ResearchPaper", kind: "one", fk: "paperId", on: "this" },
    payment: { to: "Payment", kind: "one", fk: "purchaseId", on: "to" },
    accessRecords: { to: "PaperAccess", kind: "many", fk: "purchaseId" },
    refunds: { to: "Refund", kind: "many", fk: "purchaseId" },
  },
  Payment: {
    purchase: { to: "PaperPurchase", kind: "one", fk: "purchaseId", on: "this" },
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
    refunds: { to: "Refund", kind: "many", fk: "paymentId" },
    earnings: { to: "Earning", kind: "many", fk: "paymentId" },
  },
  Earning: {
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
    payment: { to: "Payment", kind: "one", fk: "paymentId", on: "this" },
    paper: { to: "ResearchPaper", kind: "one", fk: "paperId", on: "this" },
  },
  Refund: {
    payment: { to: "Payment", kind: "one", fk: "paymentId", on: "this" },
    purchase: { to: "PaperPurchase", kind: "one", fk: "purchaseId", on: "this" },
  },
  CallRequest: {
    requester: { to: "User", kind: "one", fk: "requesterId", on: "this" },
    researcher: { to: "User", kind: "one", fk: "researcherId", on: "this" },
  },
  Conversation: {
    members: { to: "ConversationMember", kind: "many", fk: "conversationId" },
    messages: { to: "Message", kind: "many", fk: "conversationId" },
    reports: { to: "Report", kind: "many", fk: "conversationId" },
  },
  ConversationMember: {
    conversation: { to: "Conversation", kind: "one", fk: "conversationId", on: "this" },
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
  },
  Message: {
    conversation: { to: "Conversation", kind: "one", fk: "conversationId", on: "this" },
    sender: { to: "User", kind: "one", fk: "senderId", on: "this" },
  },
  ResearchCollaboration: {
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
    requests: { to: "CollaborationRequest", kind: "many", fk: "collaborationId" },
    reports: { to: "Report", kind: "many", fk: "collaborationId" },
  },
  CollaborationRequest: {
    collaboration: { to: "ResearchCollaboration", kind: "one", fk: "collaborationId", on: "this" },
    requester: { to: "User", kind: "one", fk: "requesterId", on: "this" },
  },
  Report: {
    reporter: { to: "User", kind: "one", fk: "reporterId", on: "this" },
    reportedUser: { to: "User", kind: "one", fk: "reportedUserId", on: "this" },
    paper: { to: "ResearchPaper", kind: "one", fk: "paperId", on: "this" },
    conversation: { to: "Conversation", kind: "one", fk: "conversationId", on: "this" },
    collaboration: { to: "ResearchCollaboration", kind: "one", fk: "collaborationId", on: "this" },
  },
  VerificationRequest: { user: { to: "User", kind: "one", fk: "userId", on: "this" } },
  Notification: { user: { to: "User", kind: "one", fk: "userId", on: "this" } },
  AdminNotification: {
    sender: { to: "User", kind: "one", fk: "senderId", on: "this" },
    university: { to: "University", kind: "one", fk: "universityId", on: "this" },
  },
  AdminInvitation: { invitedBy: { to: "User", kind: "one", fk: "invitedById", on: "this" } },
  AuditLog: { actor: { to: "User", kind: "one", fk: "actorId", on: "this" } },
  PlatformSetting: {},
  FileAsset: {
    paper: { to: "ResearchPaper", kind: "one", fk: "fileAssetId", on: "to" },
    uploader: { to: "User", kind: "one", fk: "uploadedById", on: "this" },
  },
  UniversityDepartment: {
    university: { to: "University", kind: "one", fk: "universityId", on: "this" },
    department: { to: "Department", kind: "one", fk: "departmentId", on: "this" },
  },
  PaperResearchArea: {
    paper: { to: "ResearchPaper", kind: "one", fk: "paperId", on: "this" },
    researchArea: { to: "ResearchArea", kind: "one", fk: "researchAreaId", on: "this" },
  },
  UserResearchInterest: {
    user: { to: "User", kind: "one", fk: "userId", on: "this" },
    researchArea: { to: "ResearchArea", kind: "one", fk: "researchAreaId", on: "this" },
  },
};

// Models whose `updatedAt` is bumped on write.
const UPDATED_MODELS = new Set([
  "User",
  "Profile",
  "ResearcherProfile",
  "University",
  "Department",
  "ResearchPaper",
  "PaperPermissionRequest",
  "PaperPurchase",
  "Payment",
  "Earning",
  "CallRequest",
  "Conversation",
  "ConversationMember",
  "Message",
  "ResearchCollaboration",
  "CollaborationRequest",
  "Report",
  "VerificationRequest",
  "AdminInvitation",
  "AuditLog",
  "PlatformSetting",
]);

// User has schema defaults (role, status, ...) beyond the shared ones.
const USER_DEFAULTS = {
  emailVerified: null,
  role: "STUDENT",
  adminRole: null,
  status: "PENDING_VERIFICATION",
  verificationStatus: "NONE",
  avatarUrl: null,
  bio: null,
  location: null,
  phone: null,
  title: null,
  designation: null,
  departmentId: null,
  lastActiveAt: null,
  isDemo: false,
  isSeed: false,
};

// ============ STORAGE ============

const tables = new Map<string, Record<string, any>[]>();
let idSeq = 0;

function table(name: string): Record<string, any>[] {
  let t = tables.get(name);
  if (!t) {
    t = [];
    tables.set(name, t);
  }
  return t;
}

function nextId(): string {
  idSeq += 1;
  const rand = crypto.randomBytes(4).toString("hex");
  return `rec_${Date.now().toString(36)}_${idSeq}_${rand}`;
}

const now = (): Date => new Date();

function applyDefaults(model: string, data: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};
  if (model === "User") Object.assign(row, USER_DEFAULTS);
  Object.assign(row, data);
  if (row.id == null) row.id = nextId();
  if (row.createdAt == null) row.createdAt = now();
  if (UPDATED_MODELS.has(model) && row.updatedAt == null) row.updatedAt = now();
  return row;
}

function touchUpdated(model: string, row: Record<string, any>) {
  if (UPDATED_MODELS.has(model)) row.updatedAt = now();
}

// ============ RELATION RESOLUTION ============

function resolveRelation(
  record: Record<string, any>,
  rel: Relation
): Record<string, any> | Record<string, any>[] | null {
  if (rel.kind === "many" || rel.on === "to") {
    return table(rel.to).filter((r) => r[rel.fk] === record.id);
  }
  const fk = record[rel.fk];
  if (fk == null) return null;
  return table(rel.to).find((r) => r.id === fk) ?? null;
}

// ============ QUERY PREDICATE ============

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

function whereMatch(record: Record<string, any>, model: string, where: any): boolean {
  if (where == null) return true;
  if (Array.isArray(where)) return where.some((w) => whereMatch(record, model, w));

  for (const key of Object.keys(where)) {
    const value = where[key];

    if (key === "AND") {
      const ands = Array.isArray(value) ? value : [value];
      for (const a of ands) {
        if (!whereMatch(record, model, a)) return false;
      }
      continue;
    }
    if (key === "OR") {
      const ors = Array.isArray(value) ? value : [value];
      if (!ors.some((o) => whereMatch(record, model, o))) return false;
      continue;
    }
    if (key === "NOT") {
      const nots = Array.isArray(value) ? value : [value];
      for (const n of nots) {
        if (whereMatch(record, model, n)) return false;
      }
      continue;
    }

    // relation filter (to-one or to-many)
    const rel = relations[model]?.[key];
    if (rel) {
      if (rel.kind === "one") {
        const related = resolveRelation(record, rel);
        if (related == null) {
          if (value == null) continue;
          return false;
        }
        if (!whereMatch(related as Record<string, any>, rel.to, value)) return false;
        continue;
      }
      const list = (resolveRelation(record, rel) as Record<string, any>[]) || [];
      if (isPlainObject(value) && "some" in value) {
        if (!list.some((r) => whereMatch(r, rel.to, value.some))) return false;
        continue;
      }
      if (isPlainObject(value) && "every" in value) {
        if (!list.every((r) => whereMatch(r, rel.to, value.every))) return false;
        continue;
      }
      if (isPlainObject(value) && "none" in value) {
        if (list.some((r) => whereMatch(r, rel.to, value.none))) return false;
        continue;
      }
      return false;
    }

    // scalar field filter
    if (!matchField(record[key], value)) return false;
  }

  return true;
}

function matchField(field: any, cond: any): boolean {
  if (cond === null || cond === undefined) return field === null || field === undefined;
  if (Array.isArray(cond)) return cond.includes(field);
  if (isPlainObject(cond)) {
    for (const op of Object.keys(cond)) {
      const arg = cond[op];
      switch (op) {
        case "equals":
          if (field !== arg) return false;
          break;
        case "in":
          if (!arg.includes(field)) return false;
          break;
        case "not":
          if (arg === null || arg === undefined) {
            if (field === null || field === undefined) return false;
          } else if (matchField(field, arg)) {
            return false;
          }
          break;
        case "notIn":
          if (arg.includes(field)) return false;
          break;
        case "contains": {
          const hay = field == null ? "" : String(field);
          const needle = String(arg);
          const ok = cond.mode === "insensitive"
            ? hay.toLowerCase().includes(needle.toLowerCase())
            : hay.includes(needle);
          if (!ok) return false;
          break;
        }
        case "mode":
          break; // affects string ops, handled inline
        case "startsWith": {
          const hay = field == null ? "" : String(field);
          const ok = cond.mode === "insensitive"
            ? hay.toLowerCase().startsWith(String(arg).toLowerCase())
            : hay.startsWith(String(arg));
          if (!ok) return false;
          break;
        }
        case "endsWith": {
          const hay = field == null ? "" : String(field);
          const ok = cond.mode === "insensitive"
            ? hay.toLowerCase().endsWith(String(arg).toLowerCase())
            : hay.endsWith(String(arg));
          if (!ok) return false;
          break;
        }
        case "gt":
          if (!(field > arg)) return false;
          break;
        case "gte":
          if (!(field >= arg)) return false;
          break;
        case "lt":
          if (!(field < arg)) return false;
          break;
        case "lte":
          if (!(field <= arg)) return false;
          break;
        default:
          return false;
      }
    }
    return true;
  }
  return field === cond;
}

// ============ ORDERING ============

function sortValue(record: Record<string, any>, model: string, key: any): any {
  if (isPlainObject(key)) {
    const relName = Object.keys(key)[0];
    const rel = relations[model]?.[relName];
    if (!rel) return undefined;
    const related = resolveRelation(record, rel) as Record<string, any> | null;
    if (related == null) return undefined;
    if (rel.kind === "one") return sortValue(related, rel.to, key[relName]);
    return 0;
  }
  return record[key];
}

function compareValues(a: any, b: any): number {
  if (a === b) return 0;
  if (a == null) return 1; // nulls sort last in ascending order
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : 1;
  return a - b;
}

function sortRows(rows: Record<string, any>[], orderBy: any, model: string): Record<string, any>[] {
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return rows.slice().sort((a, b) => {
    for (const o of orders) {
      const [key, dir] = Object.entries(o)[0];
      const av = sortValue(a, model, key);
      const bv = sortValue(b, model, key);
      const cmp = compareValues(av, bv);
      if (cmp !== 0) return dir === "desc" ? -cmp : cmp;
    }
    return 0;
  });
}

// ============ PROJECTION (select / include) ============

function projectRecord(rec: Record<string, any>, model: string, args: any): Record<string, any> {
  if (rec == null) return null as any;
  const out: Record<string, any> = {};

  if (args?.select) {
    for (const [field, spec] of Object.entries(args.select)) {
      if (spec === true) out[field] = rec[field];
      else out[field] = projectRelation(rec, model, field, spec);
    }
  } else {
    Object.assign(out, rec);
  }

  if (args?.include) {
    for (const [field, spec] of Object.entries(args.include)) {
      if (field === "_count") {
        out._count = {};
        const sel = (spec as any)?.select || (spec as any);
        for (const [relName, relSpec] of Object.entries(sel)) {
          const rel = relations[model]?.[relName];
          if (rel && relSpec === true) {
            const list = resolveRelation(rec, rel);
            out._count[relName] = Array.isArray(list) ? list.length : list ? 1 : 0;
          }
        }
        continue;
      }
      out[field] = projectRelation(rec, model, field, spec);
    }
  }

  return out;
}

function projectRelation(rec: Record<string, any>, model: string, name: string, spec: any): any {
  const rel = relations[model]?.[name];
  if (!rel) return null;
  const value = resolveRelation(rec, rel);
  if (value == null) return null;

  if (rel.kind === "one") {
    return projectRecord(value as Record<string, any>, rel.to, spec === true ? {} : spec);
  }

  const list = value as Record<string, any>[];
  if (spec === true) return list.map((r) => ({ ...r }));
  let rows = list;
  if (spec?.where) rows = rows.filter((r) => whereMatch(r, rel.to, spec.where));
  if (spec?.orderBy) rows = sortRows(rows, spec.orderBy, rel.to);
  if (spec?.skip) rows = rows.slice(spec.skip);
  if (spec?.take) rows = rows.slice(0, spec.take);
  return rows.map((r) => projectRecord(r, rel.to, spec));
}

// ============ DATA WRITES ============

function applyScalarData(model: string, row: Record<string, any>, data: any) {
  for (const [k, v] of Object.entries(data) as [string, any][]) {
    if (isPlainObject(v)) {
      if (v.increment !== undefined) row[k] = (row[k] ?? 0) + v.increment;
      else if (v.decrement !== undefined) row[k] = (row[k] ?? 0) - v.decrement;
      else if (v.multiply !== undefined) row[k] = (row[k] ?? 0) * v.multiply;
      else if (v.divide !== undefined) row[k] = (row[k] ?? 0) / v.divide;
      else if (v.set !== undefined) row[k] = v.set;
      else row[k] = v;
      continue;
    }
    if (k === "id") continue;
    row[k] = v;
  }
  touchUpdated(model, row);
}

function insertRow(model: string, data: any): Record<string, any> {
  const row = applyDefaults(model, data);
  table(model).push(row);
  return row;
}

function handleNestedWrites(model: string, row: Record<string, any>, data: any) {
  for (const [relName, value] of Object.entries(data) as [string, any][]) {
    const rel = relations[model]?.[relName];
    if (!rel || !isPlainObject(value) || !("create" in value)) continue;

    if (rel.kind === "many") {
      const items = Array.isArray(value.create) ? value.create : [value.create];
      for (const item of items) insertRow(rel.to, { ...item, [rel.fk]: row.id });
      continue;
    }
    // to-one (1:1): $create$. On "this" the FK sits on our row, on "to" the
    // FK sits on the created child row and points back at us.
    if (rel.on === "this" || rel.on === undefined) {
      const child = insertRow(rel.to, value.create ?? {});
      row[rel.fk] = child.id;
    } else {
      insertRow(rel.to, { ...(value.create ?? {}), [rel.fk]: row.id });
    }
  }
}

// ============ CRUD ============

interface QueryArgs {
  where?: any;
  select?: any;
  include?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
}

function queryRows(model: string, where: any): Record<string, any>[] {
  if (!where) return table(model);
  return table(model).filter((r) => whereMatch(r, model, where));
}

function findUnique(model: string, args: QueryArgs) {
  const row = queryRows(model, args?.where)[0] ?? null;
  return row == null ? null : projectRecord(row, model, args);
}

function findFirst(model: string, args: QueryArgs) {
  let rows = queryRows(model, args?.where);
  if (args?.orderBy) rows = sortRows(rows, args.orderBy, model);
  const row = rows[0] ?? null;
  return row == null ? null : projectRecord(row, model, args);
}

function findMany(model: string, args: QueryArgs) {
  let rows = queryRows(model, args?.where);
  if (args?.orderBy) rows = sortRows(rows, args.orderBy, model);
  if (args?.skip) rows = rows.slice(args.skip);
  if (args?.take) rows = rows.slice(0, args.take);
  return rows.map((r) => projectRecord(r, model, args));
}

function count(model: string, args: { where?: any }) {
  return queryRows(model, args?.where).length;
}

function aggregate(model: string, args: any) {
  const rows = queryRows(model, args?.where);
  const out: Record<string, any> = {};
  if (args?._sum) {
    out._sum = {};
    for (const field of Object.keys(args._sum)) {
      out._sum[field] = rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    }
  }
  if (args?._count) {
    out._count = {};
    if (args._count._all) out._count._all = rows.length;
    for (const field of Object.keys(args._count)) {
      if (field === "_all") continue;
      if (args._count[field] === true) out._count[field] = rows.length;
    }
  }
  if (args?._avg) {
    out._avg = {};
    for (const field of Object.keys(args._avg)) {
      const sum = rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
      out._avg[field] = rows.length ? sum / rows.length : 0;
    }
  }
  if (args?._min) {
    out._min = {};
    for (const field of Object.keys(args._min)) {
      const vals = rows.map((r) => r[field]).filter((v) => v != null && !Number.isNaN(v));
      out._min[field] = vals.length ? Math.min(...vals) : 0;
    }
  }
  if (args?._max) {
    out._max = {};
    for (const field of Object.keys(args._max)) {
      const vals = rows.map((r) => r[field]).filter((v) => v != null && !Number.isNaN(v));
      out._max[field] = vals.length ? Math.max(...vals) : 0;
    }
  }
  return out;
}

function create(model: string, args: { data: any; include?: any }) {
  const row = applyDefaults(model, args?.data || {});
  handleNestedWrites(model, row, args?.data || {});
  table(model).push(row);
  return projectRecord(row, model, { include: args?.include });
}

function createMany(model: string, args: { data: any[] }) {
  let count = 0;
  for (const item of args?.data || []) {
    insertRow(model, item);
    count += 1;
  }
  return { count };
}

function update(model: string, args: { where: any; data: any; include?: any }) {
  const row = queryRows(model, args?.where)[0];
  if (!row) return null;
  applyScalarData(model, row, args.data || {});
  return projectRecord(row, model, { include: args?.include });
}

function updateMany(model: string, args: { where: any; data: any }) {
  const rows = queryRows(model, args?.where);
  for (const r of rows) applyScalarData(model, r, args.data || {});
  return { count: rows.length };
}

function upsert(model: string, args: { where: any; create: any; update: any }) {
  const existing = queryRows(model, args?.where)[0];
  if (existing) {
    applyScalarData(model, existing, args?.update ?? {});
    return existing;
  }
  return create(model, { data: args?.create ?? {} });
}

function deleteOne(model: string, args: { where: any }) {
  const rows = table(model);
  const idx = rows.findIndex((r) => whereMatch(r, model, args?.where));
  if (idx === -1) return null;
  const [row] = rows.splice(idx, 1);
  return row ?? null;
}

function deleteMany(model: string, args: { where: any }) {
  const rows = table(model);
  const keep = rows.filter((r) => !whereMatch(r, model, args?.where));
  const removed = rows.length - keep.length;
  tables.set(model, keep);
  return { count: removed };
}

// ============ db FACADE ============

interface StoreModel {
  findUnique(args?: QueryArgs): Record<string, any> | null;
  findFirst(args?: QueryArgs): Record<string, any> | null;
  findMany(args?: QueryArgs): Record<string, any>[];
  create(args: { data: any; include?: any }): Record<string, any>;
  createMany(args: { data: any[] }): { count: number };
  update(args: { where: any; data: any; include?: any }): Record<string, any> | null;
  updateMany(args: { where: any; data: any }): { count: number };
  upsert(args: { where: any; create: any; update: any }): Record<string, any>;
  delete(args: { where: any }): Record<string, any> | null;
  deleteMany(args: { where: any }): { count: number };
  count(args?: { where?: any }): number;
  aggregate(args: any): Record<string, any>;
}

const db: Record<string, StoreModel> = {};

// Model keys are PascalCase internally; callers use Prisma-style camelCase
// accessors (db.researchPaper, db.paperPurchase, ...).
function camel(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

for (const model of Object.keys(relations)) {
  db[camel(model)] = {
    findUnique: (args: QueryArgs) => findUnique(model, args),
    findFirst: (args: QueryArgs) => findFirst(model, args),
    findMany: (args: QueryArgs) => findMany(model, args),
    create: (args: any) => create(model, args),
    createMany: (args: any) => createMany(model, args),
    update: (args: any) => update(model, args),
    updateMany: (args: any) => updateMany(model, args),
    upsert: (args: any) => upsert(model, args),
    delete: (args: any) => deleteOne(model, args),
    deleteMany: (args: any) => deleteMany(model, args),
    count: (args: any) => count(model, args),
    aggregate: (args: any) => aggregate(model, args),
  };
}

// ============ SEED DEMO DATA ============

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

let seeded = false;

function seed() {
  if (seeded) return;
  seeded = true;

  // --- research areas ---
  const areaSpecs: [string, string][] = [
    ["Computer Science", "computer-science"],
    ["Artificial Intelligence", "artificial-intelligence"],
    ["Machine Learning", "machine-learning"],
    ["Data Science", "data-science"],
    ["Mathematics", "mathematics"],
    ["Physics", "physics"],
    ["Chemistry", "chemistry"],
    ["Biology", "biology"],
    ["Economics", "economics"],
    ["Business Administration", "business-administration"],
    ["Electrical Engineering", "electrical-engineering"],
    ["Mechanical Engineering", "mechanical-engineering"],
    ["Civil Engineering", "civil-engineering"],
    ["Medicine", "medicine"],
    ["Psychology", "psychology"],
    ["Sociology", "sociology"],
    ["Education", "education"],
    ["Linguistics", "linguistics"],
    ["Environmental Science", "environmental-science"],
    ["Biotechnology", "biotechnology"],
  ];
  const areas: Record<string, string> = {}; // name -> id
  areaSpecs.forEach(([name, slug], i) => {
    const row = insertRow("ResearchArea", {
      name,
      slug,
      description: `${name} research published on Acadexa.`,
      icon: null,
      color: null,
      createdAt: daysAgo(120 - i),
      isSeed: true,
    });
    areas[name] = row.id;
  });

  // --- universities ---
  const uniSpecs: [string, string, string, string][] = [
    ["National University of Sciences & Technology (NUST)", "nust", "Pakistan", "Islamabad"],
    ["University of the Punjab", "university-of-the-punjab", "Pakistan", "Lahore"],
    ["Lahore University of Management Sciences (LUMS)", "lums", "Pakistan", "Lahore"],
    ["COMSATS University Islamabad", "comsats-university-islamabad", "Pakistan", "Islamabad"],
    ["Bahria University", "bahria-university", "Pakistan", "Karachi"],
    ["Stanford University", "stanford-university", "United States", "Stanford"],
    ["University of Oxford", "university-of-oxford", "United Kingdom", "Oxford"],
    ["University of Cambridge", "university-of-cambridge", "United Kingdom", "Cambridge"],
  ];
  const unis: Record<string, string> = {}; // slug -> id
  for (const [name, slug, country, city] of uniSpecs) {
    const row = insertRow("University", {
      name,
      slug,
      country,
      city,
      website: null,
      description: `${name} — featured academic institution.`,
      logoUrl: null,
      address: null,
      verified: true,
      createdAt: daysAgo(100),
      updatedAt: daysAgo(100),
      isSeed: true,
    });
    unis[slug] = row.id;
  }

  // --- departments ---
  const deptSpecs: [string, string][] = [
    ["Computer Science", "computer-science"],
    ["Mathematics", "mathematics"],
    ["Physics", "physics"],
    ["Electrical Engineering", "electrical-engineering"],
    ["Economics", "economics"],
    ["Business Administration", "business-administration"],
  ];
  const departments: Record<string, string> = {};
  for (const [name, slug] of deptSpecs) {
    const row = insertRow("Department", { name, slug, description: `${name} department.`, createdAt: daysAgo(90), updatedAt: daysAgo(90) });
    departments[slug] = row.id;
  }

  const linkDept = (uniSlug: string, deptSlug: string) =>
    insertRow("UniversityDepartment", { universityId: unis[uniSlug], departmentId: departments[deptSlug] });
  linkDept("nust", "computer-science");
  linkDept("nust", "physics");
  linkDept("lums", "economics");
  linkDept("lums", "business-administration");
  linkDept("comsats-university-islamabad", "computer-science");

  // --- users ---
  const PASSWORD = bcrypt.hashSync("Password123!", 12);

  function seedUser(overrides: Record<string, any> & { name: string; email: string; role: Role }) {
    return insertRow("User", {
      emailVerified: new Date(),
      passwordHash: PASSWORD,
      bio: null,
      location: null,
      phone: null,
      title: null,
      designation: overrides.role === "ADMIN" ? "Administrator" : overrides.role === "TEACHER" ? "Professor" : "Research Associate",
      departmentId: null,
      lastActiveAt: daysAgo(1),
      isDemo: false,
      isSeed: true,
      avatarUrl: null,
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      createdAt: daysAgo(60),
      updatedAt: daysAgo(1),
      ...overrides,
    });
  }

  const admin = seedUser({ name: "Dr. Ayesha Khan", email: "admin@acadexa.com", role: "ADMIN", adminRole: "SUPER_ADMIN" });
  const teacher = seedUser({ name: "Prof. Muhammad Ali", email: "teacher@acadexa.com", role: "TEACHER", designation: "Professor", departmentId: departments["computer-science"] });
  const researcher = seedUser({ name: "Sara Ahmed", email: "researcher@acadexa.com", role: "RESEARCHER", designation: "Research Associate", departmentId: departments["computer-science"] });
  const student = seedUser({ name: "Bilal Hussain", email: "student@acadexa.com", role: "STUDENT" });
  const researcher2 = seedUser({ name: "Dr. Fatima Noor", email: "fatima@acadexa.com", role: "RESEARCHER", designation: "Assistant Professor" });
  const researcher3 = seedUser({ name: "Omar Farooq", email: "omar@acadexa.com", role: "RESEARCHER", designation: "PhD Candidate" });
  const teacher2 = seedUser({ name: "Dr. Hira Shah", email: "hira@acadexa.com", role: "TEACHER", designation: "Senior Lecturer" });

  // --- profiles / researcher profiles ---
  const profileFor = (u: Record<string, any>) =>
    insertRow("Profile", { userId: u.id, phone: null, website: null, country: "Pakistan", city: "Islamabad", address: null, headline: u.designation, bio: `${u.name} is an active member of the Acadexa academic community.`, skills: null, profileCompletion: 80, views: 0, aboutUs: null, createdAt: daysAgo(50), updatedAt: daysAgo(5) });

  profileFor(admin);
  profileFor(teacher);
  profileFor(researcher);
  profileFor(student);

  const researcherProfileFor = (u: Record<string, any>, uniSlug: string, publications: number, citations: number) =>
    insertRow("ResearcherProfile", {
      userId: u.id,
      universityId: uniSlug ? unis[uniSlug] : null,
      departmentId: departments["computer-science"],
      designation: u.designation,
      experienceYears: 5,
      bio: `${u.name} focuses on applied research.`,
      researchFocus: "Machine Learning and Data Science",
      citations,
      publications,
      verified: true,
      whatsappNumber: null,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(4),
    });

  researcherProfileFor(teacher, "nust", 12, 92);
  researcherProfileFor(researcher, "comsats-university-islamabad", 8, 60);
  researcherProfileFor(researcher2, "lums", 15, 140);
  researcherProfileFor(researcher3, "bahria-university", 4, 18);

  const interest = (u: Record<string, any>, areaName: string) =>
    insertRow("UserResearchInterest", { userId: u.id, researchAreaId: areas[areaName] });
  interest(researcher, "Artificial Intelligence");
  interest(researcher, "Machine Learning");
  interest(researcher2, "Economics");
  interest(researcher2, "Data Science");
  interest(teacher, "Computer Science");
  interest(student, "Mathematics");

  // --- papers ---
  const paperSpecs: Record<string, any>[] = [
    {
      title: "Attention Mechanisms in Transformer-Based Language Models",
      abstract: "We present a comprehensive analysis of attention mechanisms used in modern transformer architectures, covering efficiency trade-offs and applications to long-context understanding.",
      researchField: "Natural Language Processing",
      publicationType: "Journal Article",
      journal: "Journal of Computational Linguistics",
      price: 800, accessType: "PAID", citations: 41, views: 320, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(30), keywords: '["transformers","attention","NLP"]',
      uploader: researcher, university: "comsats-university-islamabad",
    },
    {
      title: "A Survey of Deep Learning for Medical Image Segmentation",
      abstract: "This survey reviews the landscape of deep learning approaches for medical image segmentation, including U-Nets, attention, and self-supervised pretraining strategies.",
      researchField: "Medical Imaging",
      publicationType: "Journal Article",
      journal: "IEEE Transactions on Medical Imaging",
      price: null, accessType: "FREE", citations: 88, views: 540, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(45), keywords: '["deep learning","segmentation","medical imaging"]',
      uploader: researcher2, university: "lums",
    },
    {
      title: "Energy-Efficient Scheduling in Heterogeneous Edge Cloud Systems",
      abstract: "We propose novel scheduling heuristics for energy-efficient execution of distributed workloads across heterogeneous edge and cloud nodes.",
      researchField: "Distributed Systems",
      publicationType: "Conference Paper",
      conference: "IEEE International Conference on Edge Computing",
      price: 1200, accessType: "PAID", citations: 12, views: 210, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(20), keywords: '["edge computing","scheduling","energy"]',
      uploader: teacher, university: "nust",
    },
    {
      title: "Graph Neural Networks for Link Prediction in Scholarly Networks",
      abstract: "We evaluate graph neural network architectures for predicting co-authorship and citation links in large scholarly collaboration graphs.",
      researchField: "Graph Learning",
      publicationType: "Conference Paper",
      conference: "International Conference on Web Search and Data Mining",
      price: null, accessType: "FREE", citations: 64, views: 430, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(60), keywords: '["GNN","link prediction"]',
      uploader: researcher3, university: "bahria-university",
    },
    {
      title: "Federated Learning with Differential Privacy: A Practical Guide",
      abstract: "We analyze practical considerations for deploying differentially private federated learning in production, including clipping, noise calibration, and fairness.",
      researchField: "Privacy",
      publicationType: "Journal Article",
      journal: "ACM Transactions on Privacy",
      price: 950, accessType: "PAID", citations: 27, views: 260, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(15), keywords: '["federated learning","privacy","differential privacy"]',
      uploader: researcher, university: "comsats-university-islamabad",
    },
    {
      title: "The Role of Microfinance in Women's Economic Empowerment",
      abstract: "A longitudinal study examining the impact of microfinance interventions on women's entrepreneurial activity and household welfare in South Asia.",
      researchField: "Development Economics",
      publicationType: "Journal Article",
      journal: "Journal of Development Economics",
      price: null, accessType: "FREE", citations: 33, views: 180, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(75), keywords: '["microfinance","empowerment","economics"]',
      uploader: researcher2, university: "lums",
    },
    {
      title: "Quantum-Inspired Optimization for Combinatorial Problems",
      abstract: "We benchmark quantum-inspired heuristics on classic combinatorial optimization benchmarks and report speed-quality trade-offs over classical solvers.",
      researchField: "Optimization",
      publicationType: "Preprint",
      price: null, accessType: "FREE", citations: 9, views: 150, isAuthorized: false, needsPermission: false,
      status: "PENDING_REVIEW", publicationDate: daysAgo(6), keywords: '["quantum computing","optimization"]',
      uploader: researcher3, university: "bahria-university",
    },
    {
      title: "Reducing Carbon Footprint of Data Centers with Renewable-Aware Scheduling",
      abstract: "We present a carbon-aware scheduler that shifts compute to times and regions with cleaner energy, cutting data center emissions by up to 30% in simulation.",
      researchField: "Green Computing",
      publicationType: "Conference Paper",
      conference: "ACM International Conference on Future Energy Systems",
      price: 700, accessType: "PAID", citations: 15, views: 130, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(10), keywords: '["carbon","data centers","scheduling"]',
      uploader: teacher, university: "nust",
    },
    {
      title: "Towards Explainable AI in Automated Essay Scoring",
      abstract: "We investigate attention-based explanations for automated essay scoring models and their agreement with human rubric-based judgements.",
      researchField: "Educational Technology",
      publicationType: "Journal Article",
      journal: "Computers & Education",
      price: null, accessType: "FREE", citations: 21, views: 240, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(50), keywords: '["XAI","essay scoring","education"]',
      uploader: teacher2, university: null,
    },
    {
      title: "A Benchmark Suite for Low-Resource Code-Switched NLP",
      abstract: "We release a multilingual benchmark for code-switched text and evaluate existing models, highlighting a significant performance gap for low-resource pairs.",
      researchField: "Multilingual NLP",
      publicationType: "Conference Paper",
      conference: "Annual Meeting of the Association for Computational Linguistics",
      price: 500, accessType: "PAID", citations: 7, views: 95, isAuthorized: true, needsPermission: false,
      status: "APPROVED", publicationDate: daysAgo(8), keywords: '["code-switching","benchmark","NLP"]',
      uploader: researcher, university: "comsats-university-islamabad",
    },
    {
      title: "Predicting Student Attrition Using Learning Analytics",
      abstract: "Using institutional learning-management-system logs, we build early-warning models that flag at-risk students one semester in advance.",
      researchField: "Learning Analytics",
      publicationType: "Preprint",
      price: null, accessType: "FREE", citations: 4, views: 60, isAuthorized: false, needsPermission: false,
      status: "REJECTED", publicationDate: daysAgo(2), keywords: '["learning analytics","attrition"]',
      uploader: teacher2, university: null, rejectionReason: "Sample size below threshold; please expand the dataset and resubmit.",
    },
  ];

  const paperIds: string[] = [];
  paperSpecs.forEach((spec, i) => {
    const slugBase = slugifyTitle(spec.title);
    const row = insertRow("ResearchPaper", {
      slug: `${slugBase}-${i + 1}`,
      abstract: spec.abstract,
      keywords: spec.keywords ?? null,
      researchField: spec.researchField ?? null,
      publicationType: spec.publicationType ?? "Preprint",
      journal: spec.journal ?? null,
      conference: spec.conference ?? null,
      publisher: null,
      publicationDate: spec.publicationDate ?? null,
      doi: null,
      volume: null,
      issue: null,
      pages: null,
      citations: spec.citations ?? 0,
      views: spec.views ?? 0,
      externalUrl: null,
      pdfUrl: null,
      coverImageUrl: null,
      fileAssetId: null,
      price: spec.price ?? null,
      currency: "PKR",
      accessType: spec.accessType ?? "FREE",
      status: spec.status ?? "PENDING_REVIEW",
      rejectionReason: spec.rejectionReason ?? null,
      licenseType: null,
      needsPermission: spec.needsPermission ?? false,
      isAuthorized: spec.isAuthorized ?? false,
      categoryId: null,
      uploaderId: spec.uploader.id,
      universityId: spec.university ? unis[spec.university] : null,
      createdAt: daysAgo(80 - i * 5),
      updatedAt: daysAgo(80 - i * 5),
    });
    paperIds.push(row.id);
  });

  // authors
  const authorPaperIdx = [0, 1, 2, 3, 4, 7, 8];
  authorPaperIdx.forEach((idx) => {
    const paper = table("ResearchPaper")[table("ResearchPaper").findIndex((r) => r.id === paperIds[idx])];
    const uploader = table("User").find((u) => u.id === paper.uploaderId)!;
    insertRow("PaperAuthor", { paperId: paper.id, userId: uploader.id, name: uploader.name, email: uploader.email, affiliation: null, isPrimary: true, order: 0, createdAt: paper.createdAt });
  });
  insertRow("PaperAuthor", { paperId: paperIds[1], userId: researcher.id, name: researcher.name, email: researcher.email, affiliation: null, isPrimary: false, order: 1, createdAt: daysAgo(45) });
  insertRow("PaperAuthor", { paperId: paperIds[3], userId: researcher.id, name: researcher.name, email: researcher.email, affiliation: "Comsats University", isPrimary: false, order: 1, createdAt: daysAgo(60) });
  insertRow("PaperAuthor", { paperId: paperIds[7], userId: researcher3.id, name: researcher3.name, email: researcher3.email, affiliation: null, isPrimary: false, order: 1, createdAt: daysAgo(10) });

  // paper research areas
  const areaLink = (pid: string, areaName: string) =>
    insertRow("PaperResearchArea", { paperId: pid, researchAreaId: areas[areaName] });
  areaLink(paperIds[0], "Artificial Intelligence");
  areaLink(paperIds[0], "Machine Learning");
  areaLink(paperIds[1], "Machine Learning");
  areaLink(paperIds[1], "Data Science");
  areaLink(paperIds[2], "Computer Science");
  areaLink(paperIds[2], "Electrical Engineering");
  areaLink(paperIds[3], "Computer Science");
  areaLink(paperIds[4], "Artificial Intelligence");
  areaLink(paperIds[5], "Economics");
  areaLink(paperIds[6], "Physics");
  areaLink(paperIds[7], "Computer Science");
  areaLink(paperIds[8], "Education");
  areaLink(paperIds[9], "Artificial Intelligence");

  // categories + link papers
  insertRow("Category", { name: "Computer Science", slug: "computer-science", description: null, createdAt: daysAgo(80) });
  insertRow("Category", { name: "Life Sciences", slug: "life-sciences", description: null, createdAt: daysAgo(80) });
  const csCategory = table("Category").find((c) => c.slug === "computer-science")!;
  const csFields = ["computer science", "artificial intelligence", "machine learning", "data science", "electrical engineering", "nlp", "graph learning", "privacy", "green computing", "optimization", "xai", "multilingual nlp"];
  for (const pid of paperIds) {
    const p = table("ResearchPaper").find((r) => r.id === pid)!;
    const field = (p.researchField ?? "").toLowerCase();
    if (csFields.some((f) => field.includes(f))) p.categoryId = csCategory.id;
  }

  // purchases + payments + access for a paid paper
  const paidPaper = table("ResearchPaper").find((r) => r.accessType === "PAID" && r.status === "APPROVED")!;
  const platformFee = Math.round(paidPaper.price * 0.1 * 100) / 100;
  const sellerAmount = Math.round(paidPaper.price * 0.9 * 100) / 100;
  const purchase = insertRow("PaperPurchase", {
    buyerId: student.id,
    paperId: paidPaper.id,
    amount: paidPaper.price,
    currency: "PKR",
    platformFee,
    sellerAmount,
    status: "SUCCESSFUL",
    accessStatus: "GRANTED",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  });
  const payment = insertRow("Payment", {
    purchaseId: purchase.id,
    userId: student.id,
    amount: paidPaper.price,
    currency: "PKR",
    provider: "MOCK",
    providerTransactionId: "mock_ses_seed_example",
    status: "SUCCESSFUL",
    platformFee,
    sellerAmount,
    paymentMethod: null,
    rawPayload: null,
    paidAt: daysAgo(12),
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  });
  insertRow("PaperAccess", { purchaseId: purchase.id, userId: student.id, paperId: paidPaper.id, accessToken: "seed_access_token_example", grantedAt: daysAgo(12), expiresAt: null, revokedAt: null });
  insertRow("Earning", { userId: paidPaper.uploaderId, paymentId: payment.id, paperId: paidPaper.id, purchaseId: purchase.id, grossAmount: paidPaper.price, platformFee, sellerAmount, status: "COMPLETED", createdAt: daysAgo(12), updatedAt: daysAgo(12) });

  // call request
  insertRow("CallRequest", { requesterId: student.id, researcherId: researcher.id, name: "Bilal Hussain", email: "student@acadexa.com", phone: "+92-300-1234567", reason: "Discussing research collaboration on NLP topics", preferredDate: daysAgo(-3), preferredTime: "14:00", message: null, status: "ACCEPTED", rescheduledDate: null, createdAt: daysAgo(9), updatedAt: daysAgo(8) });

  // collaborations
  const collab1 = insertRow("ResearchCollaboration", {
    userId: researcher.id,
    title: "Join our ML4Health research group",
    description: "Looking for researchers interested in applying machine learning to public health datasets.",
    researchField: "Machine Learning",
    requiredSkills: "Python, PyTorch",
    location: "Islamabad, Pakistan",
    remote: true,
    deadline: daysAgo(-20),
    status: "OPEN",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  });
  insertRow("CollaborationRequest", { collaborationId: collab1.id, requesterId: researcher3.id, message: "I would love to contribute to the ML4Health group.", status: "PENDING", createdAt: daysAgo(6), updatedAt: daysAgo(6) });
  insertRow("ResearchCollaboration", {
    userId: researcher2.id,
    title: "Economics of education dataset curation",
    description: "Collaboration opportunity for economists to build and annotate a panel dataset on educational outcomes.",
    researchField: "Economics",
    requiredSkills: "Stata, R",
    location: "Lahore, Pakistan",
    remote: false,
    deadline: daysAgo(-10),
    status: "OPEN",
    createdAt: daysAgo(25),
    updatedAt: daysAgo(4),
  });

  // settings
  insertRow("PlatformSetting", { key: "platform_commission", value: "10", description: "Default platform commission percentage for paid papers.", updatedAt: daysAgo(100) });
  insertRow("PlatformSetting", { key: "site_name", value: "Acadexa", description: "Public site name.", updatedAt: daysAgo(100) });
  insertRow("PlatformSetting", { key: "support_email", value: "support@acadexa.local", description: "Support contact email.", updatedAt: daysAgo(100) });

  // verification request
  insertRow("VerificationRequest", { userId: researcher.id, universityName: "COMSATS University Islamabad", departmentName: "Computer Science", designation: "Research Associate", evidence: null, status: "VERIFIED", adminMessage: null, decidedBy: admin.id, decidedAt: daysAgo(20), createdAt: daysAgo(25), updatedAt: daysAgo(20) });

  // admin notification
  insertRow("AdminNotification", { senderId: admin.id, title: "Welcome to Acadexa Admin", message: "Pending papers and reports are visible on the dashboard.", audience: "ADMIN", universityId: null, priority: "LOW", createdAt: daysAgo(60) });

  // notifications
  insertRow("Notification", { userId: researcher.id, type: "PAPER_APPROVED", title: "Paper approved", message: "Your paper was approved and is now public.", link: "/dashboard/papers", read: false, priority: "MEDIUM", createdAt: daysAgo(12) });
  insertRow("Notification", { userId: student.id, type: "PURCHASE", title: "Purchase confirmed", message: `You now have access to "${paidPaper.title}".`, link: "/dashboard/purchases", read: false, priority: "MEDIUM", createdAt: daysAgo(12) });

  // audit log
  insertRow("AuditLog", { actorId: admin.id, action: "LOGIN", entityType: "User", entityId: admin.id, before: null, after: null, ip: null, metadata: null, createdAt: daysAgo(1) });

  // report
  insertRow("Report", { reporterId: student.id, reportedUserId: null, paperId: paperIds[6], conversationId: null, collaborationId: null, category: "OTHER", description: "This preprint appears to be a duplicate of a published article.", status: "OPEN", assignedTo: null, resolutionNotes: null, createdAt: daysAgo(3), updatedAt: daysAgo(3) });

  // seeded conversation between student and researcher
  const conv = insertRow("Conversation", { createdAt: daysAgo(7), updatedAt: daysAgo(2), lastMessageAt: daysAgo(2) });
  insertRow("ConversationMember", { conversationId: conv.id, userId: student.id, unreadCount: 0, blocked: false, joinedAt: daysAgo(7) });
  insertRow("ConversationMember", { conversationId: conv.id, userId: researcher.id, unreadCount: 1, blocked: false, joinedAt: daysAgo(7) });
  insertRow("Message", { conversationId: conv.id, senderId: student.id, content: "Hi Sara! I found your survey on medical image segmentation very useful.", read: true, readAt: daysAgo(6), createdAt: daysAgo(6) });
  insertRow("Message", { conversationId: conv.id, senderId: researcher.id, content: "Thanks Bilal! Happy to discuss any questions.", read: false, readAt: null, createdAt: daysAgo(2) });
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

seed();

export { db };

// Re-export the local schema types so callers keep the same import shape
// they previously used (e.g. `import type { Role } from "@/lib/db-types"`).
export * from "@/lib/db-types";

// Ensure the local uploads directory exists (independent of any database).
try {
  const dir = process.env.STORAGE_PATH || path.join(process.cwd(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
} catch {
  // ignore
}