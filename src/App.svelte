<script>
  import { onMount } from 'svelte';
  import Shooting from './lib/Shooting.svelte'
  import Stats from './lib/Stats.svelte'
  import { Amplify } from 'aws-amplify';
  import config from './amplifyconfiguration.json';
  import * as fcl from '@onflow/fcl';
  import flowJSON from '../flow_blockchain/flow.json';
  import { getGamersInfo } from '../flow_blockchain/mainnet/scripts';

  Amplify.configure(config);

  let DynamicComponent = null;
  let currentSituation;

  fcl.config({
    'flow.network': 'mainnet',
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'discovery.wallet': 'https://blsqui.net/authn',
    'app.detail.title': 'Oraga eSports',
    'app.detail.icon': 'https://oraga-esports.com/assets/MMO%20RPG.png',
  }).load({ flowJSON });

  let currentUrl = '';
  onMount(async () => {
    currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);

    // Dynamically import the component (こうしないとTailwindCSSがCookStockerやVegeSeller意外にも適用されてしまう)
    if (currentUrl.includes('/cook-stocker')) {
      const { default: LoadedComponent } = await import('./lib/CookStocker.svelte');
      DynamicComponent = LoadedComponent;
    } else if (currentUrl.includes('/vege-seller')) {
      const { default: LoadedComponent } = await import('./lib/VegeSeller.svelte');
      DynamicComponent = LoadedComponent;
    } else if (currentUrl.includes('/ride-share')) {
      const { default: LoadedComponent } = await import('./lib/RideShare.svelte');
      DynamicComponent = LoadedComponent;
    } else if (currentUrl.includes('/mmorpg')) {
      const { default: LoadedComponent } = await import('./lib/MMORPG.svelte');
      DynamicComponent = LoadedComponent;
    }
  });

  setInterval(async () => {
    if (!currentUrl.includes('/cook-stocker') && !location.href.includes('/vege-seller') && !location.href.includes('/ride-share')) {
      currentSituation = await getGamersInfo();
    }
  }, 1500);

