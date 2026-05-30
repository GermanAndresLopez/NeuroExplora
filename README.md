# NeuroExplora

Web app de Realidad Aumentada educativa sobre el cerebro humano. Funciona directamente desde el navegador móvil — sin instalación.

## Características

- **AR con marcador**: el cerebro 3D aparece sobre una imagen impresa
- **Modo libre**: si no se detecta el marcador en 5 s, el cerebro flota en modo de cámara libre
- **6 regiones interactivas**: toca cada parte del cerebro para ver nombre, función y dato curioso
- **Audio en español**: Web Speech API nativa (sin APIs externas)
- **Juego Memory**: 12 fichas, 6 pares de regiones cerebrales
- **Quiz Cerebral**: 6 preguntas de opción múltiple
- Tema oscuro, mobile-first (390 px), totalmente responsive

---

## Requisitos previos

- **Node.js 18+** — [https://nodejs.org](https://nodejs.org)
- Navegador moderno con WebRTC: Chrome para Android / Safari para iOS 15+
- El modelo 3D `public/models/cerebro.glb` debe existir (ya incluido)

---

## Instalación y desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional pero recomendado) Comprimir el modelo GLB con Draco (~80% menos tamaño)
#    Requiere @gltf-transform/cli (incluido en devDependencies)
npm run copy-draco       # copia los decoders WASM a public/draco/
npm run compress-glb     # genera public/models/cerebro-draco.glb
# Luego cambia la ruta en src/components/BrainModel.js: '/models/cerebro-draco.glb'

# 3. Arrancar el servidor de desarrollo (HTTPS automático con @vitejs/plugin-basic-ssl)
npm run dev
```

El servidor se inicia en `https://localhost:5173`.  
Acepta el certificado autofirmado en el navegador (o en el móvil al abrir la IP local).

### Probar en móvil (LAN)

Con el servidor corriendo, abre en tu teléfono:

```
https://<IP-local>:5173
```

Ejemplo: `https://192.168.1.42:5173`

La IP local aparece en la salida de `npm run dev` (línea `➜ Network`).  
Acepta la advertencia de certificado en el navegador móvil.

---

## Generar el archivo de marcador AR

El marcador es una imagen impresa que la cámara reconoce para posicionar el cerebro 3D.

### Opción A — Compilador online (más fácil)

1. Elige o descarga una imagen de alta calidad para el marcador (un diagrama cerebral, por ejemplo)
2. Ve a [https://hiukim.github.io/mind-ar-js-doc/tools/compile](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
3. Sube la imagen y descarga el archivo `.mind` generado
4. Guárdalo en `public/targets/brain-target.mind`

### Opción B — Script local (requiere node-canvas)

```bash
# Instala el addon nativo (requiere Python + build tools en Windows)
npm install canvas

# Coloca tu imagen de marcador en:
#   public/targets/brain-target.png

# Compila:
npm run compile-target
```

### Recomendaciones para la imagen de marcador

- Tamaño mínimo: 400×400 px
- Alto contraste y mucho detalle (evita fondos blancos lisos)
- Imprime en papel a tamaño mínimo A5
- Asegúrate de buena iluminación al escanear

---

## Build y deploy

### Build de producción

```bash
npm run build
# Los archivos quedan en /dist
```

### Deploy en Vercel

```bash
# Instala Vercel CLI si no lo tienes
npm i -g vercel

# Deploy (primera vez, sigue el wizard)
vercel

# Deploy de producción
vercel --prod
```

O conecta el repositorio en [vercel.com](https://vercel.com) para CI/CD automático.

### Variables de entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables:

| Variable | Valor |
|---|---|
| `VITE_APP_URL` | `https://tu-app.vercel.app` |

Esta variable genera el código QR en la página "Acerca de".

---

## Estructura del proyecto

```
neuroexplora/
├── public/
│   ├── models/
│   │   └── cerebro.glb          ← modelo 3D (21 MB)
│   ├── targets/
│   │   └── brain-target.mind    ← compilar antes del primer uso
│   └── draco/                   ← decoders WASM (generados con npm run copy-draco)
├── scripts/
│   ├── copy-draco.js
│   └── compile-target.js
├── src/
│   ├── components/
│   │   ├── ARScene.jsx          ← orquesta MindARThree + Three.js
│   │   ├── BrainModel.js        ← carga GLB, mapeo de regiones, highlight
│   │   ├── InfoPanel.jsx        ← panel deslizable de información
│   │   ├── AudioButton.jsx      ← Web Speech API
│   │   ├── BottomNav.jsx        ← navegación inferior
│   │   └── games/
│   │       ├── MemoryGame.jsx
│   │       └── QuizGame.jsx
│   ├── data/
│   │   └── brainRegions.js      ← textos educativos + keywords de meshes
│   ├── hooks/
│   │   └── useSpeech.js         ← hook de síntesis de voz
│   ├── views/
│   │   ├── GamesView.jsx
│   │   └── AboutView.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Mapeo de regiones del modelo

El archivo `src/components/BrainModel.js` contiene la función `getRegionForMesh()` que mapea
los nombres de los meshes del GLB a las 6 regiones educativas.

Al cargar el modelo por primera vez, se imprimen en consola todos los nombres de los meshes:

```
[NeuroExplora] Brain mesh names: ['Mesh_0001', 'Left-Frontal-Sup', ...]
```

Si el modelo tiene nombres distintos a los esperados, edita las `meshKeywords` en
`src/data/brainRegions.js` para ajustar el mapeo.

---

## Compatibilidad

| Navegador | AR | Audio TTS |
|---|---|---|
| Chrome para Android 81+ | ✓ | ✓ |
| Safari para iOS 15.4+ | ✓ | ✓ |
| Firefox para Android | ✓ | Limitado |
| Samsung Internet | ✓ | ✓ |

**Requisitos**: HTTPS, permisos de cámara, JavaScript habilitado.

---

## Tecnologías

- [React 18](https://react.dev) + [Vite 6](https://vitejs.dev)
- [Mind AR 1.2.5](https://hiukim.github.io/mind-ar-js-doc/) — AR de marcadores en el navegador
- [Three.js 0.161](https://threejs.org) — renderizado 3D
- [Tailwind CSS 4](https://tailwindcss.com)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) — TTS nativo
