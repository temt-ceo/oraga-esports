<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './lib/Field.svelte'

  let app

  onMount(() => { 
    app.renderer.render(app.stage)
  })
</script>

<Application
  width={512}
  height={512}
  backgroundColor="0x5c812f"
  bind:instance={app}
  antialias>
  <Field />
</Application>
