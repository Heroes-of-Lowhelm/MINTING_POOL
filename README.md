# HOL-MINTING-PREMIUM-HEROES

### Summery

![Alt text](./photo1647251031.jpeg?raw=true)


## RNG_Oracle
### Oracle Client
- Always listen Oracle Contract's emitted events and filter 2 events : RequestedRandomNumber and RequestedBatchRandomNumber.
- Oracle client calls processQueue() function time interval, and this function process requests in the pendingRequests and pendingBatchRequests List.
- processRequest() function gets 1 random number and then set it to the Oracle Contract by invoking setRandomNumber() transition
- processBatchRequest() function gets 10 random numbers (1 is 90 for level 4) and then set it to the Oracle Contract by invoking setBatchRandomNumber() transitoin.
### Oracle Contract
- requestRandomNumber() ====> Generate random requset id and then returns it to the caller contract by invoking "getRequestId" transition
- requestBatchRandomNumber() ====> Generate random request id and then returns it to the caller contract by invoking "getBatchRequestId" transition
- setRandomNumber(randomNumber: Uint256, callerAddress: ByStr20, id: Uint256) ====> Returns Random Number to _callerAddress by invoking "callback" transition on it. Only contract owner allowed invoking.
- setBatchRandomNumber(randomNumbers: List (Uint256), callerAddress: ByStr20, id: Uint256) ====> Returns Batch Random Numbers to _callerAddress by invoking "callbackBatch" transition on it. Only contract owner allowed invoking.


## Heroes Mint Contract
- Need to set the Oracle Contract Address first.
- MintNFT() transition ===> This transition invokes requestRandomNumber() transition in the oracle contract. And then getRequestId transition is invoked by the Oracle Client to receive the id.
- BatchMintNFT() transition ===> This transition invokes requestBatchRandomNumber() transition in the oracle contract. And then getBatchRequestId transition is invoked by the Oracle Clint to receive the id.
- callback() transition ===> This transition is invoked by the Oracle Client after MintNFT() transition is called by the users. This transition receives the generated random number first, and then call Mint() transition in the Heroes NFT contract.
- callbackBatch() transition ===> This transition is invoked by the Oracle Client after BatchMintNFT() transition is called by the users. This transition receives the generated random numbers (x10) first, and then call BatchMint() transition in the Heroes NFT contract.

## Heroes NFT Contract
- This contract is built on the ZRC6 contract.
- The generated NFT's traits(name, level, unit type) are determined from the Random Number.
- Determining Algorithm is like below.
If randomNumber % 100 < 80 then it's level 3
If randomNumber %199 < 98 then it's level 4
Else it's level 5
If NFT's level is 3 then
If randomNumber % 3 == 0 then it's Gui Ping
If randomNumber % 3 == 1 then it's Calix
If randomNumber % 3 == 2 then it's Mia

...

## Steps to deploy
- Deploy Oracle Contract
- Set env variables of Oracle Client (Oracle Contract address is needed)
- Deploy Heroes NFT Contract with name, symbol, owner address ...

    ** GasLimit - 60000

    ** Gas Price - 2000000000
- Deploy Minting Contract

    ** Set NFT Contract address

    ** Set Oracle Contract address
- Heroes NFT contract configuration 

  ** Call Unpause() transition

  ** Call AddMinter(minter: ByStr20) transition with the Minting Contract address to allow for it to Mint tokens
- Run Oracle Client
