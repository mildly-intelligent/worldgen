precision highp float;

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
    float t = fbm(uv * 0.1, seed+1., 2.0, 0.5, 0.0001, 3).x;
    float w = fbm(uv * 0.1, seed+2., 2.0, 0.5, 0.0001, 3).x;
    float ocean = fbm(uv/5., seed+3., 2., 0.5, 0.0005, 2).x;
    ocean = 0.05*ocean + 0.95*smoothstep(-0.25, 0.25, ocean);
    h = pow(sqrt(h)*0.5+0.5,3.0)*ocean;

    return vec3(h*2.0-1.0, t, w);
}

#define COLD_OCEAN mat2(-1.0, -0.4, -1.0, 1.0)

bool is_biome(vec2 tw, mat2 biome) {
    return biome[0].x <= tw.x && tw.x <= biome[0].y
        && biome[1].x <= tw.y && tw.y <= biome[1].y;
}

int get_biome(vec3 htw) {
    vec2 tw = htw.yz;
    if (htw.x < -0.01) {
        // Deep oceans
        return 0x00;
    } else if (htw.x < 0.35) {
        // Oceans
        if (is_biome(tw, COLD_OCEAN)) { return 0x00; }
        return 0x10;
    } else if (htw.x < 0.41) {
        // Shore
        return 0x20;
    } else if (htw.x < 0.8) {
        // Normal
        return 0x30;
    } else {
        // Mountainous (0x3_)
        return 0x40;
    }
    return -1;
}

vec3 get_color(int biome) {
    switch (biome) {
        case 0x00:
            return vec3(0.,0.,0.5);
            break;
        case 0x10:
            return vec3(0.,0.,1.);
        case 0x20:
            return vec3(1.,1.,0.);
            break;
        case 0x30:
            return vec3(0.,1.,0.);
            break;
        case 0x40:
            return vec3(1.,1.,1.);
            break;
    }
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    uv *= 10.;
    
    vec3 v = terrain(uv, iTime*0.1);
    int biome = get_biome(v*0.5+0.5);

    vec3 col = get_color(biome);

    gl_FragColor = vec4(col * (v.x*0.5+0.5), 1.);
}