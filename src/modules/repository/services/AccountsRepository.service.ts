import { CardType, Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Either } from "monet";
import { Account } from "../../accounts/models/Account.model";
import { AccountCreditCard } from "../../accounts/models/AccountCreditCard.model";
import { Transaction, TransactionOrigin } from "../../accounts/models/Transaction.model";
import { AccountAlreadyExists, AccountNotFoundError, AccountsRepository, InsuficientBalanceError, Pagination, TransactionAlreadyReverted, TransactionNotFoundError, TransactionType } from "../../accounts/services/AccountsRepository.service";

const prisma = new PrismaClient()

export class PrismaAccountsRepository implements AccountsRepository {
  public async registerAccount(account: Account): Promise<Either<AccountAlreadyExists, Account>> {
    try {
      const createdAccountPrisma = await prisma.account.create({
        data: {
          ownerId: account.ownerId,
          branch: account.branch,
          account: account.account
        }
      })

      const accountCreated = new Account(
        createdAccountPrisma.ownerId,
        createdAccountPrisma.branch,
        createdAccountPrisma.account
      )

      accountCreated.id = createdAccountPrisma.id.toString()
      accountCreated.createdAt = createdAccountPrisma.createdAt
      accountCreated.updatedAt = createdAccountPrisma.updatedAt

      return Either.right(accountCreated)
    } catch (e) {
      if ((e as PrismaClientKnownRequestError).code === 'P2002') {
        return Either.Left(new AccountAlreadyExists())
      }
      
      throw "Unknown Error"
    }
  }

  public async getAccountsByUserId(userId: number): Promise<Account[]> {
    const accountsPrisma = await prisma.account.findMany({
      where: {
        ownerId: userId
      }
    })

    const accounts = accountsPrisma.map(prismaAccount => {
      const account = new Account(prismaAccount.ownerId, prismaAccount.branch, prismaAccount.account)

      account.id = prismaAccount.id.toString()
      account.createdAt = prismaAccount.createdAt
      account.updatedAt = prismaAccount.updatedAt

      return account
    })

    return accounts
  }

  public async getAccountById(accountId: number): Promise<Either<AccountNotFoundError, Account>> {
    const prismaAccount = await prisma.account.findFirst({
      where: {
        id: accountId
      }
    })

    if (prismaAccount === null) {
      return Either.left(new AccountNotFoundError())
    }

    const account = new Account(prismaAccount.ownerId, prismaAccount.branch, prismaAccount.account)

    account.id = prismaAccount.id.toString()
    account.createdAt = prismaAccount.createdAt
    account.updatedAt = prismaAccount.updatedAt

    return Either.right(account)
  }

  public async addCreditCardToAccount(creditCard: AccountCreditCard, accountId: number): Promise<AccountCreditCard> {
    const prismaCreatedCard = await prisma.card.create({
      data: {
        type: creditCard.type === 'physical' ? CardType.physical : CardType.virtual,
        number: creditCard.number,
        cvv: creditCard.cvv,
        accountId
      }
    })

    const accountCreditCard = new AccountCreditCard(prismaCreatedCard.type, prismaCreatedCard.number, prismaCreatedCard.cvv)

    accountCreditCard.id = prismaCreatedCard.id.toString()
    accountCreditCard.createdAt = prismaCreatedCard.createdAt
    accountCreditCard.updatedAt = prismaCreatedCard.updatedAt

    return accountCreditCard
  }

  public async getAccountCreditCards(accountId: number): Promise<Either<AccountNotFoundError, AccountCreditCard[]>> {
    const prismaCreditCards = await prisma.card.findMany({
      where: {
        accountId
      }
    })

    const creditCards = prismaCreditCards.map(prismaCreatedCard => {
      const accountCreditCard = new AccountCreditCard(prismaCreatedCard.type, prismaCreatedCard.number, prismaCreatedCard.cvv)

      accountCreditCard.id = prismaCreatedCard.id.toString()
      accountCreditCard.createdAt = prismaCreatedCard.createdAt
      accountCreditCard.updatedAt = prismaCreatedCard.updatedAt
  
      return accountCreditCard
    })

    return Either.Right(creditCards)
  }

  public async createTransaction(transaction: Transaction, accountId: number): Promise<Either<InsuficientBalanceError, Transaction>> {
    const transactionPrisma: Either<InsuficientBalanceError, Transaction> = await prisma.$transaction(async (tx) => {
      return this.createTransactionInternal(transaction, accountId, tx)
    })

    return transactionPrisma
  }

