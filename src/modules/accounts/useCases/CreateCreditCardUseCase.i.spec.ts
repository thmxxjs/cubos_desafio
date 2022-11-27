/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { plainToClass } from "class-transformer"
import { RegisterPeopleUseCase, PeopleInputDTO } from "../../people/useCases/RegisterPeopleUseCase"
import "../services"
import "../../people/services"
import { CreateCreditCardUseCase, InputCreditCardDTO } from "./CreateCreditCardUseCase"
import { CreateAccountUseCase, InputAccountDTO } from "./CreateAccountUseCase"

describe("POST /accounts/:accountId/cards", () => {

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

  describe("Quando um usuário tenta criar um cartão sem especificar o cvv", () => {
    let accountId = 0

    beforeEach(async () => {
      const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
        "account": "1234567-1"
      }), userId)

      const executionResult = await createAccountUseCase.execute()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      accountId = parseInt(executionResult.right().toJSON().id!)
    })

    it("Deve retornar erro de payload inválido", async () => {
      const createCreditCardUseCase = new CreateCreditCardUseCase(plainToClass(InputCreditCardDTO, {
        "type": "virtual",
        "number": "5179 7447 8594 6979",
      }), accountId, userId)

      const executionResult = await createCreditCardUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("INVALID_PAYLOAD")
    })
  })

  describe("Quando um usuário tenta criar um cartão especificando uma conta que não existe", () => {
    it("Deve retornar erro de payload inválido", async () => {
      const createCreditCardUseCase = new CreateCreditCardUseCase(plainToClass(InputCreditCardDTO, {
        "type": "virtual",
        "number": "5179 7447 8594 6979",
        "cvv": "512"
      }), 0, userId)

      const executionResult = await createCreditCardUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("ACCOUNT_NOT_FOUND")
    })
  })

  describe("Quando um usuário tenta criar um cartão especificando uma conta que não pertence ao mesmo", () => {
    let secondUserId = 0
    let secondUserAccountId = 0

    beforeEach(async () => {
      // create a second user

      const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
        document: "497.714.240-33",
        name: "Thomas Anderson",
        password: "casa1234"
      }))
  
      const executionResultCreateUser = await registerPeopleUseCase.execute()
  
      secondUserId = parseInt(executionResultCreateUser.right().toJSON().id!)

      // create second user account

      const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
        "branch": "123",
        "account": "1234567-1"
      }), secondUserId)

      const executionResultCreateAccount = await createAccountUseCase.execute()
      secondUserAccountId = parseInt(executionResultCreateAccount.right().toJSON().id!)
    })

    it("Deve retornar erro de payload inválido", async () => {
      const createCreditCardUseCase = new CreateCreditCardUseCase(plainToClass(InputCreditCardDTO, {
        "type": "virtual",
        "number": "5179 7447 8594 6979",
        "cvv": "512"
      }), secondUserAccountId, userId)

      const executionResult = await createCreditCardUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("UNAUTHORIZED")
    })
  })
})

