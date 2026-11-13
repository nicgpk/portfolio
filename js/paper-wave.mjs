// Paper Shaders 0.0.81, Apache-2.0. Vendored locally; no runtime third-party requests.
import {getShaderColorFromString} from './vendor/paper/get-shader-color-from-string.js?v=5b4a27c2ff33';
import {createWorkerWave} from './wave-worker-host.mjs?v=02b1aa4b0ad7';
const hosts=document.querySelectorAll('[data-paper-wave]');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-width:767px)');
// All waves on a page share the same decoded noise image.
let noiseReady;
const sharedNoise=async(getShaderNoiseTexture)=>{
 if(!noiseReady) noiseReady=(async()=>{const noise=getShaderNoiseTexture();await noise.decode();return noise;})();
 return noiseReady;
};
for(const host of hosts) {
 let mount;
 let failed=false;
 let fallbackInProgress=false;
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
  const initialFrame=middle?38000:12000;
  const uniforms=()=>({
   u_colorBack:getShaderColorFromString('#0a0a0a'),...composition(),
   u_softness:middle?.9:.84,u_intensity:middle?.56:.32,u_noise:.0308,u_shape:1,
   u_fit:0,u_originX:.5,u_originY:.5,u_worldWidth:0,u_worldHeight:0,
  });
  const mainWave=async(frame=initialFrame)=>{
   const [{ShaderMount},{grainGradientFragmentShader},{getShaderNoiseTexture},{cacheWaveNoise}]=await Promise.all([
    import('./vendor/paper/shader-mount.js?v=e20176f5b0d3'),
    import('./vendor/paper/shaders/grain-gradient.js?v=04bc77846c4f'),
    import('./vendor/paper/get-shader-noise-texture.js?v=d0d1b0de0a4f'),
    import('./wave-noise-cache.mjs?v=0af8ec7a553f'),
   ]);
   const noise=await sharedNoise(getShaderNoiseTexture);
   const result=new ShaderMount(host,grainGradientFragmentShader,{...uniforms(),u_noiseTexture:noise},
    {alpha:true,antialias:false,powerPreference:'low-power'},reduced.matches?0:speed,frame,1,pixelBudget());
   cacheWaveNoise(result,grainGradientFragmentShader);
   host.dataset.waveRenderer='main';
   return result;
  };
  const ready=()=>{
   host.dataset.waveState=reduced.matches?'static':'animated';
   host.classList.add('is-wave-ready');
   mount.canvasElement.setAttribute('aria-hidden','true');
   if(host.dataset.waveRenderer==='main')mount.canvasElement.addEventListener('webglcontextlost',()=>{
    failed=true;mount.dispose();host.classList.remove('is-wave-ready');host.dataset.waveState='fallback';
   });
  };
  const restoreMain=async({frame})=>{
   if(failed||fallbackInProgress)return;
   fallbackInProgress=true;
   mount?.dispose();host.classList.remove('is-wave-ready');
   try{mount=await mainWave(frame??initialFrame);ready();}
   catch(error){failed=true;host.dataset.waveState='fallback';host.replaceChildren();}
  };
  try {
   try{mount=await createWorkerWave(host,{uniforms:uniforms(),speed:reduced.matches?0:speed,
    frame:initialFrame,minPixelRatio:1,maxPixelCount:pixelBudget(),onError:restoreMain});}
   catch{mount=null;}
   if(!mount)mount=await mainWave();
   mount.setUniformsAndMaxPixelCount(uniforms(),pixelBudget());
   mount.setSpeed(reduced.matches?0:speed);
   ready();
   compact.addEventListener('change',()=>{if(failed)return;mount.setUniformsAndMaxPixelCount(composition(),pixelBudget());});
   reduced.addEventListener('change',()=>{if(failed)return;mount.setSpeed(reduced.matches?0:speed);host.dataset.waveState=reduced.matches?'static':'animated';});
   // Both renderers retain their clock while offscreen or document-hidden.
   addEventListener('pagehide',()=>{if(!failed)mount.setSpeed(0);});
   addEventListener('pageshow',()=>{if(!failed)mount.setSpeed(reduced.matches?0:speed);});
  }catch (error) {console.warn('Portfolio wave fallback:', error.message);host.dataset.waveState='fallback';host.replaceChildren();}
 };
 if(middle||showcase||host.dataset.paperWave==='footer') {
  const lazy=new IntersectionObserver((entries)=>{if(entries.some(entry=>entry.isIntersecting)){lazy.disconnect();start();}},{rootMargin:'250px'});
  lazy.observe(host);
 }else if(host.hasAttribute('data-wave-eager')) start();
 else if(typeof requestIdleCallback==='function') requestIdleCallback(()=>start(),{timeout:1200});
 else addEventListener('load',()=>start(),{once:true});
}
