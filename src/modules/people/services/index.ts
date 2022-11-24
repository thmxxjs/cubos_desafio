import { Container } from "typescript-ioc";
import { CubosDocumentValidator } from "../../cubos-services/CubosDocumentValidator";
import { PrismaPeopleRepository } from "../../repository/services/UserRepository.service";
import { DocumentValidatorService } from "./DocumentValidator.service";
import { PeopleRepository } from "./PeopleRepository.service";

Container.bind(PeopleRepository).to(PrismaPeopleRepository)
Container.bind(DocumentValidatorService).to(CubosDocumentValidator)