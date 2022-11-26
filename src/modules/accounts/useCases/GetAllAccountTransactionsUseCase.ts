
import { Either } from "monet";
import { Inject } from "typescript-ioc";
import { Transaction } from "../models/Transaction.model";
import { AccountNotFoundError, AccountsRepository, Pagination, TransactionType } from "../services/AccountsRepository.service";

// --- DTOs

export class PaginatedTransactionsOutputDTO {
  constructor(private transactions: Transaction[], private pagination: Pagination) {}

  public toJSON() {
    return {
      "transactions": this.transactions.map(transaction => transaction.toJSON()),
      "pagination": {
        "itemsPerPage": this.pagination.itemsPerPage,
        "currentPage": this.pagination.currentPage
      }
    }
  }
}

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

export class GetAllAccountTransactionsUseCase {
  @Inject
  private accountsRepository!: AccountsRepository

  constructor(private accountId: number, private userId: number, private type: TransactionType | null, private pagination: Pagination) {}

  public async execute(): Promise<Either<AccountNotFoundError | UserIdNotAccountOwnerError, PaginatedTransactionsOutputDTO>> {
    const userAccountOwnerShipVerification = await this.checkUserIdAccountOwner()

    if (userAccountOwnerShipVerification.isLeft()) {
      return Either.Left(userAccountOwnerShipVerification.left())
    }

    if (!userAccountOwnerShipVerification.right()) {
      return Either.Left(new UserIdNotAccountOwnerError())
    }

    const transactions = await this.accountsRepository.getAllAccountTransactions(this.accountId, this.type, this.pagination)

    return Either.Right(new PaginatedTransactionsOutputDTO(transactions, this.pagination))
  }

  private async checkUserIdAccountOwner(): Promise<Either<AccountNotFoundError, boolean>> {
    const account = await this.accountsRepository.getAccountById(this.accountId)

    if (account.isLeft()) {
      return Either.Left(account.left())
    }

    return Either.Right(account.right().ownerId === this.userId)
  }
}