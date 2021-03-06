# FLOW Implmentation:

## Requirements:
- Javascript ES6
- Flow
- Node

## Version
- 0.1

## License
- MIT

## Code:
- Checkout code from
```bash
git clone git@github.com:bhatti/PlexRBACJS.github
``` 

## Building
- Building 

```bash 
cd flow
./yarn build
```

- Running REST API
```bash
./yarn start
```

- Command line
```bash
./yarn cli
```

## Simple Example
<img src="https://raw.githubusercontent.com/bhatti/PlexRBACJS/master/images/rbacjs_bank.png">

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



## Command line interface 
PlexRBACJs comes with command line interface, e.g.
```javascript
yarn build 
``` 

### Adding a realm:
```javascript
node lib/cli/rbac_cli.js --method addRealm --realmName=nowsecure --dbPath /tmp/test.db 
``` 

### Showing realms:
```javascript
node lib/cli/rbac_cli.js --method showRealms --dbPath /tmp/test.db 
``` 

### Adding role:
```javascript
node lib/cli/rbac_cli.js --method addRole --roleName god --claimId 1 --claimId 2 --roleId 1 --roleId 2 --realmId 1 --dbPath /tmp/test.db 
``` 

### Showing roles:
```javascript
node lib/cli/rbac_cli.js --method showRoles --realmId 1 --dbPath /tmp/test.db
``` 

### Adding claim:
```javascript
node lib/cli/rbac_cli.js --method addClaim --action buy --resource car --realmId 1 --dbPath /tmp/test.db
``` 

### Showing claims:
```javascript
node lib/cli/rbac_cli.js --method showClaims --realmId 1 --dbPath /tmp/test.db
``` 

### Adding principal:
```javascript
node lib/cli/rbac_cli.js --method addPrincipal --principalName david --claimId 1 --claimId 2 --roleId 1 --roleId 2 --realmId 1 --dbPath /tmp/test.db
``` 

### Showing principals:
```javascript
node lib/cli/rbac_cli.js --method showPrincipals --realmId 1 --dbPath /tmp/test.db

```


## Building REST services using Resty framework:
Then you can start the REST based web service within Jetty by typing:
```javascript
yarn build
node start
```

The service will listen on port 9355 and you can test it with curl.

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
curl -X POST "http://localhost:9355/realms" -d '{"realmName":"banking"}'
```
It will return response:
```javascript
{"realmName":"banking","id":1}
```

```javascript
curl "http://localhost:9355/realms"
```

which would return something like:
```javascript
[{"realmName":"banking","id":1}]
```


### Creating Roles

A role represents job title or responsibilities and each role can have one or more parents. By default, PlexRBACJS defines an "anonymous" role, which is used for users who are not logged in and all user-defined roles extend "anonymous" role.

First, we create a role for bank employee called "Employee":
```javascript
curl -X POST "http://localhost:9355/realms/1/roles" -d '{"roleName":"Employee"}'
```

which returns
```javascript
{"roleName":"Employee","claims":[],"parents":[],"id":1}
```

Next, we create "Teller" role and assign claim to read/modify DepositAccount:
```javascript
curl -X POST "http://localhost:9355/realms/1/roles" -d '{"roleName":"Teller","claims":[{"action": "(read|modify)", "resource": "DepositAccount", "condition": "employeeRegion == \"MIDWEST\"", "effect": "allow"}], "parents":[{"id": 1}]}'
```

which returns:
```javascript
{"roleName":"Teller","claims":[{"action":"(read|modify)","resource":"DepositAccount","condition":"employeeRegion == \"MIDWEST\"","effect":"allow","id":1}],"parents":[{"roleName":"Employee","claims":[],"parents":[],"id":1}],"id":2}
```
Then we create role for customer-service-representative called "CSR" that is extended by Teller e.g.
```javascript
curl -X POST "http://localhost:9355/realms/1/roles" -d '{"roleName":"Teller","claims":[{"action": "(create|delete)", "resource": "DepositAccount", "condition": "employeeRegion == \"MIDWEST\"", "effect": "allow"}], "parents":[{"id": 2}]}'

