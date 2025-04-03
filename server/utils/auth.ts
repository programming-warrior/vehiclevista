
import { scrypt, randomBytes, timingSafeEqual } from "crypto";


export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex").normalize();
    return new Promise((resolve, reject)=>{
        scrypt(password, salt, 64, (err, hash)=>{
            if(err) reject(err);
            resolve(hash.toString("hex").normalize() + "." + salt)
        })
    })
  }
  
export async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    return new Promise((resolve, reject)=>{
        scrypt(supplied, salt, 64, (err, suppliedBuf)=>{
            if(err) reject(err);
            resolve(timingSafeEqual(hashedBuf, suppliedBuf));
        })
    })
  }