</script>

  {#if location.href.includes('/shooting')}
    <section class="section shooting">
      <Shooting currentSituation={currentSituation} />
    </section>
  {:else if location.href.includes('/stats')}
    <section class="section shooting">
      <Stats currentSituation={currentSituation} />
    </section>
  {:else if location.href.includes('/cook-stocker') || location.href.includes('/vege-seller') || location.href.includes('/ride-share') || location.href.includes('/mmorpg')}
    <section>
      <svelte:component this={DynamicComponent} />
    </section>
  {:else}
  <section class="section">
    <div class="game-screen">
      <h1 class="title">Oraga eSports</h1>
      <div class="content">
        <div class="game-collection can-scroll">
          <a href="/shooting">
            <img src="/assets/Shooting.png" alt="Shooting" />
          </a>
          <br>
          <p class="paragraph">
            Category: <span class="allura">Shooting</span><span class="current_prize">(Prize: <img src="/assets/flow_fire.png" alt="$FLOW" />{!currentSituation?.currentPrize ? '-' : parseInt(currentSituation?.currentPrize) + 1})</span><br>
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
          <iframe width="{screen.width < 700 ? screen.width * 0.8 : screen.width * 0.4}" height="{screen.width < 700 ? screen.width * 0.45 : screen.width * 0.225}" src="https://www.youtube.com/embed/eywOO8flkbg?si=NoaArp-3RasPUJpm" title="Oraga eSports Shooting game" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          <div>
            <h2>メディア掲載</h2>
            <ul>
              <li>TEM Technologies Co. 特集記事: <a target="_blank" href="https://www.lifepepper.co.jp/other/reskilling-company-recommend/">https://www.lifepepper.co.jp/other/reskilling-company-recommend/</a></li>
              <li>ｅスポーツ専門総合情報サイト: <a target="_blank" href="https://www.besporter.jp/27472/pr/">https://www.besporter.jp/27472/pr/</a></li>
              <li>プレスリリース: <a target="_blank" href="https://prtimes.jp/main/html/rd/p/000000004.000104644.html">https://prtimes.jp/main/html/rd/p/000000004.000104644.html</a></li>
            </ul>
            <h3 class="media-sub">その他メディア掲載</h3>
            <ul>
              <li>書籍の紹介(日本語): <a target="_blank" href="https://www.amazon.co.jp/dp/B0FWZNT2L1/">https://www.amazon.co.jp/dp/B0FWZNT2L1/</a></li>
              <li>書籍の紹介(English): <a target="_blank" href="https://www.amazon.com/dp/B0FWZR3S47">https://www.amazon.com/dp/B0FWZR3S47</a></li>
              <li><a href="/ride-share">➜ To RideShare demo</a></li>
            </ul>
          </div>
        </div>
        <div class="game-collection can-scroll">
          <a href="/mmorpg">
            <img src="/assets/MMO RPG.png" alt="MMO RPG" />
          </a>
          <br>
          <p class="paragraph">
            Category: <span class="allura">MMO RPG</span><br>
          </p>
          <span class="cinzel">How to play:</span><br>
          <span class="cinzel li">1. Find a Buddy. </span><br>
          <span class="cinzel li">2. Share resource capabilities within the team. </span><br>
          <span class="cinzel li">3. Defeat the enemy team and win the prize money.</span>
          <p class="bodoni theme1">
            You choose your preferred resource from the Warrior and Thief resources. Select the resource you want from your teammates and find a Buddy who possesses that resource.<br>
          </p>
          <p class="description">
            Swapping resource capabilities is free. Team up and defeat the enemy team! The prize is double the game fee!<br><br><br><br>
          </p>
          <iframe width="{screen.width < 700 ? screen.width * 0.8 : screen.width * 0.4}" height="{screen.width < 700 ? screen.width * 0.45 : screen.width * 0.225}" src="https://www.youtube.com/embed/WnteAQNYV8w?si=2-448cnCmLzQDJ9x" title="Oraga eSports MMORPG game" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          <div>
            <h2>メディア掲載</h2>
            <ul>
              <li>東京新聞: <a target="_blank" href="https://adv.tokyo-np.co.jp/prtimes/article82509/">https://adv.tokyo-np.co.jp/prtimes/article82509/</a></li>
              <li>毎日新聞: <a target="_blank" href="https://mainichi.jp/articles/20251027/pr2/00m/020/397000c">https://mainichi.jp/articles/20251027/pr2/00m/020/397000c</a></li>
              <li>品川経済新聞: <a target="_blank" href="https://shinagawa.keizai.biz/release/484564/">https://shinagawa.keizai.biz/release/484564/</a></li>
              <li>ｅスポーツ専門総合情報サイト: <a target="_blank" href="https://www.besporter.jp/28560/pr/">https://www.besporter.jp/28560/pr/</a></li>
              <li>NFT Media: <a target="_blank" href="https://nft-media.net/game/tem-esports-mmorpg-tech-disclosure/83585/">https://nft-media.net/tem-esports-mmorpg-tech-disclosure/</a></li>
              <li><a target="_blank" href="https://prtimes.jp/main/html/rd/p/000000006.000104644.html">企業プレスリリース詳細へ</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <p class="paragraph sign">
      <span class="allura">Powered by </span><img src="/assets/flow_logo.avif" alt="flow logo" /> Flow blockchain.<br>
      Copyright © 2026 TEM Technologies Co., LLC. All rights reserved.
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

  h1 {
    text-align: center;
    margin: 0;
    padding: 10px;
    color: rgba(255, 64, 129, 0.7);
  }

  li {
    margin-bottom: 8px;
    font-size: 16px;

    & a {
      font-size: 13px;
    }
  }

  a {
    color: rgba(255, 64, 129, 0.7);
  }

  .paragraph {
    margin: 10px 0;

    &.sign {
      height: 37px;
      width: 84vw;
      margin-bottom: 0;
      padding: 2px 8px 10px;
      font-size: 11px;
      color: white;
      background-color: rgba(11, 4, 35, 1);
      position: absolute;
      left: 6%;
      bottom: 0;
      border-radius: 8px;
      & .allura {
        font-size: 24px;
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
    overflow: hidden;
    border-radius: 30px;
    border: 2px solid rgba(255, 255, 5, 0.7);
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
    min-width: 330px;
    max-width: 72vw;
    height: 70vh;
    margin: 0 45px 0 35px;
    color: white;
    line-height: 0.9;
    & img {
      width: 300px;
    }
    &.can-scroll {
      overflow: scroll;
      & img {
        cursor: pointer;
      }
    }
    &::-webkit-scrollbar-corner {
      width: 0;
      display: none;
    }
    & iframe {
      margin-bottom: 50px;
    }
    & .media-sub {
      margin-top: 80px;
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
      overflow: hidden;
    }

    .game-collection {
      max-width: 45vw;
    }

    .game-collection.can-scroll {
      overflow-x: hidden;
    }

    .game-collection > iframe {
      margin-bottom: 20px;
    }

    .paragraph.sign {
      bottom: 6%;
      right: 5vw;
    }
  }

  @media screen and (max-width: 380px) {
    .game-collection {
      min-width: 295px;
      margin-left: 15px;
    }
    .game-collection img {
      width: 270px;
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
