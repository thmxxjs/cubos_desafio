export class Account {
  public id: string | undefined
  public createdAt: Date | undefined
  public updatedAt: Date | undefined

  constructor(
    public ownerId: number,
    public branch: string,
    public account: string
  ) {}

  public toJSON() {
    return {
      id: this.id,
      branch: this.branch,
      account: this.account,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}