import * as THREE from 'three';
import CANNON from '~/libs/cannon.min';

import { $firstParent, $listen } from '~/app/utils/dom';
import { DICE_TYPES, DiceBuilder } from '~/app/utils/threeDice';

function getMouseCoords(event) {
  const canvas = $firstParent(event.target, e => e.tagName === 'CANVAS');
  const { top, left } = (canvas && canvas.getBoundingClientRect()) || {};

  const touches = event.changedTouches;
  const ex = touches ? touches[0].clientX : event.clientX;
  const ey = touches ? touches[0].clientY : event.clientY;

  return {
    x: ex - (left || 0),
    y: ey - (top || 0),
  };
}

const frame_rate = 1 / 60;
const ambient_light_color = 0xf0f5fb;
const spot_light_color = 0xefdfd5;
const selector_back_colors = {
  color: 0x404040,
  shininess: 0,
  emissive: 0x858787,
};
const desk_color = 0xdfdfdf;
const dice_face_range = {
  d4: [1, 4],
  d6: [1, 6],
  d8: [1, 8],
  d10: [0, 9],
  d12: [1, 12],
  d20: [1, 20],
  d100: [0, 9],
};
const dice_mass = {
  d4: 300,
  d6: 300,
  d8: 340,
  d10: 350,
  d12: 350,
  d20: 400,
  d100: 350,
};
const dice_inertia = {
  d4: 5,
  d6: 13,
  d8: 10,
  d10: 9,
  d12: 8,
  d20: 6,
  d100: 9,
};
const rnd = () => Math.random();

export default function DiceBox(container, dimentions) {
  this.use_adapvite_timestep = true;
  this.animate_selector = true;

  this.dices = [];
  this.scene = new THREE.Scene();
  this.world = new CANNON.World();

  this.renderer = window.WebGLRenderingContext
    ? new THREE.WebGLRenderer({ antialias: true })
    : new THREE.CanvasRenderer({ antialias: true });
  container.appendChild(this.renderer.domElement);
  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMap.type = THREE.PCFShadowMap;
  this.renderer.setClearColor(0xffffff, 1);

  this.reinit(container, dimentions);

  this.world.gravity.set(0, 0, -9.8 * 800);
  this.world.broadphase = new CANNON.NaiveBroadphase();
  this.world.solver.iterations = 16;

  var ambientLight = new THREE.AmbientLight(ambient_light_color);
  this.scene.add(ambientLight);

  this.dice_body_material = new CANNON.Material();
  var desk_body_material = new CANNON.Material();
  var barrier_body_material = new CANNON.Material();
  this.world.addContactMaterial(
    new CANNON.ContactMaterial(
      desk_body_material,
      this.dice_body_material,
      0.01,
      0.5
    )
  );
  this.world.addContactMaterial(
    new CANNON.ContactMaterial(
      barrier_body_material,
      this.dice_body_material,
      0,
      1.0
    )
  );
  this.world.addContactMaterial(
    new CANNON.ContactMaterial(
      this.dice_body_material,
      this.dice_body_material,
      0,
      0.5
    )
  );

  this.world.add(
    new CANNON.RigidBody(0, new CANNON.Plane(), desk_body_material)
  );
  var barrier;
  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  barrier.position.set(0, this.h * 0.93, 0);
  this.world.add(barrier);

  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  barrier.position.set(0, -this.h * 0.93, 0);
  this.world.add(barrier);

  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
  barrier.position.set(this.w * 0.93, 0, 0);
  this.world.add(barrier);

  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
  barrier.position.set(-this.w * 0.93, 0, 0);
  this.world.add(barrier);

  this.last_time = 0;
  this.running = false;

  this.renderer.render(this.scene, this.camera);
}

DiceBox.prototype.reinit = function(container, dimentions) {
  this.cw = container.clientWidth / 2;
  this.ch = container.clientHeight / 2;

  if (dimentions) {
    this.w = dimentions.w;
    this.h = dimentions.h;
  } else {
    this.w = this.cw;
    this.h = this.ch;
  }

  this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
  this.renderer.setSize(this.cw * 2, this.ch * 2);

  this.wh = this.ch / this.aspect / Math.tan((10 * Math.PI) / 180);
  if (this.camera) this.scene.remove(this.camera);
  this.camera = new THREE.PerspectiveCamera(
    20,
    this.cw / this.ch,
    1,
    this.wh * 1.3
  );
  this.camera.position.z = this.wh;

  var mw = Math.max(this.w, this.h);
  if (this.light) this.scene.remove(this.light);
  this.light = new THREE.SpotLight(spot_light_color, 2.0);
  this.light.position.set(-mw / 2, mw / 2, mw * 2);
  this.light.target.position.set(0, 0, 0);
  this.light.distance = mw * 5;
  this.light.castShadow = true;
  this.light.shadowCameraNear = mw / 10;
  this.light.shadowCameraFar = mw * 5;
  this.light.shadowCameraFov = 50;
  this.light.shadowBias = 0.001;
  this.light.shadowDarkness = 1.1;
  this.light.shadowMapWidth = 1024;
  this.light.shadowMapHeight = 1024;
  this.scene.add(this.light);

  if (this.desk) this.scene.remove(this.desk);
  this.desk = new THREE.Mesh(
    new THREE.PlaneGeometry(this.w * 2, this.h * 2, 1, 1),
    new THREE.MeshPhongMaterial({ color: desk_color })
  );
  this.desk.receiveShadow = true;
  this.scene.add(this.desk);

  this.renderer.render(this.scene, this.camera);
};

