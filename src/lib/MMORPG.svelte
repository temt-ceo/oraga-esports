<script>
  import { onMount} from 'svelte'
  import { Application } from 'svelte-pixi'
  import Field from './mmorpg/Field.svelte'
  import 'cally';
  import "../app.css";
  import Dialog from './Dialog.svelte';
  // 以下GraphQLツール
  import { generateClient } from 'aws-amplify/api';
  import { createGameServerProcess } from '../graphql/mutations';
  import * as subscriptions from '../graphql/subscriptions';
  // 以下ブロックチェーンライブラリ
  import { config, authenticate, unauthenticate, currentUser, tx } from '@onflow/fcl';
  import { getMMORPGInfo, havingResourceMaxLife, getBalance } from '../../flow_blockchain/mainnet/scripts';
  import { buyResource, shareResourceCapabilityWithBuddy, newGameBattle, executeBuddyAbility } from '../../flow_blockchain/mainnet/transactions'
  import flowJSON from '../../flow_blockchain/flow.json';

  // 以下GraphQLツール関連
  const client = generateClient();
  let loading = false
  let loading1 = false
  let loading2 = false
  let requestData = null
  let acceptData = null
  client
    .graphql({ query: subscriptions.onCreateGameServerProcess })
    .subscribe({
      next: ({ data }) => {
        console.log(data)
        if (data.onCreateGameServerProcess?.type == 'call_friend_candidate') {
          requestData = JSON.parse(data.onCreateGameServerProcess?.message)
          console.log('Buddy Request Data', requestData)
          if (requestData.address == loginUser?.addr) {
            loading1 = true
            setTimeout(() => loading1 = false, 60000)
          } else if (requestData.desiredPartner == yourResource) {
            buddyAddress = requestData.address
            buddyResourceMaxLife = requestData.equipResourceMaxLife
            desiredBuddyResource = requestData.equipResource
            briefingDialog.showModal()
          }
        } else if (data.onCreateGameServerProcess?.type == 'accept_calling_friend') {
          // {equipResource: 'Thief', address: '0x99765333ee05a931', to: '0x0940da3a9086c664'}
          acceptData = JSON.parse(data.onCreateGameServerProcess?.message)
          console.log('Accept Data', acceptData)
          if (acceptData.address == loginUser?.addr) {
            loading2 = true
            setTimeout(() => loading2 = false, 60000)
          } else if (acceptData.to == loginUser?.addr) {
            loading1 = false
            buddyAddress = acceptData.address
            buddyResourceMaxLife = acceptData.equipResourceMaxLife
            briefingDialog2.showModal()
          }
        } else if (data.onCreateGameServerProcess?.type == 'battle_is_ready') {
          const message = JSON.parse(data.onCreateGameServerProcess?.message)
          if (message.address == loginUser?.addr || message.to == loginUser?.addr) {
            loading2 = false
            briefingDialog3.showModal()
          }
        } else if (data.onCreateGameServerProcess?.type == 'entered_the_game_world') {
          const message = JSON.parse(data.onCreateGameServerProcess?.message)
          if (message.to == loginUser?.addr) {
            buddyEnterTheGame = true
          }
        } else if (data.onCreateGameServerProcess?.type == 'mmorpg_basic_attack') {
          const ret = data.onCreateGameServerProcess?.message.split(' , txId: ')
          const txId = ret[1]
          tx(txId).subscribe(async (res) => {
            console.log('txId:', txId, 'tx status:', res);
            if (!res.errorMessage && res.statusString == 'EXECUTED') {
              attackingResource = JSON.parse(ret[0]).resourceName
              if (battleTurn <= parseInt(data.onCreateGameServerProcess?.playerId)) {
                battleTurn = parseInt(data.onCreateGameServerProcess?.playerId) + 1
              }
            }
            if (!res.errorMessage && res.statusString == 'SEALED') {
              if (battleTurn <= parseInt(data.onCreateGameServerProcess?.playerId) + 1) {
                battleTurn = parseInt(data.onCreateGameServerProcess?.playerId) + 2
              }
            }
          });
        } else if (data.onCreateGameServerProcess?.type == 'used_buddy_capability') {
          if (battleTurn <= parseInt(data.onCreateGameServerProcess?.playerId)) {
            battleTurn = parseInt(data.onCreateGameServerProcess?.playerId) + 1
          }
        } else if (data.onCreateGameServerProcess?.type == 'pay_reward_to_winner_of_mmorpg') {
          const ret = data.onCreateGameServerProcess?.message.split(' , txId: ')
          const txId = ret[1]
          tx(txId).subscribe(async (res) => {
            console.log('txId:', txId, 'tx status:', res);
            if (!res.errorMessage && res.statusString == 'SEALED') {
              flowBalance = await getBalance(loginUser.addr)
              const tmp = Math.floor(flowBalance * 10) / 10
              displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
              alert('Congratulation!! Battle Prize was sent to your wallet JUST NOW!!')
            }
          });
        }
      }
    }
  );

  // ブロックチェーン変数 | 定数
  let loginUser;
  let flowBalance;
  let info;
  // 変数
  let app
  const rateOfFlow = 40.6  // 2025年10月19日時点の時価
  let dialog;
  let briefingDialog;
  let briefingDialog2;
  let briefingDialog3;
  let battleId;
  let resourceNotFoundDialog;
  let displayBalanceUser = '-'
  let mainPlayer = true;
  let yourResource = ''
  let desiredBuddyResource = ''
  let buddyAddress = null
  let yourResourceMaxLife = null
  let buddyResourceMaxLife = null
  let youEnterTheGame = false
  let buddyEnterTheGame = false
  let gameFee = 2.0
  let battleTurn = 0
  let rewardPaid = false
  let isEN = false
  let attackingResource = ''
  let yourHP = null
  let buddyHP = null
  let enemy1HP = null
  let enemy2HP = null
  let battleInfo = null

  async function callFriendCandidate() {

    let ret = await havingResourceMaxLife(loginUser?.addr, yourResource);
    if (ret == null) {
      let ret2 = confirm(isEN ? `Only resource holders can search for partners. You can purchase the ${yourResource} resource for $5FLOW. Would you like to purchase it?` : `仲間を探せるのはリソースの保持者だけです。$5FLOWで ${yourResource} リソースを購入できます。購入しますか？`);
      if (ret2 === true) {
        let txId = await buyResource(yourResource)
        loading = true
        tx(txId).subscribe(async (res) => {
          console.log('txId:', txId, 'tx status:', res);
          if (!res.errorMessage && res.statusString == 'SEALED') {
            loading = false
            flowBalance = await getBalance(loginUser.addr)
            const tmp = Math.floor(flowBalance * 10) / 10
            displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
            alert(isEN ? 'Resources purchased. Seeking allies.' : 'リソースを購入しました。仲間を探します。')
            console.log('***** Start to send a transaction of searching friend candidate. *****')
            const resourceMaxLife = await havingResourceMaxLife(loginUser?.addr, yourResource);
            yourResourceMaxLife = parseInt(resourceMaxLife)
            const query = {
              type: 'call_friend_candidate',
              message: JSON.stringify({
                equipResource: yourResource,
                equipResourceMaxLife: yourResourceMaxLife,
                desiredPartner: desiredBuddyResource,
                address: loginUser?.addr,
              }),
              playerId: '',
            };
            await client.graphql({
              query: createGameServerProcess,
              variables: {
                input: query
              }
            });
          }
        });
      }
    } else {
      yourResourceMaxLife = parseInt(ret)
      const query = {
        type: 'call_friend_candidate',
        message: JSON.stringify({
          equipResource: yourResource,
          equipResourceMaxLife: yourResourceMaxLife,
          desiredPartner: desiredBuddyResource,
          address: loginUser?.addr,
        }),
        playerId: '',
      };
      console.log('***** Start to send a transaction of searching friend candidate. *****')
      await client.graphql({
        query: createGameServerProcess,
        variables: {
          input: query
        }
      });
    }
  }

  async function sendAcceptCalling() {
    mainPlayer = false
    const query = {
      type: 'accept_calling_friend',
      message: JSON.stringify({
        equipResource: yourResource,
        equipResourceMaxLife: yourResourceMaxLife,
        address: loginUser?.addr,
        to: requestData.address,
      }),
      playerId: '',
    };

    await client.graphql({
      query: createGameServerProcess,
      variables: {
        input: query
      }
    });
  }

  async function acceptCallingFriend() {

    const ret = await havingResourceMaxLife(loginUser?.addr, yourResource);
    if (ret == null) {
      resourceNotFoundDialog.showModal();
    } else {
      yourResourceMaxLife = parseInt(ret)
      await equipResourceAndSaveGamePlayerInfoToBlockchain();
    }
  }

  /* 仲間申請して相手が応答した時にダイアログを表示して能力をシェアする時に呼ばれる */
  async function shareYourResourceCapabilityToBuddy() {
    let txId = await shareResourceCapabilityWithBuddy(yourResource, buddyAddress)
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'SEALED') {
        loading = false
        alert(isEN ? 'Your battle settings with your friends have been saved to the blockchain.' : 'ブロックチェーンに貴方と仲間のバトル設定を保存しました。')
        const query = {
          type: 'battle_is_ready',
          message: JSON.stringify({
            address: loginUser?.addr,
            to: buddyAddress,
          }),
          playerId: '',
        };

        await client.graphql({
          query: createGameServerProcess,
          variables: {
            input: query
          }
        });        
      }
    });
  }

  async function buyResourceAndAcceptBuddy() {
    let txId = await buyResource(yourResource)
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'SEALED') {
        loading = false
        flowBalance = await getBalance(loginUser.addr)
        const tmp = Math.floor(flowBalance * 10) / 10
        displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
        alert(isEN ? 'Resource purchase completed. Next, grant your new ally permission to use some of the skills associated with the resources you just purchased.' : 'リソース購入が完了しました。続いて新たな仲間に今購入したリソースの一部スキルの使用を許可します。')
        const ret = await havingResourceMaxLife(loginUser?.addr, yourResource);
        yourResourceMaxLife = parseInt(ret)
        await equipResourceAndSaveGamePlayerInfoToBlockchain()
      }
    });
  }
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
      displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
    }
  })

  // 現在ゲーム中の状態取得
  setInterval(async () => {
    info = await getMMORPGInfo();
    console.log(info, info.battleQueue[battleId], battleTurn)
  }, 1500)  

  // 【関数】リソースを装備し、仲間に一つの能力の使用を許可する
  async function equipResourceAndSaveGamePlayerInfoToBlockchain() {
    let txId = await shareResourceCapabilityWithBuddy(yourResource, buddyAddress)
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'SEALED') {
        loading = false
        sendAcceptCalling()
        alert(isEN ? 'Your battle settings with your friends have been saved to the blockchain.' : 'ブロックチェーンに貴方と仲間のバトル設定を保存しました。')
      }
    });
  }

  async function enterTheGameWorld() {
    let txId = await newGameBattle(loginUser?.addr, buddyAddress, mainPlayer ? yourResourceMaxLife : buddyResourceMaxLife, mainPlayer ? buddyResourceMaxLife : yourResourceMaxLife, gameFee)
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'SEALED') {
        loading = false
        flowBalance = await getBalance(loginUser.addr)
        const tmp = Math.floor(flowBalance * 10) / 10
        displayBalanceUser = `${Math.floor(tmp * rateOfFlow)}円(₣${tmp})`
        rewardPaid = false
        battleTurn = -1 // 以降はField.svelteでアニメーション処理が進みます
        youEnterTheGame = true
        const query = {
          type: 'entered_the_game_world',
          message: JSON.stringify({
            address: loginUser?.addr,
            to: buddyAddress
          }),
          playerId: '',
        };

        await client.graphql({
          query: createGameServerProcess,
          variables: {
            input: query
          }
        });
      }
    });
  }

  async function useBuddyAbility() {
    // 回復はThiefを優先。
    let txId = await executeBuddyAbility(desiredBuddyResource, buddyAddress, battleId, mainPlayer ? 'TeamPlayer1' : 'TeamPlayer2')
    loading = true
    tx(txId).subscribe(async (res) => {
      console.log('txId:', txId, 'tx status:', res);
      if (!res.errorMessage && res.statusString == 'EXECUTED') {
        const query = {
          type: 'used_buddy_capability',
          message: JSON.stringify({
            desiredBuddyResource: desiredBuddyResource,
            buddyAddress: buddyAddress,
            target: mainPlayer && yourResource == 'Warrior' ? 'TeamPlayer2' : 'TeamPlayer1'
          }),
          playerId: battleTurn,
        };

        await client.graphql({
          query: createGameServerProcess,
          variables: {
            input: query
          }
        });
      }
    });
  }

  // 【関数】ブロックチェーンに賞金支払い実行
  async function payRewardToWinners(wage) {
    const query = {
      type: 'plar_game_complete',
      message: '',
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

  // バトルゲームの管理
  setInterval(async () => {
    let query;
    switch (battleTurn) {
      case -1:
        if (youEnterTheGame && buddyEnterTheGame) {
          battleId = info.battleQueue.findLastIndex((e) => {
            console.log(e.player1Address, loginUser?.addr, e.player2Address, buddyAddress, e.player1Address == loginUser?.addr && e.player2Address == buddyAddress || e.player1Address == buddyAddress && e.player2Address == loginUser?.addr)
            return e.player1Address == loginUser?.addr && e.player2Address == buddyAddress ||
            e.player1Address == buddyAddress && e.player2Address == loginUser?.addr
          })
          if (battleId != null && battleId > -1) {
            // Start
            battleTurn = 1
            if (!mainPlayer) return; // ２重になるので

            // First strike!
            query = {
              type: 'mmorpg_basic_attack',
              message: JSON.stringify({
                battleId: battleId,
                target: '-',
                resourceName: desiredBuddyResource,
              }),
              playerId: battleTurn,
            };
            await client.graphql({
              query: createGameServerProcess,
              variables: {
                input: query
              }
            });
          }
        }
        break;
      case 3:
        battleTurn = 4
        if (!mainPlayer) return; // ２重になるので

        query = {
          type: 'mmorpg_basic_attack',
          message: JSON.stringify({
            battleId: battleId,
            target: '',
            resourceName: yourResource,
          }),
          playerId: battleTurn,
        };

        await client.graphql({
          query: createGameServerProcess,
          variables: {
            input: query
          }
        });
        break;
      case 6:
        battleTurn = 7
        if (!mainPlayer) return; // ２重になるので

        query = {
          type: 'mmorpg_basic_attack',
          message: JSON.stringify({
            battleId: battleId,
            target: 'TeamPlayer2',
            resourceName: 'Enemy',
          }),
          playerId: battleTurn,
        };

        await client.graphql({
          query: createGameServerProcess,
          variables: {
            input: query
          }
        });
        break;
      case 9:
        battleTurn = 10
        if (!mainPlayer) return; // ２重になるので

        query = {
          type: 'mmorpg_basic_attack',
          message: JSON.stringify({
            battleId: battleId,
            target: 'TeamPlayer1',
            resourceName: 'Enemy',
          }),
          playerId: battleTurn,
        };

        await client.graphql({
          query: createGameServerProcess,
          variables: {
            input: query
          }
        });
        break;
      case 12:
        battleTurn = 13
        if (!mainPlayer) {
          setTimeout(() => dialog.showModal(), 2000)
        }
        break;
      case 14:
        battleTurn = 15
        if (mainPlayer) {
          setTimeout(() => dialog.showModal(), 2000)
        }
        break;
      case 16:
        battleTurn = 17
        battleInfo = info?.battleQueue[battleId]
        yourHP = battleInfo.lifeOfPlayer1?.length > -1 ? parseInt(battleInfo.lifeOfPlayer1) : 0
        buddyHP = battleInfo.lifeOfPlayer2?.length > -1 ? parseInt(battleInfo.lifeOfPlayer2) : 0
        enemy1HP = battleInfo.enemy1Life?.length > -1 ? parseInt(battleInfo.enemy1Life) : 0
        enemy2HP = battleInfo.enemy2Life?.length > -1 ? parseInt(battleInfo.enemy2Life) : 0
        if (yourHP + buddyHP == 0 || enemy1HP + enemy2HP == 0) {
          setTimeout(() => battleTurn = 99, 6000)
        } else {
          if (mainPlayer) {
            setTimeout(() => battleTurn = 18, 2000)
          }
        }
        break;
      case 18:
      case 21:
        battleTurn = battleTurn + 1
        battleInfo = info?.battleQueue[battleId]
        yourHP = battleInfo.lifeOfPlayer1?.length > -1 ? parseInt(battleInfo.lifeOfPlayer1) : 0
        buddyHP = battleInfo.lifeOfPlayer2?.length > -1 ? parseInt(battleInfo.lifeOfPlayer2) : 0
        enemy1HP = battleInfo.enemy1Life?.length > -1 ? parseInt(battleInfo.enemy1Life) : 0
        enemy2HP = battleInfo.enemy2Life?.length > -1 ? parseInt(battleInfo.enemy2Life) : 0
        if (yourHP + buddyHP == 0 || enemy1HP + enemy2HP == 0) {
          setTimeout(() => battleTurn = 99, 6000)
          return
        }
        if (!mainPlayer) return; // ２重になるので
        if (buddyHP == 0 && battleTurn == 19) {
          query = {
            type: 'mmorpg_basic_attack',
            message: JSON.stringify({
              battleId: battleId,
              target: '-',
              resourceName: desiredBuddyResource,
            }),
            playerId: battleTurn,
          };
          await client.graphql({
            query: createGameServerProcess,
              variables: {
                input: query
              }
            });
        } else {
          query = {
            type: 'mmorpg_basic_attack',
            message: JSON.stringify({
              battleId: battleId,
              target: '',
              resourceName: yourResource,
            }),
            playerId: battleTurn,
          };

          await client.graphql({
            query: createGameServerProcess,
              variables: {
                input: query
              }
            });
        }
        break;
      case 24:
      case 27:
      case 30:
        battleTurn = battleTurn + 1
        battleInfo = info?.battleQueue[battleId]
        yourHP = battleInfo.lifeOfPlayer1?.length > -1 ? parseInt(battleInfo.lifeOfPlayer1) : 0
        buddyHP = battleInfo.lifeOfPlayer2?.length > -1 ? parseInt(battleInfo.lifeOfPlayer2) : 0
        enemy1HP = battleInfo.enemy1Life?.length > -1 ? parseInt(battleInfo.enemy1Life) : 0
        enemy2HP = battleInfo.enemy2Life?.length > -1 ? parseInt(battleInfo.enemy2Life) : 0
        if (yourHP + buddyHP == 0 || enemy1HP + enemy2HP == 0) {
          setTimeout(() => battleTurn = 99, 6000)
          return
        }
        if (!mainPlayer) return; // ２重になるので
        if (buddyHP == 0 && battleTurn == 19) {
          query = {
            type: 'mmorpg_basic_attack',
            message: JSON.stringify({
            battleId: battleId,
            target: 'TeamPlayer2',
            resourceName: 'Enemy',
          }),
            playerId: battleTurn,
          };
          await client.graphql({
            query: createGameServerProcess,
              variables: {
                input: query
              }
          });
        } else {
          query = {
            type: 'mmorpg_basic_attack',
            message: JSON.stringify({
              battleId: battleId,
              target: 'TeamPlayer1',
              resourceName: 'Enemy',
            }),
            playerId: battleTurn,
          };

          await client.graphql({
            query: createGameServerProcess,
              variables: {
                input: query
              }
            });
        }
      break;
    case 99:
      if (yourHP + buddyHP > 0 && !rewardPaid && mainPlayer) {
        rewardPaid = true
        // 賞金送付
        query = {
          type: 'pay_reward_to_winner_of_mmorpg',
          message: JSON.stringify({
            recipient1: loginUser?.addr,
            recipient2: buddyAddress,
            reward: battleInfo.reward,
          }),
          playerId: battleTurn,
        };

        await client.graphql({
          query: createGameServerProcess,
            variables: {
              input: query
            }
        });                
      }
      break;
    default:
        break;
    }
  }, 100)

  onMount(() => { 
    app.renderer.render(app.stage)
  })
</script>

<section class="section">
  <div class="game-screen overflow-auto">
    <h1 class="text-3xl font-bold text-green-600 underline">MMORPG</h1>
    <div style:margin-left={window.innerWidth > 512 ? (window.innerWidth - 512) / 2 + 'px' : 0} >
      <Application
        width={screen.width > 512 ? 512 : screen.width * 0.98}
        height={screen.width > 512 ? 256 : screen.width * 0.5}
        backgroundColor="0x5c812f"
        bind:instance={app}
        antialias>
        <Field
          screenWidth={screen.width > 512 ? 512 : screen.width * 0.98}
          screenHeight={screen.width > 512 ? 256 : screen.width * 0.5}
          yourResource={mainPlayer ? yourResource : desiredBuddyResource}
          buddyResource={mainPlayer ?  desiredBuddyResource : yourResource}
          mainPlayer={mainPlayer}
          basicInfo={info}
          battleInfo={info?.battleQueue[battleId] || {}}
          bind:battleTurn={battleTurn}
          isEN={isEN}
          attackingResource={attackingResource}
        />
      </Application>
    </div>
    <div class="flex flex-wrap justify-center mt-2">
      <div class="w-36 ml-2">
        <select class="select select-success"
          on:change={(event) => yourResource = event.target.value}
        >
          <option disabled selected>{isEN ? 'Equiped Resource' : '装備リソース'}</option>
          <option>Warrior</option>
          <option>Thief</option>
        </select>
        <select class="select select-success"
          on:change={(event) => desiredBuddyResource = event.target.value}
        >
          <option disabled selected>{isEN ? 'Desired Partner' : '希望する仲間'}</option>
          <option>Warrior</option>
          <option>Thief</option>
        </select>
        {#if !loginUser?.addr}
          <button class="input input-border" on:click={async() => await authenticate()}>
            {isEN ? 'Wallet Login➜' : 'Wallet ログイン➜]'}
          </button>
        {/if}
        {#if loginUser?.addr && yourResource && desiredBuddyResource}
          {#if !buddyAddress}
            <button class="input input-border" on:click={async() => await callFriendCandidate()}>
              {isEN ? 'Find Buddy' : '仲間を探す'}
            </button>
          {:else if battleTurn < 1}
            <button class="input input-border" on:click={async() => await enterTheGameWorld()}>
              {isEN ? 'Join the game(₣2.0)' : 'ゲームに参加(₣2.0)'}
            </button>
          {/if}
        {/if}
      </div>
      <div class="w-48 text-center mx-auto">
      <div class="cashier inline-block">
        {isEN ? 'Prizes' : '賞金'}<br>
        {isEN ? '$300 USD' : '30000円'}
      </div>
      <div class="w-52">
        <button class="btn btn-accent min-w-[160px] mt-3">{isEN ? 'Balance' : '所持金'}: {displayBalanceUser}<br>{isEN ? 'Deposit Fee: $150 USD' : 'デポジット費用: 15000円'}</button>
      </div>
    </div>

    {#if loading1}
      <div class="ml-3 text-success"><span class="loading loading-infinity loading-xl"></span>(Looking for partners for the team...)</div>
    {/if}
    {#if loading2}
      <div class="ml-3 text-success"><span class="loading loading-infinity loading-xl"></span>({isEN ? 'Sending you have received a buddy request.' : '仲間申請を受けたことを送信しています。'})</div>
    {/if}
    {#if loading}
      <div class="ml-3 text-success"><span class="loading loading-infinity loading-xl"></span>(Saving to blockchain...)</div>
    {/if}
    <div class="text-green-600 mt-2 ml-2 mr-2">
      <a href="https://www.flowscan.io/contract/A.b576a3926d239682.MMORPG8?tab=deployments" class="underline" target="_blank">{isEN ? 'Smart Contract' : 'スマートコントラクト'}</a><br>
      <a href="https://github.com/temt-ceo/oraga-esports/pull/26/files" class="underline" target="_blank">{isEN ? 'Pull Request' : 'プルリク'}</a><br>
      <input
        type="checkbox"
        on:click={() => {
          isEN = !isEN
        }}
        checked={true}
        class="toggle border-indigo-600 bg-indigo-500 checked:border-orange-500 checked:bg-orange-400 checked:text-orange-800 mr-2"
      />🌏
    </div>
    <iframe width="{screen.width < 700 ? screen.width * 0.8 : screen.width * 0.4}" height="{screen.width < 700 ? screen.width * 0.45 : screen.width * 0.225}" src="https://www.youtube.com/embed/1BnCtda9_R4?si=BHEDBWYKjgoYLQHA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    <p class="cinzel ml-1 mr-3">
      <a href="https://uzi-material.com/" target="_blank">Character design by 氏</a>
    </p>  
    <div class="cinzel">
      (Press the YouTube icon on the bottom right to watch it on a large screen. In the video, the approval button is pressed when purchasing resources, sharing capabilities with friends, paying for games, and activating friends' resource capabilities.)
    </div>
    <p class="paragraph flex flex-wrap">
      <span class="allura">Powered by Flow blockchain. </span><img src="/assets/flow_logo.avif" alt="flow logo" /><br>
      <span style="margin-left: 4px; line-height: revert;">Copyright © 2025 TEM Technologies Co., LLC All rights reserved.</span>
    </p>
  </div>
  
  <Dialog bind:dialog={resourceNotFoundDialog}>
    <div>{isEN ? `You don't own ${yourResource} yet. You can purchase it for $5FLOW. Would you like to buy it?`: `あなたはまだ ${yourResource} を保持していません。$5FLOWで購入できます。購入しますか？`}</div>
    <button on:click={() => {
      buyResourceAndAcceptBuddy()
      resourceNotFoundDialog.close()
    }}>{isEN ? 'Yes' : 'はい'}</button>
    <button on:click={() => dialog.close()}>{isEN ? 'No (Cancel Buddy Request)' : 'いいえ(仲間申請をキャンセル)'}</button>
  </Dialog>

  <Dialog bind:dialog={briefingDialog}>
    <div class="mb-1">{isEN ? 'A battle partner request has been received.' : 'バトル仲間の申請が来ました。'}</div>
    <div class="text-yellow-600 text-lg mb-3">
      {isEN ? `The opponent's resource is ${requestData?.equipResource}(Max HP is ${requestData?.equipResourceMaxLife}). The opponent is seeking a partner for ${requestData?.desiredPartner}.`: `相手のリソースは ${requestData?.equipResource}(Max HPは${requestData?.equipResourceMaxLife})です。  相手は ${requestData?.desiredPartner} の仲間を探しています。`}
    </div>
    <div class="text-red-600 text-lg">{
      isEN ? `Your ${info?.basicAbility[`${yourResource}-ShareableAbility`]} skill can also be used by your allies. Do you permit new allies to use this skill?`
      : `あなたの${info?.basicAbility[`${yourResource}-ShareableAbility`]} ${yourResource == 'Warrior' ? '(大型回復シールド)' : '(毒調合)'}スキルは仲間も使用できます。新たな仲間にこのスキルの使用を許可しますか？`}</div>
    <button on:click={async () => {
      briefingDialog.close()
      await acceptCallingFriend()
    }}>OK</button>
    <button on:click={() => briefingDialog.close()}>{isEN ? 'Pass' : 'やめておく'}</button>
  </Dialog>
  <Dialog bind:dialog={briefingDialog2}>
    <div class="mb-1">{isEN ? `${acceptData?.address} (${desiredBuddyResource}) has accepted your request.` :  `${acceptData?.address} (${desiredBuddyResource})があなたの申請を受諾しました。`}</div>
    <div class="text-red-600 text-lg">{
      isEN ? `Your ${info?.basicAbility[`${yourResource}-ShareableAbility`]} skill can also be used by your allies. Allow new allies to use this skill and start the battle!`
      : `あなたの${info?.basicAbility[`${yourResource}-ShareableAbility`]} ${yourResource == 'Warrior' ? '(大型回復シールド)' : '(毒調合)'}スキルは仲間も使用できます。新たな仲間にこのスキルの使用を許可してバトルを有利にしましょう!`}</div>
    <button on:click={async () => {
      briefingDialog2.close()
      await shareYourResourceCapabilityToBuddy()
    }}>OK</button>
    <button on:click={() => briefingDialog2.close()}>{isEN ? 'Pass' : 'やめておく'}</button>
  </Dialog>
  <Dialog bind:dialog={briefingDialog3}>
    <div class="mb-1">{isEN ? `All preparations for the briefing are complete. Now press the “Join the Game” button to enter the battle. The game will begin once both sides have pressed the button and are ready.` :  `ブリーフィングの全ての準備は整いました。では「ゲームに参加」ボタンを押して戦いに参加しましょう。双方がボタンを押して準備が整った時点でゲームは開始されます。`}</div>
    <button on:click={async () => {
      briefingDialog3.close()
    }}>OK</button>
  </Dialog>
  <Dialog bind:dialog={dialog}>
    <div>{isEN ? "We're in trouble! Should we use buddy' abilities?" : 'やばい、ピンチだ！仲間の能力を使うか？'}</div>
    <div>{(isEN ? "Buddy's Ability: " : 'Buddyの能力: ') + info?.basicAbility[`${desiredBuddyResource}-ShareableAbility`]}</div>
    <button on:click={() => {
      useBuddyAbility()
      dialog.close()
    }}>{isEN ? 'Yes' : 'はい'}</button>
    <button on:click={() => dialog.close()}>{isEN ? 'No' : 'いいえ'}</button>
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
  font-size: 32px;
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

  & span.allura {
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

.cinzel {
  color: white;
  font-family: 'Cinzel';
  font-size: 15px;
  &.li {
    padding-left: 10px;
  }
}

button {
  cursor: pointer;
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
