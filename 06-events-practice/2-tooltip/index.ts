import { createElement } from "../../shared/utils/create-element";

export default class Tooltip {
	element: HTMLElement;
	private static instance: Tooltip;

	constructor() {
		this.element = createElement(this.template);
		if (Tooltip.instance) {
			return Tooltip.instance;
		}
		Tooltip.instance = this;

		this.initialize();
	}

	initialize() {
		document.body.addEventListener("pointerover", this.pointerOver);
		document.body.addEventListener("pointerout", this.pointerOut);
	}

	private get template() {
		return `
            <div class="tooltip"></div>
        `;
	}
	private pointerOut = () => {
		document.body.removeEventListener("pointermove", this.pointerMove);
		this.element.remove();
	};

	private pointerMove = (event: PointerEvent) => {
		this.element.style.left = `${event.clientX}px`;
		this.element.style.top = `${event.clientY}px`;

		document.body.append(this.element);
	};

	private pointerOver = (event: PointerEvent) => {
		const target = event.target as HTMLElement;

		const attrText = target.dataset.tooltip;

		if (!attrText) return;

		this.element.textContent = attrText;

		this.render(this.element);
	};

	render = (html: HTMLElement | string) => {
		if (!html) {
			html = this.element;
		}
		document.body.append(html);
		document.body.addEventListener("pointermove", this.pointerMove);
	};

	destroy() {
		this.element.remove();
		document.body.removeEventListener("pointerover", this.pointerOver);
		document.body.removeEventListener("pointermove", this.pointerMove);
		document.body.removeEventListener("pointerout", this.pointerOut);
	}
}
