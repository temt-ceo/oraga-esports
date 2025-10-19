<script>
  // 以下GraphQLツール
  import { generateClient } from 'aws-amplify/api';
  import { createGameServerProcess } from '../graphql/mutations';
  import * as subscriptions from '../graphql/subscriptions';
  // 以下ブロックチェーンライブラリ
  import { config, authenticate, unauthenticate, currentUser, tx } from '@onflow/fcl';
  import { getSellerInfo, getBalance } from '../../flow_blockchain/mainnet/scripts';
  import { buyVege } from '../../flow_blockchain/mainnet/transactions'
  import flowJSON from '../../flow_blockchain/flow.json';

  import "../app.css";
  import VegeCard from './vege/VegeCard.svelte';
  import Dialog from './Dialog.svelte';

  // 以下GraphQLツール関連
  const client = generateClient();
  let loading = false
  client
    .graphql({ query: subscriptions.onCreateGameServerProcess })
    .subscribe({
      next: ({ data }) => {
        console.log(data)
        if (data.onCreateGameServerProcess?.type == 'vege_seller_save') {
          loading = true
          const res = data.onCreateGameServerProcess?.message.split(' , txId: ')
          const txId = res[1]
          tx(txId).subscribe((res) => {
            console.log('tx status:', res);
            if (!res.errorMessage && res.statusString == 'SEALED') {
              loading = false
              alert('ブロックチェーンに保存が完了しました。')
            }
          });
        }
      }
    }
  );

  // ブロックチェーン変数 | 定数
  let displayName = {green_pepper: 'ピーマン', eggplant: '茄子', green_onion: '青ネギ', carrot: '人参', cabbage: 'キャベツ', potato: 'じゃがいも', yellow_pepper: 'パプリカ(黄)', onion: '玉ねぎ', tomato: 'トマト'};
  let priceList = {green_pepper: 1.1, eggplant: 1.8, green_onion: 2.0, carrot: 1.2, cabbage: 2.2, potato: 2.2, yellow_pepper: 1.8, onion: 1.6, tomato: 1.6};
  let loginUser;
  let flowBalance;
  let info;
  const id = localStorage.getItem('ID') || Math.random().toString()
  localStorage.setItem('ID', id);

  // 変数
  const add = []
  const addAmount = []
  const buyList = []
  let tempInfo = {}
  let total = 0.0;
  let modal;
  let modal2;
  let stockVol;
  let cashierVal = '0円';
  let displayBalance = '-';
  let tgt = '';
  let isCustomer = true

  // ※ App.svelteで定義済みだから以下の設定は本当は不要。
  config({
    'flow.network': 'mainnet',
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'discovery.wallet': 'https://wallet-v2.blocto.app/-/flow/authn',
    'app.detail.title': 'Oraga eSports',
    'app.detail.icon': 'https://oraga-esports.com/assets/MMO%20RPG.png',
  }).load({ flowJSON });
  unauthenticate() // 画面表示直後に一旦ログアウト処理を実行

  // 所持金取得
  currentUser.subscribe(async (user) => {
    loginUser = user
    if (user.addr) {
      flowBalance = await getBalance(user.addr);
      const tmp = Math.floor(flowBalance * 10) / 10
      displayBalance = `${tmp * 60}円(₣${tmp})` // 2025年9月時点の時価
    }
  })

  // ブロックチェーンからスマートコントラクト情報取得
  setInterval(async () => {
    info = await getSellerInfo(id);
    console.log(info)
  }, 1500)

  // 【関数】モーダル表示
  const onSet = (name) => {
    if (!info?.data[name] && isCustomer) return
    tgt = name
    stockVol = info?.data[name] || tempInfo[name] || 0
    modal.showModal()
  }

  // 【関数】ブロックチェーンに保存
  async function saveOnBC() {
    const query = {
      type: 'vege_seller_save',
      message: JSON.stringify({id, add, addAmount}),
      playerId: '',
    };

    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }

  // 【関数】野菜を購入するトランザクションをブロックチェーンに対して実施
  async function buyVegetables() {
    await authenticate()

    if (total > flowBalance) {
      alert('お金が足りないよ！')
      return
    } else if (flowBalance == undefined) {
      alert('もう一度購入するボタンを押してね。')
      return
    }
    let txId = await buyVege(id, buyList, total)
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'SEALED') {
        loading = false
        alert('ありがとう！野菜ストッカーの解錠ボタンを押して野菜を取り出して持ち帰ってね❣️')
        tempInfo = {}
        flowBalance = await getBalance(loginUser.addr)
        cashierVal = '0円'
        const tmp = Math.floor(flowBalance * 10) / 10
        displayBalance = `${tmp * 60}円(₣${tmp})` // 2025年9月時点の時価
      }
    });

  }
