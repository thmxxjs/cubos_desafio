import { Either } from "monet"
import { Inject } from "typescript-ioc"
import { Transaction } from "../models/Transaction.model"
import { AccountNotFoundError, AccountsRepository, InsuficientBalanceError, TransactionAlreadyReverted, TransactionNotFoundError } from "../services/AccountsRepository.service"

// --- DTOs

export class UserIdNotAccountOwnerError extends Error {
  public status = 403

  public toJSON() {
    return {
      'error': 'UNAUTHORIZED',
      'data': null
    }
  }
}

// --- UseCase

export class RevertTransactionUseCase {
  @Inject
  private accountsRepository!: AccountsRepository

  constructor(private transactionId: number, private accountId: number, private userId: number) {}

  public async execute(): Promise<Either<InsuficientBalanceError | TransactionAlreadyReverted | TransactionNotFoundError, Transaction>> {
    const userAccountOwnerShipVerification = await this.checkUserIdAccountOwner()

    if (userAccountOwnerShipVerification.isLeft()) {
      return Either.Left(userAccountOwnerShipVerification.left())
    }

    if (!userAccountOwnerShipVerification.right()) {
      return Either.Left(new UserIdNotAccountOwnerError())
    }

    return this.accountsRepository.revertTransaction(this.transactionId)
  }

  private async checkUserIdAccountOwner(): Promise<Either<AccountNotFoundError, boolean>> {
    const account = await this.accountsRepository.getAccountById(this.accountId)

    if (account.isLeft()) {
      return Either.Left(account.left())
    }

    return Either.Right(account.right().ownerId === this.userId)
  }
}