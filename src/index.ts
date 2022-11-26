import express from 'express'
import { PeopleController } from './modules/people/People.controller'
import bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import { AuthController } from './modules/auth/Auth.controller'
import { LoginController } from './modules/auth/Login.controller'
import { AccountsController } from './modules/accounts/Accounts.controller'
import { CardsController } from './modules/accounts/Cards.controller'
dotenv.config()

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

PeopleController.register(app)
AuthController.register(app)
LoginController.register(app)
AccountsController.register(app)
CardsController.register(app)

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})