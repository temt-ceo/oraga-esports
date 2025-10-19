import { query } from "@onflow/fcl";

export const getBalance = async function (address) {
  const result = await query({
    cadence: `
    import "FlowToken"
    import "FungibleToken"

    access(all) fun main(address: Address): UFix64 {
      let vaultRef = getAccount(address).capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Something wrong happened.")
      return vaultRef.balance
    }
    `,
    args: (arg, t) => [arg(address, t.Address)],
  });
  return result;
};

export const isRegistered = async function (address) {
  const result = await query({
    cadence: `
    import "OragaESports"

    access(all) fun main(address: Address): &OragaESports.Gamer? {
        return getAccount(address).capabilities.get<&OragaESports.Gamer>(/public/OragaESportsGamer).borrow()
    }
    `,
    args: (arg, t) => [arg(address, t.Address)],
  });
  return result;
};

export const getGamersInfo = async function () {
  const result = await query({
    cadence: `
    import "OragaESports"

    access(all) fun main(): OragaESports.GamersInfo {
      return OragaESports.getGamersInfo()
    }
    `,
  });
  return result;
};

export const getInfo = async function (id) {
  const result = await query({
    cadence: `
    import "CookStocker"

    access(all) fun main(id: String): CookStocker.VegeData? {
        return CookStocker.getCookStockerInfo(id: id)
    }
    `,
    args: (arg, t) => [arg(id, t.String)],
  });
  return result;
};

export const getSellerInfo = async function (id) {
  const result = await query({
    cadence: `
    import "VegeSeller"

    access(all) fun main(id: String): VegeSeller.VegeData? {
        return VegeSeller.getVegeSellerInfo(id: id)
    }
    `,
    args: (arg, t) => [arg(id, t.String)],
  });
  return result;
};

export const getRideShareInfo = async function () {
  const result = await query({
    cadence: `
    import "RideShare"

    access(all) fun main(): RideShare.Info? {
        return RideShare.getInfo()
    }
    `,
    args: (arg, t) => [],
  });
  return result;
};

export const getBalances = async function (address) {
  let driverAddress;
  if (import.meta.env && import.meta.env.VITE_DRIVER_ADDRESS) {
    driverAddress = import.meta.env.VITE_DRIVER_ADDRESS;
  } else {
    driverAddress = "0xb576a3926d239682"; // .envファイルが見つからない場合はシステム運営アカウントと同じ値を取得する
  }
  const systemAddress = "0xb576a3926d239682";
  const result = await query({
    cadence: `
    import "FlowToken"
    import "FungibleToken"

    access(all) fun main(address: Address, driverAddress: Address, systemAddress: Address): [UFix64] {
      let vaultRef = getAccount(address).capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Something wrong happenedAA.")
      let driverVaultRef = getAccount(driverAddress).capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Something wrong happened.")
      let systemVaultRef = getAccount(systemAddress).capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Something wrong happened.")

      var addresses: [UFix64] = []
      addresses.append(vaultRef.balance)
      addresses.append(driverVaultRef.balance)
      addresses.append(systemVaultRef.balance)
      return addresses
    }
    `,
    args: (arg, t) => [
      arg(address, t.Address),
      arg(driverAddress, t.Address),
      arg(systemAddress, t.Address),
    ],
  });
  return result;
};

export const getBalancesWithoutUser = async function () {
  let driverAddress;
  if (import.meta.env && import.meta.env.VITE_DRIVER_ADDRESS) {
    driverAddress = import.meta.env.VITE_DRIVER_ADDRESS;
  } else {
    driverAddress = "0xb576a3926d239682"; // .envファイルが見つからない場合はシステム運営アカウントと同じ値を取得する
  }
  const systemAddress = "0xb576a3926d239682";
  const result = await query({
    cadence: `
    import "FlowToken"
    import "FungibleToken"

    access(all) fun main(driverAddress: Address, systemAddress: Address): [UFix64] {
      let driverVaultRef = getAccount(driverAddress).capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Something wrong happened.")
      let systemVaultRef = getAccount(systemAddress).capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Something wrong happened.")

      var addresses: [UFix64] = []
      addresses.append(driverVaultRef.balance)
      addresses.append(systemVaultRef.balance)
      return addresses
    }
    `,
    args: (arg, t) => [
      arg(driverAddress, t.Address),
      arg(systemAddress, t.Address),
    ],
  });
  return result;
};

export const getMMORPGInfo = async function () {
  const result = await query({
    cadence: `
    import "MMORPG6"

    access(all) fun main(): MMORPG6.Info? {
        return MMORPG6.getInfo()
    }
    `,
    args: (arg, t) => [],
  });
  return result;
};

export const havingResourceId = async function (address, resourceName) {
  const result = await query({
    cadence: `
    import "MMORPG6"

    access(all) fun main(address: Address, resourceName: String): UInt? {
        if (resourceName == "Warrior") {
            return getAccount(address).capabilities.get<&MMORPG6.Warrior>(/public/MMORPG6WarriorResource).borrow()?.id
        } else if (resourceName == "Thief") {
            return getAccount(address).capabilities.get<&MMORPG6.Thief>(/public/MMORPG6ThiefResource).borrow()?.id
        }
        return nil
    }
    `,
    args: (arg, t) => [arg(address, t.Address), arg(resourceName, t.String)],
  });
  return result;
};

export const havingResourceMaxLife = async function (address, resourceName) {
  const result = await query({
    cadence: `
    import "MMORPG6"

    access(all) fun main(address: Address, resourceName: String): UInt8? {
        if (resourceName == "Warrior") {
            return getAccount(address).capabilities
                .get<&MMORPG6.Warrior>(/public/MMORPG6WarriorResource)
                .borrow()?.maxLife
        } else if (resourceName == "Thief") {
            return getAccount(address).capabilities
                .get<&MMORPG6.Thief>(/public/MMORPG6ThiefResource)
                .borrow()?.maxLife
        }
        return nil
    }
    `,
    args: (arg, t) => [arg(address, t.Address), arg(resourceName, t.String)],
  });
  return result;
};
