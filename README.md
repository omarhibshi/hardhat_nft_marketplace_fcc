The NFT Market Place 

This project can be run using 
1. Moralis Self-hosted server
2. The Graph

# 1. Moralis Self-hosted Server

## Open the following workspaces in VSCODE simultaniously:
-**hardhat_nft_marketplace_fcc** (Backend)
-**nextjs-nft-marketplace-Moralis-fcc** (Front-end)
-**parse-server-migration** (moralis self-hosted server)
> **"parse-server-migration"** is a subfolder inside **"nextjs-nft-marketplace-Moralis-fcc"**

    
## To start the project, Please follow the steps below in the exact listed order :
 1. on the Backend ( ***hardhat_nft_marketplace_fcc***),  start a "local hardhat node" with the command:
    >***yarn hardhat node***
 2. On the Moralis self-hosted server (***parse-server-migration***) , start a front-end server with the command:
    >***yarn dev***
 3. On the font-end (***nextjs-nft-marketplace-Moralis-fcc***), run the script to setup the "Events listener" using the command:
    >***node addEvents.js ***
 4. On the Backend ( ***hardhat_nft_marketplace_fcc***), run a few scripts to min, cancel and buy NFTS
    > yarn hardhat run scripts/mint-then-list.js --network localhost
    > yarn hardhat run scripts/buy-item.js --network localhost
    > yarn hardhat run scripts/cancel-item-list.js --network localhost
 5. On the font-end (***nextjs-nft-marketplace-Moralis-fcc***), , start a front-end server with the command::
    >***yarn dev***
 6. Check the NFY market place on the browser


 # 2. The Graph

## Open the following workspaces in VSCODE simultaniously:
-**hardhat_nft_marketplace_fcc** (Backend)
-**nextjs-nft-marketplace-thegraph-fcc** (Front-end)
-**graph-nft-markeplace-fcc** (the graph)

## To start the project, Please follow the steps below in the exact listed order :
 1. Use **graph-nft-markeplace-fcc** to Setup the "Events Listener" and also to build the Query
 2. On the font-end (***nextjs-nft-marketplace-thegraph-fcc***), , start a front-end server with the command::
    >***yarn dev***
 3. Check the NFY market place on the browser