function make_random_vector(vector) {
  var random_angle = (rnd() * Math.PI) / 5 - Math.PI / 5 / 2;
  var vec = {
    x: vector.x * Math.cos(random_angle) - vector.y * Math.sin(random_angle),
    y: vector.x * Math.sin(random_angle) + vector.y * Math.cos(random_angle),
  };
  if (vec.x == 0) vec.x = 0.01;
  if (vec.y == 0) vec.y = 0.01;
  return vec;
}

DiceBox.prototype.generate_vectors = function(notation, vector, boost) {
  const vectors = [];

  for (let i in notation.set) {
    const vec = make_random_vector(vector);
    const pos = {
      x: this.w * (vec.x > 0 ? -1 : 1) * 0.9,
      y: this.h * (vec.y > 0 ? -1 : 1) * 0.9,
      z: rnd() * 200 + 200,
    };
    const projector = Math.abs(vec.x / vec.y);

    if (projector > 1.0) pos.y /= projector;
    else pos.x *= projector;

    const velvec = make_random_vector(vector);
    const velocity = { x: velvec.x * boost, y: velvec.y * boost, z: -10 };
    const inertia = dice_inertia[notation.set[i]];
    const angle = {
      x: -(rnd() * vec.y * 5 + inertia * vec.y),
      y: rnd() * vec.x * 5 + inertia * vec.x,
      z: 0,
    };
    const axis = { x: rnd(), y: rnd(), z: rnd(), a: rnd() };

    vectors.push({
      set: notation.set[i],
      pos: pos,
      velocity: velocity,
      angle: angle,
      axis: axis,
    });
  }

  return vectors;
};

DiceBox.prototype.create_dice = function(type, pos, velocity, angle, axis) {
  var dice = DiceBuilder['create_' + type]();
  dice.castShadow = true;
  dice.dice_type = type;
  dice.body = new CANNON.RigidBody(
    dice_mass[type],
    dice.geometry.cannon_shape,
    this.dice_body_material
  );
  dice.body.position.set(pos.x, pos.y, pos.z);
  dice.body.quaternion.setFromAxisAngle(
    new CANNON.Vec3(axis.x, axis.y, axis.z),
    axis.a * Math.PI * 2
  );
  dice.body.angularVelocity.set(angle.x, angle.y, angle.z);
  dice.body.velocity.set(velocity.x, velocity.y, velocity.z);
  dice.body.linearDamping = 0.1;
  dice.body.angularDamping = 0.1;
  this.scene.add(dice);
  this.dices.push(dice);
  this.world.add(dice.body);
};

DiceBox.prototype.check_if_throw_finished = function() {
  var res = true;
  var e = 6;
  if (this.iteration < 10 / frame_rate) {
    for (var i = 0; i < this.dices.length; ++i) {
      var dice = this.dices[i];
      if (dice.dice_stopped === true) continue;
      var a = dice.body.angularVelocity,
        v = dice.body.velocity;
      if (
        Math.abs(a.x) < e &&
        Math.abs(a.y) < e &&
        Math.abs(a.z) < e &&
        Math.abs(v.x) < e &&
        Math.abs(v.y) < e &&
        Math.abs(v.z) < e
      ) {
        if (dice.dice_stopped) {
          if (this.iteration - dice.dice_stopped > 3) {
            dice.dice_stopped = true;
            continue;
          }
        } else dice.dice_stopped = this.iteration;
        res = false;
      } else {
        dice.dice_stopped = undefined;
        res = false;
      }
    }
  }
  return res;
};

