
import { createElement } from "../../shared/utils/create-element";

interface Options {
	data?: number[];
	label?: string;
	value?: number;
	link?: string;
	formatHeading?: (data: number) => string;
}

export default class ColumnChart {
	public element: HTMLElement;
	private elementContainer: string = '[data-element="body"]';
	chartHeight: number = 50;

	constructor(private props: Options = { data: [], label: "", value: 0 }) {
		this.element = createElement(this.chartContent());
	}

	private chartContent() {
		const { data = [], label, link, value = 0, formatHeading } = this.props;

		const isLoadingData = !data?.length ? "column-chart_loading" : "";
		const hasLinkInChart = link
			? `<a class="column-chart__link" href="${link}">View all</a>`
			: "";
		const chartValue = formatHeading ? formatHeading(value) : value;

		const chartElements = this.dataHandler(data);

		const content = `
			<div class="column-chart ${isLoadingData}">
				<div class="column-chart__title">${label}${hasLinkInChart}</div>
				<div class="column-chart__container">
					<div class="column-chart__header" data-element="header">${chartValue}</div>
					<div class="column-chart__chart" data-element="body">
						${chartElements}
					</div>
				</div>
			</div>
		`;

		return content;
	}

	private dataHandler(data: number[]) {
		if (!data || !data.length) return "";
		const maxValue = Math.max(...data);
		const scale = this.chartHeight / maxValue;

		const chartElements = data
			.map((chartValue) => {
				const scaleChartValue = Math.floor(chartValue * scale);
				const percentChartValue =
					((chartValue / maxValue) * 100).toFixed(0) + "%";

				return `<div style="--value: ${scaleChartValue}" data-tooltip="${percentChartValue}"></div>`;
			})
			.join("");

		return chartElements;
	}

	update(data: number[]) {
		const chartElements = this.dataHandler(data);
		const chartContainer = this.element.querySelector(this.elementContainer);

		if (!chartContainer) {
			throw new Error("The chart is missing");
		}

		chartContainer.innerHTML = "";
		chartContainer.insertAdjacentHTML("beforeend", chartElements);
	}
	remove() {
		this.element.remove();
	}
	destroy() {
		this.element.remove();
	}

}
