import People from "../model/People.model";
import { PeopleAlreadyExistsError, PeopleRepository } from "../services/PeopleRepository.service";
import { Inject } from "typescript-ioc";
import { Either } from "monet";
import { IsDefined, Matches, MinLength, validate } from "class-validator";
import { PasswordHasherService } from "../../auth/services/PasswordHasherService";
import { DocumentValidatorService } from "../services/DocumentValidator.service";

// --- DTOs

export class PeopleInputDTO {
  @IsDefined()
  @MinLength(1, {
    message: 'Nome muito curto',
  })
  public name!: string;

  @IsDefined()
  @Matches(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/, {
    message: 'Documento inválido',
  })
  public document!: string;

  @IsDefined()
  @MinLength(6, {
    message: 'Senha fraca, tente uma senha com ao menos 6 caracteres',
  })
  public password!: string;
}

export class InvalidPayloadError extends Error {
  constructor(erro: string) {
    super(erro)
  }

  public toJSON() {
    return {
      'error': 'INVALID_PAYLOAD',
      'data': {
        'error': this.message
      }
    }
  }
}

// --- UseCase

export class RegisterPeopleUseCase {
  @Inject
  private peopleRepository!: PeopleRepository;

  @Inject
  private passwordHasher!: PasswordHasherService;

  @Inject
  private documentValidatorService!: DocumentValidatorService;

  constructor(private people: PeopleInputDTO) {}

  public async execute(): Promise<Either<
    InvalidPayloadError | PeopleAlreadyExistsError,
    People
  >> {
    const payloadValidationResult = await this.validatePayload()
    if (payloadValidationResult.isLeft()) {
      return Either.left(payloadValidationResult.left())
    }

    const peopleToCreate = new People(
      this.people.name,
      this.removeDocumentFormatation(),
      this.generatePasswordHash()
    )

    return this.peopleRepository.addPeople(peopleToCreate);
  }

  private async validatePayload(): Promise<Either<InvalidPayloadError, null>> {
    const validationErrors = await validate(this.people)
    if (validationErrors.length > 0) {
      return Either.Left(new InvalidPayloadError(validationErrors[0].constraints?.matches || ""))
    }

    if(!await this.checkDocumentIsValid()) {
      return Either.Left(new InvalidPayloadError("Documento inválido"))
    }
    return Either.Right(null)
  }

  private async checkDocumentIsValid() {
    return this.documentValidatorService.validateDocument(this.removeDocumentFormatation())
  }

  private generatePasswordHash() {
    return this.passwordHasher.generatePasswordHash(this.people.password)
  }

  private removeDocumentFormatation() {
    return this.people.document.replace(/[.\-/]/g, '')
  }
}