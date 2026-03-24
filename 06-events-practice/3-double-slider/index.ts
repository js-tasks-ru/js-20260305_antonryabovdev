import { createElement } from "../../shared/utils/create-element";

type DoubleSliderSelected = {
	from: number;
	to: number;
};

interface Options {
	min?: number;
	max?: number;
	formatValue?: (value: number) => string;
	selected?: DoubleSliderSelected;
}

export default class DoubleSlider {
	element: HTMLElement;
	min: number;
	max: number;

	private maxDefaultValue: number = 200;
	private thumbLeft: HTMLElement | null;
	private thumbRight: HTMLElement | null;
	private progress: HTMLElement | null;
	private fromElement: HTMLElement | null;
	private toElement: HTMLElement | null;
	private activeThumb: HTMLElement | null = null;
	private maxPercent: number = 100;
	private selected: DoubleSliderSelected;

	constructor(private props: Options = { min: 0, max: 200 }) {
		const min = props.min ?? 0;
		const max = props.max ?? this.maxDefaultValue;

		this.min = min;
		this.max = max;

		const from = props.selected?.from ?? min;
		const to = props.selected?.to ?? max;

		this.selected = { from, to };

		this.element = createElement(this.template);

		this.thumbLeft = this.element.querySelector('[data-element="thumbLeft"]');
		this.thumbRight = this.element.querySelector('[data-element="thumbRight"]');
		this.progress = this.element.querySelector('[data-element="progress"]');
		this.fromElement = this.element.querySelector('[data-element="from"]');
		this.toElement = this.element.querySelector('[data-element="to"]');

		if (!this.thumbLeft || !this.thumbRight || !this.progress) {
			throw new Error("Thumbs or progress is missing");
		}

		this.initEvents();
		this.updateView();
	}

	private initEvents() {
		this.thumbLeft?.addEventListener("pointerdown", this.onLeftDown);
		this.thumbRight?.addEventListener("pointerdown", this.onRightDown);
	}

	private getRange() {
		const diff = this.max - this.min;
		return diff === 0 ? 1 : diff;
	}

	private valueToPercent(value: number) {
		const range = this.getRange();
		return ((value - this.min) / range) * 100;
	}

	private percentToValue(percent: number) {
		const range = this.getRange();
		return this.min + (range * percent) / 100;
	}

	private onPointerUp = () => {
		if (this.activeThumb) {
			const customEvent = new CustomEvent("range-select", {
				bubbles: true,
				detail: {
					from: this.selected.from,
					to: this.selected.to,
				},
			});

			this.element.dispatchEvent(customEvent);
		}

		document.removeEventListener("pointermove", this.onPointerMove);
		document.removeEventListener("pointerup", this.onPointerUp);
		this.activeThumb = null;
	};

	private onPointerMove = (event: PointerEvent) => {
		if (!this.activeThumb) return;

		const inner = this.element.querySelector(
			'[data-element="inner"]',
		) as HTMLElement;
		const rect = inner.getBoundingClientRect();

		const x = event.clientX - rect.left;
		let percent = (x / rect.width) * 100;

		if (percent < 0) percent = 0;
		if (percent > this.maxPercent) percent = this.maxPercent;

		const value = Math.round(this.percentToValue(percent));

		if (this.activeThumb === this.thumbLeft) {
			const newFrom = Math.min(value, this.selected.to);
			this.selected.from = newFrom;
		} else if (this.activeThumb === this.thumbRight) {
			const newTo = Math.max(value, this.selected.from);
			this.selected.to = newTo;
		}

		this.updateView();
	};

	private onLeftDown = (event: PointerEvent) => {
		event.preventDefault();

		if (!this.thumbLeft) return;

		this.activeThumb = this.thumbLeft;

		document.addEventListener("pointermove", this.onPointerMove);
		document.addEventListener("pointerup", this.onPointerUp);
	};

	private onRightDown = (event: PointerEvent) => {
		event.preventDefault();

		if (!this.thumbRight) return;

		this.activeThumb = this.thumbRight;

		document.addEventListener("pointermove", this.onPointerMove);
		document.addEventListener("pointerup", this.onPointerUp);
	};

	private updateView() {
		const leftPercent = this.valueToPercent(this.selected.from);
		const rightPercent = this.valueToPercent(this.selected.to);

		if (this.thumbLeft) {
			this.thumbLeft.style.left = leftPercent + "%";
		}

		if (this.thumbRight) {
			this.thumbRight.style.right = this.maxPercent - rightPercent + "%";
		}

		if (this.progress) {
			this.progress.style.left = leftPercent + "%";
			this.progress.style.right = this.maxPercent - rightPercent + "%";
		}

		if (this.fromElement) {
			this.fromElement.textContent = this.getFormattedValue(this.selected.from);
		}

		if (this.toElement) {
			this.toElement.textContent = this.getFormattedValue(this.selected.to);
		}
	}

	private getFormattedValue(value: number) {
		if (this.props.formatValue) {
			return this.props.formatValue(value);
		}

		return String(value);
	}

	destroy() {
		this.thumbLeft?.removeEventListener("pointerdown", this.onLeftDown);
		this.thumbRight?.removeEventListener("pointerdown", this.onRightDown);
		document.removeEventListener("pointermove", this.onPointerMove);
		document.removeEventListener("pointerup", this.onPointerUp);
		this.element.remove();
	}

	private get template() {
		const min = this.min ?? 0;
		const max = this.max ?? this.maxDefaultValue;

		const from = this.selected?.from ?? min;
		const to = this.selected?.to ?? max;

		const fromLabel = this.getFormattedValue(from);
		const toLabel = this.getFormattedValue(to);

		const leftPercent = this.valueToPercent(from);
		const rightPercent = this.valueToPercent(to);

		return `
      <div class="range-slider">
        <span class="from" data-element="from">${fromLabel}</span>
        <div class="range-slider__inner" data-element="inner">
          <span class="range-slider__progress" data-element="progress" style="left: ${leftPercent}%; right: ${this.maxPercent - rightPercent}%;"></span>
          <span class="range-slider__thumb-left" style="left: ${leftPercent}%;" data-element="thumbLeft"></span>
          <span class="range-slider__thumb-right" style="right: ${this.maxPercent - rightPercent}%;" data-element="thumbRight"></span>
        </div>
        <span class="to" data-element="to">${toLabel}</span>
      </div>
    `;
	}
}
