# Maestro Ya (prototipo)

App que conecta clientes con maestros de oficios. Esta carpeta es **independiente del sitio de GEOMAV**: nada del sitio enlaza aquí y la página lleva `noindex`.

- Probar en el navegador: `https://geomav.me/apps/maestroya/`
- Versión de prueba: no hay servidor ni base de datos. Todo se guarda en el dispositivo (`localStorage`). Las fotos de carnet y selfie **no se guardan**.

## Generar el APK de prueba (Windows)

Requisitos: Node.js y Android Studio.

```bat
cd apps\maestroya
npm install @capacitor/core @capacitor/cli @capacitor/android
node build-www.js
npx cap add android
npx cap sync android
npx cap open android
```

En Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Cópialo al teléfono e instálalo.

Cada vez que cambies `index.html`: `npm run sync` y vuelve a compilar.

## Antes de subir a Play Store

1. **Definir el `appId`** en `capacitor.config.json` (hoy `cl.maestroya.app`). No se puede cambiar una vez publicada.
2. Hacer el backend real (cuentas, perfiles, pedidos, fotos de verificación cifradas). Sin eso, cada usuario solo ve sus propios datos.
3. Verificación por SMS o correo del teléfono del maestro.
4. Política de privacidad propia (se piden datos de identidad) y formulario de Seguridad de los datos en Play Console.
5. AdMob: reemplazar el espacio "Publicidad" (`#ad` en `index.html`) por el banner real y crear la app en AdMob.
6. Generar AAB firmado (keystore propio, guardado fuera del repo).
