import "FlowToken"
import "FungibleToken"

access(all) contract OragaESports {

  access(self) var totalCount: UInt
  access(self) let GamerFlowTokenVault: {UInt: Capability<&{FungibleToken.Receiver}>}
  access(self) let FlowTokenVault: Capability<&{FungibleToken.Receiver}>
  access(self) let gamersInfo: GamersInfo

  access(all) event GamerCreatted(gamerId: UInt)
  access(all) event WonThePrize(gamerId: UInt, amount: UFix64)

  // [Struct] GamersInfo
  access(all) struct GamersInfo {
    access(contract) var currentPrize: UInt
    access(contract) var tryingPrize: {UInt: UInt}
    access(contract) var lastTimePlayed: {UInt: UFix64?}
    access(contract) var prizeWinners: {UInt: GamerPrizeInfo}
    access(contract) var freePlayCount: {UInt: UInt8}
    access(contract) var tipJarBalance: UFix64

    access(contract) fun setCurrentPrize(added: UInt, gamerId: UInt, paid: Bool): UInt {
      if (paid == false) {
        self.currentPrize = self.currentPrize + added
        self.unsetTryingPrize(gamerId: gamerId)
        return 0
      } else {
        if let paidPrize = self.tryingPrize[gamerId] {
          if (self.currentPrize - paidPrize >= 0) {
            self.currentPrize = self.currentPrize - paidPrize
            self.unsetTryingPrize(gamerId: gamerId)
            if let prizeHistory = self.prizeWinners[gamerId] {
              self.setPrizeWinners(gamerId: gamerId, prize: paidPrize + prizeHistory.prize, nickname: nil)
            } else {
              self.setPrizeWinners(gamerId: gamerId, prize: paidPrize, nickname: nil)
            }
            return paidPrize + added
          } else {
            // In this case, any other person snatched the prize while playing a game. That's why the prize is only the fee this player paid.
            self.currentPrize = self.currentPrize - added
            self.unsetTryingPrize(gamerId: gamerId)
            if let prizeHistory = self.prizeWinners[gamerId] {
              self.setPrizeWinners(gamerId: gamerId, prize: added + prizeHistory.prize, nickname: nil)
            } else {
              self.setPrizeWinners(gamerId: gamerId, prize: added, nickname: nil)
            }
            return added
          }
        }
        panic("Error. Oops, something is not good.")
      }
    }

    access(contract) fun unsetTryingPrize(gamerId: UInt) {
      self.tryingPrize[gamerId] = 0
      self.lastTimePlayed[gamerId] = nil
    }

    access(contract) fun setTryingPrize(gamerId: UInt) {
      self.tryingPrize[gamerId] = self.currentPrize
      self.lastTimePlayed[gamerId] = getCurrentBlock().timestamp
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
          self.prizeWinners[gamerId] = GamerPrizeInfo(prize: prize, gamerId: gamerId, nickname: nickname!, totalCount: prize > 0 ? 1 : 0)
        }
      }
    }

    access(contract) fun setFreePlayCount(gamerId: UInt) {
      self.freePlayCount[gamerId] = self.freePlayCount[gamerId] == nil ? 1 : (self.freePlayCount[gamerId]! + 1)
    }

    access(contract) fun setTipJarBalance(amount: UFix64) {
      self.tipJarBalance = self.tipJarBalance + amount
    }

    access(contract) fun useTipJarBalance() {
      if (self.tipJarBalance > 0.0) {
        self.tipJarBalance = self.tipJarBalance - 1.0
      } else {
        panic("Sorry, tip jar is empty..")
      }
    }

    init() {
      self.currentPrize = 0
      self.tryingPrize = {}
      self.lastTimePlayed = {}
      self.prizeWinners = {}
      self.freePlayCount = {}
      self.tipJarBalance = 0.0
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

    init(prize: UInt, gamerId: UInt, nickname: String, totalCount: UInt) {
      self.prize = prize
      self.gamerId = gamerId
      self.gamerName = nickname
      self.totalCount = totalCount
    }
  }

  access(all) fun getGamersInfo(): GamersInfo {
    return self.gamersInfo
  }

  access(all) resource Gamer {
    access(all) let gamerId: UInt
    access(all) let nickname: String

    access(all) fun insert_coin(payment: @FlowToken.Vault) {
      pre {
        payment.balance == 1.1: "payment is not 1.1FLOW coin."
      }
      if let isStillPlayed = OragaESports.gamersInfo.lastTimePlayed[self.gamerId] {
        if (isStillPlayed != nil && isStillPlayed! + 80.0 < getCurrentBlock().timestamp) { // 60 + 10 * 2 (game time + transaction)
          // NOTE. If a player cut the network after the game won, we don't care about it.
          let prizePaid = OragaESports.gamersInfo.setCurrentPrize(added: 1, gamerId: self.gamerId, paid: false) // set lose
        }
      }
      if let challenged = OragaESports.gamersInfo.tryingPrize[self.gamerId] {
        if (challenged > 0) {
          panic("You are now on playing the game. Payment is not accepted.")
        }
      }
      OragaESports.gamersInfo.setTryingPrize(gamerId: self.gamerId)
      OragaESports.FlowTokenVault.borrow()!.deposit(from: <- payment)
    }

    access(all) fun tipping(tip: @FlowToken.Vault) {
      pre {
        tip.balance == 1.0 || tip.balance == 5.0: "tip is not 1.0FLOW or 5.0FLOW coin."
      }
      OragaESports.gamersInfo.setTipJarBalance(amount: tip.balance)
      OragaESports.FlowTokenVault.borrow()!.deposit(from: <- tip)
    }

    init(nickname: String) {
      OragaESports.totalCount = OragaESports.totalCount + 1
      self.gamerId = OragaESports.totalCount
      self.nickname = nickname
      OragaESports.gamersInfo.setPrizeWinners(gamerId: self.gamerId, prize: 0, nickname: nickname)
      emit GamerCreatted(gamerId: self.gamerId)
    }
  }

  access(all) fun createGamer(nickname: String, flow_vault_receiver: Capability<&{FungibleToken.Receiver}>): @OragaESports.Gamer {
    let gamer <- create Gamer(nickname: nickname)

    if (OragaESports.GamerFlowTokenVault[gamer.gamerId] == nil) {
      OragaESports.GamerFlowTokenVault[gamer.gamerId] = flow_vault_receiver
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
      let prizePaid = OragaESports.gamersInfo.setCurrentPrize(added: 1, gamerId: gamerId, paid: outcome)
      if (prizePaid > 0) {
        // Pay the prize.
        let reward <- OragaESports.account.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Provider}>(from: /storage/flowTokenVault)!.withdraw(amount: UFix64.fromString(prizePaid.toString().concat(".0"))!) as! @FlowToken.Vault
        OragaESports.GamerFlowTokenVault[gamerId]!.borrow()!.deposit(from: <- reward)
        emit WonThePrize(gamerId: gamerId, amount: UFix64.fromString(prizePaid.toString().concat(".0"))!)
      }
    }

    /*
    ** Start the free play using tip jar coin.
    */
    access(all) fun useTipJarForFreePlay(gamerId: UInt) {
      if let freePlayed = OragaESports.gamersInfo.freePlayCount[gamerId] {
        if (freePlayed >= 2) {
          panic("It's not acceptable.")
        }
        if let isStillPlayed = OragaESports.gamersInfo.lastTimePlayed[gamerId] {
          if (isStillPlayed != nil && isStillPlayed! + 80.0 < getCurrentBlock().timestamp) { // 60 + 10 * 2 (game time + transaction)
            // NOTE. If a player cut the network after the game won, we don't care about it.
            let prizePaid = OragaESports.gamersInfo.setCurrentPrize(added: 1, gamerId: gamerId, paid: false) // set lose
          }
        }
        if let challenged = OragaESports.gamersInfo.tryingPrize[gamerId] {
          if (challenged > 0) {
            panic("You are now on playing the game. Payment is not accepted.")
          }
        }
        OragaESports.gamersInfo.setTryingPrize(gamerId: gamerId)
        OragaESports.gamersInfo.useTipJarBalance()
      } else {
        OragaESports.gamersInfo.freePlayCount[gamerId] = 1
        OragaESports.gamersInfo.setTryingPrize(gamerId: gamerId)
        OragaESports.gamersInfo.useTipJarBalance()
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