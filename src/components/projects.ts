import projectsRaw from '../data/projects.yml?raw';
import { parse } from 'yaml';
import type { ProjectEntry } from '../lib/projects';

export const projects = parse(projectsRaw) as ProjectEntry[];
