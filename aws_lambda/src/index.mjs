const fs = require("fs");
const { config, mutate, tx } = require("@onflow/fcl");
const { SHA3 } = require("sha3");

export const handler = async (event) => {
  console.log("Event", JSON.stringify(event, 3));
  const input = event.variables?.input || {};
  let player_id = input.playerId ? parseInt(input.playerId) : 0;
  let transaction = "";

  if (input.type === "shooting_game_outcome") {
    transaction = `
      import TestnetTest2 from 0x975b04756864e9ea

      transaction(gamerId: UInt, outcome: Bool) {
        prepare(signer: &Account) {
          gamer.insert_coin(gamerId: gamerId, outcome: outcome)
        }
        execute {
          log("success")
        }
      }
    `;
  }

  config({
    "flow.network": "testnet",
    "accessNode.api": "https://rest-testnet.onflow.org",
  });

  let txId;
	try {

		var KEY_ID_IT = 0;
		if (fs.existsSync('/tmp/sequence.txt')) {
			KEY_ID_IT = parseInt(fs.readFileSync('/tmp/sequence.txt', { encoding: 'utf8' }));
		} else {
			KEY_ID_IT = new Date().getMilliseconds() % 10;
		}
		KEY_ID_IT = !KEY_ID_IT || KEY_ID_IT >= 10 ? 0 : KEY_ID_IT + 1;
		fs.writeFileSync('/tmp/sequence.txt', KEY_ID_IT.toString());
		console.log('KEY_ID_IT', KEY_ID_IT);

    const EC = require('elliptic').ec;
		const ec = new EC('p256');

		// CHANGE THESE THINGS FOR YOU
		const PRIVATE_KEY = fs.readFileSync('testnet-account.pkey', { encoding: 'utf8' });
		const ADDRESS = '0x975b04756864e9ea';
		const KEY_ID = 0;

    const sign = (message) => {
			const key = ec.keyFromPrivate(Buffer.from(PRIVATE_KEY, 'hex'));
			const sig = key.sign(hash(message)); // hashMsgHex -> hash
			const n = 32;
			const r = sig.r.toArrayLike(Buffer, 'be', n);
			const s = sig.s.toArrayLike(Buffer, 'be', n);
			return Buffer.concat([r, s]).toString('hex');
		};
		const hash = (message) => {
			const sha = new SHA3(256);
			sha.update(Buffer.from(message, 'hex'));
			return sha.digest();
		};

		async function authorizationFunction(account) {
			return {
				...account,
				tempId: `${ADDRESS}-${KEY_ID}`,
				addr: fcl.sansPrefix(ADDRESS),
				keyId: Number(KEY_ID),
				signingFunction: async (signable) => {
					return {
						addr: fcl.withPrefix(ADDRESS),
						keyId: Number(KEY_ID),
						signature: sign(signable.message)
					};
				}
			};
		}
		async function authorizationFunctionProposer(account) {
			return {
				...account,
				tempId: `${ADDRESS}-${KEY_ID_IT}`,
				addr: fcl.sansPrefix(ADDRESS),
				keyId: Number(KEY_ID_IT),
				signingFunction: async (signable) => {
					return {
						addr: fcl.withPrefix(ADDRESS),
						keyId: Number(KEY_ID_IT),
						signature: sign(signable.message)
					};
				}
			};
		}

    let message = input.message ? JSON.parse(input.message) : {};

  return {
    id: new Date().getTime(),
    type: "This is from Lambda(zipped)",
    message: "This is from Lambda(zipped)",
    playerId: "This is from Lambda(zipped)",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
