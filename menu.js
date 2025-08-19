let menuBar, buildBtn, learnBtn, pillBtn;
let leftContainer, centerContainer, rightContainer;
let logo;
let modal;

function setup() {
  createCanvas(windowWidth, 0); // invisible p5 canvas
  createMenuBar();
  createWaitlistModal();
}

function draw() {
  background('transparent');
}

function createMenuBar() {
  // Remove any existing menu bar
  let oldMenu = select('#menuBar');
  if (oldMenu) oldMenu.remove();

  // Main menu bar
  menuBar = createDiv().id('menuBar');
  menuBar.style('position', 'fixed');
  menuBar.style('top', '0');
  menuBar.style('left', '0');
  menuBar.style('width', '100%');
  menuBar.style('height', '80px');
  menuBar.style('display', 'flex');
  menuBar.style('align-items', 'center');
  menuBar.style('justify-content', 'space-between');
  menuBar.style('padding', '0 30px');
  menuBar.style('backdrop-filter', 'blur(16px)');
  menuBar.style('-webkit-backdrop-filter', 'blur(16px)');
  menuBar.style('z-index', '1000');
  menuBar.style('border-bottom', '0.2px solid #5A5A5A80');
  menuBar.style('font-size', '15px');

  // Set background based on page
  const page = window.location.pathname.split('/').pop();
  if (page === 'index.html' || page === '') {
    menuBar.style('background-color', '#0A121C80'); // semi-transparent for index
  } else {
    menuBar.style('background-color', '#0A121Cff'); // solid for other pages
  }

  // Left container (Join + Build)
  leftContainer = createDiv().parent(menuBar);
  leftContainer.style('display', 'flex');
  leftContainer.style('align-items', 'center');
  leftContainer.style('gap', '12px');

  // Center container (Logo)
  centerContainer = createDiv().parent(menuBar);
  centerContainer.style('position', 'absolute');
  centerContainer.style('left', '50%');
  centerContainer.style('top', '50%');
  centerContainer.style('transform', 'translate(-50%, -50%)');
  centerContainer.style('display', 'flex');
  centerContainer.style('align-items', 'center');
  centerContainer.style('pointer-events', 'none');

  // Right container (About, Account, Heart)
  rightContainer = createDiv().parent(menuBar);
  rightContainer.style('display', 'flex');
  rightContainer.style('align-items', 'center');
  rightContainer.style('gap', '20px');
  rightContainer.style('position', 'relative');
  rightContainer.style('z-index', '1001');

  // --- Join Waitlist (outline pill) ---
  pillBtn = createButton('Join Waitlist').parent(leftContainer);
  pillBtn.style('background-color', 'transparent');
  pillBtn.style('color', 'white');
  pillBtn.style('border', '1px solid white');
  pillBtn.style('border-radius', '99px');
  pillBtn.style('padding', '10px 18px');
  pillBtn.style('width', '130px');
  pillBtn.style('text-align', 'center');
  pillBtn.style('cursor', 'pointer');
  pillBtn.style('font-size', '15px');
  pillBtn.style('font-family', "'Inter Tight', sans-serif");
  pillBtn.mouseOver(() => {
    pillBtn.style('background-color', 'white');
    pillBtn.style('color', 'black');
  });
  pillBtn.mouseOut(() => {
    pillBtn.style('color', 'white');
    pillBtn.style('background-color', 'transparent');
  });
  pillBtn.mousePressed(() => {
    if (modal) modal.style('display', 'flex');
  });

  // --- Build (blue pill) ---
  buildBtn = createButton('Build').parent(leftContainer);
  buildBtn.style('background-color', '#4da2ff');
  buildBtn.style('color', 'white');
  buildBtn.style('border', 'none');
  buildBtn.style('border-radius', '99px');
  buildBtn.style('padding', '10px 18px');
  buildBtn.style('width', '130px');
  buildBtn.style('text-align', 'center');
  buildBtn.style('cursor', 'pointer');
  buildBtn.style('font-size', '15px');
  buildBtn.style('font-family', "'Inter Tight', sans-serif");
  buildBtn.mouseOver(() => buildBtn.style('background-color', '#1c88ff'));
  buildBtn.mouseOut(() => buildBtn.style('background-color', '#4da2ff'));
  buildBtn.mousePressed(() => (window.location.href = '/generator'));

  // Logo (center)
  logo = createImg('assets/logo.png', 'Logo').parent(centerContainer);
  logo.style('height', '30px');
  logo.style('cursor', 'pointer');
  logo.style('pointer-events', 'auto');
  logo.mousePressed(() => (window.location.href = '/index'));

// About link
learnBtn = createSpan('About').parent(rightContainer);
styleMenuItem(learnBtn);
learnBtn.mousePressed(() => {
  window.location.href = '/about';
});


  // Account link
  let accountBtn = createSpan('Account').parent(rightContainer);
  styleMenuItem(accountBtn);
  accountBtn.mousePressed(() => (window.location.href = '/account'));

  // Heart icon → saved-designs
let heartBtn = createElement('div').parent(rightContainer);
heartBtn.html(`
  <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg"
       width="20" height="20" viewBox="0 0 24 24"
       fill="transparent" stroke="white" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round"
       style="cursor:pointer;">
    <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0l-1 1-1-1c-1.6-1.6-4.2-1.6-5.8 0s-1.6 4.2 0 5.8l6.8 6.8 6.8-6.8c1.6-1.6 1.6-4.2 0-5.8z"></path>
  </svg>
`);
heartBtn.mousePressed(() => window.location.href = '/saved-designs');
heartBtn.style('display', 'flex');
heartBtn.style('align-items', 'center');


  // Add hover effect for heart
  let style = document.createElement('style');
  style.innerHTML = `
    .heart-icon {
      fill: transparent;
      transition: fill 0.2s ease;
    }
    .heart-icon:hover {
      fill: white;
    }
  `;
  document.head.appendChild(style);

  handleMenuResize();
}

