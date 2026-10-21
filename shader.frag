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


vec2 fbm(vec2 x, float freq_scale, float amp_scale, float k, int octaves) {
    float a = 0.0;
    float amp = 0.5;
    vec2  d = vec2(0.0);
    mat2  m = mat2(1.0,0.0,0.0,1.0);
    for (int i=0 ; i<octaves ; i++) {
        vec3 n = noised(x);
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
    float h = fbm(uv, 2.4, 0.4, 0.0005, 8).x;
    float t = fbm(uv * 0.1, 2.0, 0.5, 0.0001, 3).x;
    float w = fbm(uv * 0.1, 2.0, 0.5, 0.0001, 3).x;

    return vec3(h, t, w);
}


void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    // uv *= 5.;
    
    vec3 v = terrain(uv);


    gl_FragColor = vec4(v.xyz, 1.);
    // gl_FragColor = vec4(v.xxx, 1.);
}