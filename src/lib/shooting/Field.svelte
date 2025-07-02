<script>
  import * as PIXI from 'pixi.js'
  import { Mesh, Sprite, track } from 'svelte-pixi'
  import Contents from './Contents.svelte'

  export let screenWidth;
  export let havingResource;
  export let gameUser;
  export let currentSituation;
  export let flowBalance;

  const uniforms = {
    uSampler2: PIXI.Texture.from('/assets/bg_mesh.jpg'),
    time: 0,
  }

  const geometry = new PIXI.Geometry()
    .addAttribute(
      'aVertexPosition',
      [-100, -100, 100, -100, 100, 100, -100, 100, ], // x, y
      2,
    )
    .addAttribute(
      'aUvs',
      [0, 0, 1, 0, 1, 1, 0, 1, ], // u, v
      2,
    )
    .addIndex([0, 1, 2, 0, 2, 3])

  const vertexSrc = `
    precision mediump float;
    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;
    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;
    varying vec2 vUvs;
    void main() {
        vUvs = aUvs;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }`

  const fragmentSrc = `
    precision mediump float;
    varying vec2 vUvs;
    uniform sampler2D uSampler2;
    uniform float time;
    void main() {
        gl_FragColor = texture2D(uSampler2, vUvs + sin( (time + (vUvs.x) * 14.) ) * 0.1 );
    }`

  const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms)

  let offset = { x: 0, y: 0 }
  let mouseX = track(() => offset.x, 0)
  let mouseY = track(() => offset.y, 0)

  function handleClick(event) {
    const { x, y } = event.detail.data.global

    offset = {
      x: x + Math.random() * 0.01, // 同じ位置をクリックした場合の対処
      y: y + Math.random() * 0.01,
    }
  }
</script>

<Mesh
  x={screenWidth / 2}
  y={screenWidth / 2}
  scale={3.5}
  {geometry}
  {shader}
  eventMode={'dynamic'}
  on:click={handleClick}
/>
<Sprite
  width={209}
  height={40}
  x={-10}
  y={-5}
  texture={PIXI.Texture.from('/assets/oraga_logo.png')}
  />

<Contents
  mouseX={$mouseX}
  mouseY={$mouseY}
  screenWidth={screenWidth}
  havingResource={havingResource}
  gameUser={gameUser}
  currentSituation={currentSituation}
  flowBalance={flowBalance}
/>