<script>
  import * as PIXI from 'pixi.js'
  import Victor from 'victor'
  import { Sprite, Ticker, getApp } from 'svelte-pixi'

  export let distance = 0
  export let damage = 0
  export let enemySpeed = 2.0
  export let position
  export let started

  //=========
  let { app } = getApp()

  const enemyRadius = 48;
  const playerRadius = 48 * 1.2
  let frame = 0

  function randomSpawnPoint() {
    let spawnPoint = new Victor(0, 0);
    let edge = Math.floor(Math.random() * 4); // random int between 0 and 3.
    let random = Math.random()
    switch (edge) {
      case 0: // top
        spawnPoint.x = app?.screen.width * random + (random < 0.5 ? -1 : 1) * distance * enemyRadius * random
        spawnPoint.y = -1 * distance * enemyRadius
        break;
      case 1: // right
        spawnPoint.x = app?.screen.width + distance * enemyRadius
        spawnPoint.y = app?.screen.height * random + (random < 0.5 ? -1 : 1) * distance * enemyRadius * random
        break;
      case 2: // bottom
        spawnPoint.x = app?.screen.width * random + (random < 0.5 ? -1 : 1) * distance * enemyRadius * random
        spawnPoint.y = app?.screen.height + distance * enemyRadius
        break;
      default: // left
        spawnPoint.x = -1 * distance * enemyRadius
        spawnPoint.y = app?.screen.height * random + (random < 0.5 ? -1 : 1) * distance * enemyRadius * random
        break;
    }
    return spawnPoint;
  }
  let r = randomSpawnPoint();
  let enemyType = r.x < -1 * enemyRadius ? '1' : r.x > app?.screen.width + enemyRadius ? '2' : '3'
</script>

<Ticker
  on:tick={(ev) => {
    frame++
    if (!started) return
    if (position.x == null || position.y == null) {
      r = randomSpawnPoint()
      enemyType = r.x < app?.screen.width / 5 ? '1' : r.x > app?.screen.width * 4 / 5 ? '2' : '3'
      position.x = r.x
      position.y = r.y
      return
    }
    let e = new Victor(r.x, r.y);
    let s = new Victor(app?.screen.width / 2 - playerRadius, app?.screen.height / 2 - playerRadius);
    if (e.distance(s) < playerRadius) {
      if (frame % 5 == 0) {
        damage++
      }
    }
    let d = s.subtract(e)
    let v = d.normalize().multiplyScalar(enemySpeed - (enemyType == '1' ? 0.2 : enemyType == '3' ? 0.1 : 0))
    r.x = r.x + v.x
    r.y = r.y + v.y
    position.x = r.x
    position.y = r.y
  }}
>
  <Sprite
    width={96}
    height={96}
    x={r.x}
    y={r.y}
    texture={PIXI.Texture.from('/public/assets/shooting/zombie' + enemyType + '.png')}
  />
</Ticker>
