precision highp float;

/* #region Settings */
#define SCALE 10.
/* Scale of biomes */
#define BIOME_SCALE 0.03
/* Make there be more land in the center of the screen */
// #define CONTINENTAL
  /* Higher values will make the land more concentrated in the center */
  #define CONTINENTNESS 1.25
/* Creates rivers (Warning: Looks wrong with CONTINENTAL enabled)*/
// #define RIVERS
/* Breaks up the land with large oceans */
#define OCEANS
/* Weather to have trees, coral, etc. */
#define FOLIAGE
    #define TREES
    #define FLOWERS
    #define CACTUSES
    #define CORAL
    #define ICE_SPIKES
    /* Either SUMMER, FALL/AUTUMN, WINTER, SPRING, TIMED (changes over time) */
    #define SEASON FALL
    #define MESA_LAYERS int[11](1,5,2,6,5,0,2,7,4,6,7)
/* Cloud intensity, comment to disable clouds */
#define CLOUDS 1.
/* Causes the shoreline to recede occasionally */
#define TIDE

// Warning: a high seed value will cause the clouds to jitter
#define SEED 47578.001
/* #endregion */

/* #region Macro Values */
// Color credit to: https://colorswall.com/palette/149776
#define WHITE_TERRACOTTA vec3(0.82, 0.69, 0.63)
#define ORANGE_TERRACOTTA vec3(0.62, 0.32, 0.14)
#define YELLOW_TERRACOTTA vec3(0.72, 0.51, 0.13)
#define GRAY_TERRACOTTA vec3(0.23, 0.17, 0.14)
#define LIGHT_GRAY_TERRACOTTA vec3(0.53, 0.42, 0.38)
#define BROWN_TERRACOTTA vec3(0.31, 0.21, 0.14)
#define RED_TERRACOTTA vec3(0.55, 0.23, 0.18)
#define BLACK_TERRACOTTA vec3(0.15, 0.09, 0.06)

#define SUMMER 1
#define AUTUMN 2
#define FALL AUTUMN
#define WINTER 3
#define SPRING 4
#define TIMED  0
#ifndef SEASON
  #define SEASON SUMMER
#endif
/* #endregion */

// Maps a number from one range to another
float map(float x, float a1, float a2, float b1, float b2) {
    return (x-a1)/(a2-a1)*(b2-b1)+b1;
}

// https://thebookofshaders.com/10/
float random(vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

/* #region Noise */
// This code is not mine (I'm not smart enough for allat),
// I don't quite remember where I got it from but I'm about 90% sure it was
// from here:
// https://github.com/hughsk/glsl-noise/blob/master/simplex/2d.glsl
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float noise(vec2 v) {
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
/* #endregion */

/* #region Fractal Brownian Motion */
// This code is about 50% mine but comes from Inigo Quilez here:
// https://www.shadertoy.com/view/4ttSWf > Buffer A > Lines 196-199 + 280-925
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
        vec3 n = noised(x + mod289(vec2(seed)));
        a += amp*n.x;          // accumulate values		
        a *= 1.0 / (1.0 - k * length(d));
        d += amp*m*n.yz;       // accumulate derivatives
        amp *= amp_scale;
        x = freq_scale*m2*x;
        m = freq_scale*m2i*m;
    }

	return vec2(a, length(d)*0.01);
}
vec2 fbm(vec2 x, float seed, int octaves) {
    return fbm(x, seed, 1.98, 0.47, 0.0005, octaves);
}
/* #endregion */

// Generates terrain height, temperature, and humidity packed into a vec3
vec3 terrain(vec2 uv, float seed) {
    float h = fbm(uv, seed, 2.4, 0.4, 0.0005, 8).x*0.5+0.5;
    h = pow(sqrt(h)*0.5+0.5,3.0);
    #ifdef CONTINENTAL
        h *= 1.0-length(uv*CONTINENTNESS/SCALE);
    #endif
    float t = fbm(uv * BIOME_SCALE, seed+10., 4).x;
    float w = fbm(uv * BIOME_SCALE, seed+20., 4).x;
    #ifdef OCEANS
        float ocean = fbm(uv/5., seed+30., 2).x;
        ocean = 0.05*ocean + 0.95*smoothstep(-0.25, 0.25, ocean);
        h *= ocean;
    #endif
    #ifdef RIVERS
        float rivers = fbm(uv*0.4, seed+40., 4).x*0.5+0.5;
        rivers = smoothstep(0.85, 1.0, 1. - abs(2. * rivers - 1.))*0.35;
        #ifdef OCEANS
            rivers *= ocean;
        #endif
        h -= rivers;
    #endif
    

    return vec3(h*2.0-1.0, t, w);
}

/* #region Biome definitions */
#define B_COLD_OCEAN vec4(.0, .4, .0, 1.)
#define I_COLD_OCEAN 0x01
#define B_WARM_OCEAN vec4(.7, 1., .0, 1.)
#define I_WARM_OCEAN 0x02

