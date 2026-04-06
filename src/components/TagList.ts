import { MemoDataStore } from "../store";
import { TagTreeNode } from "../types";

export class TagList {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private onTagSelect: (tag: string | null) => void;
    private unsubscribe: (() => void) | null = null;
    private collapsedPaths: Set<string> = new Set();

    constructor(
        container: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
        onTagSelect: (tag: string | null) => void,
    ) {
        this.container = container;
        this.store = store;
        this.i18n = i18n;
        this.onTagSelect = onTagSelect;
        this.container.className = "day-memo__tag-list";
        this.unsubscribe = this.store.subscribe(() => this.render());
        this.render();
    }

    render(): void {
        this.container.innerHTML = "";
        const tree = this.store.getTagTree();
        const currentFilter = this.store.getFilter();

        if (tree.length === 0) return;

        const header = document.createElement("div");
        header.className = "day-memo__tag-list-header";
        header.textContent = this.i18n.tags;
        this.container.appendChild(header);

        const list = document.createElement("div");
        list.className = "day-memo__tag-tree";
        this.renderNodes(list, tree, currentFilter.selectedTag, 0);
        this.container.appendChild(list);
    }

    private renderNodes(
        parent: HTMLElement,
        nodes: TagTreeNode[],
        selectedTag: string | null,
        depth: number,
    ): void {
        for (const node of nodes) {
            const hasChildren = node.children.length > 0;
            const isCollapsed = this.collapsedPaths.has(node.fullPath);
            const subtreeCount = this.store.getSubtreeCount(node);
            const isActive = selectedTag === node.fullPath;

            const row = document.createElement("div");
            row.className = "day-memo__tag-tree-row";
            if (isActive) row.classList.add("day-memo__tag-tree-row--active");
            row.style.paddingLeft = `${depth * 16 + 4}px`;

            if (hasChildren) {
                const toggle = document.createElement("span");
                toggle.className = "day-memo__tag-tree-toggle";
                toggle.textContent = isCollapsed ? "▶" : "▼";
                toggle.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (isCollapsed) {
                        this.collapsedPaths.delete(node.fullPath);
                    } else {
                        this.collapsedPaths.add(node.fullPath);
                    }
                    this.render();
                });
                row.appendChild(toggle);
            } else {
                const spacer = document.createElement("span");
                spacer.className = "day-memo__tag-tree-spacer";
                row.appendChild(spacer);
            }

            const label = document.createElement("span");
            label.className = "day-memo__tag-tree-label";
            label.textContent = depth === 0 ? `#${node.name}` : node.name;
            row.appendChild(label);

            const count = document.createElement("span");
            count.className = "day-memo__tag-tree-count";
            count.textContent = String(subtreeCount);
            row.appendChild(count);

            row.addEventListener("click", () => {
                this.onTagSelect(isActive ? null : node.fullPath);
            });

            parent.appendChild(row);

            if (hasChildren && !isCollapsed) {
                this.renderNodes(parent, node.children, selectedTag, depth + 1);
            }
        }
    }

    destroy(): void {
        this.unsubscribe?.();
        this.container.innerHTML = "";
    }
}
