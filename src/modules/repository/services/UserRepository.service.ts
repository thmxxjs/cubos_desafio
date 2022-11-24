import { Either } from "monet";
import PeopleModel from "../../people/model/People.model";
import {PeopleAlreadyExistsError, PeopleRepository } from "../../people/services/PeopleRepository.service";
import { PrismaClient } from "@prisma/client";
import People from "../../people/model/People.model";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { AuthenticationService, UserNotFoundError } from "../../auth/services/AuthenticationService";

const prisma = new PrismaClient()

export class PrismaPeopleRepository implements PeopleRepository, AuthenticationService {
  async addPeople(people: PeopleModel): Promise<Either<PeopleAlreadyExistsError, PeopleModel>> {

    try {
      const createdPeoplePrisma = await prisma.people.create({
        data: {
          document: people.document,
          name: people.name,
          password: people.password
        }
      })

      const createdPeople = new People(
        createdPeoplePrisma.name,
        createdPeoplePrisma.document,
        createdPeoplePrisma.password
      )

      createdPeople.id = createdPeoplePrisma.id.toString()
      createdPeople.createdAt = createdPeoplePrisma.createdAt
      createdPeople.updatedAt = createdPeoplePrisma.updatedAt

      return Either.Right(createdPeople)
    } catch (e) {
      if ((e as PrismaClientKnownRequestError).code === 'P2002') {
        return Either.Left(new PeopleAlreadyExistsError())
      }
      
      throw "Unkown Error"
    }
  }

  async verifyCredentials(document: string, password: string): Promise<boolean> {
    const peoplePrisma = await prisma.people.findFirst({
      where: {
        AND: {
          password,
          document
        }
      }
    })

    return peoplePrisma !== null
  }

  async getUserByDocument(document: string): Promise<Either<UserNotFoundError, PeopleModel>> {
    const peoplePrisma = await prisma.people.findFirst({
      where: {
        document
      }
    })

    if (peoplePrisma === null) {
      return Either.left(new UserNotFoundError())
    }

    const people = new People(
      peoplePrisma.name,
      peoplePrisma.document,
      peoplePrisma.password
    )

    people.id = peoplePrisma.id.toString()
    people.createdAt = peoplePrisma.createdAt
    people.updatedAt = peoplePrisma.updatedAt

    return Either.right(people)
  }
}