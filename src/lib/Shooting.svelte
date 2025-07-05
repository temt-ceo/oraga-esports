<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './shooting/Field.svelte'
  import { config, authenticate, unauthenticate, currentUser, tx } from '@onflow/fcl';
  import { getBalance, isRegistered } from '../../flow_blockchain/mainnet/scripts';
  import { createGamer, tipping } from '../../flow_blockchain/mainnet/transactions'
  import flowJSON from '../../flow_blockchain/flow.json';
  import Dialog from './Dialog.svelte';

  export let currentSituation;

  let app

  config({
    'flow.network': 'mainnet',
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'discovery.wallet': 'https://wallet-v2.blocto.app/-/flow/authn',
    'app.detail.title': 'Oraga eSports',
    'app.detail.icon': 'https://oraga-esports.com/assets/MMO%20RPG.png',
  }).load({ flowJSON });

  let flowBalance;
  let playerName;
  let modal;
  let modal2;
  let modal3;
  let notificationModal;
  let notificationMessage;
  let gameUser;
  let havingResource;
  let tipAmount = "1.0";
  let lasttimeSignIn

  currentUser.subscribe(async (user) => {
    gameUser = user
    // 1時間経過でログアウト
    const time = localStorage.getItem("time");
    if (time && parseInt(time) + (60 * 60 * 1000) < (new Date()).getTime()) {
      unauthenticate()
    }
    localStorage.setItem("time", (new Date()).getTime().toString());
    lasttimeSignIn = (new Date()).getTime()
    if (user.addr) {
      flowBalance = await getBalance(user.addr);
      havingResource = await isRegistered(user.addr);
      if (!havingResource) {
        console.log('Not registered.')
        modal2.showModal();
      }
    } else {
      console.log('Not login.')
      modal.showModal();
    }
  });

  setInterval(async () => {
    if (gameUser?.addr) {
      flowBalance = await getBalance(gameUser.addr);
      havingResource = await isRegistered(gameUser.addr);
      // console.log('User Info', havingResource)
    }
  }, 1500);

  onMount(() => { 
    app.renderer.render(app.stage)
  })
</script>

<div class="game-screen">
  {#if havingResource}
    <div class="paragraph sticky">
      <span class="allura">Hello,</span>{havingResource?.nickname}
      {#if screen.width >= 1024}
        <br>
      {/if}
      <span class="total-prize">( Total prize won:
        ₣ <span class="cinzel balance">{currentSituation?.prizeWinners[havingResource?.gamerId]?.prize ?? 0}</span>
      )</span>
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
  {/if}
  <div class="right-pane">
    <p class="current_prize">
      Current Prize: <img src="/assets/flow_fire.png" alt="$FLOW" />
      <span class="prize">{!currentSituation?.currentPrize ? '-' : parseInt(currentSituation?.currentPrize) + 1}</span>
      <span class="unit">($FLOW)</span>
    </p>
    <p class="catch">Stay alive for one minute!</p>
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
        Your Balance: <img src="/assets/flow_fire.png" alt="$FLOW" /><span class="flow_balance">{flowBalance > 0 ? (Math.trunc(flowBalance * 1000) / 1000) : ''}</span>
      </p>

      <p class="cinzel">
        <a href="/">Back to Home</a>
      </p>

      <p class="bodoni">
        <img src="/assets/tip_jar.png" alt="$FLOW" />
        <span class="prize">₣{currentSituation?.tipJarBalance ? parseInt(currentSituation?.tipJarBalance) : '-'}</span>
        {#if parseInt(currentSituation?.tipJarBalance) > 0}
          has been donated for free play.
        {:else}
          The tip jar is currently empty.
        {/if}

        <button on:click={() => modal3.showModal()}>Tipping</button>
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

<Dialog bind:dialog={modal}>
  <div>You need a crypto wallet.<br>(You can sign out anytime)</div>
  <button on:click={() => {
    authenticate()
    modal.close()
  }}>SignIn</button>
</Dialog>

<Dialog bind:dialog={modal2}>
  <div>Please provide your name (nickname)<br>so that we can keep a record of you on the blockchain.</div>
  <br>
  <input bind:value={playerName} placeholder="Game Player" type="text" />
  <button on:click={async () => {
    modal2.close()
    const txId = await createGamer(playerName ?? 'Game Player');
    tx(txId).subscribe((res) => {
      console.log('tx status:', res);
    });
  }}>Set name</button>
  <div>
    <a on:click={unauthenticate} href="">Sign Out</a>
  </div>
</Dialog>

<Dialog bind:dialog={modal3}>
  <div>Could you put the tip in the tip jar?</div>
  <div>
    <label>
      <input type="radio" bind:group={tipAmount} value="1.0">
      ₣1.0
    </label>
    <label>
      <input type="radio" bind:group={tipAmount} value="5.0">
      ₣5.0
    </label>
  </div>
  (Your Balance: <span class="flow_balance">₣{flowBalance > 0 ? (Math.trunc(flowBalance * 10) / 10) : ''}</span>)<br>
  <button class="yes" on:click={async () => {
    modal3.close()
    const txId = await tipping(tipAmount);
    tx(txId).subscribe((res) => {
      notificationMessage = 'THANK YOU!'
      notificationModal.showModal()
    });
    setTimeout(() => notificationModal.close(), 6000)
  }}>Yes</button>
  <button on:click={() => {
    modal3.close()
  }}>Maybe later</button>
</Dialog>

<div class="notification">
  <Dialog bind:dialog={notificationModal}>
    <div>{notificationMessage}</div>
  </Dialog>
</div>

<style>
  input {
    padding: 5px;
  }

 .game-screen {
    height: 95%;
    margin-bottom: 5px;
    overflow-y: scroll;
    color: white;
  }

  .catch {
    color: white;
    font-size: 26px;
    margin: 0 0 7px 10px;
    font-weight: 700;
  }

  .current_prize {
    font-size: 27px;
    margin: 0 10px 8px;
    font-family: 'Libre Bodoni';
    & img {
      width: 30px;
      vertical-align: sub;
    }
  }

  .prize {
    color: rgba(255, 64, 129, 0.7);
    font-size: 48px;
  }

  .unit {
    color: rgba(255, 64, 129, 0.7);
    font-size: 22px;
  }

  .caution {
    width: 200px;
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
    margin: 0 5px;
    font-family: 'Allura';
    font-size: 35px;

    & img {
      width: 30px;
      vertical-align: sub;
    }
  }

  .bodoni {
    margin-left: 5px;
    font-family: 'Libre Bodoni';

    & img {
      width: 20px;
      vertical-align: sub;
      background-color: slategrey;
      padding: 0 3px;
    }

    & .prize {
      font-size: 32px;
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
    position: sticky;
    margin-bottom: 0;
    top: 0;
    background: rgba(11, 4, 35, 1);

    & img {
      width: 13px;
    }
  }

  .sticky  .balance {
    font-size: 18px;
  }

  .sticky .total-prize {
    font-size: 13px;
  }

  button.yes {
    color: white;
    background-color: dodgerblue;
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

    .catch {
      font-size: 35px;
      width: 300px;
      text-align: center;
    }
  }

  @media screen and (max-width: 380px) {
    .catch {
      font-size: 20px;
    }
  }

</style>
