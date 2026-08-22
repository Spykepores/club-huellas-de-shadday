import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  mediumtext,
  longtext,
  timestamp,
  int,
  bigint,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---- Club Huellas de Shadday: campamento ----

export const groups = mysqlTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 12 }).notNull().unique(),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Group = typeof groups.$inferSelect;

export const members = mysqlTable("members", {
  id: serial("id").primaryKey(),
  profileCode: varchar("profileCode", { length: 12 }).notNull().unique(),
  groupId: bigint("groupId", { mode: "number", unsigned: true }),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  // Datos personales
  fullName: varchar("fullName", { length: 200 }).notNull(),
  documentId: varchar("documentId", { length: 40 }),
  birthDate: varchar("birthDate", { length: 10 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  address: varchar("address", { length: 255 }),
  // Datos de salud
  eps: varchar("eps", { length: 120 }),
  bloodType: varchar("bloodType", { length: 5 }),
  allergies: text("allergies"),
  medications: text("medications"),
  medicalConditions: text("medicalConditions"),
  emergencyContactName: varchar("emergencyContactName", { length: 200 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 40 }),
  // Personalización del perfil
  avatar: mediumtext("avatar"),
  coverTheme: varchar("coverTheme", { length: 30 }).default("bosque").notNull(),
  coverPhoto: mediumtext("coverPhoto"),
  bio: varchar("bio", { length: 280 }),
  gallery: mediumtext("gallery"),
  videoUrl: varchar("videoUrl", { length: 255 }),
  // Ranking
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Member = typeof members.$inferSelect;

// Catálogo de logros creados por el administrador
export const achievementTypes = mysqlTable("achievement_types", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  points: int("points").default(0).notNull(),
  icon: varchar("icon", { length: 20 }).default("star").notNull(),
  cover: mediumtext("cover"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AchievementType = typeof achievementTypes.$inferSelect;

export const achievements = mysqlTable("achievements", {
  id: serial("id").primaryKey(),
  memberId: bigint("memberId", { mode: "number", unsigned: true }).notNull(),
  typeId: bigint("typeId", { mode: "number", unsigned: true }),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  points: int("points").default(0).notNull(),
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;

// Likes en fotos de la galería
export const photoLikes = mysqlTable("photo_likes", {
  id: serial("id").primaryKey(),
  memberId: bigint("memberId", { mode: "number", unsigned: true }).notNull(),
  photoIndex: int("photoIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhotoLike = typeof photoLikes.$inferSelect;

// Comentarios en el perfil
export const profileComments = mysqlTable("profile_comments", {
  id: serial("id").primaryKey(),
  memberId: bigint("memberId", { mode: "number", unsigned: true }).notNull(),
  authorName: varchar("authorName", { length: 80 }).notNull(),
  authorCode: varchar("authorCode", { length: 12 }),
  authorAvatar: mediumtext("authorAvatar"),
  body: varchar("body", { length: 300 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfileComment = typeof profileComments.$inferSelect;

// Publicaciones del perfil (muro estilo Facebook)
export const memberPosts = mysqlTable("member_posts", {
  id: serial("id").primaryKey(),
  memberId: bigint("memberId", { mode: "number", unsigned: true }).notNull(),
  body: varchar("body", { length: 500 }).notNull(),
  photo: mediumtext("photo"),
  authorAvatar: mediumtext("authorAvatar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemberPost = typeof memberPosts.$inferSelect;

// Likes en publicaciones
export const postLikes = mysqlTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: bigint("postId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostLike = typeof postLikes.$inferSelect;

// Eventos del club: campamentos, rallies, especialidades (los crea la directiva)
export const clubEvents = mysqlTable("club_events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 160 }),
  category: varchar("category", { length: 30 }).notNull().default("Campamento"),
  eventDate: timestamp("eventDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClubEvent = typeof clubEvents.$inferSelect;

// Biblioteca del club: libros, especialidades, cartillas y materiales
export const resources = mysqlTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: varchar("description", { length: 400 }),
  category: varchar("category", { length: 30 }).notNull().default("Libros"),
  url: varchar("url", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;

// Música del club (la sube la directiva como enlaces de audio)
export const songs = mysqlTable("songs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  artist: varchar("artist", { length: 160 }),
  url: varchar("url", { length: 500 }).notNull(),
  cover: mediumtext("cover"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Song = typeof songs.$inferSelect;

// Archivos de audio subidos por la directiva (se guardan comprimidos en base64)
export const songFiles = mysqlTable("song_files", {
  id: serial("id").primaryKey(),
  mime: varchar("mime", { length: 80 }).notNull(),
  data: longtext("data").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SongFile = typeof songFiles.$inferSelect;

// Archivos adjuntos de la biblioteca (libros, cartillas, materiales en base64)
export const resourceFiles = mysqlTable("resource_files", {
  id: serial("id").primaryKey(),
  mime: varchar("mime", { length: 80 }).notNull(),
  filename: varchar("filename", { length: 200 }).notNull().default("archivo"),
  data: longtext("data").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResourceFile = typeof resourceFiles.$inferSelect;

// Confirmaciones de asistencia (RSVP) a eventos del club
export const eventRsvps = mysqlTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: bigint("eventId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [uniqueIndex("uq_rsvp").on(t.eventId, t.userId)]);

export type EventRsvp = typeof eventRsvps.$inferSelect;

// "Me gusta" de canciones: la playlist personal de cada usuario
export const songLikes = mysqlTable("song_likes", {
  id: serial("id").primaryKey(),
  songId: bigint("songId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [uniqueIndex("uq_song_like").on(t.songId, t.userId)]);

export type SongLike = typeof songLikes.$inferSelect;

// Chat del club: mensajes con emojis (receiverId NULL = chat general, sino privado)
export const chatMessages = mysqlTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: bigint("senderId", { mode: "number", unsigned: true }).notNull(),
  receiverId: bigint("receiverId", { mode: "number", unsigned: true }),
  body: varchar("body", { length: 200 }).notNull(),
  senderName: varchar("senderName", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// Presencia: última señal de vida de cada usuario conectado
export const chatPresence = mysqlTable("chat_presence", {
  userId: bigint("userId", { mode: "number", unsigned: true }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
});

export type ChatPresence = typeof chatPresence.$inferSelect;

// Puntero de lectura por usuario para mensajes privados no leídos
export const chatReads = mysqlTable("chat_reads", {
  userId: bigint("userId", { mode: "number", unsigned: true }).primaryKey(),
  lastReadId: bigint("lastReadId", { mode: "number", unsigned: true }).notNull().default(0),
});

export type ChatRead = typeof chatReads.$inferSelect;
