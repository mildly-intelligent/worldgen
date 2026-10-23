precision highp float;

#define SCALE 10.
#define CONTINENTAL
#define CONTINENTNESS 1.75

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float noise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

const mat2 m2 = mat2(  0.80,  0.60,
                      -0.60,  0.80 );
const mat2 m2i = mat2( 0.80, -0.60,
                       0.60,  0.80 );

vec3 noised(vec2 v) {
    float n = noise(v);
    float dx = noise(v + vec2(0.01, 0.0)) / 0.01;
    float dy = noise(v + vec2(0.0, 0.01)) / 0.01;

    return vec3(n,dx,dy);
}


vec2 fbm(vec2 x, float seed, float freq_scale, float amp_scale, float k, int octaves) {
    float a = 0.0;
    float amp = 0.5;
    vec2  d = vec2(0.0);
    mat2  m = mat2(1.0,0.0,0.0,1.0);
    for (int i=0 ; i<octaves ; i++) {
        vec3 n = noised(x + mod289(vec2(seed, seed)));
        a += amp*n.x;          // accumulate values		
        a *= 1.0 / (1.0 - k * length(d));
        d += amp*m*n.yz;       // accumulate derivatives
        amp *= amp_scale;
        x = freq_scale*m2*x;
        m = freq_scale*m2i*m;
    }

	return vec2(a, length(d)*0.01);
}


vec3 terrain(vec2 uv, float seed) {
    float h = fbm(uv,       seed, 2.4, 0.4, 0.0005, 8).x*0.5+0.5;
    #ifdef CONTINENTAL
        h *= 1.0-length(uv*CONTINENTNESS/SCALE);
    #endif
    float t = fbm(uv * 0.1, seed+1., 2.0, 0.5, 0.0001, 4).x;
    float w = fbm(uv * 0.1, seed+2., 2.0, 0.5, 0.0001, 4).x;
    float ocean = fbm(uv/5., seed+3., 2., 0.5, 0.0005, 2).x;
    ocean = 0.05*ocean + 0.95*smoothstep(-0.25, 0.25, ocean);
    h = pow(sqrt(h)*0.5+0.5,3.0)*ocean;

    return vec3(h*2.0-1.0, t, w);
}

#define B_COLD_OCEAN vec4(.0, .4, .0, 1.)
#define I_COLD_OCEAN 0x01
#define B_WARM_OCEAN vec4(.7, 1., .0, 1.)
#define I_WARM_OCEAN 0x02
#define B_ICY vec4(.0, .3, .0, 1.)
#define I_ICY 0x11
#define B_CORAL vec4(.7, 1., .0, 1.)
#define I_CORAL 0x12
#define B_DESERT vec4(.6, 1., .0, .4)
#define I_DESERT 0x31
#define B_SAVANNA vec4(.6, 1., .4, .65)
#define I_SAVANNA 0x32
#define B_SWAMP vec4(.0, .3, .8, 1.)
#define I_SWAMP 0x33
#define B_TAIGA vec4(.25, .35, .0, .6)
#define I_TAIGA 0x34
#define B_SNOWY vec4(.0, .25, .0, .5)
#define I_SNOWY 0x35
#define B_FOREST vec4(.2, .8, .4, .6)
#define I_FOREST 0x36
#define B_FIELD vec4(.5, .6, .5, .8)
#define I_FIELD 0x37

#define BIOME(B, I) if (is_biome(tw, B)) { return I; }

bool is_biome(vec2 tw, vec4 biome) {
    return biome.x <= tw.x && tw.x <= biome.y
        && biome.z <= tw.y && tw.y <= biome.w;
}

int get_biome(vec3 htw) {
    vec2 tw = htw.yz;
    if (htw.x < 0.125) {
        // Oceans
        BIOME(B_COLD_OCEAN, I_COLD_OCEAN);
        BIOME(B_WARM_OCEAN, I_WARM_OCEAN);
        return 0x00;
    } else if (htw.x < 0.35) {
        // Shallow
        BIOME(B_ICY, I_ICY);
        BIOME(B_CORAL, I_CORAL);
        return 0x10;
    } else if (htw.x < 0.41) {
        // Shore
        return 0x20;
    } else if (htw.x < 0.775) {
        // Normal
        BIOME(B_DESERT, I_DESERT);
        BIOME(B_SAVANNA, I_SAVANNA);
        BIOME(B_SWAMP, I_SWAMP);
        BIOME(B_TAIGA, I_TAIGA);
        BIOME(B_SNOWY, I_SNOWY);
        BIOME(B_FOREST, I_FOREST);
        BIOME(B_FIELD, I_FIELD);
        return 0x30;
    } else if (htw.x < 0.9) {
        // Mountainous
        return 0x40;
    } else {
        // Snowcap
        return 0x50;
    }
    return -1;
}

