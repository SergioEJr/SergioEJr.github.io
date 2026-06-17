/**
 * Scholar Pages - Site Configuration
 * ================================
 * This file contains all configuration options for your academic website.
 * Simply fill in your information below to personalize your site.
 *
 * 📖 Documentation: https://github.com/jxpeng98/astro-theme-scholars
 */

import type { SiteConfig } from './types/config';

// ============================================================================
// YOUR CONFIGURATION - Edit the values below
// ============================================================================

export const siteConfig: SiteConfig = {
	// ---------------------------------------------------------------------------
	// 🏠 BASIC INFORMATION
	// ---------------------------------------------------------------------------

	/** Site title shown in browser tab */
	title: 'Sergio Eraso',

	/** Your full name */
	author: 'Sergio Eraso',

	/** Brief description for SEO (appears in search results) */
	description:
		'Sergio Eraso — physicist working on nonequilibrium statistical physics and biophysics, building models, simulations, and tools for complex systems.',

	/** Path to favicon in /public directory */
	favicon: '/favicon.svg',

	/** Keywords for SEO */
	keywords: [
		'Sergio Eraso',
		'statistical physics',
		'biophysics',
		'active matter',
		'stochastic simulation',
		'modeling',
		'MIT',
	],

	// ---------------------------------------------------------------------------
	// 🎓 ACADEMIC PROFILE
	// ---------------------------------------------------------------------------

	/** Your current academic affiliations */
	affiliations: [
		{
			role: 'PhD Student in Physics',
			department: 'Department of Physics',
			institution: 'MIT',
			url: 'https://physics.mit.edu/',
		},
	],

	/** Your research interests (displayed as tags on home page) */
	researchInterests: [
		'Nonequilibrium statistical physics',
		'Biophysics',
		'Active matter',
		'Stochastic processes',
		'Scientific computing',
	],

	// ---------------------------------------------------------------------------
	// 🔗 SOCIAL & CONTACT LINKS
	// Find icons at: https://icones.js.org
	// Academic icons: 'academicons' collection | General: 'mdi' collection
	// ---------------------------------------------------------------------------
	socialLinks: [
		{
			label: 'GitHub',
			href: 'https://github.com/SergioEJr',
			icon: 'i-mdi:github',
		},
		{
			label: 'LinkedIn',
			href: 'https://www.linkedin.com/in/sergio-eraso-jr/',
			icon: 'i-mdi:linkedin',
		},
		{
			label: 'Email',
			href: 'mailto:sergioerasojr@gmail.com',
			icon: 'i-mdi:email-outline',
		},
		// Add more when you want them, e.g.:
		// { label: 'Google Scholar', href: 'https://scholar.google.com/...', icon: 'i-academicons:google-scholar' },
		// { label: 'ORCID', href: 'https://orcid.org/...', icon: 'i-academicons:orcid' },
	],

	// ---------------------------------------------------------------------------
	// 🧭 NAVIGATION
	// ---------------------------------------------------------------------------
	navLinks: [
		{ href: '/about', label: 'About' },
		{ href: '/researches', label: 'Research' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/teaching', label: 'Teaching' },
		{ href: '/posts', label: 'Blog' },
	],

	// ---------------------------------------------------------------------------
	// 📝 FOOTER
	// ---------------------------------------------------------------------------
	footer: {
		copyright: 'All rights reserved.',
	},

	// ---------------------------------------------------------------------------
	// 🏠 HERO SECTION (Home Page)
	// ---------------------------------------------------------------------------
	hero: {
		/** Main headline - your research focus in one sentence */
		headline:
			'I build models, simulations, and tools to make sense of complex, noisy systems.',

		/** Detailed bio/description */
		subheadline:
			'I am a PhD student in physics at MIT working on nonequilibrium statistical physics and biophysics. I study how simple, local rules give rise to predictable large-scale behavior in living systems — using mathematical modeling, stochastic simulation, and statistical inference. I am increasingly applying that toolkit to problems beyond academia.',

		/** Alt text for profile image (for accessibility) */
		profileAlt: 'Portrait of Sergio Eraso',

		/** Profile image: use '/image.jpg' for public folder, or full URL */
		profileImage: '/profile.svg',

		/** Optional: Profile image dimensions in pixels */
		profileImageHeight: 160,
		profileImageWidth: 160,

		/** Optional: Status badge (e.g., "Open to collaboration", "PhD Candidate") */
		statusBadge: 'Open to opportunities',
	},

	// ---------------------------------------------------------------------------
	// 📄 PAGE TITLES AND DESCRIPTIONS
	// These appear as titles and subtitles on each page and in SEO meta tags
	// ---------------------------------------------------------------------------
	pageTitles: {
		about: {
			title: 'About',
			description:
				'Physicist, builder, and educator focused on modeling, simulation, and turning messy data into clear answers.',
		},
		researches: {
			title: 'Research',
			description:
				'Work in nonequilibrium statistical physics and biophysics — finding the simple, universal rules behind complex collective behavior.',
		},
		projects: {
			title: 'Projects',
			description: 'Tools, teaching, and experiments I have built.',
		},
		teaching: {
			title: 'Teaching',
			description:
				'Teaching and mentoring — making technical ideas accessible to a wide range of learners.',
		},
		posts: {
			title: 'Blog',
			description:
				'Notes on modeling, simulation, projects, and moving from academia toward industry.',
		},
	},

	// ---------------------------------------------------------------------------
	// 🏠 HOME PAGE BLOCKS
	// Customize titles and descriptions for sections on the home page
	// ---------------------------------------------------------------------------
	homeBlocks: {
		publications: {
			title: 'Selected Research',
			description: 'Recent work and contributions',
		},
		posts: {
			title: 'Latest Posts',
			description: 'Thoughts and updates',
		},
	},
};

export default siteConfig;
