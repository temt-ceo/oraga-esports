<script>
  import * as PIXI from 'pixi.js'
  import { Sprite, Graphics, Text, Ticker, getApp } from 'svelte-pixi'
  import { generateClient } from 'aws-amplify/api';
  import { createGameServerProcess } from '../../graphql/mutations';
  import * as subscriptions from '../../graphql/subscriptions';

  const client = generateClient();

  export let angle = Math.PI
  export let damage = 0
  export let started
  export let screenWidth;

  let { app } = getApp()
  const margin = 16
  const barHeight = 16
  const intialBarWidth = screenWidth * 0.5 - 2 * margin
  const maxHealth = 100
  let health = maxHealth - damage
  let barWidth = (health / maxHealth) * intialBarWidth
  let dead = false
  let remainTime = 60
  let countdown = 3
  let timerCtrl1
  let timerCtrl2
  let btnClicked = false

  const createSub = client
  .graphql({ query: subscriptions.onCreateGameServerProcess })
  .subscribe({
    next: ({ data }) => console.log(data),
    error: (error) => console.warn(error)
  });

  function gameStart() {
    clearInterval(timerCtrl1)
    started = true
    timerCtrl2 = setInterval(() => remainTime--, 1000)
  }

  function startBtnClicked() {
    if (!btnClicked) {
      timerCtrl1 = setInterval(() => countdown--, 1500)
      setTimeout(gameStart, 5500)
      btnClicked = true
    }
  }

  async function onGameLose() {
    clearInterval(timerCtrl2)
    started = false

    const query = {
      type: 'Test',
      message: 'Test',
      playerId: 'Test',
    };

    /* create a todo */
    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }

  async function onGameWon() {
    clearInterval(timerCtrl2)
    started = false

    const query = {
      type: 'Test',
      message: 'Test',
      playerId: 'Test',
    };

    /* create a todo */
    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }
</script>

<Ticker
  on:tick={(ev) => {
    health = maxHealth - damage
    barWidth = (health / maxHealth) * intialBarWidth
    if (started) {
      if (health <= 0) {
        onGameLose()
        dead = true
        started = false
        clearInterval(timerCtrl2)
      } else if (remainTime == 0 && timerCtrl2) {
        onGameWon()
      }
    }
  }}
>

  <Sprite
    width={96}
    height={96}
    x={screenWidth / 2 - 20}
    y={screenWidth / 2 - 16}
    texture={PIXI.Texture.from('/assets/shooting/elf.png')}
    anchor={0.5}
    rotation={angle - Math.PI}
    eventMode={'static'}
  />

  <Graphics
    x={margin}
    y={screenWidth - barHeight - margin}
    draw={(graphics) => {
      graphics.clear()
      graphics.beginFill(0xc24d2c)
      graphics.drawRect(0, 0, barWidth, barHeight)
      graphics.endFill()
    }}
  />

  <Text
    x={started ? -999 : screenWidth * (0.7)}
    y={margin}
    text={`Click the Button to Start`}
    style={{ fill: 'white', fontSize: 20 }}
    anchor={0.5}
  />
  <Text
    x={started || !btnClicked ? -999 : screenWidth * (0.5) - margin * 0.5}
    y={screenWidth * 0.2}
    text={`${countdown == 0 ? (dead ? 'Game Over' : '') : countdown}`}
    style={{ fill: 'grey', fontSize: 65 }}
    anchor={0.5}
  />
  <Text
    x={started ? -999 : screenWidth * (0.5) - margin}
    y={screenWidth * 0.5 - margin}
    text={`${countdown == 0 ? (remainTime < 60 ? (dead ? '' : 'Congratulations!!'): 'GAME START!') : ''}`}
    style={{ fill: '#FF4081', fontSize: 40 }}
    anchor={0.5}
  />
  <Text
    x={screenWidth * 0.5 + margin * 5}
    y={screenWidth - barHeight - margin}
    text={`Last ${remainTime} Sec.`}
    style={{ fill: 'white' }}
    anchor={0.5}
  />
  <Sprite
    width={87}
    height={30}
    x={started ? -999 : screenWidth - margin * 3}
    y={screenWidth - margin * 2}
    texture={PIXI.Texture.from('/assets/coin_insert_button.png')}
    anchor={0.5}
    rotation={angle - Math.PI}
    eventMode={'static'}
    on:click={startBtnClicked}
  />
</Ticker>
