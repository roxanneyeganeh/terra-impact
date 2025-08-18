const seabornedeep = [
  "#e74c3c",   // soft red
  "#3498db",  // light blue
  "#2ecc71",  // mint green
  "rgb(155, 89, 182)",  // violet
  "rgb(241, 196, 15)",  // amber
  "#e67e22",  // orange
  "rgb(149, 165, 166)", // muted gray-blue
  "rgb(243, 156, 18)",  // golden orange
  "#1abc9c",  // teal
  "rgb(127, 140, 141)", // dark gray
  "rgb(93, 173, 226)",  // sky blue
  "#58d68d",  // light green
  "rgb(245, 176, 65)",  // light orange
  "rgb(169, 204, 227)", // soft blue
  "rgb(255, 99, 132)",  // coral pink
  "rgb(118, 68, 138)"   // deep plum
];



const TIMEOUT = 5000;
const scolor0 = "ivory";
const scolor1 = "navy";
const swgt0 = 0.03;
const swgt1 = 0.015;
const MAXROWCOL = 7;

let userData = {
  commute: 'drive',
  recycle: true,
  plasticItems: 5,
  energyEfficient: true,
  compost: true,
  excessivePackaging: true,
  bottleCount: 1,
  
};

let userColors = [];
let palette = [];
let rowcol, scnsz;
let tmr;
let init, pause;

let ms; // mosaic31 instance
let bottleModel; // 3D model

let patternGraphics; // offscreen buffer for mosaic pattern texture


let angleX = 0;
let angleY = 0;
let angleZ = 0;
 // only rotate around Y axis
let dragging = false;
let lastX, lastY;

function preload() {
  // Load your OBJ file from assets folder
  bottleModel = loadModel('assets/bottle.obj', true);
   createMenuBar(); // Defined in menu.js
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
 



  

  angleMode(DEGREES);
  ellipseMode(RADIUS);
  rectMode(CENTER);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  tmr = new msTmr(TIMEOUT);
  rowcol = MAXROWCOL;
  init = true;
  pause = false;
  palette = shuffle(seabornedeep);

  textureWrap(REPEAT);     // enable repeating texture wrapping
  textureMode(NORMAL);     // this one controls UV coords

  patternGraphics = createGraphics(1024, 1024);
  patternGraphics.background(255); // white background instead of black
  patternGraphics.fill(255, 255, 255, 200); // semi-transparent white

  patternGraphics.angleMode(DEGREES);
  patternGraphics.ellipseMode(RADIUS);
  patternGraphics.rectMode(CENTER);
  patternGraphics.noStroke();
  

  updateUserColors();
  setupInputs();

 noLoop();

   let basketButton = select('#add-to-basket-btn');
  basketButton.mousePressed(addToBasket);

  // Create "Save and Go" button
  let saveButton = createButton('Save and Go');
  saveButton.position(10, height + 10);
  saveButton.mousePressed(saveAndRedirect);


}


