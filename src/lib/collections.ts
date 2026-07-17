/**
 * Async layer over Astro content collections. Loads and shapes typed data,
 * resolves cross-references (author -> person, software <-> publications), and
 * decides which people get standalone detail pages.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../config/site';
import { sortPeople } from './people';
import { sortPublications, type PubRecord } from './publications';

export type PubData = CollectionEntry<'publications'>['data'];
export type Pub = { id: string } & PubData;

export type PersonData = CollectionEntry<'people'>['data'];
export type Person = { id: string; hasDetail: boolean; hasBio: boolean } & PersonData;

export type SoftwareData = CollectionEntry<'software'>['data'];
export type Software = { id: string } & SoftwareData;

/* ------------------------------ publications ----------------------------- */

function toPub(entry: CollectionEntry<'publications'>): Pub {
  return { id: entry.id, ...entry.data };
}

export async function loadPublications(): Promise<Pub[]> {
  const entries = await getCollection('publications');
  return sortPublications(entries.map(toPub) as PubRecord[]) as Pub[];
}

export async function loadFeaturedPublications(limit?: number): Promise<Pub[]> {
  const pubs = (await loadPublications()).filter((p) => p.featured);
  return typeof limit === 'number' ? pubs.slice(0, limit) : pubs;
}

/* --------------------------------- people -------------------------------- */

function toPerson(entry: CollectionEntry<'people'>): Person {
  const hasBio = Boolean(entry.body && entry.body.trim().length > 0);
  const hasDetail = SITE.features.personDetailPages && (entry.data.category === 'pi' || hasBio);
  return { id: entry.id, hasDetail, hasBio, ...entry.data };
}

export async function loadPeople(): Promise<Person[]> {
  const entries = await getCollection('people');
  return sortPeople(entries.map(toPerson));
}

export async function loadPeopleByCategory(): Promise<Record<string, Person[]>> {
  const people = await loadPeople();
  const groups: Record<string, Person[]> = { pi: [], phd: [], member: [], alumni: [] };
  for (const p of people) (groups[p.category] ??= []).push(p);
  return groups;
}

export async function peopleMap(): Promise<Map<string, Person>> {
  const people = await loadPeople();
  return new Map(people.map((p) => [p.id, p]));
}

/* -------------------------------- software ------------------------------- */

function toSoftware(entry: CollectionEntry<'software'>): Software {
  return { id: entry.id, ...entry.data };
}

export async function loadSoftware(): Promise<Software[]> {
  const entries = await getCollection('software');
  return entries.map(toSoftware).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function loadFeaturedSoftware(limit?: number): Promise<Software[]> {
  const sw = (await loadSoftware()).filter((s) => s.featured);
  return typeof limit === 'number' ? sw.slice(0, limit) : sw;
}

export async function softwareMap(): Promise<Map<string, Software>> {
  const sw = await loadSoftware();
  return new Map(sw.map((s) => [s.id, s]));
}

/* ------------------------------ cross-links ------------------------------ */

export interface AuthorLink {
  name: string;
  /** Internal person id if this author is a lab member with a detail page. */
  href?: string;
  /** True when href points to an internal person page. */
  internal: boolean;
  isPI: boolean;
}

/**
 * Resolve the best link for an author name in a byline.
 * Prefers an internal person page, then the person's external website,
 * then the legacy external URL. Returns no href when nothing is known.
 */
export function resolveAuthor(
  author: { name: string; id?: string; url?: string },
  people: Map<string, Person>
): AuthorLink {
  const isPI = author.id === SITE.pi.personId;
  if (author.id) {
    const person = people.get(author.id);
    if (person?.hasDetail) {
      return { name: author.name, href: `/people/${person.id}`, internal: true, isPI };
    }
    if (person?.website) {
      return { name: author.name, href: person.website, internal: false, isPI };
    }
    if (person?.linkedin) {
      return { name: author.name, href: person.linkedin, internal: false, isPI };
    }
  }
  if (author.url) {
    return { name: author.name, href: author.url, internal: false, isPI };
  }
  return { name: author.name, internal: false, isPI };
}
