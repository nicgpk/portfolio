// Paper Shaders 0.0.81, Apache-2.0. Vendored locally; no runtime third-party requests.
import {ShaderMount} from './vendor/paper/shader-mount.js';
import {grainGradientFragmentShader, GrainGradientShapes} from './vendor/paper/shaders/grain-gradient.js';
import {getShaderColorFromString} from './vendor/paper/get-shader-color-from-string.js';
import {getShaderNoiseTexture} from './vendor/paper/get-shader-noise-texture.js';
const hosts=document.querySelectorAll('[data-paper-wave]');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-width:767px)');
for(const host of hosts) {
 let mount;
 let failed=false;
 const middle=host.dataset.paperWave==='midpage';
 const showcase=['showcase','resume'].includes(host.dataset.paperWave);
 const speed=showcase?.12:middle?-.12:.18;
 const composition=()=>{
  const warm=compact.matches?'#cec8bb66':'#cec8bb';
  const colors=middle?['#000000',warm,'#204a7e','#000000']:['#000000','#204a7e',warm,'#000000'];
  return {u_colors:colors.map(getShaderColorFromString),u_colorsCount:colors.length,
    u_scale:showcase?.85:compact.matches?(middle?.7:.85):(middle?.9:1.3),
    u_rotation:showcase?48:compact.matches?(middle?112:18):(middle?128:18),
    u_offsetX:middle?(compact.matches?.08:.22):0,u_offsetY:middle?(compact.matches?-.04:-.12):0};
 };
 const pixelBudget=()=>showcase?(compact.matches?300000:450000):compact.matches?(middle?350000:450000):(middle?500000:800000);
 const start=async()=>{
  try {
   const noise=getShaderNoiseTexture();await noise.decode();
   mount=new ShaderMount(host,grainGradientFragmentShader,{
    u_colorBack:getShaderColorFromString('#0a0a0a'),...composition(),
    u_softness:middle?.9:.84,u_intensity:middle?.56:.32,u_noise:.0308,u_shape:GrainGradientShapes.wave,u_noiseTexture:noise,
    u_fit:0,u_originX:.5,u_originY:.5,u_worldWidth:0,u_worldHeight:0,
   },{alpha:true,antialias:false,powerPreference:'low-power'},reduced.matches?0:speed,middle?38000:12000,1,pixelBudget());
   compact.addEventListener('change',()=>{if(failed)return;mount.setUniforms(composition());mount.setMaxPixelCount(pixelBudget());});
   host.dataset.waveState=reduced.matches?'static':'animated';
   host.classList.add('is-wave-ready');
   mount.canvasElement.setAttribute('aria-hidden','true');
   mount.canvasElement.addEventListener('webglcontextlost',()=>{failed=true;mount.dispose();host.classList.remove('is-wave-ready');host.dataset.waveState='fallback';});
   reduced.addEventListener('change',()=>{if(failed)return;mount.setSpeed(reduced.matches?0:speed);host.dataset.waveState=reduced.matches?'static':'animated';});
   // ShaderMount handles offscreen and document-hidden pausing internally.
   addEventListener('pagehide',()=>{if(!failed)mount.setSpeed(0);});
   addEventListener('pageshow',()=>{if(!failed)mount.setSpeed(reduced.matches?0:speed);});
  }catch (error) {console.warn('Portfolio wave fallback:', error.message);host.dataset.waveState='fallback';host.replaceChildren();}
 };
 if(middle||showcase) {
  const lazy=new IntersectionObserver((entries)=>{if(entries.some(entry=>entry.isIntersecting)){lazy.disconnect();start();}},{rootMargin:'250px'});
  lazy.observe(host);
 }else start();
}
