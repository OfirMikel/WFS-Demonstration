import Tile from "./tile.js";
import Cell from "./cell.js";

class WaveFunction {
  constructor(cellAmount, options) {
    this.cellAmount = cellAmount;
    this.options = options;
  }
  run() {
    let matrix = this.createMatrix();
    let position = this.setRandomSeed(matrix);
    for (let i = 0; i < this.cellAmount * this.cellAmount - 1; i++) {
      this.sleep(70).then(() => {
        this.options = this.calculateOptions(matrix);
        this.collapseNextCell(matrix);
      });
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getBestOption() {
    for (let i = 0; i < this.options.length; i++) {
      if (this.options[i].options.length !== 0) {
        return this.options[i];
      }
    }
  }

  howManyCollapsed(matrix) {
    let amount = 0;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix.length; j++) {
        if (matrix[i][j].isCollapse) {
          amount++;
        }
      }
    }
    return amount;
  }

  collapseNextCell(matrix) {
    const options = this.getBestOption();
    const howManyCollapsed = this.howManyCollapsed(matrix);
    if (options === undefined && howManyCollapsed + 1 != this.cellAmount * this.cellAmount) {
      this.options = undefined;
      return;
    }
    const row = options.position[0];
    const col = options.position[1];
    const id = row * this.cellAmount + col;

    const randomTile = options.options[this.getRandomValue(options.options.length)];

    const rotationIndex = this.getRandomValue(randomTile.rotation.length);
    const randomRotation = randomTile.rotation[rotationIndex];

    const imageNum = randomTile.imageNumber;
    const newTile = new Tile(randomTile.structure, [randomRotation], imageNum);

    this.setImage(id, imageNum, randomRotation);
    matrix[row][col].setCollapse(true);
    matrix[row][col].setOptions([newTile]);

    this.options = [];
  }

  getRandomValue(max) {
    return Math.floor(Math.random() * max);
  }

  createMatrix() {
    let matrix = [];
    for (let i = 0; i < this.cellAmount; i++) {
      matrix[i] = [];
      for (let j = 0; j < this.cellAmount; j++) {
        matrix[i][j] = new Cell(false, this.createNewTailArray());
      }
    }
    return matrix;
  }

  createNewTailArray() {
    //tileArray Template: tileArray[i] = new Tile([TOP, RIGHT, BOTTOM, LEFT]);
    //A = BLANK PINK -- B = CONNECTOR PINK -- C = BLANK PURPLE -- D = CONNECTOR PURPLE -- E = CONNECTOR BLUE
    let tileArray = [];
    tileArray[0] = new Tile(["CCC", "CCC", "CCC", "CCC"], [0], 0);
    tileArray[1] = new Tile(["AAA", "AAA", "AAA", "AAA"], [0], 1);
    tileArray[2] = new Tile(["AAA", "ABA", "AAA", "AAA"], [0, 1, 2, 3], 2);
    tileArray[3] = new Tile(["AAA", "AEA", "AAA", "AEA"], [0, 1], 3);
    tileArray[4] = new Tile(["CAA", "ABA", "AAC", "CCC"], [0, 1, 2, 3], 4);
    tileArray[5] = new Tile(["CAA", "AAA", "AAA", "AAC"], [0, 1, 2, 3], 5);
    tileArray[6] = new Tile(["AAA", "ABA", "AAA", "ABA"], [0, 1], 6);
    tileArray[7] = new Tile(["AEA", "ABA", "AEA", "ABA"], [0, 1], 7);
    tileArray[8] = new Tile(["AEA", "AAA", "ABA", "AAA"], [0, 1, 2, 3], 8);
    tileArray[9] = new Tile(["ABA", "ABA", "AAA", "ABA"], [0, 1, 2, 3], 9);
    tileArray[10] = new Tile(["ABA", "ABA", "ABA", "ABA"], [0, 1], 10);
    tileArray[11] = new Tile(["ABA", "ABA", "AAA", "AAA"], [0, 1, 2, 3], 11);
    return tileArray;
  }

