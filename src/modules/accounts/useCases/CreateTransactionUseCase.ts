import { IsDefined, IsNumber, Min, validate } from "class-validator";
import { Either } from "monet";
import { Inject } from "typescript-ioc";
import { Transaction, TransactionType } from "../models/Transaction.model";
import { AccountNotFoundError, AccountsRepository } from "../services/AccountsRepository.service";

// --- DTOs

export class InputTransactionDTO {
  @IsDefined({
    message: 'Obrigatório fornecer o valor da transação',
    groups: [TransactionType.EXTERNAL, TransactionType.INTERNAL]
  })
  @IsNumber()
  @Min(0, {
    groups: [TransactionType.INTERNAL],
    message: 'Valor da transferência não pode ser negativa'
  })
  public value!: number;

  @IsDefined({
    message: 'Descrição não fornecida',
    groups: [TransactionType.EXTERNAL, TransactionType.INTERNAL]
  })
  public description!: string;

  @IsDefined({
    message: 'Conta de destino obrigatória',
    groups: [TransactionType.INTERNAL]
  })
  public receiverAccountId!: string
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

export class CreateTransactionUseCase {
  @Inject
  private accountsRepository!: AccountsRepository

  constructor(private transaction: InputTransactionDTO, private accountId: number, private userId: number, private transactionType: TransactionType = TransactionType.EXTERNAL) {}

  public async execute(): Promise<Either<AccountNotFoundError | UserIdNotAccountOwnerError | InvalidPayloadError, Transaction>> {
    const validationErrors = await validate(this.transaction, {groups: [this.transactionType]})
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

    const transactionToCreate = new Transaction(this.transaction.value, this.transaction.description, this.transactionType)

    if (this.transactionType === TransactionType.INTERNAL) {
      transactionToCreate.value *= -1
      transactionToCreate.receiverAccountId = parseInt(this.transaction.receiverAccountId)
    }

    return this.accountsRepository.createTransaction(transactionToCreate, this.accountId)
  }

  private async checkUserIdAccountOwner(): Promise<Either<AccountNotFoundError, boolean>> {
    const account = await this.accountsRepository.getAccountById(this.accountId)

    if (account.isLeft()) {
      return Either.Left(account.left())
    }

    return Either.Right(account.right().ownerId === this.userId)
  }
}