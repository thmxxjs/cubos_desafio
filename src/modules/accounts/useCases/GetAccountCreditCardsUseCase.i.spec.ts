/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { plainToClass } from "class-transformer"
import { RegisterPeopleUseCase, PeopleInputDTO } from "../../people/useCases/RegisterPeopleUseCase"
import "../services"
import "../../people/services"
import { GetAccountCreditCardsUseCase } from "./GetAccountCreditCardsUseCase"
import { CreateAccountUseCase, InputAccountDTO } from "./CreateAccountUseCase"
import { CreateCreditCardUseCase, InputCreditCardDTO } from "./CreateCreditCardUseCase"

describe("GET /accounts/:accountId/cards", () => {
  let userId = 0
  let userAccountId = 0

  beforeEach(async () => {
    // default user creation for testing

    const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
      document: "087.208.600-30",
      name: "Thomas Anderson",
      password: "casa1234"
    }))

    const executionResult = await registerPeopleUseCase.execute()

    userId = parseInt(executionResult.right().toJSON().id!)

    // default account creation for testing

    const createAccountUseCase = new CreateAccountUseCase(plainToClass(InputAccountDTO, {
      "branch": "123",
      "account": "1234567-1"
    }), userId)

    const executionResultCreateAccount = await createAccountUseCase.execute()
    userAccountId = parseInt(executionResultCreateAccount.right().toJSON().id!)
  })

  describe("Quando um usuário tenta listar os cartões de uma conta inexistente", () => {
    it("Deve retornar erro de conta não encontrada", async () => {
      const getAccountCreditCardsUseCase = new GetAccountCreditCardsUseCase(0, userId)

      const executionResult = await getAccountCreditCardsUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("ACCOUNT_NOT_FOUND")
    })
  })

  describe("Quando um usuário tenta listar os cartões de uma conta que não pertence ao mesmo", () => {
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
        "account": "1234567-2"
      }), secondUserId)

      const executionResultCreateAccount = await createAccountUseCase.execute()
      secondUserAccountId = parseInt(executionResultCreateAccount.right().toJSON().id!)
    })

    it("Deve retornar erro de acesso não autorizado", async () => {
      const getAccountCreditCardsUseCase = new GetAccountCreditCardsUseCase(secondUserAccountId, userId)

      const executionResult = await getAccountCreditCardsUseCase.execute()

      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("UNAUTHORIZED")
    })
  })

  describe("Ao tentar listar os cartões antes de cadastrar algum cartão", () => {
    it("Deve retornar uma lista vazia de cartões", async () => {
      const getAccountCreditCardsUseCase = new GetAccountCreditCardsUseCase(userAccountId, userId)

      const executionResult = await getAccountCreditCardsUseCase.execute()

      expect(executionResult.isRight()).toBe(true)
      expect (executionResult.right().length).toBe(0)
    })
  })

  describe("Quando o usuário tem 2 cartões cadastrados na conta e tenta listar os mesmos", () => {
    beforeEach(async () => {
      // create card 1

      const createCreditCard1UseCase = new CreateCreditCardUseCase(plainToClass(InputCreditCardDTO, {
        "type": "virtual",
        "number": "5179 7447 8594 6979",
        "cvv": "512"
      }), userAccountId, userId)

      await createCreditCard1UseCase.execute()
  
      // create card 2

      const createCreditCard2UseCase = new CreateCreditCardUseCase(plainToClass(InputCreditCardDTO, {
        "type": "physical",
        "number": "5179 7447 8594 6980",
        "cvv": "512"
      }), userAccountId, userId)

      await createCreditCard2UseCase.execute()
    })

    it("Deve retornar 2 cartões na listagem no formato esperado com as informações dos cartões", async () => {
      const getAccountCreditCardsUseCase = new GetAccountCreditCardsUseCase(userAccountId, userId)

      const executionResult = await getAccountCreditCardsUseCase.execute()

      expect(executionResult.isRight()).toBe(true)
      expect (executionResult.right().length).toBe(2)
      expect(executionResult.right()).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          "type": "virtual",
          "number": "5179 7447 8594 6979",
          "cvv": "512",
          "createdAt": expect.any(Date),
          "updatedAt": expect.any(Date)
        }),
        expect.objectContaining({
          id: expect.any(String),
          "type": "physical",
          "number": "5179 7447 8594 6980",
          "cvv": "512",
          "createdAt": expect.any(Date),
          "updatedAt": expect.any(Date)
        })
      ]))
    })
  })
})