window.onload = function() {
  const imgData = sessionStorage.getItem("savedCanvasImage");
  const imgElement = document.getElementById("canvasImage");

  if (imgData) {
    imgElement.src = imgData;
  } else {
    document.body.innerHTML = "<p>No image found. Please go back and draw something first.</p>";
  }
};

function setup() {

  const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.position(0, 0);
  canvas.style('z-index', '-1'); // Behind content
  canvas.style('position', 'fixed'); // Stick to viewport
  createMenuBar();
}


function adjustLayout() {
  const productLayout = document.querySelector('.product-layout');
  if (!productLayout) return;

  if (window.innerWidth < 600) {
    // For small screens, reduce padding and stack vertically
    productLayout.style.flexDirection = 'column';
    productLayout.style.padding = '20px';
  } else {
    // For larger screens, normal horizontal layout and padding
    productLayout.style.flexDirection = 'row';
    productLayout.style.padding = '40px';
  }
}


// Run on page load
adjustLayout();

// Run whenever window is resized
window.addEventListener('resize', adjustLayout);
