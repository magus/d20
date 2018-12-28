// @flow
import * as THREE from 'three';
import CANNON from '~/libs/cannon.min';

import DICE from '~/app/utils/DICE';
import rand, { randVector } from '~/app/utils/rand';
import { $listen, $canvasMouseCoords } from '~/app/utils/dom';
import {
  DiceBuilder,
  readDices,
  shiftDiceFaces,
} from '~/app/utils/DiceObjectModels';

const FPS = 1 / 60;

const OBJECTS = {
  AmbientLight: 0xf0f5fb,
  SpotLight: 0xefdfd5,
  ThrowDesk: { color: 0xffffff },
  SelectDesk: {
    color: 0xffffff,
    shininess: 0,
    emissive: 0x000000,
  },
};

const DICE_MASS = {
  [DICE.Type.d4]: 300,
  [DICE.Type.d6]: 300,
  [DICE.Type.d8]: 340,
  [DICE.Type.d10]: 350,
  [DICE.Type.d12]: 350,
  [DICE.Type.d20]: 400,
  [DICE.Type.d100]: 350,
};

const DICE_INERTIA = {
  [DICE.Type.d4]: 5,
  [DICE.Type.d6]: 13,
  [DICE.Type.d8]: 10,
  [DICE.Type.d10]: 9,
  [DICE.Type.d12]: 8,
  [DICE.Type.d20]: 6,
  [DICE.Type.d100]: 9,
};

export default function DiceBox(
  container: Element,
  dimensions: { w: number, h: number }
) {
  this.useAdaptiveTimestep = true;
  this.animateSelector = true;
  this.isShowingSelector = true;

  this.dices = [];
  this.scene = new THREE.Scene();
  this.world = new CANNON.World();

  this.renderer = window.WebGLRenderingContext
    ? new THREE.WebGLRenderer({ antialias: true })
    : new THREE.CanvasRenderer({ antialias: true });

  // Setup DOM element for renderer
  container.appendChild(this.renderer.domElement);

  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMap.type = THREE.PCFShadowMap;
  this.renderer.setClearColor(0xffffff, 1);

  this.setupContainer(container, dimensions);

  this.world.gravity.set(0, 0, -9.8 * 800);
  this.world.broadphase = new CANNON.NaiveBroadphase();
  this.world.solver.iterations = 16;

  this.scene.add(new THREE.AmbientLight(OBJECTS.AmbientLight));

  this.diceMaterial = new CANNON.Material();

  const deskMaterial = new CANNON.Material();
  const barrierMaterial = new CANNON.Material();

  this.world.addContactMaterial(
    new CANNON.ContactMaterial(deskMaterial, this.diceMaterial, 0.01, 0.5)
  );

  this.world.addContactMaterial(
    new CANNON.ContactMaterial(barrierMaterial, this.diceMaterial, 0, 1.0)
  );

  this.world.addContactMaterial(
    new CANNON.ContactMaterial(this.diceMaterial, this.diceMaterial, 0, 0.5)
  );

  this.world.add(new CANNON.RigidBody(0, new CANNON.Plane(), deskMaterial));

  // Setup desk barriers (prevent dice going off desk)
  let barrier;

  // Top barrier
  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrierMaterial);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  barrier.position.set(0, this.h * 0.93, 0);
  this.world.add(barrier);

  // Bottom barrier
  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrierMaterial);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  barrier.position.set(0, -this.h * 0.93, 0);
  this.world.add(barrier);

  // Right barrier
  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrierMaterial);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
  barrier.position.set(this.w * 0.93, 0, 0);
  this.world.add(barrier);

  // Left barrier
  barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrierMaterial);
  barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
  barrier.position.set(-this.w * 0.93, 0, 0);
  this.world.add(barrier);

  this.lastTime = 0;
  this.running = false;

  this.renderer.render(this.scene, this.camera);
}

