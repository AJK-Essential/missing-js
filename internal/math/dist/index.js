class h {
  constructor(e) {
    this.size = e, this.tree = new Float64Array(e + 1);
  }
  /**
   * Bulk initialization in O(N) time.
   * Perfect for setting all pages to a 'defaultHeight' at startup.
   */
  initAll(e) {
    this.values = e;
    for (let t = 0; t < this.size; t++)
      this.tree[t + 1] = e[t];
    for (let t = 1; t <= this.size; t++) {
      let i = t + (t & -t);
      i <= this.size && (this.tree[i] += this.tree[t]);
    }
  }
  /**
   * Updates the height of an item at a specific index.
   * Time Complexity: O(log N)
   */
  update(e, t) {
    const i = t - this.values[e];
    if (i === 0) return;
    this.values[e] = t;
    let s = e + 1;
    for (; s <= this.size; )
      this.tree[s] += i, s += s & -s;
  }
  getCumulativeHeight(e) {
    let t = 0, i = e + 1;
    for (; i > 0; )
      t += this.tree[i], i -= i & -i;
    return t;
  }
  findIndexOfPixel(e) {
    if (e < 0) return 0;
    let t = 0, i = 0, s = 1 << Math.floor(Math.log2(this.size));
    for (; s > 0; ) {
      const r = t + s;
      r <= this.size && i + this.tree[r] <= e && (t = r, i += this.tree[t]), s >>= 1;
    }
    return t;
  }
  getSingleHeight(e) {
    return this.values[e];
  }
}
export {
  h as FenwickTree
};
//# sourceMappingURL=index.js.map
