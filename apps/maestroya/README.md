# Maestro Ya (prototipo)

App que conecta clientes con maestros de oficios. Esta carpeta es **independiente del sitio de GEOMAV**: nada del sitio enlaza aquí y la página lleva `noindex`.

- Probar en el navegador: `https://geomav.me/apps/maestroya/`
- Backend: **Firebase** (proyecto `maestroya-cd4a5`, plan Spark, sin Storage). Cuentas por correo/contraseña, perfiles, pedidos y fotos (JPEG pequeños en base64 dentro de Firestore).
- Modo demo (datos solo en el dispositivo): abrir con `?demo=1`, o dejar vacío `apiKey` en `firebase-config.js`.
- La identidad (carnet) se verifica fuera de la app, por WhatsApp; la app **no guarda** fotos de carnet.
- Reglas de seguridad: `firestore.rules` (se pegan en Firebase Console > Firestore > Reglas).
- Administrador: crear a mano en la consola un documento `admins/{UID}` (el UID está en Authentication > Users). Esa cuenta verá "Revisar maestros pendientes" en *Mi cuenta*.
- Eliminar cuenta: desde la app (*Mi cuenta*), también accesible en `https://geomav.me/apps/maestroya/#cuenta` (URL para Play Console).

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
2. Restringir la API key de Firebase por referrer (`geomav.me` y `https://localhost`).
3. Prueba cerrada en Play Console: 12 testers durante 14 días seguidos (cuenta personal).
4. Política de privacidad propia (se piden datos de identidad) y formulario de Seguridad de los datos en Play Console.
5. AdMob: reemplazar el espacio "Publicidad" (`#ad` en `index.html`) por el banner real y crear la app en AdMob.
6. Generar AAB firmado (keystore propio, guardado fuera del repo).
