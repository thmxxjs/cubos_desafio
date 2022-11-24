import sha256 from 'js-sha256'

export class PasswordHasherService {
  public generatePasswordHash(password: string) {
    return sha256.sha256(password)
  }
}