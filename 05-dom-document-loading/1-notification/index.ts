import { createElement } from "../../shared/utils/create-element";

interface Options {
	duration?: number;
	type?: "success" | "error";
}

export default class NotificationMessage {
	static activeNotificationMessage: NotificationMessage | null = null;
	private timer: ReturnType<typeof setTimeout> | null = null;
	element: HTMLElement;
	constructor(
		private message: string,
		private props: Options = {},
	) {
		this.element = createElement(this.render());
		if (NotificationMessage.activeNotificationMessage) {
			NotificationMessage.activeNotificationMessage.remove();
		}
		NotificationMessage.activeNotificationMessage = this;
	}

	private render(): string {
		const { duration = 2000, type = "success" } = this.props;

		const isSuccess = type === "success" ? "success" : "error";

		return `
			<div class="notification ${isSuccess}" data-element="notification" style="--value: ${duration / 1000}s">
				<div class="timer"></div>
				<div class="inner-wrapper">
				<div class="notification-header" data-element="notification-header">Notification</div>
				<div class="notification-body" data-element="notification-body">${this.message}</div>
				</div>
			</div>
			`;
	}

	show(target: HTMLElement = document.body) {
		if (!target) throw new Error("The target is missing");

		target.append(this.element);

		this.clearTimeout();

		this.timer = setTimeout(() => {
			this.remove();
		}, this.props.duration);
	}
	private clearTimeout() {
		if (this.timer) {
			clearTimeout(this.timer);
		}
	}
	remove() {
		this.element.remove();
	}
	destroy() {
		this.element.remove();
		this.clearTimeout();
		NotificationMessage.activeNotificationMessage = null;
	}
}
