import "FlowToken"
import "FungibleToken"

access(all) contract RideShare {

  access(self) let FlowTokenVault: Capability<&{FungibleToken.Receiver}>
  access(self) let DriverFlowTokenVault: {UInt: Capability<&{FungibleToken.Receiver}>}
  access(self) let info: Info
  access(self) var totalDrivers: UInt // Driver ID

  /* 構造体 */
  access(all) struct Info {

    access(contract) var driverData: {UInt: DriverData}
    access(contract) var orderQueue: [Order]

    /* setter */
    access(contract) fun setDriver(id: UInt, keys: [String], values: [String]): UInt {
      if let saved = self.driverData[id] {
        for index, key in keys {
          saved.set(key: key, value: values[index])
        }
        self.driverData[id] = saved // 更新
        return id
      } else {
        // 新規登録
        RideShare.totalDrivers = RideShare.totalDrivers + 1
        var data = DriverData()
        for index, key in keys {
          data.set(key: key, value: values[index])
        }
        self.driverData[RideShare.totalDrivers] = data
        return RideShare.totalDrivers
      }
    }

    access(contract) fun setOrder(execTime: UFix64, driverId: UInt, start: String, goal: String, wage: UFix64) {
      var order = Order(execTime: execTime, driverId: driverId, start: start, goal: goal, wage: wage)
      self.orderQueue.append(order)
      
    }

    init() {
      self.driverData = {}
      self.orderQueue = []
    }
  }


  /* Info内の構造体 */
  access(all) struct DriverData {

    access(contract) var data: {String: String}

    /* setter */
    access(contract) fun set(key: String, value: String) {
      self.data[key] = value
    }

    init() {
      self.data = {}
    }
  }

  /* Info内の構造体 */
  access(all) struct Order {

    access(all) let execTime: UFix64
    access(all) let driverId: UInt
    access(all) let start: String
    access(all) let goal: String
    access(all) let wage: UFix64

    init(execTime: UFix64, driverId: UInt, start: String, goal: String, wage: UFix64) {
      self.execTime = execTime
      self.driverId = driverId
      self.start = start
      self.goal = goal
      self.wage = wage
    }
  }

  // GET
  access(all) fun getInfo(): Info {
    return self.info
  }
  // PUT
  access(all) fun setDriverInfo(driverId: UInt, keys: [String], values: [String], flow_vault_receiver: Capability<&{FungibleToken.Receiver}>?) {
    let _driverId = RideShare.info.setDriver(id: driverId, keys: keys, values: values)
    if (flow_vault_receiver != nil) {
      RideShare.DriverFlowTokenVault[_driverId] = flow_vault_receiver
    }
  }

  // PUT
  access(all) fun newOrder(payment: @FlowToken.Vault, execTime: UFix64, driverId: UInt, start: String, goal: String) {
    self.info.setOrder(execTime: execTime, driverId: driverId, start: start, goal: goal, wage: payment.balance * 0.97)
    self.FlowTokenVault.borrow()!.deposit(from: <- payment)
  }

  access(all) resource Admin {
    // ORDER COMPLETE
    access(all) fun payWage(driverId: UInt, wage: UFix64) {
      pre {
        RideShare.DriverFlowTokenVault[driverId] != nil: "Deposit destination is nil, so we can't send wage."
      }
      // Pay the wage.
      let wage <- RideShare.account.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Provider}>(from: /storage/flowTokenVault)!.withdraw(amount: wage) as! @FlowToken.Vault
      RideShare.DriverFlowTokenVault[driverId]!.borrow()!.deposit(from: <- wage)
    }
  }

  init() {
    self.info = Info()
    self.FlowTokenVault = self.account.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
    self.DriverFlowTokenVault = {}
    self.totalDrivers = 0
    self.account.storage.save( <- create Admin(), to: /storage/RideShareAdmin)
  }
}
