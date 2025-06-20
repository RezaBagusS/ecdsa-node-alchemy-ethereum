import { useState } from "react";
import server from "./server";

import { keccak256 } from "keccak";
import * as secp from "@noble/secp256k1";

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    console.log("test");
    

    // 1. Buat pesan transaksi
    const txMessage = { recipient, amount };

    // 2. Hash pesan tersebut menggunakan Keccak-256
    const messageHash = keccak256(Buffer.from(JSON.stringify(txMessage)));

    // 3. Tandatangani hash pesan dengan kunci privat
    // `secp.sign` akan mengembalikan signature beserta recovery bit
    const [signature, recoveryBit] = await secp.sign(messageHash, privateKey, {
      recovered: true,
    });

    // Gabungkan signature dan recovery bit untuk dikirim ke server
    const fullSignature = {
      r: signature.r.toString(16),
      s: signature.s.toString(16),
      recovery: recoveryBit,
    };

    // 4. Kirim ke server
    const body = {
      sender: address, // Alamat pengirim
      recipient,
      amount,
      messageHash: Buffer.from(messageHash).toString('hex'), // Kirim hash sebagai hex string
      signature: fullSignature,
    };

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        body
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <label>
        Private Key
        <input
          placeholder="Type your private key, before transfer your mount"
          value={privateKey}
          onChange={setValue(setPrivateKey)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
