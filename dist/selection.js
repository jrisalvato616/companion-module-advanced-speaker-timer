"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapIndex = exports.PresetSelection = void 0;
class PresetSelection {
    constructor() {
        this.items = [];
        this.index = 0;
    }
    /**
     * Keeps the same preset highlighted when the list is reordered. If it was
     * deleted, clamp to the nearest remaining position.
     */
    setItems(items) {
        var _a;
        const selectedId = (_a = this.current) === null || _a === void 0 ? void 0 : _a.id;
        const selectedIndex = selectedId === undefined ? -1 : items.findIndex(item => item.id === selectedId);
        this.items = items;
        this.index = selectedIndex >= 0 ? selectedIndex : Math.max(0, Math.min(this.index, items.length - 1));
    }
    /** Scrolls, wrapping past either end. */
    move(step) {
        this.index = wrapIndex(this.index + step, this.items.length);
    }
    get all() {
        return this.items;
    }
    get current() {
        return this.items[this.index];
    }
    /** "2/7", or "0/0" before the app has sent its presets. */
    get position() {
        return this.items.length ? `${this.index + 1}/${this.items.length}` : '0/0';
    }
}
exports.PresetSelection = PresetSelection;
function wrapIndex(index, length) {
    if (length <= 0)
        return 0;
    return ((index % length) + length) % length;
}
exports.wrapIndex = wrapIndex;
//# sourceMappingURL=selection.js.map