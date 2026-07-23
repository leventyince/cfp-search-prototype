import type { SourceClass } from "../types/result";

export interface KnownSource {
  domain: string;
  label: string;
  sourceClass: SourceClass;
}

export const KNOWN_SOURCES: readonly KnownSource[] = [
  { domain: "digra.org", label: "DiGRA", sourceClass: "association" },
  { domain: "iamcr.org", label: "IAMCR", sourceClass: "association" },
  { domain: "icahdq.org", label: "International Communication Association", sourceClass: "association" },
  { domain: "designresearchsociety.org", label: "Design Research Society", sourceClass: "association" },
  { domain: "networks.h-net.org", label: "H-Net H-Announce", sourceClass: "announcement-hub" },
  { domain: "call-for-papers.sas.upenn.edu", label: "University of Pennsylvania CFP", sourceClass: "announcement-hub" },
  { domain: "tandfonline.com", label: "Taylor & Francis", sourceClass: "publisher" },
  { domain: "springer.com", label: "Springer Nature", sourceClass: "publisher" },
  { domain: "emerald.com", label: "Emerald Publishing", sourceClass: "publisher" },
  { domain: "igi-global.com", label: "IGI Global", sourceClass: "publisher" },
];