function styleMenuItem(elem) {
  elem.style('color', 'white');
  elem.style('font-size', '15px');
  elem.style('font-family', "'Inter Tight', sans-serif");
  elem.style('cursor', 'pointer');
  elem.style('padding', '8px 12px');
  elem.style('transition', 'color 0.3s ease');
  elem.mouseOver(() => elem.style('color', '#aaa'));
  elem.mouseOut(() => elem.style('color', 'white'));
}

// --- Waitlist Modal ---
function createWaitlistModal() {
  modal = createDiv().id('waitlistModal').parent(document.body);
  modal.style('position', 'fixed');
  modal.style('top', '0');
  modal.style('left', '0');
  modal.style('width', '100%');
  modal.style('height', '100%');
  modal.style('background-color', '#0A121Caa');
  modal.style('display', 'none');
  modal.style('align-items', 'center');
  modal.style('justify-content', 'center');
  modal.style('z-index', '2000');
  modal.style('font-family', "'Inter Tight', sans-serif");

  let modalContent = createDiv().parent(modal);
  modalContent.style('background', '#111');
  modalContent.style('padding', '40px');
  modalContent.style('border-radius', '12px');
  modalContent.style('text-align', 'center');
  modalContent.style('color', 'white');
  modalContent.html('<h2>Join Waitlist</h2><p>Sign up to get updates.</p>');

  let closeBtn = createButton('Close').parent(modalContent);
  closeBtn.style('margin-top', '20px');
  closeBtn.style('padding', '8px 16px');
  closeBtn.style('border', 'none');
  closeBtn.style('border-radius', '8px');
  closeBtn.style('background', '#4da2ff');
  closeBtn.style('color', 'white');
  closeBtn.mousePressed(() => modal.style('display', 'none'));
}

// --- Responsive Menu ---
function handleMenuResize() {
  if (windowWidth < 600) {
    menuBar.style('height', '60px');
    pillBtn.style('font-size', '13px');
    pillBtn.style('padding', '6px 14px');
    pillBtn.style('width', '120px');
    buildBtn.style('font-size', '13px');
    buildBtn.style('padding', '6px 14px');
    buildBtn.style('width', '120px');
    learnBtn.style('font-size', '13px');
    learnBtn.style('padding', '6px 10px');
    logo.style('height', '24px');
    rightContainer.style('gap', '12px');
    menuBar.style('padding', '0 15px');
  } else {
    menuBar.style('height', '80px');
    pillBtn.style('font-size', '15px');
    pillBtn.style('padding', '10px 18px');
    pillBtn.style('width', '130px');
    buildBtn.style('font-size', '15px');
    buildBtn.style('padding', '10px 18px');
    buildBtn.style('width', '130px');
    learnBtn.style('font-size', '15px');
    learnBtn.style('padding', '8px 12px');
    logo.style('height', '30px');
    rightContainer.style('gap', '20px');
    menuBar.style('padding', '0 30px');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, 0);
  handleMenuResize();
}
