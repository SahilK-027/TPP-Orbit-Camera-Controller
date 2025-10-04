import Game from './Game/Game.class';
import ResourceLoader from './Game/Utils/ResourceLoader.class';
import ASSETS from './assetSources.js';

const progressBar = document.getElementById('bar');
const progress = document.getElementById('progress');
const resources = new ResourceLoader(ASSETS);

// Debug mode is enabled only when URL has ?mode=debug
const isDebugMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mode') === 'debug';

resources.on('progress', ({ id, itemsLoaded, itemsTotal, percent }) => {
  progressBar.style.width = `${percent.toFixed(1)}%`;

  if (isDebugMode) {
    console.log(
      `Loaded asset: "${id}" (${itemsLoaded}/${itemsTotal} — ${percent.toFixed(
        1
      )}%)`
    );
  }
});

resources.on('error', ({ id, url, itemsLoaded, itemsTotal }) => {
  console.error(
    `❌ Failed to load item named "${id}" at "${url}" (${itemsLoaded}/${itemsTotal} so far)`
  );
});

resources.on('loaded', () => {
  if (isDebugMode) {
    if (Object.keys(resources.items).length) {
      console.log('✅ All assets are loaded. Initializing game…!');
    } else {
      console.log('☑️ No asset to load. Initializing game…!');
    }
  }

  new Game(document.getElementById('three'), resources, isDebugMode);

  progressBar.style.display = 'none';
  progress.style.display = 'none';

  const ccAttribution = document.getElementById('CC-attribution');
  const cameraControls = document.getElementById('camera-controls');
  const mobileControls = document.getElementById('mobile-controls');

  if (ccAttribution) {
    ccAttribution.classList.add('visible');
  }
  if (cameraControls) {
    cameraControls.classList.add('visible');
  }
  if (mobileControls) {
    mobileControls.classList.add('visible');
  }
});
