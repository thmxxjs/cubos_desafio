export class AccountCreditCard {
  public id: string | undefined
  public createdAt: Date | undefined
  public updatedAt: Date | undefined

  constructor(public type: string, public number: string, public cvv: string) {}

  public toJSON() {
    return {
      id: this.id,
      type: this.type,
      number: this.number,
      cvv: this.cvv,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}