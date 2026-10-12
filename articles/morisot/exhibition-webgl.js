(() => {
  'use strict';

  const section = document.querySelector('.exhibition');
  const canvas = document.querySelector('#exhibition-webgl');
  if (!section || !canvas) return;

  const settings = {
    radius: 0.16,
    strength: 0.032,
    propagation: 0.28,
    decay: 1.65,
    maxWaves: 8,
    maxDpr: 1.5
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  const waves = [];
  let renderer, scene, camera, material, texture, observer;
  let frame = 0, active = false, ready = false, loading = false, last = 0;

  function fallback() {
    canvas.classList.add('is-static');
    const context = canvas.getContext('2d');
    if (!context) return;
    const paint = () => {
      const rect = section.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(rect.width));
      const height = Math.max(1, Math.ceil(rect.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#d8d8d0');
      gradient.addColorStop(.5, '#c7ccc3');
      gradient.addColorStop(1, '#d8d8d0');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = .16;
      for (let y = 0; y < height; y += 8) {
        context.fillStyle = y % 16 ? '#7d8e83' : '#f1eee5';
        context.fillRect(0, y, width, 1);
      }
      context.globalAlpha = 1;
    };
    paint();
    addEventListener('resize', paint, {passive:true});
  }

  function makeTexture(THREE) {
    const source = document.createElement('canvas');
    source.width = source.height = 256;
    const context = source.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#d6d8ce');
    gradient.addColorStop(.46, '#b8c3b7');
    gradient.addColorStop(1, '#d8d1c3');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    context.globalAlpha = .2;
    for (let i = 0; i < 46; i++) {
      context.strokeStyle = i % 3 ? '#6c8177' : '#eee9de';
      context.lineWidth = 1 + (i % 3);
      context.beginPath();
      context.moveTo(-20, i * 7 + 10);
      context.bezierCurveTo(70, i * 7 - 18, 170, i * 7 + 35, 276, i * 7 - 4);
      context.stroke();
    }
    context.globalAlpha = 1;
    texture = new THREE.CanvasTexture(source);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function init(THREE) {
    try {
      renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, settings.maxDpr));
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: {value:makeTexture(THREE)},
          uResolution: {value:new THREE.Vector2(1, 1)},
          uTime: {value:0},
          uWaves: {value:Array.from({length:settings.maxWaves}, () => new THREE.Vector4(-2, -2, 0, 0))}
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform vec2 uResolution;
          uniform float uTime;
          uniform vec4 uWaves[8];
          varying vec2 vUv;
          void main() {
            vec2 uv = vUv;
            vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
            vec2 displacement = vec2(0.0);
            for (int i = 0; i < 8; i++) {
              vec4 wave = uWaves[i];
              vec2 delta = (uv - wave.xy) * aspect;
              float distanceToWave = length(delta);
              float ring = sin(distanceToWave * 34.0 - wave.z * 8.0) * exp(-distanceToWave * 12.0);
              float local = exp(-pow(distanceToWave / max(wave.w, 0.001), 2.0));
              displacement += normalize(delta + vec2(0.0001)) * ring * local * 0.012;
            }
            vec2 sampleUv = uv + displacement;
            vec4 color = texture2D(uTexture, sampleUv * vec2(1.05, 1.0) + vec2(uTime * 0.002, 0.0));
            float grain = sin((uv.x + uv.y + uTime * 0.01) * 180.0) * 0.012;
            gl_FragColor = vec4(color.rgb + grain, 0.82);
          }
        `,
        transparent:true
      });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
      ready = true;
      resize();
    } catch (error) {
      fallback();
    }
  }

  function resize() {
    if (!renderer || !material) return;
    const rect = section.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    material.uniforms.uResolution.value.set(Math.max(1, rect.width), Math.max(1, rect.height));
  }

  function enqueue(x, y, speed) {
    if (reduced.matches || coarse.matches || !ready) return;
    waves.push({x, y, age:0, speed:Math.min(1.4, speed), strength:settings.strength});
    if (waves.length > settings.maxWaves) waves.shift();
  }

  function render(now) {
    frame = 0;
    if (!active || !ready || reduced.matches) return;
    const elapsed = Math.min(64, now - last) / 1000;
    last = now;
    waves.forEach(wave => {
      wave.age += elapsed;
      wave.strength *= Math.exp(-settings.decay * elapsed);
    });
    while (waves[0] && (waves[0].age > 2.8 || waves[0].strength < .0005)) waves.shift();
    material.uniforms.uTime.value = now / 1000 * settings.propagation;
    const uniforms = material.uniforms.uWaves.value;
    for (let i = 0; i < settings.maxWaves; i++) {
      const wave = waves[i];
      uniforms[i].set(wave?.x ?? -2, wave?.y ?? -2, wave?.age ?? 0, wave ? settings.radius * wave.strength / settings.strength : 0);
    }
    renderer.render(scene, camera);
    if (waves.length || active) frame = requestAnimationFrame(render);
  }

  function wake() {
    if (!frame && active && ready && !reduced.matches) {
      last = performance.now();
      frame = requestAnimationFrame(render);
    }
  }

  section.addEventListener('pointermove', event => {
    if (coarse.matches || reduced.matches) return;
    const rect = section.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    const distance = Math.hypot(event.movementX, event.movementY);
    if (distance > 1.5) enqueue(x, y, distance / 12);
    wake();
  }, {passive:true});
  addEventListener('resize', resize, {passive:true});
  reduced.addEventListener('change', () => { if (reduced.matches) waves.length = 0; wake(); });
  observer = new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
    if (active) {
      if (!ready && !loading && !reduced.matches && !lowPower && window.WebGLRenderingContext) {
        loading = true;
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js';
        script.onload = () => init(window.THREE);
        script.onerror = fallback;
        document.head.append(script);
      }
      wake();
    }
    else if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }, {threshold:.01});
  observer.observe(section);

  if (reduced.matches || lowPower || !window.WebGLRenderingContext) {
    fallback();
  }
})();
