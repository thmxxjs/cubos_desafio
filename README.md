# Teste backend cubos

Repositório contendo a solução do meu teste para backend na Cubos, onde o objetivo é simular uma API de um app financeiro 

## Status de implementação de endpoints

- [X] POST /accounts
- [X] GET /accounts
- [X] POST /accounts/:accountId/cards
- [X] GET /accounts/:accountId/cards
- [ ] GET /cards
- [ ] POST /accounts/:accountId/transactions
- [ ] POST /accounts/:accountId/transactions/internal
- [ ] GET /accounts/:accountId/transactions
- [ ] GET /accounts/:accountId/balance
- [ ] POST /accounts/:accountId/transactions/:transactionId/revert

## Detalhamento técnico

* <b> Injeção de dependência:</b>

	Foi utilizada a biblioteca <i>typescript-ioc</i> para injeção de dependências como forma de desacoplar os serviços e repositórios (a lógica da aplicação por exemplo não depende do ORM escolhido)

* <b> Biblioteca de ORM:</b>

	Como era de livre escolha, escolhi utilizar o prisma.io por nunca ter utilizado antes e aproveitar o teste para testar a solução e comparar com as bibliotecas sequelize e typeorm, se mostrou eficiente por hora

* <b> API gateway:</b>

	Embora não fosse uma exigência utilização de um API gateway, como o teste pedia implementação de autenticação e autorização, no lugar de criar um midlware express para validar o token nos endpoints protegidos foi utilizado o <i>krakend</i> como API gateway e a sua funcionalidade de validação de token a partir de chave pública (no formato Json Web Key) e passagem de campo de token em header para o backend, dessa forma a aplicação está desacoplada da validação de token e é possível desenvolver mais rapidamente simulando qualquer usuário apenas modificando o cabeçalho <b>x-user</b>


## Como executar a aplicação

### Modo avaliação

Primeiro é necessário alterar duas variáveis de ambiente no arquivo docker-compose.yaml com as credenciais corretas para acesso à api de compliance da cubos, posso enviar as que foram geradas pra mim caso necessário no momento de avaliação

```yaml
COMPLIANCE_API_USER: "user@email.com"
COMPLIANCE_API_PASSWORD: "123456"
```

Também é requisito o docker-compose instalado e executar o seguinte comando

```sh
docker compose up
```
a aplicação estará executando na porta 8080

### Modo desenvolvimento
A maior diferença entre o modo avaliação e desenvolvimento é que os endpoints estão abertos em modo desenvolvimento

O passo a passo para rodar em modo desenvolvimento:

* criar um arquivo .env seguindo o modelo .env.example
* rodar uma instância do postgres (pode ser a mesma do arquivo docker-compose, pois está com a porta exposta, utilize para isso o comando `docker-compose up`)
* instalar as dependências com o comando `npm install`
* rodar as migrations com `npm run runmigrations`
* gerar um par de chaves pública e privada para a parte de autenticação com o comando `npm run generateauthkeypair`
* executar a aplicação `npm run dev`