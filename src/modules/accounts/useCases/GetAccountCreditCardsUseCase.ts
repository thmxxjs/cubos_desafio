import { Either } from "monet";
import { Inject } from "typescript-ioc";
import { AccountCreditCard } from "../models/AccountCreditCard.model";
import { AccountNotFoundError, AccountsRepository } from "../services/AccountsRepository.service";

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

// --- UseCases

export class GetAccountCreditCardsUseCase {
  @Inject
  private accountsRepository!: AccountsRepository

  constructor(private accountId: number, private userId: number) {}

  public async execute(): Promise<Either<UserIdNotAccountOwnerError | AccountNotFoundError, AccountCreditCard[]>> {
    const userAccountOwnerShipVerification = await this.checkUserIdAccountOwner()

    if (userAccountOwnerShipVerification.isLeft()) {
      return Either.Left(userAccountOwnerShipVerification.left())
    }

    if (!userAccountOwnerShipVerification.right()) {
      return Either.Left(new UserIdNotAccountOwnerError())
    }

    return this.accountsRepository.getAccountCreditCards(this.accountId)
  }

  private async checkUserIdAccountOwner(): Promise<Either<AccountNotFoundError, boolean>> {
    const account = await this.accountsRepository.getAccountById(this.accountId)

    if (account.isLeft()) {
      return Either.Left(account.left())
    }

    return Either.Right(account.right().ownerId === this.userId)
  }
}