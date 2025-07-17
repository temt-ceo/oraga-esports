<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './stats/Field.svelte'
  import { authenticate, unauthenticate, currentUser } from '@onflow/fcl';
  import { getBalance, isRegistered } from '../../flow_blockchain/mainnet/scripts';
  import Dialog from './Dialog.svelte';

  export let currentSituation;

  let app

  let flowBalance;
  let notificationModal;
  let notificationMessage;
  let gameUser;
  let havingResource;
  let gamerIDs = []
  let prizeWinners = []

  currentUser.subscribe(async (user) => {
    gameUser = user
    if (user.addr) {
      flowBalance = await getBalance(user.addr);
      havingResource = await isRegistered(user.addr);
    }
  });

  setInterval(async () => {
    if (gameUser?.addr) {
      flowBalance = await getBalance(gameUser.addr);
      havingResource = await isRegistered(gameUser.addr);
    }
    gamerIDs = Object.keys(currentSituation?.prizeWinners || {})
    prizeWinners = []
    for (let key of gamerIDs) {
      const gamerInfo = currentSituation?.prizeWinners[key]
      prizeWinners.push({
        id: key,
        name: gamerInfo?.gamerName,
        prizeTotal: gamerInfo?.prize,
        winCount: gamerInfo?.totalCount,
      });
      prizeWinners.sort((f, s) => (s.prizeTotal + s.winCount) - (f.prizeTotal + f.winCount))
    }
  }, 1500);

  onMount(() => { 
    app.renderer.render(app.stage)
  })
</script>

<div class="game-screen">
  <div class="paragraph sticky">
    <h1 class="stats-title">Welcomt to the<br>Stats Screen</h1>
    <span class="allura">Hello,
      {#if havingResource?.nickname}
        {havingResource?.nickname}.<br>
      {/if}
    </span>You can train your game skill<br>and check the stats of this game here.
    {#if screen.width >= 1024}
      <br>
    {/if}
    {#if screen.width >= 1024}
    <p class="caution">
      <span class="cinzel">Caution! </span><br>Since it is easy to operate on a tablet,<br>the operation on a PC screen is in <span class="strong">HARD mode</span>.
      <br>
      <br>
      Please play with your smart phone.
      <br>
      <img src="/assets/qrcode.png" alt="$qrcode" />
      <br>
      Scan the QR code<br>with your camera app.
    </p>
    {/if}
  </div>
  <div class="right-pane">
    <p class="current_stats">
      ・ Current Prize: <img src="/assets/flow_fire.png" alt="$FLOW" />
      <span class="prize">{!currentSituation?.currentPrize ? '-' : parseInt(currentSituation?.currentPrize) + 1}</span>
      <span class="unit">($FLOW)</span>
    </p>
    <p class="current_stats">
      ・ Tip Jar amount: <span class="prize">₣{currentSituation?.tipJarBalance ? parseInt(currentSituation?.tipJarBalance) : '-'}</span>
      <span class="unit">($FLOW)</span>
    </p>
    <p class="current_stats">
      ・ Prize Winners: <br>
      {#each prizeWinners as gamer, i}
        <div class="gamer_info">
          ID{gamer.id} {gamer.name} -> <span class="prize">₣{parseInt(gamer.prizeTotal) + parseInt(gamer.winCount)}</span>
           ({gamer.winCount})
        </div>
      {/each}
    </p>
  </div>

  <div class="main-screen">
    <Application
      width={screen.width > 512 ? 512 : screen.width * 0.96}
      height={screen.width > 512 ? 512 : screen.width * 0.96}
      backgroundColor="0x5c812f"
      bind:instance={app}
      antialias>
      <Field
        screenWidth={screen.width > 512 ? 512 : screen.width * 0.96}
        havingResource={havingResource}
        gameUser={gameUser}
        currentSituation={currentSituation}
        flowBalance={flowBalance}
      />
    </Application>

    <div>
      <p class="allura">
        Your Balance: <img src="/assets/flow_fire.png" alt="$FLOW" /><span class="flow_balance">{flowBalance > 0 ? (Math.trunc(flowBalance * 1000) / 1000) : '--'}</span>
      </p>

      <p class="cinzel">
        <a href="/">Back to Home</a>
        <span> | Are you ready? If so,</span>
        <a class="aim_prize" href="/shooting">Get Prize!!</a><span></span>
      </p>
      <p class="cinzel">
        Character design by <a href="https://uzi-material.com/">Uzi</a>
      </p>
      {#if gameUser?.addr}
        <a on:click={unauthenticate} href="">Sign Out</a>
      {:else}
        <button on:click={authenticate}>Sign In</button>
      {/if}
    </div>
  </div>
</div>

<div class="notification">
  <Dialog bind:dialog={notificationModal}>
    <div>{notificationMessage}</div>
  </Dialog>
</div>

<style>

  h1 {
    text-align: center;
    margin: 0;
    margin-right: 4vw;
    padding: 10px 0;
    color: #32de84;
  }

 .game-screen {
    height: 95%;
    margin-bottom: 5px;
    overflow-y: scroll;
    color: white;
  }

  .current_stats {
    font-size: 18px;
    margin: 8px 5px;
    font-family: 'Libre Bodoni';
    & img {
      width: 20px;
      vertical-align: sub;
    }
  }

  .prize {
    color: rgba(255, 64, 129, 0.7);
    font-size: 20px;
  }

  .unit {
    color: rgba(255, 64, 129, 0.7);
    font-size: 18px;
  }

  .caution {
    margin: 15px 20px;
    padding: 2px;
		border-color: dodgerblue;
    border-radius: 8px;
    color: rgba(255, 64, 129, 0.7);
    font-size: 16px;
    & > .strong {
      font-size: 24px;
    }
    & > img {
      padding: 5px 25px;
      width: 100px !important;
    }
  }

  .cinzel {
    font-size: 20px;
    font-family: 'Cinzel';
  }

  .allura {
    margin-left: 15px;
    font-family: 'Allura';
    font-size: 35px;

    & img {
      width: 30px;
      vertical-align: sub;
    }
  }

  .right-pane {
    margin-right: 5px;
  }

  .paragraph {
    margin-top: 4px;
    padding-left: 5px;

    & > .allura {
      font-size: 21px;
    }
  }

  .sticky {
    max-width: 400px;
    position: sticky;
    padding-bottom: 3px;
    padding-left: 3vw;
    top: 0;
    background: rgba(11, 4, 35, 1);

    & img {
      width: 13px;
    }
  }

  .notification :global(dialog) {
    margin-top: 0;
    font-size: 36px;
    font-weight: 700;
    font-family: 'Libre Bodoni';
    color: rgba(255, 64, 129, 0.7);
    background-color: rgba(11, 4, 35, 1);
		border-color: dodgerblue;
    border-width: 4px;
    padding: 5px 30px;
    font-size: 24px;
  }

  a.aim_prize,
  a.aim_prize:link,
  a.aim_prize:visited,
  a.aim_prize:hover,
  a.aim_prize:active {
    color: rgba(255, 255, 5, 0.7)
  }

  .gamer_info {
    margin-left: 17px;
    margin-top: 4px;
    font-size: 16px;
  }

  @media screen and (min-width: 700px) {
    .game-screen {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .main-screen {
      max-width: 520px;
      margin-top: 200px;
    }
  }

</style>
