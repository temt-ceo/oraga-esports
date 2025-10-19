<script>
  import * as PIXI from 'pixi.js'
  import { Ticker, Sprite, Text, Graphics } from 'svelte-pixi'
  import Victor from 'victor'

  export let screenWidth;
  export let screenHeight;
  export let yourResource;
  export let buddyResource;
  export let mainPlayer;
  export let basicInfo;
  export let battleInfo;
  export let battleTurn;
  export let isEN;
  export let attackingResource;

  let frame = 0

  const st = screenWidth - screenWidth / 3;
  const gl = screenWidth - screenWidth * 4 / 5
  const margin = 16
  const barHeight = 16  
  const barWidth = [0, 0, 0, 0]

  const disappearPosition = new Victor(screenWidth * 1.1, screenHeight)
  const playerAttckingPosition = new Victor(screenWidth - screenWidth / 2, screenHeight * 0.25)
  const enemyAttckingPosition = new Victor(gl, screenHeight * 0.6)
  const warriorPosition = {x: 0, y: 0}
  const thiefPosition = new Victor(st, screenHeight * 0.4)
  let enemy1Position = disappearPosition
  let enemy2Position = disappearPosition
  const mainPlayerPos = playerAttckingPosition.y
  const buddyPlayerPos = playerAttckingPosition.y + screenHeight * 0.3
  let player1HasDamage
  let player2HasDamage
  let enemy1HasDamage
  let enemy2HasDamage

  const maxHealth = [yourResource == 'Warrior' ? 8 : 5 , buddyResource == 'Warrior' ? 8 : 5, 6, 10]
  let txtMessage1 = 'Briefing Room'
  let txtMessage2 = ''
  let _yourHP;
  let _buddyHP;
  let _enemy1HP;
  let _enemy2HP;

  function briefingPosition() {    
    warriorPosition.x = -1
    warriorPosition.y = mainPlayerPos
    thiefPosition.x = -1
    thiefPosition.y = buddyPlayerPos
    txtMessage1 = 'Briefing Room'
    txtMessage2 = ''
    enemy1Position = disappearPosition
    enemy2Position = disappearPosition
  }
  function startPosition() {
    
    warriorPosition.x = -1
    warriorPosition.y = mainPlayerPos
    thiefPosition.x = -1
    thiefPosition.y = buddyPlayerPos
    enemy1Position = new Victor(st, screenHeight * 0.3)
    enemy2Position = new Victor(st, screenHeight * 0.6)
    txtMessage1 = 'First strike!'
    player1HasDamage = false
    player2HasDamage = false
    enemy1HasDamage = false
    enemy2HasDamage = false
  }
</script>

