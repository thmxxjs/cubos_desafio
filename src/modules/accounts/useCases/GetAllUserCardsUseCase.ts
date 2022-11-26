import { Either } from "monet";
import { Inject } from "typescript-ioc";
import { AccountCreditCard } from "../models/AccountCreditCard.model";
import { AccountsRepository, Pagination } from "../services/AccountsRepository.service";

// --- DTOs

export class PaginatedCardsOutputDTO {
  constructor(private cards: AccountCreditCard[], private pagination: Pagination) {}
  
  public toJSON() {
    return {
      "cards": this.cards.map(card => card.toJSON()),
      "pagination": {
        "itemsPerPage": this.pagination.itemsPerPage,
        "currentPage": this.pagination.currentPage
      }
    }
  }
}

// --- UseCase

export class GetAllUserCardsUseCase {
  @Inject
  private accountsRepository!: AccountsRepository
  
  constructor(private userId: number, private pagination: Pagination) {}

  public async execute(): Promise<Either<null, PaginatedCardsOutputDTO>> {
    const cards = await this.accountsRepository.getAllUserCards(this.userId, this.pagination)

    return Either.Right(new PaginatedCardsOutputDTO(cards, this.pagination))
  }
}