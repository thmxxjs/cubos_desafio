import { plainToClass } from "class-transformer"
import { RegisterPeopleUseCase, PeopleInputDTO } from "../../people/useCases/RegisterPeopleUseCase"
import "../services"
import "../../people/services"
import { ListUserAccountsUseCase } from "./ListUserAccountsUseCase"
import { CreateAccountUseCase, InputAccountDTO } from "./CreateAccountUseCase"

describe("GET /accounts", () => {

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

  describe("Quando um usuário sem conta alguma tenta listar suas contas", () => {
    it("Deve retornar uma lista vazia de contas", async () => {
      const listUserAccountsUseCase = new ListUserAccountsUseCase(userId)

      const executionResult = await listUserAccountsUseCase.execute()

      expect(executionResult.length).toBe(0)
    })
  })

  describe("Quando um usuário com duas contas distintas tenta listar suas contas", () => {
    beforeEach(async () => {
      const createAccount1UseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
        "account": "1234567-1"
      }), userId)

      await createAccount1UseCase.execute()

      const createAccount2UseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
        "account": "1234567-2"
      }), userId)

      await createAccount2UseCase.execute()
    })

    it("Deve retornar uma lista contendo as duas contas no formato esperado", async () => {
      const listUserAccountsUseCase = new ListUserAccountsUseCase(userId)

      const executionResult = await listUserAccountsUseCase.execute()

      expect(executionResult.length).toBe(2)
      expect(executionResult).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          "branch": "123",
          "account": "1234567-1",
          "createdAt": expect.any(Date),
          "updatedAt": expect.any(Date)
        }),
        expect.objectContaining({
          id: expect.any(String),
          "branch": "123",
          "account": "1234567-2",
          "createdAt": expect.any(Date),
          "updatedAt": expect.any(Date)
        })
      ]))
    })
  })
})