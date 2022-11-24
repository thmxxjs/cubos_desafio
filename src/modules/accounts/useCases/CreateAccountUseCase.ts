// --- DTOs

import { IsDefined, Matches, validate } from "class-validator";
import { Either } from "monet";
import { Inject } from "typescript-ioc";
import { Account } from "../models/Account.model";
import { AccountAlreadyExists, AccountsRepository } from "../services/AccountsRepository.service";

export class InputAccountDTO {
  @IsDefined()
  @Matches(/^[0-9]{3}$/, {
    message: 'Formato de agência inválida',
  })
  public branch!: string;

  @IsDefined()
  @Matches(/^[0-9]{7}-[0-9]$/, {
    message: 'Formato de conta inválida',
  })
  public account!: string;
}

export class InvalidPayloadError extends Error {
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

export class CreateAccountUseCase {
  @Inject
  private accountsRepository!: AccountsRepository

  constructor (private account: InputAccountDTO, private accountOwnerId: number) {}

  public async execute(): Promise<Either<AccountAlreadyExists | InvalidPayloadError, Account>> {
    const validationErrors = await validate(this.account)
    if (validationErrors.length > 0) {
      return Either.Left(new InvalidPayloadError(validationErrors[0].constraints?.matches || ""))
    }

    return this.accountsRepository.registerAccount(new Account(
      this.accountOwnerId,
      this.account.branch,
      this.account.account
    ))
  }
}