# World gen
Made for Terra

A world generation shader complete with:
- Biomes
- Foliage
- Clouds
- Tides
- And more

The shader can be found on [Shadertoy](https://www.shadertoy.com/view/NXVSR1) if you want to play with it.

## Settings
Many aspects of this shader can be tweaked using the `#define` macros at the beginning of the code.
For those unfamiliar with preprocessor macros, if there is a toggle setting you want to change, simply comment or uncomment the line. For other values you can just edit the value directly (remember that all numbers must be decimals so include `.0` if you need to.)

Settings that can be tweaked:
- `SCALE <FLOAT>`: A higher value will zoom out the shader and a lower one will zoom in.
- `CONTINENTAL (toggle)`: If enabled, the terrain will be concentrated near the center of the screen forming one cohesive continent.
  - `CONTINENTNESS <FLOAT>`: How concentrated the landmass should be
- `RIVERS (toggle)`: If enabled, there will be rivers running throughout the terrain. (**Warning**: Does not work with `CONTINENTAL` enabled!)
- `OCEANS (toggle)`: If enabled, there will be large oceans to split continents as opposed to one big landmass with small lakes.
- `FOLIAGE (toggle)`: If enabled, some biomes will have extra foliage like trees and flowers.
  - `TREES (toggle)`: Puts trees in the `TAIGA`, `SNOWY`, and `FOREST` biomes.
  - `FLOWERS (toggle)`: Puts flowers in the `FIELDS` biome.
  - `CACTUSES (toggle)`: Puts cactuses in the `DESERT` biome.
  - `CORAL (toggle)`: Puts coral in the `CORAL_REEF` biome.
  - `ICE_SPIKES (toggle)`: Puts ice spikes in the `ICY` biome.
  - `SEASON <ENUM>`: Can be one of `SUMMER`, `FALL/AUTUMN`, `WINTER`, `SPRING`, or `TIMED`. If set to `TIMED`, seasons will change over time, if commented out, the season will be summer.
  - `MESA_LAYERS <LIST[INT]>`: A list of numbers corresponding to the layer colors of the `MESA` biome
- `CLOUDS (toggle)`: Enables clouds.
- `TIDE (toggle)`: Creates a tide that moves the shoreline.