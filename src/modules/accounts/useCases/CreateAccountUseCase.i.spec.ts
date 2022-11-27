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

  describe("Quando um usuário cadastrado no sistema tenta criar uma conta sem especificar a conta", () => {
    it("Deve retornar erro de payload inválido", async () => {
      const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
      }), userId)

      const executionResult = await createAccountUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("INVALID_PAYLOAD")
    })
  })

  describe("Quando a conta 1234567-1 já existe e um usuário cadastrado no sistema tenta criar a mesma conta 1234567-1", () => {
    beforeEach(async () => {
      const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
        "account": "1234567-1"
      }), userId)

      await createAccountUseCase.execute()
    })

    it("Deve retornar erro de payload inválido", async () => {
      const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
        "account": "1234567-1"
      }), userId)

      const executionResult = await createAccountUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("ACCOUNT_ALREADY_EXISTS")
    })
  })

  describe("Quando um usuário tenta criar uma conta que ainda não existe e payload válido", () => {
    it("Deve retornar status de sucesso e o payload esperado com informações da conta", async () => {
      const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
        "account": "1234567-1"
      }), userId)

      const executionResult = await createAccountUseCase.execute()

      expect(executionResult.isRight()).toBe(true)
      expect(executionResult.right().toJSON()).toEqual(expect.objectContaining({
        "id": expect.any(String),
        "branch": "123",
        "account": "1234567-1",
        "createdAt": expect.any(Date),
        "updatedAt": expect.any(Date)
      }))
    })
  })

})