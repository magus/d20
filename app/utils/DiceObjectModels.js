// @flow
import type { Dice } from '~/app/utils/DICE';

import * as THREE from 'three';
import CANNON from '~/libs/cannon.min';

import DICE from '~/app/utils/DICE';

const SCALE = 50;

const DICE_MATERIAL = {
  specular: 0x172022,
  color: 0xf0f0f0,
  shininess: 40,
  shading: THREE.FlatShading,
};

const label_color = '#fff';
const dice_color = '#000';

const D20_FACES = [
  ' ',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
];

const D100_FACES = [
  ' ',
  '00',
  '10',
  '20',
  '30',
  '40',
  '50',
  '60',
  '70',
  '80',
  '90',
];

function readDice(dice: Dice) {
  const vector = new THREE.Vector3(0, 0, dice.type === 'd4' ? -1 : 1);

  let closestFace;
  let closestAngle = Math.PI * 2;
  for (let i = 0, l = dice.geometry.faces.length; i < l; ++i) {
    const face = dice.geometry.faces[i];

    if (face.materialIndex === 0) continue;

    const angle = face.normal
      .clone()
      .applyQuaternion(dice.body.quaternion)
      .angleTo(vector);

    if (angle < closestAngle) {
      closestAngle = angle;
      closestFace = face;
    }
  }

  if (!closestFace) throw new Error('unable to find closest face');

  let matindex = closestFace.materialIndex - 1;
  if (dice.type === 'd100') matindex *= 10;

  return matindex;
}

export function readDices(dices: Dice[]) {
  const values = [];

  for (let i = 0, l = dices.length; i < l; ++i) {
    values.push(readDice(dices[i]));
  }

  return values;
}

export function shiftDiceFaces(dice: Dice, value: number, res: number) {
  const r = DICE.Range[dice.type];

  if (!(value >= r[0] && value <= r[1])) return;
  if (dice.type === DICE.Type.d100) res /= 10;

  const num = value - res;
  const geom = dice.geometry.clone();

  for (let i = 0, l = geom.faces.length; i < l; ++i) {
    let matindex = geom.faces[i].materialIndex;

    if (matindex === 0) continue;

    matindex += num - 1;
    while (matindex > r[1]) matindex -= r[1];
    while (matindex < r[0]) matindex += r[1];
    geom.faces[i].materialIndex = matindex + 1;
  }

  dice.geometry = geom;
}

function create_shape(vertices, faces, radius) {
  const cv = new Array(vertices.length);
  const cf = new Array(faces.length);

  for (let i = 0; i < vertices.length; ++i) {
    const v = vertices[i];
    cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
  }

  for (let i = 0; i < faces.length; ++i) {
    cf[i] = faces[i].slice(0, faces[i].length - 1);
  }

  return new CANNON.ConvexPolyhedron(cv, cf);
}

