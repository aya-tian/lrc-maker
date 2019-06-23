"use strict";
const details = document.createElement("details");
const polyfilldetails = () => {
    const prototype = details.constructor.prototype;
    const open = Object.getOwnPropertyDescriptor(prototype, "open");
    Object.defineProperties(prototype, {
        open: {
            get() {
                if (this.tagName === "DETAILS") {
                    return this.hasAttribute("open");
                }
                else {
                    if (open && open.get) {
                        return open.get.call(this);
                    }
                }
            },
            set(value) {
                if (this.tagName === "DETAILS") {
                    if (value !== this.hasAttribute("open")) {
                        const event = document.createEvent("Event");
                        event.initEvent("toggle", false, false);
                        this.dispatchEvent(event);
                    }
                    return value ? this.setAttribute("open", "") : this.removeAttribute("open");
                }
                else {
                    if (open && open.set) {
                        return open.set.call(this, value);
                    }
                }
            },
        },
    });
    document.addEventListener("click", (event) => {
        const element = event.target;
        const summary = element.closest("summary");
        if (summary === null || summary.parentElement === null || summary.parentElement.tagName !== "DETAILS") {
            return;
        }
        const parentElement = summary.parentElement;
        parentElement.open = !parentElement.open;
    });
};
if (!("open" in details)) {
    polyfilldetails();
}
//# sourceMappingURL=details-summary.js.map