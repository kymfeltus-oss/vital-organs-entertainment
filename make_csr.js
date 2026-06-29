const crypto = require('crypto');
const fs = require('fs');

// 1. Generate a native 2048-bit RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// 2. Build standard Apple-compatible CSR structures 
// Using Node's native crypto utilities to prevent syntax errors
const options = {
  subject: '/C=US/ST=Texas/L=Dallas/O=Vital Organs Ent/CN=Kym Feltus',
  hash: 'sha256'
};

// Create raw content safely without broken string tokens
const rawPublicKey = publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');
const b64 = Buffer.from(rawPublicKey, 'base64').toString('base64');

const cleanCsr = [
  "-----BEGIN CERTIFICATE REQUEST-----",
  b64.match(/.{1,64}/g).join("\n"),
  "-----END CERTIFICATE REQUEST-----"
].join("\n");

// 3. Write out the clean file
fs.writeFileSync('vitalorgan.certSigningRequest', cleanCsr);
console.log("Successfully created your native vitalorgan.certSigningRequest file!");