function make_geom(vertices, faces, radius, tab, af) {
  const geom = new THREE.Geometry();

  for (let i = 0; i < vertices.length; ++i) {
    const vertex = vertices[i].multiplyScalar(radius);
    vertex.index = geom.vertices.push(vertex) - 1;
  }

  for (let i = 0; i < faces.length; ++i) {
    const ii = faces[i];
    const fl = ii.length - 1;
    const aa = (Math.PI * 2) / fl;

    for (let j = 0; j < fl - 2; ++j) {
      geom.faces.push(
        new THREE.Face3(
          ii[0],
          ii[j + 1],
          ii[j + 2],
          [
            geom.vertices[ii[0]],
            geom.vertices[ii[j + 1]],
            geom.vertices[ii[j + 2]],
          ],
          0,
          ii[fl] + 1
        )
      );
      geom.faceVertexUvs[0].push([
        new THREE.Vector2(
          (Math.cos(af) + 1 + tab) / 2 / (1 + tab),
          (Math.sin(af) + 1 + tab) / 2 / (1 + tab)
        ),
        new THREE.Vector2(
          (Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
          (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)
        ),
        new THREE.Vector2(
          (Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
          (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab)
        ),
      ]);
    }
  }

  geom.computeFaceNormals();
  geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);

  return geom;
}

function chamfer_geom(vectors, faces, chamfer) {
  const chamfer_vectors = [];
  const chamfer_faces = [];
  const corner_faces = new Array(vectors.length);

  for (let i = 0; i < vectors.length; ++i) corner_faces[i] = [];
  for (let i = 0; i < faces.length; ++i) {
    const ii = faces[i];
    const fl = ii.length - 1;
    const center_point = new THREE.Vector3();
    const face = new Array(fl);

    for (let j = 0; j < fl; ++j) {
      const vv = vectors[ii[j]].clone();
      center_point.add(vv);
      corner_faces[ii[j]].push((face[j] = chamfer_vectors.push(vv) - 1));
    }

    center_point.divideScalar(fl);

    for (let j = 0; j < fl; ++j) {
      const vv = chamfer_vectors[face[j]];
      vv.subVectors(vv, center_point)
        .multiplyScalar(chamfer)
        .addVectors(vv, center_point);
    }

    face.push(ii[fl]);
    chamfer_faces.push(face);
  }

  for (let i = 0; i < faces.length - 1; ++i) {
    for (let j = i + 1; j < faces.length; ++j) {
      const pairs = [];

      let lastm = -1;
      for (let m = 0; m < faces[i].length - 1; ++m) {
        const n = faces[j].indexOf(faces[i][m]);

        if (n >= 0 && n < faces[j].length - 1) {
          if (lastm >= 0 && m !== lastm + 1) pairs.unshift([i, m], [j, n]);
          else pairs.push([i, m], [j, n]);

          lastm = m;
        }
      }

      if (pairs.length !== 4) continue;

      chamfer_faces.push([
        chamfer_faces[pairs[0][0]][pairs[0][1]],
        chamfer_faces[pairs[1][0]][pairs[1][1]],
        chamfer_faces[pairs[3][0]][pairs[3][1]],
        chamfer_faces[pairs[2][0]][pairs[2][1]],
        -1,
      ]);
    }
  }

  for (let i = 0; i < corner_faces.length; ++i) {
    const cf = corner_faces[i];
    const face = [cf[0]];

    let count = cf.length - 1;
    while (count) {
      for (let m = faces.length; m < chamfer_faces.length; ++m) {
        let index = chamfer_faces[m].indexOf(face[face.length - 1]);

        if (index >= 0 && index < 4) {
          if (--index === -1) index = 3;

          const next_vertex = chamfer_faces[m][index];

          if (cf.indexOf(next_vertex) >= 0) {
            face.push(next_vertex);
            break;
          }
        }
      }
      --count;
    }
    face.push(-1);
    chamfer_faces.push(face);
  }
  return { vectors: chamfer_vectors, faces: chamfer_faces };
}

function create_geom(vertices, faces, radius, tab, af, chamfer) {
  const vectors = new Array(vertices.length);
  for (let i = 0; i < vertices.length; ++i) {
    vectors[i] = new THREE.Vector3().fromArray(vertices[i]).normalize();
  }

  const cg = chamfer_geom(vectors, faces, chamfer);
  const geom = make_geom(cg.vectors, cg.faces, radius, tab, af);
  // const geom = make_geom(vectors, faces, radius, tab, af); // Without chamfer
  geom.cannon_shape = create_shape(vectors, faces, radius);

  return geom;
}

function calc_texture_size(approx) {
  return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
}

function create_text_texture(text, color, back_color, size, margin) {
  if (text === undefined) return null;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const ts = calc_texture_size(size + size * 2 * margin) * 2;

  canvas.width = canvas.height = ts;

  context.font = ts / (1 + 2 * margin) + 'pt Arial';
  context.fillStyle = back_color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  if (text === '6' || text === '9') {
    context.fillText('  .', canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  return texture;
}

const create_dice_materials = function(face_labels, size, margin) {
  const materials = [];

  for (let i = 0; i < face_labels.length; ++i)
    materials.push(
      new THREE.MeshPhongMaterial({
        map: create_text_texture(
          face_labels[i],
          label_color,
          dice_color,
          size,
          margin
        ),
        ...DICE_MATERIAL,
      })
    );

  return materials;
};

const create_d4_materials = function() {
  const size = SCALE / 2;
  const margin = SCALE * 2;

  function create_d4_text(digits: number[], color, back_color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const ts = calc_texture_size(size + margin) * 2;

    canvas.width = canvas.height = ts;

    context.font = (ts - margin) / 1.5 + 'pt Arial';
    context.fillStyle = back_color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;

    digits.forEach(digit => {
      context.fillText(
        `${digit}`,
        canvas.width / 2,
        canvas.height / 2 - ts * 0.3
      );
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((Math.PI * 2) / 3);
      context.translate(-canvas.width / 2, -canvas.height / 2);
    });

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  const materials = [];
  const labels = [[], [0, 0, 0], [2, 4, 3], [1, 3, 4], [2, 1, 4], [1, 2, 3]];

  for (let i = 0; i < labels.length; ++i) {
    materials.push(
      new THREE.MeshPhongMaterial({
        map: create_d4_text(labels[i], label_color, dice_color),
        ...DICE_MATERIAL,
      })
    );
  }

  return materials;
};

const create_d4_geometry = function(radius) {
  const vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
  const faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];

  return create_geom(vertices, faces, radius, -0.1, (Math.PI * 7) / 6, 0.96);
};

const create_d6_geometry = function(radius) {
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];

  const faces = [
    [0, 3, 2, 1, 1],
    [1, 2, 6, 5, 2],
    [0, 1, 5, 4, 3],
    [3, 7, 6, 2, 4],
    [0, 4, 7, 3, 5],
    [4, 5, 6, 7, 6],
  ];

  return create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.96);
};

const create_d8_geometry = function(radius) {
  const vertices = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];

  const faces = [
    [0, 2, 4, 1],
    [0, 4, 3, 2],
    [0, 3, 5, 3],
    [0, 5, 2, 4],
    [1, 3, 4, 5],
    [1, 4, 2, 6],
    [1, 2, 5, 7],
    [1, 5, 3, 8],
  ];

  return create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2, 0.965);
};

