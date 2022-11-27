import { PeopleInputDTO, RegisterPeopleUseCase } from "./RegisterPeopleUseCase";
import "../services/index"
import { plainToClass } from "class-transformer";

describe("POST /people", () => {

  describe("Quando tento registrar uma pessoa com documento no formato 123.123.123-1", () => {
    it("Deve retornar erro de payload inválido", async () => {
      const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
        document: "123.123.123-1",
        name: "Thomas Anderson",
        password: "casa1234"
      }))
  
      const executionResult = await registerPeopleUseCase.execute()
  
      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("INVALID_PAYLOAD")
    })
  })

  describe("Quando tento registrar uma pessoa com senha menor que 6 caracteres", () => {
    it("Deve retornar erro de payload inválido", async () => {
      const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
        document: "123.123.123-12",
        name: "Thomas Anderson",
        password: "casa"
      }))
  
      const executionResult = await registerPeopleUseCase.execute()
  
      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("INVALID_PAYLOAD")
    })
  })

  describe("Quando tenho um usuário de CPF 087.208.600-30 registrado no sistema e tento registrar um usuário de mesmo CPF", () => {
    beforeEach(async () => {
      const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
        document: "087.208.600-30",
        name: "Thomas Anderson",
        password: "casa1234"
      }))
  
      await registerPeopleUseCase.execute()
    })

    it("Deve retornar erro de usuário já cadastrado", async () => {
      const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
        document: "087.208.600-30",
        name: "Thomas Anderson",
        password: "casa1234"
      }))
  
      const executionResult = await registerPeopleUseCase.execute()
  
      expect(executionResult.isLeft()).toBe(true)
      expect (executionResult.left().toJSON().error).toBe("PEOPLE_ALREADY_EXISTS")
    })
  })

  describe("Quando tento registrar uma pessoa com payload válido", () => {
    it("Deve retornar sucesso com payload em formato esperado", async () => {
      const registerPeopleUseCase = new RegisterPeopleUseCase(plainToClass(PeopleInputDTO, {
        document: "087.208.600-30",
        name: "Thomas Anderson",
        password: "casa1234"
      }))
  
      const executionResult = await registerPeopleUseCase.execute()

      expect(executionResult.isRight()).toBe(true)
      expect (executionResult.right().toJSON()).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: "Thomas Anderson",
        document: "08720860030",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }))
    })
  })

})