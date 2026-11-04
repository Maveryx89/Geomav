// Copia la app web a www/, que es la carpeta que Capacitor empaqueta en el APK.
const fs = require('fs');
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
['index.html', 'firebase-config.js', 'privacidad.html'].forEach(f => fs.copyFileSync(f, 'www/' + f));
console.log('www/ listo');
