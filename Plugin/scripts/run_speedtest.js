import SpeedTest from 'https://cdn.skypack.dev/@cloudflare/speedtest';


export const speedTestEngine = new SpeedTest({
  autoStart: false
});

window.speedTestEngine = speedTestEngine
