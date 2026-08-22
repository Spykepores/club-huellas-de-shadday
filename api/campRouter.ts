import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { groups, members, achievements, achievementTypes, photoLikes, profileComments, memberPosts, postLikes, clubEvents, resources, songs, songFiles, resourceFiles, eventRsvps, songLikes, chatMessages, chatPresence, chatReads } from "@db/schema";
import { execFile } from "node:child_process";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
import { eq, desc, asc, sql, and, or, isNull, gt } from "drizzle-orm";

// Álbum de fotos del perfil (estilo Facebook)
export type Album = { title: string; photos: string[] };

// Normaliza la galería: el formato antiguo era una lista plana de fotos;
// el nuevo formato es una lista de álbumes { title, photos }.
function parseAlbums(raw: string | null): Album[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (parsed.every((p) => typeof p === "string")) {
      return parsed.length > 0 ? [{ title: "Mis Fotos", photos: parsed }] : [];
    }
    return parsed
      .filter((a) => a && typeof a.title === "string" && Array.isArray(a.photos))
      .map((a) => ({ title: String(a.title).slice(0, 60), photos: a.photos.filter((p: unknown) => typeof p === "string") }));
  } catch {
    return [];
  }
}

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeCode(prefix: string) {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `${prefix}-${s}`;
}

async function uniqueCode(table: "groups" | "members", prefix: string) {
  const db = getDb();
  for (let i = 0; i < 10; i++) {
    const code = makeCode(prefix);
    const found =
      table === "groups"
        ? await db.select({ id: groups.id }).from(groups).where(eq(groups.code, code)).limit(1)
        : await db.select({ id: members.id }).from(members).where(eq(members.profileCode, code)).limit(1);
    if (found.length === 0) return code;
  }
  return makeCode(prefix) + "X";
}

const registerInput = z.object({
  fullName: z.string().min(3).max(200),
  documentId: z.string().max(40).optional().default(""),
  birthDate: z.string().max(10).optional().default(""),
  phone: z.string().min(5).max(40),
  email: z.string().email().max(320).optional().or(z.literal("")).default(""),
  address: z.string().max(255).optional().default(""),
  eps: z.string().max(120).optional().default(""),
  bloodType: z.string().max(5).optional().default(""),
  allergies: z.string().optional().default(""),
  medications: z.string().optional().default(""),
  medicalConditions: z.string().optional().default(""),
  emergencyContactName: z.string().max(200).optional().default(""),
  emergencyContactPhone: z.string().max(40).optional().default(""),
  groupMode: z.enum(["create", "join"]),
  groupName: z.string().max(120).optional().default(""),
  groupCode: z.string().max(12).optional().default(""),
});

