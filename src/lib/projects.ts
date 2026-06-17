export type ProjectStatus = "active" | "past" | "unspecified";

export interface ProjectEntry {
	title: string;
	period?: string;
	description: string;
	tech: string[];
	url?: string;
	status?: ProjectStatus;
}

export function getProjectStatus(project: ProjectEntry): ProjectStatus {
	if (project.status) return project.status;
	if (!project.period) return "unspecified";
	return /\bpresent\b/i.test(project.period) ? "active" : "past";
}
