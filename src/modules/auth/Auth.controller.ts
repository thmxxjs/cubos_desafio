import { Express } from 'express'
import jose from 'node-jose'
import fs from 'fs'

const publicKey = fs.readFileSync(__dirname + '/../../../cert/cubos_pub.pem').toString()

export class AuthController {
  static register (app: Express) {
    app.get('/auth/keys', async (request, response) => {
      const keystore = jose.JWK.createKeyStore()

      await keystore.add(publicKey, "pem")

      const keys = await keystore.toJSON(false)
      response.json(keys)
    })
  }
}