function draw() {
  if (init) {
    if (rowcol < 1) {
      rowcol = MAXROWCOL;
      palette = shuffle(seabornedeep);
    }
    drawPatternToGraphics();
    init = false;
  }


  background('#0A121C');
  directionalLight(255, 255, 255, 0, -1, -100);
  directionalLight(255, 255, 255, 0.5, -1, -0.5); // white light from above
ambientLight(80);


let baseScale = map(min(windowWidth, windowHeight), 400, 1400, 1, 2.4);
scale(baseScale); // overall scaling of the 3D context

let modelScaleX = map(windowWidth, 400, 1400, 1.9, 1.9);
let modelScaleY = map(windowHeight, 400, 1400, 1.3, 1.5);
scale(modelScaleX, modelScaleY);

let translateX = map(windowWidth, 0, 1400, 0, -70);
translate(translateX, -20, 0);


// Flip bottle right side up
rotateX(180);
rotateY(180);

rotateX(angleX);
rotateY(angleY);
rotateZ(angleZ);

 // or remove if flipping isn’t needed // Subtle Z rotation


         

                 // Slightly transparent texture
ambientMaterial(80);            // Material reacts to ambient light
specularMaterial(255);           // Material shines with specular highlights
shininess(20);                  // Shininess for smooth reflections

texture(patternGraphics);        // Apply the pattern texture
noStroke();                     // Remove edges for clean render

model(bottleModel);  
push();
translate(0, 90, 0); // Move up by 100 pixels
 // adjust this Y offset to align with top
rotateX(180);
fill('#2B2B2B');  


ambientLight(80);

directionalLight(255, 255, 255, 0, -1, -1);
directionalLight(200, 200, 255, 1, 0, -1);
directionalLight(150, 150, 150, -1, 1, -0.5);

ambientMaterial(200, 200, 200);  // Cool silver
specularMaterial(255);           // White shiny highlights
shininess(120);
noStroke();
cylinder(16, 20);  

          
pop();




  // Optional: small debug preview of pattern in 2D
push();
resetMatrix(); // Reset to default 2D coordinate system
translate(-width / 2, -height / 2); // Move origin to top-left
let imgW = windowWidth * 0.2;
let imgH = imgW * 0.8;
image(patternGraphics, windowWidth - imgW - 20, 50, imgW, imgH);
 // Adjust X for width of image
pop();

}

function addToBasket() {

}

function saveAndRedirect() {
  let imgData = canvas.toDataURL("image/png");
  sessionStorage.setItem("savedCanvasImage", imgData);
  window.location.href = "/trace-by-terra";
}

function mousePressed() {
  dragging = true;
  lastX = mouseX;
  lastY = mouseY;
}

function mouseReleased() {
  dragging = false;
}

function mouseDragged() {
  let dx = mouseX - lastX;
  let dy = mouseY - lastY;

  const sensitivity = 0.20;

  if (keyIsDown(SHIFT)) {
    angleZ -= dx * sensitivity;   // note the minus here
  } else {
    angleY -= dx * sensitivity;   // flip sign here
    angleX += dy * sensitivity;   // flip sign here if needed
  }

  lastX = mouseX;
  lastY = mouseY;

  redraw();
}


// Draw your mosaic pattern on patternGraphics buffer
function drawPatternToGraphics() {
  const numicons = 27;
  const bsz = patternGraphics.width / numicons;
  const sz = (patternGraphics.width - bsz * 2) / rowcol;

  patternGraphics.background(0);
  ms = new mosaic31(sz);

  let org = bsz + sz / 2;

  for (let c = 0; c < rowcol; c++) {
    let ys = c * sz + org;
    for (let r = 0; r < rowcol; r++) {
      let xs = r * sz + org;
      ms.draw(patternGraphics, xs, ys);
    }
  }

  drawBorderOnGraphics(patternGraphics, sz, bsz, numicons);

//   patternGraphics.fill(255, 225, 255); 
// patternGraphics.noStroke();
// patternGraphics.rect(200, 100, 5000, 2000 * 0.1);

}

function updateUserColors() {
  const commuteMap = { drive: 0, public: 1, bike: 2, walk: 3 };
  userColors = [];

  userColors.push(seabornedeep[commuteMap[userData.commute] || 0]); // 0 - commute
  userColors.push(userData.recycle ? seabornedeep[4] : seabornedeep[7]); // 1 - recycle

  let plasticIndex = floor(map(userData.plasticItems, 0, 50, 0, 9));
  plasticIndex = constrain(plasticIndex, 0, 9);
  userColors.push(seabornedeep[plasticIndex]); // 2 - plastic use

  userColors.push(userData.energyEfficient ? seabornedeep[1] : seabornedeep[6]); // 3 - energy efficient

  userColors.push(userData.compost ? seabornedeep[5] : seabornedeep[8]); // 4 - compost

  userColors.push(userData.excessivePackaging ? seabornedeep[2] : seabornedeep[9]); // 5 - packaging habits

  let bottleIndex = floor(map(userData.bottleCount, 0, 10, 0, 9));
  bottleIndex = constrain(bottleIndex, 0, 9);
  userColors.push(seabornedeep[bottleIndex]); // 6 - bottle count


  init = true;
  redraw();
}

