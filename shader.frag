precision highp float;

#define OCTAVES 8

bool aprox(float a, float b, float epsilon) {
    return (a < b+epsilon) && (a > b-epsilon);
}


// {{{ Perlin noise functions
vec4 permute(vec4 x) {
    return mod(((x*34.0)+10.0)*x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}
float noise(vec3 P) {
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + 1.0; // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));

    float n000 = norm0.x * dot(g000, Pf0);
    float n010 = norm0.y * dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n100 = norm0.z * dot(g100, vec3(Pf1.x, Pf0.yz));
    float n110 = norm0.w * dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = norm1.x * dot(g001, vec3(Pf0.xy, Pf1.z));
    float n011 = norm1.y * dot(g011, vec3(Pf0.x, Pf1.yz));
    float n101 = norm1.z * dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n111 = norm1.w * dot(g111, Pf1);

    vec3 fade_xyz = Pf0*Pf0*Pf0*(Pf0*(Pf0*6.0-15.0)+10.0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    // return n_xyz * 2.95;
    return n_xyz + 0.5;
}
/// }}}

// fractal brownian motion
float fbm(vec2 p, float seed, int octaves) {
    vec3 P = vec3(p, seed);
    float amplitude = 0.5;
    float magnitude = 1.0;
    float n = 0.0;
    for (int i = 0 ; i < octaves ; i++) {
        n += amplitude * noise(magnitude * P);
        amplitude *= 0.5;
        magnitude *= 2.0;
    }

    // OPTIMIZE
    return n / (1. - pow(2., -float(octaves)));
}

float mountains(vec2 p, float seed) {
    float v = fbm(p,seed, 5);
    float d = pow(1. - abs(2. * v - 1.), 5.);

    float v2 = fbm(p*6., seed*106., 3);
    float mountainous = pow(v2, 3.);

    return pow(d,5.) * mountainous;
}

vec3 terrain(vec2 uv, float seed) {
    // Height of the pixel
    float h = fbm(uv, seed+7532., 8);
    h += 3.0 * mountains(uv, seed+353.);

    // Temperature of the pixel
    float t = fbm(uv*0.125, seed+3400., 2);
    // Humidity of the pixel
    float w = fbm(uv*0.125, seed+54., 2);

    return vec3(h, t, w);
}

#define COLD_OCEAN mat2x3(0.0,0.0,0.0, 0.1,1.0,1.0)

bool is_biome(vec3 terrain, mat2x3 biome) {
    return biome[0].x < terrain.x && terrain.x < biome[1].x
        && biome[0].y < terrain.y && terrain.y < biome[1].y
        && biome[0].z < terrain.z && terrain.z < biome[1].z;
}

int get_biome(vec3 terrain) {
    bool match = is_biome(terrain, COLD_OCEAN);
    return match? 1 : 0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    uv *= 5.;

    vec3 terrain = terrain(uv, iTime);
    terrain.x *= fbm(uv, iTime+76435.0, 1);

    // gl_FragColor = is_biome(terrain, COLD_OCEAN) ? vec4(1.) : vec4(0.);

    gl_FragColor = vec4(terrain.x, 0., 0., 1.);
}