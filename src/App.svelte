<script>
  import Shooting from './lib/Shooting.svelte'
  import { Amplify } from 'aws-amplify';
  import config from './amplifyconfiguration.json';

  Amplify.configure(config);
</script>

  {#if location.href.includes('/shooting')}
    <section class="section shooting">
      <Shooting />
    </section>
  {:else}
  <section class="section">
    <div class="game-screen">
      <h1 class="title">Oraga eSports</h1>
      <div class="content">
        <div class="game-collection">
          <a href="/shooting">
            <img src="/assets/Shooting.png" alt="Shooting" />
          </a>
          <br>
          <p class="paragraph">
            Category: <span class="allura">Shooting</span><span class="current_prize">(Prize: <img src="/assets/flow_fire.png" alt="$FLOW" />2)</span><br>
          </p>
          <span class="cinzel">How to play:</span><br>
          <span class="cinzel li">1. Win the game. </span><br>
          <span class="cinzel li">2. The game prize is sent to your wallet automatically in realtime. </span><br>
          <span class="cinzel li">3. Sell it at crypt exchange.</span>
          <p class="bodoni theme1">
            If you survive for one minute in this game, $FLOW (crypto) will be paid directly to your wallet. And it is paid out from the accumulated amount when there were no previous game winners.<br>
          </p>
          <p class="description">
            Example: The game fee is ₣1.1. If someone anywhere in the world won the game immediately before you played, your prize will be ₣1. If there were 150 game losers worldwide before you played, the prize paid to you will be ₣151.<br><br><br><br>
          </p>
        </div>
        <div class="game-collection">
          <img src="/assets/MMO RPG.png" alt="MMO RPG" />
          <br>
          <p class="paragraph">
            Category: <span class="allura">MMO RPG</span> (Coming Soon!)<br>
          </p>
        </div>
      </div>
    </div>
    <p class="paragraph sign">
      <span class="allura">Powered by </span><img src="/assets/flow_logo.avif" alt="flow logo" /> Flow blockchain.<br>
      Copyright © 2025 Tokyo EM Technology. All rights reserved.
    </p>
  </section>
  {/if}

<style>
  :global(body) {
    width: 100vw;
    height: 100%;
    margin: 0;
    padding-top: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: url('/assets/453d816d7d25d5a4aa075a8c64c79818.jpg');
    background-repeat: repeat;
  }
  
  h1, h2, h3, h4, h5{
    text-align: center;
    margin: 0;
    padding: 10px;
    color: rgba(255, 64, 129, 0.7);
  }

  .paragraph {
    margin: 10px 0;

    &.sign {
      height: 37px;
      width: 340px;
      margin-bottom: 0;
      padding-top: 2px;
      padding-left: 5px;
      padding-bottom: 10px;
      font-size: 11px !important;
      color: white;
      background-color: rgba(11, 4, 35, 1);
      position: absolute;
      bottom: 4%;
      right: 38px;
      & .allura {
        font-size: 24px !important;
      }

      & img {
        width: 15px;
      }
    }
  }

  .current_prize {
    font-size: 14px;
    padding-left: 6px;
    font-family: 'Libre Bodoni';
    & img {
      width: 16px !important;
      vertical-align: sub;
    }
  }

  .allura {
    font-family: 'Allura';
    font-size: 35px;
    color: white;
  }

  .cinzel {
    font-family: 'Cinzel';
    font-size: 15px;
    line-height: 0.6;
    &.li {
      padding-left: 10px;
    }
  }

  .bodoni {
    font-family: 'Libre Bodoni';
  }

  p.bodoni {
    line-height: 1.2;
    &.theme1 {
      font-size: 14px;
    }
  }

  .description {
    font-size: 14.5px;
    line-height: 1.1;
    margin-bottom: 0;
  }

  .section {
    height: 95vh;
    background: rgba(11, 4, 35, 1);
    overflow-y: scroll !important;
    border-radius: 30px;
    border: 2px solid rgba(255, 255, 5, 0.7);
    overflow: hidden;
    &.shooting {
      padding: 10px 0 0 2px;
      margin: 0 1vw;
    }
  }

  .game-screen {
    height: 77vh;
  }

  .content {
    width: 97vw;
    max-height: 70vh;
    display: flex;
    margin: 55px auto;
    overflow: scroll;
    color: white;
    font-size: 22px;
  }

  .game-collection {
    min-width: 320px;
    max-width: 72vw;
    height: 70vh;
    margin: 0 45px 0 35px;
    overflow: scroll;
    color: white;
    line-height: 0.9;
    & img {
      width: 300px;
    }
  }

  @media screen and (min-width: 700px) {
    :global(body) {
      animation: bg 45s linear infinite;
      height: 95vh;
      padding-top: 1.0rem;
    }

    .section {
      height: 93vh;
    }

    .section.shooting {
      width: 90vw;
      max-width: 1300px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 10px;
      margin-top: 10px;
    }

    .content {
      margin-top: 30px;
    }

    .game-collection {
      max-width: 40vw;
    }

    .paragraph.sign {
      bottom: 6%;
    }
  }

  @keyframes bg {
    0% {
      background-image: url('/assets/198ff9cc76f5a86ad1de61447a01a57b.jpg');
    }
    50% {
      background-image: url('/assets/hearthands.jpg');
    }
    100% {
      background-image: url('/assets/198ff9cc76f5a86ad1de61447a01a57b.jpg');
    }
  }
  </style>
