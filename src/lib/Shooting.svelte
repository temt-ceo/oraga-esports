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
  <p class="catch">Stay alive for one minute!</p>
  <a href="/">Homeへ</a>
</div>

<Application
  width={screen.width > 512 ? 512 : screen.width}
  height={screen.width > 512 ? 512 : screen.width}
  backgroundColor="0x5c812f"
  bind:instance={app}
  antialias>
  <Field screenWidth={screen.width > 512 ? 512 : screen.width}/>
</Application>

<style>
  .game-screen {
    margin: 0 15px 15px 0;
  }

  .catch {
    color: white;
    font-size: 25px;
  }

  @media screen and (min-width: 700px) {
    .catch {
      font-size: 35px;
      width: 200px;
    }
  }

</style>
