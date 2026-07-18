/**
 * Shared, dependency-free taxonomy for research topics, venues, and categories.
 *
 * Keys defined here are the stable identifiers used across content files, schema
 * validation, filtering, and UI labels. Add a topic or venue here once and it is
 * available everywhere. Never connect records by matching display strings —
 * always use these keys.
 */

/* ------------------------------------------------------------------ *
 * Research topics
 * ------------------------------------------------------------------ */

export const TOPIC_KEYS = [
  'sparse-tensor-algebra',
  'array-programming',
  'data-layouts',
  'compiler-ir',
  'meta-compilation',
  'distributed',
  'accelerators',
  'dsl',
  'autoscheduling',
  'recurrences',
  'relational',
  'foundations',
] as const;

export type TopicKey = (typeof TOPIC_KEYS)[number];

export interface TopicMeta {
  label: string;
  /** Short label for chips / compact contexts. */
  short: string;
  /** One-line plain-language description. */
  blurb: string;
}

export const TOPICS: Record<TopicKey, TopicMeta> = {
  'sparse-tensor-algebra': {
    label: 'Sparse tensor algebra',
    short: 'Sparse tensor algebra',
    blurb: 'Compiling tensor algebra that is polymorphic over dense and sparse data structures.',
  },
  'array-programming': {
    label: 'Sparse & structured arrays',
    short: 'Sparse arrays',
    blurb: 'Array programming models and shape operators over irregular data.',
  },
  'data-layouts': {
    label: 'Data representations',
    short: 'Layouts',
    blurb: 'Decoupling the layouts and formats of data structures from the algorithms that use them.',
  },
  'compiler-ir': {
    label: 'Compiler representations',
    short: 'IR & iteration',
    blurb: 'Intermediate representations and iteration models for fused, structured computation.',
  },
  'meta-compilation': {
    label: 'Meta-compilation, JITs & VMs',
    short: 'Meta-compilation',
    blurb: 'Compilers that generate compilers, fast baseline JITs, and virtual-machine generators.',
  },
  distributed: {
    label: 'Distributed computation',
    short: 'Distributed',
    blurb: 'Mapping computation onto clusters and task-based runtimes at scale.',
  },
  accelerators: {
    label: 'Accelerators & dataflow',
    short: 'Accelerators',
    blurb: 'Hardware/software co-design for reconfigurable and dataflow architectures.',
  },
  dsl: {
    label: 'Domain-specific languages',
    short: 'DSLs',
    blurb: 'Languages for simulation, graphics, and other structured domains.',
  },
  autoscheduling: {
    label: 'Scheduling & autotuning',
    short: 'Scheduling',
    blurb: 'Choosing schedules and formats automatically, including cost models and search.',
  },
  recurrences: {
    label: 'Recurrences',
    short: 'Recurrences',
    blurb: 'Compiling systems of recurrence equations over dense and sparse arrays.',
  },
  relational: {
    label: 'Relational & query compilation',
    short: 'Relational',
    blurb: 'Compiling relational and query operations alongside tensor computation.',
  },
  foundations: {
    label: 'Foundations & tooling',
    short: 'Foundations',
    blurb: 'Earlier work on program transformation, parallel patterns, and refactoring.',
  },
};

export function topicLabel(key: string): string {
  return (TOPICS as Record<string, TopicMeta>)[key]?.label ?? key;
}

/* ------------------------------------------------------------------ *
 * Software categories (used to group the software overview)
 * ------------------------------------------------------------------ */

export const SOFTWARE_CATEGORY_KEYS = [
  'sparse-compilation',
  'distributed',
  'ir-iteration',
  'dsl',
  'meta-compilation',
  'accelerators',
] as const;

export type SoftwareCategoryKey = (typeof SOFTWARE_CATEGORY_KEYS)[number];

export const SOFTWARE_CATEGORIES: Record<SoftwareCategoryKey, { label: string; blurb: string }> = {
  'sparse-compilation': {
    label: 'Sparse tensor & array compilation',
    blurb:
      'Compilers and libraries that make tensor and array code portable across dense and sparse formats.',
  },
  distributed: {
    label: 'Distributed sparse computation',
    blurb: 'Compilers and runtimes that scale sparse and dense computation across machines.',
  },
  'ir-iteration': {
    label: 'Compiler representations & iteration models',
    blurb: 'Intermediate representations and iteration abstractions that other compilers build on.',
  },
  dsl: {
    label: 'Domain-specific languages',
    blurb: 'Languages that raise the level of abstraction for a specific domain.',
  },
  'meta-compilation': {
    label: 'Meta-compilers, JITs & virtual machines',
    blurb: 'Systems that generate compilers, interpreters, and fast baseline JITs.',
  },
  accelerators: {
    label: 'Accelerator & dataflow compilation',
    blurb: 'Compilers and simulators targeting reconfigurable and dataflow hardware.',
  },
};

