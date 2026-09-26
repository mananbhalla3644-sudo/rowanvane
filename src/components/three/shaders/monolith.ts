/* ───────────────────────────────────────────────────────────────────────────
   three/shaders/monolith

   A GLSL patch for the monolith's material, applied through onBeforeCompile so
   it keeps MeshPhysicalMaterial's real PBR and environment reflections and
   only *adds* the parts the theme asks for:

     · a slow, low-amplitude normal perturbation, so the obsidian surface
       catches the key light unevenly the way a real polished stone does
     · a fresnel rim in the ramp's gold, so the silhouette separates from the
       background without an outline

   Why patch rather than write a ShaderMaterial from scratch: a hand-written
   shader would mean re-implementing image-based lighting, tone mapping and
   shadows to get two small effects. The numbers are read from the theme and
   pushed in as uniforms, so nothing here hard-codes a look.

   `vViewPosition` and `normal` are both already declared in three's physical
   fragment shader, which is why no extra varyings are needed.
   ─────────────────────────────────────────────────────────────────────────── */

import { Color, type Material, type WebGLProgramParametersWithUniforms } from 'three'
import { theme } from '../../../theme/theme.config'

export interface MonolithUniforms {
  uTime: { value: number }
  uNoiseSpeed: { value: number }
  uDistortion: { value: number }
  uFresnelColor: { value: Color }
  uFresnelStrength: { value: number }
}

const VERTEX_HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uNoiseSpeed;
`

const FRAGMENT_HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uNoiseSpeed;
  uniform float uDistortion;
  uniform vec3  uFresnelColor;
  uniform float uFresnelStrength;

  // Three cheap sines standing in for 3D value noise. At uDistortion 0.04 the
  // result is a surface that shimmers rather than one that visibly ripples, so
  // the approximation costs nothing and shows nothing.
  float rvSurfaceNoise(vec3 p) {
    return sin(p.x * 3.1 + uTime * uNoiseSpeed)
         * sin(p.y * 2.7 - uTime * uNoiseSpeed * 0.8)
         * sin(p.z * 3.4 + uTime * uNoiseSpeed * 0.3);
  }
`

/** Applied right after three has established the shading normal. */
const NORMAL_FRAGMENT = /* glsl */ `
  {
    vec3 rvP = vViewPosition * 0.6;
    float rvN = rvSurfaceNoise(rvP);
    normal = normalize(normal + vec3(rvN, rvN * 0.6, -rvN * 0.4) * uDistortion);
  }
`

/** Applied where three has accumulated emissive light, before tone mapping. */
const FRESNEL_FRAGMENT = /* glsl */ `
  {
    float rvFres = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 3.0);
    totalEmissiveRadiance += uFresnelColor * rvFres * uFresnelStrength;
  }
`

/**
 * Patches a material in place and returns the uniform bag so the render loop
 * can drive uTime. Safe to call once per material at mount.
 */
export function applyMonolithShader<T extends Material>(material: T): MonolithUniforms {
  const ramp = theme.three.shaderMood.colorRamp
  const uniforms: MonolithUniforms = {
    uTime: { value: 0 },
    uNoiseSpeed: { value: theme.three.shaderMood.noiseSpeed },
    uDistortion: { value: theme.three.shaderMood.distortionStrength },
    // Second stop of the ramp: the scene's warm shadow leaning into gold.
    uFresnelColor: { value: new Color(ramp[2]) },
    uFresnelStrength: { value: 0.16 },
  }

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms)

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEAD}`)
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        // A breath of vertical drift, ~1cm at the object's scale, so the form
        // is never perfectly still. Not enough to read as a float.
        transformed.y += sin(uTime * uNoiseSpeed * 0.7) * 0.012;
        `,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_HEAD}`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>\n${NORMAL_FRAGMENT}`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\n${FRESNEL_FRAGMENT}`,
      )
  }

  // Tells three the program changed, so materials sharing a program don't
  // silently reuse the unpatched one.
  material.customProgramCacheKey = () => 'rv-monolith-v1'
  return uniforms
}
