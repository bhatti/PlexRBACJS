# Introduction to PlexRBACJS


## Overview

PlexRBACJS provides APIs to add support for role and claim based security. It supports both static and instance based security.


## Features:
- Role based security
- Roles can be inherited
- Claim based security, where claims define permittable actions and can be associated with principals or
  roles, which are in turn associated to principals.
- Instance based security using dynamic context and regular expressions

## Requirements:
- Javascript ES6
- Flow
- Node

## Version
- 0.1

## License
- MIT

## Building
- Checkout code from
```bash
git clone git@github.com:bhatti/PlexRBACJS.github
yarn install
```
- Building
```bash
./yarn build
```

## Design:


### Realm

The realm defines domain of security, e.g. you may have have different security policies for different applications that can be applied by creating realm for each application.

### Principal

A principal represents an identity and can be represented by user or an application.

### Role

A role represents job title or function. A principal belongs to one or more roles. One of key feature of PlexRBACJS is that roles support inheritance where a role can have one or more roles. Roles can be assigned for a predefined duration of time to principals.

### Claim

A claim defines permission and consists of three parts: operation, resource and condition, where operation is a "verb" that describes action and resource represents "object" that is acted upon, and condition is an optional component that describes dynamic condition that must be checked. The claims can be assigned to roles or principal.
The condition contains a Javascript based logical expressions and provides access to runtime request parameters. PlexRBACJS allows regular expressions for both operations and target, so you can define operations like "(read|write|create|delete)" or "read*", etc. Finally, claim can be assigned for a duration of time so that they are not permanent.


## System Layers

PlexRBACJS consists of following layers
### Business Domain Layer
<img src="https://raw.githubusercontent.com/bhatti/PlexRBACJS/master/rbacjs_domain.png">

This layer defines core classes that are part of the RBAC based security realm such as:

 * Realm – - The realm allows you to support multiple applications or security realms.
 * Principal – The principal represents an identity and can be mapped to users defined in an application.
 * Role – A role represents job title or function.
 * Claim – A claim is composed of operation, target and a condition that is used for dynamic or instance based security.
 * SecurityError – Upon a claim failure, you can choose to store them in the database using SecurityError.

### Repository Layer

This layer is responsible for accessing or storing above objects in the database. PlexRBACJS uses Sqlite by default but it can be easily mapped to other databases. Following are list of repositories supported by PlexRBAC:

	* RealmRepository – provides database access for Realms.
	* ClaimRepository – provides database access for Claims.
	* PrincipalRepository – provides database access for Principals.
	* RoleRepository – provides database access for Roles.

### Security Layer

This layer defines SecurityManager for validating authorization policies.

### Evaluation Layer

This layer proivdes evaluation engine for supporting instance based security.

### REST API Service Layer

This layer defines REST services such as:

	* RealmService – this service provides REST APIs for accessing Realms.
	* PrincipalService – this service provides REST APIs for accessing Principals.
	* RoleService – this service provides REST APIs for accessing Roles.
	* ClaimService – this service provides REST APIs for accessing Claims.
	* SecurityService – this service provides REST APIs for authorizing claims.


### Caching Layer

This layer provides caching security claims to improve performance.

## Simple Example
<img src="https://raw.githubusercontent.com/bhatti/PlexRBACJS/master/rbacjs_bank.png">

Let's start with a banking example where a bank-object can be account, general-ledger-report or ledger-posting-rules and account is further grouped into customer account or loan account. Further, Let’s assume there are five roles: Teller, Customer-Service-Representative (CSR), Account, AccountingManager and LoanOfficer, where
	* A teller can modify customer deposit accounts — but only if customer and teller live in same region
	* A customer service representative can create or delete customer deposit accounts — but only if customer and teller live in same region
	* An accountant can create general ledger reports — but only if year is ## current year
	* An accounting manager can modify ledger-posting rules — but only if year is ## current year
	* A loan officer can create and modify loan accounts – but only if account balance is < 10000

Following classes can be used to define above security policies:
```javascript
class User extends PrincipalImpl {
	credentials:  	string;
	region:  		string;
	constructor(theRealm: Realm, theUsername: string, theCredentials: string, theRegion: string) {
		super(theRealm, theUsername);
		this.credentials = theCredentials;
		this.region      = theRegion;
	}
}

```

```javascript
class Customer extends User {
}

```