/* ------------------------------------------------------------------ *
 * People categories
 * ------------------------------------------------------------------ */

export const PEOPLE_CATEGORY_KEYS = ['pi', 'phd', 'member', 'alumni'] as const;
export type PeopleCategoryKey = (typeof PEOPLE_CATEGORY_KEYS)[number];

export const PEOPLE_CATEGORIES: Record<PeopleCategoryKey, { label: string; plural: string }> = {
  pi: { label: 'Principal investigator', plural: 'Principal investigator' },
  phd: { label: 'PhD student', plural: 'PhD students' },
  member: { label: 'Member', plural: 'Other members' },
  alumni: { label: 'Alum', plural: 'Alumni' },
};

/* ------------------------------------------------------------------ *
 * Venues
 * ------------------------------------------------------------------ */

/** Metadata for a publication venue, keyed by the `venueKey` used in content. */
export interface VenueMeta {
  /** Short display code, e.g. "PLDI". */
  short: string;
  /** Full venue name for citation metadata. */
  full: string;
  /** Coarse kind, used only for optional styling. */
  kind: 'conference' | 'journal' | 'workshop';
}

export const VENUES: Record<string, VenueMeta> = {
  pldi: {
    short: 'PLDI',
    full: 'ACM SIGPLAN Conference on Programming Language Design and Implementation',
    kind: 'conference',
  },
  oopsla: {
    short: 'OOPSLA',
    full: 'ACM SIGPLAN Conference on Object-Oriented Programming, Systems, Languages, and Applications',
    kind: 'conference',
  },
  pacmpl: {
    short: 'PACMPL',
    full: 'Proceedings of the ACM on Programming Languages',
    kind: 'journal',
  },
  osdi: {
    short: 'OSDI',
    full: 'USENIX Symposium on Operating Systems Design and Implementation',
    kind: 'conference',
  },
  asplos: {
    short: 'ASPLOS',
    full: 'International Conference on Architectural Support for Programming Languages and Operating Systems',
    kind: 'conference',
  },
  isca: {
    short: 'ISCA',
    full: 'International Symposium on Computer Architecture',
    kind: 'conference',
  },
  micro: {
    short: 'MICRO',
    full: 'IEEE/ACM International Symposium on Microarchitecture',
    kind: 'conference',
  },
  hpca: {
    short: 'HPCA',
    full: 'IEEE International Symposium on High-Performance Computer Architecture',
    kind: 'conference',
  },
  cgo: {
    short: 'CGO',
    full: 'IEEE/ACM International Symposium on Code Generation and Optimization',
    kind: 'conference',
  },
  sc: {
    short: 'SC',
    full: 'International Conference for High Performance Computing, Networking, Storage and Analysis',
    kind: 'conference',
  },
  dac: { short: 'DAC', full: 'Design Automation Conference', kind: 'conference' },
  vlsi: {
    short: 'VLSI',
    full: 'IEEE Symposium on VLSI Technology and Circuits',
    kind: 'conference',
  },
  spaa: {
    short: 'SPAA',
    full: 'ACM Symposium on Parallelism in Algorithms and Architectures',
    kind: 'conference',
  },
  ppopp: {
    short: 'PPoPP',
    full: 'ACM SIGPLAN Symposium on Principles and Practice of Parallel Programming',
    kind: 'conference',
  },
  icse: {
    short: 'ICSE',
    full: 'International Conference on Software Engineering',
    kind: 'conference',
  },
  ase: {
    short: 'ASE',
    full: 'IEEE/ACM International Conference on Automated Software Engineering',
    kind: 'conference',
  },
  siggraph: { short: 'SIGGRAPH', full: 'ACM Transactions on Graphics (SIGGRAPH)', kind: 'journal' },
  tog: { short: 'TOG', full: 'ACM Transactions on Graphics', kind: 'journal' },
  taco: {
    short: 'ACM TACO',
    full: 'ACM Transactions on Architecture and Code Optimization',
    kind: 'journal',
  },
  tecs: {
    short: 'ACM TECS',
    full: 'ACM Transactions on Embedded Computing Systems',
    kind: 'journal',
  },
  jssc: { short: 'IEEE JSSC', full: 'IEEE Journal of Solid-State Circuits', kind: 'journal' },
  ieeemicro: { short: 'IEEE Micro', full: 'IEEE Micro', kind: 'journal' },
  eurompi: { short: 'EuroMPI', full: "European MPI Users' Group Meeting", kind: 'conference' },
  avancees: { short: 'AVANCÉES', full: 'AVANCÉES', kind: 'journal' },
  workshop: { short: 'Workshop', full: 'Workshop', kind: 'workshop' },
};

export function venueShort(key: string): string {
  return VENUES[key]?.short ?? key.toUpperCase();
}

export function venueFull(key: string): string {
  return VENUES[key]?.full ?? key;
}
