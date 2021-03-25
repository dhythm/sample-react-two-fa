import scrypt from "browserify-scrypt";
import crypto from "crypto-browserify";
import QRCode from "qrcode.react";
import React from "react";
import speakeasy from "speakeasy";
import "./App.css";

// Originally, the following code should be in the BE and use Node.js.
// I'm lazy, so I put it on the FE to check the behaviour.
const salt = "12345678";
const BUFFER_KEY = "ABCDEFGFIJKLMNOP";

const encrypt = (plainText: string, password: string): string => {
  const key = scrypt.scryptSync(password, salt, 32);
  const iv = Buffer.from(BUFFER_KEY);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let cipheredData = cipher.update(plainText, "utf8", "hex");
  cipheredData += cipher.final("hex");
  return cipheredData;
};

const decrypt = (encryptedText: any, password: string): string => {
  const key = scrypt.scryptSync(password, salt, 32);
  const iv = Buffer.from(BUFFER_KEY);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decipheredData = decipher.update(encryptedText, "hex", "utf8");
  decipheredData += decipher.final("utf8");
  return decipheredData;
};

const TOTP_ENCRYPTION_PASSWORD = "abcdefghijklmnopqrstuvwxyz123456";

const verify = (encryptedSecret: string, totpToken: string) => {
  console.log({ encryptedSecret, totpToken });
  return speakeasy.totp.verify({
    encoding: "base32",
    token: totpToken,
    secret: decrypt(encryptedSecret, TOTP_ENCRYPTION_PASSWORD),
  });
};

const generateEncryptedTotpSecret = () =>
  encrypt(
    speakeasy.generateSecret({ length: 20 }).base32,
    TOTP_ENCRYPTION_PASSWORD
  );

const encryptedSecret = generateEncryptedTotpSecret();
const totpSecret = decrypt(encryptedSecret, TOTP_ENCRYPTION_PASSWORD);

function App() {
  const [totpToken, setTotpToken] = React.useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
    setTotpToken(e.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <QRCode
          size={230}
          // https://github.com/google/google-authenticator/wiki/Key-Uri-Format
          value={`otpauth://totp/SAMPLEAPP:${encodeURIComponent(
            "sample@test.com"
          )}?secret=${totpSecret}&issuer=ISSUER&algorithm=SHA1&digits=6&period=30`}
        />
        <form>
          <label>
            MFA code:
            <input
              type="text"
              name="mfa"
              value={totpToken}
              onChange={handleChange}
            />
          </label>
          <button
            onClick={(e) => {
              e.preventDefault();
              const result = verify(encryptedSecret, totpToken);
              console.log({ result });
            }}
          >
            check
          </button>
        </form>
      </header>
    </div>
  );
}

export default App;