  public async createTransactionInternal(transaction: Transaction, accountId: number, tx: Prisma.TransactionClient): Promise<Either<InsuficientBalanceError, Transaction>> {
    const balance: {balance: string}[] = await tx.$queryRaw`
      SELECT
      CASE
          WHEN nullablebalance is NULL
          THEN 0.0
          ELSE nullablebalance
      END balance
      FROM (SELECT SUM("value") as nullablebalance FROM (
        SELECT value FROM "Transaction" WHERE "accountId" = ${accountId}
        UNION ALL
        SELECT (value * -1) as value FROM "Transaction" WHERE "receiverAccountId" = ${accountId}
      ) as aquery) as bquery
    `

    const numericBalance = parseFloat(balance[0].balance)
    const valueInCents = Math.round(transaction.value * 100) // converte para centavos antes de salvar no banco

    if (numericBalance + valueInCents < 0) {
      return Either.Left(new InsuficientBalanceError())
    }

    const createdTransactionPrisma = await tx.transaction.create({
      data: {
        value: valueInCents, 
        description: transaction.description,
        accountId,
        receiverAccountId: transaction.type === TransactionOrigin.INTERNAL ? transaction.receiverAccountId : null
      }
    })

    const createdTransaction = new Transaction(transaction.value, transaction.description, transaction.type)

    createdTransaction.id = createdTransactionPrisma.id.toString()
    createdTransaction.value = parseFloat((createdTransactionPrisma.value / 100).toFixed(2)), // converte de centavos para reais antes de devolver o resultado
    createdTransaction.description = createdTransactionPrisma.description
    createdTransaction.createdAt = createdTransactionPrisma.createdAt
    createdTransaction.updatedAt = createdTransactionPrisma.updatedAt

    return Either.Right(createdTransaction)
  }

  public async getAccountBalance(accountId: number): Promise<number> {
    const balance: {balance: string}[] = await prisma.$queryRaw`
        SELECT
        CASE
           WHEN nullablebalance is NULL
            THEN 0.0
           ELSE nullablebalance
       END balance
        FROM (SELECT SUM("value") as nullablebalance FROM (
          SELECT value FROM "Transaction" WHERE "accountId" = ${accountId}
          UNION ALL
          SELECT (value * -1) as value FROM "Transaction" WHERE "receiverAccountId" = ${accountId}
        ) as aquery) as bquery
      `

      const numericBalance = parseFloat(balance[0].balance)

      return parseFloat((numericBalance / 100).toFixed(2))
  }

  public async revertTransaction(transactionId: number): Promise<Either<InsuficientBalanceError | TransactionAlreadyReverted | TransactionNotFoundError, Transaction>> {
    const transactionPrisma: Either<InsuficientBalanceError | TransactionNotFoundError | TransactionAlreadyReverted, Transaction> = await prisma.$transaction(async (tx) => {

      const transaction = await tx.transaction.findUnique({
        where: {
          id: transactionId
        }
      })

      if (transaction === null) {
        return Either.Left(new TransactionNotFoundError())
      }
    
      if (transaction.reverted) {
        return Either.Left(new TransactionAlreadyReverted())
      }

      await tx.transaction.update({
        data: {
          reverted: true
        },
        where: {
          id: transactionId
        }
      })

      let transactionType = TransactionOrigin.EXTERNAL
      let transactionDescription = "Estorno de cobrança indevida."

      if (transaction.receiverAccountId !== null) {
        transactionType = TransactionOrigin.INTERNAL
        transactionDescription = "Estorno de transferência."
      }

      const compensationTransaction = new Transaction(parseFloat((transaction.value / 100).toFixed(2)) * -1, transactionDescription, transactionType)

      compensationTransaction.receiverAccountId = transaction.receiverAccountId || 0
      return this.createTransactionInternal(compensationTransaction, transaction.accountId, tx)
    })

    return transactionPrisma
  }

  public async getAllUserCards(userId: number, pagination: { itemsPerPage: number; currentPage: number; }): Promise<AccountCreditCard[]> {
    const prismaCreditCards = await prisma.card.findMany({
      where: {
        account: {
          ownerId: userId
        }
      },
      skip: pagination.itemsPerPage * (pagination.currentPage - 1),
      take: pagination.itemsPerPage
    })

    const creditCards = prismaCreditCards.map(prismaCreatedCard => {
      const accountCreditCard = new AccountCreditCard(prismaCreatedCard.type, prismaCreatedCard.number, prismaCreatedCard.cvv)

      accountCreditCard.id = prismaCreatedCard.id.toString()
      accountCreditCard.createdAt = prismaCreatedCard.createdAt
      accountCreditCard.updatedAt = prismaCreatedCard.updatedAt
  
      return accountCreditCard
    })

    return creditCards
  }

  public async getAllAccountTransactions(accountId: number, type: TransactionType, pagination: Pagination): Promise<Transaction[]> {
    const prismaTransactions = await prisma.transaction.findMany({
      where: {
        AND: {
          account: {
            id: accountId
          },
          value: {
            gte: type === TransactionType.CREDIT ? 0 : undefined,
            lt: type === TransactionType.DEBIT ? 0 : undefined,
          }
        }
      },
      skip: pagination.itemsPerPage * (pagination.currentPage - 1),
      take: pagination.itemsPerPage
    })

    const transactions = prismaTransactions.map(prismaTransaction => {
      const transaction = new Transaction(parseFloat((prismaTransaction.value / 100).toFixed(2)) , prismaTransaction.description, prismaTransaction.receiverAccountId === null ? TransactionOrigin.EXTERNAL : TransactionOrigin.INTERNAL)

      transaction.id = prismaTransaction.id.toString()
      transaction.createdAt = prismaTransaction.createdAt
      transaction.updatedAt = prismaTransaction.updatedAt

      return transaction
    })
    
    return transactions
  }
}