<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './shooting/Field.svelte'

  let app

  onMount(() => { 
    app.renderer.render(app.stage)
  })
</script>

<div class="game-screen">
  <div>
    <p class="current_prize">
      Current Prize: <img src="/assets/flow_fire.png" alt="$FLOW" /><span class="prize">2</span><span class="unit">($FLOW)</span>
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
        Your Balance: <img src="/assets/flow_fire.png" alt="$FLOW" /><span class="flow_balance">1.2</span>
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
  .game-screen {
    height: 95%;
    margin-bottom: 5px;
    overflow: scroll;
    color: white;
  }

  .catch {
    color: white;
    font-size: 25px;
    margin-left: 10px;
    font-weight: 700;
  }

  .current_prize {
    font-size: 27px;
    margin-left: 10px;
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
    margin-top: 8px;
    margin-left: 5px;
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
