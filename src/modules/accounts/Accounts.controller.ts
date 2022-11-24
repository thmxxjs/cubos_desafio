import { plainToClass } from 'class-transformer'
import { Express } from 'express'
import "./services"
import { CreateAccountUseCase, InputAccountDTO } from './useCases/CreateAccountUseCase'
import { ListUserAccountsUseCase } from './useCases/ListUserAccountsUseCase'

export class AccountsController {
  static register (app: Express) {
    app.post('/accounts', async (request, response) => {
      try {
        const payload = plainToClass(InputAccountDTO, request.body)
        const userId = request.headers["x-user"] as string

        const createdAccountUseCase = new CreateAccountUseCase(payload, parseInt(userId))
       
        const execution = await createdAccountUseCase.execute()

        if (execution.isRight()) {
          response.json(execution.right().toJSON())
          return
        }

        response.json(execution.left().toJSON())
      } catch (e) {
        response.status(500).send()
      }
    })

    app.get('/accounts', async (request, response) => {
      const userId = request.headers["x-user"] as string
    
      try {
        const listUserAccountsUseCase = new ListUserAccountsUseCase(parseInt(userId))

        const accounts = await listUserAccountsUseCase.execute()

        response.json(accounts.map(account => account.toJSON()))
      } catch (e) {
        response.status(500).send()
      }
    })
  }
}