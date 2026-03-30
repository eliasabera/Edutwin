export type ArTopic = {
  id: string;
  title: string;
  topic: string;
  subject: "biology" | "chemistry" | "physics" | "math";
  chapter: string;
  description: string;
  learningPrompt: string;
  modelUrl: string;
  webViewerUrl?: string;
  iosSrc?: string;
  posterUrl?: string;
  integrationNote: string;
  isPlaceholderDemo?: boolean;
};

const DEMO_MODEL_URL =
  "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
const DEMO_POSTER_URL = "https://modelviewer.dev/assets/poster-astronaut.webp";
const HEART_MODEL_URL =
  "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/3d-models/beating_heart.glb";
const HEART_SKETCHFAB_EMBED_URL =
  "https://sketchfab.com/models/d9845afb1ee64ad094adc96320c67d98/embed";

const arTopics: ArTopic[] = [
  {
    id: "heart-demo",
    title: "Heart AR Viewer",
    topic: "Human Heart",
    subject: "biology",
    chapter: "Biology Unit 1",
    description:
      "Open the uploaded heart model from the textbook topic card and place it in the student's real environment for anatomy study.",
    learningPrompt:
      "Ask the student to identify chambers, blood flow direction, and major labeled regions while the model is in front of them.",
    modelUrl: HEART_MODEL_URL,
    webViewerUrl: HEART_SKETCHFAB_EMBED_URL,
    posterUrl: undefined,
    integrationNote:
      "Uses Sketchfab's Beating-heart embed for in-app viewing and intercepts AR deep links to open native camera viewers.",
    isPlaceholderDemo: false,
  },
  {
    id: "cell-demo",
    title: "Cell Structure AR Demo",
    topic: "Animal Cell",
    subject: "biology",
    chapter: "Biology Unit 1",
    description:
      "Use this topic card to preview how textbook chapters can launch 3D learning objects in context.",
    learningPrompt:
      "Let the student rotate the model, name organelles, and explain each organelle's role.",
    modelUrl: DEMO_MODEL_URL,
    posterUrl: DEMO_POSTER_URL,
    integrationNote:
      "Swap in your downloaded Sketchfab cell .glb file when you upload it to a public HTTPS URL.",
    isPlaceholderDemo: true,
  },
];

export const getArTopics = () => arTopics;

export const getArTopicById = (id: string) =>
  arTopics.find((topic) => topic.id === id) ?? null;
