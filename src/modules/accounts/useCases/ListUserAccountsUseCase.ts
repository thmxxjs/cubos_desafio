import { Inject } from "typescript-ioc";
import { Account } from "../models/Account.model";
import { AccountsRepository } from "../services/AccountsRepository.service";

export class ListUserAccountsUseCase {
  @Inject
  private accountsRepository!: AccountsRepository

  constructor(private userId: number) {}

  public async execute(): Promise<Account[]> {
    const accounts = await this.accountsRepository.getAccountsByUserId(this.userId)

    return accounts
  }
}