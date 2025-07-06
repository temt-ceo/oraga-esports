import { config, mutate, tx, sansPrefix, withPrefix } from "@onflow/fcl";
import { SHA3 } from "sha3";
import "dotenv/config";
import pkg from "elliptic";
const { ec: EC } = pkg;
const ec = new EC("p256");

config()
  .put("flow.network", "mainnet")
  .put("accessNode.api", "https://rest-mainnet.onflow.org");

// CHANGE THESE THINGS FOR YOU
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ADDRESS = process.env.ADDRESS;
const KEY_ID = parseInt(process.env.KEY_ID);

const hash = (message) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(message, "hex"));
  return sha.digest();
};

const sign = (message) => {
  const key = ec.keyFromPrivate(Buffer.from(PRIVATE_KEY, "hex"));
  const sig = key.sign(hash(message)); // hashMsgHex -> hash
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);
  return Buffer.concat([r, s]).toString("hex");
};

async function authorizationFunction(account) {
  return {
    ...account,
    tempId: `${ADDRESS}-${KEY_ID}`,
    addr: sansPrefix(ADDRESS),
    keyId: Number(KEY_ID),
    signingFunction: async (signable) => {
      return {
        addr: withPrefix(ADDRESS),
        keyId: Number(KEY_ID),
        signature: sign(signable.message),
      };
    },
  };
}

async function sendTx() {
  const addr = process.env.RECIPIENT_ADDRESS2;
  const transactionId = await mutate({
    cadence: `
      import FungibleToken from 0xf233dcee88fe0abe
      import FlowToken from 0x1654653399040a61

      transaction(amount: UFix64, to: Address) {
        let vault: @FlowToken.Vault

        prepare(signer: auth(BorrowValue) &Account) {
          self.vault <- signer.storage
            .borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Provider}>(from: /storage/flowTokenVault)!
            .withdraw(amount: amount) as! @FlowToken.Vault
        }
        execute {
          getAccount(to)
            .capabilities
            .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow()!
            .deposit(from: <-self.vault)
        }
      }
    `,
    args: (arg, t) => [arg(0.7, t.UFix64), arg(addr, t.Address)],
    payer: authorizationFunction,
    proposer: authorizationFunction,
    authorizations: [authorizationFunction],
    limit: 999,
  });

  console.log({ transactionId });
  tx(transactionId).subscribe((res) => {
    console.log(res);
  });
}

sendTx();
