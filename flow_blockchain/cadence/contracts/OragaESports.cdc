import "FlowToken"
import "FungibleToken"

access(all) contract OragaESports {

  access(self) var totalCount: UInt
  access(self) let GamerFlowTokenVault: {UInt: Capability<&{FungibleToken.Receiver}>}

  access(all) event GamerCreatted(gamer_id: UInt)

  access(all) resource Gamer {
    access(all) let gamer_id: UInt
    access(all) let nickname: String

    init(nickname: String) {
      OragaESports.totalCount = OragaESports.totalCount + 1
      self.gamer_id = OragaESports.totalCount
      self.nickname = nickname
      emit GamerCreatted(gamer_id: self.gamer_id)
    }

    // access(all) fun insert_coin(payment: @FlowToken.Vault) {
    //   pre {
    //     payment.balance == 1.0: "payment is not 1FLOW coin."
    //     OragaESports.gamerList[self.gamer_id] != nil: "CyberScoreStruct not found."
    //   }
    //   OragaESports.FlowTokenVault.borrow()!.deposit(from: <- payment)
    //   if let cyberScore = OragaESports.gamerList[self.gamer_id] {
    //     cyberScore.set_cyber_energy(new_value: cyberScore.cyber_energy + 100)
    //     OragaESports.gamerList[self.gamer_id] = cyberScore
    //   }
    // }
  }

  access(all) fun createGamer(nickname: String, flow_vault_receiver: Capability<&{FungibleToken.Receiver}>): @OragaESports.Gamer {
    let gamer <- create Gamer(nickname: nickname)

    if (OragaESports.GamerFlowTokenVault[gamer.gamer_id] == nil) {
      OragaESports.GamerFlowTokenVault[gamer.gamer_id] = flow_vault_receiver
    }
    return <- gamer
  }

  init() {
    self.totalCount = 0
    self.GamerFlowTokenVault = {}
  }
}