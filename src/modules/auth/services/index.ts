import { Container } from "typescript-ioc";
import { PrismaPeopleRepository } from "../../repository/services/UserRepository.service";
import { AuthenticationService } from "./AuthenticationService";

Container.bind(AuthenticationService).to(PrismaPeopleRepository)