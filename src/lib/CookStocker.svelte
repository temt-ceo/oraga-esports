<script>
  // 以下GraphQLツール
  import { generateClient } from 'aws-amplify/api';
  import { createGameServerProcess } from '../graphql/mutations';
  import * as subscriptions from '../graphql/subscriptions';
  // 以下ブロックチェーンライブラリ
  import { tx } from '@onflow/fcl';
  import { getInfo } from '../../flow_blockchain/mainnet/scripts';

  import "../app.css";
  import VegeCard from './vege/VegeCard.svelte';
  import Dialog from './Dialog.svelte';

  const client = generateClient();
  let loading = false
  client
    .graphql({ query: subscriptions.onCreateGameServerProcess })
    .subscribe({
      next: ({ data }) => {
        console.log(data)
        if (data.onCreateGameServerProcess?.type == 'cook_stocker_save' || data.onCreateGameServerProcess?.type == 'cook_stocker_delete') {
          loading = true
          const res = data.onCreateGameServerProcess?.message.split(' , txId: ')
          const txId = res[1]
          tx(txId).subscribe((res) => {
            console.log('tx status:', res);
            if (!res.errorMessage && res.statusString == 'SEALED') {
              loading = false
              if (data.onCreateGameServerProcess?.type == 'cook_stocker_save') alert('ブロックチェーンに保存が完了しました。')
              if (data.onCreateGameServerProcess?.type == 'cook_stocker_delete') alert('ブロックチェーンからデータを削除しました。')
            } else if (res.errorMessage) {
            }
          });
        }
      }
    }
  );

  let list = {green_pepper: null, eggplant: null, green_onion: null, carrot: null, cabbage: null, potato: null, yellow_pepper: null, onion: null, tomato: null};
  let info;
  const id = localStorage.getItem('ID') || Math.random().toString()
  const add = []
  const remove = []
  let modal;
  let modal2;
  let tgt = '';

  localStorage.setItem('ID', id);

  setInterval(async () => {
    info = await getInfo(id);
    console.log(info)
  }, 1500);

  const onSet = (name) => {
    tgt = name
    modal.showModal()
  }

  const onUnset = (name) => {
    tgt = `${name}を削除`
    modal.showModal()
  }

  // ブロックチェーンに保存
  async function saveOnBC() {
    const query = {
      type: 'cook_stocker_save',
      message: JSON.stringify({id, add, remove}),
      playerId: '',
    };

    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }

  // ブロックチェーンに保存されている情報を削除
  async function deleteFromBC() {
    const query = {
      type: 'cook_stocker_delete',
      message: JSON.stringify({id}),
      playerId: '',
    };

    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }
</script>

<section class="section">
  <div class="game-screen overflow-auto">
    <h1 class="text-3xl font-bold text-green-600 underline">
      Cook Stocker
    </h1>
    <div class="w-full h-5/7 py-2 flex flex-wrap overflow-auto">
      {#each Object.keys(list) as name}
        <VegeCard name={name} setData={list[name] != null ? list[name] : (info ? new Date(parseInt(info.data[name]) * 1000).getTime() : null)} onSet={onSet} onUnset={onUnset} />
      {/each}
    </div>
    <div class="flex justify-center">
      <button class="btn btn-accent w-[100px]" on:click={() => { tgt = '保存'; modal2.showModal() }}>保存</button>
      <button class="btn btn-secondary w-[100px] ml-4" on:click={() => { tgt = '削除'; modal2.showModal() }}>全削除</button>
      {#if loading}
        <div class="ml-3 text-success"><span class="loading loading-infinity loading-xl"></span>(保存中)</div>
      {/if}
    </div>
    <div class="text-green-600 underline mt-2 ml-10">
      <a href="https://www.flowscan.io/contract/A.b576a3926d239682.CookStocker?tab=deployments" target="_blank">スマートコントラクト</a><br>
      <a href="https://github.com/temt-ceo/oraga-esports/pull/19/files" target="_blank">プルリク</a>
    </div>
  </div>
  <p class="paragraph flex flex-wrap">
    <span class="allura">Powered by Flow blockchain. </span><img src="/assets/flow_logo.avif" alt="flow logo" /><br>
    Copyright © 2025 TEM Technologies Co., LLC. All rights reserved.
  </p>

  <Dialog bind:dialog={modal}>
    <div>{tgt.includes('を削除') ? '保存リストから削除しますか？': '今日を購入日にしますか？'}</div>
    <button on:click={() => {
      const name = tgt.replace('を削除', '')
      if (tgt.includes('を削除')) {
        if (add.includes(name)) add.splice(add.indexOf(name), 1)
        else remove.push(name)
        list[name] = -1
      } else {
        if (remove.includes(name)) remove.splice(remove.indexOf(name), 1)
        else add.push(name)
        list[name] = 0
      }
      modal.close()
    }}>はい</button>
    <button on:click={() => modal.close()}>いいえ</button>
  </Dialog>

  <Dialog bind:dialog={modal2}>
    <div>{tgt == '保存' ? 'ブロックチェーンに保存しますか？': 'ブロックチェーンに保存されている情報を削除しますか？'}</div>
    <button on:click={() => {
      if (tgt == '保存') saveOnBC()
      else deleteFromBC()
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
  margin: 30vh auto 0 auto;
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
  height: 90vh;
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
