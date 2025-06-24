<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './shooting/Field.svelte'
  import { config, authenticate, unauthenticate, currentUser } from '@onflow/fcl';
  import { getBalance } from '../../flow_blockchain/scripts';
  import flowJSON from '../../flow_blockchain/flow.json';
  import Dialog from './Dialog.svelte';

  let app

  config({
    'flow.network': 'emulator',
    'accessNode.api': 'http://localhost:8888',
    'discovery.wallet': 'http://localhost:8701/fcl/authn',
  }).load({ flowJSON });

  let flowBalance;
  let modal;
  currentUser.subscribe(async (user) => {
    if (user.addr) {
      flowBalance = await getBalance(user.addr);
    } else {
      modal.showModal();
    }
  });

  onMount(() => { 
    app.renderer.render(app.stage)
  })
</script>

<Dialog bind:dialog={modal}>
	<button on:click={() => {
    authenticate()
    modal.close()
  }}>SignIn</button>
</Dialog>

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

<style>
	dialog {
		padding: 30px;
		border-radius: 10px;
		background-color: rgb(132 225 188);
		text-align: right;
	}

	dialog > div {
		margin-bottom: 15px;
	}

	dialog > div.title {
		text-align: center;
	}

	dialog > :global(button) {
		width: 100px;
		height: 30px;
		margin: 3px;
	}

	input {
		padding: 5px;
	}

	.note {
		color: orange;
		font-size: 10px;
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
