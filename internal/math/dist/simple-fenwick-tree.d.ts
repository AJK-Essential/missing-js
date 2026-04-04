export declare class FenwickTree {
    private tree;
    private values;
    private size;
    constructor(size: number);
    /**
     * Bulk initialization in O(N) time.
     * Perfect for setting all pages to a 'defaultHeight' at startup.
     */
    initAll(heights: Float64Array): void;
    /**
     * Updates the height of an item at a specific index.
     * Time Complexity: O(log N)
     */
    update(index: number, newHeight: number): void;
    getCumulativeHeight(index: number): number;
    findIndexOfPixel(pixel: number): number;
    getSingleHeight(index: number): number;
}
//# sourceMappingURL=simple-fenwick-tree.d.ts.map