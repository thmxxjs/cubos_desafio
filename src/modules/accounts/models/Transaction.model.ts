export enum TransactionType {
  EXTERNAL = "external",
  INTERNAL = "internal"
}

export class Transaction {
  public id: string | undefined
  public receiverAccountId = 0
  public createdAt: Date | undefined
  public updatedAt: Date | undefined

  constructor(public value: number, public description: string, public type: TransactionType) {}

  public toJSON() {
    return {
      'id': this.id,
      'value': this.value,
      'description': this.description,
      'createdAt': this.createdAt,
      'updatedAt': this.updatedAt
    }
  }
}