```

```javascript
class Employee extends User {
	constructor(theRealm: Realm, theUsername: string, theCredentials: string, theRegion: string) {
		super(theRealm, theUsername, theCredentials, theRegion);
	}
}

```

```javascript
class Account {
	id:         number;
	balance:    number;
}

```


### Bootstrapping

Let’s initialize repository locator as follows:
```javascript  
let repositoryLocator = new RepositoryLocator('/test.db', () => {});
```


### Creating a realm

Now, let’s create a realm for banking:
```javascript
let realm = realmRepository.save(new Realm('banking'));
```



### Creating Claims

We can then create new claims and save them in the database as follows:
```javascript
let ruDeposit   = repositoryLocator.claimRepository.save(new Claim(realm, '(read|modify)', 'DepositAccount', 'employeeRegion == "MIDWEST"')); 

let cdDeposit   = repositoryLocator.claimRepository.save(new Claim(realm, '(create|delete)', 'DepositAccount', 'employeeRegion == "MIDWEST"'));

let rdLedger    = repositoryLocator.claimRepository.save(new Claim(realm, '(read|create)', 'GeneralLedger', 'transactionDateYear == currentYear'));

let cdLoan      = repositoryLocator.claimRepository.save(new Claim(realm, '(create|delete)', 'LoanAccount', 'accountBalance < 10000'));

let ruLoan      = repositoryLocator.claimRepository.save(new Claim(realm, '(read|modify)', 'LoanAccount', 'accountBalance < 10000'));

let rGlpr       = repositoryLocator.claimRepository.save(new Claim(realm, 'read', 'GeneralLedgerPostingRules', 'transactionDateYear == currentYear'));