```

which returns:
```javascript
{"roleName":"Teller","claims":[{"action":"(create|delete)","resource":"DepositAccount","condition":"employeeRegion == \"MIDWEST\"","effect":"allow","id":2}],"parents":[{"roleName":"Teller","claims":[{"action":"(read|modify)","resource":"DepositAccount","condition":"employeeRegion == \"MIDWEST\"","effect":"allow","id":1}],"parents":[{"roleName":"Employee","claims":[],"parents":[],"id":1}],"id":2}],"id":2}
```
Then we create role for "CSR":
```javascript
curl -X POST "http://localhost:9355/realms/1/roles" -d '{"roleName":"CSR","claims":[{"action": "(create|delete)", "resource": "DepositAccount", "condition": "employeeRegion == \"MIDWEST\"", "effect": "allow"}], "parents":[{"id": 2}]}'
```

Then we create role for "Accountant":

```javascript
curl -X POST "http://localhost:9355/realms/1/roles" -d '{"roleName":"Accountant","claims":[{"action": "(read|create)", "resource": "GeneralLedger", "condition": "transactionDateYear == currentYear", "effect": "allow"}], "parents":[{"id": 1}]}'
```

which returns:
```javascript
{"roleName":"Accountant","claims":[{"action":"(read|create)","resource":"GeneralLedger","condition":"transactionDateYear == currentYear","effect":"allow","id":3}],"parents":[{"roleName":"Employee","claims":[],"parents":[],"id":1}],"id":3}
```

Then we create role for "AccountingManager", which is extended by "Accountant", e.g.
```javascript
curl -X POST "http://localhost:9355/realms/1/roles" -d '{"roleName":"AccountingManager","claims":[{"action": "(create|delete)", "resource": "LoanAccount", "condition": "accountBalance < 10000", "effect": "allow"},{"action": "(read|modify)", "resource": "LoanAccount", "condition": "accountBalance < 10000"}, {"action": "read", "resource": "GeneralLedgerPostingRules", "condition": "transactionDateYear == currentYear"}], "parents":[{"roleName": "Accountant"}]}'

```

which returns:
```javascript
{"roleName":"AccountingManager","claims":[{"action":"(create|delete)","resource":"LoanAccount","condition":"accountBalance < 10000","effect":"allow","id":4},{"action":"(read|modify)","resource":"LoanAccount","condition":"accountBalance < 10000","effect":"allow","id":5},{"action":"read","resource":"GeneralLedgerPostingRules", "condition":"transactionDateYear == currentYear","effect":"allow","id":6}],"parents":[{"roleName":"Accountant","claims":[],"parents":[],"id":3}],"id":4}
```

Finally, we create role for "LoanOfficer", e.g.
```javascript
curl -X POST "http://localhost:9355/realms/1/roles" -d '{"roleName":"LoanOfficer","claims":[{"action":"(create|modify|delete)","resource":"GeneralLedgerPostingRules","condition":"transactionDateYear == currentYear"}],"parents":[{"roleName":"AccountingManager"}]}'
```

which returns:
```javascript
{"roleName":"LoanOfficer","claims":[{"action":"(create|modify|delete)","resource":"GeneralLedgerPostingRules","condition":"transactionDateYear == currentYear","effect":"allow","id":7}],"parents":[],"id":5}
```


### Creating Users

Next step is to create users for our application and assign roles. Let's define an accounts for tom the teller:
```javascript
curl -X POST "http://localhost:9355/realms/1/principals" -d '{"principalName":"tom","roles":[{"roleName":"Teller"}]}'
```
which returns
```javascript
{"principalName":"tom","claims":[],"roles":[{"roleName":"Teller","claims":[],"parents":[],"id":2}],"id":1}
```
Then create an account for cassy the CSR:
```javascript
curl -X POST "http://localhost:9355/realms/1/principals" -d '{"principalName":"cassy","roles":[{"roleName":"CSR"}]}'
```
which returns
```javascript
{"principalName":"cassy","claims":[],"roles":[{"roleName":"CSR","claims":[],"parents":[],"id":7}],"id":2}
```
Then we create an account for ali the accountant:
```javascript
curl -X POST "http://localhost:9355/realms/1/principals" -d '{"principalName":"ali","roles":[{"roleName":"Accountant"}]}'
```
which returns
```javascript
{"principalName":"ali","claims":[],"roles":[{"roleName":"Accountant","claims":[],"parents":[],"id":3}],"id":3}
```
Then we create an account for mike the account-manager:
```javascript
curl -X POST "http://localhost:9355/realms/1/principals" -d '{"principalName":"mike","roles":[{"roleName":"AccountingManager"}]}'
```
which returns
```javascript
{"principalName":"mike","claims":[],"roles":[{"roleName":"AccountingManager","claims":[],"parents":[],"id":4}],"id":4}
```

Next, we create an account for larry the loan officer:
```javascript
curl -X POST "http://localhost:9355/realms/1/principals" -d '{"principalName":"larry","roles":[{"roleName":"LoanOfficer"}]}'
```
which returns
```javascript
{"principalName":"larry","claims":[],"roles":[{"roleName":"LoanOfficer","claims":[],"parents":[],"id":5}],"id":5}
```

Finally, we create an account for barry the branch manager:
```javascript
```javascript
curl -X POST "http://localhost:9355/realms/1/principals" -d '{"principalName":"barry","roles":[{"roleName":"LoanOfficer"}, {"roleName":"AccountManager"}]}'
```
which returns
```javascript
{"principalName":"barry","claims":[],"roles":[{"roleName":"LoanOfficer","claims":[],"parents":[],"id":5},{"roleName":"AccountingManager","id":4}],"id":6}
```

