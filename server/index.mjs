import { createServer } from "node:http";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "auth-db.json");
const port = Number(process.env.AUTH_PORT || 4000);
const sessionTtlMs = 1000 * 60 * 60 * 24 * 7;
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://teachersproject.vercel.app"
]);

function json(response, statusCode, payload, origin = "") {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload));
}

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dbFile, "utf8");
  } catch {
    await writeDb({
      teachers: [],
      sessions: [],
      posts: [],
      resources: defaultResources(),
    });
  }
}

async function readDb() {
  await ensureDb();
  const raw = await readFile(dbFile, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data.posts)) {
    data.posts = [];
  }

  if (!Array.isArray(data.resources) || data.resources.length === 0) {
    data.resources = defaultResources();
  }

  if (!Array.isArray(data.teachers)) {
    data.teachers = [];
  }

  if (!Array.isArray(data.sessions)) {
    data.sessions = [];
  }

  return data;
}

async function writeDb(data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash || "").split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(originalHash, "hex");

  if (derived.length !== original.length) {
    return false;
  }

  return timingSafeEqual(derived, original);
}

function createSessionToken() {
  return randomBytes(48).toString("hex");
}

function sanitizeTeacher(teacher) {
  return {
    id: teacher.id,
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    email: teacher.email,
    subject: teacher.subject,
    role: teacher.role,
    created_at: teacher.created_at,
  };
}

function defaultResources() {
  return [
    {
      id: "resource-weekly-plan",
      title: "Weekly Lesson Planner",
      category: "Planning",
      type: "PDF",
      description: "A clean weekly template to organize objectives, activities, and homework for each class.",
      file_name: "weekly-lesson-planner.pdf",
      updated_at: "2026-04-20T09:00:00.000Z",
    },
    {
      id: "resource-starter-activities",
      title: "Starter Activities Pack",
      category: "Engagement",
      type: "DOCX",
      description: "Quick warm-up activities that help teachers start lessons with energy and focus.",
      file_name: "starter-activities-pack.docx",
      updated_at: "2026-04-18T14:30:00.000Z",
    },
    {
      id: "resource-assessment-checklist",
      title: "Assessment Checklist",
      category: "Assessment",
      type: "XLSX",
      description: "A classroom-friendly checklist for tracking mastery, participation, and follow-up needs.",
      file_name: "assessment-checklist.xlsx",
      updated_at: "2026-04-16T11:45:00.000Z",
    },
  ];
}

function parseAuthorizationHeader(request) {
  const header = request.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice(7);
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function validateRegistration(body) {
  const firstName = String(body.first_name || "").trim();
  const lastName = String(body.last_name || "").trim();
  const email = normalizeEmail(body.email);
  const subject = String(body.subject || "").trim();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirm_password || "");

  if (!firstName || !lastName || !email || !password) {
    return "يرجى إكمال جميع الحقول المطلوبة.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "يرجى إدخال بريد إلكتروني صالح.";
  }

  if (firstName.length < 2 || lastName.length < 2) {
    return "الاسم الأول واسم العائلة يجب أن يكونا حرفين على الأقل.";
  }

  if (password.length < 8) {
    return "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.";
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "كلمة المرور يجب أن تحتوي على حرف كبير ورقم واحد على الأقل.";
  }

  if (password !== confirmPassword) {
    return "تأكيد كلمة المرور غير مطابق.";
  }

  return "";
}

function validateLogin(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    return "يرجى إدخال البريد الإلكتروني وكلمة المرور.";
  }

  return "";
}

async function resolveSession(request) {
  const token = parseAuthorizationHeader(request);

  if (!token) {
    return null;
  }

  const db = await readDb();
  const session = db.sessions.find((entry) => entry.token === token && entry.expires_at > Date.now());

  if (!session) {
    return null;
  }

  const teacher = db.teachers.find((entry) => entry.id === session.teacher_id);

  if (!teacher) {
    return null;
  }

  return { db, session, teacher };
}

async function handleRegister(request, response, origin) {
  const body = await readBody(request);
  const validationMessage = validateRegistration(body);

  if (validationMessage) {
    json(response, 422, { success: false, message: validationMessage }, origin);
    return;
  }

  const db = await readDb();
  const email = normalizeEmail(body.email);

  if (db.teachers.some((teacher) => teacher.email === email)) {
    json(response, 409, { success: false, message: "البريد الإلكتروني مستخدم بالفعل." }, origin);
    return;
  }

  const teacher = {
    id: randomUUID(),
    first_name: String(body.first_name).trim(),
    last_name: String(body.last_name).trim(),
    email,
    subject: String(body.subject || "").trim(),
    role: "teacher",
    created_at: new Date().toISOString(),
    password_hash: hashPassword(String(body.password)),
  };

  const token = createSessionToken();

  db.teachers.push(teacher);
  db.sessions.push({
    id: randomUUID(),
    teacher_id: teacher.id,
    token,
    created_at: Date.now(),
    expires_at: Date.now() + sessionTtlMs,
  });

  await writeDb(db);

  json(
    response,
    201,
    {
      success: true,
      message: "تم إنشاء الحساب بنجاح.",
      access_token: token,
      teacher: sanitizeTeacher(teacher),
    },
    origin,
  );
}