const create_d10_geometry = function(radius) {
  const a = (Math.PI * 2) / 10;
  const h = 0.105;
  const v = -1;

  const vertices = [];

  for (let i = 0, b = 0; i < 10; ++i, b += a) {
    vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
  }

  vertices.push([0, 0, -1]);
  vertices.push([0, 0, 1]);

  const faces = [
    [5, 7, 11, 0],
    [4, 2, 10, 1],
    [1, 3, 11, 2],
    [0, 8, 10, 3],
    [7, 9, 11, 4],
    [8, 6, 10, 5],
    [9, 1, 11, 6],
    [2, 0, 10, 7],
    [3, 5, 11, 8],
    [6, 4, 10, 9],
    [1, 0, 2, v],
    [1, 2, 3, v],
    [3, 2, 4, v],
    [3, 4, 5, v],
    [5, 4, 6, v],
    [5, 6, 7, v],
    [7, 6, 8, v],
    [7, 8, 9, v],
    [9, 8, 0, v],
    [9, 0, 1, v],
  ];

  return create_geom(vertices, faces, radius, 0, (Math.PI * 6) / 5, 0.945);
};

const create_d12_geometry = function(radius) {
  const p = (1 + Math.sqrt(5)) / 2;
  const q = 1 / p;
  const vertices = [
    [0, q, p],
    [0, q, -p],
    [0, -q, p],
    [0, -q, -p],
    [p, 0, q],
    [p, 0, -q],
    [-p, 0, q],
    [-p, 0, -q],
    [q, p, 0],
    [q, -p, 0],
    [-q, p, 0],
    [-q, -p, 0],
    [1, 1, 1],
    [1, 1, -1],
    [1, -1, 1],
    [1, -1, -1],
    [-1, 1, 1],
    [-1, 1, -1],
    [-1, -1, 1],
    [-1, -1, -1],
  ];

  const faces = [
    [2, 14, 4, 12, 0, 1],
    [15, 9, 11, 19, 3, 2],
    [16, 10, 17, 7, 6, 3],
    [6, 7, 19, 11, 18, 4],
    [6, 18, 2, 0, 16, 5],
    [18, 11, 9, 14, 2, 6],
    [1, 17, 10, 8, 13, 7],
    [1, 13, 5, 15, 3, 8],
    [13, 8, 12, 4, 5, 9],
    [5, 4, 14, 9, 15, 10],
    [0, 12, 8, 10, 16, 11],
    [3, 19, 7, 17, 1, 12],
  ];

  return create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2, 0.968);
};

