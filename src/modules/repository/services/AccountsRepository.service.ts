import { CardType, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Either } from "monet";
import { Account } from "../../accounts/models/Account.model";
import { AccountCreditCard } from "../../accounts/models/AccountCreditCard.model";
import { AccountAlreadyExists, AccountNotFoundError, AccountsRepository } from "../../accounts/services/AccountsRepository.service";

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
}