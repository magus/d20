import React from 'react';
import styled from 'styled-components';
import * as THREE from 'three';

import CANNON from '~/libs/cannon.min';
import DiceBox from '~/app/components/DiceBox';
import { $id, $set, $listen } from '~/app/utils/dom';

function dice_initialize(container) {
  // dice.js
  const DICE_CONTEXT = {};
  setupDice.apply(DICE_CONTEXT);

  const canvas = $id('canvas');
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  const label = $id('label');
  const set = $id('set');
  const selector_div = $id('selector_div');

  on_set_change();

  function on_set_change() {
    set.style.width = set.value.length + 3 + 'ex';
  }

  $listen(set, 'keyup', on_set_change);
  $listen(set, 'mousedown', function(ev) {
    ev.stopPropagation();
  });
  $listen(set, 'mouseup', function(ev) {
    ev.stopPropagation();
  });
  $listen(set, 'focus', function() {
    $set(container, { class: '' });
  });
  $listen(set, 'blur', function() {
    $set(container, { class: 'noselect' });
  });

  $listen($id('clear'), 'mouseup touchend', function(ev) {
    ev.stopPropagation();
    set.value = '0';
    on_set_change();
  });

  var box = new DiceBox(DICE_CONTEXT, canvas, { w: 500, h: 300 });
  box.animate_selector = false;

  $listen(window, 'resize', function() {
    canvas.style.width = window.innerWidth - 1 + 'px';
    canvas.style.height = window.innerHeight - 1 + 'px';
    box.reinit(canvas, { w: 500, h: 300 });
  });

  function show_selector() {
    selector_div.style.display = 'inline-block';
    box.draw_selector();
  }

  function before_roll(vectors, notation, callback) {
    selector_div.style.display = 'none';
    // do here rpc call or whatever to get your own result of throw.
    // then callback with array of your result, example:
    // callback([2, 2, 2, 2]); // for 4d6 where all dice values are 2.
    callback();
  }

  function notation_getter() {
    return DICE_CONTEXT.parse_notation(set.value);
  }

  function after_roll(notation, result) {
    var res = result.join(' ');
    if (notation.constant) res += ' +' + notation.constant;
    if (result.length > 1)
      res +=
        ' = ' +
        (result.reduce(function(s, a) {
          return s + a;
        }) +
          notation.constant);
    label.innerHTML = res;
  }

  box.bind_mouse(container, notation_getter, before_roll, after_roll);
  box.bind_throw($id('throw'), notation_getter, before_roll, after_roll);

  $listen(container, 'mouseup', function(ev) {
    ev.stopPropagation();
    if (selector_div.style.display == 'none') {
      if (!box.rolling) show_selector();
      box.rolling = false;
      return;
    }
    var name = box.search_dice_by_mouse(ev);
    if (name != undefined) {
      var notation = DICE_CONTEXT.parse_notation(set.value);
      notation.set.push(name);
      set.value = DICE_CONTEXT.stringify_notation(notation);
      on_set_change();
    }
  });

  show_selector();
}

