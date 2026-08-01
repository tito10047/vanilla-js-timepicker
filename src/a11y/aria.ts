export function createLiveRegion(): { el: HTMLElement; announce: (msg: string) => void } {
  const region = document.createElement('div');
  region.className = 'vtp-live';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.appendChild(region);

  return {
    el: region,
    announce(msg: string) {
      region.textContent = '';
      requestAnimationFrame(() => { region.textContent = msg; });
    },
  };
}
