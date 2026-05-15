const { createClient } = require("@supabase/supabase-js");

const SITE_URL = "https://fyp3d-view.onrender.com";
const BATCH_SIZE = 200;

const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stripTags = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSubject = (value) => {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("math")) return "math";
  if (raw.includes("chem")) return "chemistry";
  if (raw.includes("phys")) return "physics";
  if (raw.includes("bio")) return "biology";
  return null;
};

const parseHeading = (text) => {
  const cleaned = stripTags(text);
  const match = cleaned.match(/^(.*?)\s*[-–]\s*Chapter\s*(\d+)\s*:\s*(.+)$/i);
  if (!match) {
    return {
      subject: normalizeSubject(cleaned),
      chapter: null,
      chapterTopic: null,
    };
  }

  return {
    subject: normalizeSubject(match[1]),
    chapter: `Chapter ${match[2]}`,
    chapterTopic: match[3].trim() || null,
  };
};

const parseLinkContext = (href) => {
  const match = String(href || "").match(/\/grade(\d+)\/([^/]+)\/(chapter\d+)/i);
  if (!match) return null;

  const grade = Number(match[1]);
  const subject = normalizeSubject(match[2]);
  const chapter = `Chapter ${match[3].replace(/chapter/i, "").trim()}`;

  if (!subject || !Number.isFinite(grade)) return null;
  return { grade, subject, chapter };
};

const buildTitleFromHref = (href) => {
  const parts = String(href || "").split("/");
  const file = parts[parts.length - 1] || "";
  return file
    .replace(/\.html?.*$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\d+\.?/g, " ")
    .trim();
};

const fetchHtml = async () => {
  const response = await fetch(SITE_URL);
  if (!response.ok) {
    throw new Error(`Failed to load ${SITE_URL}: ${response.status}`);
  }
  return response.text();
};

const buildSubjectMap = async () => {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, grade_level");

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map();
  (data || []).forEach((row) => {
    const key = `${row.name}:${row.grade_level}`;
    map.set(key, row.id);
  });

  return map;
};

const fetchExistingUrls = async () => {
  const { data, error } = await supabase
    .from("virtual_lab_resources")
    .select("resource_url")
    .eq("interaction_type", "CANVAS");

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data || []).map((row) => String(row.resource_url || "")));
};

const parseResources = (html) => {
  const resources = [];
  let context = { subject: null, chapter: null, chapterTopic: null };

  const tokenRegex = /<h2[^>]*>([\s\S]*?)<\/h2>|<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = tokenRegex.exec(html))) {
    if (match[1]) {
      context = parseHeading(match[1]);
      continue;
    }

    const href = match[2];
    const inner = match[3];
    if (!href || !href.startsWith("/grade")) {
      continue;
    }

    const linkContext = parseLinkContext(href);
    if (!linkContext) {
      continue;
    }

    const title = stripTags(inner) || buildTitleFromHref(href) || "Interactive Lab";
    const description = `${title} interactive lab.`;
    const resourceUrl = `${SITE_URL}${href}`;

    resources.push({
      grade: linkContext.grade,
      subject: linkContext.subject,
      chapter: context.chapter || linkContext.chapter,
      chapterTopic: context.chapterTopic,
      title,
      description,
      resourceUrl,
    });
  }

  return resources;
};

const chunk = (items, size) => {
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

const run = async () => {
  const html = await fetchHtml();
  const subjectMap = await buildSubjectMap();
  const existingUrls = await fetchExistingUrls();
  const resources = parseResources(html);

  const inserts = [];

  for (const item of resources) {
    const subjectId = subjectMap.get(`${item.subject}:${item.grade}`);
    if (!subjectId) {
      continue;
    }
    if (existingUrls.has(item.resourceUrl)) {
      continue;
    }

    inserts.push({
      subject_id: subjectId,
      grade_level: item.grade,
      chapter: item.chapter || "",
      topic: item.chapterTopic || item.title,
      title: item.title,
      description: item.description,
      thumbnail_url: "",
      interaction_type: "CANVAS",
      resource_url: item.resourceUrl,
      parameters: { source: "fyp3d-view" },
    });
  }

  if (!inserts.length) {
    console.log("No new resources to insert.");
    return;
  }

  const batches = chunk(inserts, BATCH_SIZE);
  let inserted = 0;

  for (const batch of batches) {
    const { error } = await supabase
      .from("virtual_lab_resources")
      .insert(batch);
    if (error) {
      throw new Error(error.message);
    }
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${inserts.length}`);
  }

  console.log(`Done. Inserted ${inserted} resources.`);
};

run().catch((error) => {
  console.error("Import failed:", error.message || error);
  process.exit(1);
});
