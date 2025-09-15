<script>
  import * as PIXI from 'pixi.js'
  import { Ticker, Sprite, Text } from 'svelte-pixi'
  import Victor from 'victor'

  export let screenWidth;
  export let screenHeight;
  export let startPlace;
  export let goalPlace;
  export let orderStatus;
  export let orderExecTime;

  let frame = 0

  const st = screenWidth - screenWidth / 3;
  const gl = screenWidth - screenWidth * 4 / 5
  let startTime = null
  let currentPosition
  let personPosition = new Victor(st, screenHeight * 0.6)
  let startPosition = new Victor(st, screenHeight * 0.4)
  let destinationPosition = new Victor(gl, screenHeight * 0.4)
  let txtMessage = ''
  let txtMessage2 = ''
  let currentTime = ''

  const carPosition = {x: 0, y: 0}


  function start() {
    personPosition = new Victor(st, screenHeight * 0.6)
    currentPosition = new Victor(screenWidth - screenWidth / 8, screenHeight * 0.25)
    carPosition.x = currentPosition.x
    carPosition.y = currentPosition.y
    txtMessage = '何日、何時、どこから、どこに行きたい？'
  }
  function arriving() {
    currentPosition = new Victor(screenWidth - screenWidth / 6, screenHeight * 0.25)
    carPosition.x = currentPosition.x
    carPosition.y = currentPosition.y
  }
  function riding() {
    personPosition = new Victor(screenWidth * 1.1, screenHeight)
    currentPosition = new Victor(screenWidth - screenWidth / 2, screenHeight * 0.25)
    carPosition.x = currentPosition.x
    carPosition.y = currentPosition.y
  }
  function finished() {
    personPosition = new Victor(gl, screenHeight * 0.6)
    currentPosition = new Victor(screenWidth - screenWidth / 8, screenHeight * 0.25)
    carPosition.x = -1
    carPosition.y = currentPosition.y
  }
  function enterOrderStatus1() {
    // 新規注文受注
    if (orderExecTime) {
      startTime = new Date(orderExecTime)
      const now = new Date()
      currentTime = `現在${now.getHours()}時${now.getMinutes()}分`
      orderStatus = 2
    } else {
      // デモアニメーションを継続
      orderStatus = 0
    }
  }
  function enterOrderStatus2() {
    personPosition = new Victor(st, screenHeight * 0.6)
    currentPosition = new Victor(screenWidth - screenWidth / 8, screenHeight * 0.25)
    carPosition.x = currentPosition.x
    carPosition.y = currentPosition.y
    // 待機時間中
    txtMessage = `${startTime.getHours()}時${startTime.getMinutes()}分に車が来るのをお待ちください。`
    const now = new Date()
    const processedTime = new Date(now.getTime() + frame * 12 * 60) // 大体0.8秒=1分
    currentTime = `現在${processedTime.getHours()}時${processedTime.getMinutes()}分`
    // processedTimeの方が過去なのでstartTime - 1000 * 60 * 7.5 < processedTimeだと残り7.5分を切っている(大きい=より未来)
    if (startTime.getTime() - 1000 * 60 * 5 < processedTime.getTime()) {
      orderStatus = 3
    }
  }
  function enterOrderStatus3() {
    currentPosition = new Victor(screenWidth - screenWidth / 6, screenHeight * 0.25)
    carPosition.x = currentPosition.x
    carPosition.y = currentPosition.y
    // もう少しで車到着
    txtMessage = 'Your taxi will come soon ❗️'
    const now = new Date()
    const processedTime = new Date(now.getTime() + frame * 12 * 60) // 大体0.8秒=1分
    currentTime = `現在${processedTime.getHours()}時${processedTime.getMinutes()}分`
    if (startTime.getTime() < processedTime.getTime()) {// (大きい=より未来)
      orderStatus = 4
    }
  }
  function enterOrderStatus4() {
    personPosition = new Victor(screenWidth * 1.1, screenHeight)
    currentPosition = new Victor(screenWidth - screenWidth / 2, screenHeight * 0.25)
    carPosition.x = currentPosition.x
    carPosition.y = currentPosition.y
    // 接客中
    txtMessage = 'Thank you for using our service！'
    txtMessage2 = 'The driver will take you to the destination soon!'
    const now = new Date()
    const processedTime = new Date(now.getTime() + frame * 12 * 60) // 大体0.8秒=1分
    currentTime = `現在${processedTime.getHours()}時${processedTime.getMinutes()}分`
    if (startTime.getTime() < processedTime.getTime() - 1000 * 60 * 10) {// (大きい=より未来)
      orderStatus = 5
    }
  }
  function enterOrderStatus5() {
    personPosition = new Victor(gl, screenHeight * 0.6)
    currentPosition = new Victor(screenWidth - screenWidth / 8, screenHeight * 0.25)
    carPosition.x = -1
    carPosition.y = currentPosition.y
    // 到着
    txtMessage = 'Hey, Thank you❣️ Have fun with your journey!'
    txtMessage2 = ''
    const now = new Date()
    const processedTime = new Date(now.getTime() + frame * 12 * 60) // 大体0.8秒=1分
    currentTime = `現在${processedTime.getHours()}時${processedTime.getMinutes()}分`
    if (startTime.getTime() < processedTime.getTime() - 1000 * 60 * 18) {// (大きい=より未来)
      orderStatus = 6
    }
  }
  function enterOrderStatus6() {
    // ドライバーのRating(TaxiRide.svelteで行う)
    const now = new Date()
    const processedTime = new Date(now.getTime() + frame * 12 * 60) // 大体0.8秒=1分
    if (startTime.getTime() < processedTime.getTime() - 1000 * 60 * 20) {// (大きい=より未来)
      orderStatus = 0
      currentTime = ''
    }
  }
