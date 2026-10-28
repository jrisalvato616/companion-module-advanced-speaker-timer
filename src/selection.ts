/**
 * The preset a rotary has scrolled to, and the text for the little display
 * above the knob. Kept apart from the Companion plumbing so it can be tested.
 */
export interface PresetInfo {
    id: string
    name: string
    /** Timer presets only. */
    duration?: number
}

export class PresetSelection {
    private items: PresetInfo[] = []
    private index = 0

    /**
     * Keeps the same preset highlighted when the list is reordered. If it was
     * deleted, clamp to the nearest remaining position.
     */
    setItems(items: PresetInfo[]): void {
        const selectedId = this.current?.id
        const selectedIndex = selectedId === undefined ? -1 : items.findIndex(item => item.id === selectedId)
        this.items = items
        this.index = selectedIndex >= 0 ? selectedIndex : Math.max(0, Math.min(this.index, items.length - 1))
    }

    /** Scrolls, wrapping past either end. */
    move(step: number): void {
        this.index = wrapIndex(this.index + step, this.items.length)
    }

    get all(): PresetInfo[] {
        return this.items
    }

    get current(): PresetInfo | undefined {
        return this.items[this.index]
    }

    /** "2/7", or "0/0" before the app has sent its presets. */
    get position(): string {
        return this.items.length ? `${this.index + 1}/${this.items.length}` : '0/0'
    }
}

export function wrapIndex(index: number, length: number): number {
    if (length <= 0) return 0
    return ((index % length) + length) % length
}
