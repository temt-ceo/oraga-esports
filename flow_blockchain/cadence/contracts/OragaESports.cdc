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

    access(contract) fun setCurrentPrize(added: UInt, gamerId: UInt, paid: Bool): UInt {
      if (paid == false) {
        self.currentPrize = self.currentPrize + added
        self.unsetTryingPrize(gamerId: gamerId)
        return 0
      } else{
        if let paidPrize = self.tryingPrize[gamerId] {
          if (self.currentPrize - paidPrize > 0) {
            self.currentPrize = self.currentPrize - paidPrize
            self.unsetTryingPrize(gamerId: gamerId)
            if let prizeHistory = self.prizeWinners[gamerId] {
              self.setPrizeWinners(gamerId: gamerId, prize: paidPrize + prizeHistory.prize, nickname: nil)
            } else {
              self.setPrizeWinners(gamerId: gamerId, prize: paidPrize, nickname: nil)
            }
            return paidPrize + added
          }
        }
        panic("Error.")
      }
    }

    access(contract) fun unsetTryingPrize(gamerId: UInt) {
      self.tryingPrize[gamerId] = 0
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

    access(contract) fun setPrizeWinners(gamerId: UInt, prize: UInt, nickname: String?) {
      if let prizeWinnerInfo = self.prizeWinners[gamerId] {
        prizeWinnerInfo.setPrize(prize: prize)
        if (prize > 0) {
          prizeWinnerInfo.setTotalCountUp()
        }
        self.prizeWinners[gamerId] = prizeWinnerInfo
      } else {
        if (nickname != nil) {
          self.prizeWinners[gamerId] = GamerPrizeInfo(prize: prize, gamerId: gamerId, nickname: nickname!)
        }
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
      TestnetTest2.gamersInfo.setPrizeWinners(gamerId: self.gamerId, prize: 0, nickname: nickname)
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

  /*
  ** [Resource] Admin (Game Server Processing)
  */
  access(all) resource Admin {
    /*
    ** Save the Gamer's shooting game outcome
    */
    access(all) fun shootingGameOutcome(gamerId: UInt, outcome: Bool) {
      let prizePaid = TestnetTest2.gamersInfo.setCurrentPrize(added: 1, gamerId: gamerId, paid: outcome)
      if (prizePaid > 0) {
        // Pay the prize.
        let reward <- TestnetTest2.account.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Provider}>(from: /storage/flowTokenVault)!.withdraw(amount: UFix64.fromString(prizePaid.toString().concat(".0"))!) as! @FlowToken.Vault
        TestnetTest2.GamerFlowTokenVault[gamerId]!.borrow()!.deposit(from: <- reward)
      }
    }
  }

  init() {
    self.account.storage.save( <- create Admin(), to: /storage/OragaESportsAdmin) // grant admin resource
    self.totalCount = 0
    self.GamerFlowTokenVault = {}
    self.FlowTokenVault = self.account.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
    self.gamersInfo = GamersInfo()
  }
}