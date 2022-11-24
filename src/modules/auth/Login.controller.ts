import { plainToClass } from 'class-transformer'
import { Express } from 'express'
import { LoginInputDTO, LoginUseCase } from './useCases/LoginUseCase'
import './services'

export class LoginController {
  static register (app: Express) {
    app.post('/login', async (request, response) => {
      const payload = plainToClass(LoginInputDTO, request.body)

      try {
        const registerPeopleUseCase = new LoginUseCase(payload)
        const execution = await registerPeopleUseCase.execute()

        if (execution.isRight()) {
          response.json(execution.right().toJSON())
          return
        }

        response.json(execution.left().toJSON())
      } catch (e) {
        console.log(e)
        response.status(500).send()
      }
    }) 
  }
}
