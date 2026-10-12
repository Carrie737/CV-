/* Native, gesture-started local music. No AudioContext dependency or autoplay. */
(() => {
  'use strict';
  const audio = document.querySelector('#gallery-music');
  const button = document.querySelector('#sound');
  if (!audio || !button) return;
  const settings = document.querySelector('#sound-settings');
  const panel = document.querySelector('#music-settings');
  const slider = document.querySelector('#music-volume');
  const output = document.querySelector('#music-volume-value');
  const status = document.querySelector('#music-status');
  const announcement = document.querySelector('#music-announcement');
  let wanted = false, printing = false, version = 0, timeout = 0;
  let volume = .55;
  try {
    const saved = localStorage.getItem('morisot-music-volume');
    if (saved !== null && Number.isFinite(Number(saved))) volume = Math.max(0,Math.min(1,Number(saved)));
  } catch { /* Storage is optional, including when opening a local file. */ }
  audio.volume = volume;
  slider.value = String(Math.round(volume * 100));
  output.textContent = `${slider.value}%`;
  const blocked = () => document.hidden || printing;
  const clearTimer = () => { clearTimeout(timeout); timeout = 0; };
  function render(state, message) {
    const playing = state === 'playing';
    button.dataset.state = state;
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-busy',String(state === 'loading'));
    button.setAttribute('aria-label',wanted ? '关闭背景音乐' : '播放背景音乐');
    button.querySelector('span').textContent = state === 'loading' ? '正在加载'
      : playing ? (audio.volume === 0 ? '音乐静音' : '音乐播放中')
      : state === 'error' ? '点击重试' : state === 'background' ? '音乐已暂停' : '音乐关闭';
    if (message) { status.textContent = message; announcement.textContent = message; }
  }
  function fail(error) {
    clearTimer();
    wanted = false; version++;
    audio.pause();
    const message = error?.name === 'NotAllowedError'
      ? '浏览器暂未允许播放，请再次点击音乐按钮。'
      : audio.error?.code === 4
        ? '音乐格式或资源无法读取，请重试或下载音频播放。'
        : '音乐未能播放，请检查资源连接后点击重试。';
    render('error',message);
  }
  function start() {
    if (!wanted || blocked()) return;
    const token = ++version;
    clearTimer();
    if (!audio.getAttribute('src')) audio.src = audio.dataset.src;
    else if (audio.error) audio.load();
    render('loading','正在加载《纸间微光》，再次点击可取消。');
    timeout = setTimeout(() => {
      if (version === token && wanted && !blocked() && audio.paused) fail();
    },15000);
    // Call play synchronously in the click gesture, before any await or fetch.
    try {
      const attempt = audio.play();
      Promise.resolve(attempt).then(() => {
        if (token !== version) return;
        clearTimer();
        if (!wanted || blocked()) { audio.pause(); return; }
        render('playing','正在播放《纸间微光》 · 原创合成钢琴与氛围音乐。');
      }).catch(error => {
        if (token === version && wanted && !blocked()) fail(error);
      });
    } catch (error) { if (token === version) fail(error); }
  }
  button.addEventListener('click',() => {
    wanted = !wanted;
    if (wanted) start();
    else {
      version++; clearTimer(); audio.pause();
      render('off','音乐已关闭；再次点击可从暂停位置继续。');
    }
  });
  audio.addEventListener('playing',() => {
    if (!wanted || blocked()) { audio.pause(); return; }
    clearTimer();
    render('playing','正在播放《纸间微光》 · 原创合成钢琴与氛围音乐。');
  });
  const buffering = () => {
    if (wanted && !blocked()) {
      render('loading','音乐正在缓冲，再次点击可取消。');
      clearTimer();
      timeout = setTimeout(() => { if (wanted && !blocked()) fail(); },15000);
    }
  };
  audio.addEventListener('waiting',buffering);
  audio.addEventListener('stalled',() => { if (audio.readyState < 3) buffering(); });
  audio.addEventListener('error',() => { if (wanted) fail(); });
  audio.addEventListener('pause',() => {
    if (blocked() || !wanted || !audio.paused) return;
    // A native/OS media pause must not leave the toggle claiming it is playing.
    wanted = false; version++; clearTimer();
    render('off','音乐已暂停；点击音乐按钮可继续。');
  });
  slider.addEventListener('input',() => {
    const requested = Number(slider.value) / 100;
    audio.volume = requested;
    output.textContent = `${slider.value}%`;
    try { localStorage.setItem('morisot-music-volume',String(requested)); } catch { /* optional */ }
    if (!audio.paused) render('playing',requested === 0 ? '音乐已静音，可调整音量或关闭播放。' : '正在播放《纸间微光》。');
    if (Math.abs(audio.volume - requested) > .02) {
      status.textContent = '此浏览器由设备按键控制媒体音量，请使用设备音量键。';
      announcement.textContent = status.textContent;
    }
  });
  const closeSettings = (restoreFocus = false) => {
    panel.hidden = true; settings.setAttribute('aria-expanded','false');
    if (restoreFocus) settings.focus();
  };
  settings.addEventListener('click',() => {
    panel.hidden = !panel.hidden;
    settings.setAttribute('aria-expanded',String(!panel.hidden));
    if (!panel.hidden) slider.focus();
  });
  document.addEventListener('pointerdown',event => {
    if (!event.target.closest('#sound-controls')) closeSettings();
  });
  panel.addEventListener('keydown',event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); closeSettings(true); }
  });
  // Do not let music shortcuts trigger the exhibition's chapter navigation.
  document.querySelector('#sound-controls').addEventListener('keydown',event => event.stopPropagation());
  function suspend() {
    version++; clearTimer(); audio.pause();
    render(wanted ? 'background' : 'off',wanted ? '音乐已暂停，回到页面后继续。' : '默认关闭，点击音乐按钮后播放。');
  }
  document.addEventListener('visibilitychange',() => {
    if (blocked()) suspend();
    else if (wanted) start();
  });
  window.addEventListener('beforeprint',() => { printing = true; suspend(); });
  window.addEventListener('afterprint',() => { printing = false; if (wanted && !blocked()) start(); });
  window.addEventListener('pagehide',() => { wanted = false; suspend(); });
  render('off','默认关闭，点击音乐按钮后播放。');
})();
