import { Express, response } from 'express'

export class AccountsController {
  static register (app: Express) {
    app.get('/accounts', async (request, response) => {
      response.json({
        user: request.headers["x-user"]
      })
    })
  }
}