### Authorization

Now we are ready to validate authorization based on above security policies. For example, let's first review all principals added:

```javascript
curl "http://localhost:9355/realms/1/principals"
```

```javascript
[{"principalName":"ali","claims":[],"roles":[],"id":3},{"principalName":"cassy","claims":[],"roles":[],"id":2},{"principalName":"larry","claims":[],"roles":[],"id":5},{"principalName":"mike","claims":[],"roles":[],"id":4},{"principalName":"tom","claims":[],"roles":[{"roleName":"Teller","claims":[],"parents":[],"id":2}],"id":1}]
```


Now check if user "tom" can view deposit-accounts, e.g.
```javascript
curl  "http://localhost:9355/realms/1/principals/1/authorization?action=read&resource=DepositAccount&employeeRegion=WEST"
```
Note that we are passing principal-id 1 above and it would return 401 http response code because employee region didn't match MIDWEST
```javascript
{"code":"UnauthorizedError","message":"Access to perform read on DepositAccount is denied."}
```
And by running it again with correct region, it would allow it:
```javascript
curl  "http://localhost:9355/realms/1/principals/1/authorization?action=read&resource=DepositAccount&employeeRegion=MIDWEST"
```
```javascript
< HTTP/1.1 200 OK
```


Then we check if tom, the teller can delete deposit-account, e.g.
```javascript
curl  "http://localhost:9355/realms/1/principals/1/authorization?action=delete&resource=DepositAccount&employeeRegion=MIDWEST"
```

which returns http-response-code 401, e.g.
```javascript
{"code":"UnauthorizedError","message":"Access to perform delete on DepositAccount is denied."}
```

Then we create if cassy, the CSR can delete deposit-account, e.g.
```javascript
curl  "http://localhost:9355/realms/1/principals/2/authorization?action=delete&resource=DepositAccount&employeeRegion=MIDWEST"
```

which returns:
```javascript
< HTTP/1.1 200 OK
```

Then we check if ali, the accountant can view general-ledger, e.g.
```javascript
curl  "http://localhost:9355/realms/1/principals/3/authorization?action=read&resource=GeneralLedger&transactionDateYear=2017&currentYear=2017"

```

which returns:
```javascript
< HTTP/1.1 200 OK
```

Next we check if mike, the accounting-manager can create general-ledger, e.g.
```javascript
curl  "http://localhost:9355/realms/1/principals/4/authorization?action=create&resource=GeneralLedger&transactionDateYear=2017&currentYear=2017"

```

