import { plainToClass } from 'class-transformer'
import { Express } from 'express'
import "./services"
import { CreateAccountUseCase, InputAccountDTO } from './useCases/CreateAccountUseCase'
import { CreateCreditCardUseCase, InputCreditCardDTO } from './useCases/CreateCreditCardUseCase'
import { GetAccountCreditCardsUseCase } from './useCases/GetAccountCreditCardsUseCase'
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

        response.status(execution.left().status).json(execution.left().toJSON())
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

    app.post('/accounts/:accountId/cards', async (request, response) => {
      try {
        const payload = plainToClass(InputCreditCardDTO, request.body)
        const userId = request.headers["x-user"] as string
        const accountId = request.params.accountId

        const createdAccountUseCase = new CreateCreditCardUseCase(payload, parseInt(accountId), parseInt(userId))
       
        const execution = await createdAccountUseCase.execute()

        if (execution.isRight()) {
          response.json(execution.right().toJSON())
          return
        }

        response.status(execution.left().status).json(execution.left().toJSON())
      } catch (e) {
        response.status(500).send()
      }
    })

    app.get('/accounts/:accountId/cards', async (request, response) => {    
      try {
        const userId = request.headers["x-user"] as string
        const accountId = request.params.accountId

        const getAccountCreditCardsUseCase = new GetAccountCreditCardsUseCase(parseInt(accountId), parseInt(userId))

        const execution = await getAccountCreditCardsUseCase.execute()

        if (execution.isRight()) {
          const creditCards = execution.right()
          response.json(creditCards.map(creditCard => creditCard.toJSON()))
          return
        }

        response.status(execution.left().status).json(execution.left().toJSON())
      } catch (e) {
        response.status(500).send()
      }

      response.json({})
    })
  }
}