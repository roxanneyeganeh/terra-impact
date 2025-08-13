let menuBar, buildBtn, learnBtn, pillBtn;
let leftContainer, centerContainer, rightContainer;
let logo;
let modal; 

function setup() {
  // Initialize canvas to use p5 lifecycle (even if no drawing is needed)
  createCanvas(windowWidth, 0);
  console.log('Setup started');
  createMenuBar();
  createWaitlistModal();
}

function draw() {
  background('transparent');
}

function createMenuBar() {
  console.log('Creating menu bar');

  // Remove any existing menu bar
  let oldMenu = select('#menuBar');
  if (oldMenu) {
    oldMenu.remove();
    console.log('Removed old menuBar');
  }

  // Create main menu bar container
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
  menuBar.style('background-color',
    (window.location.pathname.split('/').pop() === '/index', '/about'|| window.location.pathname.split('/').pop() === '')
      ? '#0A121C80' : '#0A121Cff'
  );
  menuBar.style('backdrop-filter', 'blur(16px)');
  menuBar.style('-webkit-backdrop-filter', 'blur(16px)');
  menuBar.style('box-sizing', 'border-box');
  menuBar.style('z-index', '1000');
  menuBar.style('border-bottom', '0.2px solid #5A5A5A80');
  menuBar.style('font-size', '15px');
  menuBar.style('overflow', 'hidden');

  // Left container (Join button)
  leftContainer = createDiv().parent(menuBar);
  leftContainer.style('display', 'flex');
  leftContainer.style('align-items', 'center');
  leftContainer.style('flex', '0 0 auto');

  // Center container (Logo)
  centerContainer = createDiv().parent(menuBar);
  centerContainer.style('position', 'absolute');
  centerContainer.style('left', '50%');
  centerContainer.style('top', '50%');
  centerContainer.style('transform', 'translate(-50%, -50%)');
  centerContainer.style('display', 'flex');
  centerContainer.style('align-items', 'center');
  centerContainer.style('justify-content', 'center');
  centerContainer.style('height', '60px');
  centerContainer.style('pointer-events', 'none');

  // Right container (Menu links)
  rightContainer = createDiv().parent(menuBar);
  rightContainer.style('display', 'flex');
  rightContainer.style('align-items', 'center');
  rightContainer.style('justify-content', 'flex-end');
  rightContainer.style('gap', '20px');
  rightContainer.style('flex', '0 0 auto');

  // Pill Button
  pillBtn = createButton('Join Waitlist').parent(leftContainer);
  pillBtn.style('background-color', '#4da2ff');
  // pillBtn.style('width', '130px');

  // pillBtn.style('text-transform', 'uppercase');
  pillBtn.style('color', 'white');
  pillBtn.style('border', 'none');
  pillBtn.style('border-radius', '99px');
  pillBtn.style('padding', '12px 20px');
  pillBtn.style('cursor', 'pointer');
  pillBtn.style('font-size', '15px');
  pillBtn.style('font-family', "'Inter Tight', sans-serif");
  pillBtn.mouseOver(() => pillBtn.style('background-color', '#1c88ff'));
  pillBtn.mouseOut(() => pillBtn.style('background-color', '#4da2ff'));

  pillBtn.mousePressed(() => {
  if (modal) modal.style('display', 'flex');
});


  // Logo
  logo = createImg('assets/logo.png', 'Logo').parent(centerContainer);
  logo.style('height', '30px');
  logo.style('cursor', 'pointer');
  logo.style('pointer-events', 'auto');
  logo.mousePressed(() => window.location.href = '/index');

  // Right Menu Buttons
  buildBtn = createSpan('Build').parent(rightContainer);
  styleMenuItem(buildBtn);
  buildBtn.mousePressed(() => window.location.href = '/generator');

  learnBtn = createSpan('About').parent(rightContainer);
  styleMenuItem(learnBtn);
learnBtn.mousePressed(() => {
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage === 'index' || currentPage === '') {
    const target = document.getElementById('learnMoreSection');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.href = 'indexlearnMoreSection';
  }
});


  handleMenuResize();
}

