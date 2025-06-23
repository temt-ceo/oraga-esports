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
    <p class="catch">Stay alive for one minute!</p>
    <a href="/">Homeへ</a>
  </div>

  <Application
    width={screen.width > 512 ? 512 : screen.width * 0.98}
    height={screen.width > 512 ? 512 : screen.width * 0.98}
    backgroundColor="0x5c812f"
    bind:instance={app}
    antialias>
    <Field screenWidth={screen.width > 512 ? 512 : screen.width * 0.98}/>
  </Application>

  <div>
    Tip jar(Donated 10FLOW for free-play)(Cinzel)

    Current prize fund: 2 ₣(Libre Bodoni)

    Your Balance: 1.2 ₣(Allura)

    Back to Home (Cinzel)
    Sign Out (Cinzel)
    Tipping(ボタン)
  </div>
</div>

<style>
  .game-screen {
    height: 95%;
    margin-bottom:5px;
    overflow: scroll;
    color: white;
  }

  .catch {
    color: white;
    font-size: 25px;
    margin-bottom: 0;
  }

  @media screen and (min-width: 700px) {
    .catch {
      font-size: 35px;
      width: 200px;
    }
  }

</style>
