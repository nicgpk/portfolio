import { linkHorizontal } from './vendor/d3-shape-3.2.0.mjs';

// Measure real node ports so connectors remain attached after any responsive reflow.
export function initDeploymentTopology(canvas) {
  if (!canvas) return;
  const svg = canvas.querySelector('.topology-links');
  const source = canvas.querySelector('.topology-source');
  const regions = [...canvas.querySelectorAll('.topology-regions .topology-node')];
  const paths = regions.map(() => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(path);
    return path;
  });
  const draw = () => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const origin = source.getBoundingClientRect();
    const link = linkHorizontal();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const start = [origin.right - bounds.left, origin.top + origin.height / 2 - bounds.top];
    regions.forEach((node, index) => {
      const target = node.getBoundingClientRect();
      const end = [target.left - bounds.left, target.top + target.height / 2 - bounds.top];
      paths[index].setAttribute('d', link({ source: start, target: end }));
    });
  };
  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  draw();
}
