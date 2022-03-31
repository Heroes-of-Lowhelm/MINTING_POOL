const {BN, Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const {
    toBech32Address,
    getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

const {sep, resolve} = require('path');
const {existsSync, readFileSync} = require('fs');


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

async function readContractCodeByPath(fullContractPath, ext = '.scilla') {

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


        // Deploy a contract
        console.log(`Deploying a new contract....`);
        const dlHeroNFTCode = await readContractCodeByPath("../MintingContract/DLHeroes.scilla");


        const init = [
            // this parameter is mandatory for all init arrays
            {
                vname: '_scilla_version',
                type: 'Uint32',
                value: '0',
            },
            {
                vname: 'initial_contract_owner',
                type: 'ByStr20',
                value: `${address}`,
            },
            {
                vname: 'initial_base_uri',
                type: 'String',
                value: '',
            },
            {
                vname: 'name',
                type: 'String',
                value: 'DLHeroesNFT',
            },
            {
                vname: 'symbol',
                type: 'String',
                value: 'HOL_DL_HEROES',
            },
        ];

        // Instance of class Contract
        const contract = await zilliqa.contracts.new(dlHeroNFTCode, init);

        // Deploy the contract.
        // Also notice here we have a default function parameter named toDs as mentioned above.
        // A contract can be deployed at either the shard or at the DS. Always set this value to false.

        const [deployTx, DLHeroNFT] = await contract.deploy(
            {
                version: VERSION,
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(40000),
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
        console.log(DLHeroNFT.address);
    } catch (err) {
        console.log(err);
    }
}

testBlockchain();
