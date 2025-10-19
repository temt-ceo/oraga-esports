<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './rideShare/Field.svelte'
  import 'cally';
  import "../app.css";
  import Dialog from './Dialog.svelte';
  // 以下GraphQLツール
  import { generateClient } from 'aws-amplify/api';
  import { createGameServerProcess } from '../graphql/mutations';
  import * as subscriptions from '../graphql/subscriptions';
  // 以下ブロックチェーンライブラリ
  import { config, authenticate, unauthenticate, currentUser, tx } from '@onflow/fcl';
  import { getRideShareInfo, getBalances, getBalancesWithoutUser } from '../../flow_blockchain/mainnet/scripts';
  import { setDriverInfo, newOrder, fixBug } from '../../flow_blockchain/mainnet/transactions'
  import flowJSON from '../../flow_blockchain/flow.json';

  // 以下GraphQLツール関連
  const client = generateClient();
  let loading = false
  client
    .graphql({ query: subscriptions.onCreateGameServerProcess })
    .subscribe({
      next: ({ data }) => {
        console.log(data)
        if (
          data.onCreateGameServerProcess?.type == 'ride_share_complete' ||
          data.onCreateGameServerProcess?.type == 'ride_share_rating' ||
          data.onCreateGameServerProcess?.type == 'ride_share_new_driver'
        ) {
          loading = true
          const res = data.onCreateGameServerProcess?.message.split(' , txId: ')
          const txId = res[1]
          tx(txId).subscribe(async (res) => {
            console.log('tx status:', res);
            if (!res.errorMessage && res.statusString == 'SEALED') {
              loading = false
              if (data.onCreateGameServerProcess?.type == 'ride_share_new_driver') {
                alert('ドライバー情報をブロックチェーンに保存しました。')
              }

              // トランザクション成功なので残高表示を更新する
              flowBalances = await getBalances(loginUser.addr)
              const tmp = Math.floor(flowBalances[0] * 10) / 10
              displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
              const tmpDriver = Math.floor(flowBalances[1] * 10) / 10
              displayBalanceDriver = `${Math.floor(tmpDriver * rateOfFlow)}円(₣${tmpDriver})`
              const tmpSystem = Math.floor(flowBalances[2] * 10) / 10
              displayBalanceSystem = `${Math.floor(tmpSystem * rateOfFlow)}円(₣${tmpSystem})`
            }
          });
        }
      }
    }
  );

  // ブロックチェーン変数 | 定数
  let loginUser;
  let flowBalances;
  let info;
  // 変数
  let app
  const add = []
  const addAmount = []
  const rateOfFlow = 59  // 2025年9月15日時点の時価
  let modal;
  let driverModal;
  let ratingModal;
  let displayBalanceUser = '-'
  let displayBalanceDriver = '-'
  let displayBalanceSystem = '-'
  let isCustomer = true
  let execDate = ''
  let execDateTime = ''
  let startPlace = ''
  let goalPlace = ''
  let price = 0.0
  let driverId = null
  let driverRating = null
  let newDriverId = null
  let newDriverName = ''
  let newDriverCarType = ''
  let newDriverOrder = null
  let orderStatus = 0
  let wagePaid = false
  let driverIsRated = false
  let driverDataNormal = [];
  let driverDataLuxury = [];

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
      flowBalances = await getBalances(user.addr);
      const tmp = Math.floor(flowBalances[0] * 10) / 10
      displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
      const tmpDriver = Math.floor(flowBalances[1] * 10) / 10
      displayBalanceDriver = `${Math.floor(tmpDriver * rateOfFlow)}円(₣${tmpDriver})`
      const tmpSystem = Math.floor(flowBalances[2] * 10) / 10
      displayBalanceSystem = `${Math.floor(tmpSystem * rateOfFlow)}円(₣${tmpSystem})`
    } else {
      setTimeout(async () => {
        // 未ログイン時はシステム運営アカウントとドライバーの所持金だけ取得する
        flowBalances = await getBalancesWithoutUser();
        const tmpDriver = Math.floor(flowBalances[0] * 10) / 10
        displayBalanceDriver = `${Math.floor(tmpDriver * rateOfFlow)}円(₣${tmpDriver})`
        const tmpSystem = Math.floor(flowBalances[1] * 10) / 10
        displayBalanceSystem = `${Math.floor(tmpSystem * rateOfFlow)}円(₣${tmpSystem})`
      }, 500)
    }
  })

  // ブロックチェーンからスマートコントラクト情報取得
  setInterval(async () => {
    info = await getRideShareInfo();
console.log(info)
    // 現在注文中のOrderのドライバー賃金取得
    const currentOrder = info.orderQueue.find(element => parseFloat(element.execTime) == (new Date(execDateTime).getTime() / 1000 + 0.0001)) // transactions.jsでブロックチェーンに渡した値で検索
    // ドライバー一覧取得
    const driverIds = Object.keys(info.driverData)
    const driverData = driverIds.map(driverId => {
      const data = info.driverData[driverId].data

      return {driverId: parseInt(driverId), ...data}
    })
    driverDataLuxury = driverData.filter(data => data.carType == 'ラグジュアリタイプ')
    driverDataNormal = driverData.filter(data => data.carType == '普通タイプ')
    console.log(info.orderQueue, driverDataNormal, driverDataLuxury, currentOrder, execDateTime ? (new Date(execDateTime).getTime() / 1000 + 0.0001).toString() : null)
    // ドライバーに賃金支払い
    if (orderStatus == 4 && wagePaid == false) {
      driverId = currentOrder.driverId
      payWageToDriver(parseFloat(currentOrder.wage))
      wagePaid = true
    }
    // ドライバーのRating
    if (orderStatus == 6 && driverIsRated == false) {
      ratingModal.showModal()
      driverIsRated = true
    }
    // ドライバー登録した人に注文が発生した時にAlertを出す処理(デモ用なのであまりしっかりしたものではないです)
    if (newDriverCarType == 'ラグジュアリタイプ') {
      newDriverId = driverDataLuxury.find(data => data.name == newDriverName)?.driverId
    } else {
      newDriverId = driverDataNormal.find(data => data.name == newDriverName)?.driverId
    }
    if (newDriverId) {
      const ordersForMe = info.orderQueue.filter(order => order.driverId == newDriverId)
      console.log(`newDriverId: ${newDriverId} ordersForMe: ${ordersForMe}`)
      const todayOrder = ordersForMe.find(order => {
        return (new Date(parseInt(order.execTime) * 1000)).getTime() > (new Date()).getTime() &&
          (new Date(parseInt(order.execTime) * 1000)).getTime() < (new Date()).getTime() + 24 * 60 * 60 * 1000
      }) // ブロックチェーンに時間は秒単位で保存しています。Cadenceでブロック生成時間を取得した時秒単位のUFix64型な為。
      if (todayOrder && !newDriverOrder) {
        newDriverOrder = todayOrder
        const wStartTime = new Date(parseInt(todayOrder.execTime) * 1000)
        alert(`新しいドライバー注文が入りました。 ${wStartTime.getHours()}時${wStartTime.getMinutes()}分に${todayOrder.start}でお客様に接客して下さい。目的地に着く頃に${Math.floor(todayOrder.wage * rateOfFlow)}円をあなたのアカウントにお支払いします。`)
      }
    }
  }, 1500)

  // 【関数】ブロックチェーンに賃金データ支払い実行
  async function payWageToDriver(wage) {
    const query = {
      type: 'ride_share_complete',
      message: JSON.stringify({driverId: parseInt(driverId), wage}),
      playerId: '',
    };

    console.log('***** Start to send a transaction of paying wage. *****')
    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }

  // 【関数】ブロックチェーンにドライバー更新情報保存(Rating)
  async function updateDriverInfo() {
    const keys = Object.keys(info.driverData[driverId].data)
    const values = Object.values(info.driverData[driverId].data)
    const ratingIndex = keys.indexOf('rateAverage')
    const workCountIndex = keys.indexOf('workCount')
    values[ratingIndex] = ((parseFloat(values[ratingIndex]) + parseInt(driverRating)) / parseInt(values[workCountIndex] + 1)).toString()
    values[workCountIndex] = (parseInt(values[workCountIndex]) + 1).toString()
    
    const query = {
      type: 'ride_share_rating',
      message: JSON.stringify({driverId: parseInt(driverId), keys, values}),
      playerId: '',
    };

    console.log('***** Start to send a transaction of the driver rating. *****')
    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }

  // 【関数】野菜を注文するトランザクションをブロックチェーンに対して実施
  async function orderTaxi() {
    await authenticate()

    if (price / rateOfFlow > flowBalances[0]) {
      alert('お金が足りないよ！')
      return
    } else if (flowBalances == undefined) {
      alert('もう一度注文するボタンを押してね。')
      return
    } else if (!execDate) {
      alert('日付を選んでね。')
      return
    } else if (isToday(new Date(execDate)) && !execDateTime) {
      alert('時間を選んでね。')
      return
    } else if (!startPlace) {
      alert('出発地を選んでね。')
      return
    } else if (!goalPlace) {
      alert('目的地を選んでね。')
      return
    } else if (!price) {
      alert('ランクを選んでね。')
      return
    }
    driverModal.showModal()
  }

  async function secureOrderTaxi() {
    // console.log(isToday(new Date(execDate)) ? execDateTime : execDate, driverId, startPlace, goalPlace, price / rateOfFlow)
    let txId = await newOrder(isToday(new Date(execDate)) ? execDateTime: execDate, driverId, startPlace, goalPlace, price / rateOfFlow)
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'SEALED') {
        loading = false
        flowBalances = await getBalances(loginUser.addr)
        const tmp = Math.floor(flowBalances[0] * 10) / 10
        displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
        const tmpDriver = Math.floor(flowBalances[1] * 10) / 10
        displayBalanceDriver = `${Math.floor(tmpDriver * rateOfFlow)}円(₣${tmpDriver})`
        const tmpSystem = Math.floor(flowBalances[2] * 10) / 10
        displayBalanceSystem = `${Math.floor(tmpSystem * rateOfFlow)}円(₣${tmpSystem})`
        alert('OK, デポジットは完了し、準備は完璧です！良い旅を❣️')
        wagePaid = false
        driverIsRated= false
        orderStatus = 1 // 以降はField.svelteでアニメーション処理が進みます
      }
    });
  }


  async function saveDriverInfoOnBC() {
    await authenticate() // ログイン後ならスルーされる

    const keys = ['name', 'carType', 'rateAverage', 'workCount']
    const values = [newDriverName, newDriverCarType, '2.5', '0'] // 最初はレーティングを中間にセット

    // let txId = await setDriverInfo(newDriverId, keys, values)
    // loading = true
    // tx(txId).subscribe(async (res) => {
    //   console.log('txId:', txId, 'tx status:', res);
    //   if (!res.errorMessage && res.statusString == 'SEALED') {
    //     loading = false
    //     alert('ドライバー情報をブロックチェーンに保存しました。')
    //   }
    // });

    const query = {
      type: 'ride_share_new_driver',
      message: JSON.stringify({
        driverId: newDriverId ?? 0,
        driverAddress: loginUser?.addr,
        keys,
        values
      }),
      playerId: '',
    };

    console.log('***** Start to send a transaction of the new driver. *****')
    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }

  async function callFixBug() {
    let txId = await fixBug(1)
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'SEALED') {
        loading = false
        alert('Bugを修正しました。')
      }
    });
  }

  onMount(() => { 
    app.renderer.render(app.stage)
  })

  function isToday(dateToCheck) {
    const today = new Date()
    return dateToCheck.getFullYear() === today.getFullYear() &&
          dateToCheck.getMonth() === today.getMonth() &&
          dateToCheck.getDate() === today.getDate()
  }
