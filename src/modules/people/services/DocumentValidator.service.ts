export abstract class DocumentValidatorService {
  public abstract validateDocument(cpf: string): Promise<boolean>
}