import { DocumentValidatorService } from "../people/services/DocumentValidator.service"
import axios from 'axios'

const MAX_EXTERNAL_SERVICE_ACCESS_RETRIES = 3;

export class CubosDocumentValidator implements DocumentValidatorService {
  private accessToken = ""
  private refreshToken = ""

  public async validateDocument(document: string): Promise<boolean> {
    if (this.accessToken === "") {
      await this.initialTokenRequest()
    }

    return this.validateDocumentInternal(document)
  }

  private async validateDocumentInternal(document: string, accessRetries = 0): Promise<boolean> {
    if (accessRetries >= MAX_EXTERNAL_SERVICE_ACCESS_RETRIES) {
      throw "Cannot access external service"
    }

    const documentType = document.length === 11 ? 'cpf' : 'cnpj'

    try {
      const validationResult = await axios.post(`${process.env.COMPLIANCE_API_URL}/${documentType}/validate`, {
        document
      }, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      })

      return validationResult.data.data.status === 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e)
      if (e.response.status === 400) {
        return false
      }

      const unexpectedErrorOccurred = e.response.status !== 401
    
      if (unexpectedErrorOccurred) {
        throw "Cannot access external service"
      }

      if (e.response.data.message === 'jwt expired') {
        await this.refreshAccessToken()
      }
  
      return this.validateDocumentInternal(document, ++accessRetries)
    }
  }

  private async initialTokenRequest() {
    const codeRequest = await axios.post(`${process.env.COMPLIANCE_API_URL}/auth/code`, {
      email: process.env.COMPLIANCE_API_USER,
      password: process.env.COMPLIANCE_API_PASSWORD
    })

    const tokenRequest = await axios.post(`${process.env.COMPLIANCE_API_URL}/auth/token`, {
      authCode: codeRequest.data.data.authCode
    })

    this.accessToken = tokenRequest.data.data.accessToken
    this.refreshToken = tokenRequest.data.data.refreshToken
  }

  private async refreshAccessToken() {
    try {
      const validationResult = await axios.post(`${process.env.COMPLIANCE_API_URL}/auth/refresh`, {
        refreshToken: this.refreshToken
      })

      this.accessToken = validationResult.data.accessToken
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.response.status === 401) {
        await this.initialTokenRequest()
        return
      }
  
      throw e
    }
  }
}