</script>

<section class="section">
  <div class="game-screen overflow-auto">
    <h1 class="text-3xl font-bold text-green-600 underline">RideShare</h1>
    <Application
      width={screen.width * 0.98}
      height={screen.width > 512 ? 256 : screen.width * 0.5}
      backgroundColor="0x5c812f"
      bind:instance={app}
      antialias>
      <Field
        screenWidth={screen.width * 0.98}
        screenHeight={screen.width > 512 ? 256 : screen.width * 0.5}
        startPlace={startPlace}
        goalPlace={goalPlace}
        orderExecTime={execDateTime}
        bind:orderStatus={orderStatus}
      />
    </Application>
    <div class="flex flex-wrap justify-center mt-2">
      <div class="w-24 ml-2">
        {#if isCustomer}      
          <button popovertarget="cally-popover1" class="input input-border" id="cally1" style="anchor-name:--cally1" on:click={(e) => document.getElementById('cally-popover1').style.display = document.getElementById('cally-popover1').style.display == 'inline-block' ? 'none' : 'inline-block'}>
            日付
          </button>
          <div popover id="cally-popover1" class="dropdown bg-base-100 rounded-box shadow-lg" style="position-anchor:--cally1">
            <calendar-date class="cally" on:change={(e) => {
              if (document.getElementById('cally1')) {
                if (isToday(new Date(e.target.value))) document.getElementById('cally1').innerText = '今日';
                else document.getElementById('cally1').innerText = e.target.value;
                document.getElementById('cally1').click()
                execDate = e.target.value
              }
            }}>
              <svg aria-label="Previous" class="fill-current size-4" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.75 19.5 8.25 12l7.5-7.5"></path></svg>
              <svg aria-label="Next" class="fill-current size-4" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m8.25 4.5 7.5 7.5-7.5 7.5"></path></svg>
              <calendar-month></calendar-month>
            </calendar-date>
          </div>
          <select class="select select-success" class:hidden={!isToday(new Date(execDate))}
            on:change={(event) => {
              const today = new Date();
              if (event.target.value == '今') {
                execDateTime = `${execDate} ${today.getHours().toString().padStart(2, "0")}:${today.getMinutes().toString().padStart(2, "0")}:${today.getSeconds().toString().padStart(2, "0")}`
              } else if (event.target.value == '15分後' && today.getMinutes() >= 45) {
                execDateTime = `${execDate} ${(today.getHours() + 1).toString().padStart(2, "0")}:${(today.getMinutes() + 15 - 60).toString().padStart(2, "0")}:${today.getSeconds().toString().padStart(2, "0")}`
              } else if (event.target.value == '15分後') {
                execDateTime = `${execDate} ${today.getHours().toString().padStart(2, "0")}:${(today.getMinutes() + 15).toString().padStart(2, "0")}:${today.getSeconds().toString().padStart(2, "0")}`
              } else if (event.target.value == '30分後' && today.getMinutes() >= 30) {
                execDateTime = `${execDate} ${(today.getHours() + 1).toString().padStart(2, "0")}:${(today.getMinutes() + 30 - 60).toString().padStart(2, "0")}:${today.getSeconds().toString().padStart(2, "0")}`
              } else if (event.target.value == '30分後') {
                execDateTime = `${execDate} ${today.getHours().toString().padStart(2, "0")}:${(today.getMinutes() + 30).toString().padStart(2, "0")}:${today.getSeconds().toString().padStart(2, "0")}`
              }

            }}
          >
            <option disabled selected>時間</option>
            <option>今</option>
            <option>15分後</option>
            <option>30分後</option>
          </select>
          <select class="select select-success"
            on:change={(event) => {startPlace = event.target.value;}}
          >
            <option disabled selected>出発地</option>
            <option>品川駅南口</option>
            <option>品川駅北口</option>
          </select>
          <select class="select select-success"
            on:change={(event) => {goalPlace = event.target.value}}
          >
            <option disabled selected>目的地</option>
            <option>東京駅</option>
            <option>羽田空港</option>
            <option>渋谷</option>
            <option>新宿</option>
          </select>
          <select class="select select-success"
            on:change={(event) => price = event.target.value == 'ラグジュアリ' ? 2000.0 : 1500.0}
          >
            <option disabled selected>ランク</option>
            <option>普通</option>
            <option>ラグジュアリ</option>
          </select>
        {:else}
          <input type="text" class="input" placeholder="お名前" on:change={(event) => newDriverName = event.target.value} />
          <select class="select select-success"
            on:change={(event) => newDriverCarType = event.target.value}
          >
            <option disabled selected>車種</option>
            <option>普通タイプ</option>
            <option>ラグジュアリタイプ</option>
          </select>
        {/if}

        {#if !loginUser?.addr}
          <button class="input input-border" on:click={async() => await authenticate()}>
            ログイン➜]
          </button>
        {/if}
      </div>
      <div class="w-48 text-center mx-auto">
      {#if isCustomer}
        <div class="cashier inline-block">
          お値段<br>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="1.5" fill="none"><path d="M12 22C11.1818 22 10.4002 21.6646 8.83693 20.9939C4.94564 19.3243 3 18.4895 3 17.0853L3 7.7475M12 22C12.8182 22 13.5998 21.6646 15.1631 20.9939C19.0544 19.3243 21 18.4895 21 17.0853V7.7475M12 22L12 12.1707M21 7.7475C21 8.35125 20.1984 8.7325 18.5953 9.495L15.6741 10.8844C13.8712 11.7419 12.9697 12.1707 12 12.1707M21 7.7475C21 7.14376 20.1984 6.7625 18.5953 6M3 7.7475C3 8.35125 3.80157 8.7325 5.40472 9.495L8.32592 10.8844C10.1288 11.7419 11.0303 12.1707 12 12.1707M3 7.7475C3 7.14376 3.80157 6.7625 5.40472 6M6.33203 13.311L8.32591 14.2594" stroke="currentColor"></path><path d="M12 2V4M16 3L14.5 5M8 3L9.5 5" stroke="currentColor"></path></g></svg>
          {parseInt(price.toString())}円
        </div>
        {#if execDateTime && isToday(new Date(execDate))}
          <div class="text-yellow-500 inline-block dep-time">
            <span>出発時間:</span><br><span class="text-sm">{execDateTime.split(' ')[0]}</span><br><span>{execDateTime.split(' ')[1].split(':')[0]}時{execDateTime.split(' ')[1].split(':')[1]}分</span>
          </div>
        {/if}
        <div class="w-52">
          <button class="btn btn-accent min-w-[160px] mt-3" on:click={() => { modal.showModal() }}>所持金: {displayBalanceUser}<br>注文する</button>
        </div>
        <div class="text-green-500">ドライバー所持金: {displayBalanceDriver}</div>
        <div class="text-pink-500">システムの所持金: {displayBalanceSystem}</div>
      {:else}
        <h3 class="text-2xl font-bold text-green-600 underline">ドライバー登録</h3>
        <div class="w-52">
          <button class="btn btn-accent min-w-[160px] mt-3" on:click={() => { modal.showModal() }}>登録する</button>
        </div>
      {/if}
      </div>
    </div>

    {#if loading}
      <div class="ml-3 text-success"><span class="loading loading-infinity loading-xl"></span>(保存中)</div>
    {/if}
    <div class="text-green-600 underline mt-2 ml-10">
      <a href="https://www.flowscan.io/contract/A.b576a3926d239682.RideShare?tab=deployments" target="_blank">スマートコントラクト</a><br>
      <a href="https://github.com/temt-ceo/oraga-esports/pull/24" target="_blank">プルリク</a>
    </div>
    <input
      type="checkbox"
      on:click={() => {
        isCustomer = !isCustomer
      }}
      checked={true}
      class="toggle border-indigo-600 bg-indigo-500 checked:border-orange-500 checked:bg-orange-400 checked:text-orange-800 mr-2"
    />        
  <iframe width="{screen.width < 700 ? screen.width * 0.8 : screen.width * 0.4}" height="{screen.width < 700 ? screen.width * 0.45 : screen.width * 0.225}" src="https://www.youtube.com/embed/iIgzPaSjDB4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
  <p class="paragraph flex flex-wrap">
    <span class="allura">Powered by Flow blockchain. </span><img src="/assets/flow_logo.avif" alt="flow logo" /><br>
    Copyright © 2025 TEM Technologies Co., LLC All rights reserved.
  </p>

  <Dialog bind:dialog={modal}>
    <div>{isCustomer ? '注文しますか？' : 'ドライバー情報をブロックチェーンに保存しますか？'}</div>
    <button on:click={() => {
      if (isCustomer) orderTaxi()
      else saveDriverInfoOnBC()
      modal.close()
    }}>はい</button>
    <button on:click={() => modal.close()}>いいえ</button>
  </Dialog>

  <Dialog bind:dialog={driverModal}>
    <div>どのドライバーにしますか？</div>
    <div class="text-green-600 text-lg">ドライバーを選んでください。</div>
    <div class="w-full max-w-xs my-1">
      {#if price == 2000.0}
        {#each driverDataLuxury as driverData}
          <label class="input">
            <input type="radio" name="radio-1" value={driverData.driverId} class="radio" on:change={(event) => driverId = event.target.value} />
            <span class="label">{driverData.name}(🌟{Math.floor(driverData.rateAverage * 10) / 10})</span>
          </label>
        {/each}
      {:else}
        {#each driverDataNormal as driverData}
          <label class="input">
            <input type="radio" name="radio-1" value={driverData.driverId} class="radio" on:change={(event) => driverId = event.target.value} />
            <span class="label">{driverData.name}(🌟{Math.floor(driverData.rateAverage * 10) / 10})</span>
          </label>
        {/each}
      {/if}
    </div>
    <button on:click={() => {
      driverModal.close()
      secureOrderTaxi()
    }}>{'決定'}</button>
    <button on:click={() => driverModal.close()}>{'やめる'}</button>
  </Dialog>

  <Dialog bind:dialog={ratingModal}>
    <div>Please tell me how much do you recommend the driver ?</div>
    <div class="text-green-600 text-lg">ドライバーの接客態度を選んでください。</div>
    <div class="rating gap-1">
      <input type="radio" name="rating-3" class="mask mask-heart bg-red-400" aria-label="1 star" value={1} on:change={(event) => driverRating = event.target.value} />
      <input type="radio" name="rating-3" class="mask mask-heart bg-orange-400" aria-label="2 star" value={2} checked="checked" on:change={(event) => driverRating = event.target.value} />
      <input type="radio" name="rating-3" class="mask mask-heart bg-yellow-400" aria-label="3 star" value={3} on:change={(event) => driverRating = event.target.value} />
      <input type="radio" name="rating-3" class="mask mask-heart bg-lime-400" aria-label="4 star" value={4} on:change={(event) => driverRating = event.target.value} />
      <input type="radio" name="rating-3" class="mask mask-heart bg-green-400" aria-label="5 star" value={5} on:change={(event) => driverRating = event.target.value} />
    </div>
    <button on:click={() => {
      ratingModal.close()
      updateDriverInfo()
    }}>{'送信'}</button>
  </Dialog>
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
  width: 98vw;
  height: 100vh;
  background: rgba(11, 4, 35, 1);
  overflow: hidden;
  border-radius: 30px;
  border: 2px solid rgba(255, 255, 5, 0.7);
  padding-top: 10px;
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

.dep-time {
  width: 89px;
  vertical-align: top;
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