</script>

<section class="section">
  <div class="game-screen overflow-auto">
    <h1 class="text-3xl font-bold text-green-600 underline">Vege Seller
  </h1>
    <div class="w-full h-4/7 py-2 flex flex-wrap overflow-auto">
      {#each Object.keys(priceList) as name}
        <!-- 野菜カード -->
        <VegeCard
          name={name}
          setData={!isCustomer && tempInfo[name] ? tempInfo[name] : (info && info.data[name] ? parseInt(info.data[name]) : null)}
          onSet={onSet}
          onUnset={onSet}
          isVegeSeller={isCustomer ? 1 : 2}
          badge={isCustomer && tempInfo[name] ? 1 : 0}
        />
      {/each}
    </div>
    <div class="flex justify-center mt-2">
      <input
        type="checkbox"
        on:click={() => {
          isCustomer = !isCustomer
          tempInfo = {}
        }}
        checked={true}
        class="toggle border-indigo-600 bg-indigo-500 checked:border-orange-500 checked:bg-orange-400 checked:text-orange-800 mr-2"
      />
      {#if isCustomer}
        <div class="text-orange-600">いらっしゃいませ。<br>（各商品1個ずつ購入できます）</div>
      {:else}
      <div class="text-sky-600">商品の管理を行います。<br>最後に保存ボタンを押してください。</div>
      {/if}
    </div>

    <div class="flex justify-center mt-2">
      {#if isCustomer}
        <div class="cashier">
          お値段<br>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="1.5" fill="none"><path d="M12 22C11.1818 22 10.4002 21.6646 8.83693 20.9939C4.94564 19.3243 3 18.4895 3 17.0853L3 7.7475M12 22C12.8182 22 13.5998 21.6646 15.1631 20.9939C19.0544 19.3243 21 18.4895 21 17.0853V7.7475M12 22L12 12.1707M21 7.7475C21 8.35125 20.1984 8.7325 18.5953 9.495L15.6741 10.8844C13.8712 11.7419 12.9697 12.1707 12 12.1707M21 7.7475C21 7.14376 20.1984 6.7625 18.5953 6M3 7.7475C3 8.35125 3.80157 8.7325 5.40472 9.495L8.32592 10.8844C10.1288 11.7419 11.0303 12.1707 12 12.1707M3 7.7475C3 7.14376 3.80157 6.7625 5.40472 6M6.33203 13.311L8.32591 14.2594" stroke="currentColor"></path><path d="M12 2V4M16 3L14.5 5M8 3L9.5 5" stroke="currentColor"></path></g></svg>
          {cashierVal}
        </div>
        <button class="btn btn-accent w-[170px] mt-3" on:click={() => { modal2.showModal() }}>所持金: {displayBalance}<br>購入する</button>
      {:else}
        <button class="btn btn-accent w-[100px]" on:click={() => { modal2.showModal() }}>保存</button>
      {/if}
    </div>
    {#if loading}
      <div class="ml-3 text-success"><span class="loading loading-infinity loading-xl"></span>(保存中)</div>
    {/if}
    <div class="text-green-600 underline mt-2 ml-10">
      <a href="https://www.flowscan.io/contract/A.b576a3926d239682.VegeSeller?tab=deployments" target="_blank">スマートコントラクト</a><br>
      <a href="https://github.com/temt-ceo/oraga-esports/pull/22/files" target="_blank">プルリク</a>
    </div>
    <iframe width="{screen.width < 700 ? screen.width * 0.8 : screen.width * 0.4}" height="{screen.width < 700 ? screen.width * 0.45 : screen.width * 0.225}" src="https://www.youtube.com/embed/92hqmJ8rrlM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
  </div>
  <p class="paragraph flex flex-wrap">
    <span class="allura">Powered by Flow blockchain. </span><img src="/assets/flow_logo.avif" alt="flow logo" /><br>
    Copyright © 2025 TEM Technologies Co., LLC All rights reserved.
  </p>

  <Dialog bind:dialog={modal}>
    <div>{isCustomer ? (tempInfo[tgt] ? 'カゴから取り出しますか？' : `${displayName[tgt]}を買い物カゴに入れますか？`) : (info?.data[tgt] > 0 ? '売り場の在庫調整をしますか？': '生産物を売り場にセットしますか？')}</div>
    {#if !isCustomer}
      <div class="text-green-600 text-lg">在庫数を入力してください。</div>
      <div class="w-full max-w-xs my-1">
        <input type="range" min="0" max="5" value={stockVol} class="range" step="1"  on:change={(event) => stockVol = event.target.value}/>
        <div class="flex justify-between px-2.5 mt-2 text-xs"><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span></div>
        <div class="flex justify-between px-2.5 mt-2 text-xs"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
      </div>
    {/if}
    <button on:click={() => {
      if (isCustomer) {
        if (tempInfo[tgt]) {
          buyList.splice(buyList.indexOf(tgt), 1)
          tempInfo[tgt] = null
        } else {
          buyList.push(tgt)
          tempInfo[tgt] = 1
        }
        total = Math.floor(buyList.reduce((accumulator, currentValue) => accumulator + priceList[currentValue], 0) * 10) / 10
        cashierVal = `${total * 60} 円 (₣${total})`
      } else {
        tempInfo[tgt] = parseInt(stockVol)
        const pos = add.indexOf(tgt)
        if (pos > -1) {
          addAmount[pos] = tempInfo[tgt]
        } else {
          add.push(tgt)
          addAmount.push(tempInfo[tgt])
        }
      }
      modal.close()
    }}>{isCustomer ? (tempInfo[tgt] ? '取り出す' : '入れる') : '登録'}</button>
    <button on:click={() => modal.close()}>{isCustomer ? 'やめる' : '取消し'}</button>
  </Dialog>

  <Dialog bind:dialog={modal2}>
    <div>{isCustomer ? '購入しますか？' : 'ブロックチェーンに保存しますか？'}</div>
    <button on:click={() => {
      if (isCustomer) buyVegetables()
      else saveOnBC()
      modal2.close()
    }}>はい</button>
    <button on:click={() => modal2.close()}>いいえ</button>
  </Dialog>
  <!-- <div class="bg-green-300 bg-purple-300 bg-sky-300 bg-rose-300 bg-indigo-300 bg-slate-300 bg-amber-300 bg-lime-300 bg-red-300"></div> -->
</section>

<style lang="postcss">
@reference "tailwindcss";
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

:global(dialog) {
  margin: 25vh auto 0 auto;
  font-size: 36px;
  font-weight: 700;
  font-family: 'Libre Bodoni';
  color: rgba(255, 64, 129, 0.7);
  background-color: rgba(11, 4, 35, 1);
  border-color: dodgerblue;
  border-width: 4px;
  padding: 30px 20px;
  font-size: 24px;
}

h1 {
  text-align: center;
  margin: 0;
  padding: 10px;
}

.section {
  height: 100vh;
  background: rgba(11, 4, 35, 1);
  overflow: hidden;
  border-radius: 30px;
  border: 2px solid rgba(255, 255, 5, 0.7);
  padding: 10px 0 0 2px;
  margin: 0 1vw;
}

.game-screen {
  height: 85vh;
}

.cashier {
  box-sizing: content-box;
  font-size: 16px;
  color: #398c4b;
  background-color: #f4fff6;
  border: 0.5px solid #cdf3d5;
  border-radius: 80px;
  padding: 9px;
  margin: 0 5px;

  & svg {
    display: inline-block;
    vertical-align: top;
    width: 20px;
    height: 20px;
  }
}

.paragraph {
  margin: 10px 0;
  height: 37px;
  width: 84vw;
  margin-bottom: 0;
  padding: 2px 8px 10px;
  font-size: 11px;
  color: white;
  background-color: rgba(11, 4, 35, 1);
  position: absolute;
  left: 6%;
  bottom: 0%;
  border-radius: 8px;

  & span {
    font-family: 'Allura';
    font-size: 24px;
    color: white;
  }
  & img {
    max-width: 36px;
  }
}


iframe {
  margin: 0 auto 70px auto;
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

  .paragraph {
    bottom: 6%;
    right: 5vw;
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
