<script>
  import * as PIXI from 'pixi.js'
  import { tx, unauthenticate } from '@onflow/fcl';
  import { insertCoin } from '../../../flow_blockchain/mainnet/transactions'
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
  export let havingResource
  export let gameUser
  export let currentSituation
  export let flowBalance

  const margin = 16
  const barHeight = 16
  const intialBarWidth = screenWidth * 0.5 - 3 * margin
  const maxHealth = 25
  let health = maxHealth - damage
  let barWidth = (health / maxHealth) * intialBarWidth
  let dead = false
  let remainTime = 60
  let countdown = 3
  let timerCtrl1
  let timerCtrl2
  let btnClicked = false
  let coinInserted = false
  let freePlayStarted = false
  let modal
  let freePlayModal
  let notificationModal
  let notificationMessage
  let prizeSnatched = false
  let prizeSnatchedGamerId = ''

  client
    .graphql({ query: subscriptions.onCreateGameServerProcess })
    .subscribe({
      next: ({ data }) => {
        console.log(data.onCreateGameServerProcess)
        if (data.onCreateGameServerProcess?.type == 'shooting_game_outcome') {
          const res = data.onCreateGameServerProcess?.message.split(' , txId: ')
          const outcome = res[0]
          const txId = res[1]
          if (outcome == 'false') {
            notificationMessage = `Prize money rises! ₣ ${parseInt(currentSituation?.currentPrize) + 1} ==> ${parseInt(currentSituation?.currentPrize) + 1 + 1}`
            notificationModal.showModal()
            tx(txId).subscribe((res) => {
              if (!res.errorMessage && res.statusString == 'SEALED') {
                notificationModal.close()
              }
            });
          } else if (outcome == 'true') {
            // 賞金をGetした人がいる
            if (parseInt(data.onCreateGameServerProcess?.playerId) == parseInt(havingResource?.gamerId)) {
              // 自分が賞金を取った場合
              if (parseInt(currentSituation?.currentPrize) + 1 >= 2) {
                notificationMessage = `Jackpot!! Your prize has been transferred. Let’s check your wallet!`
              } else {
                notificationMessage = `Your prize has been transferred. Let’s check your wallet!`
              }
              notificationModal.showModal()
              tx(txId).subscribe((res) => {
                if (!res.errorMessage && res.statusString == 'SEALED') {
                  notificationModal.close()
                }
              });
            } else {
              prizeSnatchedGamerId = data.onCreateGameServerProcess?.playerId
              // 誰か他の人が賞金を取った場合
              if (started) {
                // ゲーム中
                prizeSnatched = true
              } else {
                // 邪魔にならないのでダイアログで出す。
                notificationMessage = `Oops, it looks like Gamer id: ${prizeSnatchedGamerId} snatched the prize money.`
                notificationModal.showModal()
                tx(txId).subscribe((res) => {
                  if (!res.errorMessage && res.statusString == 'SEALED') {
                    notificationModal.close()
                  }
                });
              }
            }
          }
        } else if (data.onCreateGameServerProcess?.type == 'free_play') {
          const res = data.onCreateGameServerProcess?.message.split(' , txId: ')
          const txId = res[1]
          tx(txId).subscribe((res) => {
            if (!res.errorMessage && res.statusString == 'SEALED') {
              // Transaction is sealed. Start the game.
              gameReset = false
              freePlayStarted = true
              timerCtrl1 = setInterval(() => countdown--, 1500)
              setTimeout(gameStart, 5500)
            } else if (res.errorMessage) {
              notificationMessage = "Sorry transaction failed. Did you free played second times already?"
              notificationModal.showModal()
            }
          });
        }
      }
    }
  );

  setInterval(() => {
    // 1時間経過でログアウト
    const time = localStorage.getItem("time");
    if (!started && time && parseInt(time) + (60 * 60 * 1000) < (new Date()).getTime()) {
      unauthenticate()
    }
  }, 60000)

  function gameStart() {
    clearInterval(timerCtrl1)
    started = true
    timerCtrl2 = setInterval(() => remainTime--, 1000)
  }

  async function startBtnClicked() {
    if (!btnClicked) {
      if (flowBalance > 0.001) {
        dead = false
        countdown = 3
        remainTime = 60
        gameReset = true
        btnClicked = true
        damage = 0
        prizeSnatched = false

        modal.showModal()
        let txId = await insertCoin()
        tx(txId).subscribe((res) => {
          console.log('tx status:', res);
          if (!res.errorMessage && res.statusString == 'SEALED') {
            // Transaction is sealed. Start the game.
            gameReset = false
            coinInserted = true
            timerCtrl1 = setInterval(() => countdown--, 1500)
            setTimeout(gameStart, 5500)
          } else if (res.errorMessage) {
            notificationMessage = "Sorry transaction failed. But Don't worry, your money is not decreased. It's safe blockchain system."
            notificationModal.showModal()
          }
        });
      } else if (currentSituation && (!currentSituation.freePlayCount[havingResource?.gamerId] || currentSituation.freePlayCount[havingResource?.gamerId] < 3)) {
        freePlayModal.showModal()
      }
    }
  }

  async function onGameLose() {
    clearInterval(timerCtrl2)
    started = false
    btnClicked = false
    coinInserted = false
    freePlayStarted = false

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
    freePlayStarted = false

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
    text={`${countdown == 0 ? (dead ? 'Game Over' : '') : (coinInserted || freePlayStarted ? countdown : 'Please wait.. ')}`}
    style={{ fill: 'grey', fontSize: 52 }}
    anchor={0.5}
  />
  <Text
    x={dead ? screenWidth * (0.5) - margin * 0.5 : -999}
    y={screenWidth * 0.2}
    text={'Game Over'}
    style={{ fill: 'grey', fontSize: 52 }}
    anchor={0.5}
  />
  <Text
    x={started ? -999 : screenWidth * (0.5) - margin}
    y={screenWidth * 0.5 - margin}
    text={(coinInserted || freePlayStarted) && countdown > 0 ? ` ${freePlayStarted ? 'All set!' : 'Coin Inserted.'} Ready..!!` : (countdown == 0 ? (remainTime < 60 ? (dead ? '' : 'Congratulations!!'): 'GAME START!') : '')}
    style={{ fill: '#FF4081', fontSize: 34 }}
    anchor={0.5}
  />
  <Text
    x={screenWidth * 0.5 + margin * 2}
    y={screenWidth - barHeight - margin / 2}
    text={`Last ${remainTime}s`}
    style={{ fill: 'white', fontSize: 18 }}
    anchor={0.5}
  />
  <Text
    x={!prizeSnatched ? -999 : screenWidth * (0.5) - margin * 0.5}
    y={screenWidth * 0.7}
    text={`Oops, it looks like Gamer id: ${prizeSnatchedGamerId} `}
    style={{ fill: '#F88379', fontSize: 24 }}
    anchor={0.5}
  />
  <Text
    x={!prizeSnatched ? -999 : screenWidth * (0.5) - margin * 0.5}
    y={screenWidth * 0.77}
    text={'snatched the prize money.'}
    style={{ fill: '#F88379', fontSize: 24 }}
    anchor={0.5}
  />
  <Text
    x={!prizeSnatched ? -999 : screenWidth * (0.5) - margin * 0.5}
    y={screenWidth * 0.84}
    text={'Your prize money has been reset to ₣1..'}
    style={{ fill: '#F88379', fontSize: 19 }}
    anchor={0.5}
  />

  <Sprite
    width={87}
    height={30}
    x={started || remainTime == 0 ? -999 : screenWidth - margin * 3}
    y={screenWidth - margin * 1.5}
    texture={PIXI.Texture.from('/assets/coin_insert_button.png')}
    anchor={0.5}
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
<div class="game-player notification">
  <Dialog bind:dialog={notificationModal}>
    <div>{notificationMessage}</div>
  </Dialog>
</div>

<Dialog bind:dialog={freePlayModal}>
  <div>Would you like to play for free using chips?</div>
  (Your Balance: <span class="flow_balance">₣{flowBalance > 0 ? flowBalance : ''}</span>)<br>
  <button class="yes" on:click={async () => {
    dead = false
    countdown = 3
    remainTime = 60
    gameReset = true
    btnClicked = true
    damage = 0
    prizeSnatched = false

    freePlayModal.close()
    const query = {
      type: 'free_play',
      message: '',
      playerId: havingResource?.gamerId,
    };

    /* create a todo */
    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }}>Yes</button>
  <button on:click={() => {
    freePlayModal.close()
  }}>Maybe later</button>
</Dialog>

<style>
  .game-player :global(dialog) {
    margin-top: 0;
    & button {
      width: 200px;
    }
  }

  .notification :global(dialog) {
    font-weight: 700;
    font-family: 'Libre Bodoni';
    color: rgba(255, 64, 129, 0.7);
    background-color: rgba(11, 4, 35, 1);
		border-color: dodgerblue;
    border-width: 4px;
    padding: 5px 30px;
    font-size: 24px;
  }

  button.yes {
    color: white;
    background-color: dodgerblue;
  }
</style>
