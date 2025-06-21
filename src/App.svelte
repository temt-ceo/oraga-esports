<script>
  import Home from './lib/Home.svelte'
  import Shooting from './lib/Shooting.svelte'

  export let url = ''
  console.log(url)
</script>

  {#if location.href.endsWith('/')}
    <section class="section">
      <div class="game-screen">
        <h1 class="title">Oraga eSports</h1>
        <div class="content">
          <p class="game-icon">
            <a href="/shooting"><img src="/public/assets/Shooting.png" /></a>
            Shooting<br>
          </p>
          <p class="game-icon">
            <a><img src="/public/assets/MMO RPG.png" /></a>
            MMO RPG (Coming Soon!)
          </p>
        </div>
      </div>
    </section>
  {/if}
  {#if location.href.endsWith('/shooting')}
    <section class="section shooting">
      <Shooting />
    </section>
  {/if}

<style>
  :global(body) {
      width: 100vw;
      height: 90vh;
      margin: 0;
      padding-top: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image: url('/public/assets/453d816d7d25d5a4aa075a8c64c79818.jpg');
      background-repeat: repeat;
      animation: bg 45s linear infinite;
  }
  
  h1, h2, h3, h4, h5{
    text-align: center;
    margin: 0;
    padding: 10px;
    color: rgba(255, 64, 129, 0.7);
  }

  .section {
    height: 90vh;
    background: rgba(11, 4, 35, 1);
    border-radius: 30px;
    border: 2px solid rgba(255, 255, 5, 0.7);
    overflow: hidden;
    &.shooting {
      height: 80vh;
      padding-top: 100px;
      margin-top: 20px;
    }
  }

  .content {
    width: 97vw;
    display: flex;
    margin: 40px 0 20px 0;
    overflow: scroll;
    color: white;
    font-size: 22px;
    & .game-icon {
      margin: 0 30px;
      & img {
        width: 300px;
      }
    }
  }

  @media screen and (min-width: 700px) {
    .section.shooting {
      width: 90vw;
      max-width: 1300px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 10px;
      margin-top: 10px;
    }
  }

  @keyframes bg {
    0% {
      background-image: url('/public/assets/198ff9cc76f5a86ad1de61447a01a57b.jpg');
    }
    50% {
      background-image: url('/public/assets/hearthands.jpg');
    }
    100% {
      background-image: url('/public/assets/198ff9cc76f5a86ad1de61447a01a57b.jpg');
    }
  }
  </style>
  