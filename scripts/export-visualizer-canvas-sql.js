const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://fyp3d-view.onrender.com";

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
  const raw = String(href || "").trim();
  if (!raw) return null;
  let path = raw;
  if (raw.startsWith("http")) {
    try {
      path = new URL(raw).pathname || raw;
    } catch {
      path = raw;
    }
  }

  const match = path.match(/\/grade(\d+)\/([^/]+)\/(chapter\d+)/i);
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

const extractBundleSrc = (html) => {
  const match = html.match(/<script[^>]*src="([^"]+main-[^"]+\.js)"/i);
  if (!match) return null;
  const src = match[1];
  return src.startsWith("http") ? src : `${SITE_URL}${src}`;
};

const fetchBundleLinks = async () => {
  const html = await fetchHtml();
  const bundleSrc = extractBundleSrc(html);
  if (!bundleSrc) {
    throw new Error("Failed to locate visualizer JS bundle.");
  }

  const bundleResponse = await fetch(bundleSrc);
  if (!bundleResponse.ok) {
    throw new Error(`Failed to load bundle: ${bundleResponse.status}`);
  }

  const bundleText = await bundleResponse.text();
  const matches = [...bundleText.matchAll(/\/grade\d+\/[^'"\\)\s]+/g)].map(
    (match) => match[0],
  );

  return [...new Set(matches)];
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

const parseResources = (links) => {
  const resources = [];

  for (const href of links) {
    const linkContext = parseLinkContext(href);
    if (!linkContext) {
      continue;
    }

    const title = buildTitleFromHref(href) || "Interactive Lab";
    const description = `${title} interactive lab.`;
    const resourceUrl = href.startsWith("http") ? href : `${SITE_URL}${href}`;

    resources.push({
      grade: linkContext.grade,
      subject: linkContext.subject,
      chapter: linkContext.chapter,
      chapterTopic: null,
      title,
      description,
      resourceUrl,
    });
  }

  return resources;
};

const escapeLiteral = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''");

const run = async () => {
  const subjectMap = await buildSubjectMap();
  const links = await fetchBundleLinks();
  const resources = parseResources(links);

  const values = [];

  for (const item of resources) {
    const subjectId = subjectMap.get(`${item.subject}:${item.grade}`);
    if (!subjectId) {
      continue;
    }

    values.push(
      `('${escapeLiteral(subjectId)}', ${item.grade}, '${escapeLiteral(
        item.chapter || "",
      )}', '${escapeLiteral(item.chapterTopic || item.title)}', '${escapeLiteral(
        item.title,
      )}', '${escapeLiteral(item.description)}', '', 'CANVAS', '${escapeLiteral(
        item.resourceUrl,
      )}', '{"source":"fyp3d-view"}'::jsonb)`,
    );
  }

  if (!values.length) {
    console.log("No resources parsed.");
    return;
  }

  const sql = [
    "-- Auto-generated insert for EduTwin canvas labs",
    "-- Source: https://fyp3d-view.onrender.com",
    "insert into public.virtual_lab_resources (",
    "  subject_id,",
    "  grade_level,",
    "  chapter,",
    "  topic,",
    "  title,",
    "  description,",
    "  thumbnail_url,",
    "  interaction_type,",
    "  resource_url,",
    "  parameters",
    ")",
    "select v.* from (values",
    values.join(",\n"),
    ") as v(",
    "  subject_id,",
    "  grade_level,",
    "  chapter,",
    "  topic,",
    "  title,",
    "  description,",
    "  thumbnail_url,",
    "  interaction_type,",
    "  resource_url,",
    "  parameters",
    ")",
    "left join public.virtual_lab_resources r",
    "  on r.resource_url = v.resource_url",
    "where r.resource_url is null;",
    "",
  ].join("\n");

  const outPath = path.join(__dirname, "visualizer-canvas-insert.sql");
  fs.writeFileSync(outPath, sql, "utf8");
  console.log(`SQL written to ${outPath}`);
};

run().catch((error) => {
  console.error("Export failed:", error.message || error);
  process.exit(1);
});