which returns:
```javascript
< HTTP/1.1 200 OK
```

Then we check if larry, the loan officer can create posting-rules of general-ledger, e.g.
```javascript
curl  "http://localhost:9355/realms/1/principals/5/authorization?action=create&resource=GeneralLedgerPostingRules&transactionDateYear=2017&currentYear=2017"

```

which returns:
```javascript
< HTTP/1.1 200 OK
```


Next, ali tries to create posting rules via
```javascript
curl  "http://localhost:9355/realms/1/principals/3/authorization?action=create&resource=GeneralLedgerPostingRules&transactionDateYear=2017&currentYear=2017"

```

which is denied:
```javascript
< HTTP/1.1 401 Unauthorized

```
## Protecting your APIs:
PlexRBACJS authorization code can be embedded with your APIs to authorize access. For example, you can create a login API to authenticate user and store realm-id and principal-id in session or cookie, e.g.,

```javascript
global.server.post('/login', (req, res, next) => {
    res.setCookie('principalId', req.params.principalId);
    res.setCookie('realmId', req.params.realmId);
    res.send({'authenticated':true});
    next();
});
```

You can then create a filter to protect your APIs, e.g.:
```javascript
global.server.use(async (req, res, next) => {                                                                                                        
    if (req.path() == '/login') {
        return next();
    } else {
        let resource    = req.path();
        try {
            cookieParser.parse(req, res, next);
            let realmId     = req.cookies['realmId'];
            let principalId = req.cookies['principalId'];
            let realm       = await global.server.repositoryLocator.realmRepository.findById(realmId);
            let principal   = await global.server.repositoryLocator.principalRepository.findById(principalId);
            let request    = new SecurityAccessRequest(realm.realmName, principal.principalName, req.method, resource, req.params);
            let result = await global.server.securityManager.check(request);
            if (result != Claim.allow) {
                return next(new errors.UnauthorizedError(`Access to perform ${req.method} ${resource}.`));
            } else {
                return next();
            }
        } catch (err) {
            return next(new errors.UnauthorizedError(`Failed to authorize ${resource}.`));
        }   
    }   
});
```
You can then add claims for specific roles or principals, e.g.
```bash
node lib/cli/rbac_cli.js --method addClaim --action GET --resource /test --realmId 1 --dbPath /tmp/test.db
```
Added claim (11, GET, /test)
```bash
node lib/cli/rbac_cli.js --method addClaim --action POST --resource /test --realmId 1 --dbPath /tmp/test.db
```
Added claim (12, POST, /test)
```bash
node lib/cli/rbac_cli.js --method addClaim --action PUT --resource /test --realmId 1 --dbPath /tmp/test.db
```
Added claim (13, PUT, /test)
```bash
node lib/cli/rbac_cli.js --method addClaim --action DELETE --resource /test --realmId 1 --dbPath /tmp/test.db
```
Added claim (14, DELETE, /test)

```bash
node lib/cli/rbac_cli.js --method addPrincipal --principalName david --claimId 11 --claimId 12 --claimId 13 --claimId 14 --realmId 1 --dbPath /tmp/test.db
```

Added principal (7, david, (11, GET, /test),(12, POST, /test),(13, PUT, /test),(14, DELETE, /test))

Then test login as follows:
```bash
curl -X POST -c cookies.txt 'http://localhost:9932/login?principalId=7&realmId=1'
```
It will store principalId and realmId in cookie session, you can then try to access your API as follows:
```bash
curl -b cookies.txt http://localhost:9932/test
[{"item":1},{"item":2},{"item":3}]
```

```bash
curl -X POST -b cookies.txt http://localhost:9932/test
{"created":true}
```

But it would fail with unauthorized user, e.g.
```bash
curl -X POST -c cookies.txt 'http://localhost:9932/login?principalId=27&realmId=1'
```
So when you try to access the API, it would fail:
```bash
curl -b cookies.txt http://localhost:9932/test
{"code":"UnauthorizedError","message":"Failed to authorize /test."}
```
See sample code under src/sample for more details.
