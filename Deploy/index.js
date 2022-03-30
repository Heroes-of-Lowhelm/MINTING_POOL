const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
    toBech32Address,
    getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

const { sep, resolve } = require('path');
const { existsSync, readFileSync } = require('fs');

// These are set by the core protocol, and may vary per-chain.
// You can manually pack the bytes according to chain id and msg version.
// For more information: https://apidocs.zilliqa.com/?shell#getnetworkid

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

// Populate the wallet with an account
const privateKey =
    '50ffa64c3be03d46541e3454cc30a93814eda7ee9cf4034b4ded136d149a43cd';

zilliqa.wallet.addByPrivateKey(privateKey);

const address = getAddressFromPrivateKey(privateKey);
console.log(`My account address is: ${address}`);
console.log(`My account bech32 address is: ${toBech32Address(address)}`);
async function readContractCodeByPath (fullContractPath, ext = '.scilla')
{

    if (!existsSync(fullContractPath)) {
        throw new Error('Contract not found at path: ' + fullContractPath);
    }
    return readFileSync(fullContractPath).toString();
}

async function testBlockchain() {
    try {
        // Get Balance
        const balance = await zilliqa.blockchain.getBalance(address);
        // Get Minimum Gas Price from blockchain
        const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();

        // Account balance (See note 1)
        console.log(`Your account balance is:`);
        console.log(balance.result);
        console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);
        const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions
        console.log(`My Gas Price ${myGasPrice.toString()}`);
        const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); // Checks if your gas price is less than the minimum gas price
        console.log(`Is the gas price sufficient? ${isGasSufficient}`);

        // Send a transaction to the network
        console.log('Sending a payment transaction to the network...');
        const tx = await zilliqa.blockchain.createTransaction(
            // Notice here we have a default function parameter named toDs which means the priority of the transaction.
            // If the value of toDs is false, then the transaction will be sent to a normal shard, otherwise, the transaction.
            // will be sent to ds shard. More info on design of sharding for smart contract can be found in.
            // https://blog.zilliqa.com/provisioning-sharding-for-smart-contracts-a-design-for-zilliqa-cd8d012ee735.
            // For payment transaction, it should always be false.
            zilliqa.transactions.new(
                {
                    version: VERSION,
                    toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
                    amount: new BN(units.toQa('1', units.Units.Zil)), // Sending an amount in Zil (1) and converting the amount to Qa
                    gasPrice: myGasPrice, // Minimum gasPrice veries. Check the `GetMinimumGasPrice` on the blockchain
                    gasLimit: Long.fromNumber(50),
                },
                false,
            ),
        );

        console.log(`The transaction status is:`);
        console.log(tx.receipt);

        // Deploy a contract
        console.log(`Deploying a new contract....`);
        const heroNFTCode = await readContractCodeByPath("../MintingContract/Heroes.scilla");
        console.log("included code=============>", heroNFTCode);


        const init = [
            // this parameter is mandatory for all init arrays
            {
                vname: '_scilla_version',
                type: 'Uint32',
                value: '0',
            },
            {
                vname: 'owner',
                type: 'ByStr20',
                value: `${address}`,
            },
        ];

        // Instance of class Contract
        const contract = zilliqa.contracts.new(heroNFTCode, init);

        // Deploy the contract.
        // Also notice here we have a default function parameter named toDs as mentioned above.
        // A contract can be deployed at either the shard or at the DS. Always set this value to false.
        const [deployTx, HeroNFT] = await contract.deploy(
            {
                version: VERSION,
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(10000),
            },
            33,
            1000,
            false,
        );

        // Introspect the state of the underlying transaction
        console.log(`Deployment Transaction ID: ${deployTx.id}`);
        console.log(`Deployment Transaction Receipt:`);
        console.log(deployTx.txParams.receipt);

        // Get the deployed contract address
        console.log('The contract address is:');
        console.log(HeroNFT.address);

        // const deployedContract = zilliqa.contracts.at(HeroNFT.address);
        //
        // const newMsg = 'Hello, the time is ' + Date.now();
        // console.log('Calling setHello transition with msg: ' + newMsg);
        // const callTx = await hello.call(
        //     'setHello',
        //     [
        //         {
        //             vname: 'msg',
        //             type: 'String',
        //             value: newMsg,
        //         },
        //     ],
        //     {
        //         // amount, gasPrice and gasLimit must be explicitly provided
        //         version: VERSION,
        //         amount: new BN(0),
        //         gasPrice: myGasPrice,
        //         gasLimit: Long.fromNumber(8000),
        //     },
        //     33,
        //     1000,
        //     false,
        // );
        //
        // console.log(JSON.stringify(callTx.receipt, null, 4));
        //
        // console.log('Getting contract state...');
        // const state = await deployedContract.getState();
        // console.log('The state of the contract is:');
        // console.log(JSON.stringify(state, null, 4));
    } catch (err) {
        console.log(err);
    }
}

testBlockchain();
