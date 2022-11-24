import { plainToClass } from 'class-transformer'
import { Express } from 'express'
import { PeopleInputDTO, RegisterPeopleUseCase } from './useCases/RegisterPeopleUseCase'
import './services'

export class PeopleController {
  static register (app: Express) {
    app.post("/people", async (request, response) => {
      const payload = plainToClass(PeopleInputDTO, request.body)

      try {
        const registerPeopleUseCase = new RegisterPeopleUseCase(payload)
        const execution = await registerPeopleUseCase.execute()

        if (execution.isRight()) {
          response.json(execution.right().toJSON())
          return
        }

        response.json(execution.left().toJSON())
      } catch (e) {
        response.status(500).send()
      }
    })
  }
}