function get_dice_value(dice) {
  var vector = new THREE.Vector3(0, 0, dice.dice_type == 'd4' ? -1 : 1);
  var closest_face,
    closest_angle = Math.PI * 2;
  for (var i = 0, l = dice.geometry.faces.length; i < l; ++i) {
    var face = dice.geometry.faces[i];
    if (face.materialIndex == 0) continue;
    var angle = face.normal
      .clone()
      .applyQuaternion(dice.body.quaternion)
      .angleTo(vector);
    if (angle < closest_angle) {
      closest_angle = angle;
      closest_face = face;
    }
  }
  var matindex = closest_face.materialIndex - 1;
  if (dice.dice_type == 'd100') matindex *= 10;
  return matindex;
}

function get_dice_values(dices) {
  var values = [];
  for (var i = 0, l = dices.length; i < l; ++i) {
    values.push(get_dice_value(dices[i]));
  }
  return values;
}

DiceBox.prototype.emulate_throw = function() {
  while (!this.check_if_throw_finished()) {
    ++this.iteration;
    this.world.step(frame_rate);
  }
  return get_dice_values(this.dices);
};

DiceBox.prototype.__animate = function(threadid) {
  var time = new Date().getTime();
  var time_diff = (time - this.last_time) / 1000;
  if (time_diff > 3) time_diff = frame_rate;
  ++this.iteration;

  try {
    if (this.use_adapvite_timestep) {
      while (time_diff > frame_rate * 1.1) {
        this.world.step(frame_rate);
        time_diff -= frame_rate;
      }
      this.world.step(time_diff);
    } else {
      this.world.step(frame_rate);
    }
  } catch (err) {
    console.error(err);
  }

  for (var i in this.scene.children) {
    var interact = this.scene.children[i];
    if (interact.body != undefined) {
      interact.position.copy(interact.body.position);
      interact.quaternion.copy(interact.body.quaternion);
    }
  }
  this.renderer.render(this.scene, this.camera);
  this.last_time = this.last_time ? time : new Date().getTime();
  if (this.running == threadid && this.check_if_throw_finished()) {
    this.running = false;
    if (this.callback) this.callback.call(this, get_dice_values(this.dices));
  }
  if (this.running == threadid) {
    (function(t, tid, uat) {
      if (!uat && time_diff < frame_rate) {
        setTimeout(function() {
          requestAnimationFrame(function() {
            t.__animate(tid);
          });
        }, (frame_rate - time_diff) * 1000);
      } else
        requestAnimationFrame(function() {
          t.__animate(tid);
        });
    })(this, threadid, this.use_adapvite_timestep);
  }
};

DiceBox.prototype.clear = function() {
  this.running = false;
  var dice;
  while ((dice = this.dices.pop())) {
    this.scene.remove(dice);
    if (dice.body) this.world.remove(dice.body);
  }
  if (this.pane) this.scene.remove(this.pane);
  this.renderer.render(this.scene, this.camera);
  var box = this;
  setTimeout(function() {
    box.renderer.render(box.scene, box.camera);
  }, 100);
};

DiceBox.prototype.prepare_dices_for_roll = function(vectors) {
  this.clear();
  this.iteration = 0;
  for (var i in vectors) {
    this.create_dice(
      vectors[i].set,
      vectors[i].pos,
      vectors[i].velocity,
      vectors[i].angle,
      vectors[i].axis
    );
  }
};

function shift_dice_faces(dice, value, res) {
  const r = dice_face_range[dice.dice_type];

  if (!(value >= r[0] && value <= r[1])) return;

  const num = value - res;
  const geom = dice.geometry.clone();

  for (let i = 0, l = geom.faces.length; i < l; ++i) {
    let matindex = geom.faces[i].materialIndex;

    if (matindex == 0) continue;

    matindex += num - 1;
    while (matindex > r[1]) matindex -= r[1];
    while (matindex < r[0]) matindex += r[1];
    geom.faces[i].materialIndex = matindex + 1;
  }

  dice.geometry = geom;
}

DiceBox.prototype.roll = function(vectors, values, callback) {
  this.prepare_dices_for_roll(vectors);
  if (values != undefined && values.length) {
    this.use_adapvite_timestep = false;
    var res = this.emulate_throw();
    this.prepare_dices_for_roll(vectors);
    for (var i in res) shift_dice_faces(this.dices[i], values[i], res[i]);
  }
  this.callback = callback;
  this.running = new Date().getTime();
  this.last_time = 0;
  this.__animate(this.running);
};

