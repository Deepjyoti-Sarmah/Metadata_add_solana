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
    const privateKeyString = process.env.PRIVATE_KEY;
    const privateKeyBytes = new TextEncoder().encode(privateKeyString);
    const myPrivateKey = new Uint8Array(privateKeyBytes);
    const myKeypair = web3.Keypair.fromSecretKey(myPrivateKey);
    const mint = new web3.PublicKey("3TxB7fkhPoodssFBx3GhdGRR6NWd9N7XVeUkNnCnGG4P");
    
    // const myKeypair = loadWalletKey("ANDhx6WNwo8AS38bkcHgCzWDXDoQgwTFjqXQ1Qoi3EPe");
    // const mint = new web3.PublicKey("FDR33Ecfb8Dc65AJQZeChexjvioykdDKLNwC5JuB4bYp");
    const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());
    const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);
    const accounts = {
        metadata: metadataPDA,
        mint,
        mintAuthority: myKeypair.publicKey,
        payer: myKeypair.publicKey,
        updateAuthority: myKeypair.publicKey,
    }
    const dataV2 = {
        name: "Fake INR Token",
        symbol: "FIR",
        uri: "https://avatars.githubusercontent.com/u/74607221?s=96&v=4",
        // we don't need that
        sellerFeeBasisPoints: 0,
        creators: null,
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