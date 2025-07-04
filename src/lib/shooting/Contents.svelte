<script>
  import * as PIXI from 'pixi.js'
  import { Ticker, Sprite } from 'svelte-pixi'
  import Player from './Player.svelte'
  import Zombie from './Zombie.svelte'
  import Victor from 'victor'

  export let mouseX = 0;
  export let mouseY = 0;
  export let screenWidth;
  export let havingResource;
  export let gameUser;
  export let currentSituation;
  export let flowBalance;

  //=========
  let frame = 0
  let delta = 0
  let playerRadius = 48
  let enemySpeed = 3.0;
  let damageCtr = 0
  let gameReset = false
  let gameCtr = false
  let angle = Math.atan2(
      mouseY - screenWidth / 2,
      mouseX - screenWidth / 2
    ) - Math.PI / 4
  const zombiePositions = {
    1: {x: 0, y: 0}, 2: {x: 0, y: 0}, 3: {x: 0, y: 0}, 4: {x: 0, y: 0}, 5: {x: 0, y: 0}, 6: {x: 0, y: 0}, 7: {x: 0, y: 0}, 8: {x: 0, y: 0}, 
    9: {x: 0, y: 0}, 10: {x: 0, y: 0}, 11: {x: 0, y: 0}, 12: {x: 0, y: 0}, 13: {x: 0, y: 0}, 14: {x: 0, y: 0}, 15: {x: 0, y: 0}, 16: {x: 0, y: 0},
    17: {x: 0, y: 0}, 18: {x: 0, y: 0}, 19: {x: 0, y: 0}, 20: {x: 0, y: 0}, 21: {x: 0, y: 0}, 22: {x: 0, y: 0}, 23: {x: 0, y: 0},
  }
  const enemyRadius = 48
  const bulletRadius = 15
  let bulletSpeed = 15
  let angle1 = 0
  let angle2 = 0
  let angle3 = 0
  let angle4 = 0
  let angle5 = 0
  let tappedX = null
  let tappedY = null
  let r = new Victor(screenWidth / 2 - playerRadius, screenWidth / 2 - playerRadius);
  let r2 = new Victor(screenWidth / 2 - playerRadius, screenWidth / 2 - playerRadius);
  let r3 = new Victor(screenWidth / 2 - playerRadius, screenWidth / 2 - playerRadius);
  let r4 = new Victor(screenWidth / 2 - playerRadius, screenWidth / 2 - playerRadius);
  let r5 = new Victor(screenWidth / 2 - playerRadius, screenWidth / 2 - playerRadius);
  const s = new Victor(screenWidth / 2 - playerRadius, screenWidth / 2 - playerRadius);

  function shooting(v1, v2, v3, v4, v5) {
    if (v1 != null && r.distance(s) < 370) { // ≒ √２ * screenWidth / 2
      r.x = r.x + v1.x
      r.y = r.y + v1.y
    } else {
      r.x = s.x
      r.y = s.y
      angle1 = 0
    }
    if (v2 != null && r2.distance(s) < 370) {
      r2.x = r2.x + v2.x
      r2.y = r2.y + v2.y
    } else {
      r2.x = s.x
      r2.y = s.y
      angle2 = 0
    }
    if (v3 != null && r3.distance(s) < 370) {
      r3.x = r3.x + v3.x
      r3.y = r3.y + v3.y
    } else {
      r3.x = s.x
      r3.y = s.y
      angle3 = 0
    }
    if (v4 != null && r4.distance(s) < 370) {
      r4.x = r4.x + v4.x
      r4.y = r4.y + v4.y
    } else {
      r4.x = s.x
      r4.y = s.y
      angle4 = 0
    }
    if (v5 != null && r5.distance(s) < 370) {
      r5.x = r5.x + v5.x
      r5.y = r5.y + v5.y
    } else {
      r5.x = s.x
      r5.y = s.y
      angle5 = 0
    }
  }

  function bulletHitTest() {
    for (let i = 1; i <= 23; i++) {
      let dx = zombiePositions[i].x - r.x
      let dy = zombiePositions[i].y - r.y
      let dx2 = zombiePositions[i].x - r2.x
      let dy2 = zombiePositions[i].y - r2.y
      let dx3 = zombiePositions[i].x - r3.x
      let dy3 = zombiePositions[i].y - r3.y
      let dx4 = zombiePositions[i].x - r4.x
      let dy4 = zombiePositions[i].y - r4.y
      let dx5 = zombiePositions[i].x - r5.x
      let dy5 = zombiePositions[i].y - r5.y
      let distance = Math.sqrt(dx*dx + dy*dy)
      let distance2 = Math.sqrt(dx2*dx2 + dy2*dy2)
      let distance3 = Math.sqrt(dx3*dx3 + dy3*dy3)
      let distance4 = Math.sqrt(dx4*dx4 + dy4*dy4)
      let distance5 = Math.sqrt(dx5*dx5 + dy5*dy5)
      if (
        (angle1 != 0 && distance < bulletRadius + enemyRadius) || 
        (angle2 != 0 && distance2 < bulletRadius + enemyRadius) || 
        (angle3 != 0 && distance3 < bulletRadius + enemyRadius) ||
        (angle4 != 0 && distance4 < bulletRadius + enemyRadius) || 
        (angle5 != 0 && distance5 < bulletRadius + enemyRadius)
      ) {
        zombiePositions[i].x = null
        zombiePositions[i].y = null
      }
    }
  }