DiceBox.prototype.__selector_animate = function(threadid) {
  var time = new Date().getTime();
  var time_diff = (time - this.last_time) / 1000;
  if (time_diff > 3) time_diff = frame_rate;
  var angle_change =
    (0.3 * time_diff * Math.PI * Math.min(24000 + threadid - time, 6000)) /
    6000;
  if (angle_change < 0) this.running = false;
  for (var i in this.dices) {
    this.dices[i].rotation.y += angle_change;
    this.dices[i].rotation.x += angle_change / 4;
    this.dices[i].rotation.z += angle_change / 10;
  }
  this.last_time = time;
  this.renderer.render(this.scene, this.camera);
  if (this.running == threadid) {
    (function(t, tid) {
      requestAnimationFrame(function() {
        t.__selector_animate(tid);
      });
    })(this, threadid);
  }
};

DiceBox.prototype.search_dice_by_mouse = function(ev) {
  var m = getMouseCoords(ev);
  var intersects = new THREE.Raycaster(
    this.camera.position,
    new THREE.Vector3(
      (m.x - this.cw) / this.aspect,
      (m.y - this.ch) / this.aspect,
      this.w / 9
    )
      .sub(this.camera.position)
      .normalize()
  ).intersectObjects(this.dices);
  if (intersects.length) return intersects[0].object.userData;
};

DiceBox.prototype.draw_selector = function() {
  this.clear();

  const step = this.w / 4.5;

  this.pane = new THREE.Mesh(
    new THREE.PlaneGeometry(this.w * 6, this.h * 6, 1, 1),
    new THREE.MeshPhongMaterial(selector_back_colors)
  );

  this.pane.receiveShadow = true;
  this.pane.position.set(0, 0, 1);
  this.scene.add(this.pane);

  for (let i = 0, pos = -3; i < DICE_TYPES.length; ++i, ++pos) {
    const dice = DiceBuilder['create_' + DICE_TYPES[i]]();
    dice.position.set(pos * step, 0, step * 0.5);
    dice.castShadow = true;
    dice.userData = DICE_TYPES[i];
    this.dices.push(dice);
    this.scene.add(dice);
  }

  this.running = new Date().getTime();
  this.last_time = 0;
  if (this.animate_selector) this.__selector_animate(this.running);
  else this.renderer.render(this.scene, this.camera);
};

DiceBox.prototype.throw_dices = function(
  vector,
  boost,
  dist,
  notation_getter,
  before_roll,
  after_roll
) {
  var box = this;
  var uat = this.use_adapvite_timestep;
  function roll(request_results) {
    if (after_roll) {
      box.clear();
      box.roll(vectors, request_results || notation.result, function(result) {
        if (after_roll) after_roll.call(box, notation, result);
        box.rolling = false;
        this.use_adapvite_timestep = uat;
      });
    }
  }
  vector.x /= dist;
  vector.y /= dist;
  var notation = notation_getter.call(box);
  if (notation.set.length == 0) return;
  var vectors = box.generate_vectors(notation, vector, boost);
  box.rolling = true;
  if (before_roll) before_roll.call(box, vectors, notation, roll);
  else roll();
};

DiceBox.prototype.bind_mouse = function(
  container,
  notation_getter,
  before_roll,
  after_roll
) {
  var box = this;
  $listen(container, 'mousedown touchstart', function(ev) {
    ev.preventDefault();
    box.mouse_time = new Date().getTime();
    box.mouse_start = getMouseCoords(ev);
  });
  $listen(container, 'mouseup touchend', function(ev) {
    if (box.rolling) return;
    if (box.mouse_start == undefined) return;
    ev.stopPropagation();
    var m = getMouseCoords(ev);
    var vector = {
      x: m.x - box.mouse_start.x,
      y: -(m.y - box.mouse_start.y),
    };
    box.mouse_start = undefined;
    var dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (dist < Math.sqrt(box.w * box.h * 0.01)) return;
    var time_int = new Date().getTime() - box.mouse_time;
    if (time_int > 2000) time_int = 2000;
    var boost = Math.sqrt((2500 - time_int) / 2500) * dist * 2;

    box.throw_dices(
      vector,
      boost,
      dist,
      notation_getter,
      before_roll,
      after_roll
    );
  });
};

DiceBox.prototype.bind_throw = function(
  button,
  notation_getter,
  before_roll,
  after_roll
) {
  var box = this;
  $listen(button, 'mouseup touchend', function(ev) {
    ev.stopPropagation();
    box.start_throw(notation_getter, before_roll, after_roll);
  });
};

DiceBox.prototype.start_throw = function(
  notation_getter,
  before_roll,
  after_roll
) {
  var box = this;
  if (box.rolling) return;

  var vector = { x: (rnd() * 2 - 1) * box.w, y: -(rnd() * 2 - 1) * box.h };
  var dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  var boost = (rnd() + 3) * dist;

  box.throw_dices(
    vector,
    boost,
    dist,
    notation_getter,
    before_roll,
    after_roll
  );
};