let cudGlpr     = repositoryLocator.claimRepository.save(new Claim(realm, '(create|modify|delete)', 'GeneralLedgerPostingRules', 'year == currentYear'));
```

### Creating Roles

Now, we will create roles for Teller, CSR, Accountant, AccountManager and LoanManager:
```javascript
let employee        = new Role(realm, 'Employee');
let teller          = new Role(realm, 'Teller');
teller.parents.add(employee);
teller.claims.add(ruDeposit);
repositoryLocator.roleRepository.save(teller);
``` 

```javascript
let csr             = new Role(realm, 'CSR');
csr.claims.add(cdDeposit);
csr.parents.add(teller);
repositoryLocator.roleRepository.save(csr);
```

```javascript
let accountant      = new Role(realm, 'Accountant');
accountant.claims.add(rdLedger);
accountant.parents.add(employee);
repositoryLocator.roleRepository.save(accountant);
``` 

```javascript
let accountantMgr   = new Role(realm, 'AccountingManager');
accountantMgr.claims.add(ruLoan);
accountantMgr.claims.add(cdLoan);
accountantMgr.claims.add(rGlpr);
accountantMgr .parents.add(accountant);
repositoryLocator.roleRepository.save(accountantMgr);
```

```javascript
let loanOfficer     = new Role(realm, 'LoanOfficer');
loanOfficer.claims.add(cudGlpr);
loanOfficer.claims.add(new Claim(realm, '(create|delete)', 'LoanAccount', '');
loanOfficer.claims.add(new Claim(realm, '(read|modify)', 'LoanAccount', '');
loanOfficer.parents.add(accountantMgr);
repositoryLocator.roleRepository.save(loanOfficer);
```

```javascript
this.branchManager       = new Role(this.realm, 'BranchManager');
this.branchManager.parents.add(this.accountantMgr);
this.branchManager.parents.add(this.loanOfficer);
this.repositoryLocator.roleRepository.save(this.branchManager);
```


### Creating Users

Next step is to create users for the realm or application so let’s define accounts for tom, cassy, ali, mike and larry, barry, i.e.,
```javascript
let tom     = new Employee(realm, 'tom', 'pass');
tom.roles.add(teller);
repositoryLocator.principalRepository.save(tom);

```
```javascript
let cassy   = new Employee(realm, 'cassy', 'pass');
cassy.roles.add(csr);
let cassy   = repositoryLocator.principalRepository.save(cassy);

```
```javascript
let ali     = new Principal(realm, 'ali', 'pass');
ali.roles.add(accountant);
repositoryLocator.principalRepository.save(ali);

```
```javascript
let mike    = new Principal(realm, 'mike', 'pass');
mike.roles.add(accountantMgr);
repositoryLocator.principalRepository.save(mike);

```
```javascript
let larry   = new Principal(realm, 'larry', 'pass');
larry.roles.add(loanOfficer);
let larry   = repositoryLocator.principalRepository.save(larry);

```

```javascript
let barry     = new Principal(this.realm, 'barry');
// adding claims directly to override account balance limitations
barry.claims.add(new Claim(this.realm, '(read|modify|create|delete)', 'LoanAccount', ''));
barry.claims.add(new Claim(this.realm, '(read|create|modify|delete)', 'GeneralLedgerPostingRules', ''));
barry.roles.add(this.branchManager);
this.repositoryLocator.principalRepository.save(barry);
```
Note, we can add claims directly to user to override or add new claims, e.g. in above examples we removed conditional constraints for branch manager.

### Authorization

Now the fun part of authorization, let’s check if user "tom" can view deposit-accounts, e.g.
```javascript
let securityManager = new SecurityManager(new ConditionEvaluator(), repositoryLocator);
let request = new SecurityAccessRequest('banking', 'tom', 'read', 'DepositAccount', {});

let access = securityManager.check(request); 

```
In above example, access should return 'deny', now let’s check if cassy, the CSR can delete deposit-account, e.g.
```javascript
let request = new SecurityAccessRequest('banking', 'cassy', 'delete', 'DepositAccount', {});

let access = securityManager.check(request); 
```

In above example, access should return 'allow', because CSR have claims for deleting deposit-account.

Now, let’s check if ali, the accountant can view general-ledger, e.g.
```javascript
let request = new SecurityAccessRequest('banking', 'ali', 'read', 'GeneralLedger', {'transactionDateYear': 2017, 'currentYear': new Date().getFullYear(), 'accountBalance': 5000});
let access = securityManager.check(request); 
```

Which would return 'allow' as expected. Next we check if ali can delete general-ledger:
```javascript
let request = new SecurityAccessRequest('banking', 'ali', 'delete', 'GeneralLedger', {'transactionDateYear': 2017, 'currentYear': new Date().getFullYear(), 'accountBalance': 5000});
let access = securityManager.check(request); 
```


Which would return 'deny' as only account-manager can delete.

Next we check if mike, the account-manager can create general-ledger, e.g.
```javascript
let request = new SecurityAccessRequest('banking', 'mike', 'create', 'GeneralLedger', {'transactionDateYear': 2017, 'currentYear': new Date().getFullYear(), 'accountBalance': 5000});
let access = securityManager.check(request); 
```

Which would return 'allow' as expected. Now we check if mike can create posting-rules of general-ledger, e.g.
```javascript
let request = new SecurityAccessRequest('banking', 'mike', 'create', 'GeneralLedgerPostingRules', {'transactionDateYear': 2017, 'currentYear': new Date().getFullYear(), 'accountBalance': 5000});
let access = securityManager.check(request); 
```

Which would return 'deny'.

Then we check if larry, the loan officer can create posting-rules of general-ledger, e.g.
```javascript
let request = new SecurityAccessRequest('banking', 'larry', 'create', 'GeneralLedgerPostingRules', {'transactionDateYear': 2017, 'currentYear': new Date().getFullYear(), 'accountBalance': 5000});
let access = securityManager.check(request); 
```

Which would return 'allow' as expected. Now, let’s check the same claim but with different year, e.g.
```javascript
let request = new SecurityAccessRequest('banking', 'larry', 'create', 'GeneralLedgerPostingRules', {'transactionDateYear': 2015, 'accountBalance': 5000});
let access = securityManager.check(request); 
```

Which would return 'deny' because the year doesn’t match.

Next, we try to create loan account with balance higher than 10000 as branch manager because we removed constraints, e.g. 
```javascript
let request = new SecurityAccessRequest('banking', 'barry', 'create', 'GeneralLedgerPostingRules', {'transactionDateYear': 2015, 'accountBalance': 15000});

let access = securityManager.check(request); 
```
Which would return 'allow'.



## Building REST services using Resty framework:
Then you can start the REST based web service within Jetty by typing:
```javascript
node start
```

The service will listen on port 3000 and you can test it with curl.

### Realms

	* GET /realms – returns list of all realms in JSON format.
	* GET /realms/{realm-id} – returns details of given realm in JSON format.
	* PUT /realms/{realm-id} with body of realm details in JSON format.
	* DELETE /realms/{realm-id} – deletes realm identified by realm-id.

### Principals

	* GET /realms/{realm-id}/principals – returns list of all principals in realm identified by realm-id in JSON format.
	* GET /realms/{realm-id}/principals/{id} – returns details of given principal identified by id in given realm.
	* PUT /realms/{realm-id}principals/{id} with body of principal details in JSON format.
	* DELETE /realms/{realm-id}/principals//{id} – deletes principal identified by id.

### Roles

	* GET /realms/{realm-id}/roles/ – returns list of all roles in realm identified by realm-id in JSON format.
	* GET /realms/{realm-id}/roles/{{id} – returns details of given role identified by id in given realm.
	* PUT /realms/{realm-id}/roles/{id} with body of role details in JSON format.
	* DELETE /realms/{realm-id}/roles/{id} – deletes role identified by id.

### Authorization

	* GET /realms/{realm-id}/principals/{principal-id}/authorization – checks for access. It requires following parameters:
     ** action 
     ** resource 
     ** optional parameters needed for instance based security 

## REST Example

Let's start with a banking example where a bank-object can be account, general-ledger-report or ledger-posting-rules and account is further grouped into customer account or loan account, e.g.

Let's assume there are five roles: Teller, Customer-Service-Representative (CSR), Account, AccountingManager and LoanOfficer, where
 * A teller can modify customer deposit accounts.
 * A customer service representative can create or delete customer deposit accounts.
 * An accountant can create general ledger reports.
 * An accounting manager can modify ledger-posting rules.
 * A loan officer can create and modify loan accounts.

### Starting Server 
Let's start the server using 
```bash 
yarn start 
``` 

### Creating a realm

The first thing is to create a security realm for your application. As we are dealing with banking realm, let's call our realm "banking".
```javascript
curl -X POST "http://localhost:3000/realms" -d '{"realmName":"banking"}'
```
It will return response:
```javascript
{"realmName":"banking","id":1}
```

```javascript
curl "http://localhost:3000/realms"
```

which would return something like:
```javascript
[{"realmName":"banking","id":1}]
```


### Creating Roles

A role represents job title or responsibilities and each role can have one or more parents. By default, PlexRBACJS defines an "anonymous" role, which is used for users who are not logged in and all user-defined roles extend "anonymous" role.

First, we create a role for bank employee called "Employee":
```javascript
curl -X POST "http://localhost:3000/realms/1/roles" -d '{"roleName":"Employee"}'
```

which returns
```javascript
{"roleName":"Employee","claims":[],"parents":[],"id":1}
```

Next, we create "Teller" role and assign claim to read/modify DepositAccount:
```javascript
curl -X POST "http://localhost:3000/realms/1/roles" -d '{"roleName":"Teller","claims":[{"action": "(read|modify)", "resource": "DepositAccount", "condition": "employeeRegion == \"MIDWEST\"", "effect": "allow"}], "parents":[{"id": 1}]}'
```

which returns:
```javascript
{"roleName":"Teller","claims":[{"action":"(read|modify)","resource":"DepositAccount","condition":"employeeRegion == \"MIDWEST\"","effect":"allow","id":1}],"parents":[{"roleName":"Employee","claims":[],"parents":[],"id":1}],"id":2}
```
Then we create role for customer-service-representative called "CSR" that is extended by Teller e.g.
```javascript
curl -X POST "http://localhost:3000/realms/1/roles" -d '{"roleName":"Teller","claims":[{"action": "(create|delete)", "resource": "DepositAccount", "condition": "employeeRegion == \"MIDWEST\"", "effect": "allow"}], "parents":[{"id": 2}]}'

```

which returns:
```javascript
{"roleName":"Teller","claims":[{"action":"(create|delete)","resource":"DepositAccount","condition":"employeeRegion == \"MIDWEST\"","effect":"allow","id":2}],"parents":[{"roleName":"Teller","claims":[{"action":"(read|modify)","resource":"DepositAccount","condition":"employeeRegion == \"MIDWEST\"","effect":"allow","id":1}],"parents":[{"roleName":"Employee","claims":[],"parents":[],"id":1}],"id":2}],"id":2}
```
Then we create role for "CSR":
```javascript
curl -X POST "http://localhost:3000/realms/1/roles" -d '{"roleName":"CSR","claims":[{"action": "(create|delete)", "resource": "DepositAccount", "condition": "employeeRegion == \"MIDWEST\"", "effect": "allow"}], "parents":[{"id": 2}]}'
```

Then we create role for "Accountant":

```javascript
curl -X POST "http://localhost:3000/realms/1/roles" -d '{"roleName":"Accountant","claims":[{"action": "(read|create)", "resource": "GeneralLedger", "condition": "transactionDateYear == currentYear", "effect": "allow"}], "parents":[{"id": 1}]}'
```

which returns:
```javascript
{"roleName":"Accountant","claims":[{"action":"(read|create)","resource":"GeneralLedger","condition":"transactionDateYear == currentYear","effect":"allow","id":3}],"parents":[{"roleName":"Employee","claims":[],"parents":[],"id":1}],"id":3}
```

Then we create role for "AccountingManager", which is extended by "Accountant", e.g.
```javascript
curl -X POST "http://localhost:3000/realms/1/roles" -d '{"roleName":"AccountingManager","claims":[{"action": "(create|delete)", "resource": "LoanAccount", "condition": "accountBalance < 10000", "effect": "allow"},{"action": "(read|modify)", "resource": "LoanAccount", "condition": "accountBalance < 10000"}, {"action": "read", "resource": "GeneralLedgerPostingRules", "condition": "transactionDateYear == currentYear"}], "parents":[{"roleName": "Accountant"}]}'

```

which returns:
```javascript
{"roleName":"AccountingManager","claims":[{"action":"(create|delete)","resource":"LoanAccount","condition":"accountBalance < 10000","effect":"allow","id":4},{"action":"(read|modify)","resource":"LoanAccount","condition":"accountBalance < 10000","effect":"allow","id":5},{"action":"read","resource":"GeneralLedgerPostingRules", "condition":"transactionDateYear == currentYear","effect":"allow","id":6}],"parents":[{"roleName":"Accountant","claims":[],"parents":[],"id":3}],"id":4}
```

Finally, we create role for "LoanOfficer", e.g.
```javascript
curl -X POST "http://localhost:3000/realms/1/roles" -d '{"roleName":"LoanOfficer","claims":[{"action":"(create|modify|delete)","resource":"GeneralLedgerPostingRules","condition":"transactionDateYear == currentYear"}],"parents":[{"roleName":"AccountingManager"}]}'
```

which returns:
```javascript
{"roleName":"LoanOfficer","claims":[{"action":"(create|modify|delete)","resource":"GeneralLedgerPostingRules","condition":"transactionDateYear == currentYear","effect":"allow","id":7}],"parents":[],"id":5}
```


### Creating Users

Next step is to create users for our application and assign roles. Let's define an accounts for tom the teller:
```javascript
curl -X POST "http://localhost:3000/realms/1/principals" -d '{"principalName":"tom","roles":[{"roleName":"Teller"}]}'
```
which returns
```javascript
{"principalName":"tom","claims":[],"roles":[{"roleName":"Teller","claims":[],"parents":[],"id":2}],"id":1}
```
Then create an account for cassy the CSR:
```javascript
curl -X POST "http://localhost:3000/realms/1/principals" -d '{"principalName":"cassy","roles":[{"roleName":"CSR"}]}'
```
which returns
```javascript
{"principalName":"cassy","claims":[],"roles":[{"roleName":"CSR","claims":[],"parents":[],"id":7}],"id":2}
```
Then we create an account for ali the accountant:
```javascript
curl -X POST "http://localhost:3000/realms/1/principals" -d '{"principalName":"ali","roles":[{"roleName":"Accountant"}]}'
```
which returns
```javascript
{"principalName":"ali","claims":[],"roles":[{"roleName":"Accountant","claims":[],"parents":[],"id":3}],"id":3}
```
Then we create an account for mike the account-manager:
```javascript
curl -X POST "http://localhost:3000/realms/1/principals" -d '{"principalName":"mike","roles":[{"roleName":"AccountingManager"}]}'
```
which returns
```javascript
{"principalName":"mike","claims":[],"roles":[{"roleName":"AccountingManager","claims":[],"parents":[],"id":4}],"id":4}
```

Next, we create an account for larry the loan officer:
```javascript
curl -X POST "http://localhost:3000/realms/1/principals" -d '{"principalName":"larry","roles":[{"roleName":"LoanOfficer"}]}'
```
which returns
```javascript
{"principalName":"larry","claims":[],"roles":[{"roleName":"LoanOfficer","claims":[],"parents":[],"id":5}],"id":5}
```

Finally, we create an account for barry the branch manager:
```javascript
```javascript
curl -X POST "http://localhost:3000/realms/1/principals" -d '{"principalName":"barry","roles":[{"roleName":"LoanOfficer"}, {"roleName":"AccountManager"}]}'
```
which returns
```javascript
{"principalName":"barry","claims":[],"roles":[{"roleName":"LoanOfficer","claims":[],"parents":[],"id":5},{"roleName":"AccountingManager","id":4}],"id":6}
```

### Authorization

Now we are ready to validate authorization based on above security policies. For example, let's first review all principals added:

```javascript
curl "http://localhost:3000/realms/1/principals"
```

```javascript
[{"principalName":"ali","claims":[],"roles":[],"id":3},{"principalName":"cassy","claims":[],"roles":[],"id":2},{"principalName":"larry","claims":[],"roles":[],"id":5},{"principalName":"mike","claims":[],"roles":[],"id":4},{"principalName":"tom","claims":[],"roles":[{"roleName":"Teller","claims":[],"parents":[],"id":2}],"id":1}]
```


Now check if user "tom" can view deposit-accounts, e.g.
```javascript
curl  "http://localhost:3000/realms/1/principals/1/authorization?action=read&resource=DepositAccount&employeeRegion=WEST"
```
Note that we are passing principal-id 1 above and it would return 403 http response code because employee region didn't match MIDWEST
```javascript
{"code":"NotAuthorized","message":"Access to perform read on DepositAccount is denied."}
```
And by running it again with correct region, it would allow it:
```javascript
curl  "http://localhost:3000/realms/1/principals/1/authorization?action=read&resource=DepositAccount&employeeRegion=MIDWEST"
```
```javascript
< HTTP/1.1 200 OK
```


Then we check if tom, the teller can delete deposit-account, e.g.
```javascript
curl  "http://localhost:3000/realms/1/principals/1/authorization?action=delete&resource=DepositAccount&employeeRegion=MIDWEST"
```

which returns http-response-code 401, e.g.
```javascript
{"code":"NotAuthorized","message":"Access to perform delete on DepositAccount is denied."}
```

Then we create if cassy, the CSR can delete deposit-account, e.g.
```javascript
curl  "http://localhost:3000/realms/1/principals/2/authorization?action=delete&resource=DepositAccount&employeeRegion=MIDWEST"
```

which returns:
```javascript
< HTTP/1.1 200 OK
```

Then we check if ali, the accountant can view general-ledger, e.g.
```javascript
curl  "http://localhost:3000/realms/1/principals/3/authorization?action=read&resource=GeneralLedger&transactionDateYear=2017&currentYear=2017"

```

which returns:
```javascript
< HTTP/1.1 200 OK
```

Next we check if mike, the accounting-manager can create general-ledger, e.g.
```javascript
curl  "http://localhost:3000/realms/1/principals/4/authorization?action=create&resource=GeneralLedger&transactionDateYear=2017&currentYear=2017"

```

which returns:
```javascript
< HTTP/1.1 200 OK
```

Then we check if larry, the loan officer can create posting-rules of general-ledger, e.g.
```javascript
curl  "http://localhost:3000/realms/1/principals/5/authorization?action=create&resource=GeneralLedgerPostingRules&transactionDateYear=2017&currentYear=2017"

```

which returns:
```javascript
< HTTP/1.1 200 OK
```


Next, ali tries to create posting rules via
```javascript
curl  "http://localhost:3000/realms/1/principals/3/authorization?action=create&resource=GeneralLedgerPostingRules&transactionDateYear=2017&currentYear=2017"

```

which is denied:
```javascript
< HTTP/1.1 403 Unauthorized

```

## Contact
Please send questions or suggestions to bhatti AT plexobject.com.



## References
 * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.86.9736&rep=rep1&type=pdf
 * http://csrc.nist.gov/groups/SNS/rbac/documents/design_implementation/Intro_role_based_access.htm
 * http://hissa.nist.gov/rbac/poole/ir5820/ir5820s31.htm
 * http://www.coresecuritypatterns.com/patterns.htm
 * http://cwiki.apache.org/confluence/display/SHIRO/Index
 * http://www.secs.oakland.edu/~kim2/papers/FASE04.pdf 


