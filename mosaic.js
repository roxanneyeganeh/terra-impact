const mosaic = (p) => {
  let svgImages = [];
  let colorImages = [];
  let imagesData = [];
  let globalScale = 0.7;
  let globalPosX = 3.5;  // horizontal offset
  let globalPosY = 350;  // vertical offset
  let hoverStates = [];
  let prevHoverStatus = [];

  p.preload = () => {
    for (let i = 1; i <= 29; i++) {
      svgImages.push(p.loadImage(`assets/shape${i}.svg`));
      colorImages.push(p.loadImage(`assets/color${i}.svg`));
    }
  };

  function getShapeWidth(i) {
    let w = svgImages[i].width;
    return w && w > 0 ? w : 100;
  }

  function getShapeHeight(i) {
    let h = svgImages[i].height;
    return h && h > 0 ? h : 100;
  }

  p.setup = () => {
    imagesData = [
      { x: 41, y: 101, scale: 0.3 },
      { x: 80, y: 83, scale: 0.26 },
      { x: 80, y: 125, scale: 0.26 },
      { x: 129, y: 74, scale: 0.3 },
      { x: 128, y: 126, scale: 0.3 },
      { x: 146, y: 82, scale: 0.26 },
      { x: 146, y: 124, scale: 0.26 },
      { x: 201, y: 100, scale: 0.3 },
      { x: 242, y: 82, scale: 0.26 },
      { x: 243, y: 124, scale: 0.26 },
      { x: 293, y: 73, scale: 0.3 },
      { x: 292, y: 126, scale: 0.3 },
      { x: 310, y: 80, scale: 0.26 },
      { x: 310, y: 124, scale: 0.26 },
      { x: 365, y: 100, scale: 0.3 },
      { x: 183, y: 140, scale: 0.4 },
      { x: 226, y: 140, scale: 0.4 },
      { x: 175, y: 190, scale: 0.2 },
      { x: 225, y: 190, scale: 0.2 },
      { x: 184, y: 210, scale: 0.4 },
      { x: 226, y: 210, scale: 0.4 },
      { x: 202, y: 265, scale: 0.3 },
      { x: 184, y: 305, scale: 0.4 },
      { x: 226, y: 305, scale: 0.4 },
      { x: 175, y: 354, scale: 0.2 },
      { x: 226, y: 354, scale: 0.2 },
      { x: 184, y: 374, scale: 0.4 },
      { x: 225, y: 374, scale: 0.4 },
      { x: 201, y: 428, scale: 0.3 }
    ];

    // Calculate bounds of all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let i = 0; i < imagesData.length; i++) {
      let data = imagesData[i];
      let w = getShapeWidth(i) * data.scale * globalScale;
      let h = getShapeHeight(i) * data.scale * globalScale;

      let x = data.x * globalScale + globalPosX;
      let y = data.y * globalScale + globalPosY;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    }

    let canvasWidth = maxX - minX;
    let canvasHeight = maxY - minY;

    // Create canvas with exact size
    p.createCanvas(canvasWidth, canvasHeight);

    // Adjust global position so shapes fit exactly inside canvas
    globalPosX -= minX;
    globalPosY -= minY;

    p.noLoop();

    for (let i = 0; i < 29; i++) {
      hoverStates[i] = false;
      prevHoverStatus[i] = false;
    }
  };

  p.draw = () => {
    p.clear();

    p.push();
    p.translate(globalPosX, globalPosY);
    p.scale(globalScale);
    for (let i = 0; i < svgImages.length; i++) {
      drawSingleShape(i);
    }
    p.pop();
  };

  function drawSingleShape(i) {
    p.push();
    p.translate(imagesData[i].x, imagesData[i].y);
    p.scale(imagesData[i].scale);

    let currentlyHovered = isMouseOverShape(i);

    if (currentlyHovered && !prevHoverStatus[i]) {
      hoverStates[i] = !hoverStates[i];
    }
    prevHoverStatus[i] = currentlyHovered;

    if (hoverStates[i]) {
      p.image(colorImages[i], 0, 0);
    } else {
      p.image(svgImages[i], 0, 0);
    }
    p.pop();
  }

  function isMouseOverShape(i) {
    let mx = (p.mouseX - globalPosX) / globalScale;
    let my = (p.mouseY - globalPosY) / globalScale;

    let relX = mx - imagesData[i].x;
    let relY = my - imagesData[i].y;

    let w = getShapeWidth(i) * imagesData[i].scale;
    let h = getShapeHeight(i) * imagesData[i].scale;

    return relX >= 0 && relX <= w && relY >= 0 && relY <= h;
  }

  p.mouseMoved = () => {
    p.redraw();
  };
};

// Initialize the sketch in a div with id 'mosaic'
new p5(mosaic, 'mosaic');
