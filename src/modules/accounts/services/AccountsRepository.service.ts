import { Either } from "monet";
import { Account } from "../models/Account.model";
import { AccountCreditCard } from "../models/AccountCreditCard.model";
import { Transaction } from "../models/Transaction.model";

export abstract class AccountsRepository {
  public abstract registerAccount(account: Account): Promise<Either<AccountAlreadyExists, Account>>
  public abstract getAccountsByUserId(userId: number): Promise<Account[]>
  public abstract getAccountById(accountId: number): Promise<Either<AccountNotFoundError, Account>>
  public abstract addCreditCardToAccount(creditCard: AccountCreditCard, accountId: number): Promise<AccountCreditCard>
  public abstract getAccountCreditCards(accountId: number): Promise<Either<AccountNotFoundError, AccountCreditCard[]>>
  public abstract createTransaction(transaction: Transaction, accountId: number): Promise<Either<InsuficientBalanceError, Transaction>>
}

export class AccountAlreadyExists extends Error {
  public status = 400

  public toJSON() {
    return {
      'error': 'ACCOUNT_ALREADY_EXISTS',
      'data': null
    }
  }
}

export class AccountNotFoundError extends Error {
  public status = 404

  public toJSON() {
    return {
      'error': 'ACCOUNT_NOT_FOUND',
      'data': null
    }
  }
}

export class InsuficientBalanceError extends Error {
  public status = 400

  public toJSON() {
    return {
      'error': 'INSUFICIENT_BALANCE',
      'data': null
    }
  }
}