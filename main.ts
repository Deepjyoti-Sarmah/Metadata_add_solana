import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';
import dotenv from "dotenv";
dotenv.config();

export function loadWalletKey(keypairFile:string): web3.Keypair {
    const fs = require("fs");
    const loaded = web3.Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    return loaded;
}

const INITIALIZE = true; 

async function main(){
    console.log("let's create our own token and add metadata!");

    const myKeypair = loadWalletKey("/home/deepjyotisarmah/.config/solana/id.json");
    const mint = new web3.PublicKey("5NFKXyqCsFc6rKrWBodtSm5cA5U1kYZzKhk6HbbLPakA");

    const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());
    const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);
    
    let creatorslist:  { address: web3.PublicKey; share: number; verified: boolean }[] = [
        {"address": myKeypair.publicKey, "share" : 100, "verified": true} ,
    ]
    
    const accounts = {
        metadata: metadataPDA,
        mint,
        mintAuthority: myKeypair.publicKey,
        payer: myKeypair.publicKey,
        updateAuthority: myKeypair.publicKey,
    }
    const dataV2 = {
        name: "Deepjyoti Sarmah Solana Token",
        symbol: "DSST",
        uri: "https://avatars.githubusercontent.com/u/74607221?s=96&v=4",
        // we don't need that
        sellerFeeBasisPoints: 100,
        creators: creatorslist,
        collection: null,
        uses: null
    }
    let ix;
    if (INITIALIZE) {
        const args =  {
            createMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true
            }
        };
        ix = mpl.createCreateMetadataAccountV2Instruction(accounts, args);
    } else {
        const args =  {
            updateMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true,
                updateAuthority: myKeypair.publicKey,
                primarySaleHappened: true
            }
        };
        ix = mpl.createUpdateMetadataAccountV2Instruction(accounts, args)
    }
    const tx = new web3.Transaction();
    tx.add(ix);
    const connection = new web3.Connection("https://api.devnet.solana.com");
    const txid = await web3.sendAndConfirmTransaction(connection, tx, [myKeypair]);
    console.log(txid);

}

main();