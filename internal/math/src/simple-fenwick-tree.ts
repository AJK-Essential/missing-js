export class FenwickTree {
  private tree: Float64Array;
  private values!: Float64Array;
  private size: number;

  constructor(size: number) {
    this.size = size;
    this.tree = new Float64Array(size + 1);
  }

  /**
   * Bulk initialization in O(N) time.
   * Perfect for setting all pages to a 'defaultHeight' at startup.
   */
  initAll(heights: Float64Array): void {
    // 1. Fill the values array and a temporary 1-based prefix sum
    this.values = heights;
    for (let i = 0; i < this.size; i++) {
      this.tree[i + 1] = heights[i];
    }

    // 2. The O(N) magic: Each index adds its value to its immediate parent
    for (let i = 1; i <= this.size; i++) {
      let j = i + (i & -i);
      if (j <= this.size) {
        this.tree[j] += this.tree[i];
      }
    }
  }

  /**
   * Updates the height of an item at a specific index.
   * Time Complexity: O(log N)
   */
  update(index: number, newHeight: number): void {
    // 1. Calculate the 'delta' (the change in height)
    // this.values stores the individual heights for each index
    const delta = newHeight - this.values[index];

    // If there's no real change, exit early
    if (delta === 0) return;

    // 2. Update the individual value cache
    this.values[index] = newHeight;

    // 3. Propagate the delta through the Fenwick Tree
    let i = index + 1; // Fenwick Trees are 1-indexed internally
    while (i <= this.size) {
      this.tree[i] += delta;
      i += i & -i; // Move to the next responsible node
    }
  }

  getCumulativeHeight(index: number): number {
    let sum = 0;
    let i = index + 1;
    while (i > 0) {
      sum += this.tree[i];
      i -= i & -i;
    }
    return sum;
  }

  findIndexOfPixel(pixel: number): number {
    if (pixel < 0) return 0;
    let index = 0;
    let currentSum = 0;
    let bitMask = 1 << Math.floor(Math.log2(this.size));

    while (bitMask > 0) {
      const nextIndex = index + bitMask;
      if (
        nextIndex <= this.size &&
        currentSum + this.tree[nextIndex] <= pixel
      ) {
        index = nextIndex;
        currentSum += this.tree[index];
      }
      bitMask >>= 1;
    }
    return index;
  }

  getSingleHeight(index: number): number {
    return this.values[index];
  }
}
