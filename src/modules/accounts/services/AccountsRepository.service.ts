import { Either } from "monet";
import { Account } from "../models/Account.model";

export abstract class AccountsRepository {
  public abstract registerAccount(account: Account): Promise<Either<AccountAlreadyExists, Account>>
  public abstract getAccountsByUserId(userId: number): Promise<Account[]>
}

export class AccountAlreadyExists extends Error {
  public toJSON() {
    return {
      'error': 'ACCOUNT_ALREADY_EXISTS',
      'data': null
    }
  }
}