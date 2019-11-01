import { createDerivedMaterial } from 'troika-three-utils'
import { Vector4 } from 'three'

const VERTEX_DEFS = `
uniform float uTroikaGlyphVSize;
uniform vec4 uTroikaTotalBounds;
attribute vec4 aTroikaGlyphBounds;
attribute float aTroikaGlyphIndex;
varying vec2 vTroikaGlyphUV;
varying vec3 vTroikaLocalPos;
`

const VERTEX_TRANSFORM = `
vTroikaGlyphUV = vec2(
  position.x,
  uTroikaGlyphVSize * (aTroikaGlyphIndex + position.y)
);

position = vec3(
  mix(aTroikaGlyphBounds.x, aTroikaGlyphBounds.z, position.x),
  mix(aTroikaGlyphBounds.y, aTroikaGlyphBounds.w, position.y),
  position.z
);
vTroikaLocalPos = vec3(position);

uv = vec2(
  (position.x - uTroikaTotalBounds.x) / (uTroikaTotalBounds.z - uTroikaTotalBounds.x),
  (position.y - uTroikaTotalBounds.y) / (uTroikaTotalBounds.w - uTroikaTotalBounds.y)
);
`

const FRAGMENT_DEFS = `
uniform sampler2D uTroikaSDFTexture;
uniform float uTroikaSDFMinDistancePct;
uniform bool uTroikaSDFDebug;
uniform float uTroikaGlyphVSize;
uniform vec4 uTroikaClipRect;
varying vec2 vTroikaGlyphUV;
varying vec3 vTroikaLocalPos;

float troikaGetClipAlpha() {
  vec4 clip = uTroikaClipRect;
  vec3 pos = vTroikaLocalPos;
  float dClip = min(
    min(pos.x - min(clip.x, clip.z), max(clip.x, clip.z) - pos.x),
    min(pos.y - min(clip.y, clip.w), max(clip.y, clip.w) - pos.y)
  );
  #if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
  float aa = length(fwidth(pos)) * 0.5;
  return smoothstep(-aa, aa, dClip);
  #else
  return step(0.0, dClip);
  #endif
}
`

const FRAGMENT_TRANSFORM = `
float troikaSDFValue = texture2D(uTroikaSDFTexture, vTroikaGlyphUV).r;

#if defined(IS_DEPTH_MATERIAL) || defined(IS_DISTANCE_MATERIAL)
if (troikaSDFValue < 0.5) discard;
#else

${''/*
  When the standard derivatives extension is available, we choose an antialiasing alpha threshold based
  on the potential change in the SDF's alpha from this fragment to its neighbor. This strategy maximizes 
  readability and edge crispness at all sizes and screen resolutions. Interestingly, this also means that 
  below a minimum size we're effectively displaying the SDF texture unmodified.
*/}
#if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
  float troikaAntiAliasDist = min(
    0.5,
    0.5 * min(
      fwidth(vTroikaGlyphUV.x), 
      fwidth(vTroikaGlyphUV.y / uTroikaGlyphVSize)
    )
  ) / uTroikaSDFMinDistancePct;
#else
  float troikaAntiAliasDist = 0.01;
#endif

float textAlphaMult = uTroikaSDFDebug ? troikaSDFValue : smoothstep(
  0.5 - troikaAntiAliasDist,
  0.5 + troikaAntiAliasDist,
  troikaSDFValue
);

textAlphaMult = min(textAlphaMult, troikaGetClipAlpha());

if (textAlphaMult == 0.0) {
  if (uTroikaSDFDebug) {
    gl_FragColor *= 0.5;
  } else {
    discard;
  }
} else {
  gl_FragColor.a *= textAlphaMult;
}

#endif
`


/**
 * Create a material for rendering text, derived from a baseMaterial
 */
export function createTextDerivedMaterial(baseMaterial) {
  const textMaterial = createDerivedMaterial(baseMaterial, {
    extensions: {derivatives: true},
    uniforms: {
      uTroikaSDFTexture: {value: null},
      uTroikaSDFMinDistancePct: {value: 0},
      uTroikaGlyphVSize: {value: 0},
      uTroikaTotalBounds: {value: new Vector4()},
      uTroikaClipRect: {value: new Vector4()},
      uTroikaSDFDebug: {value: false}
    },
    vertexDefs: VERTEX_DEFS,
    vertexTransform: VERTEX_TRANSFORM,
    fragmentDefs: FRAGMENT_DEFS,
    fragmentColorTransform: FRAGMENT_TRANSFORM
  })

  // Force transparency - TODO is this reasonable?
  textMaterial.transparent = true

  // WebGLShadowMap reverses the side of the shadow material by default, which fails
  // for planes, so here we force the `shadowSide` to always match the main side.
  Object.defineProperty(textMaterial, 'shadowSide', {
    get() {
      return this.side
    }
  })

  return textMaterial
}