DiceBox.prototype.setupContainer = function(container, dimensions) {
  this.cw = container.clientWidth / 2;
  this.ch = container.clientHeight / 2;

  if (dimensions) {
    this.w = dimensions.w;
    this.h = dimensions.h;
  } else {
    this.w = this.cw;
    this.h = this.ch;
  }

  const maxDimension = Math.max(this.w, this.h);

  // Remove existing light from scene
  if (this.light) this.scene.remove(this.light);

  // Build new light
  this.light = new THREE.SpotLight(OBJECTS.SpotLight, 2.0);
  this.light.position.set(
    -maxDimension / 2,
    maxDimension / 2,
    maxDimension * 2
  );
  this.light.target.position.set(0, 0, 0);
  this.light.distance = maxDimension * 5;
  this.light.castShadow = true;
  this.light.shadowCameraNear = maxDimension / 10;
  this.light.shadowCameraFar = maxDimension * 5;
  this.light.shadowCameraFov = 50;
  this.light.shadowBias = 0.001;
  this.light.shadowDarkness = 1.1;
  this.light.shadowMapWidth = 1024;
  this.light.shadowMapHeight = 1024;

  // Add light to scene
  this.scene.add(this.light);

  // Remove existing desk from scene
  if (this.desk) this.scene.remove(this.desk);

  // Build new desk
  this.desk = new THREE.Mesh(
    new THREE.PlaneGeometry(this.w * 2, this.h * 2, 1, 1),
    new THREE.MeshPhongMaterial(OBJECTS.ThrowDesk)
  );
  this.desk.receiveShadow = true;

  // Add desk to scene
  this.scene.add(this.desk);

  // Setup camera
  if (this.camera) this.scene.remove(this.camera);
  this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
  this.wh = this.ch / this.aspect / Math.tan((10 * Math.PI) / 180);
  this.camera = new THREE.PerspectiveCamera(
    20,
    this.cw / this.ch,
    1,
    this.wh * 1.3
  );
  this.camera.position.z = this.wh;

  // Render scene with camera
  this.renderer.setSize(this.cw * 2, this.ch * 2);
  this.renderer.render(this.scene, this.camera);
};

DiceBox.prototype.generateVectors = function(dices, vector, boost) {
  const vectors = [];

  for (let i in dices) {
    const dice = dices[i];
    const vec = randVector(vector);
    const pos = {
      x: this.w * (vec.x > 0 ? -1 : 1) * 0.9,
      y: this.h * (vec.y > 0 ? -1 : 1) * 0.9,
      z: rand() * 200 + 200,
    };
    const projector = Math.abs(vec.x / vec.y);

    if (projector > 1.0) pos.y /= projector;
    else pos.x *= projector;

    const velvec = randVector(vector);
    const velocity = { x: velvec.x * boost, y: velvec.y * boost, z: -10 };
    const inertia = DICE_INERTIA[dice];
    const angle = {
      x: -(rand() * vec.y * 5 + inertia * vec.y),
      y: rand() * vec.x * 5 + inertia * vec.x,
      z: 0,
    };
    const axis = { x: rand(), y: rand(), z: rand(), a: rand() };

    vectors.push({
      dice,
      pos,
      velocity,
      angle,
      axis,
    });
  }

  return vectors;
};

