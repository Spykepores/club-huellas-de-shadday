import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
// Streaming de canciones subidas por la directiva (almacenadas en la base de datos)
app.get("/api/song-file/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "Bad request" }, 400);
  const { getDb } = await import("./queries/connection");
  const { songFiles } = await import("@db/schema");
  const { eq } = await import("drizzle-orm");
  const [f] = await getDb().select().from(songFiles).where(eq(songFiles.id, id)).limit(1);
  if (!f) return c.json({ error: "Not Found" }, 404);
  const buf = Buffer.from(f.data, "base64");
  c.header("Content-Type", f.mime);
  c.header("Content-Length", String(buf.length));
  c.header("Cache-Control", "public, max-age=86400");
  c.header("Accept-Ranges", "bytes");
  return c.body(new Uint8Array(buf));
});

// Archivos adjuntos de la biblioteca (PDF, Word, imágenes…)
app.get("/api/resource-file/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "Bad request" }, 400);
  const { getDb } = await import("./queries/connection");
  const { resourceFiles } = await import("@db/schema");
  const { eq } = await import("drizzle-orm");
  const [f] = await getDb().select().from(resourceFiles).where(eq(resourceFiles.id, id)).limit(1);
  if (!f) return c.json({ error: "Not Found" }, 404);
  const buf = Buffer.from(f.data, "base64");
  const safeName = f.filename.replace(/[^\w.áéíóúñÁÉÍÓÚÑ ()-]/g, "_");
  c.header("Content-Type", f.mime);
  c.header("Content-Length", String(buf.length));
  c.header("Content-Disposition", `inline; filename="${safeName}"`);
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(new Uint8Array(buf));
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
