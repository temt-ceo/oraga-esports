import "FlowToken"
import "FungibleToken"

access(all) contract TestnetTest2 {

  access(self) var totalCount: UInt
  access(self) let GamerFlowTokenVault: {UInt: Capability<&{FungibleToken.Receiver}>}
  access(self) let FlowTokenVault: Capability<&{FungibleToken.Receiver}>
  access(self) let gamersInfo: GamersInfo

  access(all) event GamerCreatted(gamerId: UInt)

  // [Struct] GamersInfo
  access(all) struct GamersInfo {
    access(contract) var currentPrize: UInt
    access(contract) var tryingPrize: {UInt: UInt}
    access(contract) var prizeWinners: {UInt: GamerPrizeInfo}
    access(contract) var tipJarBalance: UInt

    access(contract) fun setCurrentPrize(added: UInt, gamerId: UInt, payed: Bool): UInt {
      if (payed == false) {
        self.currentPrize = self.currentPrize + added
        return 0
      } else{
        if let payedPrize = self.tryingPrize[gamerId] {
          if (self.currentPrize - payedPrize > 0) {
            self.currentPrize = self.currentPrize - payedPrize
            return payedPrize + added
          }
        }
        panic("Error.")
      }
    }
    access(contract) fun setTryingPrize(gamerId: UInt) {
      self.tryingPrize[gamerId] = self.currentPrize
    }
    access(contract) fun setTipJarBalance(value: UInt, tipped: Bool) {
      if (tipped) {
        self.tipJarBalance = self.tipJarBalance + value
      } else if (self.tipJarBalance - value > 0) {
        self.tipJarBalance = self.tipJarBalance - value
      } else {
        self.tipJarBalance = 0
      }
    }

    access(contract) fun setPrizeWinners(gamerId: UInt, prize: UInt, nickname: String) {
      if let prizeWinnerInfo = self.prizeWinners[gamerId] {
        prizeWinnerInfo.setPrize(prize: prize)
        prizeWinnerInfo.setTotalCountUp()
        self.prizeWinners[gamerId] = prizeWinnerInfo
      } else {
        self.prizeWinners[gamerId] = GamerPrizeInfo(prize: prize, gamerId: gamerId, nickname: nickname)
      }
    }

    init() {
      self.currentPrize = 0
      self.tryingPrize = {}
      self.prizeWinners = {}
      self.tipJarBalance = 0
    }
  }

  // [Struct] GamerPrizeInfo
  access(all) struct GamerPrizeInfo {
    access(contract) var prize: UInt
    access(contract) let gamerId: UInt
    access(contract) let gamerName: String
    access(contract) var totalCount: UInt

    access(contract) fun setPrize(prize: UInt) {
      self.prize = self.prize + prize
    }
    access(contract) fun setTotalCountUp() {
      self.totalCount = self.totalCount + 1
    }

    init(prize: UInt, gamerId: UInt, nickname: String) {
      self.prize = prize
      self.gamerId = gamerId
      self.gamerName = nickname
      self.totalCount = 1
    }
  }

  access(all) fun getGamersInfo(): GamersInfo {
    return self.gamersInfo
  }

  access(all) resource Gamer {
    access(all) let gamerId: UInt
    access(all) let nickname: String
    access(all) var freePlayed: Bool

    access(all) fun insert_coin(payment: @FlowToken.Vault) {
      pre {
        payment.balance == 1.1: "payment is not 1.1FLOW coin."
      }
      if let challenged = TestnetTest2.gamersInfo.tryingPrize[self.gamerId] {
        if (challenged > 0) {
          panic("You are now on playing the game. Payment is not accepted.")
        }
      }
      TestnetTest2.gamersInfo.setTryingPrize(gamerId: self.gamerId)
      TestnetTest2.FlowTokenVault.borrow()!.deposit(from: <- payment)
    }

    init(nickname: String) {
      TestnetTest2.totalCount = TestnetTest2.totalCount + 1
      self.gamerId = TestnetTest2.totalCount
      self.nickname = nickname
      self.freePlayed = false
      emit GamerCreatted(gamerId: self.gamerId)
    }
  }

  access(all) fun createGamer(nickname: String, flow_vault_receiver: Capability<&{FungibleToken.Receiver}>): @TestnetTest2.Gamer {
    let gamer <- create Gamer(nickname: nickname)

    if (TestnetTest2.GamerFlowTokenVault[gamer.gamerId] == nil) {
      TestnetTest2.GamerFlowTokenVault[gamer.gamerId] = flow_vault_receiver
    }
    return <- gamer
  }

  init() {
    self.totalCount = 0
    self.GamerFlowTokenVault = {}
    self.FlowTokenVault = self.account.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
    self.gamersInfo = GamersInfo()
  }
}