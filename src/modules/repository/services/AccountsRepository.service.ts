import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Either } from "monet";
import { Account } from "../../accounts/models/Account.model";
import { AccountAlreadyExists, AccountsRepository } from "../../accounts/services/AccountsRepository.service";

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
}