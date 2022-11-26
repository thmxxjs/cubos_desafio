import { Express } from 'express'
import { GetAllUserCardsUseCase } from './useCases/GetAllUserCardsUseCase'

export class CardsController {
  static register (app: Express) {
    app.get('/cards', async (request, response) => {
      try {
        const userId = request.headers["x-user"] as string

        const getAllUserCardsUseCase = new GetAllUserCardsUseCase(parseInt(userId), {
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