// Modified mosaic31 draw method to accept graphics buffer
class mosaic31 {
  constructor(sz) {
    const minus1 = (i, len) => (i + len - 1) % len;
    const A2 = 360 / 2;
    const A4 = A2 / 2;
    const A8 = A4 / 2;
    const A16 = A8 / 2;
    this.sz = sz;
    let r = sz / 4;
    this.star = [];
    this.spike = [];
    for (let i = 0; i < 8; i++) {
      let ang = i * A8;
      this.star[i * 2] = polarPt(r * cos(40), ang);
      this.star[i * 2 + 1] = polarPt(r, ang + A16);
      this.spike[i] = [
        polarPt(r, minus1(i, 8) * A8 + A16),
        polarPt(r * cos(40), ang),
        polarPt(r, ang + A16),
        polarPt(2 * r, ang),
      ];
    }
    let r2 = (sz / 2) * SQ2 - sz / 2;

    this.corners = [];
    this.crnspike = [];
    for (let i = 0; i < 4; i++) {
      let ang = i * A4 + A8;
      this.corners[i] = polarPt((sz / 2) * SQ2, ang);
      this.crnspike[i] = [
        polarPt((sz / 2) * SQ2, ang),
        polarPt(r2 * cos(A8 + A16), 180 + i * A4).add(this.corners[i]),
        polarPt(r2, ang + A2).add(this.corners[i]),
        polarPt(r2 * cos(A8 + A16), 270 + i * A4).add(this.corners[i]),
      ];
    }
    this.irreghex = [];
    // noStroke(); // removed from constructor — do it in draw
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        this.irreghex[i] = [
          this.spike[i][3],
          this.spike[i][2],
          this.spike[(i + 1) % 8][3],
          this.crnspike[floor(i / 2)][3],
        ];
      } else {
        this.irreghex[i] = [
          this.crnspike[floor(i / 2)][1],
          this.spike[i][3],
          this.spike[i][2],
          this.spike[(i + 1) % 8][3],
        ];
      }
    }
  }

  draw(gfx, xs, ys) {
    gfx.push();
    gfx.translate(xs, ys);
    gfx.noStroke();

    gfx.fill(userColors[0] || palette[0]);
    gfx.beginShape();
    this.star.forEach((p) => gfx.vertex(p.x, p.y));
    gfx.endShape(CLOSE);

    let evenodd = true;
    for (const p of this.spike) {
      gfx.fill(evenodd ? (userColors[1] || palette[1]) : (userColors[2] || palette[2]));
      gfx.beginShape();
      p.forEach((pt) => gfx.vertex(pt.x, pt.y));
      gfx.endShape(CLOSE);
      evenodd = !evenodd;
    }
    for (const p of this.crnspike) {
      gfx.fill(userColors[5] || palette[5]);
      gfx.beginShape();
      p.forEach((pt) => gfx.vertex(pt.x, pt.y));
      gfx.endShape(CLOSE);
    }

    gfx.strokeWeight(this.sz * swgt0);
    gfx.stroke(scolor0);

    evenodd = true;
    for (const p of this.irreghex) {
      gfx.fill(evenodd ? (userColors[3] || palette[3]) : (userColors[4] || palette[4]));
      gfx.beginShape();
      p.forEach((pt) => gfx.vertex(pt.x, pt.y));
      gfx.endShape(CLOSE);
      evenodd = !evenodd;
    }

    gfx.strokeWeight(this.sz * swgt1);
    gfx.stroke(scolor1);
    gfx.fill(userColors[0] || palette[0]);
    gfx.beginShape();
    this.star.forEach((p) => gfx.vertex(p.x, p.y));
    gfx.endShape(CLOSE);

    gfx.pop();
  }
}

