// Copia la app web a www/, que es la carpeta que Capacitor empaqueta en el APK.
const fs = require('fs');
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
fs.copyFileSync('index.html', 'www/index.html');
console.log('www/ listo');
