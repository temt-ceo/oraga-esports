import "FlowToken"
import "FungibleToken"

access(all) contract MMORPG6 {

  access(self) let FlowTokenVault: Capability<&{FungibleToken.Receiver}>
  access(self) let info: Info
  access(self) var totalGamePlayers: UInt // Player ID

  access(all) entitlement ThiefAbility1
  access(all) entitlement ThiefAbility2
  access(all) entitlement WarriorAbility1
  access(all) entitlement WarriorAbility2

  access(all) event ESportsGamerInitiated(battleId: Int, player1Address: Address, player2Address: Address)

  /* 構造体 */
  access(all) struct Info {

    /* fields */
    access(contract) var battleQueue: [GameBattle]
    access(contract) var basicAbility: {String: String}     // リソース別の基本アビリティ
    access(contract) var basicAttackInfo: {String: [UInt8]} // システム側から通常攻撃トランザクションを行うための情報

    /* setter  <Return: Battle ID> */
    access(contract) fun newGameBattle(
      player1Address: Address,
      player2Address: Address,
      lifeOfPlayer1: UInt8,
      lifeOfPlayer2: UInt8,
      reward: UFix64
    ): Int {
      var battle = GameBattle(
        player1Address: player1Address,
        player2Address: player2Address,
        lifeOfPlayer1: lifeOfPlayer1,
        lifeOfPlayer2: lifeOfPlayer2,
        reward: reward
      )
      self.battleQueue.append(battle)
      return self.battleQueue.length - 1
    }

    /* setter */
    access(contract) fun updateGameBattle(
      battleId: Int,
      target: String?,
      lifeChange: UInt8,
      isDamage: Bool
    ) {
      if (target != nil) {
        self.battleQueue[battleId]!.setPlayerLife(target: target!, lifeChange: lifeChange, isDamage: isDamage)
      } else {
        self.battleQueue[battleId]!.setEnemyLife(damage: lifeChange) // 敵への攻撃は全体攻撃しかない..
      }
    }

    /* init */
    init() {
      self.battleQueue = []
      self.basicAbility = {
       "Warrior-BasicAttack": "Rage Attack",
       "Warrior-ShareableAbility": "LargeRecoveryShield",
       "Thief-BasicAttack": "Whip Attack",
       "Thief-ShareableAbility": "PoisonMaking",
       "Enemy-BasicAttack": "A Crushing Blow"
      }
      self.basicAttackInfo = {
        "Warrior": [1, 3], // [GroupAttack?, damageVolume] (Rage Attack)
        "Thief": [1, 1], // [GroupAttack?, damageVolume] (Whip Attack
        "Enemy": [0, 4] // [GroupAttack?, damageVolume] (A Crushing Blow)
      }
    }
  }

  /* Info内の構造体 */
  access(all) struct GameBattle {

    /* fields */
    access(all) let execTime: UFix64
    access(all) let player1Address: Address
    access(all) let player2Address: Address
    access(all) var lifeOfPlayer1: UInt8
    access(all) var lifeOfPlayer2: UInt8
    access(all) var enemy1Life: UInt8
    access(all) var enemy2Life: UInt8
    access(all) let reward: UFix64

    /* setter(ダメージまたは回復) */
    access(contract) fun setPlayerLife(target: String, lifeChange: UInt8, isDamage: Bool) {
      if (target == "TeamPlayer1") {
        if (isDamage) {
          self.lifeOfPlayer1 = self.lifeOfPlayer1 < lifeChange ? 0 : self.lifeOfPlayer1 - lifeChange
        } else {
          self.lifeOfPlayer1 = self.lifeOfPlayer1 + lifeChange
        }
      } else if (target == "TeamPlayer2") {
        if (isDamage) {
          self.lifeOfPlayer2 = self.lifeOfPlayer2 < lifeChange ? 0 : self.lifeOfPlayer2 - lifeChange
        } else {
          self.lifeOfPlayer2 = self.lifeOfPlayer2 + lifeChange
        }
      }
    }
    /* setter(敵への全体攻撃) */
    access(contract) fun setEnemyLife(damage: UInt8) {
      self.enemy1Life = self.enemy1Life < damage ? 0 : self.enemy1Life - damage
      self.enemy2Life = self.enemy2Life < damage ? 0 : self.enemy2Life - damage
    }

    /* init */
    init(player1Address: Address, player2Address: Address, lifeOfPlayer1: UInt8, lifeOfPlayer2: UInt8, reward: UFix64) {
      let modulo: UInt8 = 3
      self.execTime = getCurrentBlock().timestamp
      self.player1Address = player1Address
      self.player2Address = player2Address
      self.lifeOfPlayer1 = lifeOfPlayer1
      self.lifeOfPlayer2 = lifeOfPlayer2

      // 両方戦士タイプなら悪魔を登場させる
      if (lifeOfPlayer1 > 5 && lifeOfPlayer2 > 5) {
        self.enemy1Life = 9 + revertibleRandom(modulo: modulo) // 9 ~ 11の整数
      } else {
        self.enemy1Life = 5 + revertibleRandom(modulo: modulo) // 5 ~ 7の整数
      }
      self.enemy2Life = 8 + revertibleRandom(modulo: modulo) // 8 ~ 10の整数
      self.reward = reward
    }
  }

  // GET
  access(all) fun getInfo(): Info {
    return self.info
  }

  // PUT
  access(all) fun newGameBattle(
    payment: @FlowToken.Vault,
    player1Address: Address,
    player2Address: Address,
    lifeOfPlayer1: UInt8,
    lifeOfPlayer2: UInt8
  ) {
    let battleId = self.info.newGameBattle(
      player1Address: player1Address,
      player2Address: player2Address,
      lifeOfPlayer1: lifeOfPlayer1,
      lifeOfPlayer2: lifeOfPlayer2,
      reward: payment.balance * 2.0)

    emit ESportsGamerInitiated(battleId: battleId, player1Address: player1Address, player2Address: player2Address)

    // Game Feeをシステムアカウントに保存
    self.FlowTokenVault.borrow()!.deposit(from: <- payment)
  }

  access(all) resource Thief {
    access(all) let id: UInt
    access(all) let maxLife: UInt8

    access(ThiefAbility1) fun PoisonMaking(battleId: Int) {
      MMORPG6.info.updateGameBattle(battleId: battleId, target: nil, lifeChange: 6, isDamage: true)
    }
    access(ThiefAbility2) fun WhipAttack(battleId: Int) {
      MMORPG6.info.updateGameBattle(battleId: battleId, target: nil, lifeChange: 1, isDamage: true)
    }
    
    init() {
      MMORPG6.totalGamePlayers = MMORPG6.totalGamePlayers + 1
      self.id = MMORPG6.totalGamePlayers
      self.maxLife = 5
    }
  }

  access(all) resource Warrior {
    access(all) let id: UInt
    access(all) let maxLife: UInt8

    access(WarriorAbility1) fun LargeRecoveryShield(battleId: Int, target: String) {
      MMORPG6.info.updateGameBattle(battleId: battleId, target: target, lifeChange: 4, isDamage: false)
    }
    access(WarriorAbility2) fun RageAttack(battleId: Int) {
      MMORPG6.info.updateGameBattle(battleId: battleId, target: nil, lifeChange: 3, isDamage: true)
    }

    init() {
      MMORPG6.totalGamePlayers = MMORPG6.totalGamePlayers + 1
      self.id = MMORPG6.totalGamePlayers
      self.maxLife = 8
    }
  }

  access(all) resource Admin {
    access(all) fun payRewards(recipient1: Address, recipient2: Address, reward: UFix64) {
      // Pay the reward.
      let reward1 <- MMORPG6.account
        .storage
        .borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Provider}>(from: /storage/flowTokenVault)!
        .withdraw(amount: reward) as! @FlowToken.Vault

      getAccount(recipient1)
        .capabilities
        .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        .borrow()!.deposit(from: <- reward1)

      let reward2 <- MMORPG6.account
        .storage
        .borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Provider}>(from: /storage/flowTokenVault)!
        .withdraw(amount: reward) as! @FlowToken.Vault

      getAccount(recipient2)
        .capabilities
        .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        .borrow()!.deposit(from: <- reward2)
    }

    access(all) fun basicAttack(battleId: Int, target: String?, resourceName: String) {
      MMORPG6.info.updateGameBattle(battleId: battleId, target: target, lifeChange: MMORPG6.info.basicAttackInfo[resourceName]![1], isDamage: true)
    }
  }

  access(all) fun createWarriorResource(payment: @FlowToken.Vault): @MMORPG6.Warrior {
    pre {
      payment.balance == 0.5: "Cost of resource must be 5.0FLOW coin."
    }
    let _resource <- create Warrior() // resourceは予約語なので_をつけてます

    MMORPG6.FlowTokenVault.borrow()!.deposit(from: <- payment) // 代金徴収
    return <- _resource
  }

  access(all) fun createThiefResource(payment: @FlowToken.Vault): @MMORPG6.Thief {
    pre {
      payment.balance == 0.5: "Cost of resource must be 5.0FLOW coin."
    }
    let _resource <- create Thief()

    MMORPG6.FlowTokenVault.borrow()!.deposit(from: <- payment) // 代金徴収
    return <- _resource
  }

  init() {
    self.info = Info()
    self.FlowTokenVault = self.account.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
    self.totalGamePlayers = 0
    self.account.storage.save( <- create Admin(), to: /storage/MMORPG6Admin)
  }
}