</script>

<Ticker
  on:tick={(ev) => {
    frame++
    if (orderStatus == 0) {
      // 注文がない状態
      if (frame < 400) {
        start()
      } else if (frame < 800) {
        arriving()
      } else if (frame < 1200) {
        riding()
      } else {
        finished()
      }
    } else if (orderStatus == 1) {
      // frameをリセット
      frame = 0;
      enterOrderStatus1()
    } else if (orderStatus == 2) {
      enterOrderStatus2()
    } else if (orderStatus == 3) {
      enterOrderStatus3()
    } else if (orderStatus == 4) {
      enterOrderStatus4()
    } else if (orderStatus == 5) {
      enterOrderStatus5()
    } else if (orderStatus == 6) {
      enterOrderStatus6()
    }
  }}
>
  <Sprite
    width={80}
    height={40}
    x={carPosition.x}
    y={carPosition.y}
    texture={PIXI.Texture.from('/assets/taxi_ride/car.png')}
  />
  <Sprite
    width={40}
    height={63}
    x={personPosition.x}
    y={personPosition.y}
    texture={PIXI.Texture.from('/assets/taxi_ride/person.png')}
  />
  <Sprite
    width={50}
    height={50}
    x={startPosition.x}
    y={startPosition.y}
    texture={PIXI.Texture.from(startPlace == '品川駅南口' || startPlace == '品川駅北口' ? '/assets/taxi_ride/station.png' : '/assets/shooting/star.png')}
  />
  <Sprite
    width={85}
    height={60}
    x={destinationPosition.x}
    y={destinationPosition.y - 4}
    texture={PIXI.Texture.from(goalPlace == '羽田空港' ? '/assets/taxi_ride/airport.png' : (goalPlace == '' ? '/assets/shooting/star.png' : '/assets/taxi_ride/station.png'))}
  />
  <Text
    x={screenWidth / 2}
    y={screenWidth / 10}
    text={txtMessage}
    style={{ fill: 'white', fontSize: 17 }}
    anchor={0.5}
  />
  <Text
    x={screenWidth / 2}
    y={screenHeight * 0.8}
    text={txtMessage2}
    style={{ fill: 'white', fontSize: 14 }}
    anchor={0.5}
  />
  <Text
    x={screenWidth * 0.3}
    y={screenHeight * 0.93}
    text={currentTime ? currentTime + ' (早送り中..)' : ''}
    style={{ fill: '#FFDEAD', fontSize: 15 }}
    anchor={0.5}
  />
  
</Ticker>
