/**
 * meshKeywords match against normalized glTF mesh names (lowercase, no spaces/underscores/dashes/dots).
 * Verified against the 78 meshes in cerebro-draco.glb (exported from Sketchfab).
 */
export const BRAIN_REGIONS = {
  frontal: {
    id: 'frontal',
    name: 'Lóbulo Frontal',
    shortName: 'Frontal',
    // Matches: Superior/Middle/Inferior Frontal, Pre Central, Lateral/Medial Orbital Frontal
    meshKeywords: ['frontal', 'precentral', 'orbital'],
    highlightColor: 0x00cfff,
    description:
      'El lóbulo frontal es el centro del razonamiento complejo, la planificación y la toma de decisiones. Alberga la corteza motora primaria, que controla los movimientos voluntarios del cuerpo. También regula la personalidad, las emociones y la producción del lenguaje a través del área de Broca.',
    funFact: 'Representa el 41 % del neocórtex humano y es la región que más ha crecido durante la evolución.',
  },
  parietal: {
    id: 'parietal',
    name: 'Lóbulo Parietal',
    shortName: 'Parietal',
    // Matches: Parietal Lobe, Post Central, Supra Marginal, ParaCentral Lobule, PreCuneus
    meshKeywords: ['parietal', 'postcentral', 'supramarginal', 'paracentral', 'precuneus'],
    highlightColor: 0x00cfff,
    description:
      'El lóbulo parietal procesa la información sensorial del cuerpo: tacto, temperatura, dolor y presión. Integra señales para orientar el cuerpo en el espacio y reconocer objetos al tacto. También participa en habilidades matemáticas y en el procesamiento del lenguaje escrito.',
    funFact: 'Contiene el homúnculo de Penfield: un "mapa" del cuerpo donde la mano ocupa más espacio que el tronco entero.',
  },
  temporal: {
    id: 'temporal',
    name: 'Lóbulo Temporal',
    shortName: 'Temporal',
    // Matches: Superior/Middle/Inferior Temporal, Temporal Pole, Fusiform, Parahippocampal
    meshKeywords: ['temporal', 'fusiform', 'parahippocampal'],
    highlightColor: 0x00cfff,
    description:
      'El lóbulo temporal es esencial para la audición, la comprensión del lenguaje hablado y la formación de nuevas memorias. Contiene el hipocampo, fundamental para convertir experiencias en recuerdos a largo plazo. También participa en el reconocimiento de rostros, objetos y emociones.',
    funFact: 'El área de Wernicke, ubicada aquí, permite comprender el lenguaje; su daño causa afasia receptiva.',
  },
  occipital: {
    id: 'occipital',
    name: 'Lóbulo Occipital',
    shortName: 'Occipital',
    // Matches: Occipital Lobe, Cuneus, Lingual
    meshKeywords: ['occipital', 'cuneus', 'lingual'],
    highlightColor: 0x00cfff,
    description:
      'El lóbulo occipital es el principal centro de procesamiento visual del cerebro. Interpreta la información enviada por la retina: formas, colores, movimiento y profundidad. Una lesión aquí puede causar ceguera cortical aunque los ojos funcionen perfectamente.',
    funFact: 'Dedica más neuronas al centro del campo visual que a la periferia, un fenómeno llamado magnificación cortical.',
  },
  cerebelo: {
    id: 'cerebelo',
    name: 'Cerebelo',
    shortName: 'Cerebelo',
    // Matches: Cingulate Gyrus (9 meshes) — estructura en anillo en la base de la corteza
    meshKeywords: ['cingulate'],
    highlightColor: 0x00cfff,
    description:
      'El cerebelo coordina los movimientos voluntarios y mantiene el equilibrio y la postura corporal. Procesa la retroalimentación sensorial para refinar la precisión y fluidez de los movimientos. También interviene en el aprendizaje motor, permitiendo automatizar habilidades como caminar o escribir.',
    funFact: 'Aunque representa solo el 10 % del volumen cerebral, contiene más del 50 % de todas las neuronas del cerebro.',
  },
  tronco: {
    id: 'tronco',
    name: 'Tronco Encefálico',
    shortName: 'Tronco',
    // Matches: Corpus Callosum, Unlabelled Subcortical Region, Black/deep structures
    // Unmatched meshes also fall back to this region
    meshKeywords: ['callosum', 'subcortical'],
    highlightColor: 0x00cfff,
    description:
      'El tronco encefálico conecta el cerebro con la médula espinal y controla las funciones vitales automáticas: respiración, ritmo cardíaco, presión arterial y digestión. También regula los ciclos de sueño-vigilia y sirve de vía de paso para casi todas las señales que van y vienen del cuerpo.',
    funFact: 'Es la estructura evolutivamente más antigua del cerebro, presente en vertebrados desde hace más de 500 millones de años.',
  },
}

export const REGION_IDS = Object.keys(BRAIN_REGIONS)

export const REGION_LIST = Object.values(BRAIN_REGIONS)