function styleMenuItem(elem) {
  elem.style('color', 'white');
  elem.style('font-size', '15px');
  elem.style('font-family', "'Inter Tight', sans-serif");
  elem.style('cursor', 'pointer');
  elem.style('padding', '8px 12px');
  elem.style('white-space', 'nowrap');
  elem.style('transition', 'color 0.3s ease');
  // elem.style('text-transform', 'uppercase');
  elem.mouseOver(() => elem.style('color', '#aaa'));
  elem.mouseOut(() => elem.style('color', 'white'));
}

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

  const formWrapper = createDiv().parent(modal);
  formWrapper.style('background', '#0A121C');
  formWrapper.style('padding', '40px');
  formWrapper.style('border-radius', '16px');
  formWrapper.style('max-width', '420px');
  formWrapper.style('width', '90%');
  formWrapper.style('box-shadow', '0 0 12px rgba(255, 255, 255, 0.05)');
  formWrapper.style('border', '0.2px solid #5A5A5A80');
  formWrapper.style('color', 'white');

  formWrapper.html(`
    <style>
      #waitlistForm button svg {
        transition: transform 0.3s ease;
      }
      #waitlistForm button:hover svg {
        transform: translateX(4px);
      }
      svg {
        width: 20px;
        height: 20px;
      }
    </style>

    <div style="position: relative;">
      <button id="closeModal" 
        style="position: absolute; top: -20px; right: -20px; 
               background: none; border: none; 
               font-size: 24px; color: white;
               cursor: pointer; line-height: 1;">&times;</button>

      <h2 style="margin: 0 0 30px; font-weight: 600; font-size: 28px; text-align: center;">
        Join Our Waitlist
      </h2>

      <form name="waitlist" method="POST" data-netlify="true" id="waitlistForm" style="display: flex; flex-direction: column; gap: 20px;">
        <input type="hidden" name="form-name" value="waitlist" />
        
        <input type="email" name="email" placeholder="Your email" required 
               style="padding: 12px; background-color: #0A121C; color: white; 
                      border: 0.2px solid #5A5A5A80; border-radius: 6px; font-size: 16px;" />
        
        <button type="submit" 
                style="display: inline-flex; align-items: center; justify-content: center; gap: 10px;
                       padding: 12px 24px; background-color: white; color: #0A121C; 
                       border: none; border-radius: 999px; font-weight: 500; font-size: 16px; 
                       cursor: pointer; transition: background 0.3s ease;">
          Submit
          <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none"
            stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </form>

      <div id="confirmationMessage" 
           style="display:none; margin-top: 15px; font-size: 14px; color: #aaa; text-align: center;">
        We’ll notify you once we launch.
      </div>

      <div id="errorMessage" 
           style="display:none; margin-top: 15px; font-size: 14px; color: #ff5555; text-align: center;">
      </div>
    </div>
  `);

  // Close modal on × button click
  const closeModalBtn = modal.elt.querySelector('#closeModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.style('display', 'none');
      // reset form and messages when closing modal
      const form = document.getElementById('waitlistForm');
      const confirmationMessage = document.getElementById('confirmationMessage');
      const errorMessage = document.getElementById('errorMessage');
      form.style.display = 'flex';
      confirmationMessage.style.display = 'none';
      errorMessage.style.display = 'none';
      form.reset();
    });
  }

  // Handle form submission with fetch to Netlify
  const form = document.getElementById('waitlistForm');
  const confirmationMessage = document.getElementById('confirmationMessage');
  const errorMessage = document.getElementById('errorMessage');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    }).then(response => {
      if (response.ok) {
        form.style.display = 'none';
        confirmationMessage.style.display = 'block';
        errorMessage.style.display = 'none'; // hide error if previously shown
      } else {
        errorMessage.textContent = 'Oops! There was a problem submitting your form.';
        errorMessage.style.display = 'block';
      }
    }).catch(() => {
      errorMessage.textContent = 'Oops! There was a problem submitting your form.';
      errorMessage.style.display = 'block';
    });
  });
}



function handleMenuResize() {
  if (windowWidth < 600) {
    menuBar.style('height', '60px');
    pillBtn.style('font-size', '13px');
    pillBtn.style('padding', '6px 14px');
    buildBtn.style('font-size', '13px');
    buildBtn.style('padding', '6px 10px');
    learnBtn.style('font-size', '13px');
    learnBtn.style('padding', '6px 10px');
    logo.style('height', '24px');
    rightContainer.style('gap', '12px');
    menuBar.style('padding', '0 15px');
  } else {
    menuBar.style('height', '80px');
    pillBtn.style('font-size', '15px');
    pillBtn.style('padding', '8px 20px');
    buildBtn.style('font-size', '15px');
    buildBtn.style('padding', '8px 12px');
    learnBtn.style('font-size', '15px');
    learnBtn.style('padding', '8px 12px');
    logo.style('height', '27px');
    rightContainer.style('gap', '20px');
    menuBar.style('padding', '0 30px');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, 0);
  handleMenuResize();
}
