import { Either } from "monet";
import People from "../model/People.model";

export abstract class PeopleRepository {
  abstract addPeople(people: People): Promise<Either<
      PeopleAlreadyExistsError, 
      People
   >>
}

export class PeopleAlreadyExistsError extends Error {
   public toJSON() {
      return {
        'error': 'PEOPLE_ALREADY_EXISTS',
        'data': null
      }
    }
}

