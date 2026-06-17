function toggleClasses(element: Element, enabled: boolean, classes: string[]) {
	for (const className of classes) {
		element.classList.toggle(className, enabled);
	}
}

function setActiveButton(buttons: NodeListOf<HTMLElement>, activeButton: HTMLElement) {
	buttons.forEach((button) => {
		const isActive = button === activeButton;
		const spans = button.querySelectorAll("span");

		button.dataset.active = String(isActive);
		button.setAttribute("aria-pressed", String(isActive));
		button.classList.toggle("active", isActive);
		toggleClasses(button, isActive, ["bg-accent-100", "dark:bg-accent-900/30"]);
		toggleClasses(button, !isActive, ["bg-gray-100", "dark:bg-gray-800"]);

		if (spans[0]) {
			toggleClasses(spans[0], isActive, ["text-accent-600", "dark:text-accent-400"]);
			toggleClasses(spans[0], !isActive, ["text-gray-500", "dark:text-gray-400"]);
		}
		if (spans[1]) {
			toggleClasses(spans[1], isActive, ["text-accent-700", "dark:text-accent-300"]);
			toggleClasses(spans[1], !isActive, ["text-gray-700", "dark:text-gray-300"]);
		}
		if (spans[2]) {
			toggleClasses(spans[2], isActive, ["text-accent-600", "dark:text-accent-400"]);
			toggleClasses(spans[2], !isActive, ["text-gray-500", "dark:text-gray-400"]);
		}
	});
}

export function setupFilterControls(root: ParentNode = document) {
	const buttons = root.querySelectorAll<HTMLElement>("[data-filter]");
	const sections = root.querySelectorAll<HTMLElement>("[data-filter-section]");
	const initialButton =
		root.querySelector<HTMLElement>("[data-filter][data-active='true']") ??
		root.querySelector<HTMLElement>("[data-filter][aria-pressed='true']") ??
		root.querySelector<HTMLElement>("[data-filter].active");

	if (initialButton) {
		setActiveButton(buttons, initialButton);
	}

	buttons.forEach((button) => {
		button.addEventListener("click", () => {
			const filter = button.dataset.filter;
			if (!filter) return;

			setActiveButton(buttons, button);

			sections.forEach((section) => {
				const visible = filter === "all" || section.dataset.filterSection === filter;
				section.hidden = !visible;
				section.classList.toggle("hidden", !visible);
			});
		});
	});
}

export function setupAbstractToggles(root: ParentNode = document) {
	root.querySelectorAll<HTMLButtonElement>("[data-abstract-toggle]").forEach((toggle) => {
		toggle.addEventListener("click", () => {
			const targetId = toggle.dataset.target;
			if (!targetId) return;

			const abstract = document.getElementById(targetId);
			if (!abstract) return;

			const expanded = toggle.getAttribute("aria-expanded") === "true";
			const nextExpanded = !expanded;
			toggle.setAttribute("aria-expanded", String(nextExpanded));
			abstract.hidden = !nextExpanded;
			abstract.classList.toggle("hidden", !nextExpanded);
			toggle
				.querySelector("[data-abstract-icon]")
				?.classList.toggle("rotate-180", nextExpanded);
		});
	});
}
