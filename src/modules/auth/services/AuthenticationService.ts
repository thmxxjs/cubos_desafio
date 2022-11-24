import { Either } from "monet";
import People from "../../people/model/People.model";

export abstract class AuthenticationService {
  abstract verifyCredentials(document: string, password: string): Promise<boolean>
  abstract getUserByDocument(document: string): Promise<Either<UserNotFoundError, People>>
}

export class UserNotFoundError extends Error {}