<Ticker
  on:tick={(ev) => {
    _yourHP = battleInfo.lifeOfPlayer1?.length > -1 ? parseInt(battleInfo.lifeOfPlayer1) : (yourResource == 'Warrior' ? 8 : 5)
    _buddyHP = battleInfo.lifeOfPlayer2?.length > -1 ? parseInt(battleInfo.lifeOfPlayer2) : (buddyResource == 'Warrior' ? 8 : 5)
    _enemy1HP = battleInfo.enemy1Life?.length > -1 ? parseInt(battleInfo.enemy1Life) : 6
    _enemy2HP = battleInfo.enemy2Life?.length > -1 ? parseInt(battleInfo.enemy2Life) : 10
    barWidth[0] = _yourHP * 7
    barWidth[1] = _buddyHP * 7
    barWidth[2] = _enemy1HP * 7
    barWidth[3] = _enemy2HP * 7
    frame++
    if (battleTurn == 0) {
      briefingPosition()
    } else if (battleTurn == -1) {
      txtMessage1 = isEN ? 'Standby' : 'スタンバイ'
      txtMessage2 = isEN ? 'Waiting for Buddy to start the game...' : 'Buddyのゲーム開始を待っています...'
    } else if (battleTurn == 1) {
      txtMessage1 = `First strike!`
      txtMessage2 = ''
      startPosition()
    } else if (battleTurn == 2) {
      txtMessage1 = isEN ? `${attackingResource}'s attack!` : `${attackingResource}の攻撃!`
    } else if (battleTurn == 3 || battleTurn == 4) {
      txtMessage1 = isEN ? `${attackingResource}'s attack!` : `${attackingResource}の攻撃!`
      enemy1HasDamage = true
      enemy2HasDamage = true
      txtMessage2 = `${basicInfo.basicAbility[`${attackingResource}-BasicAttack`]}!! ${basicInfo.basicAttackInfo[attackingResource][1]} Damage`
      txtMessage2 += attackingResource == 'Enemy' ? '!!' : ' To All Enemies!'
    } else if (battleTurn == 5) {
      warriorPosition.x = playerAttckingPosition.x
      enemy1HasDamage = false
      enemy2HasDamage = false
      txtMessage2 = ''
      txtMessage1 = isEN ? `${attackingResource}'s attack!` : `${attackingResource}の攻撃!`
    } else if (battleTurn == 6) {
      warriorPosition.x = playerAttckingPosition.x
      enemy1HasDamage = true
      enemy2HasDamage = true
      txtMessage1 = isEN ? `${attackingResource}'s attack!` : `${attackingResource}の攻撃!`
      txtMessage2 = `${basicInfo.basicAbility[`${attackingResource}-BasicAttack`]}!! ${basicInfo.basicAttackInfo[attackingResource][1]} Damage`
      txtMessage2 += attackingResource == 'Enemy' ? '!!' : ' To All Enemies!'
    } else if (battleTurn == 7) {
      txtMessage1 = isEN ? `${attackingResource}'s attack!` : `${attackingResource}の攻撃!`
      txtMessage2 = `${basicInfo.basicAbility[`${attackingResource}-BasicAttack`]}!! ${basicInfo.basicAttackInfo[attackingResource][1]} Damage`
      txtMessage2 += attackingResource == 'Enemy' ? '!!' : ' To All Enemies!'
      warriorPosition.x = playerAttckingPosition.x
    } else if (battleTurn == 8) {
      enemy2Position = disappearPosition
      txtMessage2 = ''
      enemy1HasDamage = false
      enemy2HasDamage = false
      txtMessage1 = isEN ? `${attackingResource}2's attack!` : `${attackingResource}2の攻撃!`
    } else if (battleTurn == 9 || battleTurn == 10) {
      enemy2Position = enemyAttckingPosition
      enemy1HasDamage = false
      enemy2HasDamage = false
      player2HasDamage = true
      txtMessage1 = isEN ? `${attackingResource}2's attack!` : `${attackingResource}2の攻撃!`
      txtMessage2 = `${basicInfo.basicAbility[`${attackingResource}-BasicAttack`]}!! ${basicInfo.basicAttackInfo[attackingResource][1]} Damage`
      txtMessage2 += attackingResource == 'Enemy' ? '!!' : ' To All Enemies!'
    } else if (battleTurn == 11) {
      player2HasDamage = false
      player1HasDamage = false
      txtMessage1 = isEN ? `${attackingResource}1's attack!` : `${attackingResource}1の攻撃!`
      txtMessage2 = ''
    } else if (battleTurn == 12) {
      player2HasDamage = false
      player1HasDamage = true
      txtMessage1 = isEN ? `${attackingResource}1's attack!` : `${attackingResource}1の攻撃!`
      txtMessage2 = `${basicInfo.basicAbility[`${attackingResource}-BasicAttack`]}!! ${basicInfo.basicAttackInfo[attackingResource][1]} Damage`
      txtMessage2 += attackingResource == 'Enemy' ? '!!' : ' To All Enemies!'
    } else if (battleTurn == 14 || battleTurn == 15) {
      txtMessage1 = '仲間の能力を使った!'
      const resource = mainPlayer ? buddyResource : yourResource
      txtMessage2 = `${basicInfo.basicAbility[`${resource}-ShareableAbility`]} ${
        isEN ?
        resource == 'Warrior' ? 'Large Recovery Shield (Restores 6 HP) activated!!' : 'Poison Mix (Deals 6 damage to all enemies) activated!!'
        : resource == 'Warrior' ? '大型回復シールド(HP6回復)能力発動!!' : '毒調合(敵全体６ダメージ)能力発動!!'
      }`
    } else if (battleTurn == 16 || battleTurn == 17) {
      txtMessage1 = '仲間の能力を使った!'
      const resource = mainPlayer ? yourResource : buddyResource
      txtMessage2 = `${basicInfo.basicAbility[`${resource}-ShareableAbility`]} ${
        isEN ?
        resource == 'Warrior' ? 'Large Recovery Shield (Restores 6 HP) activated!!' : 'Poison Mix (Deals 6 damage to all enemies) activated!!'
        : resource == 'Warrior' ? '大型回復シールド(HP6回復)能力発動!!' : '毒調合(敵全体６ダメージ)能力発動!!'
      }`
    } else if (battleTurn == 99) {
      if (_yourHP + _buddyHP == 0) {
        txtMessage1 = isEN ? '残念、ゲームオーバーだ！' : 'Too bad, game over!'
        txtMessage2 = isEN ? '賞金は相手チームに贈られる。' : 'The prize is awarded to the opposing team.'        
      } else if (_enemy1HP + _enemy1HP == 0) {
        txtMessage1 = isEN ? 'おめでとう！バトルに勝利だ！！' : 'Congratulations! Victory in battle!!'
        txtMessage2 = isEN ? 'バトルの報奨金はあなたのものだ！すぐ送る!!' : 'The battle bounty is yours! Sending it right away!!'
      }
      setTimeout(() => briefingPosition(), 30000)
    }
  }}
