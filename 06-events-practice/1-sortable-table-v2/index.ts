import { createElement } from "../../shared/utils/create-element";

type SortOrder = "asc" | "desc";

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
	id: string;
	order: SortOrder;
};

interface SortableTableHeader {
	id: string;
	title: string;
	sortable?: boolean;
	sortType?: "string" | "number" | "custom";
	template?: (value: string | number) => string;
	customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
	data?: SortableTableData[];
	sorted?: SortableTableSort;
	isSortLocally?: boolean;
}

export default class SortableTable {
	element: HTMLElement;
	private bodyContainer: string = '[data-element="body"]';
	private activeAttributeOnHeader: HTMLElement | null = null;
	private collator: Intl.Collator = new Intl.Collator(["ru", "en"], {
		caseFirst: "upper",
	});
	isSortLocally = true;

	constructor(
		private headersConfig: SortableTableHeader[] = [],
		private props: Options = { isSortLocally: true },
	) {
		this.element = createElement(this.render());
		this.initEventListeners();
	}

	private render(): string {
		const { data = [] } = this.props;
		return `
			<div class="sortable-table">
				<div class="sortable-table__header sortable-table__row" data-element="header">
				${this.tableHeaderRender()}
				</div>
				<div class="sortable-table__body" data-element="body">
				${this.rowBodyRender(data)}
				</div>
			</div>
			`;
	}

	private tableHeaderRender() {
		return this.headersConfig
			.map(({ title, sortType, sortable, id }) => {
				const hasSortType = sortType ? `data-sort-type="${sortType}"` : "";
				const isSortable = sortable !== false ? "data-sortable" : "";
				return `
          <div class="sortable-table__cell sort-arrow" ${hasSortType} data-id="${id}" ${isSortable}>
            <span>${title}</span>
			<span class="sortable-table__sort-arrow" data-element="arrow">
                  <span class="sort-arrow"></span>
			</span>
          </div>
        `;
			})
			.join("");
	}

	private rowBodyRender(data: SortableTableData[]) {
		return data
			.map((product) => {
				const cells = this.headersConfig
					.map((header) => {
						if (header.template) {
							return header.template(product[header.id]);
						}

						return `
						<div class="sortable-table__cell"">${product[header.id]}</div>`;
					})
					.join("");

				return `<div class="sortable-table__row">${cells}</div>`;
			})
			.join("");
	}

	sort(event: PointerEvent) {
		const target = event.target as HTMLElement;

		if (!target.closest("[data-sortable]")) return;

		const headerId =
			target.dataset.id || target.closest("[data-id]")?.getAttribute("data-id");

		if (!headerId) return;

		const currentSort = this.props.sorted;
		const currentOrder = currentSort?.order === "asc" ? "desc" : "asc";

		this.props.sorted = {
			id: headerId,
			order: currentOrder as SortOrder,
		};

		if (this.isSortLocally) {
			this.sortOnClient(headerId, this.props.sorted.order);
		} else {
			this.sortOnServer();
		}
	}

	sortOnClient(field: SortableTableHeader["id"], order: SortOrder) {
		const { data = [] } = this.props;
		const header = this.headersConfig.find((header) => header.id === field);
		if (!header?.sortable) throw new Error("The cell cannot be sorted");

		let sortedData: SortableTableData[];

		const isAscOrder = order === "asc" ? 1 : -1;

		if (header?.sortType === "number") {
			sortedData = [...data].sort(
				(a, b) => ((a[field] as number) - (b[field] as number)) * isAscOrder,
			);
		} else {
			sortedData = [...data].sort(
				(a, b) =>
					this.collator.compare(a[field] as string, b[field] as string) *
					isAscOrder,
			);
		}
		this.setOrderAttr(header.id, order);
		const bodyElements = this.rowBodyRender(sortedData);

		const tableBodyContainer = this.element.querySelector(this.bodyContainer);
		if (!tableBodyContainer) {
			throw new Error("The table container is missing");
		}
		tableBodyContainer.innerHTML = "";
		tableBodyContainer.insertAdjacentHTML("beforeend", bodyElements);
	}
	private setOrderAttr(headerTitle: string, order: SortOrder) {
		if (this.activeAttributeOnHeader) {
			this.activeAttributeOnHeader.removeAttribute("data-order");
		}
		const sortHeaderElement: HTMLElement | null = this.element.querySelector(
			`[data-id="${headerTitle}"]`,
		);
		if (!sortHeaderElement) {
			throw new Error("The header is missing");
		}
		sortHeaderElement.dataset.order = order;
		this.activeAttributeOnHeader = sortHeaderElement;
	}
	sortOnServer() {}

	private initEventListeners() {
		this.element.addEventListener("pointerdown", this.sort.bind(this));
	}
	remove() {
		this.element.remove();
		this.activeAttributeOnHeader = null;
	}
	destroy() {
		this.element.remove();
		this.activeAttributeOnHeader = null;
		this.element.removeEventListener("pointerdown", this.sort.bind(this));
	}
}