  calculateOptions(matrix) {
    let optionArray = [];

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix.length; j++) {
        this.calculateOption(matrix, { row: i, col: j });
        if (!matrix[i][j].isCollapse) {
          optionArray.push({ options: matrix[i][j].options, position: [i, j] });
        }
      }
    }

    optionArray.sort((a, b) => a.options.length - b.options.length);

    return optionArray;
  }

  calculateOption(matrix, position) {
    if (!this.insideMatrix(matrix, position)) {
      return false;
    }

    let col = position.col;
    let row = position.row;
    let currentCell = matrix[row][col];
    if (currentCell.isCollapse) {
      return true;
    }

    let down = this.getOptions(matrix, { row: row + 1, col: col });
    let up = this.getOptions(matrix, { row: row - 1, col: col });
    let right = this.getOptions(matrix, { row: row, col: col + 1 });
    let left = this.getOptions(matrix, { row: row, col: col - 1 });
    let nearByOptions = {
      right: right,
      down: down,
      left: left,
      up: up,
    };

    this.setMyOptions(matrix, position, nearByOptions);

    return true;
  }

  removeNoneFromArray(arr) {
    return arr.filter((item) => item !== "NONE");
  }

  setMyOptions(matrix, position, nearByOptions) {
    let cell = matrix[position.row][position.col].clone();
    let id = position.row * this.cellAmount + position.col;
    // this.setImage(id, 0);

    cell.options.forEach((tile) => {
      tile.rotation.forEach((rotation) => {
        if (!this.canBeFitted(tile, rotation, nearByOptions)) {
          this.removeFromOptions(cell, tile, rotation);
        }
      });
    });
    cell.options = this.removeNoneFromArray(cell.options);
    matrix[position.row][position.col] = cell;
  }

  canBeFitted(tile, currentRotation, nearByOptions) {
    const leftSide = tile.structure[3 - currentRotation];
    const rightSide = tile.structure[(1 - currentRotation + 4) % 4];
    const upSide = tile.structure[(4 - currentRotation) % 4];
    const downSide = tile.structure[(2 - currentRotation + 4) % 4];

    const left = this.tryFit(nearByOptions.left, leftSide, 1);
    const right = this.tryFit(nearByOptions.right, rightSide, 3);
    const down = this.tryFit(nearByOptions.down, downSide, 0);
    const up = this.tryFit(nearByOptions.up, upSide, 2);

    if (left && down && up && right) {
      return true;
    }
    return false;
  }

  tryFit(options, string, sideToLookAt) {
    if (options === "OUT") {
      return true;
    }
    let i = 0;
    for (let i = 0; i < options.length; i++) {
      const tile = options[i];
      if (tile == undefined || tile === "NONE") {
        continue;
      }
      for (let j = 0; j < tile.rotation.length; j++) {
        const rotation = tile.rotation[j];
        const stringOfSide = tile.structure[(sideToLookAt - rotation + 4) % 4];
        const reversedString = this.reverseString(stringOfSide);
        if (string === reversedString) {
          return true;
        }
      }
    }

    return false;
  }

  removeFromOptions(cell, tile, rotation) {
    cell.removeRotation(tile, rotation);
  }

  reverseString(inputCopy) {
    var splitString = inputCopy.split("");
    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("");

    return joinArray;
  }

  getOptions(matrix, position) {
    if (!this.insideMatrix(matrix, position)) {
      return "OUT";
    }
    let cell = matrix[position.row][position.col].clone();
    return cell.getOptions();
  }

  insideMatrix(matrix, position) {
    if (
      position.col >= matrix[0].length ||
      position.col < 0 ||
      position.row >= matrix.length ||
      position.row < 0
    ) {
      return false;
    }
    return true;
  }

  setRandomSeed(matrix) {
    const randomSeed = Math.floor(Math.random() * this.cellAmount * this.cellAmount);
    const tileAmount = 11;
    const imageValue = randomSeed % 11;

    this.setImage(randomSeed, imageValue);

    let randomSeedRow = Math.floor(randomSeed / this.cellAmount);
    let randomSeedCol = randomSeed % this.cellAmount;
    let currentCell = matrix[randomSeedRow][randomSeedCol];
    let tileCopy = currentCell.options[imageValue];
    tileCopy.rotation = [0];
    currentCell.setCollapse(true);
    currentCell.setOptions([tileCopy]);

    return {
      row: randomSeedRow,
      col: randomSeedCol,
    };
  }

  setImage(id, imageNum, rotation) {
    if (rotation == undefined) {
      rotation = 0;
    }
    const newImageSrc = `../assets/images/tiles/Tiles1/${imageNum}/${rotation}.png`;
    let image = $(`#${id}`);
    image.attr("src", newImageSrc);
  }
}

export default WaveFunction;
