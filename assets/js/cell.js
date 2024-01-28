class Cell {
  constructor(isCollapse, options) {
    this.isCollapse = isCollapse;
    this.options = options;
  }

  setOptions(input) {
    this.options = input;
  }

  getOptions() {
    return this.options;
  }

  setCollapse(input) {
    this.isCollapse = input;
  }
  clone() {
    return new Cell(this.isCollapse, this.options);
  }
  removeRotation(tile, rotation) {
    const index = this.getTileIndex(tile.structure);

    const newOP = this.options[index].rotation.filter(
      (number) => number !== rotation
    );
    this.options[index].rotation = newOP;

    if (this.options[index].rotation.length == 0) {
      this.options[index] = "NONE";
    }
  }

  getTileIndex(struct) {
    for (let i = 0; i < this.options.length; i++) {
      const currentTile = this.options[i];
      if (currentTile == undefined) {
        continue;
      }
      if (this.arraysAreEqual(currentTile.structure, struct)) {
        return i;
      }
    }
    return undefined;
  }

  arraysAreEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }

  isCollapse() {
    return this.isCollapse === true;
  }
}
export default Cell;
