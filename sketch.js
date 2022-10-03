let inputPath = 'sample.wav'
//TODO: The number of planets and the bandwidth range should be inversely proportional
let numPlanets = 3
const variability = 1.2
let clickAttractor = 1.1
const releaseDampener = 1.5;
const density = 10;
const bounceDamp = 0.95;
const bounce = true;
let bandwidthRange = 200; //1000 is narrowest, .001 is widest. Around 50 is interesting
const inputFreq = 50;
const oscFreq = 200;

const enableGravityClick = false;
let auxInput = true;
let inputType = 'FILE' //MIC, FILE

let soundStreamStarted = false;
let planets = [];
var gravityClick, click;


function setup() {
  createCanvas(windowWidth, windowHeight);
  // Starts in the middle
  centerX = width / 2;
  centerY = height / 2;
  if (auxInput) {
    soundStream = makeSound(inputType);
  }
  //Make new planets
  for (let i = 0; i < numPlanets; i++) {
    const i = new Planet(random(width), random(height), random(10, 150));
    planets.push(i)
  };

}

function draw() {
  background(200);
  // Draw a circle

  fill(100);
  ellipse(centerX, centerY, 24, 24);
  // Draw every planet
  for (planet of planets) {
    planet.drawPlanet();
    //check if the mouse is touching the planet
    let d = dist(mouseX, mouseY, planet.position.x, planet.position.y)
    if (d < planet.radius / 2 && click) {
      planet.inPlanet = true;
    } else {
      planet.inPlanet = false;
    }

    //Bounce planets off walls
    if (bounce) {
      if (planet.position.x > width | planet.position.x < 0) {
        planet.velocity.x = -planet.velocity.x * bounceDamp
      }
      if (planet.position.y > height | planet.position.y < 0) {
        planet.velocity.y = -planet.velocity.y * bounceDamp
      }
    }

    //Acceleration toward gravity wells
    if (gravityClick) {
      planet.applyForce((mouseX - planet.position.x) * clickAttractor,
        (mouseY - planet.position.y) * clickAttractor)
    }
    if (!planet.inPlanet && planet.touched) {
      planet.applyForce(centerX - planet.position.x, centerY - planet.position.y)
      planet.update()
    }

  }
}


function mousePressed() {
  if (enableGravityClick) {
    gravityClick = true;
  }
  click = true;
}


function mouseDragged() {
  for (planet of planets) {
    if (planet.inPlanet) {
      planet.position.x = mouseX
      planet.position.y = mouseY
    }
  }
}

function mouseReleased() {
  for (planet of planets) {
    if (planet.inPlanet) {
      planet.velocity.x = movedX / releaseDampener;
      planet.velocity.y = movedY / releaseDampener;
      planet.inPlanet = false;
      planet.touched = true;
      //if we're going off of auxilliary, get whatever aux audio type ready
      //After you release the first planet, start the loaded audio. This is for web browsers
      if (auxInput) {
        if (!soundStreamStarted) {
          if (inputType === 'FILE') {
            soundStream.loop()
            soundStreamStarted = true
          }
        }
      } else {
        //start the planet's own oscillator
        planet.osc.start();
      }
    }
  }
  if (enableGravityClick) {
    gravityClick = false;
  }
  click = false;
}
function makeSound(soundtype) {
  switch (soundtype) {
    case 'FILE':
      soundStream = loadSound(inputPath)
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
    this.radius = r
    this.mass = this.radius * density
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.red = random(255);
    this.green = random(255);
    this.blue = random(255);
    this.alpha = random(200, 255);

    //Oscillator setup
    if (!auxInput) {
      this.osc = new p5.TriOsc();
    } else {
      this.filter = new p5.BandPass();
      this.filter.res(bandwidthRange);
      this.filter.process(soundStream)
    }
    this.inPlanet = false;
    this.touched = false;
    this.momentum = this.mass * this.velocity
  }

  drawPlanet() {
    noStroke();
    fill(this.red, this.green, this.blue, this.alpha);
    circle(this.position.x, this.position.y, this.radius);
  }

  update() {
    // Velocity changes according to acceleration
    this.velocity.add(this.acceleration);
    // Position changes by velocity
    this.position.add(this.velocity);
    // We must clear acceleration each frame
    this.acceleration.mult(0);
    if (auxInput) {
      this.freq = this.radius * inputFreq * mag(variability * (this.velocity.x), variability * (this.velocity.y)) / this.radius
    } else {
      this.freq = this.radius * oscFreq * mag(variability * (this.velocity.x), variability * (this.velocity.y)) / this.radius
    }
    // If there's no input, synthesize. If there is an input, filter input
    if (auxInput) {
      this.filter.set(this.freq)
    } else {
      this.osc.freq(this.freq)
      this.osc.amp(this.momentum);

    };
  }

  applyForce(xComp, yComp) {
    this.acceleration.add(xComp / this.mass, yComp / this.mass)
  }
}


//TODO: Universe gravity body physics - Planets bounce off each other

//TODO: button to add new planets