#define B_ICY vec4(.0, .3, .0, 1.)
#define I_ICY 0x11
#define B_CORAL_REEF vec4(.7, 1., .0, 1.)
#define I_CORAL_REEF 0x12

#define B_DESERT vec4(.6, .8, .0, .4)
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
#define B_MESA vec4(.55, .6, .0, .4)
#define I_MESA 0x38

#define BIOME(B, I) if (is_biome(tw, B)) { return I; }
/* #endregion */

// Checks if a temperature and humidity value correspond to a biome
bool is_biome(vec2 tw, vec4 biome) {
    return biome.x <= tw.x && tw.x <= biome.y
        && biome.z <= tw.y && tw.y <= biome.w;
}

// Gets the biome based off of the height, temperature, and humidity
int get_biome(vec3 htw) {
    vec2 tw = htw.yz;
    #ifdef TIDE
        float shoreline = map(sin(iTime), -1.0,1.0, 0.3,0.36);
    #else
        float shoreline = 0.35;
    #endif
    if (htw.x < 0.125) {
        // Oceans
        BIOME(B_COLD_OCEAN, I_COLD_OCEAN);
        BIOME(B_WARM_OCEAN, I_WARM_OCEAN);
        return 0x00;
    } else if (htw.x < shoreline) {
        // Shallow
        BIOME(B_ICY, I_ICY);
        BIOME(B_CORAL_REEF, I_CORAL_REEF);
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
        BIOME(B_MESA, I_MESA);
        return 0x30;
    } else if (htw.x < 0.9) {
        // Mountainous
        // Mesa's can be in mountains too
        BIOME(B_MESA, I_MESA);
        return 0x40;
    } else {
        // Snowcap
        BIOME(B_MESA, I_MESA);
        return 0x50;
    }
    return -1;
}

// Gets the color a biome should be
vec3 get_color(int biome) {
    switch (biome) {
        case 0x00: return vec3(0.,0.5,1.);
        case I_COLD_OCEAN: return vec3(.0, .0, 1.);
        case I_WARM_OCEAN: return vec3(.2, .7, 1.);

        case 0x10: return vec3(0., 0.8, 1.);
        case I_ICY: return vec3(0.7, 0.9, 1.)*1.25;
        case I_CORAL_REEF: return vec3(.2, 1., 1.);

        case 0x20: return vec3(1.,1.,0.3) * 1.5;
        
        case 0x30: return vec3(0.4,1.,0.);
        case I_DESERT: return vec3(1., 1., .3) * 1.2;
        case I_SAVANNA: return vec3(0.8, 1., 0.);
        case I_SWAMP: return vec3(0.33, 0.52, 0.06);
        case I_TAIGA: return vec3(0.15, 0.7, 0.35);
        case I_SNOWY: return vec3(0.8, 0.9, 1.) * 1.35;
        case I_FOREST: return vec3(0.05, 0.7, 0.06);
        case I_FIELD: return vec3(0.4, 1., 0.);
        case I_MESA: return ORANGE_TERRACOTTA;
        
        case 0x40: return vec3(.5,.5,.5);
        
        case 0x50: return vec3(1.,1.,1.);
        
        // Magenta if biome is missing
        default: return vec3(1., 0., 1.);
    }
}

// Returns a tree color based off season
vec4 get_trees(float v2, int season) {
    if (season == TIMED) {
        season = int(iTime * 0.1) % 4 + 1;
    }
    switch (season) {
        case SUMMER:
            return vec4(0.3, 0.85, 0.0, 1.);
        case AUTUMN:
            return vec4(1.0, floor(v2*4.)*0.25, 0.0, 1.);
        case WINTER:
            return vec4(0.7, 0.75, 0.85, 1.);
        case SPRING:
            return vec4(0.4, 0.7, 0.0, 1.);
    }
}

