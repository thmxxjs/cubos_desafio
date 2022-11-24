export default class People {
  public id: string | undefined
  public createdAt: Date | undefined
  public updatedAt: Date | undefined

  constructor(
    public name: string,
    public document: string,
    public password: string
  ) {}

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      document: this.document,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}