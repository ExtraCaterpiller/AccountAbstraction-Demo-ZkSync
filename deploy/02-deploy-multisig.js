const {ethers, network, userConfig, artifacts} = require("hardhat")
const { Wallet, utils, Provider, types, EIP712Signer } = require("zksync-ethers")
const addresses = require("../address.json")

const AA_FACTORY_ADDRESS = addresses[network.config.chainId]

module.exports = async () => {
    //const provider = new Provider(userConfig.networks.zkSyncTestnet.url)
    const provider = new Provider(userConfig.networks.zkSyncSepoliaTestnet.url)
    //const wallet = new Wallet(process.env.RICH_ACCOUNTS_PRIVATE_KEY).connect(provider)
    const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY).connect(provider)
    
    const factoryArtifact = await artifacts.readArtifact("AAFactory")
    const aaFactory = new ethers.Contract(
        AA_FACTORY_ADDRESS,
        factoryArtifact.abi,
        wallet
    )
    
    const owner1 = Wallet.createRandom()
    const owner2 = Wallet.createRandom()
    
    const salt = ethers.ZeroHash;
    
    const tx = await aaFactory.deployAccount(salt, owner1.address, owner2.address)
    await tx.wait()
    
    const abiCoder = new ethers.AbiCoder()
    const multisigAddress = utils.create2Address(
        AA_FACTORY_ADDRESS,
        await aaFactory.aaBytecodeHash(),
        salt,
        abiCoder.encode(['address', 'address'], [owner1.address, owner2.address])
    )

    console.log(`Multisig account deployed on address ${multisigAddress}`)

    console.log("Sending funds to multisig account...");
    // Send funds to the multisig account we just deployed
    await (
        await wallet.sendTransaction({
            to: multisigAddress,
            value: ethers.parseEther("0.008"),
            nonce: await wallet.getNonce(),
        })
    ).wait()

    let multisigBalance = await provider.getBalance(multisigAddress)
    console.log(`Multisig account balance is ${multisigBalance.toString()}`);

    // Transaction to deploy a new account using the multisig we just deployed
    let aaTx = await aaFactory.deployAccount.populateTransaction(
        salt,
        // These are accounts that will own the newly deployed account
        Wallet.createRandom().address,
        Wallet.createRandom().address,
    )

    const gasLimit = await provider.estimateGas({
        ...aaTx,
        from: wallet.address,
    })
    const gasPrice = await provider.getGasPrice()
    
    aaTx = {
        ...aaTx,
        // deploy a new account using the multisig
        from: multisigAddress,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        chainId: (await provider.getNetwork()).chainId,
        nonce: await provider.getTransactionCount(multisigAddress),
        type: utils.EIP712_TX_TYPE,
        customData: {
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
        value: BigInt(0),
    }

    const signedTxHash = EIP712Signer.getSignedDigest(aaTx)
    
    // Sign the transaction with both owners
    const signature = ethers.concat([
        ethers.Signature.from(owner1.signingKey.sign(signedTxHash)).serialized,
        ethers.Signature.from(owner2.signingKey.sign(signedTxHash)).serialized,
    ])

    aaTx.customData = {
        ...aaTx.customData,
        customSignature: signature,
    }

    console.log(`The multisig's nonce before the first tx is ${await provider.getTransactionCount(multisigAddress)}`)
    
    //const sentTx = await provider.broadcastTransaction(types.Transaction.from(aaTx).serialized)
    const sentTx = await provider.broadcastTransaction(utils.serializeEip712(aaTx))
    console.log(`Transaction sent from multisig with hash ${sentTx.hash}`)
    await sentTx.wait()

    console.log(`The multisig's nonce after the first tx is ${await provider.getTransactionCount(multisigAddress)}`)

    multisigBalance = await provider.getBalance(multisigAddress)

    console.log(`Multisig account balance is now ${multisigBalance.toString()}`)
}

module.exports.tags = ["all", "multisig"]