DiceBox.prototype.createDice = function(type, pos, velocity, angle, axis) {
  const dice = DiceBuilder[type]();

  dice.castShadow = true;
  dice.type = type;

  dice.body = new CANNON.RigidBody(
    DICE_MASS[type],
    dice.geometry.cannon_shape,
    this.diceMaterial
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

  this.dices.push(dice);

  this.scene.add(dice);
  this.world.add(dice.body);
};

DiceBox.prototype.checkIfThrowFinished = function() {
  let done = true;
  const e = 6;

  if (this.iteration < 10 / FPS) {
    for (let i = 0; i < this.dices.length; ++i) {
      const dice = this.dices[i];

      if (dice.diceStopped === true) continue;

      const a = dice.body.angularVelocity;
      const v = dice.body.velocity;
      if (
        Math.abs(a.x) < e &&
        Math.abs(a.y) < e &&
        Math.abs(a.z) < e &&
        Math.abs(v.x) < e &&
        Math.abs(v.y) < e &&
        Math.abs(v.z) < e
      ) {
        if (dice.diceStopped) {
          if (this.iteration - dice.diceStopped > 3) {
            dice.diceStopped = true;
            continue;
          }
        } else {
          dice.diceStopped = this.iteration;
        }

        done = false;
      } else {
        dice.diceStopped = undefined;
        done = false;
      }
    }
  }

  return done;
};

DiceBox.prototype.emulateThrow = function() {
  while (!this.checkIfThrowFinished()) {
    ++this.iteration;
    this.world.step(FPS);
  }
  return readDices(this.dices);
};

DiceBox.prototype.__animate = function(threadId) {
  const now = new Date().getTime();
  let timeDiff = (now - this.lastTime) / 1000;

  if (timeDiff > 3) timeDiff = FPS;

  ++this.iteration;

  try {
    if (this.useAdaptiveTimestep) {
      while (timeDiff > FPS * 1.1) {
        this.world.step(FPS);
        timeDiff -= FPS;
      }
      this.world.step(timeDiff);
    } else {
      this.world.step(FPS);
    }
  } catch (err) {
    console.error(err);
  }

  for (let i in this.scene.children) {
    const interact = this.scene.children[i];
    if (interact.body !== undefined) {
      interact.position.copy(interact.body.position);
      interact.quaternion.copy(interact.body.quaternion);
    }
  }

  this.lastTime = now;
  this.renderer.render(this.scene, this.camera);

  if (this.running === threadId && this.checkIfThrowFinished()) {
    this.running = false;
    if (this.callback) this.callback.call(this, readDices(this.dices));
  }

  if (this.running === threadId) {
    (function(t, tid, uat) {
      if (!uat && timeDiff < FPS) {
        setTimeout(function() {
          requestAnimationFrame(function() {
            t.__animate(tid);
          });
        }, (FPS - timeDiff) * 1000);
      } else
        requestAnimationFrame(function() {
          t.__animate(tid);
        });
    })(this, threadId, this.useAdaptiveTimestep);
  }
};

DiceBox.prototype.clear = function() {
  this.running = false;

  // Remove all dice
  let dice;
  while ((dice = this.dices.pop())) {
    this.scene.remove(dice);
    if (dice.body) this.world.remove(dice.body);
  }

  if (this.pane) this.scene.remove(this.pane);

  this.renderer.render(this.scene, this.camera);
};

DiceBox.prototype.prepareDicesForRoll = function(vectors) {
  this.clear();
  this.iteration = 0;

  for (let i in vectors) {
    this.createDice(
      vectors[i].dice,
      vectors[i].pos,
      vectors[i].velocity,
      vectors[i].angle,
      vectors[i].axis
    );
  }
};

DiceBox.prototype.roll = function(vectors, values, callback) {
  this.prepareDicesForRoll(vectors);

  if (values !== undefined && values.length) {
    this.useAdaptiveTimestep = false;
    const throwResult = this.emulateThrow();
    this.prepareDicesForRoll(vectors);
    for (let i in throwResult) shiftDiceFaces(this.dices[i], values[i], throwResult[i]);
  }

  this.callback = callback;
  this.running = new Date().getTime();
  this.lastTime = 0;
  this.__animate(this.running);
};

DiceBox.prototype.__animateSelector = function(threadId) {
  const now = new Date().getTime();
  let timeDiff = (now - this.lastTime) / 1000;

  if (timeDiff > 3) timeDiff = FPS;

  const angleDelta =
    (0.3 * timeDiff * Math.PI * Math.min(24000 + threadId - now, 6000)) / 6000;

  if (angleDelta < 0) this.running = false;

  for (let i in this.dices) {
    this.dices[i].rotation.y += angleDelta;
    this.dices[i].rotation.x += angleDelta / 4;
    this.dices[i].rotation.z += angleDelta / 10;
  }

  this.lastTime = now;
  this.renderer.render(this.scene, this.camera);

  if (this.running === threadId) {
    (function(t, tid) {
      requestAnimationFrame(function() {
        t.__animateSelector(tid);
      });
    })(this, threadId);
  }
};

DiceBox.prototype.searchDiceByMouse = function(ev) {
  const m = $canvasMouseCoords(ev);
  const intersects = new THREE.Raycaster(
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

DiceBox.prototype.showSelector = function() {
  this.isShowingSelector = true;

  this.clear();

  const step = this.w / 4.5;

  this.pane = new THREE.Mesh(
    new THREE.PlaneGeometry(this.w * 6, this.h * 6, 1, 1),
    new THREE.MeshPhongMaterial(OBJECTS.SelectDesk)
  );

  this.pane.receiveShadow = true;
  this.pane.position.set(0, 0, 1);
  this.scene.add(this.pane);

  for (let i = 0, pos = -3; i < DICE.AllTypes.length; ++i, ++pos) {
    const dice = DiceBuilder[DICE.AllTypes[i]]();
    dice.position.set(pos * step, 0, step * 0.5);
    dice.castShadow = true;
    dice.userData = DICE.AllTypes[i];
    this.dices.push(dice);
    this.scene.add(dice);
  }

  this.running = new Date().getTime();
  this.lastTime = 0;
  if (this.animateSelector) this.__animateSelector(this.running);
  else this.renderer.render(this.scene, this.camera);
};

DiceBox.prototype.throwDices = function(
  vector,
  boost,
  dist,
  getNotation,
  onBeforeRoll,
  onAfterRoll
) {
  this.rolling = true;
  this.isShowingSelector = false;

  vector.x /= dist;
  vector.y /= dist;

  const uat = this.useAdaptiveTimestep;

  const notation = getNotation();
  const allDice = [];
  const forcedResults = [];
  notation.forEach((roll) => {
    if (roll.error) return;

    roll.d.forEach((d, i) => {
      const index = allDice.push(d) - 1;
      if (roll.result[i]) {
        forcedResults[index] = roll.result[i];
      }
    })
  });

  if (allDice.length === 0) return;

  const vectors = this.generateVectors(allDice, vector, boost);

  const roll = (overrideResults) => {
    if (onAfterRoll) {
      this.clear();
      this.roll(vectors, overrideResults || forcedResults, (result) => {
        if (onAfterRoll) onAfterRoll(notation, result);
        this.rolling = false;
        this.useAdaptiveTimestep = uat;
      });
    }
  }

  if (onBeforeRoll) {
    onBeforeRoll(vectors, notation, roll);
  } else {
    roll();
  }
};

DiceBox.prototype.bindMouse = function(
  container,
  getNotation,
  onBeforeRoll,
  onAfterRoll
) {
  $listen(container, 'mousedown touchstart', ev => {
    this.mouseTime = new Date().getTime();
    this.mouseStart = $canvasMouseCoords(ev);
  });

  $listen(container, 'mouseup touchend', ev => {
    if (this.rolling) return;
    if (this.mouseStart === undefined) return;

    ev.stopPropagation();

    const m = $canvasMouseCoords(ev);
    const vector = {
      x: m.x - this.mouseStart.x,
      y: -(m.y - this.mouseStart.y),
    };

    this.mouseStart = undefined;

    const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (dist < Math.sqrt(this.w * this.h * 0.01)) return;

    let duration = new Date().getTime() - this.mouseTime;
    if (duration > 2000) duration = 2000;

    const boost = Math.sqrt((2500 - duration) / 2500) * dist * 2;

    this.throwDices(
      vector,
      boost,
      dist,
      getNotation,
      onBeforeRoll,
      onAfterRoll
    );
  });
};

DiceBox.prototype.bindThrow = function(
  button,
  getNotation,
  onBeforeRoll,
  onAfterRoll
) {
  $listen(button, 'mouseup touchend', ev => {
    ev.stopPropagation();
    this.startThrow(getNotation, onBeforeRoll, onAfterRoll);
  });
};

DiceBox.prototype.startThrow = function(
  getNotation,
  onBeforeRoll,
  onAfterRoll
) {
  if (this.rolling) return;

  const vector = {
    x: (rand() * 2 - 1) * this.w,
    y: -(rand() * 2 - 1) * this.h,
  };
  const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  const boost = (rand() + 3) * dist;

  this.throwDices(vector, boost, dist, getNotation, onBeforeRoll, onAfterRoll);
};
