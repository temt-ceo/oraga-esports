<script>
  import * as PIXI from 'pixi.js'
  import { authenticate, currentUser, tx } from '@onflow/fcl';
  import { getBalance, isRegistered, getGamersInfo } from '../../../flow_blockchain/scripts';
  import { insertCoin } from '../../../flow_blockchain/transactions'
   import { Sprite, Graphics, Text, Ticker } from 'svelte-pixi'
  import { generateClient } from 'aws-amplify/api';
  import { createGameServerProcess } from '../../graphql/mutations';
  import * as subscriptions from '../../graphql/subscriptions';
  import Dialog from './../Dialog.svelte';

  const client = generateClient();

  export let angle = Math.PI
  export let damage = 0
  export let started
  export let screenWidth;
  export let gameReset

  let gameUser
  let havingResource
  currentUser.subscribe(async (user) => {
    gameUser = user
    if (user.addr) {
      havingResource = await isRegistered(user.addr);
    } else {
      gameUser = null
    }
  });
  setInterval(async () => {
    if (gameUser?.addr) {
      havingResource = await isRegistered(gameUser.addr);
    }
  }, 3000);

  const margin = 16
  const barHeight = 16
  const intialBarWidth = screenWidth * 0.5 - 3 * margin
  const maxHealth = 50
  let health = maxHealth - damage
  let barWidth = (health / maxHealth) * intialBarWidth
  let dead = false
  let remainTime = 60
  let countdown = 3
  let timerCtrl1
  let timerCtrl2
  let btnClicked = false
  let coinInserted = false
  let modal

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

  async function startBtnClicked() {
    if (!btnClicked) {
      dead = false
      countdown = 3
      remainTime = 60
      gameReset = true
      btnClicked = true
      damage = 0
      modal.showModal()
      let txId = await insertCoin()
      gameReset = false
      tx(txId).subscribe((res) => {
        console.log('tx status:', res);
        if (!res.errorMessage && res.statusString == 'SEALED') {
          // Transaction is sealed. Start the game.
          coinInserted = true
          timerCtrl1 = setInterval(() => countdown--, 1500)
          setTimeout(gameStart, 5500)
        }
      });
    }
  }

  async function onGameLose() {
    clearInterval(timerCtrl2)
    started = false
    btnClicked = false
    coinInserted = false

    const query = {
      type: 'shooting_game_outcome',
      message: 'false',
      playerId: havingResource?.gamerId,
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
    btnClicked = false
    coinInserted = false

    const query = {
      type: 'shooting_game_outcome',
      message: 'true',
      playerId: havingResource?.gamerId,
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
    style={{ fill: 'white', fontSize: 16 }}
    anchor={0.5}
  />
  <Text
    x={started || !btnClicked ? -999 : screenWidth * (0.5) - margin * 0.5}
    y={screenWidth * 0.2}
    text={`${countdown == 0 ? (dead ? 'Game Over' : '') : (coinInserted ? countdown : 'Please wait..')}`}
    style={{ fill: 'grey', fontSize: 48 }}
    anchor={0.5}
  />
  <Text
    x={dead ? screenWidth * (0.5) - margin * 0.5 : -999}
    y={screenWidth * 0.2}
    text={'Game Over'}
    style={{ fill: 'grey', fontSize: 48 }}
    anchor={0.5}
  />
  <Text
    x={started ? -999 : screenWidth * (0.5) - margin}
    y={screenWidth * 0.5 - margin}
    text={coinInserted && countdown > 0 ? 'Coin Inserted. Ready..!!' : (countdown == 0 ? (remainTime < 60 ? (dead ? '' : 'Congratulations!!'): 'GAME START!') : '')}
    style={{ fill: '#FF4081', fontSize: 30 }}
    anchor={0.5}
  />
  <Text
    x={screenWidth * 0.5 + margin * 2}
    y={screenWidth - barHeight - margin / 2}
    text={`Last ${remainTime}s`}
    style={{ fill: 'white', fontSize: 18 }}
    anchor={0.5}
  />
  <Sprite
    width={87}
    height={30}
    x={started || remainTime == 0 ? -999 : screenWidth - margin * 3}
    y={screenWidth - margin * 1.5}
    texture={PIXI.Texture.from('/assets/coin_insert_button.png')}
    anchor={0.5}
    rotation={angle - Math.PI}
    eventMode={'static'}
    on:click={startBtnClicked}
  />
</Ticker>

{#if gameUser && havingResource}
<div class="game-player">
  <Dialog bind:dialog={modal}>
    <div>You need to accept the transaction on the wallet. Game fee is only ₣1.1!</div>
    <button on:click={() => modal.close()}>Please click here first.</button>
  </Dialog>
</div>
{:else if !gameUser}
  <div class="game-player">
    <Dialog bind:dialog={modal}>
      <div>You need a crypto wallet.<br>Please sign in the wallet.</div>
      <button on:click={() => modal.close()}>Please click here first.</button>
    </Dialog>
  </div>
{:else if !havingResource}
  <div class="game-player">
    <Dialog bind:dialog={modal}>
      <div>You are still not registered as a game player on the blockchain.<br>Please reload the browser screen.</div>
    </Dialog>
  </div>
{/if}

<style>
  .game-player :global(dialog) {
    margin-top: 0;
    & button {
      width: 200px;
    }
  }
</style>