async function handleLogin(request, response, origin) {
  const body = await readBody(request);
  const validationMessage = validateLogin(body);

  if (validationMessage) {
    json(response, 422, { success: false, message: validationMessage }, origin);
    return;
  }

  const db = await readDb();
  const email = normalizeEmail(body.email);
  const teacher = db.teachers.find((entry) => entry.email === email);

  if (!teacher || !verifyPassword(String(body.password), teacher.password_hash)) {
    json(response, 401, { success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, origin);
    return;
  }

  const token = createSessionToken();
  db.sessions = db.sessions.filter((session) => session.expires_at > Date.now());
  db.sessions.push({
    id: randomUUID(),
    teacher_id: teacher.id,
    token,
    created_at: Date.now(),
    expires_at: Date.now() + sessionTtlMs,
  });

  await writeDb(db);

  json(
    response,
    200,
    {
      success: true,
      message: "تم تسجيل الدخول بنجاح.",
      access_token: token,
      teacher: sanitizeTeacher(teacher),
    },
    origin,
  );
}

async function handleMe(request, response, origin) {
  const sessionState = await resolveSession(request);

  if (!sessionState) {
    json(response, 401, { success: false, message: "يجب تسجيل الدخول أولاً." }, origin);
    return;
  }

  json(
    response,
    200,
    {
      success: true,
      teacher: sanitizeTeacher(sessionState.teacher),
    },
    origin,
  );
}

async function handleLogout(request, response, origin) {
  const token = parseAuthorizationHeader(request);

  if (!token) {
    json(response, 401, { success: false, message: "الجلسة غير صالحة." }, origin);
    return;
  }

  const db = await readDb();
  db.sessions = db.sessions.filter((session) => session.token !== token);
  await writeDb(db);

  json(response, 200, { success: true, message: "تم تسجيل الخروج بنجاح." }, origin);
}

async function handleGetPosts(request, response, origin) {
  const sessionState = await resolveSession(request);

  if (!sessionState) {
    json(response, 401, { success: false, message: "يجب تسجيل الدخول أولاً." }, origin);
    return;
  }

  const posts = [...sessionState.db.posts].sort((first, second) => second.created_at.localeCompare(first.created_at));

  json(
    response,
    200,
    {
      success: true,
      posts,
    },
    origin,
  );
}

async function handleCreatePost(request, response, origin) {
  const sessionState = await resolveSession(request);

  if (!sessionState) {
    json(response, 401, { success: false, message: "يجب تسجيل الدخول أولاً." }, origin);
    return;
  }

  const body = await readBody(request);
  const content = String(body.content || "").trim();

  if (content.length < 5) {
    json(response, 422, { success: false, message: "اكتب منشورًا أوضح قليلًا قبل النشر." }, origin);
    return;
  }

  const post = {
    id: randomUUID(),
    content,
    created_at: new Date().toISOString(),
    author: sanitizeTeacher(sessionState.teacher),
  };

  sessionState.db.posts.push(post);
  await writeDb(sessionState.db);

  json(
    response,
    201,
    {
      success: true,
      message: "تم نشر مشاركتك بنجاح.",
      post,
    },
    origin,
  );
}

async function handleGetResources(request, response, origin) {
  const sessionState = await resolveSession(request);

  if (!sessionState) {
    json(response, 401, { success: false, message: "يجب تسجيل الدخول أولاً." }, origin);
    return;
  }

  json(
    response,
    200,
    {
      success: true,
      resources: sessionState.db.resources,
    },
    origin,
  );
}

export function createAuthServer() {
  return createServer(async (request, response) => {
    const origin = request.headers.origin || "";
    const url = new URL(request.url || "/", "http://localhost");

    if (request.method === "OPTIONS") {
      json(response, 204, {}, origin);
      return;
    }

    try {
      if (request.method === "POST" && url.pathname === "/api/auth/register") {
        await handleRegister(request, response, origin);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/auth/login") {
        await handleLogin(request, response, origin);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/auth/me") {
        await handleMe(request, response, origin);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/auth/logout") {
        await handleLogout(request, response, origin);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/community/posts") {
        await handleGetPosts(request, response, origin);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/community/posts") {
        await handleCreatePost(request, response, origin);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/green-corner/resources") {
        await handleGetResources(request, response, origin);
        return;
      }

      json(response, 404, { success: false, message: "المسار المطلوب غير موجود." }, origin);
    } catch (error) {
      json(
        response,
        500,
        {
          success: false,
          message: "حدث خطأ داخلي في الخادم.",
          detail: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined,
        },
        origin,
      );
    }
  });
}

export async function startServer(serverPort = port) {
  await ensureDb();

  const server = createAuthServer();

  return new Promise((resolve) => {
    server.listen(serverPort, () => {
      resolve(server);
    });
  });
}

if (process.argv[1] === __filename) {
  startServer().then(() => {
    console.log(`Auth server listening on http://localhost:${port}`);
  });
}