vec3 get_color(int biome) {
    switch (biome) {
        case 0x00: return vec3(0.,0.5,1.);
        case I_COLD_OCEAN: return vec3(.0, .0, 1.);
        case I_WARM_OCEAN: return vec3(.2, .7, 1.);

        case 0x10: return vec3(0., 0.8, 1.);
        case I_ICY: return vec3(0.7, 0.9, 1.)*1.25;
        case I_CORAL: return vec3(.2, 1., 1.);

        case 0x20: return vec3(1.,1.,0.3) * 1.5;
        
        case 0x30: return vec3(0.4,1.,0.);
        case I_DESERT: return vec3(1., 1., .25) * 1.1;
        case I_SAVANNA: return vec3(0.8, 1., 0.);
        case I_SWAMP: return vec3(0.33, 0.52, 0.06);
        case I_TAIGA: return vec3(0.15, 0.7, 0.35);
        case I_SNOWY: return vec3(0.8, 0.9, 1.);
        case I_FOREST: return vec3(0.05, 0.7, 0.06);
        case I_FIELD: return vec3(0.4, 1., 0.);
        
        case 0x40: return vec3(.5,.5,.5);
        
        case 0x50: return vec3(1.,1.,1.);
        
        default: return vec3(1e100, 0., 1e100);
    }
}

// https://github.com/hughsk/glsl-hsv2rgb/blob/master/index.glsl
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 get_foliage(vec2 uv, int biome, float seed) {
    float v1;
    float v2;
    
    switch (biome) {
        case I_CORAL:
            v1 = fbm(uv, seed+39753., 2.0, 0.5, 0.0001, 4).x*0.5+0.5;
            v2 = fbm(uv, seed+62457., 2.5, 0.5, 0.0003, 2).x*0.5+0.6;
            vec3 coral;
            if (v1 < 0.3) {
                coral = vec3(0.22, 0.353, 0.486);
            } else if (v1 < 0.45) {
                coral = vec3(0.976, 0.443, 0.443);
            } else if (v1 < 0.55) {
                coral = vec3(0.976, 0.569, 0.573);
            } else if (v1 < 0.7) {
                coral = vec3(0.541, 0.839, 0.8);
            } else if (v1 < 1.0) {
                coral = vec3(0.698, 0.933, 0.902);
            }
            v2 = step(0.4, v2*v2*v2);
            return vec4(coral * v2, v2);
        case I_ICY:
            v1 = fbm(uv, seed+39753., 2.0, 0.5, 0.0001, 4).x*0.5+0.5;
            return (step(0.25, v1) == 0.) ? vec4(0.6, 0.8, 1., 0.666)*1.5 : vec4(0.0);
        case I_FIELD:
            v1 = fbm(uv * 11., seed + 635., 2.0, 0.5, 0.0001, 1).x*0.5+0.5;
            v2 = fbm(uv * 10., seed+363425., 1., 1., 0.0001, 4).x + 0.25;
            vec3 flower;
            if (v1 < 0.325) {
                flower = vec3(1., 0., 0.);
            } else if (v1 < 0.55) {
                flower = vec3(1., 1., 0.);
            } else if (v1 < 0.6) {
                flower = vec3(0.7, 0., 0.1);
            } else if (v1 < 0.7) {
                flower = vec3(0.2, 0.3, 0.9);
            } else if (v1 < 1.0) {
                flower = vec3(0.7, 0.5, 0.902);
            }
            v2 *= v2*v2;
            return vec4(flower, step(0.99, v2));

        default: return vec4(0.0);
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    uv *= SCALE;
    
    float seed = iTime * 0.1;

    vec3 v = terrain(uv, seed);
    int biome = get_biome(v*0.5+0.5);

    v.x *= (biome==I_DESERT) ? 0.5 : 1.;

    vec3 col = get_color(biome);
    vec4 foliage = get_foliage(uv, biome, seed + 365465.);

    col = col * ((v.x*0.5+0.50)+0.15) * step(foliage.w, 0.5);
    foliage = vec4(foliage.rgb * step(0.5, foliage.w), foliage.w);

    gl_FragColor = vec4(col + foliage.rgb, 1.);
    // gl_FragColor = vec4(, 0., 0., 1.);
}