export const campRouter = createRouter({
  // ---------- PÚBLICO ----------

  groupRanking: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: groups.id,
        name: groups.name,
        code: groups.code,
        points: groups.points,
        memberCount: sql<number>`(select count(*) from \`members\` where \`members\`.\`groupId\` = \`groups\`.\`id\`)`,
      })
      .from(groups)
      .orderBy(desc(groups.points));
    rows.sort((a, b) => b.points - a.points || Number(b.memberCount) - Number(a.memberCount));
    return rows;
  }),

  memberRanking: authedQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: members.id,
        fullName: members.fullName,
        points: members.points,
        profileCode: members.profileCode,
        groupName: groups.name,
      })
      .from(members)
      .leftJoin(groups, eq(members.groupId, groups.id))
      .orderBy(desc(members.points))
      .limit(20);
  }),

  register: authedQuery.input(registerInput).mutation(async ({ ctx, input }) => {
    const db = getDb();

    // Si ya tiene una cuenta vinculada, no duplicar el registro
    if (ctx.user) {
      const existing = await db.select({ id: members.id, profileCode: members.profileCode })
        .from(members).where(eq(members.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Tu cuenta ya tiene un registro (código ${existing[0].profileCode}). Encuéntralo en "Mi Perfil".`,
        });
      }
    }

    let groupId: number | null = null;
    let groupCode: string | null = null;

    if (input.groupMode === "create") {
      if (!input.groupName || input.groupName.trim().length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Escribe el nombre de tu grupo." });
      }
      groupCode = await uniqueCode("groups", "SHD");
      const [{ id }] = await db
        .insert(groups)
        .values({ name: input.groupName.trim(), code: groupCode, points: 0 })
        .$returningId();
      groupId = id;
    } else {
      const code = (input.groupCode || "").trim().toUpperCase();
      const [g] = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
      if (!g) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Código de grupo no encontrado. Verifica con tu compañero." });
      }
      groupId = g.id;
      groupCode = g.code;
    }

    const profileCode = await uniqueCode("members", "HD");
    const [{ id: memberId }] = await db
      .insert(members)
      .values({
        profileCode,
        groupId,
        userId: ctx.user?.id ?? null,
        fullName: input.fullName.trim(),
        documentId: input.documentId,
        birthDate: input.birthDate,
        phone: input.phone,
        email: input.email,
        address: input.address,
        eps: input.eps,
        bloodType: input.bloodType,
        allergies: input.allergies,
        medications: input.medications,
        medicalConditions: input.medicalConditions,
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
        points: 0,
      })
      .$returningId();

    return { memberId, profileCode, groupCode, groupId };
  }),

  profile: authedQuery
    .input(z.object({ code: z.string().min(4).max(12) }))
    .query(async ({ input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const [m] = await db.select().from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado." });

      const [g] = m.groupId
        ? await db.select().from(groups).where(eq(groups.id, m.groupId)).limit(1)
        : [null];

      const ach = await db
        .select({
          id: achievements.id,
          title: achievements.title,
          description: achievements.description,
          points: achievements.points,
          awardedAt: achievements.awardedAt,
          cover: achievementTypes.cover,
        })
        .from(achievements)
        .leftJoin(achievementTypes, eq(achievements.typeId, achievementTypes.id))
        .where(eq(achievements.memberId, m.id))
        .orderBy(desc(achievements.awardedAt));

      const [{ rank }] = await db
        .select({ rank: sql<number>`(select count(*) + 1 from ${members} m2 where m2.points > ${m.points})` })
        .from(members)
        .where(eq(members.id, m.id))
        .limit(1);

      return {
        member: {
          fullName: m.fullName,
          profileCode: m.profileCode,
          points: m.points,
          createdAt: m.createdAt,
          avatar: m.avatar,
          coverTheme: m.coverTheme,
          coverPhoto: m.coverPhoto,
          bio: m.bio,
          videoUrl: m.videoUrl,
          albums: parseAlbums(m.gallery),
        },
        group: g ? { name: g.name, points: g.points } : null,
        achievements: ach,
        rank: Number(rank) || 1,
      };
    }),

  // ---------- SOCIAL: EXPLORAR, LIKES Y COMENTARIOS ----------

  directory: authedQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: members.id,
        fullName: members.fullName,
        avatar: members.avatar,
        profileCode: members.profileCode,
        points: members.points,
        coverTheme: members.coverTheme,
        groupName: groups.name,
      })
      .from(members)
      .leftJoin(groups, eq(members.groupId, groups.id))
      .orderBy(desc(members.points));
  }),

  photoLikes: authedQuery
    .input(z.object({ code: z.string().min(4).max(12) }))
    .query(async ({ input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado." });
      const rows = await db
        .select({ photoIndex: photoLikes.photoIndex, count: sql<number>`count(*)` })
        .from(photoLikes)
        .where(eq(photoLikes.memberId, m.id))
        .groupBy(photoLikes.photoIndex);
      const map: Record<number, number> = {};
      rows.forEach((r) => { map[r.photoIndex] = Number(r.count); });
      return map;
    }),

  likePhoto: authedQuery
    .input(z.object({ code: z.string().min(4).max(12), photoIndex: z.number().int().min(0).max(100000) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado." });
      await db.insert(photoLikes).values({ memberId: m.id, photoIndex: input.photoIndex });
      return { ok: true };
    }),

  comments: authedQuery
    .input(z.object({ code: z.string().min(4).max(12) }))
    .query(async ({ input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado." });
      return db
        .select()
        .from(profileComments)
        .where(eq(profileComments.memberId, m.id))
        .orderBy(desc(profileComments.createdAt))
        .limit(30);
    }),

  addComment: authedQuery
    .input(
      z.object({
        code: z.string().min(4).max(12),
        authorName: z.string().max(80).optional().default(""),
        body: z.string().min(1).max(300),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado." });

      // Si el visitante tiene sesión con perfil vinculado, su nombre se pone solo
      let authorName = input.authorName.trim();
      let authorCode: string | null = null;
      let authorAvatar: string | null = null;
      if (ctx.user) {
        const [me] = await db
          .select({ fullName: members.fullName, profileCode: members.profileCode, avatar: members.avatar })
          .from(members)
          .where(eq(members.userId, ctx.user.id))
          .limit(1);
        if (me) {
          authorName = me.fullName;
          authorCode = me.profileCode;
          authorAvatar = me.avatar;
        }
      }
      if (authorName.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Escribe tu nombre para comentar." });
      }

      await db.insert(profileComments).values({
        memberId: m.id,
        authorName,
        authorCode,
        authorAvatar,
        body: input.body.trim(),
      });
      return { ok: true };
    }),

  // El administrador o el DUEÑO del perfil pueden eliminar comentarios
  deleteComment: authedQuery
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [c] = await db.select().from(profileComments).where(eq(profileComments.id, input.commentId)).limit(1);
      if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Comentario no encontrado." });
      if (ctx.user.role !== "admin") {
        const [me] = await db.select({ id: members.id }).from(members).where(eq(members.userId, ctx.user.id)).limit(1);
        if (!me || me.id !== c.memberId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo puedes borrar comentarios de tu propio perfil." });
        }
      }
      await db.delete(profileComments).where(eq(profileComments.id, input.commentId));
      return { ok: true };
    }),

  // ---------- PUBLICACIONES DEL PERFIL (MURO) ----------

  posts: authedQuery
    .input(z.object({ code: z.string().min(4).max(12) }))
    .query(async ({ input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado." });
      return db
        .select()
        .from(memberPosts)
        .where(eq(memberPosts.memberId, m.id))
        .orderBy(desc(memberPosts.createdAt))
        .limit(50);
    }),

  addPost: authedQuery
    .input(
      z.object({
        body: z.string().min(1).max(500),
        photo: z.string().max(400_000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [m] = await db
        .select({ id: members.id, avatar: members.avatar })
        .from(members)
        .where(eq(members.userId, ctx.user.id))
        .limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Primero completa tu inscripción." });
      await db.insert(memberPosts).values({
        memberId: m.id,
        body: input.body.trim(),
        photo: input.photo ?? null,
        authorAvatar: m.avatar,
      });
      return { ok: true };
    }),

  deletePost: authedQuery
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [post] = await db.select().from(memberPosts).where(eq(memberPosts.id, input.postId)).limit(1);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Publicación no encontrada." });
      if (ctx.user.role !== "admin") {
        const [m] = await db.select({ id: members.id }).from(members).where(eq(members.userId, ctx.user.id)).limit(1);
        if (!m || m.id !== post.memberId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo puedes borrar tus propias publicaciones." });
        }
      }
      await db.delete(memberPosts).where(eq(memberPosts.id, input.postId));
      await db.delete(postLikes).where(eq(postLikes.postId, input.postId));
      return { ok: true };
    }),

  postLikes: authedQuery
    .input(z.object({ code: z.string().min(4).max(12) }))
    .query(async ({ input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado." });
      const rows = await db
        .select({ postId: postLikes.postId, count: sql<number>`count(*)` })
        .from(postLikes)
        .innerJoin(memberPosts, eq(postLikes.postId, memberPosts.id))
        .where(eq(memberPosts.memberId, m.id))
        .groupBy(postLikes.postId);
      const map: Record<number, number> = {};
      rows.forEach((r) => { map[r.postId] = Number(r.count); });
      return map;
    }),

  likePost: authedQuery
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [p] = await db.select({ id: memberPosts.id }).from(memberPosts).where(eq(memberPosts.id, input.postId)).limit(1);
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Publicación no encontrada." });
      await db.insert(postLikes).values({ postId: input.postId });
      return { ok: true };
    }),

  // Actividad reciente del club: últimas publicaciones de todos los perfiles
  recentActivity: authedQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: memberPosts.id,
        body: memberPosts.body,
        photo: memberPosts.photo,
        authorAvatar: memberPosts.authorAvatar,
        createdAt: memberPosts.createdAt,
        authorName: members.fullName,
        authorCode: members.profileCode,
      })
      .from(memberPosts)
      .innerJoin(members, eq(memberPosts.memberId, members.id))
      .orderBy(desc(memberPosts.createdAt))
      .limit(12);
  }),

  // ---------- EVENTOS DEL CLUB ----------

  events: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(clubEvents).orderBy(desc(clubEvents.eventDate));
    if (rows.length === 0) return [];
    const rsvps = await db.select().from(eventRsvps);
    return rows.map((e) => {
      const list = rsvps.filter((r) => r.eventId === e.id);
      return {
        ...e,
        goingCount: list.length,
        viewerGoing: list.some((r) => r.userId === ctx.user.id),
        attendees: list.map((r) => r.name),
      };
    });
  }),

  // Confirmar / cancelar asistencia a un evento ("Asistiré")
  toggleRsvp: authedQuery
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [e] = await db.select().from(clubEvents).where(eq(clubEvents.id, input.eventId)).limit(1);
      if (!e) throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado." });

      const [existing] = await db
        .select()
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, input.eventId), eq(eventRsvps.userId, ctx.user.id)))
        .limit(1);

      if (existing) {
        await db.delete(eventRsvps).where(eq(eventRsvps.id, existing.id));
        return { going: false };
      }

      // Nombre visible: el del perfil vinculado si existe, si no el de la cuenta
      const [m] = await db.select().from(members).where(eq(members.userId, ctx.user.id)).limit(1);
      const name = (m?.fullName ?? ctx.user.name ?? "Conquistador").slice(0, 160);
      await db.insert(eventRsvps).values({ eventId: input.eventId, userId: ctx.user.id, name });
      return { going: true };
    }),

  createEvent: adminQuery
    .input(
      z.object({
        title: z.string().min(3).max(160),
        description: z.string().max(1000).optional().default(""),
        location: z.string().max(160).optional().default(""),
        category: z.enum(["Campamento", "Rally", "Especialidades", "Ceremonia", "Otro"]).default("Campamento"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(clubEvents).values({
        title: input.title.trim(),
        description: input.description.trim(),
        location: input.location.trim(),
        category: input.category,
        eventDate: new Date(`${input.date}T12:00:00`),
      });
      return { ok: true };
    }),

  deleteEvent: adminQuery
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(clubEvents).where(eq(clubEvents.id, input.eventId));
      await db.delete(eventRsvps).where(eq(eventRsvps.eventId, input.eventId));
      return { ok: true };
    }),

  // ---------- BIBLIOTECA DEL CLUB ----------

  resources: authedQuery.query(async () => {
    return getDb().select().from(resources).orderBy(desc(resources.createdAt));
  }),

  createResource: adminQuery
    .input(
      z.object({
        title: z.string().min(3).max(160),
        description: z.string().max(400).optional().default(""),
        category: z.enum(["Libros", "Especialidades", "Cartillas", "Materiales"]).default("Libros"),
        url: z.string().max(500).refine(
          (u) => /^https?:\/\//.test(u) || /^\/api\/resource-file\/\d+$/.test(u),
          { message: "Debe ser un enlace https:// o un archivo adjunto" },
        ),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(resources).values({
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        url: input.url.trim(),
      });
      return { ok: true };
    }),

  // Adjunta un archivo (PDF, Word, imágenes, zip…) y devuelve su URL interna
  uploadResourceFile: adminQuery
    .input(
      z.object({
        filename: z.string().min(1).max(200),
        dataBase64: z.string().max(28_000_000), // ~20 MB de archivo original
      }),
    )
    .mutation(async ({ input }) => {
      const raw = Buffer.from(input.dataBase64, "base64");
      if (raw.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El archivo llegó vacío." });
      }
      if (raw.length > 20 * 1024 * 1024) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "El archivo supera 20 MB." });
      }
      const ext = (input.filename.split(".").pop() || "").toLowerCase();
      const mime =
        ext === "pdf" ? "application/pdf"
        : ext === "doc" ? "application/msword"
        : ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : ext === "ppt" ? "application/vnd.ms-powerpoint"
        : ext === "pptx" ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        : ext === "xls" ? "application/vnd.ms-excel"
        : ext === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : ext === "zip" ? "application/zip"
        : ext === "png" ? "image/png"
        : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
        : ext === "txt" ? "text/plain; charset=utf-8"
        : "application/octet-stream";
      const [{ id }] = await getDb()
        .insert(resourceFiles)
        .values({ mime, filename: input.filename.slice(0, 200), data: raw.toString("base64") })
        .$returningId();
      return { fileId: id, url: `/api/resource-file/${id}`, sizeKb: Math.round(raw.length / 1024) };
    }),

  deleteResource: adminQuery
    .input(z.object({ resourceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [r] = await db.select().from(resources).where(eq(resources.id, input.resourceId)).limit(1);
      await db.delete(resources).where(eq(resources.id, input.resourceId));
      if (r) {
        const m = r.url.match(/^\/api\/resource-file\/(\d+)$/);
        if (m) await db.delete(resourceFiles).where(eq(resourceFiles.id, Number(m[1])));
      }
      return { ok: true };
    }),

  // ---------- MÚSICA DEL CLUB ----------

  songs: authedQuery.query(async () => {
    const db = getDb();
    const list = await db.select().from(songs).orderBy(desc(songs.createdAt));
    if (list.length === 0) return list;
    const likes = await db.select().from(songLikes);
    return list.map((s) => ({
      ...s,
      likeCount: likes.filter((l) => l.songId === s.id).length,
    }));
  }),

  // IDs de las canciones que el usuario marcó como favoritas (su playlist personal)
  mySongLikes: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb().select({ songId: songLikes.songId }).from(songLikes).where(eq(songLikes.userId, ctx.user.id));
    return rows.map((r) => r.songId);
  }),

  // Marcar / quitar "me gusta" en una canción (playlist personal del usuario)
  toggleSongLike: authedQuery
    .input(z.object({ songId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [s] = await db.select({ id: songs.id }).from(songs).where(eq(songs.id, input.songId)).limit(1);
      if (!s) throw new TRPCError({ code: "NOT_FOUND", message: "Canción no encontrada." });
      const [existing] = await db
        .select()
        .from(songLikes)
        .where(and(eq(songLikes.songId, input.songId), eq(songLikes.userId, ctx.user.id)))
        .limit(1);
      if (existing) {
        await db.delete(songLikes).where(eq(songLikes.id, existing.id));
        return { liked: false };
      }
      await db.insert(songLikes).values({ songId: input.songId, userId: ctx.user.id });
      return { liked: true };
    }),

  createSong: adminQuery
    .input(
      z.object({
        title: z.string().min(2).max(160),
        artist: z.string().max(160).optional().default(""),
        url: z.string().max(500).refine(
          (u) => /^https?:\/\//.test(u) || /^\/api\/song-file\/\d+$/.test(u),
          { message: "Debe ser un enlace https:// o un archivo subido" },
        ),
        cover: z.string().max(400_000).nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(songs).values({
        title: input.title.trim(),
        artist: input.artist.trim(),
        url: input.url.trim(),
        cover: input.cover ?? null,
      });
      return { ok: true };
    }),

  // Sube un archivo de audio: lo comprime a m4a (AAC 96k) para que pese poco y lo guarda
  uploadSongAudio: adminQuery
    .input(
      z.object({
        filename: z.string().max(200),
        dataBase64: z.string().max(40_000_000), // ~30 MB de archivo original
      }),
    )
    .mutation(async ({ input }) => {
      const raw = Buffer.from(input.dataBase64, "base64");
      if (raw.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El archivo llegó vacío." });
      }
      if (raw.length > 30 * 1024 * 1024) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "El archivo supera 30 MB." });
      }

      let data = raw;
      let mime = "audio/mp4";
      const tmpIn = `/tmp/song-${Date.now()}-in`;
      const tmpOut = `/tmp/song-${Date.now()}-out.m4a`;
      try {
        // Comprime cualquier formato (wav, mp3, ogg…) a AAC 96 kbps
        await writeFile(tmpIn, raw);
        await execFileAsync("ffmpeg", ["-y", "-i", tmpIn, "-vn", "-c:a", "aac", "-b:a", "96k", tmpOut], { timeout: 120000 });
        data = await readFile(tmpOut);
      } catch {
        // Si no se pudo comprimir (ej: sin ffmpeg), guarda el original con su tipo
        data = raw;
        const ext = (input.filename.split(".").pop() || "").toLowerCase();
        mime =
          ext === "mp3" ? "audio/mpeg"
          : ext === "wav" ? "audio/wav"
          : ext === "ogg" ? "audio/ogg"
          : ext === "m4a" || ext === "aac" ? "audio/mp4"
          : "application/octet-stream";
      } finally {
        await unlink(tmpIn).catch(() => {});
        await unlink(tmpOut).catch(() => {});
      }

      const [{ id }] = await getDb()
        .insert(songFiles)
        .values({ mime, data: data.toString("base64") })
        .$returningId();
      return { fileId: id, url: `/api/song-file/${id}`, sizeKb: Math.round(data.length / 1024) };
    }),

  deleteSong: adminQuery
    .input(z.object({ songId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [s] = await db.select().from(songs).where(eq(songs.id, input.songId)).limit(1);
      if (s) {
        const m = s.url.match(/^\/api\/song-file\/(\d+)$/);
        if (m) await db.delete(songFiles).where(eq(songFiles.id, Number(m[1])));
        await db.delete(songLikes).where(eq(songLikes.songId, input.songId));
        await db.delete(songs).where(eq(songs.id, input.songId));
      }
      return { ok: true };
    }),

  // ---------- CUENTA DEL CONQUISTADOR ----------

  myProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [m] = await db.select().from(members).where(eq(members.userId, ctx.user.id)).limit(1);
    if (!m) return null;

    const [g] = m.groupId
      ? await db.select().from(groups).where(eq(groups.id, m.groupId)).limit(1)
      : [null];

    const ach = await db
      .select({
        id: achievements.id,
        title: achievements.title,
        description: achievements.description,
        points: achievements.points,
        awardedAt: achievements.awardedAt,
        cover: achievementTypes.cover,
      })
      .from(achievements)
      .leftJoin(achievementTypes, eq(achievements.typeId, achievementTypes.id))
      .where(eq(achievements.memberId, m.id))
      .orderBy(desc(achievements.awardedAt));

    const [{ rank }] = await db
      .select({ rank: sql<number>`(select count(*) + 1 from \`members\` m2 where m2.\`points\` > ${m.points})` })
      .from(members)
      .where(eq(members.id, m.id))
      .limit(1);

    return {
      member: {
        fullName: m.fullName, profileCode: m.profileCode, points: m.points,
        createdAt: m.createdAt, avatar: m.avatar, coverTheme: m.coverTheme,
        coverPhoto: m.coverPhoto, bio: m.bio, videoUrl: m.videoUrl,
        albums: parseAlbums(m.gallery),
      },
      group: g ? { name: g.name, code: g.code, points: g.points } : null,
      achievements: ach,
      rank: Number(rank) || 1,
    };
  }),

  updateMyProfile: authedQuery
    .input(
      z.object({
        avatar: z.string().max(400_000).optional(),
        coverTheme: z.string().max(30).optional(),
        coverPhoto: z.string().max(600_000).nullable().optional(),
        bio: z.string().max(280).optional(),
        albums: z
          .array(
            z.object({
              title: z.string().min(1).max(60),
              photos: z.array(z.string().max(300_000)).max(30),
            }),
          )
          .max(8)
          .optional(),
        videoUrl: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [m] = await db.select().from(members).where(eq(members.userId, ctx.user.id)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Primero completa tu inscripción." });
      const patch: Record<string, string | null> = {};
      if (input.avatar !== undefined) patch.avatar = input.avatar;
      if (input.coverTheme !== undefined) patch.coverTheme = input.coverTheme;
      if (input.coverPhoto !== undefined) patch.coverPhoto = input.coverPhoto;
      if (input.bio !== undefined) patch.bio = input.bio;
      if (input.albums !== undefined) patch.gallery = JSON.stringify(input.albums);
      if (input.videoUrl !== undefined) patch.videoUrl = input.videoUrl;
      if (Object.keys(patch).length > 0) {
        await db.update(members).set(patch).where(eq(members.id, m.id));
      }
      return { ok: true };
    }),

  linkProfile: authedQuery
    .input(z.object({ code: z.string().min(4).max(12) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const code = input.code.trim().toUpperCase();
      const existing = await db.select({ id: members.id }).from(members).where(eq(members.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Tu cuenta ya tiene un perfil vinculado." });
      }
      const [m] = await db.select().from(members).where(eq(members.profileCode, code)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Código de perfil no encontrado." });
      if (m.userId && m.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este perfil ya está vinculado a otra cuenta." });
      }
      await db.update(members).set({ userId: ctx.user.id }).where(eq(members.id, m.id));
      return { ok: true, profileCode: code };
    }),

  // ---------- ADMIN ----------

  adminMembers: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: members.id,
        fullName: members.fullName,
        documentId: members.documentId,
        birthDate: members.birthDate,
        phone: members.phone,
        email: members.email,
        address: members.address,
        eps: members.eps,
        bloodType: members.bloodType,
        allergies: members.allergies,
        medications: members.medications,
        medicalConditions: members.medicalConditions,
        emergencyContactName: members.emergencyContactName,
        emergencyContactPhone: members.emergencyContactPhone,
        points: members.points,
        profileCode: members.profileCode,
        createdAt: members.createdAt,
        groupName: groups.name,
        groupId: members.groupId,
      })
      .from(members)
      .leftJoin(groups, eq(members.groupId, groups.id))
      .orderBy(desc(members.createdAt));
  }),

  adminGroups: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: groups.id,
        name: groups.name,
        code: groups.code,
        points: groups.points,
        memberCount: sql<number>`(select count(*) from \`members\` where \`members\`.\`groupId\` = \`groups\`.\`id\`)`,
      })
      .from(groups)
      .orderBy(desc(groups.points));
  }),

  setGroupPoints: adminQuery
    .input(z.object({ groupId: z.number(), points: z.number().int().min(0) }))
    .mutation(async ({ input }) => {
      await getDb().update(groups).set({ points: input.points }).where(eq(groups.id, input.groupId));
      return { ok: true };
    }),

  adjustMemberPoints: adminQuery
    .input(z.object({ memberId: z.number(), delta: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [m] = await db.select().from(members).where(eq(members.id, input.memberId)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Miembro no encontrado." });
      const next = Math.max(0, m.points + input.delta);
      await db.update(members).set({ points: next }).where(eq(members.id, input.memberId));
      return { ok: true, points: next };
    }),

  // Catálogo de logros (creados por el administrador)
  listAchievementTypes: adminQuery.query(async () => {
    return getDb().select().from(achievementTypes).orderBy(desc(achievementTypes.createdAt));
  }),

  createAchievementType: adminQuery
    .input(
      z.object({
        title: z.string().min(2).max(160),
        description: z.string().optional().default(""),
        points: z.number().int().min(0).max(10000).default(10),
        icon: z.string().max(20).default("star"),
        cover: z.string().max(400_000).nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(achievementTypes).values({ ...input, cover: input.cover ?? null });
      return { ok: true };
    }),

  // Pone o cambia la imagen de miniatura de un logro del catálogo
  setAchievementTypeCover: adminQuery
    .input(z.object({ typeId: z.number(), cover: z.string().max(400_000).nullable() }))
    .mutation(async ({ input }) => {
      await getDb().update(achievementTypes).set({ cover: input.cover }).where(eq(achievementTypes.id, input.typeId));
      return { ok: true };
    }),

  deleteAchievementType: adminQuery
    .input(z.object({ typeId: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(achievementTypes).where(eq(achievementTypes.id, input.typeId));
      return { ok: true };
    }),

  awardAchievement: adminQuery
    .input(
      z.object({
        memberId: z.number(),
        typeId: z.number().optional(),
        title: z.string().min(2).max(160).optional(),
        description: z.string().optional().default(""),
        points: z.number().int().min(0).max(10000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [m] = await db.select().from(members).where(eq(members.id, input.memberId)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Miembro no encontrado." });

      let title = input.title ?? "";
      let description = input.description;
      let points = input.points ?? 0;
      let typeId: number | null = null;

      if (input.typeId) {
        const [t] = await db.select().from(achievementTypes).where(eq(achievementTypes.id, input.typeId)).limit(1);
        if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Tipo de logro no encontrado." });
        typeId = t.id;
        title = t.title;
        description = description || t.description || "";
        points = input.points ?? t.points;
      }
      if (title.trim().length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El logro necesita un título." });
      }

      await db.insert(achievements).values({
        memberId: input.memberId,
        typeId,
        title: title.trim(),
        description,
        points,
      });

      // El logro suma puntos al conquistador y a su grupo
      await db
        .update(members)
        .set({ points: m.points + points })
        .where(eq(members.id, input.memberId));
      if (m.groupId && points > 0) {
        await db
          .update(groups)
          .set({ points: sql`${groups.points} + ${points}` })
          .where(eq(groups.id, m.groupId));
      }
      return { ok: true };
    }),

  removeAchievement: adminQuery
    .input(z.object({ achievementId: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(achievements).where(eq(achievements.id, input.achievementId));
      return { ok: true };
    }),

  deleteMember: adminQuery
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(achievements).where(eq(achievements.memberId, input.memberId));
      await db.delete(photoLikes).where(eq(photoLikes.memberId, input.memberId));
      await db.delete(profileComments).where(eq(profileComments.memberId, input.memberId));
      await db.execute(sql`DELETE FROM post_likes WHERE postId IN (SELECT id FROM member_posts WHERE memberId = ${input.memberId})`);
      await db.delete(memberPosts).where(eq(memberPosts.memberId, input.memberId));
      await db.delete(members).where(eq(members.id, input.memberId));
      return { ok: true };
    }),

  /* ---------- EDICIÓN DE CONTENIDO (admin) ---------- */

  // Corrige título, artista, enlace o portada de una canción
  updateSong: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(2).max(160),
        artist: z.string().max(160).optional().default(""),
        url: z.string().max(500).refine(
          (u) => /^https?:\/\//.test(u) || /^\/api\/song-file\/\d+$/.test(u),
          { message: "Debe ser un enlace https:// o un archivo subido" },
        ),
        cover: z.string().max(400_000).nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb()
        .update(songs)
        .set({ title: input.title.trim(), artist: input.artist.trim(), url: input.url.trim(), cover: input.cover ?? null })
        .where(eq(songs.id, input.id));
      return { ok: true };
    }),

  // Corrige título, descripción, categoría o enlace de un recurso de la biblioteca
  updateResource: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3).max(160),
        description: z.string().max(400).optional().default(""),
        category: z.enum(["Libros", "Especialidades", "Cartillas", "Materiales"]).default("Libros"),
        url: z.string().max(500).refine(
          (u) => /^https?:\/\//.test(u) || /^\/api\/resource-file\/\d+$/.test(u),
          { message: "Debe ser un enlace https:// o un archivo adjunto" },
        ),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb()
        .update(resources)
        .set({ title: input.title.trim(), description: input.description.trim(), category: input.category, url: input.url.trim() })
        .where(eq(resources.id, input.id));
      return { ok: true };
    }),

  // Corrige nombre, descripción, puntos o miniatura de una especialidad del catálogo
  updateAchievementType: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(2).max(160),
        description: z.string().optional().default(""),
        points: z.number().int().min(0).max(10000).default(10),
        cover: z.string().max(400_000).nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb()
        .update(achievementTypes)
        .set({ title: input.title.trim(), description: input.description.trim(), points: input.points, cover: input.cover ?? null })
        .where(eq(achievementTypes.id, input.id));
      return { ok: true };
    }),

  // Corrige título, descripción, lugar, categoría o fecha de un evento
  updateEvent: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3).max(160),
        description: z.string().max(1000).optional().default(""),
        location: z.string().max(160).optional().default(""),
        category: z.enum(["Campamento", "Rally", "Especialidades", "Ceremonia", "Otro"]).default("Campamento"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb()
        .update(clubEvents)
        .set({
          title: input.title.trim(),
          description: input.description.trim(),
          location: input.location.trim(),
          category: input.category,
          eventDate: new Date(`${input.date}T12:00:00`),
        })
        .where(eq(clubEvents.id, input.id));
      return { ok: true };
    }),

  /* ---------- CHAT DEL CLUB (solo emojis) ---------- */

  // Señal de vida: marca al usuario como conectado
  chatPing: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const [m] = await db
      .select({ fullName: members.fullName })
      .from(members)
      .where(eq(members.userId, ctx.user.id))
      .limit(1);
    const name = (m?.fullName ?? ctx.user.name ?? "Conquistador").slice(0, 160);
    await db
      .insert(chatPresence)
      .values({ userId: ctx.user.id, name })
      .onDuplicateKeyUpdate({ set: { name, lastSeen: sql`CURRENT_TIMESTAMP` } });
    return { ok: true };
  }),

  // Usuarios conectados en este momento (vistos en los últimos 2 minutos)
  chatOnline: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(chatPresence)
      .where(sql`${chatPresence.lastSeen} > NOW() - INTERVAL 120 SECOND`)
      .orderBy(desc(chatPresence.lastSeen))
      .limit(40);
    const withProfiles = await Promise.all(
      rows.map(async (p) => {
        const [m] = await db
          .select({ profileCode: members.profileCode, avatar: members.avatar, fullName: members.fullName })
          .from(members)
          .where(eq(members.userId, p.userId))
          .limit(1);
        return {
          userId: p.userId,
          name: (m?.fullName ?? p.name).slice(0, 160),
          code: m?.profileCode ?? null,
          avatar: m?.avatar ?? null,
          isMe: p.userId === ctx.user.id,
        };
      })
    );
    return withProfiles;
  }),

  // Mensajes del chat general o de una conversación privada
  chatMessages: authedQuery
    .input(z.object({ withUserId: z.number().nullable().optional(), sinceId: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const where = input.withUserId
        ? and(
            gt(chatMessages.id, input.sinceId),
            or(
              and(eq(chatMessages.senderId, ctx.user.id), eq(chatMessages.receiverId, input.withUserId)),
              and(eq(chatMessages.senderId, input.withUserId), eq(chatMessages.receiverId, ctx.user.id))
            )
          )
        : and(gt(chatMessages.id, input.sinceId), isNull(chatMessages.receiverId));
      const rows = await db
        .select()
        .from(chatMessages)
        .where(where)
        .orderBy(desc(chatMessages.id))
        .limit(input.sinceId > 0 ? 80 : 60);
      return rows.reverse().map((r) => ({ ...r, isMe: r.senderId === ctx.user.id }));
    }),

  // Enviar mensaje — texto y emojis (máx. 200 caracteres)
  sendChat: authedQuery
    .input(z.object({ body: z.string().min(1).max(200), toUserId: z.number().nullable().optional() }))
    .mutation(async ({ input, ctx }) => {
      const body = input.body.replace(/\s+/g, " ").trim();
      if (!body) throw new TRPCError({ code: "BAD_REQUEST", message: "El mensaje está vacío." });

      const db = getDb();
      const [m] = await db.select({ fullName: members.fullName }).from(members).where(eq(members.userId, ctx.user.id)).limit(1);
      const senderName = (m?.fullName ?? ctx.user.name ?? "Conquistador").slice(0, 160);
      const [{ id }] = await db
        .insert(chatMessages)
        .values({ senderId: ctx.user.id, receiverId: input.toUserId ?? null, body, senderName })
        .$returningId();
      return { id };
    }),

  // Mensajes privados no leídos para mí (para la notificación)
  chatUnread: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [read] = await db.select().from(chatReads).where(eq(chatReads.userId, ctx.user.id)).limit(1);
    const lastReadId = read?.lastReadId ?? 0;
    const rows = await db
      .select()
      .from(chatMessages)
      .where(and(gt(chatMessages.id, lastReadId), eq(chatMessages.receiverId, ctx.user.id)))
      .orderBy(asc(chatMessages.id))
      .limit(60);
    const bySender = new Map<number, { senderId: number; senderName: string; count: number; preview: string }>();
    for (const r of rows) {
      const cur = bySender.get(r.senderId);
      if (cur) { cur.count += 1; cur.preview = r.body; }
      else bySender.set(r.senderId, { senderId: r.senderId, senderName: r.senderName, count: 1, preview: r.body });
    }
    return { lastReadId, senders: Array.from(bySender.values()), total: rows.length };
  }),

  // Marcar privados como leídos hasta cierto mensaje
  chatMarkRead: authedQuery
    .input(z.object({ lastReadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .insert(chatReads)
        .values({ userId: ctx.user.id, lastReadId: input.lastReadId })
        .onDuplicateKeyUpdate({ set: { lastReadId: sql`GREATEST(${chatReads.lastReadId}, ${input.lastReadId})` } });
      return { ok: true };
    }),
});
