<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './shooting/Field.svelte'
  import { config, authenticate, unauthenticate, currentUser, tx } from '@onflow/fcl';
  import { getBalance, isRegistered } from '../../flow_blockchain/scripts';
  import { createGamer } from '../../flow_blockchain/transactions'
  import flowJSON from '../../flow_blockchain/flow.json';
  import Dialog from './Dialog.svelte';

  let app

  config({
    'flow.network': 'emulator',
    'accessNode.api': 'http://localhost:8888',
    'discovery.wallet': 'http://localhost:8701/fcl/authn',
  }).load({ flowJSON });

  let flowBalance;
  let hasResource;
  let playerName;
  let modal;
  let modal2;
  let gameUser
  currentUser.subscribe(async (user) => {
    gameUser = user
    if (user.addr) {
      flowBalance = await getBalance(user.addr);
      hasResource = await isRegistered(user.addr);
      if (!hasResource) {
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
      hasResource = await isRegistered(gameUser.addr);
      console.log(hasResource);
    }
  }, 1500);

  onMount(() => { 
    app.renderer.render(app.stage)
  })
</script>

<div class="game-screen">
  <div class="right-pane">
    <p class="current_prize">
      Current Prize: <img src="/assets/flow_fire.png" alt="$FLOW" />
      <span class="prize">2</span>
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
      <Field screenWidth={screen.width > 512 ? 512 : screen.width * 0.96}/>
    </Application>

    <div>
      <p class="allura">
        Your Balance: <img src="/assets/flow_fire.png" alt="$FLOW" /><span class="flow_balance">{Math.trunc(flowBalance * 100) / 100}</span>
      </p>

      <p class="cinzel">
        <a href="/">Back to Home</a>
      </p>

      <p class="bodoni">
        <img src="/assets/tip_jar.png" alt="$FLOW" /> <span class="prize">2</span> ($FLOW) has been donated for free play. <button>Tipping</button>
      </p>

      <p class="cinzel">
        <a href="/">Sign Out</a>
      </p>
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
  <div>Please provide your name (nickname) so that we can keep a record of you on the blockchain.</div>
  <br>
  <input bind:value={playerName} placeholder="Player" type="text" />
  <button on:click={async () => {
    modal2.close()
    const txId = await createGamer(playerName ?? 'Game Player');
    tx(txId).subscribe((res) => {
      console.log(`tx status: ${res}`);
    });
  }}>Set name</button>
</Dialog>

<style>
  input {
    padding: 5px;
  }

 .game-screen {
    height: 95%;
    margin-bottom: 5px;
    overflow: scroll;
    color: white;
  }

  .catch {
    color: white;
    font-size: 26px;
    margin-left: 10px;
    margin-top: 10px;
    font-weight: 700;
  }

  .current_prize {
    font-size: 27px;
    margin: 10px;
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

  .cinzel {
    font-size: 20px;
    font-family: 'Cinzel';
  }

  .allura {
    margin: 8px 5px 0 5px;
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
    }
  }

  .right-pane {
    margin-right: 5px;
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

</style>
