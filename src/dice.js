import { REST_ROTATION } from './motion.js';

const FACE_NAMES = ['front', 'back', 'right', 'left', 'top', 'bottom'];
const DOTS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
// Standard opposite faces sum to seven; each row describes one cube orientation.
const D6_FACES = {
  1: [1, 6, 3, 4, 2, 5], 2: [2, 5, 3, 4, 6, 1],
  3: [3, 4, 2, 5, 1, 6], 4: [4, 3, 5, 2, 1, 6],
  5: [5, 2, 3, 4, 1, 6], 6: [6, 1, 3, 4, 5, 2],
};

export class Die {
  constructor(sides, value) {
    this.sides = sides;
    this.element = document.createElement('div');
    this.element.className = 'die';
    this.cube = document.createElement('div');
    this.cube.className = 'cube';
    this.element.append(this.cube);
    this.faces = FACE_NAMES.map(name => {
      const face = document.createElement('div');
      face.className = `face ${name}`;
      this.cube.append(face);
      return face;
    });
    this.setValue(value);
    this.setRotation(REST_ROTATION);
  }

  setValue(value) {
    this.value = value;
    this.element.dataset.value = value ?? '';
    this.faces.forEach((face, index) => {
      face.replaceChildren();
      if (value == null || this.sides !== 6) {
        const number = document.createElement('span');
        number.className = 'face-value';
        number.textContent = value == null ? '' : String(((value - 1 + index) % this.sides) + 1);
        face.append(number);
      } else {
        const pips = document.createElement('div');
        pips.className = 'pips';
        for (const position of DOTS[D6_FACES[value][index]]) {
          const dot = document.createElement('i');
          dot.className = 'pip';
          dot.style.gridArea = `${Math.floor(position / 3) + 1} / ${(position % 3) + 1}`;
          pips.append(dot);
        }
        face.append(pips);
      }
    });
  }

  setRotation(rotation, scale = 1) {
    this.rotation = { ...rotation };
    this.cube.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) scale3d(${scale}, ${scale}, ${scale})`;
  }
}
