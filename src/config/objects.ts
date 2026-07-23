import type { ObjectOfStudy } from "../types/search";

export const OBJECTS_OF_STUDY = [
  { id: "video-games", label: "Video Games", searchTerms: ["video games"] },
  { id: "film", label: "Film", searchTerms: ["film"] },
  { id: "television", label: "Television", searchTerms: ["television"] },
  { id: "digital-media", label: "Digital Media", searchTerms: ["digital media"] },
  { id: "social-media", label: "Social Media", searchTerms: ["social media"] },
  {
    id: "internet-digital-platforms",
    label: "Internet & Digital Platforms",
    searchTerms: ["internet", "digital platforms"],
  },
  {
    id: "artificial-intelligence",
    label: "Artificial Intelligence",
    searchTerms: ["artificial intelligence", "AI"],
  },
  {
    id: "virtual-augmented-reality",
    label: "Virtual & Augmented Reality",
    searchTerms: ["virtual reality", "augmented reality", "VR", "AR"],
  },
  { id: "mobile-media", label: "Mobile Media", searchTerms: ["mobile media"] },
  { id: "photography", label: "Photography", searchTerms: ["photography"] },
  { id: "animation", label: "Animation", searchTerms: ["animation"] },
  {
    id: "comics-graphic-novels",
    label: "Comics & Graphic Novels",
    searchTerms: ["comics", "graphic novels"],
  },
  {
    id: "books-literature",
    label: "Books & Literature",
    searchTerms: ["books", "literature"],
  },
  { id: "sound-music", label: "Sound & Music", searchTerms: ["sound", "music"] },
  { id: "podcasts", label: "Podcasts", searchTerms: ["podcasts"] },
  {
    id: "art-performance",
    label: "Art & Performance",
    searchTerms: ["art", "performance"],
  },
  {
    id: "museums-heritage",
    label: "Museums & Heritage",
    searchTerms: ["museums", "heritage"],
  },
  {
    id: "visual-communication-design",
    label: "Visual Communication Design",
    searchTerms: ["visual communication design"],
  },
  {
    id: "narrative-storytelling",
    label: "Narrative & Storytelling",
    searchTerms: ["narrative", "storytelling"],
  },
  {
    id: "cities-architecture",
    label: "Cities & Architecture",
    searchTerms: ["cities", "urban life", "architecture"],
  },
  { id: "education", label: "Education", searchTerms: ["education"] },
] as const satisfies readonly ObjectOfStudy[];

export const OBJECTS_BY_ID = new Map(
  OBJECTS_OF_STUDY.map((object) => [object.id, object]),
);
