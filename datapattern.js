const MAXROWCOL = 7;

let datapattern = (p) => {
  let rowcol = MAXROWCOL;
  let patternSize;
  let tileSize;
  let bsz;
  let ms;

  let hovered = { r: -1, c: -1, shape: null };

  const shapeData = {
    "Star Shape": {
      title: "Which mode of transport do you use most often?",
      colors: ['#e74c3c', '#3498db', '#58d68d', '#9b59b6'],
      labels: ['Car', 'Public Transport', 'Bike', 'Walk']
    },
    "Spike Shape A": {
      title: "Do you recycle regularly at home?",
      colors: ['#f1c40f', '#e67e22'],
      labels: ['Yes', 'No']
    },
    "Spike Shape B": {
      title: "How many single-use plastic items do you use per week?",
      colors: ["#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#f1c40f", "#e67e22", "#95a5a6", "#f39c12", "#1abc9c", "#7f8c8d"],
      labels: ['0-5', '6-11', '12-16','17-22','23-27','28-33','34-38','39-44','45-49', '50+']
    },
    "Corner Spike": {
      title: "Do you avoid buying excess packaging?",
      colors: ['#2ecc71', '#7f8c8d'],
      labels: ['Yes', 'No']
    },
    "Irregular Hex A": {
      title: "Do you compost your food or garden waste?",
      colors: ['#e67e22', '#1abc9c'],
      labels: ['Yes', 'No']
    },
    "Irregular Hex B": {
      title: "Do you use energy-efficient appliances or light bulbs?",
      colors: ['#5dade2', '#95a5a6'],
      labels: ['Yes', 'No']
    }
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.angleMode(p.DEGREES);
    p.ellipseMode(p.RADIUS);
    p.rectMode(p.CENTER);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    bsz = 30;
    patternSize = p.min(p.width, p.height) * 0.9;
    tileSize = (patternSize - bsz * 2) / rowcol;
    ms = new mosaic31(tileSize);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = () => {
    p.background('#0A121C');
    p.translate(p.width - patternSize - bsz, (p.height - patternSize) / 2);

    // Draw border around exact tile grid
    p.push();
    p.noFill();
    p.stroke('#7f7f7f');
    p.strokeWeight(1.4);
    p.rectMode(p.CORNER);
    p.rect(bsz, bsz, tileSize * rowcol, tileSize * rowcol);
    p.pop();

    hovered = { r: -1, c: -1, shape: null };

    const originX = p.width - patternSize - bsz;
    const originY = (p.height - patternSize) / 2;

    for (let r = 0; r < rowcol; r++) {
      for (let c = 0; c < rowcol; c++) {
        let cx = bsz + c * tileSize + tileSize / 2;
        let cy = bsz + r * tileSize + tileSize / 2;

        p.push();
        p.translate(cx, cy);
        ms.draw(p);

        let localX = p.mouseX - (originX + cx);
        let localY = p.mouseY - (originY + cy);

        if (pointInPolygon(localX, localY, ms.star)) {
          hovered = { r, c, shape: "Star Shape", cx, cy };
        } else if (ms.spikeSetA.some(poly => pointInPolygon(localX, localY, poly))) {
          hovered = { r, c, shape: "Spike Shape A", cx, cy };
        } else if (ms.spikeSetB.some(poly => pointInPolygon(localX, localY, poly))) {
          hovered = { r, c, shape: "Spike Shape B", cx, cy };
        } else if (ms.crnspike.some(poly => pointInPolygon(localX, localY, poly))) {
          hovered = { r, c, shape: "Corner Spike", cx, cy };
        } else if (ms.irreghexSetA.some(poly => pointInPolygon(localX, localY, poly))) {
          hovered = { r, c, shape: "Irregular Hex A", cx, cy };
        } else if (ms.irreghexSetB.some(poly => pointInPolygon(localX, localY, poly))) {
          hovered = { r, c, shape: "Irregular Hex B", cx, cy };
        }
        p.pop();
      }
    }

    if (hovered.r >= 0) {
      p.push();
      p.translate(hovered.cx, hovered.cy);
      p.noStroke();
      p.fill('#CCCCCC');

      if (hovered.shape === "Star Shape") {
        p.beginShape();
        ms.star.forEach(pv => p.vertex(pv.x, pv.y));
        p.endShape(p.CLOSE);
      } else {
        drawHoverShape(p, ms, hovered);
      }
      p.pop();

      if (shapeData[hovered.shape]) {
        drawTooltip(p, hovered, shapeData[hovered.shape]);
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    patternSize = p.min(p.width, p.height) * 0.9;
    tileSize = (patternSize - bsz * 2) / rowcol;
    ms = new mosaic31(tileSize);
  };

  function pointInPolygon(px, py, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      let intersect = (yi > py != yj > py) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function drawHoverShape(p, ms, hovered) {
    const originX = p.width - patternSize - bsz;
    const originY = (p.height - patternSize) / 2;
    let polys = [];

    if (hovered.shape === "Spike Shape A") {
      polys = ms.spikeSetA;
    } else if (hovered.shape === "Spike Shape B") {
      polys = ms.spikeSetB;
    } else if (hovered.shape === "Corner Spike") {
      polys = ms.crnspike;
    } else if (hovered.shape === "Irregular Hex A") {
      polys = ms.irreghexSetA;
    } else if (hovered.shape === "Irregular Hex B") {
      polys = ms.irreghexSetB;
    }

    polys.forEach(poly => {
      if (pointInPolygon(
          p.mouseX - (originX + hovered.cx),
          p.mouseY - (originY + hovered.cy),
          poly)) {
        p.beginShape();
        poly.forEach(pv => p.vertex(pv.x, pv.y));
        p.endShape(p.CLOSE);
      }
    });
  }

  function drawTooltip(p, hovered, info) {
    let padding = 10;
    let offset = 20;
    let lineH = 20;
    let labelIndent = 20;

    p.textSize(14);
    let maxLabelWidth = p.textWidth(info.title);
    info.labels.forEach(label => {
      let w = p.textWidth(label);
      if (w > maxLabelWidth) maxLabelWidth = w;
    });

    let boxW = maxLabelWidth + labelIndent + 20;
    let boxH = 20 + info.labels.length * lineH + 10;
    let boxX = hovered.cx - boxW / 2;
    let boxY = hovered.cy - boxH / 2;

    if (boxX + boxW / 2 > p.width) boxX = hovered.cx - offset - boxW / 2;
    if (boxX - boxW / 2 < padding) boxX = padding + boxW / 2;
    if (boxY - boxH / 2 < padding) boxY = padding + boxH / 2;
    if (boxY + boxH / 2 > p.height - padding) boxY = p.height - padding - boxH / 2;

    p.push();
    p.drawingContext.shadowColor = 'rgba(0,0,0,0.2)';
    p.drawingContext.shadowBlur = 6;
    p.drawingContext.shadowOffsetX = 0;
    p.drawingContext.shadowOffsetY = 2;

    p.fill(13, 42, 82, 230);
    p.noStroke();
    p.rect(boxX, boxY, boxW, boxH, 8);

    p.fill('#cce6ff');
    p.textAlign(p.LEFT, p.TOP);
    p.text(info.title, boxX - boxW / 2 + 10, boxY - boxH / 2 + 5);

    for (let i = 0; i < info.labels.length; i++) {
      p.fill(info.colors[i]);
      p.rect(boxX - boxW / 2 + 10, boxY - boxH / 2 + 30 + i * lineH, 10, 10, 2);
      p.fill('#cce6ff');
      p.text(info.labels[i], boxX - boxW / 2 + labelIndent, boxY - boxH / 2 + 26 + i * lineH);
    }

    p.pop();
  }
};

class Pt {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(other) {
    return new Pt(this.x + other.x, this.y + other.y);
  }
}
const polarPt = (l, a) => new Pt(l * Math.cos(p5.prototype.radians(a)), l * Math.sin(p5.prototype.radians(a)));

class mosaic31 {
  constructor(sz) {
    const A2 = 360 / 2;
    const A4 = A2 / 2;
    const A8 = A4 / 2;
    const A16 = A8 / 2;
    this.sz = sz;
    let r = sz / 4;
    this.star = [];
    this.spike = [];
    this.spikeSetA = [];
    this.spikeSetB = [];

    for (let i = 0; i < 8; i++) {
      let ang = i * A8;
      this.star[i * 2] = polarPt(r * Math.cos(p5.prototype.radians(40)), ang);
      this.star[i * 2 + 1] = polarPt(r, ang + A16);

      let poly = [
        polarPt(r, ((i + 7) % 8) * A8 + A16),
        polarPt(r * Math.cos(p5.prototype.radians(40)), ang),
        polarPt(r, ang + A16),
        polarPt(2 * r, ang),
      ];

      this.spike.push(poly);
      if (i % 2 === 0) {
        this.spikeSetA.push(poly);
      } else {
        this.spikeSetB.push(poly);
      }
    }

    let r2 = (sz / 2) * Math.sqrt(2) - sz / 2;
    this.corners = [];
    this.crnspike = [];
    for (let i = 0; i < 4; i++) {
      let ang = i * A4 + A8;
      this.corners[i] = polarPt((sz / 2) * Math.sqrt(2), ang);
      this.crnspike[i] = [
        polarPt((sz / 2) * Math.sqrt(2), ang),
        polarPt(r2 * Math.cos(p5.prototype.radians(A8 + A16)), 180 + i * A4).add(this.corners[i]),
        polarPt(r2, ang + A2).add(this.corners[i]),
        polarPt(r2 * Math.cos(p5.prototype.radians(A8 + A16)), 270 + i * A4).add(this.corners[i]),
      ];
    }

    this.irreghexSetA = [];
    this.irreghexSetB = [];

    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        this.irreghexSetA.push([
          this.spike[i][3],
          this.spike[i][2],
          this.spike[(i + 1) % 8][3],
          this.crnspike[Math.floor(i / 2)][3],
        ]);
      } else {
        this.irreghexSetB.push([
          this.crnspike[Math.floor(i / 2)][1],
          this.spike[i][3],
          this.spike[i][2],
          this.spike[(i + 1) % 8][3],
        ]);
      }
    }
  }

  draw(p) {
    p.stroke('#7f7f7f');
    p.strokeWeight(1);
    p.fill('#0A121C');

    // Star
    p.beginShape();
    this.star.forEach(pv => p.vertex(pv.x, pv.y));
    p.endShape(p.CLOSE);

    // Spikes
    for (const poly of this.spike) {
      p.beginShape();
      poly.forEach(pv => p.vertex(pv.x, pv.y));
      p.endShape(p.CLOSE);
    }

    // Corner spikes — no stroke
    p.push();
    p.noStroke();
    for (const poly of this.crnspike) {
      p.beginShape();
      poly.forEach(pv => p.vertex(pv.x, pv.y));
      p.endShape(p.CLOSE);
    }
    p.pop();

    // Irregular Hex
    p.noFill();
    for (const poly of this.irreghexSetA) {
      p.beginShape();
      poly.forEach(pv => p.vertex(pv.x, pv.y));
      p.endShape(p.CLOSE);
    }
    for (const poly of this.irreghexSetB) {
      p.beginShape();
      poly.forEach(pv => p.vertex(pv.x, pv.y));
      p.endShape(p.CLOSE);
    }

    p.noStroke();
  }
}

new p5(datapattern, 'datapattern');