function drawBorderOnGraphics(gfx, sz, bsz, cnt) {
  let tile = createTile(bsz, "aliceblue", "steelblue");
  gfx.noFill();
  for (let i = 0; i < cnt; i++) gfx.image(tile, i * bsz, 0);
  for (let i = 0; i < cnt; i++) gfx.image(tile, gfx.width - bsz, i * bsz);
  for (let i = 0; i < cnt; i++) gfx.image(tile, i * bsz, gfx.height - bsz);
  for (let i = 0; i < cnt; i++) gfx.image(tile, 0, i * bsz);
}

function createTile(sz, c0, c1) {
  let pg0 = createGraphics(sz, sz);
  pg0.noStroke();
  pg0.fill(c0);
  pg0.rect(0, 0, sz, sz);
  pg0.strokeWeight(sz * 0.05);
  pg0.stroke(c1);
  let c = new Pt(sz / 2, sz / 2);
  let r = sz / 2;
  let star4 = [];
  for (let i = 0; i < 4; i++) {
    let ang = (i * 360) / 4;
    star4[i * 2] = polarPt(0.8 * r, ang).add(c);
    star4[i * 2 + 1] = polarPt(0.3 * r, ang + 360 / 8).add(c);
  }
  pg0.fill(c1);
  pg0.beginShape();
  for (const p of star4) pg0.vertex(p.x, p.y);
  pg0.endShape(CLOSE);
  return pg0;
}

mouseClicked = () => {
  if (
    mouseX > 0.7 * width &&
    mouseX < width &&
    mouseY > 0.7 * height &&
    mouseY < height
  ) {
    pause = !pause;
  }
};



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  init = true;
  redraw();
}



function msTmr(msecs) {
  this.delay = msecs;
  this.ref = millis();
  this.check = function () {
    return millis() >= this.delay + this.ref;
  };
  this.reset = function (msecs) {
    this.delay = msecs;
    this.ref = millis();
  };
}

const SQ2 = Math.sqrt(2);

class Pt {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(other) {
    return new Pt(this.x + other.x, this.y + other.y);
  }
  sub(other) {
    return new Pt(this.x - other.x, this.y - other.y);
  }
}

const polarPt = (l, a) => {
  let x = l * cos(a);
  let y = l * sin(a);
  return new Pt(x, y);
};

// --- INPUT HANDLERS ---

function setupInputs() {
  select('#commute').changed(() => {
    userData.commute = select('#commute').value();
    updateUserColors();
  });

  selectAll('input[name="recycle"]').forEach(radio => {
    radio.changed(() => {
      userData.recycle = select('input[name="recycle"]:checked').value() === 'yes';
      updateUserColors();
    });
  });

  select('#plasticItems').input(() => {
    userData.plasticItems = int(select('#plasticItems').value());
    updateUserColors();
  });

  selectAll('input[name="energyEfficient"]').forEach(radio => {
    radio.changed(() => {
      userData.energyEfficient = select('input[name="energyEfficient"]:checked').value() === 'yes';
      updateUserColors();
    });
  });

  selectAll('input[name="compost"]').forEach(radio => {
    radio.changed(() => {
      userData.compost = select('input[name="compost"]:checked').value() === 'yes';
      updateUserColors();
    });
  });

  selectAll('input[name="excessivePackaging"]').forEach(radio => {
    radio.changed(() => {
      userData.excessivePackaging = select('input[name="excessivePackaging"]:checked').value() === 'yes';
      updateUserColors();
    });
  });

  select('#bottleCount').input(() => {
    userData.bottleCount = int(select('#bottleCount').value());
    updateUserColors();
  });


}