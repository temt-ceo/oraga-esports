transaction(publicKey: String, numOfKeyToAdd: Int) {
    prepare(signer: auth(AddKey) &Account) {
        let key = PublicKey(
            publicKey: publicKey.decodeHex(),
            signatureAlgorithm: SignatureAlgorithm.ECDSA_secp256k1
        )

        var counter = 0
        while counter < numOfKeyToAdd {
          counter = counter + 1
          signer.keys.add(
            publicKey: key,
            hashAlgorithm: HashAlgorithm.SHA3_256,
            weight: 0.0
          )
        }
    }
}