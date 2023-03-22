let numPlanets = 3;
const variability = 1.2;
let clickAttractor = 1.1;
const releaseDampener = 1.5;
const density = 10;
const bounceDamp = 0.95;
const bounce = true;
let bandwidthRange = 200; // 1000 is narrowest, .001 is widest. Around 50 is interesting.
const inputFreq = 50;
const oscFreq = 200;

const enableGravityClick = false;
let auxInput = true;
let inputType = 'FILE'; // MIC, FILE
const inputPath = 'sample.wav'


let soundStreamStarted = false;
let planets = [];
let gravityClick, click;

function setup() {
  createCanvas(windowWidth, windowHeight);

  centerX = width / 2;
  centerY = height / 2;

  if (auxInput) {
    soundStream = makeSound(inputType);
  }

  for (let i = 0; i < numPlanets; i++) {
    const p = new Planet(random(width), random(height), random(10, 150));
    planets.push(p);
  }
}

function draw() {
  background(200);

  fill(100);
  ellipse(centerX, centerY, 24, 24);

  for (let planet of planets) {
    planet.drawPlanet();
    let d = dist(mouseX, mouseY, planet.position.x, planet.position.y);

    if (d < planet.radius / 2 && click) {
      planet.inPlanet = true;
    } else {
      planet.inPlanet = false;
    }

    if (bounce) {
      if (planet.position.x > width || planet.position.x < 0) {
        planet.velocity.x = -planet.velocity.x * bounceDamp;
      }
      if (planet.position.y > height || planet.position.y < 0) {
        planet.velocity.y = -planet.velocity.y * bounceDamp;
      }
    }
    checkBounce()
    if (gravityClick) {
      planet.applyForce((mouseX - planet.position.x) * clickAttractor,
        (mouseY - planet.position.y) * clickAttractor);
    }
    if (!planet.inPlanet && planet.touched) {
      planet.applyForce(centerX - planet.position.x, centerY - planet.position.y);
      planet.update();
    }
  }
}

function addPlanet(x, y, r) {
  const p = new Planet(x, y, r);
  planets.push(p);
}

function removePlanet(index) {
  if (index >= 0 && index < planets.length) {
    if (planets[index].filter) {
      planets[index].filter.disconnect();
    }
    planets.splice(index, 1);
  }
}

function mousePressed() {
  if (enableGravityClick) {
    gravityClick = true;
  }
  click = true;

if (keyIsDown(65)) { // 'a' key
    addPlanet(mouseX, mouseY, random(10, 150));
  } else if (keyIsDown(82)) { // 'r' key
    let planetIndex = -1;
    for (let i = 0; i < planets.length; i++) {
      if (dist(mouseX, mouseY, planets[i].position.x, planets[i].position.y) < planets[i].radius / 2) {
        planetIndex = i;
        break;
      }
    }
    if (planetIndex >= 0) {
      removePlanet(planetIndex);
    }
  }
}

function mouseDragged() {
  for (let planet of planets) {
    if (planet.inPlanet) {
      planet.position.x = mouseX;
      planet.position.y = mouseY;
    }
  }
}

function mouseReleased() {
  for (let planet of planets) {
    if (planet.inPlanet) {
      planet.velocity.x = movedX / releaseDampener;
      planet.velocity.y = movedY / releaseDampener;
      planet.inPlanet = false;
      planet.touched = true;

      if (auxInput) {
        if (!soundStreamStarted) {
          if (inputType === 'FILE') {
            soundStream.loop();
            soundStreamStarted = true;
          }
        }
      } else {
        planet.osc.start();
      }
    }
  }
  if (enableGravityClick) {
    gravityClick = false;
  }
  click = false;
}

function checkBounce() {
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let d = dist(planets[i].position.x, planets[i].position.y, planets[j].position.x, planets[j].position.y);
      let minDist = (planets[i].radius + planets[j].radius) / 2;

      if (d <= minDist) {
        let normal = p5.Vector.sub(planets[i].position, planets[j].position).normalize();
        let relativeVelocity = p5.Vector.sub(planets[i].velocity, planets[j].velocity);

        let impulse = p5.Vector.mult(normal, -2 * planets[j].mass / (planets[i].mass + planets[j].mass) * normal.dot(relativeVelocity));
        planets[i].velocity.add(impulse);

        impulse = p5.Vector.mult(normal, 2 * planets[i].mass / (planets[i].mass + planets[j].mass) * normal.dot(relativeVelocity));
        planets[j].velocity.add(impulse);

        while (dist(planets[i].position.x, planets[i].position.y, planets[j].position.x, planets[j].position.y) <= minDist) {
          planets[i].position.add(planets[i].velocity);
          planets[j].position.add(planets[j].velocity);
        }
      }
    }
  }
}

function makeSound(soundtype) {
  switch (soundtype) {
    case 'FILE':
      soundStream = loadSound(inputPath);
     
      soundStream.disconnect();
      return soundStream;
    case 'MIC':
      soundStream = new p5.AudioIn();
      soundStream.start();
      bandwidthRange = 10;
      soundStreamStarted = true;
      return soundStream;
    default:
      soundStream = new p5.triOsc();
      return soundStream;
  }
}

class Planet {
  constructor(x, y, r) {
    this.radius = r;
    this.mass = this.radius * density;
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.red = random(255);
    this.green = random(255);
    this.blue = random(255);
    this.alpha = random(200, 255);

    if (!auxInput) {
      this.osc = new p5.TriOsc();
    } else {
      this.filter = new p5.BandPass();
      this.filter.res(bandwidthRange);
      this.filter.process(soundStream);
    }
    this.inPlanet = false;
    this.touched = false;
    this.momentum = this.mass * this.velocity;
  }

  drawPlanet() {
    noStroke();
    fill(this.red, this.green, this.blue, this.alpha);
    circle(this.position.x, this.position.y, this.radius);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    if (auxInput) {
      this.freq = this.radius * inputFreq * mag(variability * (this.velocity.x), variability * (this.velocity.y)) / this.radius;
    } else {
      this.freq = this.radius * oscFreq * mag(variability * (this.velocity.x), variability * (this.velocity.y)) / this.radius;
    }

    if (auxInput) {
      this.filter.set(this.freq);
    } else {
      this.osc.freq(this.freq);
      this.osc.amp(this.momentum);
    }
  }

  applyForce(xComp, yComp) {
    this.acceleration.add(xComp / this.mass, yComp / this.mass);
  }
}