vec3 get_coral(float v1) {
    if (v1 < 0.3) {
        return vec3(0.22, 0.353, 0.486);
    } else if (v1 < 0.45) {
        return vec3(0.976, 0.443, 0.443);
    } else if (v1 < 0.55) {
        return vec3(0.976, 0.569, 0.573);
    } else if (v1 < 0.7) {
        return vec3(0.541, 0.839, 0.8);
    } else if (v1 < 1.0) {
        return vec3(0.698, 0.933, 0.902);
    }
}
vec3 get_flowers(float v1) {
    if (v1 < 0.325) {
        return vec3(1., 0., 0.);
    } else if (v1 < 0.55) {
        return vec3(1., 1., 0.);
    } else if (v1 < 0.6) {
        return vec3(0.7, 0., 0.1);
    } else if (v1 < 0.7) {
        return vec3(0.2, 0.3, 0.9);
    } else if (v1 < 1.0) {
        return vec3(0.7, 0.5, 0.902);
    }
}
vec3 get_striation(int i) {
    switch (i) {
        case 0: return WHITE_TERRACOTTA;
        case 1: return ORANGE_TERRACOTTA;
        case 2: return YELLOW_TERRACOTTA;
        case 3: return GRAY_TERRACOTTA;
        case 4: return LIGHT_GRAY_TERRACOTTA;
        case 5: return BROWN_TERRACOTTA;
        case 6: return RED_TERRACOTTA;
        case 7: return BLACK_TERRACOTTA;
    }
}
vec3 get_mesa_striations(float h, float seed) {
    // h can be 0.0 - 0.35
    if      (h < .025)  { return get_striation(MESA_LAYERS[0]); }
    else if (h < .05)   { return get_striation(MESA_LAYERS[1]); }
    else if (h < .1)    { return get_striation(MESA_LAYERS[2]); }
    else if (h < .15)   { return get_striation(MESA_LAYERS[3]); }
    else if (h < .2)    { return get_striation(MESA_LAYERS[4]); }
    else if (h < .225)  { return get_striation(MESA_LAYERS[5]); }
    else if (h < .25)   { return get_striation(MESA_LAYERS[6]); }
    else if (h < .3)    { return get_striation(MESA_LAYERS[7]); }
    else if (h < .335)  { return get_striation(MESA_LAYERS[8]); }
    else if (h < .349)  { return get_striation(MESA_LAYERS[9]); }
    else                { return get_striation(MESA_LAYERS[10]); }
}
// Gets biome specific foliage, the w value tells if foliage should be drawn
vec4 get_foliage(vec2 uv, float h, int biome, float seed) {
    float v1;
    float v2;
    
    switch (biome) {
      #ifdef CORAL
        case I_CORAL_REEF:
            // Corals
            v1 = fbm(uv, seed, 2.0, 0.5, 0.0001, 4).x*0.5+0.5;
            v2 = fbm(uv, seed+10., 2.5, 0.5, 0.0003, 2).x*0.5+0.6;
            v2 = step(0.4, v2*v2*v2);
            return vec4(get_coral(v1) * v2, v2);
      #endif
      #ifdef ICE_SPIKES
        case I_ICY:
            // Ice spikes
            v1 = fbm(uv, seed+20., 2.0, 0.5, 0.0001, 4).x*0.5+0.5;
            return (step(0.25, v1) == 0.) ? vec4(0.6, 0.8, 1., 0.666)*1.5 : vec4(0.0);
        case I_FIELD:
            // Flowers
            v1 = fbm(uv * 11., seed+30., 2.0, 0.5, 0.0001, 1).x*0.5+0.5;
            v2 = fbm(uv * 10., seed+40., 1., 1., 0.0001, 4).x + 0.25;
            v2 *= v2*v2;
            return vec4(get_flowers(v1), step(0.99, v2));
      #endif
      #ifdef TREES
        case I_TAIGA: case I_SNOWY:
            // Evergreen trees
            v1 = fbm(uv * 3., seed+50., 2.0, 0.5, 0.0001, 3).x*0.5+0.45;
            return (step(0.6, v1)==1.) ? vec4(0.0, 0.45, 0.1, 1.0) : vec4(0.0);
        case I_FOREST:
            v1 = fbm(uv * 3., seed+60., 2.0, 0.5, 0.0001, 3).x*0.5+0.45;
            v2 = fbm(uv * 5., seed+70., 2.0, 0.5, 0.001, 3).x*0.5+0.5;
            return (step(0.45, v1)==1.) ? get_trees(v2, SEASON) : vec4(0.0);
      #endif
      #ifdef CACTUSES
        case I_DESERT:
            // Cactuses
            v1 = fbm(uv * 3., seed+80., 2.0, 0.5, 0.0001, 4).x*0.5+0.35;
            return (step(0.6, v1)==1.) ? vec4(0.0, 0.45, 0.1, 1.0) : vec4(0.0);
      #endif
        case I_MESA:
            return vec4(get_mesa_striations(h, seed+90.), 1.);

        default: return vec4(0.0);
    }
}

float get_clouds(vec2 uv, float seed) {
    float h = fbm(uv*0.3, seed+iTime*0.25, 2.5, 0.4, 0.0005, 6).x*0.5+0.5;
    h *= h*0.7;
    return h;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    uv *= SCALE;
    uv += vec2(-4.5, -2.5);

    vec3 v = terrain(uv, SEED);
    int biome = get_biome(v*0.5+0.5);

    // Desert has less intense heights
    v.x *= (biome == I_DESERT) ? 0.5 : 1.;
    // Make mesa plateaus
    if (biome == I_MESA) {
        v.x = clamp(v.x, 0.0, 0.35);
    }

    vec3 col = get_color(biome) * ((v.x*0.5+0.50)+0.15);

    #ifdef FOLIAGE
        vec4 foliage = get_foliage(uv, v.x, biome, SEED+100.);
        foliage.w = step(0.5, foliage.w);
        col *= 1. - foliage.w;
        col += foliage.rgb * foliage.w;
    #endif

    #ifdef CLOUDS
        float cloud = get_clouds(uv, SEED+200.);
        col = mix(col, vec3(1.), cloud);
    #endif

    gl_FragColor = vec4(col, 1.);
}