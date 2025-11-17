const video = document.getElementById('video');
const progress = document.querySelector('.progress');
const canvas = document.getElementById('timeline');
const playButton = document.querySelector('[data-play]');
const volumeSlider = document.querySelector('[data-volume]');
const speedSelect = document.querySelector('[data-speed]');
const fullscreenButton = document.querySelector('[data-fullscreen]');
const player = document.querySelector('.player');

const ctx = canvas ? canvas.getContext('2d') : null;

if (!video || !canvas || !progress || !ctx) {
  console.warn('Player: some required elements are missing.');
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle) {
  const r = Math.min(radius, height / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function resizeCanvas() {
  if (!canvas || !progress || !ctx) return;

  const rect = progress.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawTimeline();
}

function drawTimeline() {
  if (!canvas || !progress || !ctx) return;

  const rect = progress.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const radius = height / 2;

  ctx.clearRect(0, 0, width, height);

  drawRoundedRect(ctx, 0, 0, width, height, radius, '#1d2a4e', '#1a2647');

  const duration = video.duration || 0;
  const currentTime = video.currentTime || 0;
  const ratio = duration ? currentTime / duration : 0;
  const playedWidth = width * ratio;

  if (playedWidth > 0) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#7a7fff');
    gradient.addColorStop(1, '#4cc9f0');
    drawRoundedRect(ctx, 0, 0, playedWidth, height, radius, gradient, null);
  }

  if (duration) {
    const knobRadius = height * 0.45;
    const knobX = Math.min(width - knobRadius, Math.max(knobRadius, playedWidth));
    const knobY = height / 2;
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f7fb';
    ctx.fill();
  }

  const percent = duration ? (currentTime / duration) * 100 : 0;
  progress.setAttribute('aria-valuenow', String(Math.round(percent)));
}

function seekFromPosition(clientX) {
  if (!canvas || !progress) return;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const ratio = Math.min(1, Math.max(0, x / rect.width));
  if (video.duration) {
    video.currentTime = ratio * video.duration;
  }
}

video.addEventListener('timeupdate', drawTimeline);
video.addEventListener('seeked', drawTimeline);
video.addEventListener('play', drawTimeline);
video.addEventListener('pause', drawTimeline);

if (video.readyState >= 1) {
  resizeCanvas();
} else {
  video.addEventListener('loadedmetadata', resizeCanvas);
}

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('click', (event) => {
  seekFromPosition(event.clientX);
});

progress.addEventListener('keydown', (event) => {
  if (!video.duration) return;

  const step = video.duration / 20;
  let handled = false;

  switch (event.key) {
    case 'ArrowLeft':
      video.currentTime = Math.max(0, video.currentTime - step);
      handled = true;
      break;
    case 'ArrowRight':
      video.currentTime = Math.min(video.duration, video.currentTime + step);
      handled = true;
      break;
    case 'Home':
      video.currentTime = 0;
      handled = true;
      break;
    case 'End':
      video.currentTime = video.duration;
      handled = true;
      break;
  }

  if (handled) {
    event.preventDefault();
    drawTimeline();
  }
});

function togglePlay() {
  if (video.paused || video.ended) {
    video.play();
  } else {
    video.pause();
  }
}

function updatePlayButton() {
  if (!playButton) return;
  const iconPath = playButton.querySelector('path');
  if (!iconPath) return;

  if (video.paused || video.ended) {
    iconPath.setAttribute('d', 'M8 5v14l11-7-11-7z');
    playButton.setAttribute('aria-label', 'Play');
  } else {
    iconPath.setAttribute('d', 'M8 5h3v14H8zm5 0h3v14h-3z');
    playButton.setAttribute('aria-label', 'Pause');
  }
}

if (playButton) {
  playButton.addEventListener('click', togglePlay);
}
video.addEventListener('click', togglePlay);
video.addEventListener('play', updatePlayButton);
video.addEventListener('pause', updatePlayButton);

updatePlayButton();

if (volumeSlider) {
  volumeSlider.value = String(video.volume);

  volumeSlider.addEventListener('input', (event) => {
    const value = parseFloat(event.target.value);
    video.volume = isNaN(value) ? 1 : value;
    video.muted = video.volume === 0;
  });
}

if (speedSelect) {
  video.playbackRate = 1;

  speedSelect.addEventListener('change', (event) => {
    const rawValue = event.target.value || '1';
    const cleaned = rawValue.replace('×', 'x').toLowerCase();
    const numeric = parseFloat(cleaned);
    video.playbackRate = isNaN(numeric) ? 1 : numeric;
  });
}

function toggleFullscreen() {
  if (!player) return;

  if (!document.fullscreenElement) {
    if (player.requestFullscreen) {
      player.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

if (fullscreenButton) {
  fullscreenButton.addEventListener('click', toggleFullscreen);
}
