import "FlowToken"
import "FungibleToken"

access(all) contract VegeSeller {

  access(self) let FlowTokenVault: Capability<&{FungibleToken.Receiver}>
  access(self) let info: Info

  /* 構造体 */
  access(all) struct Info {

    access(contract) var data: {String: VegeData}

    /* setter */
    access(contract) fun set(id: String, add: [String], addAmount: [UInt8], remove: [String]) {
      if let saved = self.data[id] {
        for index, name in add {
          saved.set(category: name, amount: addAmount[index])
        }
        for name in remove {
          saved.unset(category: name)
        }
        // Save
        self.data[id] = saved
      } else {
        var data = VegeData()
        for index, name in add {
          data.set(category: name, amount: addAmount[index])
        }
        for name in remove {
          data.unset(category: name)
        }
        self.data[id] = data
      }
    }

    access(contract) fun buy(id: String, buy: [String]) {
      if let saved = self.data[id] {
        for name in buy {
          if (saved.data[name] == nil) {
            panic("The stock is empty.")
          }
          saved.set(category: name, amount: saved.data[name]! - 1)
        }
        // Save
        self.data[id] = saved
      } else {
        panic("No data.")
      }
    }

    init() {
      self.data = {}
    }
  }

  /* Info内の構造体 */
  access(all) struct VegeData {

    access(contract) var data: {String: UInt8}

    /* setter */
    access(contract) fun set(category: String, amount: UInt8) {
      self.data[category] = amount
    }

    access(contract) fun unset(category: String) {
      self.data[category] = nil
    }

    init() {
      self.data = {}
    }
  }

  // GET
  access(all) fun getVegeSellerInfo(id: String): VegeData? {
    return self.info.data[id]
  }
  // PUT
  access(all) fun setVegeSellerInfo(id: String, add: [String], addAmount: [UInt8], remove: [String]) {
    self.info.set(id: id, add: add, addAmount: addAmount, remove: remove)
  }
  // BUY
  access(all) fun buyVege(id: String, amount: @FlowToken.Vault, buy: [String]) {
    self.info.buy(id: id, buy: buy)
    self.FlowTokenVault.borrow()!.deposit(from: <- amount)
  }

  init() {
    self.info = Info()
    self.FlowTokenVault = self.account.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
  }
}
