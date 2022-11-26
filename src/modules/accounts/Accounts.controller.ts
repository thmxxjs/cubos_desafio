import { plainToClass } from 'class-transformer'
import { Express } from 'express'
import { TransactionOrigin } from './models/Transaction.model'
import "./services"
import { TransactionType } from './services/AccountsRepository.service'
import { CreateAccountUseCase, InputAccountDTO } from './useCases/CreateAccountUseCase'
import { CreateCreditCardUseCase, InputCreditCardDTO } from './useCases/CreateCreditCardUseCase'
import { CreateTransactionUseCase, InputTransactionDTO } from './useCases/CreateTransactionUseCase'
import { GetAccountBalanceUseCase } from './useCases/GetAccountBalanceUseCase'
import { GetAccountCreditCardsUseCase } from './useCases/GetAccountCreditCardsUseCase'
import { GetAllAccountTransactionsUseCase } from './useCases/GetAllAccountTransactionsUseCase'
import { ListUserAccountsUseCase } from './useCases/ListUserAccountsUseCase'
import { RevertTransactionUseCase } from './useCases/RevertTransactionUseCase'

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
    })

    app.post('/accounts/:accountId/transactions', async (request, response) => {
      try {
        const payload = plainToClass(InputTransactionDTO, request.body)
        const userId = request.headers["x-user"] as string
        const accountId = request.params.accountId

        const createTransactionUseCase = new CreateTransactionUseCase(payload, parseInt(accountId), parseInt(userId))
       
        const execution = await createTransactionUseCase.execute()

        if (execution.isRight()) {
          response.json(execution.right().toJSON())
          return
        }

        response.status(execution.left().status).json(execution.left().toJSON())
      } catch (e) {
        response.status(500).send()
      }
    })

    app.post('/accounts/:accountId/transactions/internal', async (request, response) => {
      try {
        const payload = plainToClass(InputTransactionDTO, request.body)
        const userId = request.headers["x-user"] as string
        const accountId = request.params.accountId

        const createTransactionUseCase = new CreateTransactionUseCase(payload, parseInt(accountId), parseInt(userId), TransactionOrigin.INTERNAL)
       
        const execution = await createTransactionUseCase.execute()

        if (execution.isRight()) {
          execution.right().value *= -1
          response.json(execution.right().toJSON())
          return
        }

        response.status(execution.left().status).json(execution.left().toJSON())
      } catch (e) {
        console.log(e)
        response.status(500).send()
      }
    })

    app.get('/accounts/:accountId/balance', async (request, response) => {
      try {
        const userId = request.headers["x-user"] as string
        const accountId = request.params.accountId

        const getAccountBalanceUseCase = new GetAccountBalanceUseCase(parseInt(accountId), parseInt(userId))

        const execution = await getAccountBalanceUseCase.execute()

        if (execution.isRight()) {
          response.json({
            balance: execution.right()
          })
          return
        }

        response.status(execution.left().status).json(execution.left().toJSON())
      } catch (e) {
        response.status(500).send()
      }
    })

    app.post('/accounts/:accountId/transactions/:transactionId/revert', async (request, response) => {
      try {
        const userId = request.headers["x-user"] as string
        const accountId = request.params.accountId
        const transactionId = request.params.transactionId

        const revertTransactionUseCase = new RevertTransactionUseCase(parseInt(transactionId), parseInt(accountId), parseInt(userId))

        const execution = await revertTransactionUseCase.execute()

        if (execution.isRight()) {
          response.json({
            balance: execution.right()
          })
          return
        }

        response.status(execution.left().status).json(execution.left().toJSON())
      } catch (e) {
        response.status(500).send()
      }
    })

    app.get('/accounts/:accountId/transactions',  async (request, response) => {
      try {
        const userId = request.headers["x-user"] as string
        const accountId = request.params.accountId
        const transactionType: TransactionType | null = (request.query.type as TransactionType | null) ? (request.query.type as TransactionType) : null

        const getAllUserCardsUseCase = new GetAllAccountTransactionsUseCase(parseInt(accountId), parseInt(userId), transactionType, {
          currentPage: parseInt((request.query.currentPage as string) || "1"),
          itemsPerPage: parseInt((request.query.itemsPerPage as string) || "10"),
        })

        const execution = await getAllUserCardsUseCase.execute()

        if (execution.isRight()) {
          response.json(execution.right().toJSON())
          return
        }

        response.status(400).send()
      } catch (e) {
        response.status(500).send()
      }
    })
  }
}