import { plainToClass } from "class-transformer"
import { PeopleInputDTO, RegisterPeopleUseCase } from "../../people/useCases/RegisterPeopleUseCase"
import { CreateAccountUseCase, InputAccountDTO } from "./CreateAccountUseCase"
import "../services"
import "../../people/services"

describe("POST /accounts", () => {

  let userId = 0

  beforeEach(async () => {
    const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
      document: "087.208.600-30",
      name: "Thomas Anderson",
      password: "casa1234"
    }))

    const executionResult = await registerPeopleUseCase.execute()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    userId = parseInt(executionResult.right().toJSON().id!)
  })

  describe("Quando um usuário cadastrado no sistema tenta criar uma conta sem especificar a agência", () => {
    it("Deve retornar erro de payload inválido", async () => {
      const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "account": "1234567-1"  
      }), userId)

      const executionResult = await createAccountUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("INVALID_PAYLOAD")
    })
  })

})