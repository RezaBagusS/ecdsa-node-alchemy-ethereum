const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const { keccak256 } = require("ethereum-cryptography/keccak");
const secp = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");

const generateAddress = () => {
  const privateKey = secp.utils.randomPrivateKey();
  console.log('Private Key:', toHex(privateKey));

  const publicKey = secp.getPublicKey(privateKey);
  // console.log('Public Key:', toHex(publicKey));

  // Buat alamat Ethereum dari kunci publik
  // 1. Hash kunci publik menggunakan Keccak256
  // 2. Ambil 20 byte terakhir dari hash tersebut
  const addressBytes = keccak256(publicKey.slice(1)).slice(-20);
  const ethAddress = `0x${toHex(addressBytes)}`
  // console.log('Ethereum Address:', ethAddress);

  return ethAddress;
}

app.use(cors());
app.use(express.json());

let balances = {};

for (let i = 0; i < 3; i++) {
  let getAddress = generateAddress();
  balances[getAddress] = 100;
}

console.log(balances);

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, messageHash, signature } = req.body;

  const sig = new secp256k1.Signature(
    BigInt("0x" + signature.r),
    BigInt("0x" + signature.s)
  );

  const recoveryBit = signature.recovery;
  const msgHashBytes = hexToBytes(messageHash);

  // 1. Pulihkan Kunci Publik
  const publicKey = sig.recoverPublicKey(msgHashBytes, recoveryBit);

  // 2. Dapatkan alamat dari kunci publik
  const recoveredAddress = `0x${toHex(keccak256(publicKey.toRawBytes().slice(1)).slice(-20))}`;

  // 3. Validasi!
  if (recoveredAddress !== sender) {
    return res.status(401).send({ message: "Invalid signature. Cannot authenticate sender." });
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
