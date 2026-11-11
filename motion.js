const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const intro = document.querySelector('.intro');
let introEnded = false;
function finishIntro() {
  if (introEnded) return;
  introEnded = true;
  document.documentElement.classList.add('intro-done');
  intro?.classList.add('finished');
  const chapterNav = document.querySelector('.chapter-nav');
  if (!reducedMotion.matches) {
    setTimeout(() => chapterNav?.classList.add('drop-attention'), 580);
    setTimeout(() => chapterNav?.classList.remove('drop-attention'), 3500);
  }
}
intro?.querySelector('button')?.addEventListener('click', finishIntro);
document.addEventListener('keydown', event => { if (event.key === 'Escape') finishIntro(); });
if (reducedMotion.matches || location.hash) finishIntro();
else {
  const heroImage = document.querySelector('.hero .scene-art');
  Promise.all([new Promise(resolve => setTimeout(resolve, 2100)), heroImage.decode().catch(() => {})]).then(finishIntro);
  setTimeout(finishIntro, 3800);
}
const chapterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const index = sections.indexOf(entry.target);
    animateChapterNumber(index + 1);
    navLinks.forEach(link => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, {rootMargin:'-35% 0px -55% 0px'});
sections.forEach(section => chapterObserver.observe(section));
let scrollTick = false;
function updateSceneMotion() {
  scrollTick = false;
  if (reducedMotion.matches || innerWidth < 761) return;
  document.querySelectorAll('.scene-art').forEach(art => {
    const rect = art.parentElement.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) {
      art.style.setProperty('--image-drift', `${Math.max(-16, Math.min(16, -rect.top * .018))}px`);
    }
  });
}
window.addEventListener('scroll', () => {
  if (!scrollTick) { scrollTick = true; requestAnimationFrame(updateSceneMotion); }
}, {passive:true});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) { finishIntro(); document.querySelectorAll('.scene-art').forEach(art => art.style.transform = 'none'); }
});
document.getElementById('year').textContent = new Date().getFullYear();
contactForm.addEventListener('submit', () => {
  document.getElementById('form-status').textContent = 'Your email draft is ready in your email app. Review it there and send when you’re ready.';
});
// Keep keyboard focus inside project details and restore it on close.
let projectTrigger = null;
const originalOpenWork = openWork;
openWork = function(project) {
  projectTrigger = document.activeElement;
  originalOpenWork(project);
  document.querySelector('main').inert = true;
  document.querySelector('.site-header').inert = true;
  document.querySelector('.chapter-nav').inert = true;
  lightboxClose.focus();
};
new MutationObserver(() => {
  if (!lightbox.classList.contains('open')) {
    document.querySelector('main').inert = false;
    document.querySelector('.site-header').inert = false;
    document.querySelector('.chapter-nav').inert = false;
    projectTrigger?.focus();
  }
}).observe(lightbox, {attributes:true,attributeFilter:['class']});
lightbox.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const elements = [...lightbox.querySelectorAll('button, a[href], video[controls]')].filter(el => !el.hidden);
  const first = elements[0], last = elements[elements.length-1];
  if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
  else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
});

// Stagger related elements while keeping long-form content readable.
document.querySelectorAll('.services-grid,.process-grid,.experience-list,.expertise-grid,.hero-facts').forEach(group => {
  [...group.children].forEach((item, index) => item.style.setProperty('--reveal-delay', `${(index % 3) * 100}ms`));
});
let lastShadedScene = '';
const sceneObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('is-inview', entry.isIntersecting);
    if (entry.isIntersecting && entry.target.id && entry.target.id !== lastShadedScene) {
      lastShadedScene = entry.target.id;
      if (!reducedMotion.matches) {
        document.body.classList.remove('scene-shade-flash');
        requestAnimationFrame(() => document.body.classList.add('scene-shade-flash'));
        setTimeout(() => document.body.classList.remove('scene-shade-flash'), 950);
      }
    }
  });
}, {threshold:.08});
sections.forEach(section => sceneObserver.observe(section));
let progressQueued = false;
function paintReadingProgress() {
  progressQueued = false;
  const available = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--read-progress', available > 0 ? Math.min(1, scrollY / available) : 0);
}
addEventListener('scroll', () => {
  if (!progressQueued) { progressQueued = true; requestAnimationFrame(paintReadingProgress); }
}, {passive:true});
addEventListener('resize', paintReadingProgress);
paintReadingProgress();
// Delegation also covers portfolio cards added by the GitHub CMS.
document.addEventListener('pointermove', event => {
  if (reducedMotion.matches || event.pointerType !== 'mouse') return;
  const card = event.target.closest('.skill-card,.work-card');
  if (!card) return;
  const bounds = card.getBoundingClientRect();
  card.style.setProperty('--tilt-x', `${(0.5 - (event.clientY-bounds.top)/bounds.height)*5}deg`);
  card.style.setProperty('--tilt-y', `${((event.clientX-bounds.left)/bounds.width-0.5)*5}deg`);
}, {passive:true});
document.getElementById('portfolio-filters').addEventListener('click', event => {
  if (!event.target.closest('.filter-btn') || reducedMotion.matches) return;
  document.querySelectorAll('.work-card:not(.hidden)').forEach((card,index) => {
    card.classList.remove('filter-enter');
    requestAnimationFrame(() => {
      card.style.animationDelay = `${Math.min(index,5)*55}ms`;
      card.classList.add('filter-enter');
    });
  });
});
document.getElementById('portfolio-grid').addEventListener('animationend', event => {
  if (event.animationName === 'filterReveal') {
    event.target.classList.remove('filter-enter');
    event.target.style.animationDelay = '';
  }
});

