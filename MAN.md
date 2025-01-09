# All commands' purposes, syntax e.t.c 2.0

There are two types of commands: common and admin. Common commands can be executed by anybody, while admin commands can
be executed only by players in the admin list.

## Common commands

### _man_ || _manual_ || _help_

Syntax : `#man`

Sends the hard-coded link to the user manual hosted on GitHub.

### _register_

Syntax: `#register`

Registers a player who executes it.

### _balance_

Syntax: `#balance <username>`  
If a username is not passed, it will return executor's balance.

Simply prints your or somebody's bank balance.

### _pay_

Syntax: `#pay <username> <amount>`  
**amount >= 1**

Subtracts _X_ money from executor's balance and adds _X_ to another player's balance.  
Tbh it's pretty self-explanatory.

### _getjob_

Syntax: `#getjob <username>`  
If username wasn't passed, it will return executor's job.

Prints passed player's or executor's job.

## Admin commands

### _addmoney_

Syntax: `#addmoney <username> <amount>`

Adds passed amount of money to passed player's balance.

### _rmmoney_ || _removemoney_

Syntax: `#rmmoney <username> <amount>`

Subtracts passed amount of money from passed player's balance.

### _newjob_

Syntax: `#newjob <job_name> <wage>`

Creates a new job with passed name and wage.

### _setjob_

Syntax: `#setjob <username> <job_name>`

Sets passed player's job to the given job.

### _resetjob_

Syntax: `#resetjob <username>`

Resets passed player's job. (simply sets it to null)

### _payall_

Syntax: `#payall`

Pays wage to all players who have a job.

### _paywage_

Syntax: `#paywage <username 1> ... <username n>`

Pays wage to passed player split with a space.

