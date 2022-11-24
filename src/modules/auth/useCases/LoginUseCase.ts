import { IsDefined, Matches, validate } from "class-validator";
import { Either } from "monet";
import { Inject } from "typescript-ioc";
import { AuthenticationService } from "../services/AuthenticationService";
import { PasswordHasherService } from "../services/PasswordHasherService";
import fs from 'fs'
import jose from 'node-jose'

const privateKey = fs.readFileSync(__dirname + '/../../../../cert/cubos.pem').toString()

// --- DTOs

export class LoginInputDTO {
  @IsDefined({
    message: 'Payload inválido'
  })
  @Matches(/^[0-9]{3}[0-9]{3}[0-9]{3}[0-9]{2}$/, {
    message: 'Documento inválido',
  })
  public document!: string;

  @IsDefined({
    message: 'Payload inválido'
  })
  public password!: string;
}

export class LoginOutputDTO {
  constructor(public token: string) {}

  public toJSON() {
    return {
      token: this.token
    }
  }
}

class UnauthorizedError extends Error {
  public toJSON() {
    return {
      'error': 'UNAUTHORIZED',
      'data': null
    }
  }
}

class InvalidPayloadError extends Error {
  constructor(error: string) {
    super(error)
  }

  public toJSON() {
    return {
      'error': 'INVALID_PAYLOAD',
      'data': this.message
    }
  }
}

// --- UseCase

export class LoginUseCase {
  @Inject
  authenticationService!: AuthenticationService

  @Inject
  passwordHasherService!: PasswordHasherService

  constructor (private loginInput: LoginInputDTO) {}

  public async execute(): Promise<Either<UnauthorizedError | InvalidPayloadError, LoginOutputDTO>> {
    const payloadValidationResult = await this.validatePayload()
    if (payloadValidationResult.isLeft()) {
      return Either.left(payloadValidationResult.left())
    }

    const authSuccessful = await this.authenticationService.verifyCredentials(this.loginInput.document, this.passwordHasherService.generatePasswordHash(this.loginInput.password))
    if (!authSuccessful) {
      return Either.left(new UnauthorizedError())
    }

    return Either.right(new LoginOutputDTO(await this.generateTokenForUser()))
  }

  private async validatePayload(): Promise<Either<InvalidPayloadError, null>> {
    const validationErrors = await validate(this.loginInput)
    if (validationErrors.length > 0) {
      return Either.Left(new InvalidPayloadError(validationErrors[0].constraints?.matches || ""))
    }
    return Either.Right(null)
  }

  private async generateTokenForUser() {
    const key = await jose.JWK.asKey(privateKey, "pem")
  
    const findPeopleLogged = await this.authenticationService.getUserByDocument(this.loginInput.document)

    const oneDayInMillis = 1 * 24 * 60 * 60 * 1000
    const payload = JSON.stringify({
      exp: Math.floor((Date.now() + oneDayInMillis) / 1000),
      iat: Math.floor(Date.now() / 1000),
      sub: findPeopleLogged.right().id,
    })
  
    const token = await jose.JWS.createSign({
        compact: true,
        fields: { typ: 'jwt' }
      }, key)
      .update(payload)
      .final()
    
    return `Bearer ${token}`
  }
}