// Animate every meaningful portfolio number from zero when it enters the viewport.
function animateNumber(element, target, options = {}) {
  if (!element || reducedMotion.matches) {
    if (element) element.textContent = `${options.prefix || ''}${String(target).padStart(options.width || 1, '0')}${options.suffix || ''}`;
    return;
  }
  const duration = options.duration || 1250;
  const started = performance.now();
  element.classList.add('counting');
  const frame = now => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const value = Math.round(target * eased);
    element.textContent = `${options.prefix || ''}${String(value).padStart(options.width || 1, '0')}${options.suffix || ''}`;
    if (progress < 1) requestAnimationFrame(frame);
    else {
      element.classList.remove('counting');
      element.classList.add('count-live');
    }
  };
  requestAnimationFrame(frame);
}

let chapterValue = 1;
function animateChapterNumber(next) {
  if (next === chapterValue) return;
  chapterValue = next;
  animateNumber(document.getElementById('chapter-number'), next, {width:2, duration:520});
}

const numericElements = [...document.querySelectorAll('.hero-facts b,.expertise-note b,.service-head>span,.process-step>span,.experience-no')];
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting || entry.target.dataset.counted) return;
    const original = entry.target.textContent.trim();
    const match = original.match(/\d+/);
    if (!match) return;
    entry.target.dataset.counted = 'true';
    const width = match[0].length;
    const prefix = original.slice(0, match.index);
    const suffix = original.slice(match.index + match[0].length);
    animateNumber(entry.target, Number(match[0]), {prefix, suffix, width});
    counterObserver.unobserve(entry.target);
  });
}, {threshold:.65});
numericElements.forEach(element => counterObserver.observe(element));

// A soft crimson light follows the pointer and makes the composition feel alive.
const cursorAura = document.createElement('div');
cursorAura.className = 'cursor-aura';
cursorAura.setAttribute('aria-hidden', 'true');
document.body.append(cursorAura);
document.addEventListener('pointermove', event => {
  if (reducedMotion.matches || event.pointerType !== 'mouse' || innerWidth < 761) return;
  cursorAura.style.setProperty('--cursor-x', `${event.clientX}px`);
  cursorAura.style.setProperty('--cursor-y', `${event.clientY}px`);
  cursorAura.classList.add('active');
}, {passive:true});
document.addEventListener('pointerleave', () => cursorAura.classList.remove('active'));

document.querySelectorAll('.chapter-nav a,.scroll-cue').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    if (!reducedMotion.matches) {
      document.body.classList.remove('scene-shade-flash');
      requestAnimationFrame(() => document.body.classList.add('scene-shade-flash'));
    }
    document.documentElement.classList.add('programmatic-scroll');
    target.scrollIntoView({behavior: reducedMotion.matches ? 'auto' : 'smooth', block:'start'});
    setTimeout(() => {
      target.scrollIntoView({behavior:'auto', block:'start'});
      document.documentElement.classList.remove('programmatic-scroll');
    }, reducedMotion.matches ? 0 : 1050);
  });
});

// A direct hash URL must land on the requested section even when CSS scroll snapping is active.
if (location.hash) {
  const initialTarget = document.querySelector(location.hash);
  if (initialTarget) {
    document.documentElement.classList.add('programmatic-scroll');
    requestAnimationFrame(() => initialTarget.scrollIntoView({behavior:'auto', block:'start'}));
    setTimeout(() => document.documentElement.classList.remove('programmatic-scroll'), 150);
  }
}