>

  <!-- 背景 -->
  <Sprite
    width={screenWidth > 512 ? 512 : screenWidth}
    height={screenHeight}
    x={0}
    y={0}
    texture={PIXI.Texture.from('/assets/mmorpg/briefingRoom.jpg')}
  />
  <!-- プレイヤー -->
  <Sprite
    width={70}
    height={70}
    x={warriorPosition.x}
    y={warriorPosition.y + (_yourHP == 0 ? 40 : 0)}
    texture={PIXI.Texture.from(`/assets/mmorpg/${yourResource == 'Thief' ? 'thief' : 'warrior_man'}.png`)}
    rotation={_yourHP == 0 ? Math.PI - Math.PI * 8 / 6 : Math.PI - Math.PI}
  />
  <Sprite
    width={70}
    height={70}
    x={thiefPosition.x}
    y={thiefPosition.y}
    texture={PIXI.Texture.from(`/assets/mmorpg/${buddyResource == 'Warrior' ? 'warrior_man' : 'thief'}.png`)}
    rotation={_buddyHP == 0 ? Math.PI - Math.PI * 5 / 6 : Math.PI - Math.PI}
  />
  <!-- 敵 -->
  <Sprite
    width={60}
    height={80}
    x={enemy1Position.x}
    y={enemy1Position.y + (_enemy1HP == 0 ? 80 : 0)}
    texture={PIXI.Texture.from('/assets/mmorpg/enemy3.png')}
    rotation={_enemy1HP == 0 ? Math.PI - Math.PI * 9 / 6 : Math.PI - Math.PI}
  />
  <Sprite
    width={yourResource == 'Warrior' && buddyResource == 'Warrior' ? 70 : 50}
    height={yourResource == 'Warrior' && buddyResource == 'Warrior' ? 85 : 65}
    x={enemy2Position.x}
    y={enemy2Position.y + (_enemy2HP == 0 ? 40 : 0)}
    texture={PIXI.Texture.from(`/assets/mmorpg/enemy${yourResource == 'Warrior' && buddyResource == 'Warrior' ? '2' : ''}.png`)}
    rotation={_enemy2HP == 0 ? Math.PI - Math.PI * 8 / 6 : Math.PI - Math.PI}
  />

  <!-- ダメージ痕ここから -->
  <Sprite
    width={30}
    height={40}
    x={player1HasDamage ? warriorPosition.x + 15 : screenWidth * 1.1}
    y={warriorPosition.y + 10}
    texture={PIXI.Texture.from('/assets/mmorpg/enemyAttack.png')}
  />
  <Sprite
    width={30}
    height={40}
    x={player2HasDamage ? thiefPosition.x + 15 : screenWidth * 1.1}
    y={thiefPosition.y + 10}
    texture={PIXI.Texture.from('/assets/mmorpg/enemyAttack.png')}
  />
  <Sprite
    width={30}
    height={40}
    x={enemy1HasDamage ? enemy1Position.x + 15 : screenWidth * 1.1}
    y={enemy1Position.y + 10}
    texture={PIXI.Texture.from('/assets/mmorpg/playerAttack.png')}
  />
  <Sprite
    width={30}
    height={40}
    x={enemy2HasDamage ? enemy2Position.x + 15 : screenWidth * 1.1}
    y={enemy2Position.y + 10}
    texture={PIXI.Texture.from('/assets/mmorpg/playerAttack.png')}
  />
  <!-- ダメージ痕ここまで -->
  <!-- 特殊能力ここから -->
  <Sprite
    width={60}
    height={80}
    x={battleTurn == 14 || battleTurn == 15 ? enemy1Position.x - 25 : disappearPosition.x}
    y={enemy1Position.y + 15}
    texture={PIXI.Texture.from('/assets/mmorpg/poisonMaking.png')}
  />
  <Sprite
    width={60}
    height={80}
    x={battleTurn == 16 || battleTurn == 17 ? thiefPosition.x + 35 : disappearPosition.x}
    y={thiefPosition.y - 10}
    texture={PIXI.Texture.from('/assets/mmorpg/recoveryShield.png')}
  />
  <!-- 特殊能力ここまで -->
  <Text
    x={screenWidth / 2}
    y={screenWidth / 10}
    text={txtMessage1}
    style={{ fill: 'white', fontSize: 22 }}
    anchor={0.5}
  />
  <!-- 特殊能力のメッセージ -->
  <Text
    x={screenWidth / 2}
    y={screenHeight * 0.8}
    text={txtMessage2}
    style={{ fill: 'yellow', fontSize: isEN ? 16 : 20 }}
    anchor={0.5}
  />
  <Text
    x={screenWidth * 0.3}
    y={screenHeight * 0.93}
    text={`You: ${mainPlayer ? (yourResource ? yourResource : '--') : (buddyResource ? buddyResource : '--')}  Buddy: ${mainPlayer ? (buddyResource ? buddyResource : '--') : (yourResource ? yourResource : '--')}`}
    style={{ fill: '#FFDEAD', fontSize: 15 }}
    anchor={0.5}
  />
  <!-- 各ユニットのライフ -->
  <Graphics
    x={margin}
    y={margin / 2}
    draw={(graphics) => {
      graphics.clear()
      graphics.beginFill(0xc24d2c)
      graphics.drawRect(0, 0, barWidth[0], barHeight)
      graphics.endFill()
    }}
  />
  <Text
    x={margin / 2}
    y={margin}
    text={_yourHP}
    style={{ fill: 'white', fontSize: 16 }}
    anchor={0.5}
  />

  <Graphics
    x={margin}
    y={margin * 2}
    draw={(graphics) => {
      graphics.clear()
      graphics.beginFill(0xc24d2c)
      graphics.drawRect(0, 0, barWidth[1], barHeight)
      graphics.endFill()
    }}
  />
  <Text
    x={margin / 2}
    y={margin * 2.5}
    text={_buddyHP}
    style={{ fill: 'white', fontSize: 16 }}
    anchor={0.5}
  />

  <Graphics
    x={enemy1Position.x + 50}
    y={margin * 2}
    draw={(graphics) => {
      graphics.clear()
      graphics.beginFill(0xc24d2c)
      graphics.drawRect(0, 0, barWidth[2], barHeight)
      graphics.endFill()
    }}
  />
  <Text
    x={enemy1Position.x + 42}
    y={margin}
    text={_enemy1HP}
    style={{ fill: 'white', fontSize: 16 }}
    anchor={0.5}
  />

  <Graphics
    x={enemy1Position.x + 50}
    y={margin / 2}
    draw={(graphics) => {
      graphics.clear()
      graphics.beginFill(0xc24d2c)
      graphics.drawRect(0, 0, barWidth[3], barHeight)
      graphics.endFill()
    }}
  />
  <Text
    x={enemy1Position.x + 42}
    y={margin * 2.5}
    text={_enemy2HP}
    style={{ fill: 'white', fontSize: 16 }}
    anchor={0.5}
  />

</Ticker>
