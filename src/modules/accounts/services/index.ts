import { Container } from "typescript-ioc";
import { PrismaAccountsRepository } from "../../repository/services/AccountsRepository.service";
import { AccountsRepository } from "./AccountsRepository.service";

Container.bind(AccountsRepository).to(PrismaAccountsRepository)