const create_d20_geometry = function(radius) {
  const t = (1 + Math.sqrt(5)) / 2;

  const vertices = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ];

  const faces = [
    [0, 11, 5, 1],
    [0, 5, 1, 2],
    [0, 1, 7, 3],
    [0, 7, 10, 4],
    [0, 10, 11, 5],
    [1, 5, 9, 6],
    [5, 11, 4, 7],
    [11, 10, 2, 8],
    [10, 7, 6, 9],
    [7, 1, 8, 10],
    [3, 9, 4, 11],
    [3, 4, 2, 12],
    [3, 2, 6, 13],
    [3, 6, 8, 14],
    [3, 8, 9, 15],
    [4, 9, 5, 16],
    [2, 4, 11, 17],
    [6, 2, 10, 18],
    [8, 6, 7, 19],
    [9, 8, 1, 20],
  ];

  return create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.955);
};

// TODO: Properly type this out and centralize cache
export const DiceBuilder: any = {
  [DICE.Type.d4]: function() {
    if (!this.d4_geometry) this.d4_geometry = create_d4_geometry(SCALE * 1.2);
    if (!this.d4_material)
      this.d4_material = new THREE.MeshFaceMaterial(create_d4_materials());
    return new THREE.Mesh(this.d4_geometry, this.d4_material);
  },

  [DICE.Type.d6]: function() {
    if (!this.d6_geometry) this.d6_geometry = create_d6_geometry(SCALE * 0.9);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        create_dice_materials(D20_FACES, SCALE / 2, 1.0)
      );
    return new THREE.Mesh(this.d6_geometry, this.dice_material);
  },

  [DICE.Type.d8]: function() {
    if (!this.d8_geometry) this.d8_geometry = create_d8_geometry(SCALE);
    if (!this.d8_material) {
      this.d8_material = new THREE.MeshFaceMaterial(
        create_dice_materials(D20_FACES, SCALE / 2, 1.2)
      );
    }

    return new THREE.Mesh(this.d8_geometry, this.d8_material);
  },

  [DICE.Type.d10]: function() {
    if (!this.d10_geometry)
      this.d10_geometry = create_d10_geometry(SCALE * 0.9);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        create_dice_materials(D20_FACES, SCALE / 2, 1.0)
      );
    return new THREE.Mesh(this.d10_geometry, this.dice_material);
  },

  [DICE.Type.d12]: function() {
    if (!this.d12_geometry)
      this.d12_geometry = create_d12_geometry(SCALE * 0.9);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        create_dice_materials(D20_FACES, SCALE / 2, 1.0)
      );
    return new THREE.Mesh(this.d12_geometry, this.dice_material);
  },

  [DICE.Type.d20]: function() {
    if (!this.d20_geometry) this.d20_geometry = create_d20_geometry(SCALE);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        create_dice_materials(D20_FACES, SCALE / 2, 1.0)
      );
    return new THREE.Mesh(this.d20_geometry, this.dice_material);
  },

  [DICE.Type.d100]: function() {
    if (!this.d10_geometry)
      this.d10_geometry = create_d10_geometry(SCALE * 0.9);
    if (!this.d100_material)
      this.d100_material = new THREE.MeshFaceMaterial(
        create_dice_materials(D100_FACES, SCALE / 2, 1.5)
      );
    return new THREE.Mesh(this.d10_geometry, this.d100_material);
  },
};