</script>

<Ticker
  on:tick={(ev) => {
    delta = ev.detail
    frame++
    if (gameReset) frame = 0;
    if (!gameCtr) return

    enemySpeed = (screen.width >= 768 ? 3.0 : 2.5) + Math.floor(frame / 150) * 0.1
    if (mouseX != 0 && mouseY != 0) {
      angle = Math.atan2(
        mouseY - screenWidth / 2 + playerRadius / 2,
        mouseX - screenWidth / 2 + playerRadius / 2
      )
      if (tappedX != mouseX && tappedY != mouseY) {
        if (angle1 == 0) {
          angle1 = angle
        } else if (angle2 == 0) {
          angle2 = angle
        } else if (angle3 == 0) {
          angle3 = angle
        } else if (angle4 == 0) {
          angle4 = angle
        } else if (angle5 == 0) {
          angle5 = angle
        }
        tappedX = mouseX
        tappedY = mouseY
      }
      let v1 = angle1 ? new Victor(Math.cos(angle1), Math.sin(angle1)).multiplyScalar(bulletSpeed) : null
      let v2 = angle2 ? new Victor(Math.cos(angle2), Math.sin(angle2)).multiplyScalar(bulletSpeed) : null
      let v3 = angle3 ? new Victor(Math.cos(angle3), Math.sin(angle3)).multiplyScalar(bulletSpeed) : null
      let v4 = angle4 ? new Victor(Math.cos(angle4), Math.sin(angle4)).multiplyScalar(bulletSpeed) : null
      let v5 = angle5 ? new Victor(Math.cos(angle5), Math.sin(angle5)).multiplyScalar(bulletSpeed) : null
      shooting(v1, v2, v3, v4, v5)
    }
    bulletHitTest()
  }}
>

  <Sprite x={r.x} y={r.y} width={bulletRadius * 3.5} height={bulletRadius * 3} texture={PIXI.Texture.from('/assets/shooting/star.png')} />
  <Sprite x={r2.x} y={r2.y} width={bulletRadius * 3.5} height={bulletRadius * 3} texture={PIXI.Texture.from('/assets/shooting/star.png')} />
  <Sprite x={r3.x} y={r3.y} width={bulletRadius * 3.5} height={bulletRadius * 3} texture={PIXI.Texture.from('/assets/shooting/star.png')} />
  <Sprite x={r4.x} y={r4.y} width={bulletRadius * 3.5} height={bulletRadius * 3} texture={PIXI.Texture.from('/assets/shooting/star.png')} />
  <Sprite x={r5.x} y={r5.y} width={bulletRadius * 3.5} height={bulletRadius * 3} texture={PIXI.Texture.from('/assets/shooting/star.png')} />

  <Player
    angle={angle}
    bind:damage={damageCtr}
    bind:started={gameCtr}
    bind:gameReset={gameReset}
    screenWidth={screenWidth}
    havingResource={havingResource}
    gameUser={gameUser}
    currentSituation={currentSituation}
    flowBalance={flowBalance}
  />
  <Zombie distance={2} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[1]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={6} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[2]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={8} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[3]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={10} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[4]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={12} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[5]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={15} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[6]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={18} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[7]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={20} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[8]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={24} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[9]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={27} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[10]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={30} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[11]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={31} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[12]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={32} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[13]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={33} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[14]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={35} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[15]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={37} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[16]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={40} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[17]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={41} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[18]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={42} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[19]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={43} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[20]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={44} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[21]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={45} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[22]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />
  <Zombie distance={46} bind:damage={damageCtr} enemySpeed={enemySpeed} bind:position={zombiePositions[23]} started={gameCtr} screenWidth={screenWidth} gameReset={gameReset} />

</Ticker>
