const config = {
  "component": "3DCarouselWithCenterFocus",
  "layout": {
    "type": "circular",
    "radius": 600,
    "itemCount": 5,
    "perspective": 2500,
    "centerElement": true
  },
  "assets": {
    "items": [
      { "id": "mango", "image": "mango.png", "productImage": "1.png" },
      { "id": "guava", "image": "GUAVA.jpeg", "productImage": "2.png" },
      { "id": "pineapple", "image": "PINEAPPLE.png", "productImage": "3.png" },
      { "id": "passion", "image": "PASSION.png", "productImage": "4.png" },
      { "id": "soursop", "image": "SOURSOP.png", "productImage": "5.png" }
    ],
    "defaultCenter": "mango"
  },
  "animation": {
    "rotation": {
      "autoRotate": true,
      "speed": 0.25,
      "direction": "clockwise"
    },
    "transition": {
      "duration": 0.5,
      "easing": "easeInOutCubic"
    }
  },
  "centerObject": {
    "type": "productDisplay",
    "animation": {
      "enter": { "duration": 0.5 },
      "exit": { "duration": 0 }
    }
  },
  "rendering": {
    "imageHandling": {
      "preload": true,
      "fallback": "1.png"
    }
  }
};

const carouselEl = document.getElementById('carousel');
const centerImage = document.getElementById('centerImage');
let itemsData = config.assets.items;
let currentAngle = 0;
let targetAngle = 0;
let isAnimatingToTarget = false;
let activeItemId = config.assets.defaultCenter;
const angleStep = 360 / config.layout.itemCount;

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 1. Preload handling
async function preloadImages() {
    const urls = new Set();
    itemsData.forEach(item => {
        urls.add(item.image);
        urls.add(item.productImage);
    });
    urls.add(config.rendering.imageHandling.fallback);

    const promises = Array.from(urls).map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = () => resolve(); // Prevent block
            img.src = url;
        });
    });

    await Promise.all(promises);
    document.getElementById('loader').style.display = 'none';
    document.getElementById('heroContainer').style.display = 'flex';
    initCarousel();
}

// 2. Initialize
function initCarousel() {
    // Pass strictly the quantity down to CSS
    carouselEl.style.setProperty('--quantity', config.layout.itemCount);

    itemsData.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'item'; // Matches exact user class
        el.style.setProperty('--position', i + 1); // CSS formula expects 1-indexed
        
        el.dataset.index = i;
        el.dataset.id = item.id;
        
        // Removed hardcoded transform translation styles, handled by CSS variables completely now!

        const img = document.createElement('img');
        img.src = item.image;
        img.onerror = () => img.src = config.rendering.imageHandling.fallback;
        
        el.appendChild(img);
        carouselEl.appendChild(el);

        el.addEventListener('click', () => handleItemClick(i, item));
    });

    const initialItem = itemsData.find(i => i.id === config.assets.defaultCenter);
    if(initialItem) {
        centerImage.src = initialItem.productImage;
        centerImage.onerror = () => centerImage.src = config.rendering.imageHandling.fallback;
    }

    requestAnimationFrame(renderLoop);
}

// 3. Click interaction logic
let transitionStartAngle = 0;
let transitionStartTime = 0;

function handleItemClick(index, item) {
    if (activeItemId === item.id) return;

    isAnimatingToTarget = true;
    activeItemId = item.id;

    let currentSnapIdx = Math.round(-currentAngle / angleStep);
    let diff = index - (currentSnapIdx % config.layout.itemCount);
    
    if (diff > config.layout.itemCount / 2) diff -= config.layout.itemCount;
    if (diff < -config.layout.itemCount / 2) diff += config.layout.itemCount;

    targetAngle = (currentSnapIdx + diff) * -angleStep;
    transitionStartAngle = currentAngle;
    transitionStartTime = performance.now();

    updateCenterProduct(item.productImage);
}

// 4. Center product explicit animation flow
function updateCenterProduct(newSrc) {
    // 1. Animate current product out (duration: 0.3s)
    centerImage.classList.remove('anim-enter');
    centerImage.classList.add('anim-exit');
    
    setTimeout(() => {
        // 2. Then animate new product in from below (start below, translate to 0, duration: 0.5s)
        centerImage.src = newSrc;
        centerImage.onerror = () => centerImage.src = config.rendering.imageHandling.fallback;
        
        centerImage.classList.remove('anim-exit');
        centerImage.classList.add('anim-enter');
    }, config.centerObject.animation.exit.duration * 1000); 
}

// 5. Render Loop handling rotation speeds, auto-rotation and transitions
let lastTime = performance.now();
function renderLoop(time) {
    const dt = time - lastTime;
    lastTime = time;

    if (isAnimatingToTarget) {
        const elapsed = (time - transitionStartTime) / (config.animation.transition.duration * 1000);
        if (elapsed >= 1) {
            currentAngle = targetAngle;
            isAnimatingToTarget = false;
        } else {
            const ease = easeInOutCubic(elapsed);
            currentAngle = transitionStartAngle + (targetAngle - transitionStartAngle) * ease;
        }
    } else if (config.animation.rotation.autoRotate) {
        const dir = config.animation.rotation.direction === 'clockwise' ? -1 : 1;
        const speed = config.animation.rotation.speed * (dt / 16.66) * dir;
        currentAngle += speed;
        targetAngle = currentAngle;
    }

    carouselEl.style.transform = `rotateY(${currentAngle}deg)`;

    requestAnimationFrame(renderLoop);
}

// Bootstrap
if(config.rendering.imageHandling.preload) {
    preloadImages();
} else {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('heroContainer').style.display = 'flex';
    initCarousel();
}