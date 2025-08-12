const spinbot = (p) => {

  const seabornedeep = [
    "rgb(231, 76, 60)",   // soft red
    "rgb(241, 196, 15)",  // amber
    "rgb(231, 76, 60)",   // soft red
    "rgb(52, 152, 219)",  // light blue
    "rgb(243, 156, 18)",  // golden orange
    "rgb(46, 204, 113)",  // mint green
    "rgb(149, 165, 166)", // muted gray-blue
    "rgb(243, 156, 18)",  // golden orange
    "rgb(26, 188, 156)",  // teal
    "rgb(127, 140, 141)", // dark gray
    "rgb(93, 173, 226)",  // sky blue
    "rgb(88, 214, 141)",  // light green
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

  // Position and speed for diagonal floating movement
  let posX;
  let posY;
  let speedX = 0.8;  // slower horizontal speed
  let speedY = -0.5; // vertical speed moving up (negative Y in WEBGL)

  p.preload = () => {
    // Load your OBJ file from assets folder
    bottleModel = p.loadModel('assets/bottle.obj', true);
  };

  p.setup = () => {
    scnsz = p.floor(p.min(p.windowWidth, p.windowHeight)); // 95% of smaller dimension
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
   

    p.angleMode(p.DEGREES);
    p.ellipseMode(p.RADIUS);
    p.rectMode(p.CENTER);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    tmr = new msTmr(TIMEOUT);
    rowcol = MAXROWCOL;
    init = true;
    pause = false;
    palette = (seabornedeep);

    p.textureWrap(p.REPEAT);     // enable repeating texture wrapping
    p.textureMode(p.NORMAL);     // controls UV coords

    patternGraphics = p.createGraphics(1024, 1024);
    patternGraphics.background(255); // white background instead of black
    patternGraphics.fill(255, 255, 255, 200); // semi-transparent white

    patternGraphics.angleMode(p.DEGREES);
    patternGraphics.ellipseMode(p.RADIUS);
    patternGraphics.rectMode(p.CENTER);
    patternGraphics.noStroke();

    // Initialize starting position bottom-left corner
    posX = -p.windowWidth / 2 - 100;
    posY = p.windowHeight / 2 + 100;

    document.body.style.position = 'relative';

    p.windowResized();  // initial layout check
  };

  p.draw = () => {
    if (init) {
      if (rowcol < 1) {
        rowcol = MAXROWCOL;
        palette = p.shuffle(seabornedeep);
      }
      drawPatternToGraphics();
      init = false;
    }

    p.background('#0A121C');
    p.directionalLight(255, 255, 255, 0, -1, -100);
    p.directionalLight(255, 255, 255, 0.5, -1, -0.5);
    p.ambientLight(80);

    // Update position diagonally, slower and floating
    posX += speedX;
    posY += speedY;

    // Reset when out of bounds (top-right corner)
    if (posX > p.windowWidth / 2 + 100 || posY < -p.windowHeight / 2 - 100) {
      posX = -p.windowWidth / 2 - 100;
      posY = p.windowHeight / 2 + 100;
    }

    // Rotate bottle continuously but slower for more floating feel
    angleY += 0.7;
    angleZ += 1;

    p.scale(1.3);

    p.push();
    p.translate(posX, posY, 0);

    p.scale(1.9, 1.7);

    p.translate(50, 0, 0);

    p.rotateX(180);
    p.rotateY(180);

    p.rotateX(angleX);
    p.rotateY(angleY);
    p.rotateZ(angleZ);

    p.ambientMaterial(80);
    p.specularMaterial(255);
    p.shininess(20);

    p.texture(patternGraphics);
    p.noStroke();

    p.model(bottleModel);

    p.push();
    p.translate(0, 90, 0);
    p.rotateX(180);
    p.fill('#2B2B2B');

    p.ambientLight(80);
    p.directionalLight(255, 255, 255, 0, -1, -1);
    p.directionalLight(200, 200, 255, 1, 0, -1);
    p.directionalLight(150, 150, 150, -1, 1, -0.5);

    p.ambientMaterial(200, 200, 200);
    p.specularMaterial(255);
    p.shininess(120);
    p.noStroke();
    p.cylinder(16, 20);

    p.pop();
    p.pop();
  };

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
  }

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
        this.star[i * 2] = polarPt(r * p.cos(40), ang);
        this.star[i * 2 + 1] = polarPt(r, ang + A16);
        this.spike[i] = [
          polarPt(r, minus1(i, 8) * A8 + A16),
          polarPt(r * p.cos(40), ang),
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
          polarPt(r2 * p.cos(A8 + A16), 180 + i * A4).add(this.corners[i]),
          polarPt(r2, ang + A2).add(this.corners[i]),
          polarPt(r2 * p.cos(A8 + A16), 270 + i * A4).add(this.corners[i]),
        ];
        this.crnspike[i].unshift(this.corners[i]);
      }
      this.irreghex = [];
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) {
          this.irreghex[i] = [
            this.spike[i][3],
            this.spike[i][2],
            this.spike[(i + 1) % 8][3],
            this.crnspike[p.floor(i / 2)][3],
          ];
        } else {
          this.irreghex[i] = [
            this.crnspike[p.floor(i / 2)][1],
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
      this.star.forEach((pt) => gfx.vertex(pt.x, pt.y));
      gfx.endShape(p.CLOSE);

      let evenodd = true;
      for (const pnt of this.spike) {
        gfx.fill(evenodd ? (userColors[1] || palette[1]) : (userColors[2] || palette[2]));
        gfx.beginShape();
        pnt.forEach((pt) => gfx.vertex(pt.x, pt.y));
        gfx.endShape(p.CLOSE);
        evenodd = !evenodd;
      }
      for (const pnt of this.crnspike) {
        gfx.fill(userColors[5] || palette[5]);
        gfx.beginShape();
        pnt.forEach((pt) => gfx.vertex(pt.x, pt.y));
        gfx.endShape(p.CLOSE);
      }

      gfx.strokeWeight(this.sz * swgt0);
      gfx.stroke(scolor0);

      evenodd = true;
      for (const pnt of this.irreghex) {
        gfx.fill(evenodd ? (userColors[3] || palette[3]) : (userColors[4] || palette[4]));
        gfx.beginShape();
        pnt.forEach((pt) => gfx.vertex(pt.x, pt.y));
        gfx.endShape(p.CLOSE);
        evenodd = !evenodd;
      }

      gfx.strokeWeight(this.sz * swgt1);
      gfx.stroke(scolor1);
      gfx.fill(userColors[0] || palette[0]);
      gfx.beginShape();
      this.star.forEach((pt) => gfx.vertex(pt.x, pt.y));
      gfx.endShape(p.CLOSE);

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
    let pg0 = p.createGraphics(sz, sz);
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
    for (const pnt of star4) pg0.vertex(pnt.x, pnt.y);
    pg0.endShape(p.CLOSE);
    return pg0;
  }

  p.mouseClicked = () => {
    if (
      p.mouseX > 0.7 * p.width &&
      p.mouseX < p.width &&
      p.mouseY > 0.7 * p.height &&
      p.mouseY < p.height
    ) {
      pause = !pause;
    }
  };

  p.windowResized = () => {
    scnsz = p.floor(p.min(p.windowWidth, p.windowHeight) * 0.95);
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    init = true;
    p.redraw();
  };

  function msTmr(msecs) {
    this.delay = msecs;
    this.ref = p.millis();
    this.check = function () {
      return p.millis() >= this.delay + this.ref;
    };
    this.reset = function (msecs) {
      this.delay = msecs;
      this.ref = p.millis();
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

  const polarPt = (l, a) => new Pt(l * p.cos(a), l * p.sin(a));

};

new p5(spinbot, 'spinbot');