function setupDice() {
  this.frame_rate = 1 / 60;

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
    var geom = new THREE.Geometry();

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
            if (lastm >= 0 && m != lastm + 1) pairs.unshift([i, m], [j, n]);
            else pairs.push([i, m], [j, n]);

            lastm = m;
          }
        }

        if (pairs.length != 4) continue;

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
            if (--index == -1) index = 3;

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
    var vectors = new Array(vertices.length);
    for (var i = 0; i < vertices.length; ++i) {
      vectors[i] = new THREE.Vector3().fromArray(vertices[i]).normalize();
    }
    var cg = chamfer_geom(vectors, faces, chamfer);
    var geom = make_geom(cg.vectors, cg.faces, radius, tab, af);
    //var geom = make_geom(vectors, faces, radius, tab, af); // Without chamfer
    geom.cannon_shape = create_shape(vectors, faces, radius);
    return geom;
  }

  this.standart_d20_dice_face_labels = [
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
  this.standart_d100_dice_face_labels = [
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

  function calc_texture_size(approx) {
    return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
  }

  this.create_dice_materials = function(face_labels, size, margin) {
    function create_text_texture(text, color, back_color) {
      if (text == undefined) return null;
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var ts = calc_texture_size(size + size * 2 * margin) * 2;
      canvas.width = canvas.height = ts;
      context.font = ts / (1 + 2 * margin) + 'pt Arial';
      context.fillStyle = back_color;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = color;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      if (text == '6' || text == '9') {
        context.fillText('  .', canvas.width / 2, canvas.height / 2);
      }
      var texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      return texture;
    }
    var materials = [];
    for (var i = 0; i < face_labels.length; ++i)
      materials.push(
        new THREE.MeshPhongMaterial({
          map: create_text_texture(
            face_labels[i],
            this.label_color,
            this.dice_color
          ),
          ...this.material_options,
        })
      );
    return materials;
  };

  this.create_d4_materials = function(size, margin) {
    function create_d4_text(text, color, back_color) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var ts = calc_texture_size(size + margin) * 2;
      canvas.width = canvas.height = ts;
      context.font = (ts - margin) / 1.5 + 'pt Arial';
      context.fillStyle = back_color;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = color;
      for (var i in text) {
        context.fillText(
          text[i],
          canvas.width / 2,
          canvas.height / 2 - ts * 0.3
        );
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate((Math.PI * 2) / 3);
        context.translate(-canvas.width / 2, -canvas.height / 2);
      }
      var texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      return texture;
    }
    var materials = [];
    var labels = [[], [0, 0, 0], [2, 4, 3], [1, 3, 4], [2, 1, 4], [1, 2, 3]];
    for (var i = 0; i < labels.length; ++i)
      materials.push(
        new THREE.MeshPhongMaterial({
          map: create_d4_text(labels[i], this.label_color, this.dice_color),
          ...this.material_options,
        })
      );
    return materials;
  };

  this.create_d4_geometry = function(radius) {
    var vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
    var faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
    return create_geom(vertices, faces, radius, -0.1, (Math.PI * 7) / 6, 0.96);
  };

  this.create_d6_geometry = function(radius) {
    var vertices = [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ];
    var faces = [
      [0, 3, 2, 1, 1],
      [1, 2, 6, 5, 2],
      [0, 1, 5, 4, 3],
      [3, 7, 6, 2, 4],
      [0, 4, 7, 3, 5],
      [4, 5, 6, 7, 6],
    ];
    return create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.96);
  };

  this.create_d8_geometry = function(radius) {
    var vertices = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    var faces = [
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

  this.create_d10_geometry = function(radius) {
    const a = (Math.PI * 2) / 10;
    const h = 0.105;
    const v = -1;

    var vertices = [];

    for (let i = 0, b = 0; i < 10; ++i, b += a)
      vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);

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

  this.create_d12_geometry = function(radius) {
    var p = (1 + Math.sqrt(5)) / 2,
      q = 1 / p;
    var vertices = [
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
    var faces = [
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

  this.create_d20_geometry = function(radius) {
    var t = (1 + Math.sqrt(5)) / 2;
    var vertices = [
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
    var faces = [
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

  this.material_options = {
    specular: 0x172022,
    color: 0xf0f0f0,
    shininess: 40,
    shading: THREE.FlatShading,
  };
  this.label_color = '#aaaaaa';
  this.dice_color = '#202020';
  this.ambient_light_color = 0xf0f5fb;
  this.spot_light_color = 0xefdfd5;
  this.selector_back_colors = {
    color: 0x404040,
    shininess: 0,
    emissive: 0x858787,
  };
  this.desk_color = 0xdfdfdf;

  this.known_types = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
  this.dice_face_range = {
    d4: [1, 4],
    d6: [1, 6],
    d8: [1, 8],
    d10: [0, 9],
    d12: [1, 12],
    d20: [1, 20],
    d100: [0, 9],
  };
  this.dice_mass = {
    d4: 300,
    d6: 300,
    d8: 340,
    d10: 350,
    d12: 350,
    d20: 400,
    d100: 350,
  };
  this.dice_inertia = {
    d4: 5,
    d6: 13,
    d8: 10,
    d10: 9,
    d12: 8,
    d20: 6,
    d100: 9,
  };

  this.scale = 50;

  this.create_d4 = function() {
    if (!this.d4_geometry)
      this.d4_geometry = this.create_d4_geometry(this.scale * 1.2);
    if (!this.d4_material)
      this.d4_material = new THREE.MeshFaceMaterial(
        this.create_d4_materials(this.scale / 2, this.scale * 2)
      );
    return new THREE.Mesh(this.d4_geometry, this.d4_material);
  };

  this.create_d6 = function() {
    if (!this.d6_geometry)
      this.d6_geometry = this.create_d6_geometry(this.scale * 0.9);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        this.create_dice_materials(
          this.standart_d20_dice_face_labels,
          this.scale / 2,
          1.0
        )
      );
    return new THREE.Mesh(this.d6_geometry, this.dice_material);
  };

  this.create_d8 = function() {
    if (!this.d8_geometry)
      this.d8_geometry = this.create_d8_geometry(this.scale);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        this.create_dice_materials(
          this.standart_d20_dice_face_labels,
          this.scale / 2,
          1.2
        )
      );
    return new THREE.Mesh(this.d8_geometry, this.dice_material);
  };

  this.create_d10 = function() {
    if (!this.d10_geometry)
      this.d10_geometry = this.create_d10_geometry(this.scale * 0.9);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        this.create_dice_materials(
          this.standart_d20_dice_face_labels,
          this.scale / 2,
          1.0
        )
      );
    return new THREE.Mesh(this.d10_geometry, this.dice_material);
  };

  this.create_d12 = function() {
    if (!this.d12_geometry)
      this.d12_geometry = this.create_d12_geometry(this.scale * 0.9);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        this.create_dice_materials(
          this.standart_d20_dice_face_labels,
          this.scale / 2,
          1.0
        )
      );
    return new THREE.Mesh(this.d12_geometry, this.dice_material);
  };

  this.create_d20 = function() {
    if (!this.d20_geometry)
      this.d20_geometry = this.create_d20_geometry(this.scale);
    if (!this.dice_material)
      this.dice_material = new THREE.MeshFaceMaterial(
        this.create_dice_materials(
          this.standart_d20_dice_face_labels,
          this.scale / 2,
          1.0
        )
      );
    return new THREE.Mesh(this.d20_geometry, this.dice_material);
  };

  this.create_d100 = function() {
    if (!this.d10_geometry)
      this.d10_geometry = this.create_d10_geometry(this.scale * 0.9);
    if (!this.d100_material)
      this.d100_material = new THREE.MeshFaceMaterial(
        this.create_dice_materials(
          this.standart_d100_dice_face_labels,
          this.scale / 2,
          1.5
        )
      );
    return new THREE.Mesh(this.d10_geometry, this.d100_material);
  };

  this.parse_notation = function(notation) {
    var no = notation.split('@');
    var dr0 = /\s*(\d*)([a-z]+)(\d+)(\s*\+\s*(\d+)){0,1}\s*(\+|$)/gi;
    var dr1 = /(\b)*(\d+)(\b)*/gi;
    var ret = { set: [], constant: 0, result: [], error: false },
      res;
    while ((res = dr0.exec(no[0]))) {
      var command = res[2];
      if (command != 'd') {
        ret.error = true;
        continue;
      }
      var count = parseInt(res[1]);
      if (res[1] == '') count = 1;
      var type = 'd' + res[3];
      if (this.known_types.indexOf(type) == -1) {
        ret.error = true;
        continue;
      }
      while (count--) ret.set.push(type);
      if (res[5]) ret.constant += parseInt(res[5]);
    }
    while ((res = dr1.exec(no[1]))) {
      ret.result.push(parseInt(res[2]));
    }
    return ret;
  };

  this.stringify_notation = function(nn) {
    const dict = {};

    let notation = '';

    for (let i in nn.set)
      if (!dict[nn.set[i]]) dict[nn.set[i]] = 1;
      else ++dict[nn.set[i]];

    for (let i in dict) {
      if (notation.length) notation += ' + ';
      notation += (dict[i] > 1 ? dict[i] : '') + i;
    }

    if (nn.constant) notation += ' + ' + nn.constant;

    return notation;
  };


}

export default class Roller extends React.Component {
  componentDidMount() {
    // Initialize 3d roller
    dice_initialize(document.body);
  }

  render() {
    return (
      <div>
        <CanvasContainer id="canvas" />

        <div className="center_field">
          <span id="label" />
        </div>

        <div id="selector_div" style={{ display: 'none' }}>
          <div className="center_field">
            <div id="sethelp">
              choose your dice set by clicking the dices or by direct input of
              notation,
              <br />
              tap and drag on free space of screen or hit throw button to roll
            </div>
          </div>
          <div className="center_field">
            <input type="text" id="set" value="4d6" />
            <br />
            <button id="clear">clear</button>
            <button style={{ marginLeft: '0.6em' }} id="throw">
              throw
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const CanvasContainer = styled.div`
  z-index: -1;
  position: absolute;
  top: 0;
  left: 0;
`;
