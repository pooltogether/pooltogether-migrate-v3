# PoolTogether Migrate V3 Contract

Helps users migrate from PoolTogether V2 to PoolTogether v3

## Setup

First clone the repository then run:

```bash
$ yarn
```

Copy over .envrc.example to .envrc

```
$ cp .envrc.example .envrc
```

Make sure to update the enviroment variables with suitable values.  You'll want to administer any pools you create, so be sure to use a mnemonic that you used to create a prize pool.

Now enable the env vars using [direnv](https://direnv.net/docs/installation.html)

```
$ direnv allow
```
