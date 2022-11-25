// --- DTOs

import { IsDefined, Matches, validate } from "class-validator";
import { Either } from "monet";
import { Inject } from "typescript-ioc";
import { AccountCreditCard } from "../models/AccountCreditCard.model";
import { AccountNotFoundError, AccountsRepository } from "../services/AccountsRepository.service";

export class InputCreditCardDTO {
  @IsDefined({
    message: 'Obrigatório fornecer o tipo de cartão'
  })
  @Matches(/^(physical)|(virtual)$/, {
    message: 'Tipo de cartão inválido, tipos válidos: physical ou virtual',
  })
  public type!: string;

  @IsDefined({
    message: 'Número do cartão não fornecido'
  })
  @Matches(/^[0-9]{4}\s[0-9]{4}\s[0-9]{4}\s[0-9]{4}$/, {
    message: 'Número do cartão inválido',
  })
  public number!: string;

  @IsDefined({
    message: 'Código de segurança do cartão é obrigatório'
  })
  @Matches(/^[0-9]{3}$/, {
    message: 'Código de segurança inválido',
  })
  public cvv!: string;
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

export class InvalidPayloadError extends Error {
  public status = 400

  constructor(erro: string) {
    super(erro)
  }

  public toJSON() {
    return {
      'error': 'INVALID_PAYLOAD',
      'data': {
        'error': this.message
      }
    }
  }
}

// --- UseCase

export class CreateCreditCardUseCase {
  @Inject
  private accountsRepository!: AccountsRepository

  constructor(private inputCreateCreditCard: InputCreditCardDTO, private accountId: number, private userId: number) {}

  public async execute(): Promise<Either<AccountNotFoundError | UserIdNotAccountOwnerError | InvalidPayloadError, AccountCreditCard>> {
    const validationErrors = await validate(this.inputCreateCreditCard)
    if (validationErrors.length > 0) {
      return Either.Left(new InvalidPayloadError(validationErrors[0].constraints?.matches || ""))
    }

    const userAccountOwnerShipVerification = await this.checkUserIdAccountOwner()

    if (userAccountOwnerShipVerification.isLeft()) {
      return Either.Left(userAccountOwnerShipVerification.left())
    }

    if (!userAccountOwnerShipVerification.right()) {
      return Either.Left(new UserIdNotAccountOwnerError())
    }

    const creditCardToCreate = new AccountCreditCard(this.inputCreateCreditCard.type, this.inputCreateCreditCard.number, this.inputCreateCreditCard.cvv)

    const creditCardCreated = await this.accountsRepository.addCreditCardToAccount(creditCardToCreate, this.accountId)

    return Either.Right(creditCardCreated)
  }

  private async checkUserIdAccountOwner(): Promise<Either<AccountNotFoundError, boolean>> {
    const account = await this.accountsRepository.getAccountById(this.accountId)

    if (account.isLeft()) {
      return Either.Left(account.left())
    }

    return Either.Right(account.right().ownerId === this.userId)
  }
}